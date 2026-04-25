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
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let selectedAnswers = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupAuthEventListeners();
    setupAppEventListeners();
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
                    createdAt: new Date()
                });
                console.log('✅ Novo usuário criado:', user.uid);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
        }
        
        showApp();
        updateUserInfo();
    } else {
        currentUser = null;
        showAuth();
    }
});

// ==================== AUTH EVENT LISTENERS ====================
function setupAuthEventListeners() {
    // Toggle entre login e signup
    document.getElementById('link-to-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    document.getElementById('link-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    // Login
    document.getElementById('btn-login')?.addEventListener('click', handleLogin);
    document.getElementById('login-email')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('login-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Signup
    document.getElementById('btn-signup')?.addEventListener('click', handleSignup);
    document.getElementById('signup-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
    });

    // Google Login
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
    setTimeout(() => successEl.classList.remove('show'), 3000);
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        showAuthError('Preencha todos os campos');
        return;
    }

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login realizado com sucesso');
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } catch (error) {
        console.error('❌ Erro de login:', error.code);
        
        if (error.code === 'auth/user-not-found') {
            showAuthError('Usuário não encontrado');
        } else if (error.code === 'auth/wrong-password') {
            showAuthError('Senha incorreta');
        } else if (error.code === 'auth/invalid-email') {
            showAuthError('Email inválido');
        } else if (error.code === 'auth/too-many-requests') {
            showAuthError('Muitas tentativas. Tente novamente mais tarde');
        } else {
            showAuthError(error.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const classroom = document.getElementById('signup-class').value.trim();

    if (!name || !email || !password || !classroom) {
        showAuthError('Preencha todos os campos', true);
        return;
    }

    if (password.length < 6) {
        showAuthError('Senha deve ter pelo menos 6 caracteres', true);
        return;
    }

    if (!email.includes('@')) {
        showAuthError('Email inválido', true);
        return;
    }

    const btn = document.getElementById('btn-signup');
    btn.disabled = true;
    btn.textContent = 'Criando...';

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });

        await db.collection('users').doc(result.user.uid).set({
            name: name,
            email: email,
            class: classroom,
            points: 0,
            createdAt: new Date()
        });

        console.log('✅ Dados enviados com sucesso');
        console.log('📊 Usuário criado:', {
            uid: result.user.uid,
            name: name,
            email: email,
            class: classroom
        });

        showAuthSuccess('Conta criada com sucesso!');

        setTimeout(() => {
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-class').value = '';
            toggleAuthForm();
        }, 1500);
    } catch (error) {
        console.error('❌ Erro de cadastro:', error.code);

        if (error.code === 'auth/email-already-in-use') {
            showAuthError('Email já cadastrado', true);
        } else if (error.code === 'auth/weak-password') {
            showAuthError('Senha muito fraca', true);
        } else if (error.code === 'auth/invalid-email') {
            showAuthError('Email inválido', true);
        } else {
            showAuthError(error.message, true);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
    }
}

async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const btn = document.getElementById('btn-google-login');
    btn.disabled = true;

    try {
        await auth.signInWithPopup(provider);
        console.log('✅ Login com Google realizado com sucesso');
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showAuthError('Erro ao fazer login com Google');
            console.error('❌ Erro Google Login:', error);
        }
    } finally {
        btn.disabled = false;
    }
}

async function handleGoogleSignup() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const btn = document.getElementById('btn-google-signup');
    btn.disabled = true;

    try {
        await auth.signInWithPopup(provider);
        console.log('✅ Cadastro com Google realizado com sucesso');
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showAuthError('Erro ao cadastrar com Google', true);
            console.error('❌ Erro Google Signup:', error);
        }
    } finally {
        btn.disabled = false;
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        console.log('✅ Logout realizado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
    }
}

// ==================== UI FUNCTIONS ====================
function showAuth() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    showScreen('home');
}

async function updateUserInfo() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        document.getElementById('user-name-display').textContent = userData.name || 'Usuário';
        document.getElementById('home-user-name').textContent = userData.name || 'Usuário';
        document.getElementById('home-user-class').textContent = userData.class || 'Não definida';
        document.getElementById('home-user-points').textContent = userData.points || 0;
    } catch (error) {
        console.error('❌ Erro ao atualizar info do usuário:', error);
    }
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenName).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

    if (screenName === 'home') {
        updateUserInfo();
    } else if (screenName === 'subjects') {
        loadSubjects();
    } else if (screenName === 'ranking') {
        loadRanking();
    } else if (screenName === 'history') {
        loadHistory();
    }
}

// ==================== APP EVENT LISTENERS ====================
function setupAppEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Cards da home
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const screen = card.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Subjects
    document.getElementById('btn-new-subject')?.addEventListener('click', openCreateSubject);
    document.getElementById('btn-cancel-subject')?.addEventListener('click', closeCreateSubject);
    document.getElementById('btn-create-subject')?.addEventListener('click', createSubject);

    // Quiz
    document.getElementById('btn-new-quiz')?.addEventListener('click', openCreateQuiz);
    document.
