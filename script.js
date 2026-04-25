// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyBAs3irtV6MuTPHmsxYwYSFMTkX6_6ntz8",
    authDomain: "sexta-feira-fb01a.firebaseapp.com",
    projectId: "sexta-feira-fb01a",
    storageBucket: "sexta-feira-fb01a.firebasestorage.app",
    messagingSenderId: "82809140147",
    appId: "1:82809140147:web:2a3f3ece3e81c33b0b91c6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentSubject = null;
let currentQuiz = null;
let currentChat = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let admLoggedIn = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupAuthEventListeners();
    setupAppEventListeners();
    setupNavigationListeners();
});

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                const displayName = user.displayName || 'Usuário';
                const email = user.email || '';
                await db.collection('users').doc(user.uid).set({
                    name: displayName,
                    email: email,
                    class: 'Não definida',
                    points: 0,
                    friends: [],
                    createdAt: new Date()
                });
                console.log('✅ Novo usuário criado:', user.uid);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
        }
        
        showApp();
        updateUserDisplay();
        loadHomeData();
    } else {
        currentUser = null;
        showAuth();
    }
});

// ==================== AUTH EVENT LISTENERS ====================
function setupAuthEventListeners() {
    // Toggle
    document.getElementById('toggle-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    document.getElementById('toggle-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    // Login
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    // Signup
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignup();
    });

    // Google
    document.getElementById('btn-google-login')?.addEventListener('click', handleGoogleLogin);
    document.getElementById('btn-google-signup')?.addEventListener('click', handleGoogleSignup);

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    loginForm.classList.toggle('active');
    signupForm.classList.toggle('active');

    clearAuthMessages();
}

function clearAuthMessages() {
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('signup-error').classList.remove('show');
    document.getElementById('signup-success').classList.remove('show');
}

function showAuthError(message, isSignup = false) {
    const errorId = isSignup ? 'signup-error' : 'login-error';
    const errorEl = document.getElementById(errorId);
    errorEl.textContent = '❌ ' + message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
}

function showAuthSuccess(message) {
    const successEl = document.getElementById('signup-success');
    successEl.textContent = '✅ ' + message;
    successEl.classList.add('show');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.
