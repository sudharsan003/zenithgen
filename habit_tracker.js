// Load habits from zendata
let habits = zendata.get('habits.trackers') || [];

document.addEventListener("DOMContentLoaded", () => {
  renderHabits();
  updateStats();
  
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Verify data loaded
  console.log("📊 Habits loaded:", zendata.get('habits.trackers'));
});

function addHabit() {
  const nameInput = document.getElementById("habit-name");
  if (!nameInput) {
    console.warn("Habit name input element not found");
    return;
  }
  
  const habitName = nameInput.value.trim();
  if (!habitName) {
    showToast("Please enter a habit name", "error");
    return;
  }

  const newHabit = {
    id: Date.now(),
    name: habitName,
    streak: 0,
    longestStreak: 0,
    lastCheck: null,
    createdAt: new Date().toISOString(),
    totalCheckins: 0,
    category: detectCategory(habitName)
  };

  // Add habit to zendata
  zendata.push('habits', 'trackers', newHabit);
  
  // Update local habits array
  habits = zendata.get('habits.trackers');
  
  nameInput.value = "";
  renderHabits();
  updateStats();
  showToast("Habit added successfully! 🎉");
  
  // Verify habit saved
  console.log("💾 Habit saved:", newHabit);
}

function quickAddHabit(habitName) {
  const newHabit = {
    id: Date.now(),
    name: habitName,
    streak: 0,
    longestStreak: 0,
    lastCheck: null,
    createdAt: new Date().toISOString(),
    totalCheckins: 0,
    category: detectCategory(habitName)
  };

  // Add habit to zendata
  zendata.push('habits', 'trackers', newHabit);
  
  // Update local habits array
  habits = zendata.get('habits.trackers');
  
  renderHabits();
  updateStats();
  showToast("Habit added successfully! 🎉");
}

