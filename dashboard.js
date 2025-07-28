// =============================================================================
// AUTHENTICATION GUARD - Ensure user is logged in
// =============================================================================

// Check authentication using shared auth utility
checkAuth();

// =============================================================================
// DEBUG SYSTEM - Auto-Scroll Detection and Logging
// =============================================================================

let scrollDebug = {
  enabled: true,
  lastScrollTop: 0,
  scrollEvents: [],
  maxEvents: 20,
  suspiciousThreshold: 3 // Number of rapid scroll changes to flag as suspicious
};

// Monitor all scroll events for debugging
function initScrollDebug() {
  if (!scrollDebug.enabled) return;
  
  console.log("🐛 Scroll Debug System: ENABLED");
  console.log("📊 Use scrollDebug.getReport() to see scroll activity");
  
  // Store initial scroll position
  scrollDebug.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Monitor scroll events
  let scrollEventCount = 0;
  window.addEventListener('scroll', function(e) {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const timestamp = Date.now();
    
    scrollEventCount++;
    
    // Log scroll event
    const event = {
      id: scrollEventCount,
      timestamp,
      scrollTop: currentScrollTop,
      previousScrollTop: scrollDebug.lastScrollTop,
      difference: currentScrollTop - scrollDebug.lastScrollTop,
      target: e.target,
      isSuspicious: false
    };
    
    // Check for suspicious activity (rapid scroll changes)
    const recentEvents = scrollDebug.scrollEvents.slice(-scrollDebug.suspiciousThreshold);
    const rapidChanges = recentEvents.filter(evt => 
      timestamp - evt.timestamp < 100 && Math.abs(evt.difference) > 50
    );
    
    if (rapidChanges.length >= scrollDebug.suspiciousThreshold - 1) {
      event.isSuspicious = true;
      console.warn("🚨 SUSPICIOUS SCROLL ACTIVITY DETECTED:", {
        event,
        recentEvents: recentEvents,
        stackTrace: new Error().stack
      });
    }
    
    // Add to events array (keep only recent events)
    scrollDebug.scrollEvents.push(event);
    if (scrollDebug.scrollEvents.length > scrollDebug.maxEvents) {
      scrollDebug.scrollEvents.shift();
    }
    
    scrollDebug.lastScrollTop = currentScrollTop;
  }, { passive: true });
  
  // Monitor programmatic scroll attempts
  const originalScrollTo = window.scrollTo;
  const originalScroll = window.scroll;
  const originalScrollBy = window.scrollBy;
  
  window.scrollTo = function(x, y) {
    console.log("🔍 PROGRAMMATIC SCROLL DETECTED - scrollTo:", { x, y, stack: new Error().stack });
    return originalScrollTo.apply(this, arguments);
  };
  
  window.scroll = function(x, y) {
    console.log("🔍 PROGRAMMATIC SCROLL DETECTED - scroll:", { x, y, stack: new Error().stack });
    return originalScroll.apply(this, arguments);
  };
  
  window.scrollBy = function(x, y) {
    console.log("🔍 PROGRAMMATIC SCROLL DETECTED - scrollBy:", { x, y, stack: new Error().stack });
    return originalScrollBy.apply(this, arguments);
  };
  
  // Monitor scrollIntoView calls
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(options) {
    console.log("🔍 SCROLL INTO VIEW DETECTED:", { element: this, options, stack: new Error().stack });
    return originalScrollIntoView.apply(this, arguments);
  };
  
  // Monitor focus events that might cause scrolling
  document.addEventListener('focus', function(e) {
    if (e.target && e.target.scrollIntoView) {
      console.log("🔍 FOCUS EVENT (potential scroll trigger):", { 
        element: e.target, 
        tagName: e.target.tagName,
        id: e.target.id,
        className: e.target.className
      });
    }
  }, true);
}

// Debug utility functions
scrollDebug.getReport = function() {
  console.group("📊 SCROLL DEBUG REPORT");
  console.log("Recent scroll events:", this.scrollEvents);
  console.log("Suspicious events:", this.scrollEvents.filter(e => e.isSuspicious));
  console.log("Current scroll position:", window.pageYOffset || document.documentElement.scrollTop);
  console.groupEnd();
  return {
    events: this.scrollEvents,
    suspicious: this.scrollEvents.filter(e => e.isSuspicious),
    currentPosition: window.pageYOffset || document.documentElement.scrollTop
  };
};

