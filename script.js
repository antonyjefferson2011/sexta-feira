// ==================== FIREBASE CONFIG ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBAs3irtV6MuTPHmsxYwYSFMTkX6_6ntz8",
    authDomain: "sexta-feira-fb01a.firebaseapp.com",
    databaseURL: "https://sexta-feira-fb01a-default-rtdb.firebaseio.com",
    projectId: "sexta-feira-fb01a",
    storageBucket: "sexta-feira-fb01a.firebasestorage.app",
    messagingSenderId: "82809140147",
    appId: "1:82809140147:web:2a3f3ece3e81c33b0b91c6",
    measurementId: "G-DEZ5ZESQH7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentSubject = null;
let admLoggedIn = false;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App iniciado');
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        updateUI();
    } else {
        showAuth();
    }

    setupEventListeners();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Auth
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('toggle-signup-link').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });
    document.getElementById('toggle-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Search
    document.getElementById('discover-search').addEventListener('input', (e) => {
        loadDiscover(e.target.value);
    });
}

// ==================== AUTH ====================
function toggleAuthForm() {
    document.getElementById('login-form').classList.toggle('active');
    document.getElementById('signup-form').classList.toggle('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!name || !password) {
        showError('login-error', 'Preencha todos os campos');
        return;
    }

    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        let found = false;

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const user = child.val();
                if (user.name === name && user.password === password) {
                    currentUser = { id: child.key, ...user };
                    found = true;
                }
            });
        }

        if (!found) {
            showError('login-error', 'Usuário ou senha incorretos');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showApp();
        updateUI();
    } catch (error) {
        console.error('Erro:', error);
        showError('login-error', 'Erro ao fazer login');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const passwordConfirm = document.getElementById('signup-password-confirm').value.trim();
    const classroom = document.getElementById('signup-class').value.trim();

    if (!name || !password || !passwordConfirm || !classroom) {
        showError('signup-error', 'Preencha todos os campos');
        return;
    }

    if (password !== passwordConfirm) {
        showError('signup-error', 'Senhas não coincidem');
        return;
    }

    if (password.length < 6) {
        showError('signup-error', 'Senha deve ter pelo menos 6 caracteres');
        return;
    }

    try {
        // Verificar se nome existe
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.val().name === name) {
                    throw new Error('Nome já existe');
                }
            });
        }

        const newUser = {
            name: name,
            password: password,
            class: classroom,
            points: 0,
            friends: [],
            createdAt: new Date().toISOString()
        };

        const userRef = push(ref(db, 'users'));
        await set(userRef, newUser);

        alert('Conta criada com sucesso! Faça login.');
        document.getElementById('signup-form').reset();
        toggleAuthForm();
    } catch (error) {
        console.error('Erro:', error);
        showError('signup-error', error.message || 'Erro ao criar conta');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    admLoggedIn = false;
    showAuth();
}

// ==================== UI ====================
function showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    showScreen('home');
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenName).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

    if (screenName === 'home') {
        loadHome();
    } else if (screenName === 'subjects') {
        loadSubjects();
    } else if (screenName === 'ranking') {
        loadRanking();
    } else if (screenName === 'discover') {
        loadDiscover('');
    } else if (screenName === 'profile') {
        loadProfile();
    } else if (screenName === 'adm') {
        loadAdmPanel();
    }
}

