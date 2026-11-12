// ============================================
// SafeSpace - Main JavaScript File
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
console.log('🔌 API Base URL:', API_BASE_URL);

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`📡 API ${method} Request:`, fullUrl);
    
    try {
        const token = localStorage.getItem('token');
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Only add Authorization header if token exists
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token found, adding Authorization header');
        } else {
            console.log('⚠️ No token in localStorage');
        }

        if (data) {
            options.body = JSON.stringify(data);
            console.log('📦 Request body:', data);
        }

        console.log('⏳ Sending request with options:', { 
            method: options.method, 
            headers: Object.keys(options.headers),
            hasBody: !!options.body 
        });
        
        const response = await fetch(fullUrl, options);
        console.log('📥 Response status:', response.status, response.statusText);
        console.log('📥 Response headers:', {
            'content-type': response.headers.get('content-type'),
            'access-control-allow-origin': response.headers.get('access-control-allow-origin')
        });
        
        const result = await response.json();
        console.log('📥 Response data:', result);

        if (!response.ok) {
            // Handle validation errors with errors array
            if (result.errors && Array.isArray(result.errors)) {
                const errorMessages = result.errors.map(err => err.msg).join(', ');
                console.error('❌ Validation errors:', result.errors);
                throw new Error(errorMessages);
            }
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('❌ API Call Error:', error.message);
        console.error('Full error object:', error);
        throw error;
    }
}

// Quote Carousel
let currentQuote = 0;
const quotes = document.querySelectorAll('.quote-card');
const totalQuotes = quotes.length;

function showQuote(index) {
    quotes.forEach(quote => quote.classList.remove('active'));
    quotes[index].classList.add('active');
}

function nextQuote() {
    currentQuote = (currentQuote + 1) % totalQuotes;
    showQuote(currentQuote);
}

function previousQuote() {
    currentQuote = (currentQuote - 1 + totalQuotes) % totalQuotes;
    showQuote(currentQuote);
}

// Auto-rotate quotes every 5 seconds
if (totalQuotes > 0) {
    setInterval(nextQuote, 5000);
}

// Form Validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateUsername(username) {
    return username.length >= 3;
}

// Register Form Submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    console.log('✅ Register form found and event listener attached');
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Registration form submitted');

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const anonymous_nickname = document.getElementById('nicknames').value.trim();
        const agreeTerms = document.getElementById('agreeTerms').checked;

        console.log('Form data:', { username, email, anonymous_nickname, agreeTermsChecked: agreeTerms });

        let errors = [];

        if (!validateUsername(username)) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        if (!validatePassword(password)) {
            errors.push('Password must be at least 8 characters long');
        }

        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }

        if (!agreeTerms) {
            errors.push('You must agree to the terms and conditions');
        }

        if (errors.length > 0) {
            console.warn('❌ Validation errors:', errors);
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        console.log('✅ Client-side validation passed, sending to API...');

        try {
            console.log('🚀 Starting API call to /auth/register');
            const response = await apiCall('/auth/register', 'POST', {
                username,
                email,
                password,
                anonymous_nickname
            });

            console.log('📡 API Response:', response);

            if (response.success) {
                // Store token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                console.log('✅ Registration successful!');
                showNotification('Registration successful! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Handle API responses with success: false
                const errorMessage = response.message || 'Registration failed. Please try again.';
                console.error('❌ Registration failed:', errorMessage);
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('❌ Registration error caught:', error.message);
            console.error('Full error:', error);
            console.error('Error name:', error.name);
            console.error('Error type:', typeof error);
            
            // Provide specific error messages
            let errorMsg = error.message;
            if (error.message === 'Failed to fetch') {
                errorMsg = 'Could not connect to the server. Make sure the API is running on http://localhost:5000';
            } else if (error.message.includes('CORS')) {
                errorMsg = 'Server blocked the request. CORS configuration issue.';
            }
            
            showNotification(`Registration failed: ${errorMsg}`, 'error');
        }
    });
} else {
    console.warn('⚠️ Register form with id "registerForm" not found!');
}