scrollDebug.clearEvents = function() {
  this.scrollEvents = [];
  console.log("🗑️ Scroll debug events cleared");
};

scrollDebug.disable = function() {
  this.enabled = false;
  console.log("🐛 Scroll Debug System: DISABLED");
};

// =============================================================================
// ZENDATA INTEGRATION - Real-time data fetching and transformation
// =============================================================================

// Check if ZenData is available and get real data
function getZenData() {
  if (typeof zendata !== 'undefined') {
    try {
      return zendata.getAll();
    } catch (error) {
      console.warn('⚠️ Error accessing ZenData:', error);
      return null;
    }
  }
  return null;
}

// Get real mood data from ZenData
function getRealMoodData() {
  const zenData = getZenData();
  if (!zenData || !zenData.diary || !zenData.diary.entries) {
    return [];
  }
  
  // Get last 7 days of mood entries
  const entries = zenData.diary.entries;
  const today = new Date();
  const moodData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Find entries for this date
    const dayEntries = entries.filter(entry => 
      entry.date && entry.date.startsWith(dateStr)
    );
    
    // Calculate average mood for the day
    let avgMood = 5; // Default neutral mood
    if (dayEntries.length > 0) {
      const moodSum = dayEntries.reduce((sum, entry) => {
        const mood = entry.mood || 5;
        return sum + Math.max(1, Math.min(10, mood));
      }, 0);
      avgMood = Math.round(moodSum / dayEntries.length);
    }
    
    moodData.push({
      date: dateStr,
      mood: avgMood
    });
  }
  
  return moodData;
}

// Get real habit data from ZenData
function getRealHabitData() {
  const zenData = getZenData();
  if (!zenData || !zenData.habits || !zenData.habits.trackers) {
    return [];
  }
  
  return zenData.habits.trackers;
}

// Get real distraction/focus data from ZenData
function getRealDistractionData() {
  const zenData = getZenData();
  if (!zenData || !zenData.zenroast || !zenData.zenroast.entries) {
    return [];
  }
  
  return zenData.zenroast.entries;
}

// Get real task data from ZenData
function getRealTaskData() {
  const zenData = getZenData();
  if (!zenData || !zenData.zencalendar || !zenData.zencalendar.data) {
    return [];
  }
  
  const today = new Date().toISOString().split('T')[0];
  const todayData = zenData.zencalendar.data[today];
  
  if (!todayData || !todayData.tasks) {
    return [];
  }
  
  return todayData.tasks;
}

// Enhanced quote system with more motivational quotes
function getDailyQuote() {
  const quotes = [
    { text: "You don't have to be extreme, just consistent.", author: "ZenithGen" },
    { text: "Focus on the progress, not perfection.", author: "ZenBot" },
    { text: "Discipline is choosing what you want most over what you want now.", author: "Your Better Self" },
    { text: "You can't heal in the same environment that made you sick.", author: "Inner Wisdom" },
    { text: "Small steps daily lead to big changes yearly.", author: "ZenithGen" },
    { text: "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.", author: "Inner Wisdom" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" }
  ];

  // Use day-based selection for consistent daily quotes
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % quotes.length;
  
  return quotes[quoteIndex];
}

// =============================================================================
// MAIN APPLICATION CODE - Clean version with debug monitoring
// =============================================================================

const currentUser = sessionStorage.getItem("currentUser") || "User";

// Simple initialization without scroll interference
document.addEventListener('DOMContentLoaded', function() {
  // Update welcome message immediately
  const welcomeMessage = document.getElementById('welcomeMessage');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');
  
  if (welcomeMessage) {
    welcomeMessage.textContent = `Hi ${currentUser}! Welcome back ✨`;
  }
  if (welcomeSubtitle) {
    welcomeSubtitle.textContent = "Ready to conquer your goals today?";
  }
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialize dashboard after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeDashboard();
  }, 100);
  
  // Subscribe to ZenData changes for real-time updates
  if (typeof zendata !== 'undefined') {
    console.log('🔗 Dashboard: Subscribing to ZenData changes...');
    
    // Subscribe to all data changes
    zendata.subscribe('change:all', (updatedData) => {
      console.log('📊 Dashboard: ZenData updated, refreshing components...');
      refreshDashboardComponents();
    });
    
    // Subscribe to specific page changes for targeted updates
    zendata.subscribe('change:diary', () => {
      console.log('📝 Dashboard: Diary updated, refreshing mood chart...');
      createMoodChart();
    });
    
    zendata.subscribe('change:habits', () => {
      console.log('🔄 Dashboard: Habits updated, refreshing habit progress...');
      loadHabitProgress();
    });
    
    zendata.subscribe('change:zenroast', () => {
      console.log('🎯 Dashboard: ZenRoast updated, refreshing distraction summary...');
      loadDistractionSummary();
    });
    
    zendata.subscribe('change:zencalendar', () => {
      console.log('📅 Dashboard: Calendar updated, refreshing today\'s tasks...');
      loadTodayTasks();
    });
  }
});