function updateUI() {
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('welcome-name').textContent = currentUser.name;
    document.getElementById('welcome-points').textContent = currentUser.points || 0;
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

// ==================== HOME ====================
async function loadHome() {
    updateUI();
}

// ==================== SUBJECTS ====================
function openCreateSubject() {
    document.getElementById('create-subject-form').style.display = 'block';
}

function closeCreateSubject() {
    document.getElementById('create-subject-form').style.display = 'none';
    document.getElementById('subject-title').value = '';
    document.getElementById('subject-desc').value = '';
}

async function createSubject() {
    const title = document.getElementById('subject-title').value.trim();
    const desc = document.getElementById('subject-desc').value.trim();

    if (!title) {
        alert('Digite o nome da matéria');
        return;
    }

    try {
        const newSubject = {
            title: title,
            description: desc,
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            createdAt: new Date().toISOString(),
            likes: 0
        };

        await push(ref(db, 'subjects'), newSubject);
        alert('Matéria criada com sucesso!');
        closeCreateSubject();
        loadSubjects();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar matéria');
    }
}

async function loadSubjects() {
    try {
        const snapshot = await get(ref(db, 'subjects'));
        const list = document.getElementById('subjects-list');
        list.innerHTML = '';

        if (!snapshot.exists()) {
            list.innerHTML = '<p>Nenhuma matéria criada</p>';
            return;
        }

        snapshot.forEach(child => {
            const subject = child.val();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h3>${subject.title}</h3>
                <p>${subject.description || 'Sem descrição'}</p>
                <p style="font-size: 12px; margin-top: 10px;">❤️ ${subject.likes || 0}</p>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ==================== RANKING ====================
async function loadRanking() {
    try {
        const snapshot = await get(ref(db, 'users'));
        const users = [];

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                users.push({
                    id: child.key,
                    ...child.val()
                });
            });
        }

        users.sort((a, b) => (b.points || 0) - (a.points || 0));

        const list = document.getElementById('ranking-list');
        list.innerHTML = '';

        users.slice(0, 50).forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h3>${index + 1}º - ${user.name}</h3>
                <p>${user.class || 'Não definida'}</p>
                <p style="font-weight: bold; color: #2563eb; margin-top: 10px;">${user.points || 0} pontos</p>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ==================== DISCOVER ====================
async function loadDiscover(query) {
    try {
        const snapshot = await get(ref(db, 'users'));
        let users = [];

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.key !== currentUser.id) {
                    users.push({
                        id: child.key,
                        ...child.val()
                    });
                }
            });
        }

        if (query) {
            users = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        }

        const list = document.getElementById('discover-list');
        list.innerHTML = '';

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h3>${user.name}</h3>
                <p>${user.class || 'Não definida'}</p>
                <p style="margin-top: 10px;">${user.points || 0} pontos</p>
                <button class="btn btn-primary btn-small" style="margin-top: 10px; width: 100%;" onclick="addFriend('${user.id}')">Adicionar</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function addFriend(friendId) {
    try {
        if (!currentUser.friends) currentUser.friends = [];
        if (currentUser.friends.includes(friendId)) {
            alert('Já é seu amigo');
            return;
        }

        currentUser.friends.push(friendId);
        await update(ref(db, `users/${currentUser.id}`), { friends: currentUser.friends });
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Amigo adicionado!');
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ==================== PROFILE ====================
async function loadProfile() {
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-class').textContent = currentUser.class || 'Não definida';
    document.getElementById('profile-points').textContent = currentUser.points || 0;
}

function openEditProfile() {
    const newClass = prompt('Digite sua nova sala:', currentUser.class);
    if (newClass) {
        currentUser.class = newClass;
        update(ref(db, `users/${currentUser.id}`), { class: newClass });
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadProfile();
    }
}

function openChangePassword() {
    const newPassword = prompt('Digite sua nova senha:');
    if (newPassword && newPassword.length >= 6) {
        currentUser.password = newPassword;
        update(ref(db, `users/${currentUser.id}`), { password: newPassword });
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Senha alterada!');
    }
}

function openAdmPanel() {
    showScreen('adm');
}

// ==================== ADM ====================
function loadAdmPanel() {
    if (!admLoggedIn) {
        document.getElementById('adm-login').style.display = 'block';
        document.getElementById('adm-panel').style.display = 'none';
    } else {
        document.getElementById('adm-login').style.display = 'none';
        document.getElementById('adm-panel').style.display = 'block';
        populateSubjectSelect();
    }
}

function admLogin() {
    const password = document.getElementById('adm-password').value;
    if (password === 'senhafacil') {
        admLoggedIn = true;
        loadAdmPanel();
    } else {
        alert('Senha incorreta');
    }
}

function admLogout() {
    admLoggedIn = false;
    document.getElementById('adm-password').value = '';
    loadAdmPanel();
}

async function depositPoints() {
    const amount = parseInt(document.getElementById('adm-points').value);
    if (!amount || amount < 1) {
        alert('Digite uma quantidade válida');
        return;
    }

    currentUser.points = (currentUser.points || 0) + amount;
    await update(ref(db, `users/${currentUser.id}`), { points: currentUser.points });
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('adm-points').value = '';
    alert(`${amount} pontos depositados!`);
    updateUI();
}

async function populateSubjectSelect() {
    const select = document.getElementById('adm-subject');
    select.innerHTML = '<option value="">Selecione uma matéria</option>';

    try {
        const snapshot = await get(ref(db, 'subjects'));
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const option = document.createElement('option');
                option.value = child.key;
                option.textContent = child.val().title;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function createQuizFromCode() {
    const subjectId = document.getElementById('adm-subject').value;
    const code = document.getElementById('adm-code').value;

    if (!subjectId || !code) {
        alert('Preencha todos os campos');
        return;
    }

    try {
        const lines = code.split('\n').filter(l => l.trim());
        let quizTitle = 'Quiz';
        let questions = [];
        let currentQuestion = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('/n')) {
                quizTitle = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('/q1')) {
                if (currentQuestion) questions.push(currentQuestion);
                currentQuestion = { text: trimmed.substring(3).trim(), alternatives: [], correct: 0 };
            } else if (trimmed.startsWith('/a1')) {
                if (currentQuestion) currentQuestion.alternatives[0] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a2')) {
                if (currentQuestion) currentQuestion.alternatives[1] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a3')) {
                if (currentQuestion) currentQuestion.alternatives[2] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a4')) {
                if (currentQuestion) currentQuestion.alternatives[3] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/c')) {
                if (currentQuestion) currentQuestion.correct = parseInt(trimmed.substring(2).trim()) - 1;
            }
        }

        if (currentQuestion) questions.push(currentQuestion);

        const newQuiz = {
            title: quizTitle,
            subjectId: subjectId,
            questions: questions,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            likes: 0
        };

        await push(ref(db, 'quizzes'), newQuiz);
        alert('Quiz criado com sucesso!');
        document.getElementById('adm-code').value = '';
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar quiz');
    }
}

console.log('✅ Script carregado');
