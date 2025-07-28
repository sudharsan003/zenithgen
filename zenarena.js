// Global Variables
let distractions = [];
let achievements = [];
let focusStreak = 0;
let dailyChallenge = null;
let consciousBreaks = [];
let focusSessionStart = null;
let focusSessionTimer = null;
let previousTopTrigger = null;

// Sarcasm quotes for entertainment
const sarcasmQuotes = [
    "Another distraction? You're really building an impressive collection! 📱",
    "Wow, that's... definitely a choice. Time well spent? 🤔",
    "Your focus is like Wi-Fi - it comes and goes when you least expect it! 📶",
    "Achievement unlocked: Professional Procrastinator! 🏆",
    "That notification must have been REALLY important... right? 🔔",
    "Focus level: Goldfish. At least they're cute! 🐠",
    "Breaking news: You got distracted again! Shocking twist! 📰",
    "Your attention span is doing cardio - lots of quick bursts! 🏃‍♂️",
    "That was a necessary distraction... said no deadline ever! ⏰",
    "Plot twist: You chose distraction over productivity again! 🎭"
];

// Achievement definitions
const achievementDefinitions = [
    {
        id: 'first_log',
        name: 'First Step',
        description: 'Log your first distraction',
        icon: 'target',
        unlocked: false
    },
    {
        id: 'ten_logs',
        name: 'Getting Honest',
        description: 'Log 10 distractions',
        icon: 'list',
        unlocked: false
    },
    {
        id: 'social_media_warrior',
        name: 'Social Media Warrior',
        description: 'Log 5 social media distractions',
        icon: 'smartphone',
        unlocked: false
    },
    {
        id: 'self_aware',
        name: 'Self Aware',
        description: 'Identify the same trigger 3 times',
        icon: 'eye',
        unlocked: false
    },
    {
        id: 'focus_day',
        name: 'Focus Day',
        description: 'Go a full day without logging distractions',
        icon: 'award',
        unlocked: false
    },
    {
        id: 'pattern_breaker',
        name: 'Pattern Breaker',
        description: 'Log distractions in 5 different categories',
        icon: 'zap',
        unlocked: false
    }
];

// Daily challenges
const dailyChallenges = [
    {
        id: 'no_distraction_hour',
        title: 'No Distraction Hour',
        description: 'Stay focused for 1 continuous hour without logging any distractions',
        target: 60,
        type: 'time_based'
    },
    {
        id: 'mindful_breaks',
        title: 'Mindful Breaks',
        description: 'Take 5 conscious breaks instead of getting distracted',
        target: 5,
        type: 'action_based'
    },
    {
        id: 'trigger_awareness',
        title: 'Trigger Detective',
        description: 'Identify and log the trigger for every distraction today',
        target: 100,
        type: 'quality_based'
    },
    {
        id: 'limit_social',
        title: 'Social Media Limit',
        description: 'Keep total social media distractions under 30 minutes',
        target: 30,
        type: 'category_limit'
    }
];

// Category icons and colors
const categoryConfig = {
    'Social Media': { icon: '📱', color: '#3b82f6' },
    'Gaming': { icon: '🎮', color: '#8b5cf6' },
    'Food': { icon: '🍕', color: '#f59e0b' },
    'Overthinking': { icon: '🧠', color: '#ef4444' },
    'Phone': { icon: '📞', color: '#10b981' },
    'News': { icon: '📰', color: '#f97316' },
    'YouTube': { icon: '📺', color: '#dc2626' },
    'Shopping': { icon: '🛒', color: '#ec4899' },
    'Other': { icon: '🔄', color: '#6b7280' }
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadZenArenaData();
    initializePage();
    initializeTopTriggerTracking();
    updateDashboard();
    renderLogs();
    updateCharts();
    checkAchievements();
    initializeDailyChallenge();
    setupEventListeners();
    setupChallengeButtons();
});

