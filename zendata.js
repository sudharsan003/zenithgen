/* zendata.js
 * Single Source of Truth for ALL ZenithGen pages (no backend version)
 * Pages covered (placeholders created): 
 *  - zenroast, diary, habits, goals, vault, zendeck, zencalendar, zenlytics, zenarena, dashboard
 * Features:
 *  - Versioned schema + migrations
 *  - Atomic update() helpers (no accidental overwrite)
 *  - Pub/Sub for page-level change events
 *  - Export / Import / Backup / Restore
 *  - Safe path-based getters/setters
 */

(function (global) {
    'use strict';
  
    /** @type {number} Increase when schema changes */
    const VERSION = 1;
    const STORAGE_KEY = 'zenithgen:data';
    const STORAGE_BACKUP_KEY = 'zenithgen:data:backup';
    const LAST_SAVE_KEY = 'zenithgen:lastSave';
  
    /**
     * ---- DEFAULT SCHEMA ----
     * Make sure every page has its own bucket.
     * Only put *data*, not rendering state.
     */
    const defaultData = () => ({
      __meta: {
        version: VERSION,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
  
      // ZenRoast page - Focus tracking and distraction logging
      zenroast: {
        distractions: 0,                    // Total distractions count
        awayTimes: [],                      // Array of away time durations in seconds
        tabSwitches: 0,                     // Total tab switch count
        focusStreak: 0,                     // Current focus streak in days
        entries: [],                        // Distraction log entries [{id, text, time}]
        session: {
          start: null,                      // Session start timestamp (ISO string)
          totalAwayTime: 0                  // Total away time in seconds
        },
        lastStreakDate: null,               // Last date streak was updated
        yesterdayDistractions: 0            // Distractions from previous day for streak calculation
      },
  
      // Diary page
      diary: {
        entries: [],          // [{id, text, mood, date, wordCount}]
        writingStreak: 0,
        lastEntryDate: null,
        draft: ''
      },
  
      // Habit Tracker page
      habits: {
        trackers: [],         // [{id,name,streak,longestStreak,lastCheck,createdAt,totalCheckins,category}]
      },
  
      // Goals (Weekly / Monthly, etc.)
      goals: {
        weekly: [],           // [{id, text, done}]
        monthly: []           // [{id, text, done}]
      },
  
      // Vault (if you have it later)
      vault: {
        items: []             // anything you want to put there
      },
  
      // ZenDeck (slides, notes, etc.)
      zendeck: {
        decks: []             // ...
      },
  
      // ZenCalendar page
      zencalendar: {
        data: {},             // { 'YYYY-MM-DD': {tasks: [], mood: '', notes: '', completedTasks: 0} }
        timelineSlots: {},    // { 'YYYY-MM-DD': [{time, label}] }
        streak: 0,
        streakPrev: 0,        // Previous streak for animation
        weeklyGoals: [],      // [string]
        quoteIndex: 0,        // Current quote index
        selectedDate: null,   // Currently selected date
        taskBoard: []         // Default tasks for drag & drop
      },
  
      // ZenArena page
      zenarena: {
        distractions: [],     // [{id, description, type, duration, trigger, mood, intensity, timestamp, date}]
        achievements: [],     // ['first_log', ...]
        focusStreak: 0,
        dailyChallenge: null
      },
  
      // ZenLytics page
      zenlytics: {
        // Pre-aggregate or let zenlytics.js transform `getAll()` into charts
        stats: {},
        productivityHeatmap: [], // your 7x24 matrix if you want to persist
        streakLeaderboard: []    // [{name, streak, icon}]
      },
  
      // Dashboard
      dashboard: {
        lastSeen: null
      }
    });
  
    /** ---------------------------
     *  Small utilities
     *  ---------------------------
     */
  
    // Safe JSON parsing function
    function safeJSONParse(data) {
      if (typeof data !== "string") return null;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Invalid JSON:", e);
        return null;
      }
    }

    const clone = (obj) => {
      if (obj === null || obj === undefined) return null;
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        console.error("Clone failed:", e);
        return null;
      }
    };
  
    function deepMerge(target, source) {
      if (typeof target !== 'object' || target === null) return clone(source);
      const out = Array.isArray(target) ? target.slice() : { ...target };
      Object.keys(source).forEach((key) => {
        if (Array.isArray(source[key])) {
          out[key] = source[key].slice();
        } else if (typeof source[key] === 'object' && source[key] !== null) {
          out[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          out[key] = source[key];
        }
      });
      return out;
    }
  
    // simple path get/set (path like "diary.writingStreak")
    function getByPath(obj, path) {
      if (!path) return obj;
      return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
    }
    function setByPath(obj, path, value) {
      const parts = path.split('.');
      const last = parts.pop();
      const parent = parts.reduce((o, p) => {
        if (!o[p]) o[p] = {};
        return o[p];
      }, obj);
      parent[last] = value;
    }

    /** ---------------------------
     *  Convenience helpers for common operations
     *  ---------------------------
     */

    /**
     * Increment a numeric value by path
     * @param {string} path - e.g., "zenroast.distractions"
     * @param {number} amount - amount to increment (default: 1)
     */
    function increment(path, amount = 1) {
      const current = get(path) || 0;
      set(path, current + amount);
    }

    /**
     * Log a distraction entry to zenroast
     * @param {string} text - distraction description
     * @param {object} metadata - optional metadata
     */
    function logDistraction(text, metadata = {}) {
      const entry = {
        id: Date.now(),
        text,
        time: new Date().toLocaleString(),
        ...metadata
      };
      push('zenroast', 'entries', entry);
      increment('zenroast.distractions');
      increment('zenroast.tabSwitches');
    }

    /**
     * Start a new focus session
     */
    function startFocusSession() {
      set('zenroast.session.start', new Date().toISOString());
      set('zenroast.session.totalAwayTime', 0);
      set('zenroast.awayTimes', []);
    }

    /**
     * Record an away time and update session stats
     * @param {number} awayTimeSeconds - time away in seconds
     */
    function recordAwayTime(awayTimeSeconds) {
      update('zenroast', (data) => {
        data.session.totalAwayTime += awayTimeSeconds;
        data.awayTimes.push(awayTimeSeconds);
        data.distractions++;
        data.tabSwitches++;
      });
    }

    /**
     * Update focus streak for a new day
     * @param {boolean} hadDistractions - whether user had distractions yesterday
     */
    function updateFocusStreak(hadDistractions = false) {
      const today = new Date().toDateString();
      const lastStreakDate = get('zenroast.lastStreakDate');
      
      if (lastStreakDate !== today) {
        update('zenroast', (data) => {
          if (hadDistractions) {
            data.focusStreak = 0;
          } else {
            data.focusStreak++;
          }
          data.lastStreakDate = today;
        });
      }
    }
  
    /** ---------------------------
     *  In-memory store + migrations
     *  ---------------------------
     */
  
    let _data = null;
    let _dirty = false;
  
    function readRaw() {
      try {
        const text = localStorage.getItem(STORAGE_KEY);
        return text ? safeJSONParse(text) : null;
      } catch (e) {
        console.warn('[zendata] Failed to read storage, using defaults', e);
        return null;
      }
    }
  
    function writeRaw(obj) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        localStorage.setItem(LAST_SAVE_KEY, new Date().toISOString());
      } catch (e) {
        console.error('[zendata] Failed to write storage', e);
      }
    }
  
    function backupRaw() {
      try {
        localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(_data));
      } catch (e) {
        console.error('[zendata] Failed to backup storage', e);
      }
    }
  
    // If you ever change schema -> add migrations by version
    const migrations = {
      // 1: (d) => d  // (example placeholder)
    };
  
    function migrateIfNeeded(obj) {
      const current = obj.__meta?.version ?? 0;
      if (current === VERSION) return obj;
  
      let migrated = clone(obj);
      // apply stepwise migrations
      for (let v = current + 1; v <= VERSION; v++) {
        const mig = migrations[v];
        if (typeof mig === 'function') {
          migrated = mig(migrated);
        }
      }
      migrated.__meta.version = VERSION;
      return migrated;
    }
  
    function init() {
      const raw = readRaw();
      if (!raw) {
        _data = defaultData();
        writeRaw(_data);
      } else {
        _data = migrateIfNeeded(deepMerge(defaultData(), raw));
      }
      _data.__meta.updatedAt = new Date().toISOString();
      _dirty = false;
    }
  
    /** ---------------------------
     *  SAVE (debounced / explicit)
     *  ---------------------------
     */
  
    let saveTimer = null;
    function scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        save();
      }, 150);
    }
  
    function save() {
      if (!_data) return;
      _data.__meta.updatedAt = new Date().toISOString();
      backupRaw();
      writeRaw(_data);
      _dirty = false;
      publish('change:all', clone(_data));
    }
  
    /** ---------------------------
     *  PUBLIC API
     *  ---------------------------
     */
  
    /**
     * Get whole data (read-only copy)
     */
    function getAll() {
      return clone(_data);
    }
  
    /**
     * Get a page bucket, e.g. getPage('diary')
     */
    function getPage(page) {
      const result = _data?.[page] || null;
      return result !== null ? clone(result) : null;
    }
  
    /**
     * Get by path, e.g. get('diary.writingStreak')
     */
    function get(path) {
      const result = getByPath(_data, path);
      return result !== undefined ? clone(result) : null;
    }
  
    /**
     * Replace page bucket (atomic)
     */
    function setPage(page, newPageData) {
      if (!_data[page]) _data[page] = {};
      _data[page] = clone(newPageData);
      _dirty = true;
      scheduleSave();
      publish(`change:${page}`, clone(_data[page]));
    }
  
    /**
     * Set by path, e.g. set('diary.writingStreak', 5)
     */
    function set(path, value) {
      setByPath(_data, path, clone(value));
      _dirty = true;
      scheduleSave();
      const page = path.split('.')[0];
      publish(`change:${page}`, clone(_data[page]));
    }
  
    /**
     * Update a page atomically (fn receives live mutable object)
     */
    function update(page, fn) {
      if (!_data[page]) _data[page] = {};
      fn(_data[page]); // mutate allowed
      _dirty = true;
      scheduleSave();
      publish(`change:${page}`, clone(_data[page]));
    }
  
    /**
     * Shallow push helper for arrays inside page
     * e.g. push('diary', 'entries', entryObj)
     */
    function push(page, field, item) {
      update(page, (p) => {
        if (!Array.isArray(p[field])) p[field] = [];
        p[field].unshift(clone(item));
      });
    }
  
    /**
     * Remove helper: remove('diary', 'entries', (e) => e.id === id)
     */
    function remove(page, field, predicate) {
      update(page, (p) => {
        if (!Array.isArray(p[field])) return;
        p[field] = p[field].filter((x) => !predicate(x));
      });
    }
  
    /**
     * Export the whole store as string
     */
    function exportData() {
      return JSON.stringify(_data, null, 2);
    }
  
    /**
     * Import (merge or replace) data
     * @param {string|object} payload
     * @param {'merge'|'replace'} mode
     */
        function importData(payload, mode = 'merge') {
      let incoming = typeof payload === 'string' ? safeJSONParse(payload) : payload;
      if (!incoming || typeof incoming !== 'object') {
        throw new Error('Invalid import payload');
      }
      incoming = migrateIfNeeded(incoming);

      if (mode === 'replace') {
        _data = incoming;
      } else {
        _data = deepMerge(_data, incoming);
      }

      _data.__meta.updatedAt = new Date().toISOString();
      scheduleSave();
      publish('change:all', clone(_data));
    }
  
    /**
     * Reset to default (danger!)
     */
    function reset() {
      _data = defaultData();
      scheduleSave();
      publish('change:all', clone(_data));
    }
  
    /**
     * Restore from last backup (if exists)
     */
    function restoreBackup() {
      const raw = localStorage.getItem(STORAGE_BACKUP_KEY);
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw);
        _data = parsed;
        scheduleSave();
        publish('change:all', clone(_data));
        return true;
      } catch (e) {
        console.error('[zendata] failed to restore backup', e);
        return false;
      }
    }
  
    /** ---------------------------
     *  PUB / SUB (very small bus)
     *  ---------------------------
     */
  
    const listeners = new Map();
    function subscribe(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => unsubscribe(event, handler);
    }
    function unsubscribe(event, handler) {
      if (!listeners.has(event)) return;
      listeners.get(event).delete(handler);
    }
    function publish(event, payload) {
      if (!listeners.has(event)) return;
      listeners.get(event).forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('[zendata] subscriber error', e);
        }
      });
    }
  
    /** ---------------------------
     *  BOOT
     *  ---------------------------
     */
  
    init();
  
    /** ---------------------------
     *  EXPOSE
     *  ---------------------------
     */
        const api = {
      // core
      getAll,
      getPage,
      get,
      setPage,
      set,
      update,
      push,
      remove,
      save,

      // convenience helpers
      increment,
      logDistraction,
      startFocusSession,
      recordAwayTime,
      updateFocusStreak,

      // life-cycle
      reset,
      export: exportData,
      import: importData,
      restoreBackup,

      // pub/sub
      subscribe,
      unsubscribe,

      // meta
      version: VERSION,
      STORAGE_KEY,
      LAST_SAVE_KEY
    };
  
    // global export
    global.zendata = api;

    // Test function for development (remove in production)
    global.testZenroastRoundTrip = () => {
      console.log('🧪 Testing ZenRoast round-trip...');
      
      // Test 1: Basic get/set
      zendata.set('zenroast.distractions', 5);
      const distractions = zendata.get('zenroast.distractions');
      console.log('✅ Distractions test:', distractions === 5 ? 'PASS' : 'FAIL', distractions);
      
      // Test 2: Array operations
      const testEntry = { id: 123, text: 'Test distraction', time: '2024-01-01' };
      zendata.push('zenroast', 'entries', testEntry);
      const entries = zendata.get('zenroast.entries');
      console.log('✅ Entries test:', entries.length > 0 ? 'PASS' : 'FAIL', entries.length);
      
      // Test 3: Convenience helpers
      zendata.increment('zenroast.tabSwitches');
      const tabSwitches = zendata.get('zenroast.tabSwitches');
      console.log('✅ Increment test:', tabSwitches === 1 ? 'PASS' : 'FAIL', tabSwitches);
      
      // Test 4: Session management
      zendata.startFocusSession();
      const sessionStart = zendata.get('zenroast.session.start');
      console.log('✅ Session test:', sessionStart ? 'PASS' : 'FAIL', sessionStart);
      
      // Test 5: Away time recording
      zendata.recordAwayTime(30);
      const totalAwayTime = zendata.get('zenroast.session.totalAwayTime');
      console.log('✅ Away time test:', totalAwayTime === 30 ? 'PASS' : 'FAIL', totalAwayTime);
      
      console.log('🧪 Round-trip test complete!');
    };
  
  })(window);
  
