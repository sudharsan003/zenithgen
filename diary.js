// Initialize Lucide icons
lucide.createIcons();

// Diary functionality
let selectedMood = null;
let entries = zendata.get("diary.entries") || [];
let writingStreak = zendata.get("diary.writingStreak") || 0;
let autoSaveTimeout = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  updateWritingStreak();
  setupMoodSelection();
  setupAutoSave();
  setupWordCount();
  
  // Verify data loaded
  console.log("📝 Diary data loaded:", {
    entries: zendata.get("diary.entries").length,
    streak: zendata.get("diary.writingStreak"),
    draft: zendata.get("diary.draft") ? "exists" : "none"
  });
});

// Mood selection
function setupMoodSelection() {
  const moodPills = document.querySelectorAll('.mood-pill');
  moodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Remove active class from all pills
      moodPills.forEach(p => p.classList.remove('active'));
      // Add active class to clicked pill
      pill.classList.add('active');
      selectedMood = pill.dataset.mood;
    });
  });
}

// Auto-save functionality
function setupAutoSave() {
  const textarea = document.getElementById('diaryText');
  textarea.addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSaveDraft();
    }, 2000);
  });

  // Load saved draft from zendata
  const savedDraft = zendata.get("diary.draft");
  if (savedDraft) {
    textarea.value = savedDraft;
    updateWordCount();
  }
}

// Auto-save draft
function autoSaveDraft() {
  const text = document.getElementById('diaryText').value;
  if (text.trim()) {
    zendata.set("diary.draft", text);
    showSaveStatus();
  }
}

// Show save status
function showSaveStatus() {
  const saveStatus = document.getElementById('saveStatus');
  saveStatus.classList.add('show');
  setTimeout(() => {
    saveStatus.classList.remove('show');
  }, 2000);
}

// Word count
function setupWordCount() {
  const textarea = document.getElementById('diaryText');
  textarea.addEventListener('input', updateWordCount);
}

function updateWordCount() {
  const text = document.getElementById('diaryText').value;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = `${wordCount} words`;
}

// Save entry
document.getElementById('saveEntry').addEventListener('click', saveEntry);

function saveEntry() {
  const text = document.getElementById('diaryText').value.trim();
  
  if (!text) {
    showToast('Please write something before saving!', 'error');
    return;
  }

  if (!selectedMood) {
    showToast('Please select your mood first!', 'error');
    return;
  }

  const entry = {
    id: Date.now(),
    text: text,
    mood: selectedMood,
    date: new Date().toISOString(),
    wordCount: text.split(/\s+/).length
  };

  // Add entry to zendata
  zendata.push("diary", "entries", entry);
  
  // Update local entries array
  entries = zendata.get("diary.entries");
  
  // Clear form
  document.getElementById('diaryText').value = '';
  selectedMood = null;
  document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
  
  // Clear draft from zendata
  zendata.set("diary.draft", "");
  updateWordCount();

  // Update streak
  updateWritingStreak();
  
  // Reload entries
  loadEntries();

  showToast('Entry saved successfully! 📝', 'success');
}

// Load entries
function loadEntries() {
  const entriesList = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');

  if (entries.length === 0) {
    entriesList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  entriesList.innerHTML = entries.map(entry => `
    <div class="entry-item" data-id="${entry.id}">
      <div class="entry-header">
        <div class="entry-date">${formatDate(entry.date)}</div>
        <div class="entry-mood">${entry.mood}</div>
      </div>
      <div class="entry-text">${entry.text}</div>
      <div class="entry-actions">
        <span class="entry-action-btn">
          📝 ${entry.wordCount} words
        </span>
        <button class="entry-action-btn delete" onclick="deleteEntry(${entry.id})">
          <i data-lucide="trash-2"></i>
          Delete
        </button>
      </div>
    </div>
  `).join('');

  // Reinitialize Lucide icons
  lucide.createIcons();
}

// Delete entry
function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    // Remove from zendata
    zendata.remove("diary", "entries", (entry) => entry.id === id);
    
    // Update local entries array
    entries = zendata.get("diary.entries");
    
    loadEntries();
    showToast('Entry deleted', 'success');
  }
}

// Update writing streak
function updateWritingStreak() {
  const today = new Date().toDateString();
  const lastEntryDate = zendata.get("diary.lastEntryDate");
  
  if (lastEntryDate !== today && entries.length > 0) {
    const latestEntry = entries[0];
    const entryDate = new Date(latestEntry.date).toDateString();
    
    if (entryDate === today) {
      zendata.update("diary", (data) => {
        if (lastEntryDate === new Date(Date.now() - 86400000).toDateString()) {
          data.writingStreak++;
        } else {
          data.writingStreak = 1;
        }
        data.lastEntryDate = today;
      });
      
      // Update local variable
      writingStreak = zendata.get("diary.writingStreak");
    }
  }
  
  document.getElementById('diary-streak').textContent = `${writingStreak} day writing streak`;
}

// Export entries
function exportEntries() {
  if (entries.length === 0) {
    showToast('No entries to export!', 'error');
    return;
  }
  
  const dataStr = JSON.stringify(entries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `diary-entries-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  showToast('Entries exported successfully! 📁', 'success');
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
      <strong class="me-auto">Diary</strong>
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




