function togglePassword() {
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    passwordInput.type = 'password';
    eyeIcon.setAttribute('data-lucide', 'eye');
  }
  
  // Reinitialize lucide icons
  lucide.createIcons();
}

function redirectToLogin() {
  window.location.href = "login.html";
}

// Simple SHA-256 hashing function (fallback when bcrypt is not available)
async function simpleHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Ensure bcrypt is loaded with fallback to simple hashing
function ensureBcryptLoaded() {
  if (typeof bcrypt === 'undefined') {
    console.warn('bcrypt library not loaded, using fallback hashing');
    return false;
  }
  
  // Additional check to ensure bcrypt methods are available
  if (typeof bcrypt.hash !== 'function' || typeof bcrypt.compare !== 'function') {
    console.warn('bcrypt methods not available, using fallback hashing');
    return false;
  }
  
  return true;
}

// Input validation functions
function validateUsername(username) {
  if (username.length < 4) {
    return { valid: false, message: "Username must be at least 4 characters long" };
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters and numbers" };
  }
  
  return { valid: true };
}

function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must include at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must include at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one digit" };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: "Password must include at least one special character (!@#$%^&*(),.?\":{}|<>) " };
  }
  
  return { valid: true };
}

function showToast(title, description, type = 'success') {
  const toast = document.getElementById('toast');
  
  toast.innerHTML = `
    <h4>${title}</h4>
    <p>${description}</p>
  `;
  
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Get users from localStorage
function getUsers() {
  const users = localStorage.getItem('zenithgen_users');
  return users ? JSON.parse(users) : {};
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('zenithgen_users', JSON.stringify(users));
}

async function handleSignup() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showToast(
      "Oops! Missing something? 🤔",
      "Fill in all fields to continue your glow-up journey!",
      "error"
    );
    return;
  }
  
  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    showToast(
      "Invalid Username! 🤔",
      usernameValidation.message,
      "error"
    );
    return;
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showToast(
      "Weak Password! 🔒",
      passwordValidation.message,
      "error"
    );
    return;
  }
  
  // Check if user already exists
  const users = getUsers();
  if (users[username]) {
    showToast(
      "Plot twist! 😅",
      "That username is already taken. Try another one!",
      "error"
    );
    return;
  }
  
  // Hash password
  try {
    let hashedPassword;
    
    // Check if bcrypt is available
    if (ensureBcryptLoaded()) {
      // Use bcrypt if available
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } else {
      // Use fallback SHA-256 hashing
      hashedPassword = await simpleHash(password);
    }
    
    // Save user to localStorage
    users[username] = {
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    saveUsers(users);
    
    // Save current user info in localStorage (not password)
    localStorage.setItem('currentUser', username);
    
    showToast(
      "Welcome to the crew! 🎉",
      "Account created successfully. Redirecting to dashboard..."
    );
    
    // Redirect to dashboard after successful signup
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  } catch (error) {
    showToast(
      "Oops! Something went wrong! 😅",
      "Please try again later.",
      "error"
    );
    console.error("Signup error:", error);
  }
}

async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showToast(
      "Oops! Missing something? 🤔",
      "Fill in all fields to continue your journey!",
      "error"
    );
    return;
  }
  
  // Get users from localStorage
  const users = getUsers();
  const user = users[username];
  
  if (!user) {
    showToast(
      "Nah, that ain't it chief 🚫",
      "Invalid credentials. Try again!",
      "error"
    );
    return;
  }
  
  // Verify password
  try {
    let isValid = false;
    
    // Check if bcrypt is available
    if (ensureBcryptLoaded()) {
      // Use bcrypt if available
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Use fallback SHA-256 hashing
      const hashedPassword = await simpleHash(password);
      isValid = (hashedPassword === user.password);
    }
    
    if (!isValid) {
      showToast(
        "Nah, that ain't it chief 🚫",
        "Invalid credentials. Try again!",
        "error"
      );
      return;
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    
    // Save current user info in sessionStorage (not password)
    sessionStorage.setItem("currentUser", username);
    
    showToast(
      "You're in! Let's go! 🚀",
      "Successfully logged in. Ready to slay your goals?"
    );
    
    // Redirect to dashboard after successful login
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  } catch (error) {
    showToast(
      "Oops! Something went wrong! 😅",
      "Please try again later.",
      "error"
    );
    console.error("Login error:", error);
  }
}

// DOM ready check to ensure bcrypt is loaded with fallback
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (ensureBcryptLoaded()) {
      console.log('bcrypt library loaded successfully');
    } else {
      console.log('Using fallback SHA-256 hashing (secure alternative)');
    }
  }, 100);
});

async function handleSubmit() {
  await handleSignup();
}