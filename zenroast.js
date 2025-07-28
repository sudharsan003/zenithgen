// 🚀 Load stored distraction and thought data from zendata
let distractions = zendata.get("zenroast.distractions") || 0;
let entries = zendata.get("zenroast.entries") || [];
let focusStreak = zendata.get("zenroast.focusStreak") || 0;

// Session tracking variables
let awayStart = null;
let sessionStart = zendata.get("zenroast.session.start") ? new Date(zendata.get("zenroast.session.start")) : new Date();
let totalAwayTime = zendata.get("zenroast.session.totalAwayTime") || 0;
let tabSwitches = zendata.get("zenroast.tabSwitches") || 0;
let awayTimes = zendata.get("zenroast.awayTimes") || [];

// Productivity tips array
const productivityTips = [
  "💡 Try the Pomodoro Technique: 25 minutes focused work, 5 minute break!",
  "🎯 Set specific goals for each work session to maintain focus.",
  "🔕 Turn off non-essential notifications to minimize distractions.",
  "🌱 Take regular breaks to keep your mind fresh and focused.",
  "📱 Keep your phone in another room while working.",
  "🎵 Try instrumental music or white noise to improve concentration.",
  "🌅 Work during your peak energy hours for maximum productivity.",
  "📝 Write down distracting thoughts to address them later.",
  "🧘 Practice mindfulness meditation to strengthen focus.",
  "🎨 Use the two-minute rule: if it takes less than 2 minutes, do it now!"
];

document.addEventListener("DOMContentLoaded", () => {
  // Initialize session start time if not already set
  if (!zendata.get("zenroast.session.start")) {
    zendata.set("zenroast.session.start", new Date().toISOString());
  }
  
  updateStats();
  loadEntries();
  updateFocusStreak();
  showDailyTip();
  startSessionTimer();

  // 🔔 Ask notification permission if not already granted or denied
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("✅ Notification permission granted.");
        showToast("Welcome back! Ready to stay focused? 🎯", "success");
      } else {
        console.log("❌ Notification permission denied or dismissed.");
      }
    });
  }

  // Verify data persistence
  console.log("📊 ZenRoast data loaded:", zendata.getPage('zenroast'));
});

// 🎯 Track user focus shifts (tab switch)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    awayStart = new Date();
  } else {
    if (awayStart) {
      const awayTime = Math.floor((new Date() - awayStart) / 1000);
      totalAwayTime += awayTime;
      tabSwitches++;
      distractions++;
      awayTimes.push(awayTime);
      
      // Update zendata with new values
      zendata.update("zenroast", (data) => {
        data.distractions = distractions;
        data.tabSwitches = tabSwitches;
        data.awayTimes = awayTimes;
        data.session.totalAwayTime = totalAwayTime;
      });
      
      // Verify data was saved
      console.log("💾 Data saved after distraction:", {
        distractions: zendata.get("zenroast.distractions"),
        tabSwitches: zendata.get("zenroast.tabSwitches"),
        awayTimes: zendata.get("zenroast.awayTimes").length,
        totalAwayTime: zendata.get("zenroast.session.totalAwayTime")
      });
      
      updateStats();

      // 💬 Sarcastic roast quotes
      const quotes = [
        "Wow. That Insta scroll changed your life, huh?",
        "Oh look who's back from Reels Rehab!",
        "You're training to be a goldfish, right?",
        "If excuses burned calories, you'd be shredded.",
        "Distraction level: God-tier 💀",
        "Your focus is buffering... try again.",
        "That notification must have been *urgent*, huh?",
        "Was it worth it? Be honest.",
        "New achievement unlocked: Attention span of a potato.",
        "AI is watching. And judging.",
        "Another victory for social media! 📱",
        "Focus.exe has stopped working.",
        "Congratulations! You just fed the algorithm.",
        "That was a productive 30 seconds of work! 🙄",
        "Breaking news: Your attention span just set a new record... for shortest time."
      ];

      const roast = quotes[Math.floor(Math.random() * quotes.length)];

      // 😏 Show roast in sarcasm box
      const sarcasmBox = document.getElementById("sarcasm-box");
      const sarcasmContent = document.getElementById("sarcasm-content");
      
      if (sarcasmBox && sarcasmContent) {
        sarcasmContent.textContent = roast;
        sarcasmBox.classList.remove("d-none");
      }

      // 🔔 Show browser notification if permission is granted
      if (Notification.permission === "granted") {
        try {
          new Notification("Caught you! 👀", {
            body: roast,
            icon: "/favicon.ico"
          });
        } catch (error) {
          console.error("Failed to send browser notification:", error);
        }
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Caught you! 👀", {
              body: roast,
              icon: "/favicon.ico"
            });
          }
        });
      }

      // Show toast notification
      showToast(`Distraction detected! Away for ${awayTime}s`, "warning");

      awayStart = null;
    }
  }
});