function loadZenArenaData() {
    // Load all zenarena data from zendata
    const zenarenaData = zendata.getPage('zenarena') || {};
    
    distractions = zenarenaData.distractions || [];
    achievements = zenarenaData.achievements || [];
    focusStreak = zenarenaData.focusStreak || 0;
    dailyChallenge = zenarenaData.dailyChallenge || null;
    consciousBreaks = zenarenaData.consciousBreaks || [];
    previousTopTrigger = zenarenaData.previousTopTrigger || null;
    
    // Handle focus session start
    if (zenarenaData.focusSessionStart) {
        focusSessionStart = new Date(zenarenaData.focusSessionStart);
        // Restart timer if session was active
        if (focusSessionStart && dailyChallenge && dailyChallenge.type === 'time_based') {
            focusSessionTimer = setInterval(updateFocusProgress, 60000);
        }
    }
    
    // Verification log
    console.log('📊 ZenArena data loaded:', {
        distractions: distractions.length,
        achievements: achievements.length,
        focusStreak,
        dailyChallenge: dailyChallenge?.title || 'None',
        consciousBreaks: consciousBreaks.length,
        previousTopTrigger
    });
}

function initializePage() {
    // Set up intensity slider
    const intensitySlider = document.getElementById('distractionIntensity');
    const intensityValue = document.querySelector('.intensity-value');
    
    if (intensitySlider && intensityValue) {
        intensitySlider.addEventListener('input', function() {
            intensityValue.textContent = this.value;
        });
    }

    // Initialize charts
    initializeCharts();
}

function initializeTopTriggerTracking() {
    const today = new Date().toDateString();
    const lastTrackedDate = zendata.get('zenarena.lastTrackedDate');
    
    // Reset top trigger tracking if it's a new day
    if (lastTrackedDate !== today) {
        zendata.set('zenarena.previousTopTrigger', null);
        previousTopTrigger = null;
        zendata.set('zenarena.lastTrackedDate', today);
    } else {
        // Load previous top trigger for today
        previousTopTrigger = zendata.get('zenarena.previousTopTrigger') || null;
    }
}

function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function setupChallengeButtons() {
    // Add challenge action buttons to the challenge display
    const challengeContent = document.querySelector('.challenge-content');
    if (!challengeContent) return;
    
    // Check if buttons already exist
    if (challengeContent.querySelector('.challenge-actions')) return;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'challenge-actions';
    actionsDiv.style.marginTop = '1rem';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '0.5rem';
    actionsDiv.style.justifyContent = 'center';
    
    actionsDiv.innerHTML = `
        <button id="logBreakBtn" class="btn btn-outline-primary btn-sm" onclick="logConsciousBreak()" style="display: none;">
            <i data-lucide="coffee"></i> Log Conscious Break
        </button>
        <button id="startFocusBtn" class="btn btn-outline-success btn-sm" onclick="startFocusSession()" style="display: none;">
            <i data-lucide="play"></i> Start Focus Session
        </button>
        <button id="stopFocusBtn" class="btn btn-outline-danger btn-sm" onclick="stopFocusSession()" style="display: none;">
            <i data-lucide="square"></i> Stop Session
        </button>
    `;
    
    challengeContent.appendChild(actionsDiv);
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    updateChallengeButtons();
}

function updateChallengeButtons() {
    const logBreakBtn = document.getElementById('logBreakBtn');
    const startFocusBtn = document.getElementById('startFocusBtn');
    const stopFocusBtn = document.getElementById('stopFocusBtn');
    
    if (!logBreakBtn || !startFocusBtn || !stopFocusBtn) return;
    
    // Hide all buttons first
    logBreakBtn.style.display = 'none';
    startFocusBtn.style.display = 'none';
    stopFocusBtn.style.display = 'none';
    
    if (!dailyChallenge) return;
    
    // Show relevant button based on challenge type
    switch (dailyChallenge.type) {
        case 'action_based':
            if (dailyChallenge.id === 'mindful_breaks') {
                logBreakBtn.style.display = 'inline-flex';
            }
            break;
        case 'time_based':
            if (dailyChallenge.id === 'no_distraction_hour') {
                if (focusSessionStart) {
                    stopFocusBtn.style.display = 'inline-flex';
                } else {
                    startFocusBtn.style.display = 'inline-flex';
                }
            }
            break;
    }
}