// Login Form Submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    console.log('✅ Login form found and event listener attached');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Login form submitted');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        console.log('Form data:', { email, rememberMe });

        if (!validateEmail(email)) {
            console.warn('❌ Invalid email format');
            alert('Please enter a valid email address');
            return;
        }

        if (password.length === 0) {
            console.warn('❌ Password is empty');
            alert('Please enter your password');
            return;
        }

        console.log('✅ Client-side validation passed, sending to API...');

        try {
            const response = await apiCall('/auth/login', 'POST', {
                email,
                password
            });

            console.log('📡 API Response:', response);

            if (response.success) {
                // Store token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberEmail', email);
                } else {
                    localStorage.removeItem('rememberEmail');
                }

                console.log('✅ Login successful!');
                showNotification('Login successful! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Handle API responses with success: false
                const errorMessage = response.message || 'Login failed. Please try again.';
                console.error('❌ Login failed:', errorMessage);
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('❌ Login error caught:', error.message);
            console.error('Full error:', error);
            console.error('Error name:', error.name);
            console.error('Error type:', typeof error);
            
            // Provide specific error messages
            let errorMsg = error.message;
            if (error.message === 'Failed to fetch') {
                errorMsg = 'Could not connect to the server. Make sure the API is running on http://localhost:5000';
            } else if (error.message.includes('CORS')) {
                errorMsg = 'Server blocked the request. CORS configuration issue.';
            }
            
            showNotification(`Login failed: ${errorMsg}`, 'error');
        }
    });

    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        document.getElementById('loginEmail').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
        console.log('✅ Remembered email loaded');
    }
} else {
    console.warn('⚠️ Login form with id "loginForm" not found!');
}


// Mood Selection
const moodOptions = document.querySelectorAll('.mood-option, .mood-choice, .mood-btn');
moodOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Remove selected class from all similar elements in the same context
        document.querySelectorAll(`.${this.className.split(' ')[0]}`).forEach(elem => {
            if (elem.parentElement === this.parentElement) {
                elem.classList.remove('selected');
            }
        });
        this.classList.add('selected');
    });
});

// Warning Tags Selection
const warningTags = document.querySelectorAll('.warning-tag');
warningTags.forEach(tag => {
    tag.addEventListener('click', function() {
        this.classList.toggle('selected');
    });
});

// Create Post Form
const createPostForm = document.getElementById('createPostForm');
if (createPostForm) {
    createPostForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const postText = document.getElementById('postText').value.trim();
        const selectedMood = document.querySelector('.mood-choice.selected');
        const isAnonymous = document.getElementById('anonymousOption').checked;
        const selectedTags = Array.from(document.querySelectorAll('.warning-tag.selected')).map(tag => tag.textContent);

        if (!postText) {
            alert('Please write something before posting');
            return;
        }

        try {
            const response = await apiCall('/posts', 'POST', {
                content: postText,
                mood: selectedMood ? selectedMood.dataset.mood : null,
                is_anonymous: isAnonymous,
                trigger_warnings: selectedTags
            });

            if (response.success) {
                showNotification('Post created successfully!', 'success');
                // Reset form
                createPostForm.reset();
                document.querySelectorAll('.mood-choice').forEach(m => m.classList.remove('selected'));
                document.querySelectorAll('.warning-tag').forEach(t => t.classList.remove('selected'));
                updateCharCount();
            }
        } catch (error) {
            showNotification(`Failed to create post: ${error.message}`, 'error');
        }
    });
}


// Character count update
const postTextarea = document.getElementById('postText');
if (postTextarea) {
    postTextarea.addEventListener('input', updateCharCount);
    updateCharCount();
}

function updateCharCount() {
    const textarea = document.getElementById('postText');
    const charCount = document.querySelector('.char-count');
    if (charCount) {
        const count = textarea.value.length;
        charCount.textContent = `${count}/500 characters`;
    }
}

// Post Actions
const likeButtons = document.querySelectorAll('.post-action-btn.like');
likeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const count = parseInt(this.textContent) || 0;
        if (this.classList.contains('active')) {
            this.textContent = `❤️ ${count + 1}`;
        } else {
            this.textContent = `🤍 ${Math.max(0, count - 1)}`;
        }
    });
});

// Save Mood
const saveMoodBtn = document.getElementById('saveMoodBtn');
if (saveMoodBtn) {
    saveMoodBtn.addEventListener('click', function() {
        const selectedMood = document.querySelector('.mood-btn.selected');
        const notes = document.querySelector('.mood-notes').value.trim();

        if (!selectedMood) {
            alert('Please select a mood');
            return;
        }

        alert('Mood saved successfully!');
        // Add to history
        addToMoodHistory(selectedMood.textContent, notes);
    });
}

function addToMoodHistory(mood, notes) {
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    const historyHTML = `
        <div class="history-item">
            <div>
                <div class="history-date">${today}</div>
                <div class="history-mood">${mood}</div>
            </div>
        </div>
    `;
    
    const moodHistory = document.querySelector('.mood-history');
    if (moodHistory) {
        moodHistory.insertAdjacentHTML('afterbegin', historyHTML);
    }
}

// Save Journal Entry
const saveEntryBtn = document.getElementById('saveEntryBtn');
if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', function() {
        const title = document.getElementById('entryTitle').value.trim();
        const content = document.getElementById('entryContent').value.trim();
        const selectedMood = document.querySelector('.mood-radio:checked');

        if (!title || !content) {
            alert('Please fill in both title and content');
            return;
        }

        alert('Journal entry saved successfully!');
        
        // Add to entries list
        addJournalEntry(title, content, selectedMood ? selectedMood.value : '');
    });
}