// Update all statistics
function updateStats() {
  document.getElementById("distractions").textContent = distractions;
  
  // Update distraction rate
  const sessionMinutes = Math.max(1, Math.floor((new Date() - sessionStart) / 60000));
  const distractionRate = Math.min(100, Math.floor((distractions / sessionMinutes) * 10));
  document.getElementById("distraction-rate").textContent = `${distractionRate}`;
  
  // Update focus score
  const focusScore = Math.max(0, 100 - (distractions * 5));
  document.getElementById("focus-score").textContent = focusScore;
  updateScoreRing(focusScore);
  
  // Update tab switches
  document.getElementById("tab-switches").textContent = tabSwitches;
  
  // Update average away time
  const avgAway = awayTimes.length > 0 ? Math.floor(awayTimes.reduce((a, b) => a + b, 0) / awayTimes.length) : 0;
  document.getElementById("avg-away").textContent = `${avgAway}s`;
}

// Update focus score ring
function updateScoreRing(score) {
  const circle = document.getElementById("score-circle");
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  
  // Change color based on score
  if (score >= 80) {
    circle.style.stroke = "#22c55e";
  } else if (score >= 60) {
    circle.style.stroke = "#f59e0b";
  } else {
    circle.style.stroke = "#ef4444";
  }
}

// Start session timer
function startSessionTimer() {
  setInterval(() => {
    const sessionMinutes = Math.floor((new Date() - sessionStart) / 60000);
    document.getElementById("session-time").textContent = `${sessionMinutes}m`;
  }, 1000);
}

// Update focus streak
function updateFocusStreak() {
  const today = new Date().toDateString();
  const lastStreakDate = zendata.get("zenroast.lastStreakDate");
  
  if (lastStreakDate !== today) {
    // Reset streak if it's a new day and user had distractions yesterday
    const yesterdayDistractions = zendata.get("zenroast.yesterdayDistractions") || 0;
    
    zendata.update("zenroast", (data) => {
      if (yesterdayDistractions > 5) {
        data.focusStreak = 0;
      } else {
        data.focusStreak++;
      }
      data.lastStreakDate = today;
    });
    
    // Update local variable after zendata update
    focusStreak = zendata.get("zenroast.focusStreak");
  }
  
  document.getElementById("focus-streak").textContent = `${focusStreak} day streak`;
}

// Show daily productivity tip
function showDailyTip() {
  const today = new Date().getDate();
  const tipIndex = today % productivityTips.length;
  document.getElementById("daily-tip").innerHTML = `<p>${productivityTips[tipIndex]}</p>`;
}