// Conscious break logging function
function logConsciousBreak() {
    const today = new Date().toDateString();
    const todayBreaks = consciousBreaks.filter(b => b.date === today);
    
    if (todayBreaks.length >= 5) {
        showToast('Challenge Complete!', 'You\'ve already taken 5 conscious breaks today!', 'success');
        return;
    }
    
    const breakData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        date: today,
        duration: 5, // 5-minute break
        type: 'conscious_break'
    };
    
    consciousBreaks.push(breakData);
    zendata.set('zenarena.consciousBreaks', consciousBreaks);
    
    updateDailyChallenge();
    showToast('Break Logged', 'Conscious break recorded! Keep up the mindful practice.', 'success');
}

// Focus session management
function startFocusSession() {
    if (focusSessionStart) {
        showToast('Session Active', 'Focus session is already running!', 'info');
        return;
    }
    
    focusSessionStart = new Date();
    zendata.set('zenarena.focusSessionStart', focusSessionStart.toISOString());
    
    // Start timer to update progress every minute
    focusSessionTimer = setInterval(updateFocusProgress, 60000); // Update every minute
    
    updateChallengeButtons();
    updateDailyChallenge();
    showToast('Focus Session Started', 'Your 60-minute focus session has begun. Stay focused!', 'success');
}

function stopFocusSession() {
    if (!focusSessionStart) {
        showToast('No Active Session', 'No focus session is currently running.', 'info');
        return;
    }
    
    focusSessionStart = null;
    zendata.set('zenarena.focusSessionStart', null);
    
    if (focusSessionTimer) {
        clearInterval(focusSessionTimer);
        focusSessionTimer = null;
    }
    
    updateChallengeButtons();
    updateDailyChallenge();
    showToast('Session Stopped', 'Focus session has been stopped.', 'info');
}

function updateFocusProgress() {
    if (!focusSessionStart || !dailyChallenge || dailyChallenge.type !== 'time_based') return;
    
    const elapsedMinutes = Math.floor((Date.now() - focusSessionStart.getTime()) / 60000);
    const progress = Math.min(100, (elapsedMinutes / 60) * 100);
    
    if (progress >= 100) {
        // Challenge completed
        dailyChallenge.progress = 100;
        dailyChallenge.completed = true;
        stopFocusSession();
        showToast('Challenge Complete!', 'You completed the No Distraction Hour challenge!', 'success');
    } else {
        dailyChallenge.progress = progress;
    }
    
    zendata.set('zenarena.dailyChallenge', dailyChallenge);
    updateChallengeDisplay();
}

// Main logging function
function logDistraction() {
    const desc = document.getElementById('distractionDesc').value.trim();
    const type = document.getElementById('distractionType').value;
    const duration = parseInt(document.getElementById('distractionDuration').value);
    const trigger = document.getElementById('distractionTrigger').value.trim();
    const mood = document.getElementById('distractionMood').value;
    const intensity = parseInt(document.getElementById('distractionIntensity').value);

    // Validation
    if (!desc || !duration || !trigger) {
        showToast('Error', 'Please fill in all required fields', 'error');
        return;
    }

    if (duration < 1 || duration > 480) {
        showToast('Error', 'Duration must be between 1 and 480 minutes', 'error');
        return;
    }

    // Create distraction object
    const distraction = {
        id: Date.now(),
        description: desc,
        type: type,
        duration: duration,
        trigger: trigger,
        mood: mood,
        intensity: intensity,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
    };

    // Add to array and save
    distractions.unshift(distraction);
    zendata.set('zenarena.distractions', distractions);

    // If focus session is active, stop it due to distraction
    if (focusSessionStart && dailyChallenge && dailyChallenge.type === 'time_based') {
        stopFocusSession();
        showToast('Focus Session Interrupted', 'Your focus session was stopped due to a logged distraction.', 'warning');
    }

    // Show sarcasm
    showSarcasm();

    // Update everything
    updateDashboard();
    updateFocusStreak();
    renderLogs();
    updateCharts();
    checkAchievements();
    updateDailyChallenge();

    // Clear form
    clearForm();

    // Show success toast
    showToast('Distraction Logged', 'Your moment of weakness has been documented!', 'success');
}

