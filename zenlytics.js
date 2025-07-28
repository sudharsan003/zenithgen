// ZenLytics Analytics Dashboard
(function() {
  'use strict';

  // Global data reference to fix synchronization issues
  let currentData = null;
  
  // Chart instances
  let moodTrendsChart, focusPatternChart, habitBreakdownChart;

  // Mock data - replace with real data later
  const mockData = {
    moodTrends: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Mood Score',
        data: [8, 7, 9, 6, 8, 9, 7],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    focusPatterns: {
      labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
      datasets: [{
        label: 'Peak Hours',
        data: [2, 8, 4, 6, 3, 1],
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: '#ec4899',
        borderWidth: 2
      }, {
        label: 'Low Hours',
        data: [1, 3, 2, 4, 2, 0],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: '#a855f7',
        borderWidth: 2
      }]
    },
    habitBreakdown: {
      labels: ['Exercise', 'Reading', 'Meditation', 'Coding', 'Writing'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#a855f7',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#3b82f6'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    taskCompletion: {
      daily: 85,
      weekly: 78,
      monthly: 92
    },
    focusHours: [
      { time: '9:00 AM', score: 95 },
      { time: '2:00 PM', score: 87 },
      { time: '7:00 PM', score: 76 }
    ],
    achievements: [
      { id: 'streak', title: '7-Day Streak', achieved: true },
      { id: 'bookworm', title: 'Bookworm', achieved: true },
      { id: 'speed', title: 'Speed Demon', achieved: false },
      { id: 'precision', title: 'Precision', achieved: true },
      { id: 'early', title: 'Early Bird', achieved: false },
      { id: 'focus', title: 'Diamond Focus', achieved: false }
    ],
    productivityHeatmap: generateMockHeatmapData(),
    streakLeaderboard: [
      { name: 'Daily Exercise', streak: 23, icon: '🔥' },
      { name: 'Reading Habit', streak: 18, icon: '📚' },
      { name: 'Meditation', streak: 12, icon: '🧘' }
    ]
  };

  // Generate mock heatmap data (7 days x 24 hours)
  function generateMockHeatmapData() {
    const data = [];
    for (let day = 0; day < 7; day++) {
      const dayData = [];
      for (let hour = 0; hour < 24; hour++) {
        // Generate realistic productivity patterns
        let intensity = 0;
        
        // Weekdays (0-4) are more productive
        if (day < 5) {
          // Peak hours: 9-11 AM and 2-4 PM
          if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
            intensity = Math.floor(Math.random() * 4) + 6; // 6-9
          } else if (hour >= 8 && hour <= 18) {
            intensity = Math.floor(Math.random() * 3) + 3; // 3-5
          } else {
            intensity = Math.floor(Math.random() * 2); // 0-1
          }
        } else {
          // Weekends are less productive
          if (hour >= 10 && hour <= 16) {
            intensity = Math.floor(Math.random() * 3) + 2; // 2-4
          } else {
            intensity = Math.floor(Math.random() * 2); // 0-1
          }
        }
        
        dayData.push(intensity);
      }
      data.push(dayData);
    }
    return data;
  }

  // Heatmap color scale (GitHub-style)
  const heatmapColors = [
    '#ebedf0', // 0
    '#c6f6d5', // 1
    '#9ae6b4', // 2
    '#68d391', // 3
    '#48bb78', // 4
    '#38a169', // 5
    '#2f855a', // 6
    '#276749', // 7
    '#22543d', // 8
    '#1a365d'  // 9
  ];

  // ✅ FIXED: Chart.js dependency check
  function checkChartDependency() {
    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js not loaded. Please include Chart.js before zenlytics.js');
      return false;
    }
    return true;
  }

  // 🧱 ADDED: Error boundary for chart updates
  function safeChartUpdate(chart, newData, updateMode = 'none') {
    try {
      if (chart && newData) {
        chart.data = newData;
        chart.update(updateMode);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Chart update failed:', error);
      return false;
    }
  }

  // Initialize all charts
  function initializeCharts() {
    if (!checkChartDependency()) {
      console.warn('⚠️ Skipping chart initialization due to missing Chart.js');
      return;
    }
    
    initializeMoodTrendsChart();
    initializeFocusPatternChart();
    initializeHabitBreakdownChart();
  }

  // Mood Trends Chart
  function initializeMoodTrendsChart() {
    const ctx = document.getElementById('moodTrendsChart');
    if (!ctx) {
      console.warn('⚠️ Mood trends chart canvas not found');
      return;
    }

    try {
      moodTrendsChart = new Chart(ctx, {
        type: 'line',
        data: currentData.moodTrends,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: '#64748b'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: '#64748b'
              }
            }
          },
          elements: {
            point: {
              radius: 6,
              hoverRadius: 8,
              backgroundColor: '#a855f7'
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize mood trends chart:', error);
    }
  }

  // Focus Patterns Chart
  function initializeFocusPatternChart() {
    const ctx = document.getElementById('focusPatternChart');
    if (!ctx) {
      console.warn('⚠️ Focus pattern chart canvas not found');
      return;
    }

    try {
      focusPatternChart = new Chart(ctx, {
        type: 'bar',
        data: currentData.focusPatterns,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#374151',
                usePointStyle: true
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: '#64748b'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: '#64748b'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize focus pattern chart:', error);
    }
  }

  // Habit Breakdown Chart
  function initializeHabitBreakdownChart() {
    const ctx = document.getElementById('habitBreakdownChart');
    if (!ctx) {
      console.warn('⚠️ Habit breakdown chart canvas not found');
      return;
    }

    try {
      habitBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: currentData.habitBreakdown,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#374151',
                usePointStyle: true,
                padding: 15
              }
            }
          },
          cutout: '60%'
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize habit breakdown chart:', error);
    }
  }

  // Render Productivity Heatmap
  function renderProductivityHeatmap() {
    try {
      const container = document.getElementById('productivityHeatmap');
      if (!container) {
        console.warn('⚠️ Heatmap container not found');
        return;
      }
      
      const grid = container.querySelector('.zl-heatmap-grid');
      if (!grid) {
        console.warn('⚠️ Heatmap grid not found');
        return;
      }
      
      // Check if we have real data available
      if (typeof zendata !== 'undefined') {
        const zenData = zendata.getAll();
        const heatmapData = extractHeatmapData(zenData);
        
        // Check if we have real heatmap data
        const hasRealData = heatmapData.some(day => day.some(cell => cell > 0));
        
        if (hasRealData) {
          console.log('📊 Rendering heatmap with real data:', heatmapData);
          
          // Clear existing grid
          grid.innerHTML = '';
          
          // Render real heatmap data
          heatmapData.forEach((day, dayIndex) => {
            day.forEach((intensity, hourIndex) => {
              const cell = document.createElement('div');
              cell.className = 'zl-heatmap-cell';
              cell.style.backgroundColor = getHeatmapColor(intensity);
              cell.style.opacity = '0';
              cell.style.transform = 'scale(0.8)';
              grid.appendChild(cell);
            });
          });
          
          console.log('✅ Heatmap updated with real data');
        } else {
          console.log('📊 No real heatmap data, keeping existing dummy grid');
        }
      } else {
        console.log('📊 ZenData not available, using existing dummy heatmap');
      }
    } catch (error) {
      console.error('❌ Error rendering heatmap:', error);
    }
  }

  // Helper function to get heatmap color based on intensity
  function getHeatmapColor(intensity) {
    const colors = [
      '#ebedf0', // 0 - no activity
      '#c6f6d5', // 1
      '#9ae6b4', // 2
      '#68d391', // 3
      '#48bb78', // 4
      '#38a169', // 5
      '#2f855a', // 6
      '#276749', // 7
      '#22543d', // 8
      '#1a365d'  // 9 - high activity
    ];
    return colors[Math.min(intensity, colors.length - 1)];
  }

  // Render Streak Leaderboard
  function renderStreakLeaderboard() {
    try {
      const container = document.getElementById('streakLeaderboard');
      if (!container) {
        console.warn('⚠️ Leaderboard container not found');
        return;
      }
      
      // Check if we have real data available
      if (typeof zendata !== 'undefined') {
        const zenData = zendata.getAll();
        const leaderboardData = extractStreakLeaderboardData(zenData);
        
        // Check if we have real leaderboard data
        const hasRealData = leaderboardData && leaderboardData.length > 0;
        
        if (hasRealData) {
          console.log('📊 Rendering leaderboard with real data:', leaderboardData);
          
          // Clear existing items
          container.innerHTML = '';
          
          // Add real leaderboard items
          leaderboardData.forEach((item, index) => {
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = `zl-leaderboard-item ${index === 0 ? 'zl-top-streak' : ''}`;
            leaderboardItem.innerHTML = `
              <div class="zl-leaderboard-rank">${index + 1}</div>
              <div class="zl-leaderboard-icon">${item.icon}</div>
              <div class="zl-leaderboard-content">
                <div class="zl-leaderboard-name">${item.name}</div>
                <div class="zl-leaderboard-streak">${item.streak} days</div>
              </div>
            `;
            container.appendChild(leaderboardItem);
          });
          
          console.log('✅ Leaderboard updated with real data');
        } else {
          console.log('📊 No real leaderboard data, keeping existing dummy values');
        }
      } else {
        console.log('📊 ZenData not available, using existing dummy leaderboard');
      }
    } catch (error) {
      console.error('❌ Error rendering leaderboard:', error);
    }
  }

  // 🛠️ FIXED: Improved progress bar animation
  function animateProgressBars() {
    const progressFills = document.querySelectorAll('.zl-progress-fill');
    progressFills.forEach((fill, index) => {
      const originalWidth = getComputedStyle(fill).width;
      fill.style.width = '0%';
      fill.style.transition = 'width 0.8s ease-out';
      
      setTimeout(() => {
        fill.style.width = originalWidth;
      }, index * 100);
    });
  }

  // 🛠️ FIXED: Improved focus hours animation
  function animateFocusHours() {
    const focusFills = document.querySelectorAll('.zl-focus-fill');
    focusFills.forEach((fill, index) => {
      const originalWidth = getComputedStyle(fill).width;
      fill.style.width = '0%';
      fill.style.transition = 'width 0.6s ease-out';
      
      setTimeout(() => {
        fill.style.width = originalWidth;
      }, index * 150);
    });
  }

  // Update KPI cards with animation
  function animateKPICards() {
    const kpiCards = document.querySelectorAll('.zl-kpi-card');
    kpiCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'all 0.6s ease';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // Update achievements with animation
  function animateAchievements() {
    const achievements = document.querySelectorAll('.zl-achievement-item');
    achievements.forEach((achievement, index) => {
      achievement.style.opacity = '0';
      achievement.style.transform = 'scale(0.8)';
      achievement.style.transition = 'all 0.5s ease';
      
      setTimeout(() => {
        achievement.style.opacity = achievement.classList.contains('zl-achieved') ? '1' : '0.6';
        achievement.style.transform = 'scale(1)';
      }, index * 150);
    });
  }

  // 🛠️ FIXED: Optimized heatmap animation
  function animateHeatmap() {
    const cells = document.querySelectorAll('.zl-heatmap-cell');
    const batchSize = 24; // Animate by hour, not individual cells
    
    for (let hour = 0; hour < 24; hour++) {
      setTimeout(() => {
        for (let day = 0; day < 7; day++) {
          const cell = cells[day * 24 + hour];
          if (cell) {
            cell.style.transition = 'all 0.3s ease';
            cell.style.opacity = '1';
            cell.style.transform = 'scale(1)';
          }
        }
      }, hour * 10); // Much faster animation (240ms total vs 336ms)
    }
  }

  // Animate leaderboard items
  function animateLeaderboard() {
    const items = document.querySelectorAll('.zl-leaderboard-item');
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'all 0.5s ease';
      
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, index * 200);
    });
  }

  // 🔄 FIXED: Resolved data synchronization issues
  function loadData() {
    try {
      const savedData = localStorage.getItem('zenlyticsData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        currentData = { ...mockData, ...parsedData }; // Merge with defaults
        console.log('📊 Loaded saved analytics data');
        return currentData;
      }
    } catch (error) {
      console.warn('⚠️ Could not load saved data, using mock data:', error);
    }
    
    currentData = { ...mockData }; // Create a copy
    console.log('📊 Using mock analytics data');
    return currentData;
  }

  // Save data to localStorage
  function saveData(data) {
    try {
      localStorage.setItem('zenlyticsData', JSON.stringify(data));
      console.log('💾 Saved analytics data to localStorage');
    } catch (error) {
      console.warn('⚠️ Could not save data:', error);
    }
  }

  // Update charts with new data
  function updateCharts(data) {
    currentData = { ...data }; // Update global reference
    
    safeChartUpdate(moodTrendsChart, data.moodTrends);
    safeChartUpdate(focusPatternChart, data.focusPatterns);
    safeChartUpdate(habitBreakdownChart, data.habitBreakdown);
  }

  // 🔌 ADDED: ZenData integration scaffolds
  function transformZenDataToAnalytics(zenData) {
    try {
      return {
        moodTrends: extractMoodData(zenData),
        focusPatterns: extractFocusData(zenData),
        habitBreakdown: extractHabitData(zenData),
        taskCompletion: extractTaskCompletionData(zenData),
        focusHours: extractFocusHoursData(zenData),
        achievements: extractAchievementsData(zenData),
        productivityHeatmap: extractHeatmapData(zenData),
        streakLeaderboard: extractStreakLeaderboardData(zenData)
      };
    } catch (error) {
      console.error('❌ Failed to transform ZenData to analytics:', error);
      return currentData; // Fallback to current data
    }
  }

  // Data extraction functions for ZenData integration
  function extractMoodData(zenData) {
    try {
      const diaryEntries = zenData.diary?.entries || [];
      const moodScores = [];
      const labels = [];
      
      // Get last 7 days of mood data
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find entries for this date
        const dayEntries = diaryEntries.filter(entry => 
          entry.date && entry.date.startsWith(dateStr)
        );
        
        // Calculate average mood for the day (1-10 scale)
        let avgMood = 5; // Default neutral mood
        if (dayEntries.length > 0) {
          const moodSum = dayEntries.reduce((sum, entry) => {
            const mood = entry.mood || 5;
            return sum + Math.max(1, Math.min(10, mood));
          }, 0);
          avgMood = Math.round(moodSum / dayEntries.length);
        }
        
        moodScores.push(avgMood);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
      
      return {
        labels: labels,
        datasets: [{
          label: 'Mood Score',
          data: moodScores,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    } catch (error) {
      console.error('❌ Failed to extract mood data:', error);
      return currentData.moodTrends;
    }
  }

  function extractFocusData(zenData) {
    try {
      const zenroastData = zenData.zenroast || {};
      const entries = zenroastData.entries || [];
      
      // Analyze focus patterns by hour (6AM to 9PM)
      const hourLabels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
      const peakHours = new Array(6).fill(0);
      const lowHours = new Array(6).fill(0);
      
      // Map hour ranges to indices
      const hourRanges = [
        { start: 6, end: 8, index: 0 },   // 6AM
        { start: 9, end: 11, index: 1 },  // 9AM
        { start: 12, end: 14, index: 2 }, // 12PM
        { start: 15, end: 17, index: 3 }, // 3PM
        { start: 18, end: 20, index: 4 }, // 6PM
        { start: 21, end: 23, index: 5 }  // 9PM
      ];
      
      entries.forEach(entry => {
        if (entry.time) {
          const hour = new Date(entry.time).getHours();
          const range = hourRanges.find(r => hour >= r.start && hour <= r.end);
          if (range) {
            // Categorize as peak or low based on distraction type
            if (entry.text && entry.text.toLowerCase().includes('focus')) {
              peakHours[range.index]++;
            } else {
              lowHours[range.index]++;
            }
          }
        }
      });
      
      return {
        labels: hourLabels,
        datasets: [{
          label: 'Peak Hours',
          data: peakHours,
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: '#ec4899',
          borderWidth: 2
        }, {
          label: 'Low Hours',
          data: lowHours,
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: '#a855f7',
          borderWidth: 2
        }]
      };
    } catch (error) {
      console.error('❌ Failed to extract focus data:', error);
      return currentData.focusPatterns;
    }
  }

  function extractHabitData(zenData) {
    try {
      const habitsData = zenData.habits || {};
      const trackers = habitsData.trackers || [];
      
      if (trackers.length === 0) {
        return currentData.habitBreakdown;
      }
      
      // Calculate habit completion percentages
      const habitStats = trackers.map(habit => {
        const totalDays = Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const completionRate = totalDays > 0 ? (habit.totalCheckins / totalDays) * 100 : 0;
        return {
          name: habit.name,
          completion: Math.min(100, Math.round(completionRate))
        };
      });
      
      // Sort by completion rate and take top 5
      habitStats.sort((a, b) => b.completion - a.completion);
      const topHabits = habitStats.slice(0, 5);
      
      return {
        labels: topHabits.map(h => h.name),
        datasets: [{
          data: topHabits.map(h => h.completion),
          backgroundColor: [
            '#a855f7',
            '#ec4899',
            '#f59e0b',
            '#10b981',
            '#3b82f6'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    } catch (error) {
      console.error('❌ Failed to extract habit data:', error);
      return currentData.habitBreakdown;
    }
  }

  function extractTaskCompletionData(zenData) {
    try {
      const calendarData = zenData.zencalendar || {};
      const data = calendarData.data || {};
      
      // Calculate completion rates for different time periods
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      
      // Daily completion (today)
      const todayData = data[todayKey] || { tasks: [] };
      const dailyCompleted = todayData.tasks.filter(t => t.completed).length;
      const dailyTotal = todayData.tasks.length;
      const dailyRate = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;
      
      // Weekly completion (last 7 days)
      let weeklyCompleted = 0;
      let weeklyTotal = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayData = data[dateKey] || { tasks: [] };
        weeklyCompleted += dayData.tasks.filter(t => t.completed).length;
        weeklyTotal += dayData.tasks.length;
      }
      const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;
      
      // Monthly completion (last 30 days)
      let monthlyCompleted = 0;
      let monthlyTotal = 0;
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayData = data[dateKey] || { tasks: [] };
        monthlyCompleted += dayData.tasks.filter(t => t.completed).length;
        monthlyTotal += dayData.tasks.length;
      }
      const monthlyRate = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0;
      
      return {
        daily: dailyRate,
        weekly: weeklyRate,
        monthly: monthlyRate
      };
    } catch (error) {
      console.error('❌ Failed to extract task completion data:', error);
      return currentData.taskCompletion;
    }
  }

  function extractFocusHoursData(zenData) {
    try {
      const zenroastData = zenData.zenroast || {};
      const entries = zenroastData.entries || [];
      
      // Analyze focus patterns by hour
      const hourStats = {};
      
      entries.forEach(entry => {
        if (entry.time) {
          const hour = new Date(entry.time).getHours();
          const hourKey = hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
          
          if (!hourStats[hourKey]) {
            hourStats[hourKey] = { focus: 0, total: 0 };
          }
          
          hourStats[hourKey].total++;
          if (entry.text && entry.text.toLowerCase().includes('focus')) {
            hourStats[hourKey].focus++;
          }
        }
      });
      
      // Calculate focus scores and sort by score
      const focusScores = Object.entries(hourStats)
        .map(([time, stats]) => ({
          time: time,
          score: stats.total > 0 ? Math.round((stats.focus / stats.total) * 100) : 0
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      // Fill with default data if not enough real data
      while (focusScores.length < 3) {
        const defaultTimes = ['9:00 AM', '2:00 PM', '7:00 PM'];
        const defaultScores = [95, 87, 76];
        const index = focusScores.length;
        focusScores.push({
          time: defaultTimes[index],
          score: defaultScores[index]
        });
      }
      
      return focusScores;
    } catch (error) {
      console.error('❌ Failed to extract focus hours data:', error);
      return currentData.focusHours;
    }
  }

  function extractAchievementsData(zenData) {
    try {
      const achievements = [];
      
      // Check for various achievements based on data
      const diaryEntries = zenData.diary?.entries || [];
      const habitsData = zenData.habits?.trackers || [];
      const calendarData = zenData.zencalendar?.data || {};
      const zenroastData = zenData.zenroast || {};
      
      // 7-Day Streak achievement
      const hasStreak = zenroastData.focusStreak >= 7;
      achievements.push({
        id: 'streak',
        title: '7-Day Streak',
        achieved: hasStreak,
        icon: '🔥'
      });
      
      // Bookworm achievement (10 diary entries)
      const hasBookworm = diaryEntries.length >= 10;
      achievements.push({
        id: 'bookworm',
        title: 'Bookworm',
        achieved: hasBookworm,
        icon: '📚'
      });
      
      // Speed Demon (complete 5 tasks in under 2 hours)
      const hasSpeedDemon = false; // TODO: Implement task completion time tracking
      achievements.push({
        id: 'speed',
        title: 'Speed Demon',
        achieved: hasSpeedDemon,
        icon: '⚡'
      });
      
      // Precision (90%+ habit accuracy)
      const hasPrecision = habitsData.some(habit => {
        const totalDays = Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return totalDays > 0 && (habit.totalCheckins / totalDays) >= 0.9;
      });
      achievements.push({
        id: 'precision',
        title: 'Precision',
        achieved: hasPrecision,
        icon: '🎯'
      });
      
      // Early Bird (complete 3 tasks before 9 AM)
      const hasEarlyBird = false; // TODO: Implement early morning task tracking
      achievements.push({
        id: 'early',
        title: 'Early Bird',
        achieved: hasEarlyBird,
        icon: '🌅'
      });
      
      // Diamond Focus (4+ hours straight focus)
      const hasDiamondFocus = zenroastData.session?.totalAwayTime >= 14400; // 4 hours in seconds
      achievements.push({
        id: 'focus',
        title: 'Diamond Focus',
        achieved: hasDiamondFocus,
        icon: '💎'
      });
      
      return achievements;
    } catch (error) {
      console.error('❌ Failed to extract achievements data:', error);
      return currentData.achievements;
    }
  }

  function extractHeatmapData(zenData) {
    try {
      // Generate heatmap from productivity data
      const calendarData = zenData.zencalendar?.data || {};
      const zenroastData = zenData.zenroast || {};
      const entries = zenroastData.entries || [];
      
      const heatmap = [];
      const today = new Date();
      
      for (let day = 0; day < 7; day++) {
        const dayData = [];
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - day);
        const dateKey = targetDate.toISOString().split('T')[0];
        
        for (let hour = 0; hour < 24; hour++) {
          let intensity = 0;
          
          // Check calendar tasks for this day/hour
          const dayCalendarData = calendarData[dateKey] || { tasks: [] };
          const hourTasks = dayCalendarData.tasks.filter(task => {
            if (task.time) {
              const taskHour = parseInt(task.time.split(':')[0]);
              return taskHour === hour;
            }
            return false;
          });
          
          // Check zenroast entries for this day/hour
          const hourEntries = entries.filter(entry => {
            if (entry.time) {
              const entryDate = new Date(entry.time).toISOString().split('T')[0];
              const entryHour = new Date(entry.time).getHours();
              return entryDate === dateKey && entryHour === hour;
            }
            return false;
          });
          
          // Calculate intensity based on activity
          if (hourTasks.length > 0) intensity += hourTasks.length * 2;
          if (hourEntries.length > 0) intensity += hourEntries.length;
          
          // Apply time-based patterns
          if (day < 5) { // Weekdays
            if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
              intensity += 3; // Peak hours
            } else if (hour >= 8 && hour <= 18) {
              intensity += 1; // Work hours
            }
          } else { // Weekends
            if (hour >= 10 && hour <= 16) {
              intensity += 1; // Weekend activity
            }
          }
          
          dayData.push(Math.min(9, intensity));
        }
        heatmap.push(dayData);
      }
      
      return heatmap;
    } catch (error) {
      console.error('❌ Failed to extract heatmap data:', error);
      return currentData.productivityHeatmap;
    }
  }

  function extractStreakLeaderboardData(zenData) {
    try {
      const habitsData = zenData.habits?.trackers || [];
      
      if (habitsData.length === 0) {
        return currentData.streakLeaderboard;
      }
      
      // Sort habits by streak length
      const sortedHabits = habitsData
        .filter(habit => habit.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 3);
      
      // Map habit names to icons
      const iconMap = {
        'exercise': '🔥',
        'reading': '📚',
        'meditation': '🧘',
        'coding': '💻',
        'writing': '✍️',
        'workout': '💪',
        'study': '📖',
        'practice': '🎯'
      };
      
      return sortedHabits.map(habit => ({
        name: habit.name,
        streak: habit.streak,
        icon: iconMap[habit.name.toLowerCase()] || '📊'
      }));
    } catch (error) {
      console.error('❌ Failed to extract streak leaderboard data:', error);
      return currentData.streakLeaderboard;
    }
  }

  // 🔌 ADDED: Live ZenData integration
  function connectToZenData() {
    console.log('🔍 ZenLytics: Checking ZenData availability...');
    console.log('🔍 ZenLytics: typeof zendata =', typeof zendata);
    console.log('🔍 ZenLytics: window.zendata =', window.zendata);
    
    if (typeof zendata === 'undefined') {
      console.warn('⚠️ ZenData not available, using mock data');
      console.log('🔍 ZenLytics: Available global objects:', Object.keys(window).filter(key => key.includes('zen')));
      return;
    }
    
    console.log('🔄 Connecting ZenLytics to live ZenData...');
    
    try {
      // Get all ZenData
      const zenData = zendata.getAll();
      console.log('📊 ZenLytics: Retrieved ZenData:', zenData);
      
      // Check if user has real data
      const hasRealData = hasRealUserData(zenData);
      console.log('🔍 User has real data:', hasRealData);
      
      if (hasRealData) {
        // Update analytics with real data
        const analyticsData = transformZenDataToAnalytics(zenData);
        console.log('📈 ZenLytics: Transformed analytics data:', analyticsData);
        
        window.zenlytics.updateAllCharts(analyticsData);
        
        // Update KPI cards with real data
        updateKPICards(zenData);
        
        // Update additional components with real data
        updateFocusHours(zenData);
        updateAchievements(zenData);
        renderProductivityHeatmap();
        renderStreakLeaderboard();
      } else {
        console.log('📊 No real user data yet, keeping placeholder values');
      }
      
      // Subscribe to ZenData changes
      zendata.subscribe('change:all', (updatedData) => {
        console.log('📊 ZenData updated, refreshing analytics...');
        const hasRealData = hasRealUserData(updatedData);
        
        if (hasRealData) {
          const newAnalyticsData = transformZenDataToAnalytics(updatedData);
          window.zenlytics.updateAllCharts(newAnalyticsData);
          updateKPICards(updatedData);
          updateFocusHours(updatedData);
          updateAchievements(updatedData);
          renderProductivityHeatmap();
          renderStreakLeaderboard();
        }
      });
      
      // Subscribe to specific page changes for targeted updates
      zendata.subscribe('change:diary', () => {
        console.log('📝 Diary updated, refreshing mood trends and KPI...');
        const zenData = zendata.getAll();
        const hasRealData = hasRealUserData(zenData);
        
        if (hasRealData) {
          const moodData = extractMoodData(zenData);
          window.zenlytics.updateMoodData(moodData);
          updateKPICards(zenData);
          updateFocusHours(zenData);
          updateAchievements(zenData);
        }
      });
      
      zendata.subscribe('change:zenroast', () => {
        console.log('🎯 ZenRoast updated, refreshing focus patterns and KPI...');
        const zenData = zendata.getAll();
        const hasRealData = hasRealUserData(zenData);
        
        if (hasRealData) {
          const focusData = extractFocusData(zenData);
          window.zenlytics.updateFocusData(focusData);
          updateKPICards(zenData);
          updateFocusHours(zenData);
          renderProductivityHeatmap();
        }
      });
      
      zendata.subscribe('change:habits', () => {
        console.log('🔄 Habits updated, refreshing habit breakdown and KPI...');
        const zenData = zendata.getAll();
        const hasRealData = hasRealUserData(zenData);
        
        if (hasRealData) {
          const habitData = extractHabitData(zenData);
          window.zenlytics.updateHabitData(habitData);
          updateKPICards(zenData);
          updateAchievements(zenData);
          renderStreakLeaderboard();
        }
      });
      
      zendata.subscribe('change:zencalendar', () => {
        console.log('📅 Calendar updated, refreshing task completion and KPI...');
        const zenData = zendata.getAll();
        const hasRealData = hasRealUserData(zenData);
        
        if (hasRealData) {
          const taskData = extractTaskCompletionData(zenData);
          // Update the progress bars manually since they're not in the API
          updateProgressBars(taskData);
          updateKPICards(zenData);
          updateAchievements(zenData);
          renderProductivityHeatmap();
        }
      });
      
      console.log('✅ ZenLytics connected to live ZenData');
    } catch (error) {
      console.error('❌ ZenLytics: Error connecting to ZenData:', error);
    }
  }

  // Helper function to update progress bars
  function updateProgressBars(taskData) {
    const progressItems = document.querySelectorAll('.zl-progress-item');
    if (progressItems.length >= 3) {
      // Update daily progress
      const dailyFill = progressItems[0].querySelector('.zl-progress-fill');
      const dailyValue = progressItems[0].querySelector('.zl-progress-value');
      if (dailyFill && dailyValue) {
        dailyFill.style.width = `${taskData.daily}%`;
        dailyValue.textContent = `${taskData.daily}%`;
      }
      
      // Update weekly progress
      const weeklyFill = progressItems[1].querySelector('.zl-progress-fill');
      const weeklyValue = progressItems[1].querySelector('.zl-progress-value');
      if (weeklyFill && weeklyValue) {
        weeklyFill.style.width = `${taskData.weekly}%`;
        weeklyValue.textContent = `${taskData.weekly}%`;
      }
      
      // Update monthly progress
      const monthlyFill = progressItems[2].querySelector('.zl-progress-fill');
      const monthlyValue = progressItems[2].querySelector('.zl-progress-value');
      if (monthlyFill && monthlyValue) {
        monthlyFill.style.width = `${taskData.monthly}%`;
        monthlyValue.textContent = `${taskData.monthly}%`;
      }
    }
  }

  // 🔌 NEW: Update KPI cards with real data from ZenData
  function updateKPICards(zenData) {
    try {
      console.log('📊 Updating KPI cards with real data...');
      
      // Get KPI card elements
      const kpiCards = document.querySelectorAll('.zl-kpi-card');
      if (kpiCards.length < 4) {
        console.warn('⚠️ Expected 4 KPI cards, found:', kpiCards.length);
        return;
      }
      
      // 1. Task Completion % (1st card)
      const taskCompletion = extractTaskCompletionData(zenData);
      const avgTaskCompletion = Math.round((taskCompletion.daily + taskCompletion.weekly + taskCompletion.monthly) / 3);
      const taskKPI = kpiCards[0].querySelector('.zl-kpi-value');
      if (taskKPI) {
        taskKPI.textContent = `${avgTaskCompletion}%`;
        console.log('✅ Updated Task Completion KPI:', avgTaskCompletion + '%');
      }
      
      // 2. Average Focus Time (2nd card)
      const focusHours = extractFocusHoursData(zenData);
      const avgFocusHours = focusHours.totalHours > 0 ? (focusHours.totalHours / 7).toFixed(1) : '0.0';
      const focusKPI = kpiCards[1].querySelector('.zl-kpi-value');
      if (focusKPI) {
        focusKPI.textContent = `${avgFocusHours}h`;
        console.log('✅ Updated Focus Time KPI:', avgFocusHours + 'h');
      }
      
      // 3. Habit Consistency % (3rd card)
      const habitData = extractHabitData(zenData);
      const habitConsistency = habitData.datasets?.[0]?.data?.[0] || 0;
      const habitKPI = kpiCards[2].querySelector('.zl-kpi-value');
      if (habitKPI) {
        habitKPI.textContent = `${habitConsistency}%`;
        console.log('✅ Updated Habit Consistency KPI:', habitConsistency + '%');
      }
      
      // 4. Diary Entries Count (4th card)
      const diaryEntries = zenData.diary?.entries || [];
      const diaryCount = diaryEntries.length;
      const diaryKPI = kpiCards[3].querySelector('.zl-kpi-value');
      if (diaryKPI) {
        diaryKPI.textContent = diaryCount.toString();
        console.log('✅ Updated Diary Entries KPI:', diaryCount);
      }
      
      console.log('✅ All KPI cards updated with real data');
    } catch (error) {
      console.error('❌ Error updating KPI cards:', error);
    }
  }

  // 🔌 NEW: Update Top 3 Focus Hours with real data
  function updateFocusHours(zenData) {
    try {
      const focusHoursData = extractFocusHoursData(zenData);
      const focusHoursContainer = document.getElementById('topFocusHours');
      
      if (!focusHoursContainer) {
        console.warn('⚠️ Focus hours container not found');
        return;
      }
      
      // Check if we have real focus data
      const hasRealFocusData = focusHoursData.some(hour => hour.score > 0);
      
      if (hasRealFocusData) {
        console.log('📊 Updating focus hours with real data:', focusHoursData);
        
        // Clear existing items
        focusHoursContainer.innerHTML = '';
        
        // Add real focus hours
        focusHoursData.forEach((hour, index) => {
          const hourItem = document.createElement('div');
          hourItem.className = 'zl-focus-hour-item';
          hourItem.innerHTML = `
            <div class="zl-focus-rank">${index + 1}</div>
            <div class="zl-focus-time">${hour.time}</div>
            <div class="zl-focus-bar">
              <div class="zl-focus-fill" style="width: ${hour.score}%"></div>
            </div>
            <div class="zl-focus-score">${hour.score}%</div>
          `;
          focusHoursContainer.appendChild(hourItem);
        });
        
        console.log('✅ Focus hours updated with real data');
      } else {
        console.log('📊 No real focus data, keeping existing dummy values');
      }
    } catch (error) {
      console.error('❌ Error updating focus hours:', error);
    }
  }

  // 🔌 NEW: Check if user has real data and should show dynamic values
  function hasRealUserData(zenData) {
    try {
      // Check if user has any real activity
      const hasDiaryEntries = (zenData.diary?.entries?.length || 0) > 0;
      const hasHabits = (zenData.habits?.trackers?.length || 0) > 0;
      const hasTasks = (zenData.zencalendar?.data && Object.keys(zenData.zencalendar.data).length > 0);
      const hasFocusLogs = (zenData.zenroast?.entries?.length || 0) > 0;
      
      const hasRealData = hasDiaryEntries || hasHabits || hasTasks || hasFocusLogs;
      console.log('🔍 Real user data check:', {
        hasDiaryEntries,
        hasHabits, 
        hasTasks,
        hasFocusLogs,
        hasRealData
      });
      
      return hasRealData;
    } catch (error) {
      console.error('❌ Error checking real user data:', error);
      return false;
    }
  }

  // 🔌 NEW: Update Achievements with real data
  function updateAchievements(zenData) {
    try {
      const achievementsData = extractAchievementsData(zenData);
      const achievementsContainer = document.getElementById('achievements');
      
      if (!achievementsContainer) {
        console.warn('⚠️ Achievements container not found');
        return;
      }
      
      // Check if we have any real achievements
      const hasRealAchievements = achievementsData.some(achievement => achievement.achieved);
      
      if (hasRealAchievements) {
        console.log('📊 Updating achievements with real data:', achievementsData);
        
        // Clear existing items
        achievementsContainer.innerHTML = '';
        
        // Add real achievements
        achievementsData.forEach(achievement => {
          const achievementItem = document.createElement('div');
          achievementItem.className = `zl-achievement-item ${achievement.achieved ? 'zl-achieved' : ''}`;
          achievementItem.innerHTML = `
            <div class="zl-achievement-icon">${achievement.icon}</div>
            <div class="zl-achievement-title">${achievement.title}</div>
            <div class="zl-achievement-desc">${getAchievementDescription(achievement.id)}</div>
          `;
          achievementsContainer.appendChild(achievementItem);
        });
        
        console.log('✅ Achievements updated with real data');
      } else {
        console.log('📊 No real achievements earned, keeping existing dummy values');
      }
    } catch (error) {
      console.error('❌ Error updating achievements:', error);
    }
  }

  // Helper function to get achievement descriptions
  function getAchievementDescription(achievementId) {
    const descriptions = {
      'streak': 'Complete tasks for 7 consecutive days',
      'bookworm': 'Write 10 diary entries',
      'speed': 'Complete 5 tasks in under 2 hours',
      'precision': 'Achieve 90%+ accuracy in habit tracking',
      'early': 'Complete 3 tasks before 9 AM',
      'focus': 'Maintain focus for 4+ hours straight'
    };
    return descriptions[achievementId] || 'Complete this achievement';
  }

  // Initialize everything when DOM is ready
  function initialize() {
    console.log('🚀 Initializing ZenLytics...');
    console.log('🔍 ZenLytics: DOM ready, checking dependencies...');
    console.log('🔍 ZenLytics: Chart.js available:', typeof Chart !== 'undefined');
    console.log('🔍 ZenLytics: zendata available:', typeof zendata !== 'undefined');
    
    // Load data first
    const data = loadData();
    console.log('📊 ZenLytics: Loaded initial data:', data);
    
    // Initialize charts
    initializeCharts();
    
    // Render new components
    renderProductivityHeatmap();
    renderStreakLeaderboard();
    
    // Animate UI elements with staggered timing
    setTimeout(() => {
      animateProgressBars();
      animateFocusHours();
      animateKPICards();
      animateAchievements();
      animateHeatmap();
      animateLeaderboard();
    }, 500);

    // Update charts with loaded data
    updateCharts(data);
    
    // 🔌 Connect to live ZenData
    connectToZenData();
    
    // Check if we should update components on initial load
    if (typeof zendata !== 'undefined') {
      const zenData = zendata.getAll();
      const hasRealData = hasRealUserData(zenData);
      if (hasRealData) {
        console.log('📊 Initial load: User has real data, updating components...');
        updateKPICards(zenData);
        updateFocusHours(zenData);
        updateAchievements(zenData);
        renderProductivityHeatmap();
        renderStreakLeaderboard();
      } else {
        console.log('📊 Initial load: No real user data, keeping placeholder values');
      }
    }
    
    console.log('✅ ZenLytics initialized successfully');
  }

  // Public API for external updates
  window.zenlytics = {
    // Existing methods
    updateMoodData: function(newData) {
      currentData.moodTrends = newData;
      safeChartUpdate(moodTrendsChart, newData);
      saveData(currentData);
    },
    updateFocusData: function(newData) {
      currentData.focusPatterns = newData;
      safeChartUpdate(focusPatternChart, newData);
      saveData(currentData);
    },
    updateHabitData: function(newData) {
      currentData.habitBreakdown = newData;
      safeChartUpdate(habitBreakdownChart, newData);
      saveData(currentData);
    },
    updateHeatmapData: function(newData) {
      currentData.productivityHeatmap = newData;
      renderProductivityHeatmap();
      saveData(currentData);
    },
    updateLeaderboardData: function(newData) {
      currentData.streakLeaderboard = newData;
      renderStreakLeaderboard();
      saveData(currentData);
    },
    getData: function() {
      return loadData();
    },
    
    // 🔌 NEW: ZenData integration methods
    updateFromZenData: function(zenData) {
      console.log('🔄 Updating ZenLytics from ZenData...');
      const hasRealData = hasRealUserData(zenData);
      
      if (hasRealData) {
        const analyticsData = this.transformZenDataToAnalytics(zenData);
        this.updateAllCharts(analyticsData);
        updateKPICards(zenData);
        updateFocusHours(zenData);
        updateAchievements(zenData);
        renderProductivityHeatmap();
        renderStreakLeaderboard();
        console.log('✅ Updated with real user data');
      } else {
        console.log('📊 No real user data, keeping placeholder values');
      }
      
      return analyticsData;
    },
    
    updateAllCharts: function(newData) {
      currentData = { ...newData };
      updateCharts(currentData);
      renderProductivityHeatmap();
      renderStreakLeaderboard();
      saveData(currentData);
      console.log('✅ All charts updated with new data');
    },
    
    transformZenDataToAnalytics: transformZenDataToAnalytics,
    
    // 🔌 NEW: KPI card management
    updateKPICards: function(zenData) {
      updateKPICards(zenData);
    },
    
    // 🔌 NEW: Component update functions
    updateFocusHours: function(zenData) {
      updateFocusHours(zenData);
    },
    
    updateAchievements: function(zenData) {
      updateAchievements(zenData);
    },
    
    hasRealUserData: function(zenData) {
      return hasRealUserData(zenData);
    },
    
    // Utility methods
    refreshCharts: function() {
      initializeCharts();
    },
    
    resetToMockData: function() {
      currentData = { ...mockData };
      updateCharts(currentData);
      renderProductivityHeatmap();
      renderStreakLeaderboard();
      saveData(currentData);
      console.log('🔄 Reset to mock data');
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