function detectCategory(habitName) {
  const categories = {
    health: ['water', 'exercise', 'sleep', 'meditate', 'yoga', 'workout', 'gym'],
    learning: ['read', 'study', 'learn', 'practice', 'book', 'course'],
    productivity: ['wake', 'work', 'organize', 'plan', 'schedule', 'task'],
    wellness: ['journal', 'gratitude', 'relax', 'breathe', 'mindful']
  };

  for (let category in categories) {
    if (categories[category].some(keyword => 
      habitName.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

function deleteHabit(id) {
  if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
    // Remove habit from zendata
    zendata.remove('habits', 'trackers', (habit) => habit.id === id);
    
    // Update local habits array
    habits = zendata.get('habits.trackers');
    
    renderHabits();
    updateStats();
    showToast("Habit deleted successfully");
  }
}

function editHabit(id) {
  const habit = habits.find(h => h.id === id);
  const newName = prompt('Edit habit name:', habit.name);
  if (newName && newName.trim()) {
    // Update habit in zendata
    zendata.update('habits', (data) => {
      const habitToUpdate = data.trackers.find(h => h.id === id);
      if (habitToUpdate) {
        habitToUpdate.name = newName.trim();
        habitToUpdate.category = detectCategory(newName);
      }
    });
    
    // Update local habits array
    habits = zendata.get('habits.trackers');
    
    renderHabits();
    showToast("Habit updated successfully");
  }
}

function toggleCheck(id) {
  const habit = habits.find(h => h.id === id);
  const today = new Date().toDateString();
  
  // Update habit in zendata
  zendata.update('habits', (data) => {
    const habitToUpdate = data.trackers.find(h => h.id === id);
    if (!habitToUpdate) return;
    
    if (habitToUpdate.lastCheck === today) {
      // Uncheck
      habitToUpdate.streak = Math.max(0, habitToUpdate.streak - 1);
      habitToUpdate.lastCheck = null;
      habitToUpdate.totalCheckins = Math.max(0, habitToUpdate.totalCheckins - 1);
    } else {
      // Check
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (habitToUpdate.lastCheck === yesterday) {
        habitToUpdate.streak += 1;
      } else {
        habitToUpdate.streak = 1;
      }
      
      habitToUpdate.lastCheck = today;
      habitToUpdate.totalCheckins += 1;
      
      // Update longest streak if needed
      if (habitToUpdate.streak > habitToUpdate.longestStreak) {
        habitToUpdate.longestStreak = habitToUpdate.streak;
      }
    }
  });
  
  // Update local habits array
  habits = zendata.get('habits.trackers');
  const updatedHabit = habits.find(h => h.id === id);
  
  if (updatedHabit.lastCheck === today) {
    // Achievement notifications
    if (updatedHabit.streak > habit.longestStreak) {
      showAchievement(`New Record! 🏆`, `You've hit a ${updatedHabit.streak}-day streak with "${updatedHabit.name}"! Keep it up! 🔥`);
    } else if (updatedHabit.streak === 7) {
      showAchievement(`Week Warrior! 💪`, `7 days straight! You're building momentum! 🚀`);
    } else if (updatedHabit.streak === 30) {
      showAchievement(`Monthly Master! 🎯`, `30 days! You've officially built a habit! 🌟`);
    } else if (updatedHabit.streak % 10 === 0 && updatedHabit.streak > 0) {
      showAchievement(`Streak Champion! 🔥`, `${updatedHabit.streak} days straight! You're unstoppable! ⚡`);
    } else {
      showToast(`Great job! ${updatedHabit.streak} day streak! 🔥`);
    }
  } else {
    showToast("Habit unchecked");
  }

  renderHabits();
  updateStats();
}

function showAchievement(title, message) {
  const titleElement = document.getElementById('achievement-title');
  const messageElement = document.getElementById('achievement-message');
  const modalElement = document.getElementById('achievement-modal');
  
  if (titleElement) titleElement.textContent = title;
  if (messageElement) messageElement.textContent = message;
  if (modalElement) modalElement.style.display = 'flex';
}

function closeAchievement() {
  const modalElement = document.getElementById('achievement-modal');
  if (modalElement) modalElement.style.display = 'none';
}

// Toast notification system (ZenRoast style)
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = 1100;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast show toast-${type}`;
  toast.setAttribute('role', 'alert');
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  toast.innerHTML = `
    <div class="toast-header">
      <span class="me-2">${icons[type]}</span>
      <strong class="me-auto">Habit Tracker</strong>
      <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 4000);
}

function updateStats() {
  const totalHabits = habits.length;
  const activeStreaks = habits.filter(h => h.streak > 0).length;
  const longestStreak = habits.length > 0 ? Math.max(0, ...habits.map(h => h.longestStreak || 0)) : 0;
  
  const today = new Date().toDateString();
  const checkedToday = habits.filter(h => h.lastCheck === today).length;
  const completionRate = totalHabits > 0 ? Math.round((checkedToday / totalHabits) * 100) : 0;

  const totalHabitsElement = document.getElementById('total-habits');
  const activeStreaksElement = document.getElementById('active-streaks');
  const longestStreakElement = document.getElementById('longest-streak');
  const completionRateElement = document.getElementById('completion-rate');

  if (totalHabitsElement) totalHabitsElement.textContent = totalHabits;
  if (activeStreaksElement) activeStreaksElement.textContent = activeStreaks;
  if (longestStreakElement) longestStreakElement.textContent = longestStreak;
  if (completionRateElement) completionRateElement.textContent = completionRate + '%';
}

function renderHabits() {
  const list = document.getElementById("habit-list");
  const emptyState = document.getElementById("empty-state");
  
  if (!list || !emptyState) {
    console.warn("Required DOM elements not found for habit rendering");
    return;
  }
  
  if (habits.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  
  emptyState.style.display = "none";
  list.innerHTML = "";

  // Sort habits by streak (descending) and then by total check-ins
  habits.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return b.totalCheckins - a.totalCheckins;
  }).forEach((habit) => {
    const item = document.createElement("div");
    item.className = "habit-item";
    
    const today = new Date().toDateString();
    const isCheckedToday = habit.lastCheck === today;
    const progressPercentage = Math.min((habit.streak / 30) * 100, 100);
    
    // Calculate streak status
    let streakEmoji = '';
    if (habit.streak >= 30) streakEmoji = '🏆';
    else if (habit.streak >= 21) streakEmoji = '💎';
    else if (habit.streak >= 14) streakEmoji = '🔥';
    else if (habit.streak >= 7) streakEmoji = '⭐';
    else if (habit.streak >= 3) streakEmoji = '🌱';

    item.innerHTML = `
      <div class="habit-info">
        <div class="habit-name">
          ${habit.name}
          ${isCheckedToday ? '<i data-lucide="check-circle" style="color: #10b981;"></i>' : ''}
          ${streakEmoji}
        </div>
        <div class="habit-streak">
          🔥 Current: ${habit.streak} days | 🏆 Best: ${habit.longestStreak} days | ✅ Total: ${habit.totalCheckins}
        </div>
        <div class="habit-progress">
          <div class="progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <small style="color: #666; font-size: 0.85rem;">
          Progress to 30-day goal: ${progressPercentage.toFixed(1)}% | Category: ${habit.category}
        </small>
      </div>
      <div class="habit-actions">
        <button class="action-btn check-btn ${isCheckedToday ? 'checked' : ''}" onclick="toggleCheck(${habit.id})">
          <i data-lucide="${isCheckedToday ? 'undo' : 'check'}"></i>
          ${isCheckedToday ? 'Undo' : 'Check'}
        </button>
        <button class="action-btn edit-btn" onclick="editHabit(${habit.id})">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="action-btn delete-btn" onclick="deleteHabit(${habit.id})">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    list.appendChild(item);
  });
  
  // Re-initialize Lucide icons for dynamically added content
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    console.warn("Lucide icons library not loaded");
  }
}

function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

// Initialize theme based on time of day
function initializeTheme() {
  // Remove any existing brightness filter to ensure bright appearance
  if (document.body.style.filter) {
    document.body.style.filter = '';
  }
  
  // Optional: Add subtle theme adjustment without affecting brightness
  const hour = new Date().getHours();
  if (hour < 6 || hour > 20) {
    // Use a more subtle approach that doesn't affect card brightness
    document.body.style.setProperty('--theme-opacity', '0.98');
  } else {
    document.body.style.setProperty('--theme-opacity', '1');
  }
}

// Setup event listeners after DOM is loaded
function setupEventListeners() {
  const habitNameInput = document.getElementById('habit-name');
  const achievementModal = document.getElementById('achievement-modal');
  
  // Habit name input event listener
  if (habitNameInput) {
    habitNameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addHabit();
      }
    });
  }
  
  // Close modal when clicking outside
  if (achievementModal) {
    achievementModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAchievement();
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Alt + A to focus on input
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      const habitNameInput = document.getElementById('habit-name');
      if (habitNameInput) habitNameInput.focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
      closeAchievement();
    }
  });
  
  // Initialize theme
  initializeTheme();
}