// Initialize Dashboard Components
function initializeDashboard() {
  console.log("🚀 Starting dashboard initialization...");
  
  // Initialize components in sequence to prevent conflicts
  setTimeout(() => loadDailyQuote(), 50);
  setTimeout(() => loadHabitProgress(), 100);
  setTimeout(() => loadDistractionSummary(), 150);
  setTimeout(() => loadTodayTasks(), 200);
  setTimeout(() => createMoodChart(), 250);
  
  // Check for welcome modal
  setTimeout(() => {
    const hasSeenWelcome = localStorage.getItem('zenWelcomeSeen');
    if (!hasSeenWelcome) {
      showWelcomeModal();
    }
  }, 500);
  
  console.log("✅ Dashboard initialization complete");
}

// Refresh all dashboard components with latest data
function refreshDashboardComponents() {
  console.log('🔄 Refreshing all dashboard components...');
  
  // Refresh components in sequence
  setTimeout(() => loadDailyQuote(), 50);
  setTimeout(() => loadHabitProgress(), 100);
  setTimeout(() => loadDistractionSummary(), 150);
  setTimeout(() => loadTodayTasks(), 200);
  setTimeout(() => createMoodChart(), 250);
  
  console.log('✅ Dashboard components refreshed');
}

// =============================================================================
// MODAL FUNCTIONS
// =============================================================================

function showWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.remove('show');
    localStorage.setItem('zenWelcomeSeen', 'true');
  }
}