function clearForm() {
    const descInput = document.getElementById('distractionDesc');
    const durationInput = document.getElementById('distractionDuration');
    const triggerInput = document.getElementById('distractionTrigger');
    const intensitySlider = document.getElementById('distractionIntensity');
    const intensityValue = document.querySelector('.intensity-value');
    
    if (descInput) descInput.value = '';
    if (durationInput) durationInput.value = '';
    if (triggerInput) triggerInput.value = '';
    if (intensitySlider) intensitySlider.value = 5;
    if (intensityValue) intensityValue.textContent = '5';
}

function showSarcasm() {
    const sarcasmBox = document.getElementById('sarcasmBox');
    if (!sarcasmBox) return;
    
    const randomQuote = sarcasmQuotes[Math.floor(Math.random() * sarcasmQuotes.length)];
    
    sarcasmBox.textContent = randomQuote;
    sarcasmBox.style.display = 'block';
    
    setTimeout(() => {
        sarcasmBox.style.display = 'none';
    }, 5000);
}

function updateDashboard() {
    // Add null checks for all DOM elements
    const totalTimeWastedEl = document.getElementById('totalTimeWasted');
    const totalDistractionsEl = document.getElementById('totalDistractions');
    const focusScoreEl = document.getElementById('focusScore');
    const topTriggerEl = document.getElementById('topTrigger');
    const focusStreakEl = document.getElementById('focusStreak');
    
    if (!totalTimeWastedEl || !totalDistractionsEl || !focusScoreEl || !topTriggerEl || !focusStreakEl) {
        console.warn('Some dashboard elements not found');
        return;
    }
    
    const today = new Date().toDateString();
    const todayDistractions = distractions.filter(d => d.date === today);
    
    // Calculate stats
    const totalTimeWasted = todayDistractions.reduce((sum, d) => sum + d.duration, 0);
    const totalDistractions = todayDistractions.length;
    const focusScore = Math.max(0, 100 - (totalTimeWasted / 10)); // Rough calculation
    
    // Find top trigger with enhanced logic
    const triggerCounts = {};
    todayDistractions.forEach(d => {
        if (d.trigger && d.trigger.trim()) {
            triggerCounts[d.trigger] = (triggerCounts[d.trigger] || 0) + 1;
        }
    });
    
    let topTrigger = 'None';
    let topTriggerCount = 0;
    
    if (Object.keys(triggerCounts).length > 0) {
        const sortedTriggers = Object.entries(triggerCounts)
            .sort(([,a], [,b]) => b - a); // Sort by count descending
        topTrigger = sortedTriggers[0][0];
        topTriggerCount = sortedTriggers[0][1];
    }

    // Update DOM
    totalTimeWastedEl.textContent = totalTimeWasted;
    totalDistractionsEl.textContent = totalDistractions;
    focusScoreEl.textContent = Math.round(focusScore);
    
    // Update top trigger with visual feedback and count
    if (topTrigger !== 'None' && topTriggerCount > 1) {
        topTriggerEl.textContent = `${topTrigger} (${topTriggerCount}x)`;
    } else {
        topTriggerEl.textContent = topTrigger;
    }
    
    // Check for top trigger change and provide enhanced feedback
    if (topTrigger !== previousTopTrigger && previousTopTrigger !== null) {
        // Visual highlight effect on the stat card containing the top trigger
        const topTriggerCard = topTriggerEl.closest('.stat-card');
        if (topTriggerCard) {
            topTriggerCard.style.animation = 'triggerHighlight 0.8s ease-in-out';
            setTimeout(() => {
                topTriggerCard.style.animation = '';
            }, 800);
        }
        
        // Show contextual toast based on the change
        let toastMessage = '';
        if (topTrigger === 'None') {
            toastMessage = 'Great job! No distractions logged today.';
        } else if (previousTopTrigger === 'None') {
            toastMessage = `First distraction logged: "${topTrigger}". Stay aware!`;
        } else {
            toastMessage = `Top trigger changed from "${previousTopTrigger}" to "${topTrigger}" (${topTriggerCount}x today)`;
        }
        
        showToast('Top Trigger Update', toastMessage, 'info');
        
        // Update previous trigger
        previousTopTrigger = topTrigger;
        zendata.set('zenarena.previousTopTrigger', topTrigger);
    } else if (previousTopTrigger === null && topTrigger !== 'None') {
        // First time setting a trigger
        previousTopTrigger = topTrigger;
        zendata.set('zenarena.previousTopTrigger', topTrigger);
    }
    
    focusStreakEl.textContent = `${focusStreak} day focus streak`;

    // Update insights
    updateInsights();
}