function addJournalEntry(title, content, mood) {
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const entryHTML = `
        <div class="journal-entry">
            <div class="entry-date">${today}</div>
            <div class="entry-title">${title}</div>
            <div class="entry-content">${content}</div>
            ${mood ? `<span class="entry-mood">${mood}</span>` : ''}
        </div>
        <hr style="margin: 2rem 0; border: none; border-top: 2px solid #E6D5F0;">
    `;

    const journalEntries = document.querySelector('.journal-entries');
    if (journalEntries) {
        journalEntries.insertAdjacentHTML('afterbegin', entryHTML);
    }
}

// Settings Menu
const settingsMenuLinks = document.querySelectorAll('.settings-menu-link');
settingsMenuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links and sections
        settingsMenuLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked link
        this.classList.add('active');
        
        // Show corresponding section
        const sectionId = this.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
    });
});

// Admin Menu
const adminMenuLinks = document.querySelectorAll('.admin-menu-link');
adminMenuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links
        adminMenuLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// Chat Functionality
const chatSendBtn = document.querySelector('.chat-send-btn');
if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendMessage);
    
    const chatInputField = document.querySelector('.chat-input-field');
    if (chatInputField) {
        chatInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const inputField = document.querySelector('.chat-input-field');
    const messagesContainer = document.querySelector('.chat-messages');
    
    if (!inputField || !messagesContainer) return;

    const messageText = inputField.value.trim();
    if (!messageText) return;

    // Add sent message
    const messageHTML = `
        <div class="message sent">
            <div class="message-bubble">${messageText}</div>
            <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    inputField.value = '';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate response
    setTimeout(() => {
        const responseHTML = `
            <div class="message received">
                <div class="message-bubble">Thank you for your message. We're here to help!</div>
                <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', responseHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
}

// Notification Filters
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Filter notifications logic would go here
    });
});

// FAQ Accordion
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
        const answer = this.nextElementSibling;
        
        // Close other answers
        document.querySelectorAll('.faq-answer').forEach(a => {
            if (a !== answer) {
                a.classList.remove('show');
            }
        });
        
        // Toggle current answer
        if (answer) {
            answer.classList.toggle('show');
        }
    });
});

// Delete Confirmation
function confirmDelete(message = 'Are you sure you want to delete this item?') {
    return confirm(message);
}

// Password Strength Indicator
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
}

function updatePasswordStrength(password) {
    const requirements = document.querySelectorAll('.requirement');
    
    requirements.forEach(req => {
        const text = req.textContent.toLowerCase();
        let isMet = false;

        if (text.includes('character') && password.length >= 8) {
            isMet = true;
        } else if (text.includes('uppercase') && /[A-Z]/.test(password)) {
            isMet = true;
        } else if (text.includes('lowercase') && /[a-z]/.test(password)) {
            isMet = true;
        } else if (text.includes('number') && /[0-9]/.test(password)) {
            isMet = true;
        } else if (text.includes('special') && /[!@#$%^&*]/.test(password)) {
            isMet = true;
        }

        if (isMet) {
            req.classList.add('met');
        } else {
            req.classList.remove('met');
        }
    });
}

// Notification System
function showNotification(message, type = 'info') {
    console.log(`🔔 Showing notification [${type}]:`, message);
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : '#3498DB'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 400px;
    `;
    
    const body = document.body;
    if (!body) {
        console.error('❌ Document body not found!');
        return;
    }
    
    body.appendChild(notification);
    console.log('✅ Notification added to DOM');
    
    setTimeout(() => {
        notification.remove();
        console.log('✅ Notification removed from DOM');
    }, 3000);
}

// Print Support for Pages
function printPage() {
    window.print();
}

// Export Data
function exportData(format = 'json') {
    alert(`Exporting data as ${format.toUpperCase()}...`);
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    const authRequiredPages = ['dashboard.html', 'profile-settings.html', 'journal.html', 'mood-tracker.html', 'create-post.html', 'support.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (authRequiredPages.includes(currentPage) && !token) {
        showNotification('Please log in to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Set first settings section as active
    const firstSettingsLink = document.querySelector('.settings-menu-link');
    if (firstSettingsLink) {
        firstSettingsLink.click();
    }

    // Set first admin section as active
    const firstAdminLink = document.querySelector('.admin-menu-link');
    if (firstAdminLink) {
        firstAdminLink.click();
    }

    // Initialize tooltips, popovers, etc.
    console.log('SafeSpace platform initialized');
});
