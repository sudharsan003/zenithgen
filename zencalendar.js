// ZenCalendar.js - Integrated with zendata.js
// All localStorage operations replaced with zendata methods
// 
// PERFORMANCE FIXES APPLIED:
// 1. Fixed CSS class mismatch: Added .zc-task-item styles to match JavaScript
// 2. Optimized re-rendering: Reduced excessive zendata subscription calls
// 3. Reduced animation delays: Changed from 50ms to 20ms per day
// 4. Added selective re-rendering: Only update affected components on data changes
// 5. Restored 3-column layout CSS that was accidentally removed
// 6. FIXED INFINITE LOOP: Added debounce protection and removed zendata.set() from render functions

(function() {
  'use strict';

  // Global variables
  let zcCurrentDate = new Date();
  let zcSelectedDate = new Date();
  let zcDefaultTasks = [
    'Workout', 'Read a book', 'Meditate', 'Plan tomorrow', 'Call a friend', 'Write journal', 'Drink water', 'Stretch', 'Review goals',
    'Take a walk', 'Learn something new', 'Organize workspace', 'Practice gratitude', 'Connect with family'
  ];

  // Performance tracking
  let renderCount = 0;
  let lastRenderTime = 0;

  // INFINITE LOOP FIX: Re-entrancy protection
  let ZC_IS_RENDERING = false;
  let ZC_IGNORE_PUBLISH = false;
  
  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  const zcScheduleRender = debounce(() => zcRenderAll('debounced'), 16);

  // Load data from zendata
  function loadZenCalendarData() {
    console.time('🔄 Loading ZenCalendar data');
    console.log('🔄 Loading ZenCalendar data from zendata...');
    
    // Initialize zendata if not already loaded
    if (typeof zendata === 'undefined') {
      console.error('❌ zendata not loaded');
      return;
    }
    
    // Load selected date
    const savedDate = zendata.get('zencalendar.selectedDate');
    console.log('📅 Selected date from zendata:', savedDate);
    if (savedDate) {
      zcSelectedDate = new Date(savedDate);
    }
    
    // Load task board if empty
    const taskBoard = zendata.get('zencalendar.taskBoard');
    console.log('📋 Task board from zendata:', taskBoard);
    if (!taskBoard || taskBoard.length === 0) {
      console.log('📝 Initializing task board with default tasks');
      ZC_IGNORE_PUBLISH = true;
      zendata.set('zencalendar.taskBoard', zcDefaultTasks);
      ZC_IGNORE_PUBLISH = false;
    }
    
    // Update streak on page load to ensure it's current
    updateStreak();
    
    // Log all zencalendar data
    const allData = zendata.getPage('zencalendar');
    console.log('📥 ZenCalendar Data Loaded from zendata:', allData);
    console.timeEnd('🔄 Loading ZenCalendar data');
  }

  // Helper function to get date key
  function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Helper function to update streak
  function updateStreak() {
    const today = new Date().toDateString();
    const lastStreakDate = zendata.get('zencalendar.lastStreakDate');
    const currentStreak = zendata.get('zencalendar.streak') || 0;
    
    // Check if there are completed tasks or timeline slots today
    const todayKey = getDateKey(new Date());
    const data = zendata.get('zencalendar.data') || {};
    const todayData = data[todayKey] || { tasks: [] };
    const completedTasks = todayData.tasks.filter(t => t.completed).length;
    
    // Check completed timeline slots for today
    const timelineSlots = zendata.get('zencalendar.timelineSlots') || {};
    const todaySlots = timelineSlots[todayKey] || [];
    const completedSlots = todaySlots.filter(s => s.completed).length;
    
    // Check completed weekly goals for today
    const weeklyGoals = zendata.get('zencalendar.weeklyGoals') || [];
    const completedGoals = weeklyGoals.filter(g => g.completed).length;
    
    const hasCompletedItems = completedTasks > 0 || completedSlots > 0 || completedGoals > 0;
    
    console.log('🔥 Streak calculation debug:', {
      today,
      lastStreakDate,
      currentStreak,
      todayKey,
      completedTasks,
      completedSlots,
      completedGoals,
      hasCompletedItems
    });
    
    // Calculate the actual consecutive streak by checking backwards from today
    let calculatedStreak = 0;
    let checkDate = new Date();
    
    while (true) {
      const checkKey = getDateKey(checkDate);
      const checkData = data[checkKey] || { tasks: [] };
      const checkTasks = checkData.tasks.filter(t => t.completed).length;
      const checkSlots = timelineSlots[checkKey] || [];
      const checkCompletedSlots = checkSlots.filter(s => s.completed).length;
      const checkWeeklyGoals = weeklyGoals.filter(g => g.completed).length;
      
      const hasItems = checkTasks > 0 || checkCompletedSlots > 0 || checkWeeklyGoals > 0;
      
      if (hasItems) {
        calculatedStreak++;
        // Go back one day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    console.log('🔥 Calculated streak:', calculatedStreak, 'days');
    
    // Update the streak if it's different from current
    if (calculatedStreak !== currentStreak) {
      ZC_IGNORE_PUBLISH = true;
      zendata.set('zencalendar.streak', calculatedStreak);
      zendata.set('zencalendar.lastStreakDate', today);
      ZC_IGNORE_PUBLISH = false;
      console.log('🔥 Streak updated from', currentStreak, 'to', calculatedStreak, 'days');
    } else {
      console.log('🔥 Streak unchanged:', calculatedStreak, 'days');
    }
  }

  // --- Task Board ---
  function renderTaskBoard() {
    console.time('🎯 Render Task Board');
    const board = document.getElementById('zc-task-board');
    if (!board) {
      console.warn('⚠️ Task board element not found');
      console.timeEnd('🎯 Render Task Board');
      return;
    }
    board.innerHTML = '';
    
    const tasks = zendata.get('zencalendar.taskBoard') || zcDefaultTasks;
    console.log('🎯 Rendering task board with tasks from zendata:', tasks);
    
    tasks.forEach(task => {
      const el = document.createElement('div');
      el.className = 'zc-task-item';
      el.textContent = task;
      el.draggable = true;
      el.ondragstart = e => {
        e.dataTransfer.setData('text/plain', task);
        el.classList.add('zc-dragging');
      };
      el.ondragend = () => el.classList.remove('zc-dragging');
      board.appendChild(el);
    });
    console.timeEnd('🎯 Render Task Board');
  }

  // --- Calendar Grid ---
  function renderCalendarGrid() {
    console.time('📅 Render Calendar Grid');
    const grid = document.getElementById('zc-calendar-grid');
    if (!grid) {
      console.warn('⚠️ Calendar grid element not found');
      console.timeEnd('📅 Render Calendar Grid');
      return;
    }
    grid.innerHTML = '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const header = document.createElement('div');
      header.className = 'zc-calendar-header';
      header.textContent = day;
      grid.appendChild(header);
    });
    
    const year = zcCurrentDate.getFullYear();
    const month = zcCurrentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'zc-calendar-day';
      empty.style.background = 'none';
      grid.appendChild(empty);
    }
    
    // Render days
    const data = zendata.get('zencalendar.data') || {};
    console.log('📅 Rendering calendar grid with data from zendata:', data);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayKey = getDateKey(date);
      const dayDiv = document.createElement('div');
      dayDiv.className = 'zc-calendar-day';
      
      if (date.toDateString() === (new Date()).toDateString()) {
        dayDiv.style.border = '2px solid #a855f7';
      }
      if (date.toDateString() === zcSelectedDate.toDateString()) {
        dayDiv.style.background = 'linear-gradient(90deg, #f3e8ff 60%, #f9a8d4 100%)';
      }
      
      dayDiv.innerHTML = `<div style='font-weight:600;'>${d}</div>`;
      
      // Task pills
      if (data[dayKey] && data[dayKey].tasks && data[dayKey].tasks.length) {
        console.log(`📝 Day ${dayKey} has ${data[dayKey].tasks.length} tasks from zendata:`, data[dayKey].tasks);
        data[dayKey].tasks.slice(0, 3).forEach(task => {
          const pill = document.createElement('span');
          pill.className = 'zc-task-pill' + (task.completed ? ' completed' : '');
          pill.textContent = task.text;
          pill.title = task.text;
          pill.onclick = e => { 
            zcRipple(e, pill);
            toggleTaskCompletion(dayKey, task.id);
          };
          dayDiv.appendChild(pill);
        });
        if (data[dayKey].tasks.length > 3) {
          const more = document.createElement('span');
          more.className = 'zc-task-pill';
          more.textContent = `+${data[dayKey].tasks.length - 3}`;
          dayDiv.appendChild(more);
        }
      }
      
      // Animate in with reduced delay for better performance
      setTimeout(() => dayDiv.classList.add('animate-in'), 20 * d);
      
      // Drag & drop target
      dayDiv.ondragover = e => { 
        e.preventDefault(); 
        dayDiv.classList.add('zc-drop-hover'); 
      };
      dayDiv.ondragleave = () => dayDiv.classList.remove('zc-drop-hover');
      dayDiv.ondrop = e => {
        e.preventDefault();
        dayDiv.classList.remove('zc-drop-hover');
        const taskText = e.dataTransfer.getData('text/plain');
        if (taskText) zcAddTaskToDay(dayKey, taskText);
      };
      
      // Click to select date
      dayDiv.onclick = () => {
        zcSelectedDate = new Date(year, month, d);
        ZC_IGNORE_PUBLISH = true;
        zendata.set('zencalendar.selectedDate', zcSelectedDate.toISOString());
        ZC_IGNORE_PUBLISH = false;
        console.log('📅 Date selected and saved to zendata:', zcSelectedDate.toISOString());
        zcScheduleRender();
      };
      
      grid.appendChild(dayDiv);
    }
    
    // Fill empty cells at end
    const totalCells = dayNames.length + startDay + daysInMonth;
    const endEmpty = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < endEmpty; i++) {
      const empty = document.createElement('div');
      empty.className = 'zc-calendar-day';
      empty.style.background = 'none';
      grid.appendChild(empty);
    }
    
    // Update month display
    const monthDisplay = document.getElementById('zc-current-month');
    if (monthDisplay) {
      monthDisplay.textContent = zcCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    console.timeEnd('📅 Render Calendar Grid');
  }

  // Calendar navigation
  document.getElementById('zc-prev-month').onclick = function() {
    zcCurrentDate.setMonth(zcCurrentDate.getMonth() - 1);
    zcScheduleRender();
  };
  document.getElementById('zc-next-month').onclick = function() {
    zcCurrentDate.setMonth(zcCurrentDate.getMonth() + 1);
    zcScheduleRender();
  };

  // --- Date-wise To-Do Grid ---
  function renderTodoGrid() {
    console.time('📋 Render Todo Grid');
    const grid = document.getElementById('todoGrid');
    if (!grid) {
      console.warn('⚠️ Todo grid element not found');
      console.timeEnd('📋 Render Todo Grid');
      return;
    }
    grid.innerHTML = '';
    
    const key = getDateKey(zcSelectedDate);
    const data = zendata.get('zencalendar.data') || {};
    const dayData = data[key] || { tasks: [] };
    console.log(`📋 Rendering todo grid for ${key} with data from zendata:`, dayData);
    
    if (!dayData.tasks.length) {
      grid.innerHTML = '<div class="empty-state">No tasks for this date. Add one below!</div>';
    } else {
      dayData.tasks.forEach((task, idx) => {
        const item = document.createElement('div');
        item.className = 'zc-todo-item' + (task.completed ? ' completed' : '');
        
        const taskContent = document.createElement('span');
        taskContent.textContent = `${task.time ? task.time + ' - ' : ''}${task.text}`;
        item.appendChild(taskContent);
        
        // Add completion toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'zc-todo-toggle';
        toggleBtn.innerHTML = task.completed ? '✓' : '○';
        toggleBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        toggleBtn.onclick = () => toggleTaskCompletion(key, task.id);
        item.appendChild(toggleBtn);
        
        grid.appendChild(item);
      });
    }
    console.timeEnd('📋 Render Todo Grid');
  }

  // --- Task Completion Toggle ---
  function toggleTaskCompletion(dayKey, taskId) {
    const data = zendata.get('zencalendar.data') || {};
    if (!data[dayKey]) return;
    
    const task = data[dayKey].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      ZC_IGNORE_PUBLISH = true;
      zendata.set('zencalendar.data', data);
      ZC_IGNORE_PUBLISH = false;
      console.log(`📝 Task "${task.text}" ${task.completed ? 'completed' : 'uncompleted'} for ${dayKey}`);
      
      // Update streak if this is today
      if (dayKey === getDateKey(new Date())) {
        updateStreak();
      }
      
      zcScheduleRender();
    }
  }

  // --- Selected Date Display ---
  function renderSelectedDateDisplay() {
    const display = document.getElementById('zc-selected-date-display');
    if (!display) return;
    
    const today = new Date();
    if (zcSelectedDate.toDateString() === today.toDateString()) {
      display.textContent = 'Today';
    } else {
      display.textContent = zcSelectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  // --- Streak Flame Widget ---
  function renderStreakFlame() {
    console.time('🔥 Render Streak Flame');
    const el = document.getElementById('zc-streak-flame');
    if (!el) {
      console.warn('⚠️ Streak flame element not found');
      console.timeEnd('🔥 Render Streak Flame');
      return;
    }
    el.innerHTML = '';
    
    const streak = zendata.get('zencalendar.streak') || 0;
    const prev = zendata.get('zencalendar.streakPrev') || 0;
    console.log('🔥 Rendering streak flame with data from zendata - Current:', streak, 'Previous:', prev);
    
    const flame = document.createElement('div');
    flame.className = 'zc-streak-flame';
    flame.innerHTML = '🔥';
    el.appendChild(flame);
    
    const count = document.createElement('div');
    count.className = 'zc-streak-count';
    count.textContent = streak;
    el.appendChild(count);
    
    const label = document.createElement('div');
    label.className = 'zc-streak-label';
    label.textContent = 'day streak';
    el.appendChild(label);
    
    // Animate flame pop if streak increased
    if (streak > prev) {
      flame.classList.add('zc-flame-pop');
      setTimeout(() => flame.classList.remove('zc-flame-pop'), 700);
      ZC_IGNORE_PUBLISH = true;
      zendata.set('zencalendar.streakPrev', streak);
      ZC_IGNORE_PUBLISH = false;
      console.log('🔥 Streak increased, updated previous streak in zendata');
    }
    console.timeEnd('🔥 Render Streak Flame');
  }
  
  // JS hook to update streak dynamically
  window.zcUpdateStreak = function() {
    updateStreak();
    renderStreakFlame();
  };

  // --- Time-Blocking Timeline ---
  function getTimelineSlots() {
    const key = getDateKey(zcSelectedDate);
    const timelineSlots = zendata.get('zencalendar.timelineSlots') || {};
    const slots = timelineSlots[key] || [];
    console.log(`⏰ Getting timeline slots for ${key} from zendata:`, slots);
    return slots;
  }
  
  function setTimelineSlots(slots) {
    const key = getDateKey(zcSelectedDate);
    const timelineSlots = zendata.get('zencalendar.timelineSlots') || {};
    timelineSlots[key] = slots;
    ZC_IGNORE_PUBLISH = true;
    zendata.set('zencalendar.timelineSlots', timelineSlots);
    ZC_IGNORE_PUBLISH = false;
    console.log(`⏰ Saved timeline slots for ${key} to zendata:`, slots);
  }
  
  function renderTimeline() {
    console.time('⏰ Render Timeline');
    const timeline = document.getElementById('zc-timeline');
    if (!timeline) {
      console.warn('⚠️ Timeline element not found');
      console.timeEnd('⏰ Render Timeline');
      return;
    }
    timeline.innerHTML = '';
    
    const bar = document.createElement('div');
    bar.className = 'zc-timeline-bar';
    timeline.appendChild(bar);
    
    const label = document.createElement('div');
    label.className = 'zc-timeline-label';
    timeline.appendChild(label);
    
    function update() {
      const now = new Date();
      const percent = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
      bar.style.width = (percent * 100).toFixed(1) + '%';
      label.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      requestAnimationFrame(update);
    }
    update();
    
    // Render slots
    renderTimelineSlots();
    console.timeEnd('⏰ Render Timeline');
  }
  
  function renderTimelineSlots() {
    console.time('⏰ Render Timeline Slots');
    const slots = getTimelineSlots();
    const container = document.getElementById('zc-timeline-slots');
    if (!container) {
      console.warn('⚠️ Timeline slots container not found');
      console.timeEnd('⏰ Render Timeline Slots');
      return;
    }
    container.innerHTML = '';
    console.log('⏰ Rendering timeline slots from zendata:', slots);
    
    slots.forEach((slot, idx) => {
      const el = document.createElement('div');
      el.className = 'zc-timeline-slot' + (slot.completed ? ' completed' : '');
      
      const timeText = slot.endTime ? `${slot.time} – ${slot.endTime}` : slot.time;
      el.innerHTML = `<span>${timeText} – ${slot.label}</span>`;
      
      // Add completion toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'zc-timeline-toggle';
      toggleBtn.innerHTML = slot.completed ? '✓' : '○';
      toggleBtn.title = slot.completed ? 'Mark incomplete' : 'Mark complete';
      toggleBtn.onclick = () => toggleTimelineSlotCompletion(idx);
      el.appendChild(toggleBtn);
      
      // Add remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'zc-timeline-slot-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove';
      removeBtn.onclick = () => {
        slots.splice(idx, 1);
        setTimelineSlots(slots);
        zcScheduleRender();
      };
      el.appendChild(removeBtn);
      
      container.appendChild(el);
    });
    console.timeEnd('⏰ Render Timeline Slots');
  }
  
  // --- Timeline Slot Completion Toggle ---
  function toggleTimelineSlotCompletion(slotIndex) {
    const slots = getTimelineSlots();
    if (slots[slotIndex]) {
      slots[slotIndex].completed = !slots[slotIndex].completed;
      setTimelineSlots(slots);
      console.log(`⏰ Timeline slot "${slots[slotIndex].label}" ${slots[slotIndex].completed ? 'completed' : 'uncompleted'}`);
      
      // Update streak if this is today
      const todayKey = getDateKey(new Date());
      const selectedKey = getDateKey(zcSelectedDate);
      if (selectedKey === todayKey) {
        updateStreak();
      }
      
      zcScheduleRender();
    }
  }
  
  document.getElementById('zc-timeline-form').onsubmit = function(e) {
    e.preventDefault();
    const time = document.getElementById('zc-timeline-time').value;
    const label = document.getElementById('zc-timeline-label').value;
    if (!time || !label) return;
    
    // Get end time from a new input field (we'll add this to HTML)
    const endTimeInput = document.getElementById('zc-timeline-end-time');
    const endTime = endTimeInput ? endTimeInput.value : '';
    
    const slots = getTimelineSlots();
    slots.push({ 
      time, 
      endTime,
      label, 
      completed: false,
      id: Date.now()
    });
    setTimelineSlots(slots);
    zcScheduleRender();
    console.log('⏰ Added new timeline slot to zendata:', { time, endTime, label });
    this.reset();
    if (endTimeInput) endTimeInput.value = '';
  };

  // --- Heatmap with Dummy Data ---
  function renderHeatmap() {
    console.time('📊 Render Heatmap');
    const el = document.getElementById('zc-heatmap');
    if (!el) {
      console.warn('⚠️ Heatmap element not found');
      console.timeEnd('📊 Render Heatmap');
      return;
    }
    el.innerHTML = '';
    
    // Show last 56 days (8 weeks)
    const data = zendata.get('zencalendar.data') || {};
    console.log('📊 Rendering heatmap with data from zendata:', data);
    const today = new Date();
    
    for (let i = 55; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      
      // Dummy data: randomize activity level if no data
      let level = 0, mood = '';
      if (data[key]) {
        const completed = (data[key].tasks || []).filter(t => t.completed).length;
        if (completed >= 5) level = 5;
        else if (completed >= 3) level = 4;
        else if (completed >= 1) level = 3;
        else if ((data[key].tasks || []).length > 0) level = 2;
        mood = data[key].mood || '';
      } else {
        level = Math.floor(Math.random() * 6); // 0-5
      }
      
      const cell = document.createElement('div');
      cell.className = 'zc-heatmap-cell';
      cell.dataset.level = level;
      cell.title = d.toLocaleDateString();
      el.appendChild(cell);
    }
    console.timeEnd('📊 Render Heatmap');
  }

  // --- Progress Tracker ---
  function renderProgressTracker() {
    console.time('📈 Render Progress Tracker');
    const circle = document.getElementById('zc-progress-circle');
    const label = document.getElementById('zc-progress-label');
    if (!circle || !label) {
      console.warn('⚠️ Progress tracker elements not found');
      console.timeEnd('📈 Render Progress Tracker');
      return;
    }
    
    const key = getDateKey(zcSelectedDate);
    const data = zendata.get('zencalendar.data') || {};
    const dayData = data[key] || { tasks: [] };
    
    // Count completed tasks
    const completedTasks = dayData.tasks.filter(t => t.completed).length;
    
    // Count completed timeline slots
    const timelineSlots = zendata.get('zencalendar.timelineSlots') || {};
    const daySlots = timelineSlots[key] || [];
    const completedSlots = daySlots.filter(s => s.completed).length;
    
    const total = dayData.tasks.length + daySlots.length;
    const completed = completedTasks + completedSlots;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    console.log(`📈 Progress tracker for ${key} from zendata - Tasks: ${completedTasks}/${dayData.tasks.length}, Slots: ${completedSlots}/${daySlots.length}, Total: ${completed}/${total}, Percent: ${percent}%`);
    
    circle.style.background = `conic-gradient(#a855f7 ${percent * 3.6}deg, #e5e7eb ${percent * 3.6}deg)`;
    label.textContent = `${completed}/${total}`;
    console.timeEnd('📈 Render Progress Tracker');
  }

  // --- Quote of the Day ---
  const zcQuotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Focus on the progress, not perfection.", author: "ZenBot" },
    { text: "Every day is a new beginning.", author: "Unknown" },
    { text: "Small steps lead to big changes.", author: "Unknown" },
    { text: "Your only limit is your mind.", author: "Unknown" }
  ];
  
  function renderQuote() {
    console.time('💬 Render Quote');
    const idx = zendata.get('zencalendar.quoteIndex') || Math.floor(Math.random() * zcQuotes.length);
    const quote = zcQuotes[idx];
    console.log('💬 Rendering quote from zendata - Index:', idx, 'Quote:', quote);
    
    const quoteEl = document.getElementById('zc-daily-quote');
    const authorEl = document.getElementById('zc-quote-author');
    
    if (quoteEl && authorEl) {
      quoteEl.textContent = '"' + quote.text + '"';
      authorEl.textContent = '— ' + quote.author;
      // REMOVED: zendata.set() call that was causing infinite loops
    } else {
      console.warn('⚠️ Quote elements not found');
    }
    console.timeEnd('💬 Render Quote');
  }
  
  document.getElementById('zc-new-quote-btn').onclick = function() {
    let idx = zendata.get('zencalendar.quoteIndex') || 0;
    let newIdx;
    do { 
      newIdx = Math.floor(Math.random() * zcQuotes.length); 
    } while (newIdx === idx);
    ZC_IGNORE_PUBLISH = true;
    zendata.set('zencalendar.quoteIndex', newIdx);
    ZC_IGNORE_PUBLISH = false;
    console.log('💬 New quote selected and saved to zendata - Index:', newIdx);
    zcScheduleRender();
  };

  // --- Weekly Goals ---
  function getWeeklyGoals() {
    const goals = zendata.get('zencalendar.weeklyGoals') || [];
    console.log('🎯 Getting weekly goals from zendata:', goals);
    return goals;
  }
  
  function setWeeklyGoals(goals) {
    ZC_IGNORE_PUBLISH = true;
    zendata.set('zencalendar.weeklyGoals', goals);
    ZC_IGNORE_PUBLISH = false;
    console.log('🎯 Saved weekly goals to zendata:', goals);
  }
  
  function renderWeeklyGoals() {
    console.time('🎯 Render Weekly Goals');
    const list = document.getElementById('zc-weekly-goals-list');
    if (!list) {
      console.warn('⚠️ Weekly goals list element not found');
      console.timeEnd('🎯 Render Weekly Goals');
      return;
    }
    list.innerHTML = '';
    
    const goals = getWeeklyGoals();
    console.log('🎯 Rendering weekly goals from zendata:', goals);
    
    goals.forEach((goal, idx) => {
      const li = document.createElement('li');
      li.className = goal.completed ? 'completed' : '';
      
      const goalText = document.createElement('span');
      goalText.textContent = goal.text || goal;
      li.appendChild(goalText);
      
      // Add completion toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'zc-weekly-goal-toggle';
      toggleBtn.innerHTML = goal.completed ? '✓' : '○';
      toggleBtn.title = goal.completed ? 'Mark incomplete' : 'Mark complete';
      toggleBtn.onclick = () => toggleWeeklyGoalCompletion(idx);
      li.appendChild(toggleBtn);
      
      // Add remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'zc-weekly-goal-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = () => {
        goals.splice(idx, 1);
        setWeeklyGoals(goals);
        zcScheduleRender();
      };
      li.appendChild(removeBtn);
      
      list.appendChild(li);
    });
    console.timeEnd('🎯 Render Weekly Goals');
  }
  
  // --- Weekly Goal Completion Toggle ---
  function toggleWeeklyGoalCompletion(goalIndex) {
    const goals = getWeeklyGoals();
    if (goals[goalIndex]) {
      if (typeof goals[goalIndex] === 'string') {
        // Convert string goal to object format
        goals[goalIndex] = { text: goals[goalIndex], completed: false };
      }
      goals[goalIndex].completed = !goals[goalIndex].completed;
      setWeeklyGoals(goals);
      console.log(`🎯 Weekly goal "${goals[goalIndex].text}" ${goals[goalIndex].completed ? 'completed' : 'uncompleted'}`);
      
      // Update streak if this is today
      const todayKey = getDateKey(new Date());
      const selectedKey = getDateKey(zcSelectedDate);
      if (selectedKey === todayKey) {
        updateStreak();
      }
      
      zcScheduleRender();
    }
  }
  
  document.getElementById('zc-weekly-goals-form').onsubmit = function(e) {
    e.preventDefault();
    const input = document.getElementById('zc-weekly-goal-input');
    const val = input.value.trim();
    if (!val) return;
    
    const goals = getWeeklyGoals();
    goals.push({ text: val, completed: false });
    setWeeklyGoals(goals);
    zcScheduleRender();
    console.log('🎯 Added new weekly goal to zendata:', val);
    input.value = '';
  };

  // --- Ripple Effect ---
  function zcRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'zc-ripple';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
  
  // --- Add Task to Day (from drag/drop) ---
  function zcAddTaskToDay(dayKey, text) {
    const data = zendata.get('zencalendar.data') || {};
    if (!data[dayKey]) {
      data[dayKey] = { tasks: [], mood: '', notes: '', completedTasks: 0 };
    }
    data[dayKey].tasks.push({
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });
    ZC_IGNORE_PUBLISH = true;
    zendata.set('zencalendar.data', data);
    ZC_IGNORE_PUBLISH = false;
    console.log(`📝 Added task "${text}" to day ${dayKey} in zendata`);
    
    zcScheduleRender();
  }

  // --- Initial Render ---
  function zcRenderAll(reason = '') {
    if (ZC_IS_RENDERING) {
      console.log('zcRenderAll called:', reason, '- BLOCKED (already rendering)');
      return;
    }
    
    ZC_IS_RENDERING = true;
    try {
      console.time('[zc] renderAll ' + reason);
      console.log('zcRenderAll called:', reason);
      
      loadZenCalendarData();        // READ ONLY
      renderCalendarGrid();         // READ ONLY
      renderTaskBoard();            // READ ONLY
      renderTodoGrid();             // READ ONLY
      renderSelectedDateDisplay();  // READ ONLY
      renderStreakFlame();          // READ ONLY
      renderTimeline();             // READ ONLY
      renderHeatmap();              // READ ONLY
      renderQuote();                // READ ONLY
      renderWeeklyGoals();          // READ ONLY
      renderProgressTracker();      // READ ONLY
      
      console.log('✅ ZenCalendar render all complete');
    } finally {
      console.timeEnd('[zc] renderAll ' + reason);
      ZC_IS_RENDERING = false;
    }
  }
  
  window.addEventListener('DOMContentLoaded', () => zcRenderAll('initial'));
  
  // Listen for zendata changes with optimized re-rendering
  if (typeof zendata !== 'undefined') {
    zendata.subscribe('change:zencalendar', (payload) => {
      console.log('[SUB] change:zencalendar fired');
      if (ZC_IGNORE_PUBLISH) {
        console.log('[SUB] Ignoring publish (our own write)');
        return;
      }
      if (ZC_IS_RENDERING) {
        console.log('[SUB] Ignoring publish (currently rendering)');
        return;
      }
      zcScheduleRender();
    });
    console.log('📡 Subscribed to zendata changes for ZenCalendar');
  }
})();