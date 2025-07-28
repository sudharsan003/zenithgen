// auth.js — Shared authentication utility

// Check if user is logged in, else redirect to login.html
function checkAuth() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "login.html"; // Redirect if not authenticated
  }
}

// Logout and clear session
function logoutUser() {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('zenWelcomeSeen');
  showToast("See you later! 👋", "You've been logged out successfully.", "success");
  
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000); // Optional: reset welcome screen
  
}