function updateFocusStreak() {
    const today = new Date().toDateString();
    const todayDistractions = distractions.filter(d => d.date === today);
    
    // Simple logic: if no distractions today, increment streak
    if (todayDistractions.length === 0) {
        focusStreak++;
    } else {
        // Reset streak if had distractions
        focusStreak = 0;
    }
    
    zendata.set('zenarena.focusStreak', focusStreak);
    
    // Update DOM if element exists
    const focusStreakEl = document.getElementById('focusStreak');
    if (focusStreakEl) {
        focusStreakEl.textContent = `${focusStreak} day focus streak`;
    }
}

function renderLogs() {
    const container = document.getElementById('logsContainer');
    if (!container) {
        console.warn('Logs container not found');
        return;
    }
    
    if (distractions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="target"></i>
                <p>No distractions logged yet. Stay focused! 🎯</p>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        return;
    }

    const recentDistractions = distractions.slice(0, 10);
    
    container.innerHTML = recentDistractions.map(distraction => {
        const timeAgo = getTimeAgo(new Date(distraction.timestamp));
        const categoryIcon = categoryConfig[distraction.type]?.icon || '🔄';
        
        return `
            <div class="log-item" data-category="${distraction.type}">
                <div class="log-icon">${categoryIcon}</div>
                <div class="log-content">
                    <div class="log-title">${distraction.description}</div>
                    <div class="log-details">
                        ${distraction.type} • ${distraction.duration} min • 
                        Trigger: ${distraction.trigger} • Mood: ${distraction.mood}
                        • Intensity: ${distraction.intensity}/10
                    </div>
                    <div class="log-time">${timeAgo}</div>
                </div>
                <div class="log-actions">
                    <button class="log-action" onclick="editDistraction(${distraction.id})" title="Edit">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="log-action" onclick="deleteDistraction(${distraction.id})" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

function editDistraction(id) {
    const distraction = distractions.find(d => d.id === id);
    if (!distraction) {
        showToast('Error', 'Distraction not found', 'error');
        return;
    }
    
    // Get form elements
    const descInput = document.getElementById('distractionDesc');
    const typeSelect = document.getElementById('distractionType');
    const durationInput = document.getElementById('distractionDuration');
    const triggerInput = document.getElementById('distractionTrigger');
    const moodSelect = document.getElementById('distractionMood');
    const intensitySlider = document.getElementById('distractionIntensity');
    const intensityValue = document.querySelector('.intensity-value');
    
    // Check if all elements exist
    if (!descInput || !typeSelect || !durationInput || !triggerInput || !moodSelect || !intensitySlider || !intensityValue) {
        showToast('Error', 'Form elements not found', 'error');
        return;
    }
    
    // Populate form with existing data
    descInput.value = distraction.description;
    typeSelect.value = distraction.type;
    durationInput.value = distraction.duration;
    triggerInput.value = distraction.trigger;
    moodSelect.value = distraction.mood;
    intensitySlider.value = distraction.intensity;
    intensityValue.textContent = distraction.intensity;
    
    // Remove old entry
    distractions = distractions.filter(d => d.id !== id);
    zendata.set('zenarena.distractions', distractions);
    
    // Update UI
    updateDashboard();
    updateFocusStreak();
    renderLogs();
    updateCharts();
    
    showToast('Edit Mode', 'Update the form and click "Log Distraction" to save changes', 'success');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function deleteDistraction(id) {
    if (confirm('Are you sure you want to delete this distraction?')) {
        distractions = distractions.filter(d => d.id !== id);
        zendata.set('zenarena.distractions', distractions);
        updateDashboard();
        updateFocusStreak();
        renderLogs();
        updateCharts();
        showToast('Deleted', 'Distraction removed from your log', 'success');
    }
}

function clearAllLogs() {
    if (confirm('Are you sure you want to clear all distractions? This cannot be undone.')) {
        distractions = [];
        zendata.set('zenarena.distractions', distractions);
        updateDashboard();
        updateFocusStreak();
        renderLogs();
        updateCharts();
        showToast('Cleared', 'All distractions have been cleared', 'success');
    }
}

// Charts
let categoryChart = null;
let timeChart = null;

function initializeCharts() {
    const categoryCtx = document.getElementById('categoryChart');
    const timeCtx = document.getElementById('timeChart');
    
    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#374151', // Updated to match Habit Tracker style
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    if (timeCtx) {
        timeChart = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Distractions per Hour',
                    data: [],
                    borderColor: '#8b5cf6', // Updated to match theme
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#374151' // Updated to match Habit Tracker style
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#6b7280' }, // Updated colors
                        grid: { color: 'rgba(107, 114, 128, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#6b7280' }, // Updated colors
                        grid: { color: 'rgba(107, 114, 128, 0.1)' }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    updateCategoryChart();
    updateTimeChart();
}

function updateCategoryChart() {
    if (!categoryChart) return;
    
    const categoryCounts = {};
    distractions.forEach(d => {
        categoryCounts[d.type] = (categoryCounts[d.type] || 0) + 1;
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const colors = labels.map(label => categoryConfig[label]?.color || '#6b7280');
    
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.update();
}

function updateTimeChart() {
    if (!timeChart) return;
    
    const hourlyData = new Array(24).fill(0);
    const today = new Date().toDateString();
    const todayDistractions = distractions.filter(d => d.date === today);
    
    todayDistractions.forEach(d => {
        const hour = new Date(d.timestamp).getHours();
        hourlyData[hour]++;
    });
    
    const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    timeChart.data.labels = labels;
    timeChart.data.datasets[0].data = hourlyData;
    timeChart.update();
}

// Achievements system
function checkAchievements() {
    achievementDefinitions.forEach(achievement => {
        if (!achievements.includes(achievement.id)) {
            let unlocked = false;
            
            switch (achievement.id) {
                case 'first_log':
                    unlocked = distractions.length >= 1;
                    break;
                case 'ten_logs':
                    unlocked = distractions.length >= 10;
                    break;
                case 'social_media_warrior':
                    unlocked = distractions.filter(d => d.type === 'Social Media').length >= 5;
                    break;
                case 'self_aware':
                    const triggerCounts = {};
                    distractions.forEach(d => {
                        triggerCounts[d.trigger] = (triggerCounts[d.trigger] || 0) + 1;
                    });
                    unlocked = Object.values(triggerCounts).some(count => count >= 3);
                    break;
                case 'focus_day':
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toDateString();
                    unlocked = distractions.filter(d => d.date === yesterdayStr).length === 0;
                    break;
                case 'pattern_breaker':
                    const uniqueCategories = [...new Set(distractions.map(d => d.type))];
                    unlocked = uniqueCategories.length >= 5;
                    break;
            }
            
            if (unlocked) {
                achievements.push(achievement.id);
                zendata.set('zenarena.achievements', achievements);
                showToast('Achievement Unlocked!', `${achievement.name}: ${achievement.description}`, 'success');
            }
        }
    });
    
    renderAchievements();
}

function renderAchievements() {
    const container = document.getElementById('achievementsContent');
    if (!container) {
        console.warn('Achievements container not found');
        return;
    }
    
    container.innerHTML = achievementDefinitions.map(achievement => {
        const isUnlocked = achievements.includes(achievement.id);
        return `
            <div class="achievement ${isUnlocked ? 'unlocked' : 'locked'}">
                <i data-lucide="${achievement.icon}"></i>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Daily challenge system
function initializeDailyChallenge() {
    const today = new Date().toDateString();
    
    if (!dailyChallenge || dailyChallenge.date !== today) {
        // Generate new daily challenge
        const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
        dailyChallenge = {
            ...randomChallenge,
            date: today,
            progress: 0,
            completed: false
        };
        zendata.set('zenarena.dailyChallenge', dailyChallenge);
    }
    
    updateChallengeDisplay();
    updateChallengeButtons();
}

function updateDailyChallenge() {
    if (!dailyChallenge || dailyChallenge.completed) return;
    
    const today = new Date().toDateString();
    const todayDistractions = distractions.filter(d => d.date === today);
    
    switch (dailyChallenge.type) {
        case 'time_based':
            if (dailyChallenge.id === 'no_distraction_hour') {
                if (focusSessionStart) {
                    const elapsedMinutes = Math.floor((Date.now() - focusSessionStart.getTime()) / 60000);
                    dailyChallenge.progress = Math.min(100, (elapsedMinutes / 60) * 100);
                    
                    if (dailyChallenge.progress >= 100) {
                        dailyChallenge.completed = true;
                        showToast('Challenge Complete!', `You completed today's challenge: ${dailyChallenge.title}`, 'success');
                    }
                } else {
                    dailyChallenge.progress = 0;
                }
            }
            break;
        case 'action_based':
            if (dailyChallenge.id === 'mindful_breaks') {
                const todayBreaks = consciousBreaks.filter(b => b.date === today);
                dailyChallenge.progress = Math.min(100, (todayBreaks.length / 5) * 100);
                
                if (dailyChallenge.progress >= 100) {
                    dailyChallenge.completed = true;
                    showToast('Challenge Complete!', `You completed today's challenge: ${dailyChallenge.title}`, 'success');
                }
            }
            break;
        case 'category_limit':
            if (dailyChallenge.id === 'limit_social') {
                const socialMediaTime = todayDistractions
                    .filter(d => d.type === 'Social Media')
                    .reduce((sum, d) => sum + d.duration, 0);
                dailyChallenge.progress = Math.min(100, (socialMediaTime / dailyChallenge.target) * 100);
            }
            break;
        case 'quality_based':
            if (dailyChallenge.id === 'trigger_awareness') {
                const triggersLogged = todayDistractions.filter(d => d.trigger && d.trigger.trim()).length;
                dailyChallenge.progress = Math.min(100, (triggersLogged / todayDistractions.length) * 100);
            }
            break;
    }
    
    zendata.set('zenarena.dailyChallenge', dailyChallenge);
    updateChallengeDisplay();
    updateChallengeButtons();
}

function updateChallengeDisplay() {
    if (!dailyChallenge) return;
    
    const titleEl = document.getElementById('challengeTitle');
    const descEl = document.getElementById('challengeDesc');
    const progressEl = document.getElementById('challengeProgress');
    const progressTextEl = document.getElementById('challengeProgressText');
    
    if (!titleEl || !descEl || !progressEl || !progressTextEl) {
        console.warn('Challenge display elements not found');
        return;
    }
    
    titleEl.textContent = dailyChallenge.title;
    descEl.textContent = dailyChallenge.description;
    progressEl.style.width = `${dailyChallenge.progress}%`;
    progressTextEl.textContent = `${Math.round(dailyChallenge.progress)}% Complete`;
}

// Insights generation
function updateInsights() {
    const container = document.getElementById('insightsContent');
    if (!container) {
        console.warn('Insights container not found');
        return;
    }
    
    const insights = generateInsights();
    
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="insight-item">
                <i data-lucide="brain"></i>
                <span>Start tracking to get personalized insights</span>
            </div>
        `;
    } else {
        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i data-lucide="${insight.icon}"></i>
                <span>${insight.text}</span>
            </div>
        `).join('');
    }
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

function generateInsights() {
    if (distractions.length < 3) return [];
    
    const insights = [];
    const today = new Date().toDateString();
    const todayDistractions = distractions.filter(d => d.date === today);
    
    // Most common category
    const categoryCounts = {};
    distractions.forEach(d => {
        categoryCounts[d.type] = (categoryCounts[d.type] || 0) + 1;
    });
    const topCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b
    );
    insights.push({
        icon: 'trending-up',
        text: `Your most common distraction is ${topCategory}`
    });
    
    // Peak distraction time
    const hourCounts = {};
    distractions.forEach(d => {
        const hour = new Date(d.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    if (Object.keys(hourCounts).length > 0) {
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        insights.push({
            icon: 'clock',
            text: `You're most distracted around ${peakHour}:00`
        });
    }
    
    // Mood correlation
    const stressedDistractions = distractions.filter(d => 
        ['Stressed', 'Anxious', 'Tired'].includes(d.mood)
    ).length;
    if (stressedDistractions > distractions.length * 0.4) {
        insights.push({
            icon: 'heart',
            text: 'Many distractions happen when you\'re stressed. Try relaxation techniques.'
        });
    }
    
    return insights;
}

// Export functionality
function exportData() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function performExport() {
    const includeStats = document.getElementById('includeStats')?.checked || false;
    const includeCharts = document.getElementById('includeCharts')?.checked || false;
    const includeInsights = document.getElementById('includeInsights')?.checked || false;
    const format = document.getElementById('exportFormat')?.value || 'json';
    
    const exportData = {
        timestamp: new Date().toISOString(),
        distractions: distractions
    };
    
    if (includeStats) {
        exportData.stats = {
            totalDistractions: distractions.length,
            totalTime: distractions.reduce((sum, d) => sum + d.duration, 0),
            focusStreak: focusStreak,
            achievements: achievements
        };
    }
    
    if (includeInsights) {
        exportData.insights = generateInsights();
    }
    
    let content, filename, mimeType;
    
    switch (format) {
        case 'json':
            content = JSON.stringify(exportData, null, 2);
            filename = `zenarena-export-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
        case 'csv':
            content = convertToCSV(distractions);
            filename = `zenarena-export-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        case 'txt':
            content = convertToText(exportData);
            filename = `zenarena-export-${new Date().toISOString().split('T')[0]}.txt`;
            mimeType = 'text/plain';
            break;
    }
    
    downloadFile(content, filename, mimeType);
    closeModal('exportModal');
    showToast('Export Complete', 'Your data has been exported successfully', 'success');
}

function convertToCSV(data) {
    const headers = ['Date', 'Time', 'Description', 'Category', 'Duration (min)', 'Trigger', 'Mood', 'Intensity'];
    const rows = data.map(d => [
        new Date(d.timestamp).toDateString(),
        new Date(d.timestamp).toLocaleTimeString(),
        d.description,
        d.type,
        d.duration,
        d.trigger,
        d.mood,
        d.intensity
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

function convertToText(data) {
    let text = `ZenArena Export Report\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (data.stats) {
        text += `STATISTICS:\n`;
        text += `Total Distractions: ${data.stats.totalDistractions}\n`;
        text += `Total Time Lost: ${data.stats.totalTime} minutes\n`;
        text += `Focus Streak: ${data.stats.focusStreak} days\n`;
        text += `Achievements Unlocked: ${data.stats.achievements.length}\n\n`;
    }
    
    text += `DISTRACTIONS:\n`;
    data.distractions.forEach(d => {
        text += `${new Date(d.timestamp).toLocaleString()}: ${d.description} (${d.type}, ${d.duration}min)\n`;
        text += `  Trigger: ${d.trigger}, Mood: ${d.mood}, Intensity: ${d.intensity}/10\n\n`;
    });
    
    return text;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Toast notifications
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${icon}" class="toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i data-lucide="x"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data but keep distraction data
        sessionStorage.clear();
        showToast('Logged Out', 'You have been logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}