function showToast(title, description, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.innerHTML = `<h4>${title}</h4><p>${description}</p>`;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function loadDailyQuote() {
  const quote = getDailyQuote();
  
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  
  if (quoteText) quoteText.innerText = `"${quote.text}"`;
  if (quoteAuthor) quoteAuthor.innerText = `— ${quote.author}`;
}

function createMoodChart() {
  const canvas = document.getElementById('moodChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  
  // Get real mood data from ZenData
  const realMoodData = getRealMoodData();
  let moodLabels = [];
  let moodValues = [];
  
  if (realMoodData.length > 0 && realMoodData.some(entry => entry.mood !== 5)) {
    // Use real mood data if it exists and has meaningful values
    moodLabels = realMoodData.map(entry => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    moodValues = realMoodData.map(entry => entry.mood);
  } else {
    // Fallback to placeholder dummy data for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      moodLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      moodValues.push(5); // Neutral mood placeholder
    }
  }

  // Destroy existing chart to prevent conflicts
  if (window.moodChartInstance) {
    window.moodChartInstance.destroy();
  }

  // FIX: Set fixed canvas dimensions to prevent resize loops
  const container = canvas.parentElement;
  const containerWidth = container.offsetWidth || 400;
  const containerHeight = container.offsetHeight || 300;
  
  // Set explicit dimensions
  canvas.style.width = containerWidth + 'px';
  canvas.style.height = containerHeight + 'px';
  canvas.width = containerWidth;
  canvas.height = containerHeight;

  window.moodChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: moodLabels,
      datasets: [{
        label: 'Mood Over Time',
        data: moodValues,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      // FIX: Disable responsive behavior completely
      responsive: false,
      maintainAspectRatio: false,
      
      // Disable all animations
      animation: false,
      transitions: {
        active: {
          animation: {
            duration: 0
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      hover: {
        animationDuration: 0
      },
      responsiveAnimationDuration: 0,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          animation: {
            duration: 0
          }
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          animation: {
            duration: 0
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
      // FIX: Completely removed onResize handler
    }
  });
}

function loadHabitProgress() {
  // Get real habit data from ZenData, fallback to localStorage
  const realHabitData = getRealHabitData();
  const habitData = realHabitData.length > 0 ? realHabitData : (JSON.parse(localStorage.getItem('habits')) || []);
  const habitProgressDiv = document.getElementById('habit-progress');
  
  if (!habitProgressDiv) return;

  if (habitData.length === 0) {
    habitProgressDiv.innerHTML = `
      <div style="text-align: center; color: #6b7280; padding: 1rem;">
        <p>No habits tracked yet.</p>
        <p style="font-size: 0.875rem;">Start building good habits! 💪</p>
      </div>`;
  } else {
    // Fix: Use lastCheck property to determine completion status for today
    const today = new Date().toDateString();
    const completed = habitData.filter(h => h.lastCheck === today).length;
    const percentage = Math.round((completed / habitData.length) * 100);
    habitProgressDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2rem; font-weight: bold; color: #22c55e; margin-bottom: 0.5rem;">
          ${completed}/${habitData.length}
        </div>
        <div style="background: #e5e7eb; border-radius: 1rem; height: 0.5rem; margin-bottom: 0.5rem;">
          <div style="background: #22c55e; height: 100%; border-radius: 1rem; width: ${percentage}%;"></div>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">${percentage}% completed today! 🎯</p>
      </div>`;
  }
}

function loadDistractionSummary() {
  // Get real distraction data from ZenData, fallback to localStorage
  const realDistractionData = getRealDistractionData();
  let distractionData = [];
  
  if (realDistractionData.length > 0) {
    // Transform ZenRoast entries to distraction format
    distractionData = realDistractionData.filter(entry => 
      entry.text && !entry.text.toLowerCase().includes('focus')
    ).map(entry => ({
      duration: entry.duration || 5,
      type: entry.text || 'distraction'
    }));
  } else {
    // Fallback to localStorage
    try {
      const rawData = localStorage.getItem('distractions');
      const parsedData = JSON.parse(rawData);
      distractionData = Array.isArray(parsedData) ? parsedData : [];
    } catch (e) {
      distractionData = [];
    }
  }

  const distractionDiv = document.getElementById('distraction-summary');
  if (!distractionDiv) return;

  if (distractionData.length === 0) {
    distractionDiv.innerHTML = `
      <div style="text-align: center; color: #6b7280; padding: 1rem;">
        <p>You're distraction-free! 🎉</p>
        <p style="font-size: 0.875rem;">Keep up the great focus! 🔥</p>
      </div>`;
  } else {
    const total = distractionData.length;
    const totalMinutes = distractionData.reduce((sum, d) => sum + (parseInt(d.duration) || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    distractionDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444; margin-bottom: 0.5rem;">
          ${total} distractions
        </div>
        <p style="color: #6b7280; margin-bottom: 0.5rem;">
          Time lost: ${hours > 0 ? `${hours}h ` : ''}${minutes}m
        </p>
        <p style="font-size: 0.875rem; color: #6b7280;">Stay focused! You got this! 💪</p>
      </div>`;
  }
}

function loadTodayTasks() {
  const todoContainer = document.getElementById('todo-list');
  if (!todoContainer) return;
  
  // Get real task data from ZenData, fallback to localStorage
  const realTaskData = getRealTaskData();
  let todayTasks = [];
  
  if (realTaskData.length > 0) {
    // Transform ZenCalendar tasks to display format
    todayTasks = realTaskData.map(task => ({
      time: task.time || 'All day',
      task: task.text || task.title || 'Task',
      completed: task.completed || false
    }));
  } else {
    // Fallback to localStorage
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `planner-${today}`;
    todayTasks = JSON.parse(localStorage.getItem(todayKey)) || [];
  }

  if (todayTasks.length === 0) {
    todoContainer.innerHTML = `
      <div class="todo-item" style="text-align: center; color: #6b7280;">
        No tasks scheduled for today.<br>
        <span style="font-size: 0.875rem;">Time to plan your perfect day! ✨</span>
      </div>`;
  } else {
    todoContainer.innerHTML = '';
    todayTasks.forEach((task) => {
      const div = document.createElement('div');
      div.className = 'todo-item';
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" ${task.completed ? "checked" : ""} disabled style="margin: 0;" />
          <span style="flex: 1; ${task.completed ? 'text-decoration: line-through; color: #6b7280;' : ''}">${task.time} – ${task.task}</span>
        </div>`;
      todoContainer.appendChild(div);
    });
  }
}

// Use shared logout function from auth.js
// logoutUser() is now defined in auth.js