// 🧠 Save user thoughts
function saveThought() {
  const thought = document.getElementById("thoughts").value.trim();
  if (!thought) {
    showToast("Please enter your thoughts first!", "error");
    return;
  }

  const logList = document.getElementById("log-list");
  const li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between align-items-start";
  const timestamp = new Date().toLocaleString();
  
  li.innerHTML = `
    <div>
      <strong>${timestamp}</strong><br>
      ${thought}
    </div>
    <button class="btn btn-sm btn-outline-danger" onclick="removeEntry(this)">
      <i data-lucide="trash-2"></i>
    </button>
  `;
  
  if (logList.children[0]?.textContent.includes("No entries yet")) {
    logList.innerHTML = "";
  }
  
  logList.prepend(li);

  // Add entry to zendata
  const entryObj = { text: thought, time: timestamp, id: Date.now() };
  zendata.push("zenroast", "entries", entryObj);
  
  // Update local entries array
  entries = zendata.get("zenroast.entries");

  document.getElementById("thoughts").value = "";
  showToast("Thought saved successfully! 💭", "success");
  
  // Reinitialize Lucide icons for new buttons
  lucide.createIcons();
}

// Clear thoughts textarea
function clearThoughts() {
  document.getElementById("thoughts").value = "";
  showToast("Cleared thoughts textarea", "info");
}

// Remove individual entry
function removeEntry(button) {
  const listItem = button.closest("li");
  const timestamp = listItem.querySelector("strong").textContent;
  
  // Remove from zendata
  zendata.remove("zenroast", "entries", (entry) => entry.time === timestamp);
  
  // Update local entries array
  entries = zendata.get("zenroast.entries");
  
  // Remove from DOM
  listItem.remove();
  
  // Check if no entries left
  if (entries.length === 0) {
    document.getElementById("log-list").innerHTML = '<li class="list-group-item text-muted">No entries yet...</li>';
  }
  
  showToast("Entry removed", "info");
}

// 🔁 Load all previous thoughts
function loadEntries() {
  const logList = document.getElementById("log-list");
  logList.innerHTML = "";
  
  if (entries.length === 0) {
    logList.innerHTML = '<li class="list-group-item text-muted">No entries yet...</li>';
    return;
  }
  
  entries.forEach(entry => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-start";
    li.innerHTML = `
      <div>
        <strong>${entry.time}</strong><br>
        ${entry.text}
      </div>
      <button class="btn btn-sm btn-outline-danger" onclick="removeEntry(this)">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    logList.appendChild(li);
  });
  
  // Initialize Lucide icons for loaded buttons
  lucide.createIcons();
}

// Dismiss roast message
function dismissRoast() {
  document.getElementById("sarcasm-box").classList.add("d-none");
  showToast("Roast dismissed. Don't let it happen again! 😏", "info");
}

// Export logs as JSON
function exportLogs() {
  if (entries.length === 0) {
    showToast("No entries to export!", "error");
    return;
  }
  
  const dataStr = JSON.stringify(entries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `zenroast-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  showToast("Logs exported successfully! 📁", "success");
}

// Logout function
function logoutUser() {
  // Save today's distractions for streak calculation
  zendata.set("zenroast.yesterdayDistractions", distractions);
  
  // Clear session data but keep historical data
  localStorage.removeItem('zenUser');
  showToast("Logging out... Stay focused! 👋", "info");
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Toast notification system
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
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
      <strong class="me-auto">ZenRoast</strong>
      <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Update time away display in real-time
setInterval(() => {
  if (awayStart) {
    const currentAwayTime = Math.floor((new Date() - awayStart) / 1000);
    document.getElementById("away-time").textContent = currentAwayTime;
    
    // Update progress bar
    const maxTime = 60; // 60 seconds max for progress bar
    const progress = Math.min(100, (currentAwayTime / maxTime) * 100);
    document.getElementById("time-progress").style.width = `${progress}%`;
    
    // Change color based on time away
    const progressBar = document.getElementById("time-progress");
    if (currentAwayTime > 30) {
      progressBar.className = "progress-bar bg-danger";
    } else if (currentAwayTime > 15) {
      progressBar.className = "progress-bar bg-warning";
    } else {
      progressBar.className = "progress-bar bg-info";
    }
  }
}, 1000);


