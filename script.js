// ==================== FIREBASE CONFIG ====================
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== LOCALSTORAGE MANAGER ====================
class StorageManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(null));
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    clearCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// ==================== GLOBAL STATE ====================
const storage = new StorageManager();
let currentUser = null;
let currentSubject = null;
let currentQuiz = null;
let currentChat = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentCorrect = 0;
let currentIncorrect = 0;
let admLoggedIn = false;
let questionCount = 0;
let currentTopic = null;
let allUsers = [];
let allSubjects = [];
let notificationsCount = 0;
let notificationsListener = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App iniciado com Firebase');
    setupAuthEventListeners();
    setupAppEventListeners();
    setupNavigationListeners();
    
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
        currentUser = savedUser;
        showApp();
        updateUserDisplay();
        loadHomeData();
        loadAllUsers();
        loadAllSubjects();
        setupNotificationsListener();
    } else {
        showAuth();
    }
});

// ==================== AUTH EVENT LISTENERS ====================
function setupAuthEventListeners() {
    document.getElementById('toggle-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    document.getElementById('toggle-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignup();
    });

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
    document.getElementById('signup-name-error').classList.remove('show');
}

function showAuthError(message, isSignup = false) {
    const errorId = isSignup ? 'signup-error' : 'login-error';
    const errorEl = document.getElementById(errorId);
    errorEl.textContent = '❌ ' + message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
}

function showAuthNameError(message) {
    const errorEl = document.getElementById('signup-name-error');
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
    const username = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showAuthError('Preencha todos os campos');
        return;
    }

    const btn = document.getElementById('login-form').querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        const snapshot = await db.ref('users').orderByChild('name').equalTo(username).once('value');
        
        if (!snapshot.exists()) {
            showAuthError('Usuário não encontrado');
            btn.disabled = false;
            btn.textContent = 'Entrar na Plataforma';
            return;
        }

        let userData = null;
        let userId = null;

        snapshot.forEach(child => {
            if (child.val().password === password) {
                userData = child.val();
                userId = child.key;
            }
        });

        if (!userData) {
            showAuthError('Senha incorreta');
            btn.disabled = false;
            btn.textContent = 'Entrar na Plataforma';
            return;
        }

        currentUser = { id: userId, ...userData };
        storage.setCurrentUser(currentUser);
        console.log('✅ Login realizado com sucesso:', userId);

        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';

        showApp();
        updateUserDisplay();
        loadHomeData();
        loadAllUsers();
        loadAllSubjects();
        setupNotificationsListener();
    } catch (error) {
        console.error('❌ Erro de login:', error);
        showAuthError('Erro ao fazer login');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar na Plataforma';
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const passwordConfirm = document.getElementById('signup-password-confirm').value.trim();
    const classroom = document.getElementById('signup-class').value.trim();

    if (!name || !password || !passwordConfirm || !classroom) {
        showAuthError('Preencha todos os campos', true);
        return;
    }

    // Verificar se nome já existe
    try {
        const snapshot = await db.ref('users').orderByChild('name').equalTo(name).once('value');
        if (snapshot.exists()) {
            showAuthNameError('Este nome já está em uso. Escolha outro');
            return;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar nome:', error);
    }

    if (password.length < 6) {
        showAuthError('Senha deve ter pelo menos 6 caracteres', true);
        return;
    }

    if (password !== passwordConfirm) {
        showAuthError('As senhas não coincidem', true);
        return;
    }

    const btn = document.getElementById('signup-form').querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Criando...';

    try {
        const newUser = {
            name: name,
            password: password,
            class: classroom,
            points: 0,
            friends: [],
            followers: [],
            createdAt: new Date().toISOString()
        };

        const userRef = db.ref('users').push();
        await userRef.set(newUser);

        console.log('✅ Usuário criado com sucesso:', userRef.key);

        showAuthSuccess('Conta criada com sucesso! Redirecionando...');

        setTimeout(() => {
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-password-confirm').value = '';
            document.getElementById('signup-class').value = '';
            toggleAuthForm();
        }, 1500);
    } catch (error) {
        console.error('❌ Erro de cadastro:', error);
        showAuthError('Erro ao criar conta', true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
    }
}

function handleLogout() {
    currentUser = null;
    storage.clearCurrentUser();
    admLoggedIn = false;
    
    // Remover listener de notificações
    if (notificationsListener) {
        notificationsListener.off();
    }
    
    console.log('✅ Logout realizado com sucesso');
    showAuth();
}

// ==================== UI FUNCTIONS ====================
function showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    showScreen('home');
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('user-display').textContent = currentUser.name || 'Usuário';
    }
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        const containers = s.querySelectorAll('[id$="-container"], [id$="-list"], [id$="-grid"]');
        containers.forEach(c => c.innerHTML = '');
    });

    document.getElementById('screen-' + screenName).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.querySelector(`[data-screen="${screenName}"]`);
    if (navBtn) navBtn.classList.add('active');

    if (screenName === 'home') {
        loadHomeData();
    } else if (screenName === 'subjects') {
        loadSubjects();
    } else if (screenName === 'ranking') {
        loadRanking();
    } else if (screenName === 'discover') {
        loadDiscover();
    } else if (screenName === 'chat') {
        loadChats();
    } else if (screenName === 'profile') {
        loadProfile();
    } else if (screenName === 'adm') {
        loadAdmPanel();
    }
}

// ==================== NOTIFICATIONS SYSTEM ====================
function setupNotificationsListener() {
    if (!currentUser) return;

    const notificationsRef = db.ref(`notifications/${currentUser.id}`);
    
    notificationsListener = notificationsRef.on('child_added', (snapshot) => {
        const notification = snapshot.val();
        notificationsCount++;
        updateNotificationBell();
        console.log('🔔 Nova notificação:', notification);
    });
}

function updateNotificationBell() {
    const bellIcon = document.querySelector('.notification-bell');
    if (bellIcon) {
        if (notificationsCount > 0) {
            bellIcon.innerHTML = `🔔 <span class="notification-badge">${notificationsCount}</span>`;
        } else {
            bellIcon.innerHTML = '🔔';
        }
    }
}

async function loadNotifications() {
    if (!currentUser) return;

    try {
        const snapshot = await db.ref(`notifications/${currentUser.id}`).once('value');
        const notifications = [];

        snapshot.forEach(child => {
            notifications.push({
                id: child.key,
                ...child.val()
            });
        });

        displayNotifications(notifications);
    } catch (error) {
        console.error('❌ Erro ao carregar notificações:', error);
    }
}

function displayNotifications(notifications) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        max-width: 350px;
        max-height: 400px;
        overflow-y: auto;
    `;

    if (notifications.length === 0) {
        modal.innerHTML = '<p style="padding: 20px; text-align: center; color: #64748b;">Nenhuma notificação</p>';
    } else {
        let html = '<div style="padding: 16px;">';
        notifications.forEach(notif => {
            html += `
                <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">
                    <strong>${notif.type === 'like' ? '❤️' : '👤'}</strong> ${notif.message}
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${new Date(notif.timestamp).toLocaleString('pt-BR')}</div>
                </div>
            `;
        });
        html += '</div>';
        modal.innerHTML = html;
    }

    // Remover modal anterior se existir
    const oldModal = document.querySelector('.notifications-modal');
    if (oldModal) oldModal.remove();

    modal.className = 'notifications-modal';
    document.body.appendChild(modal);

    setTimeout(() => modal.remove(), 5000);
}

// ==================== HOME ====================
async function loadHomeData() {
    if (!currentUser) return;

    document.getElementById('welcome-name').textContent = currentUser.name || 'Usuário';
    document.getElementById('welcome-class').textContent = currentUser.class || 'Não definida';
    document.getElementById('welcome-points').textContent = currentUser.points || 0;

    try {
        const snapshot = await db.ref('subjects').limitToFirst(3).once('value');
        const subjectsList = document.getElementById('home-subjects');
        subjectsList.innerHTML = '';

        if (!snapshot.exists()) {
            subjectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria disponível</p>';
        } else {
            snapshot.forEach(child => {
                const subject = child.val();
                const card = createSubjectCard(child.key, subject);
                subjectsList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar home:', error);
    }
}

// ==================== LOAD ALL DATA ====================
async function loadAllUsers() {
    try {
        const snapshot = await db.ref('users').once('value');
        allUsers = [];

        snapshot.forEach(child => {
            allUsers.push({
                id: child.key,
                ...child.val()
            });
        });

        console.log('✅ Usuários carregados:', allUsers.length);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
    }
}

async function loadAllSubjects() {
    try {
        const snapshot = await db.ref('subjects').once('value');
        allSubjects = [];

        snapshot.forEach(child => {
            allSubjects.push({
                id: child.key,
                ...child.val()
            });
        });

        console.log('✅ Matérias carregadas:', allSubjects.length);
    } catch (error) {
        console.error('❌ Erro ao carregar matérias:', error);
    }
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
        showNotification('O nome da matéria é obrigatório', 'error');
        return;
    }

    try {
        const newSubject = {
            title: title,
            description: desc || '',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            likes: 0
        };

        await db.ref('subjects').push().set(newSubject);

        console.log('✅ Matéria criada com sucesso');
        closeCreateSubject();
        loadSubjects();
        loadAllSubjects();
        showNotification('Matéria criada com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao criar matéria:', error);
        showNotification('Erro ao criar matéria', 'error');
    }
}

async function loadSubjects() {
    try {
        const snapshot = await db.ref('subjects').once('value');
        const container = document.getElementById('subjects-container');
        const detail = document.getElementById('subject-detail');

        if (currentSubject) {
            container.style.display = 'none';
            detail.style.display = 'block';
            await loadSubjectDetail();
        } else {
            container.style.display = 'grid';
            detail.style.display = 'none';
            container.innerHTML = '';

            if (!snapshot.exists()) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria criada</p>';
            } else {
                snapshot.forEach(child => {
                    const subject = child.val();
                    const card = createSubjectCard(child.key, subject);
                    container.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar matérias:', error);
    }
}

function createSubjectCard(id, subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
        <h3>${subject.title}</h3>
        <p>${subject.description || 'Sem descrição'}</p>
        <div style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-icon" onclick="likeSubject('${id}')" style="font-size: 16px;">❤️</button>
            <span style="font-size: 12px; color: #64748b;">${subject.likes || 0}</span>
        </div>
    `;
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            currentSubject = { id, ...subject };
            loadSubjects();
        }
    });
    return card;
}

async function likeSubject(subjectId) {
    try {
        const snapshot = await db.ref(`subjects/${subjectId}`).once('value');
        const subject = snapshot.val();
        const newLikes = (subject.likes || 0) + 1;

        await db.ref(`subjects/${subjectId}/likes`).set(newLikes);

        // Criar notificação para o criador
        if (subject.createdBy !== currentUser.id) {
            await db.ref(`notifications/${subject.createdBy}`).push().set({
                type: 'like',
                message: `${currentUser.name} curtiu seu quiz "${subject.title}"`,
                timestamp: new Date().toISOString(),
                fromUser: currentUser.id
            });
        }

        console.log('✅ Quiz curtido com sucesso');
        loadSubjects();
        showNotification('Quiz curtido!', 'success');
    } catch (error) {
        console.error('❌ Erro ao curtir quiz:', error);
    }
}

async function loadSubjectDetail() {
    document.getElementById('detail-title').textContent = currentSubject.title;
    document.getElementById('detail-desc').textContent = currentSubject.description || 'Sem descrição';

    await loadTopics();
    await loadQuizzes();
}

// ==================== TÓPICOS ====================
function openCreateTopic() {
    document.getElementById('create-topic-form').style.display = 'block';
}

function closeCreateTopic() {
    document.getElementById('create-topic-form').style.display = 'none';
    document.getElementById('topic-title').value = '';
    document.getElementById('topic-content').value = '';
}

async function saveTopic() {
    const title = document.getElementById('topic-title').value.trim();
    const content = document.getElementById('topic-content').value.trim();

    if (!title || !content) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    try {
        const newTopic = {
            title: title,
            content: content,
            subjectId: currentSubject.id,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            likes: 0
        };

        await db.ref('topics').push().set(newTopic);

        console.log('✅ Tópico criado com sucesso');
        closeCreateTopic();
        loadTopics();
        showNotification('Tópico criado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar tópico:', error);
        showNotification('Erro ao salvar tópico', 'error');
    }
}

async function loadTopics() {
    try {
        const snapshot = await db.ref('topics').orderByChild('subjectId').equalTo(currentSubject.id).once('value');
        const topicsList = document.getElementById('topics-list');
        topicsList.innerHTML = '';

        if (!snapshot.exists()) {
            topicsList.innerHTML = '<p style="color: #64748b;">Nenhum tópico nesta matéria</p>';
        } else {
            snapshot.forEach(child => {
                const topic = child.val();
                const item = document.createElement('div');
                item.className = 'topic-item';
                item.innerHTML = `
                    <h5>${topic.title}</h5>
                    <p>${topic.content.substring(0, 100)}...</p>
                    <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-icon" onclick="likeTopic('${child.key}')" style="font-size: 14px;">❤️</button>
                        <span style="font-size: 12px; color: #64748b;">${topic.likes || 0}</span>
                    </div>
                `;
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        currentTopic = { id: child.key, ...topic };
                        showTopicDetail();
                    }
                });
                topicsList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar tópicos:', error);
    }
}

async function likeTopic(topicId) {
    try {
        const snapshot = await db.ref(`topics/${topicId}`).once('value');
        const topic = snapshot.val();
        const newLikes = (topic.likes || 0) + 1;

        await db.ref(`topics/${topicId}/likes`).set(newLikes);

        // Criar notificação para o criador
        if (topic.createdBy !== currentUser.id) {
            await db.ref(`notifications/${topic.createdBy}`).push().set({
                type: 'like',
                message: `${currentUser.name} curtiu seu tópico "${topic.title}"`,
                timestamp: new Date().toISOString(),
                fromUser: currentUser.id
            });
        }

        console.log('✅ Tópico curtido com sucesso');
        loadTopics();
        showNotification('Tópico curtido!', 'success');
    } catch (error) {
        console.error('❌ Erro ao curtir tópico:', error);
    }
}

function showTopicDetail() {
    const detail = document.createElement('div');
    detail.className = 'topic-detail';
    detail.innerHTML = `
        <h5>${currentTopic.title}</h5>
        <p>${currentTopic.content}</p>
    `;

    const container = document.getElementById('topics-list');
    container.insertBefore(detail, container.firstChild);
}

// ==================== QUIZZES ====================
function openCreateQuiz() {
    document.getElementById('create-quiz-form').style.display = 'block';
    document.getElementById('questions-container').innerHTML = '';
    questionCount = 0;
    addQuestion();
}

function closeCreateQuiz() {
    document.getElementById('create-quiz-form').style.display = 'none';
    document.getElementById('quiz-title').value = '';
}

function addQuestion() {
    const container = document.getElementById('questions-container');
    const index = questionCount++;

    const questionBox = document.createElement('div');
    questionBox.className = 'question-box';
    questionBox.innerHTML = `
        <h5>Pergunta ${index + 1}</h5>
        <input type="text" class="form-input question-text-${index}" placeholder="Enunciado da pergunta" required>
        <input type="text" class="form-input question-alt-${index}-0" placeholder="Alternativa A" required>
        <input type="text" class="form-input question-alt-${index}-1" placeholder="Alternativa B" required>
        <input type="text" class="form-input question-alt-${index}-2" placeholder="Alternativa C" required>
        <input type="text" class="form-input question-alt-${index}-3" placeholder="Alternativa D" required>
        <select class="form-input question-correct-${index}" required>
            <option value="">Selecione a resposta correta</option>
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
        </select>
        <button type="button" class="btn btn-danger btn-small" onclick="removeQuestion(${index})">Remover</button>
    `;

    container.appendChild(questionBox);
}

function removeQuestion(index) {
    const box = document.querySelector(`.question-text-${index}`)?.closest('.question-box');
    if (box) box.remove();
}

async function saveQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    const questionBoxes = document.querySelectorAll('.question-box');

    if (!title || questionBoxes.length === 0) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    const questions = [];

    for (let i = 0; i < questionCount; i++) {
        const text = document.querySelector(`.question-text-${i}`)?.value.trim();
        const alternatives = [
            document.querySelector(`.question-alt-${i}-0`)?.value.trim(),
            document.querySelector(`.question-alt-${i}-1`)?.value.trim(),
            document.querySelector(`.question-alt-${i}-2`)?.value.trim(),
            document.querySelector(`.question-alt-${i}-3`)?.value.trim()
        ];
        const correct = parseInt(document.querySelector(`.question-correct-${i}`)?.value);

        if (!text || alternatives.some(a => !a) || isNaN(correct)) {
            showNotification('Preencha todas as perguntas corretamente', 'error');
            return;
        }

        questions.push({
            text: text,
            alternatives: alternatives,
            correct: correct
        });
    }

    try {
        const newQuiz = {
            title: title,
            subjectId: currentSubject.id,
            questions: questions,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            likes: 0
        };

        await db.ref('quizzes').push().set(newQuiz);

        console.log('✅ Quiz criado com sucesso');
        closeCreateQuiz();
        loadQuizzes();
        showNotification('Quiz criado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar quiz:', error);
        showNotification('Erro ao salvar quiz', 'error');
    }
}

async function loadQuizzes() {
    try {
        const snapshot = await db.ref('quizzes').orderByChild('subjectId').equalTo(currentSubject.id).once('value');
        const quizzesList = document.getElementById('quizzes-list');
        quizzesList.innerHTML = '';

        if (!snapshot.exists()) {
            quizzesList.innerHTML = '<p style="color: #64748b;">Nenhum quiz nesta matéria</p>';
        } else {
            snapshot.forEach(child => {
                const quiz = child.val();
                const item = document.createElement('div');
                item.className = 'quiz-item';
                item.innerHTML = `
                    <span class="quiz-item-name">${quiz.title}</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-icon" onclick="likeQuiz('${child.key}')" style="font-size: 14px;">❤️</button>
                        <span style="font-size: 12px; color: #64748b;">${quiz.likes || 0}</span>
                        <button class="btn btn-primary btn-small">Jogar</button>
                    </div>
                `;
                item.querySelector('.btn-primary').addEventListener('click', () => startQuiz(child.key));
                quizzesList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar quizzes:', error);
    }
}

async function likeQuiz(quizId) {
    try {
        const snapshot = await db.ref(`quizzes/${quizId}`).once('value');
        const quiz = snapshot.val();
        const newLikes = (quiz.likes || 0) + 1;

        await db.ref(`quizzes/${quizId}/likes`).set(newLikes);

        // Criar notificação para o criador
        if (quiz.createdBy !== currentUser.id) {
            await db.ref(`notifications/${quiz.createdBy}`).push().set({
                type: 'like',
                message: `${currentUser.name} curtiu seu quiz "${quiz.title}"`,
                timestamp: new Date().toISOString(),
                fromUser: currentUser.id
            });
        }

        console.log('✅ Quiz curtido com sucesso');
        loadQuizzes();
        showNotification('Quiz curtido!', 'success');
    } catch (error) {
        console.error('❌ Erro ao curtir quiz:', error);
    }
}

async function startQuiz(quizId) {
    try {
        const snapshot = await db.ref(`quizzes/${quizId}`).once('value');
        const quiz = snapshot.val();

        if (!quiz) {
            showNotification('Quiz não encontrado', 'error');
            return;
        }

        currentQuiz = { id: quizId, ...quiz };
        currentQuestions = quiz.questions;
        currentQuestionIndex = 0;
        currentScore = 0;
        currentCorrect = 0;
        currentIncorrect = 0;

        showScreen('quiz');
        showQuestion();
    } catch (error) {
        console.error('❌ Erro ao iniciar quiz:', error);
    }
}

function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        finishQuiz();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];

    document.getElementById('question-text').textContent = question.text;
    document.getElementById('progress-text').textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;

    const percentage = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = percentage + '%';

    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';

    question.alternatives.forEach((alt, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = alt;
        btn.addEventListener('click', () => selectAnswer(index, btn));
        answersContainer.appendChild(btn);
    });

    document.getElementById('btn-next-question').style.display = 'none';
}

function selectAnswer(index, clickedBtn) {
    const question = currentQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.answer-btn');

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        btn.classList.remove('selected', 'correct', 'incorrect');

        if (i === question.correct) {
            btn.classList.add('correct');
        } else if (i === index && index !== question.correct) {
            btn.classList.add('incorrect');
        }
    });

    if (index === question.correct) {
        currentScore += 10;
        currentCorrect++;
    } else {
        currentIncorrect++;
    }

    setTimeout(() => {
        document.getElementById('btn-next-question').style.display = 'block';
    }, 800);
}

function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

async function finishQuiz() {
    try {
        // Atualizar pontos do usuário no Firebase
        const newPoints = (currentUser.points || 0) + currentScore;
        await db.ref(`users/${currentUser.id}/points`).set(newPoints);

        currentUser.points = newPoints;
        storage.setCurrentUser(currentUser);

        document.getElementById('result-score').textContent = currentScore;
        document.getElementById('result-correct').textContent = currentCorrect;
        document.getElementById('result-incorrect').textContent = currentIncorrect;
        
        let message = '';
        if (currentScore >= 80) {
            message = 'Excelente! Você foi muito bem! 🌟';
        } else if (currentScore >= 60) {
            message = 'Parabéns! Você foi bem! 🎉';
        } else if (currentScore >= 40) {
            message = 'Bom esforço! Continue estudando! 💪';
        } else {
            message = 'Não desista! Tente novamente! 🚀';
        }
        
        document.getElementById('result-message').textContent = message;

        console.log('✅ Quiz finalizado com sucesso. Pontuação:', currentScore);
        showScreen('result');
        updateUserDisplay();
        loadAllUsers();
    } catch (error) {
        console.error('❌ Erro ao finalizar quiz:', error);
    }
}

function backToSubjects() {
    currentSubject = null;
    currentTopic = null;
    document.getElementById('create-quiz-form').style.display = 'none';
    document.getElementById('create-topic-form').style.display = 'none';
    loadSubjects();
}

// ==================== RANKING ====================
async function loadRanking() {
    try {
        const snapshot = await db.ref('users').orderByChild('points').once('value');
        const users = [];

        snapshot.forEach(child => {
            users.push({
                id: child.key,
                ...child.val()
            });
        });

        // Ordenar do maior para o menor
        users.sort((a, b) => (b.points || 0) - (a.points || 0));

        const rankingContainer = document.getElementById('ranking-container');
        rankingContainer.innerHTML = '';

        if (users.length === 0) {
            rankingContainer.innerHTML = '<p style="text-align: center; color: #64748b;">Nenhum usuário ainda</p>';
            return;
        }

        let position = 1;
        users.slice(0, 50).forEach(user => {
            const item = document.createElement('div');
            item.className = 'ranking-item';

            let positionClass = '';
            if (position === 1) positionClass = 'gold';
            else if (position === 2) positionClass = 'silver';
            else if (position === 3) positionClass = 'bronze';

            item.innerHTML = `
                <div class="ranking-position ${positionClass}">${position}º</div>
                <div class="ranking-info">
                    <div class="ranking-name">${user.name || 'Usuário'}</div>
                    <div class="ranking-class">${user.class || 'Não definida'}</div>
                </div>
                <div class="ranking-points">${user.points || 0} pts</div>
            `;

            rankingContainer.appendChild(item);
            position++;
        });
    } catch (error) {
        console.error('❌ Erro ao carregar ranking:', error);
    }
}

// ==================== DESCOBRIR (FEED GLOBAL) ====================
async function loadDiscover() {
    document.getElementById('discover-search-input').value = '';
    setupDiscoverTabs();
    await displayDiscoverSubjects('');
    await displayDiscoverPeople('');
}

function setupDiscoverTabs() {
    const tabs = document.querySelectorAll('.discover-tab');

    tabs.forEach(tab => {
        tab.removeEventListener('click', handleDiscoverTabClick);
        tab.addEventListener('click', handleDiscoverTabClick);
    });

    const searchInput = document.getElementById('discover-search-input');
    searchInput.removeEventListener('input', handleDiscoverSearch);
    searchInput.addEventListener('input', handleDiscoverSearch);
}

function handleDiscoverTabClick(e) {
    const tabName = e.target.getAttribute('data-tab');
    
    document.querySelectorAll('.discover-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.discover-tab-content').forEach(c => c.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById('discover-' + tabName + '-tab').classList.add('active');
}

function handleDiscoverSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    const activeTab = document.querySelector('.discover-tab.active').getAttribute('data-tab');
    
    if (activeTab === 'subjects') {
        displayDiscoverSubjects(query);
    } else {
        displayDiscoverPeople(query);
    }
}

async function displayDiscoverSubjects(query) {
    try {
        const snapshot = await db.ref('subjects').once('value');
        let subjects = [];

        snapshot.forEach(child => {
            subjects.push({
                id: child.key,
                ...child.val()
            });
        });

        if (query) {
            subjects = subjects.filter(s => 
                s.title.toLowerCase().includes(query)
            );
        }

        const list = document.getElementById('discover-subjects-list');
        list.innerHTML = '';

        if (subjects.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma matéria encontrada</p>';
            return;
        }

        subjects.forEach(subject => {
            const item = document.createElement('div');
            item.className = 'discover-item';
            item.innerHTML = `
                <div class="discover-item-info">
                    <h4>${subject.title}</h4>
                    <p>${subject.description || 'Sem descrição'}</p>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Por ${subject.createdByName || 'Anônimo'}</p>
                </div>
                <div class="discover-item-actions">
                    <button class="btn btn-primary btn-small" onclick="selectSubjectFromDiscover('${subject.id}')">Acessar</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('❌ Erro ao exibir matérias:', error);
    }
}

async function displayDiscoverPeople(query) {
    try {
        const snapshot = await db.ref('users').once('value');
        let people = [];

        snapshot.forEach(child => {
            if (child.key !== currentUser.id) {
                people.push({
                    id: child.key,
                    ...child.val()
                });
            }
        });

        if (query) {
            people = people.filter(u => 
                u.name.toLowerCase().includes(query)
            );
        }

        const list = document.getElementById('discover-people-list');
        list.innerHTML = '';

        if (people.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma pessoa encontrada</p>';
            return;
        }

        people.forEach(person => {
            const isFollowing = currentUser.following && currentUser.following.includes(person.id);
            
            const item = document.createElement('div');
            item.className = 'discover-item';
            item.innerHTML = `
                <div class="discover-item-info">
                    <h4>${person.name}</h4>
                    <p>${person.class || 'Não definida'} • ${person.points || 0} pontos</p>
                </div>
                <div class="discover-item-actions">
                    <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-small" onclick="followUser('${person.id}', this)" ${isFollowing ? 'disabled' : ''}>
                        ${isFollowing ? '✓ Seguindo' : '👤 Seguir'}
                    </button>
                </div>
            `;
            
            list.appendChild(item);
        });
    } catch (error) {
        console.error('❌ Erro ao exibir pessoas:', error);
    }
}

function selectSubjectFromDiscover(subjectId) {
    const subject = allSubjects.find(s => s.id === subjectId);
    currentSubject = subject;
    showScreen('subjects');
    loadSubjects();
}

async function followUser(userId, btn) {
    try {
        if (!currentUser.following) {
            currentUser.following = [];
        }

        if (currentUser.following.includes(userId)) {
            showNotification('Você já está seguindo este usuário', 'info');
            return;
        }

        currentUser.following.push(userId);
        await db.ref(`users/${currentUser.id}/following`).set(currentUser.following);
        storage.setCurrentUser(currentUser);

        // Adicionar seguidor para o outro usuário
        const snapshot = await db.ref(`users/${userId}/followers`).once('value');
        let followers = snapshot.val() || [];
        followers.push(currentUser.id);
        await db.ref(`users/${userId}/followers`).set(followers);

        // Criar notificação
        await db.ref(`notifications/${userId}`).push().set({
            type: 'follow',
            message: `${currentUser.name} começou a te seguir`,
            timestamp: new Date().toISOString(),
            fromUser: currentUser.id
        });

        console.log('✅ Usuário seguido com sucesso');
        btn.disabled = true;
        btn.textContent = '✓ Seguindo';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        
        showNotification('Usuário seguido com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao seguir usuário:', error);
        showNotification('Erro ao seguir usuário', 'error');
    }
}

// ==================== CHAT ====================
async function loadChats() {
    const chatList = document.getElementById('chat-list');
    const chatWindow = document.getElementById('chat-window');

    if (currentChat) {
        chatList.style.display = 'none';
        chatWindow.style.display = 'flex';
        await loadChatMessages();
    } else {
        chatList.style.display = 'grid';
        chatWindow.style.display = 'none';

        const friends = currentUser.friends || [];
        chatList.innerHTML = '';

        if (friends.length === 0) {
            chatList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhum amigo para conversar. Adicione amigos na aba Descobrir!</p>';
        } else {
            for (const friendId of friends) {
                try {
                    const snapshot = await db.ref(`users/${friendId}`).once('value');
                    const friend = snapshot.val();
                    if (friend) {
                        const item = document.createElement('div');
                        item.className = 'chat-item';
                        item.innerHTML = `
                            <div class="chat-item-info">
                                <h3>${friend.name}</h3>
                                <p>${friend.class}</p>
                            </div>
                            <span class="chat-item-time">💬</span>
                        `;
                        item.addEventListener('click', () => {
                            currentChat = { id: friendId, name: friend.name };
                            loadChats();
                        });
                        chatList.appendChild(item);
                    }
                } catch (error) {
                    console.error('❌ Erro ao carregar amigo:', error);
                }
            }
        }
    }
}

async function loadChatMessages() {
    document.getElementById('chat-title').textContent = currentChat.name;
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    messagesContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma mensagem ainda. Comece a conversa!</p>';
}

function backToChats() {
    currentChat = null;
    loadChats();
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) return;

    console.log('✅ Mensagem enviada');
    input.value = '';
    loadChatMessages();
}

// ==================== PROFILE ====================
async function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profile-name').textContent = currentUser.name || 'Usuário';
    document.getElementById('profile-class').textContent = `Sala: ${currentUser.class || 'Não definida'}`;
    document.getElementById('profile-points').textContent = `${currentUser.points || 0} pontos ⭐`;

    document.getElementById('profile-username').textContent = currentUser.name || 'N/A';
    document.getElementById('profile-class-info').textContent = currentUser.class || 'Não definida';
    document.getElementById('profile-points-info').textContent = currentUser.points || 0;

    await loadFriends(currentUser.friends || []);
}

async function loadFriends(friendIds) {
    const friendsList = document.getElementById('friends-list');
    friendsList.innerHTML = '';

    if (friendIds.length === 0) {
        friendsList.innerHTML = '<p style="color: #64748b;">Você ainda não tem amigos</p>';
        return;
    }

    for (const friendId of friendIds) {
        try {
            const snapshot = await db.ref(`users/${friendId}`).once('value');
            const friend = snapshot.val();
            if (friend) {
                const item = document.createElement('div');
                item.className = 'friend-item';
                item.innerHTML = `
                    <div class="friend-info">
                        <h4>${friend.name}</h4>
                        <p>${friend.class}</p>
                    </div>
                    <div class="friend-actions">
                        <button class="btn btn-primary btn-small" onclick="removeFriend('${friendId}')">Remover</button>
                    </div>
                `;
                friendsList.appendChild(item);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar amigo:', error);
        }
    }
}

function openEditProfile() {
    const newClass = prompt('Digite sua nova sala:', currentUser.class);
    
    if (newClass !== null && newClass.trim() !== '') {
        currentUser.class = newClass.trim();
        db.ref(`users/${currentUser.id}/class`).set(currentUser.class);
        storage.setCurrentUser(currentUser);
        
        console.log('✅ Perfil atualizado com sucesso');
        loadProfile();
        loadHomeData();
        showNotification('Sala atualizada com sucesso!', 'success');
    }
}

function openChangePassword() {
    const newPassword = prompt('Digite sua nova senha (mínimo 6 caracteres):');
    
    if (newPassword !== null && newPassword.trim() !== '') {
        if (newPassword.length < 6) {
            showNotification('Senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        currentUser.password = newPassword;
        db.ref(`users/${currentUser.id}/password`).set(currentUser.password);
        storage.setCurrentUser(currentUser);
        
        console.log('✅ Senha alterada com sucesso');
        showNotification('Senha alterada com sucesso!', 'success');
    }
}

function openAddFriend() {
    const friendName = prompt('Digite o nome do amigo que deseja adicionar:');
    
    if (friendName !== null && friendName.trim() !== '') {
        // Buscar usuário pelo nome
        db.ref('users').orderByChild('name').equalTo(friendName.trim()).once('value', async (snapshot) => {
            if (!snapshot.exists()) {
                showNotification('Usuário não encontrado', 'error');
                return;
            }

            let friend = null;
            let friendId = null;

            snapshot.forEach(child => {
                friend = child.val();
                friendId = child.key;
            });

            if (friendId === currentUser.id) {
                showNotification('Você não pode adicionar a si mesmo', 'error');
                return;
            }

            if (currentUser.friends && currentUser.friends.includes(friendId)) {
                showNotification('Este usuário já é seu amigo', 'info');
                return;
            }

            if (!currentUser.friends) {
                currentUser.friends = [];
            }

            currentUser.friends.push(friendId);
            await db.ref(`users/${currentUser.id}/friends`).set(currentUser.friends);
            storage.setCurrentUser(currentUser);

            console.log('✅ Amigo adicionado com sucesso');
            showNotification('Amigo adicionado com sucesso!', 'success');
            loadProfile();
        });
    }
}

function removeFriend(friendId) {
    if (confirm('Tem certeza que deseja remover este amigo?')) {
        currentUser.friends = currentUser.friends.filter(id => id !== friendId);
        db.ref(`users/${currentUser.id}/friends`).set(currentUser.friends);
        storage.setCurrentUser(currentUser);

        console.log('✅ Amigo removido com sucesso');
        loadProfile();
        showNotification('Amigo removido', 'success');
    }
}

// ==================== ADM ====================
function loadAdmPanel() {
    if (!admLoggedIn) {
        document.getElementById('adm-login').style.display = 'block';
        document.getElementById('adm-panel').style.display = 'none';
    } else {
        document.getElementById('adm-login').style.display = 'none';
        document.getElementById('adm-panel').style.display = 'grid';
        populateSubjectSelect();
        loadAdmData();
    }
}

async function populateSubjectSelect() {
    const select = document.getElementById('adm-quiz-subject');
    select.innerHTML = '<option value="">-- Escolha uma matéria --</option>';
    
    try {
        const snapshot = await db.ref('subjects').once('value');
        snapshot.forEach(child => {
            const option = document.createElement('option');
            option.value = child.key;
            option.textContent = child.val().title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar matérias:', error);
    }
}

function admLogin() {
    const password = document.getElementById('adm-password').value.trim();

    if (password === 'senhafacil') {
        admLoggedIn = true;
        document.getElementById('adm-password').value = '';
        document.getElementById('adm-login-error').classList.remove('show');
        console.log('✅ Acesso ao painel ADM concedido');
        loadAdmPanel();
    } else {
        const errorEl = document.getElementById('adm-login-error');
        errorEl.textContent = '❌ Senha incorreta';
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 3000);
    }
}

function admLogout() {
    admLoggedIn = false;
    document.getElementById('adm-password').value = '';
    loadAdmPanel();
}

async function depositPoints() {
    const amount = parseInt(document.getElementById('adm-points-amount').value);

    if (!amount || amount < 1) {
        showNotification('Digite uma quantidade válida', 'error');
        return;
    }

    try {
        currentUser.points = (currentUser.points || 0) + amount;
        await db.ref(`users/${currentUser.id}/points`).set(currentUser.points);
        storage.setCurrentUser(currentUser);

        document.getElementById('adm-points-amount').value = '';
        showNotification(`${amount} pontos depositados com sucesso!`, 'success');
        updateUserDisplay();
        loadHomeData();
        loadAllUsers();
    } catch (error) {
        console.error('❌ Erro ao depositar pontos:', error);
        showNotification('Erro ao depositar pontos', 'error');
    }
}

async function createQuizFromCode() {
    const subjectId = document.getElementById('adm-quiz-subject').value;
    const code = document.getElementById('adm-quiz-code').value.trim();

    if (!subjectId) {
        showNotification('Selecione uma matéria', 'error');
        return;
    }

    if (!code) {
        showNotification('Digite o código do quiz', 'error');
        return;
    }

    try {
        const lines = code.split('\n').filter(l => l.trim());
        let quizTitle = 'Quiz Importado';
        let questions = [];
        let currentQuestion = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Comando /n para nome do quiz
            if (trimmed.startsWith('/n')) {
                quizTitle = trimmed.substring(2).trim() || 'Quiz Importado';
            } else if (trimmed.startsWith('/q1')) {
                if (currentQuestion && currentQuestion.text) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    text: trimmed.substring(3).trim(),
                    alternatives: [],
                    correct: 0
                };
            } else if (trimmed.startsWith('/a1')) {
                if (currentQuestion) currentQuestion.alternatives[0] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a2')) {
                if (currentQuestion) currentQuestion.alternatives[1] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a3')) {
                if (currentQuestion) currentQuestion.alternatives[2] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/a4')) {
                if (currentQuestion) currentQuestion.alternatives[3] = trimmed.substring(3).trim();
            } else if (trimmed.startsWith('/c')) {
                if (currentQuestion) {
                    const correctIndex = parseInt(trimmed.substring(2).trim()) - 1;
                    currentQuestion.correct = correctIndex >= 0 ? correctIndex : 0;
                }
            }
        }

        if (currentQuestion && currentQuestion.text) {
            questions.push(currentQuestion);
        }

        if (questions.length === 0) {
            showNotification('Nenhuma pergunta válida encontrada no código', 'error');
            return;
        }

        // Validar perguntas
        for (const q of questions) {
            if (!q.text || q.alternatives.length < 4) {
                showNotification('Cada pergunta deve ter 4 alternativas', 'error');
                return;
            }
        }

        // Salvar quiz no Firebase
        const newQuiz = {
            title: quizTitle,
            subjectId: subjectId,
            questions: questions,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            likes: 0
        };

        await db.ref('quizzes').push().set(newQuiz);

        console.log('✅ Quiz criado via código com sucesso');
        document.getElementById('adm-quiz-code').value = '';
        document.getElementById('adm-quiz-subject').value = '';
        showNotification('Quiz criado com sucesso!', 'success');
        loadAdmData();
    } catch (error) {
        console.error('❌ Erro ao criar quiz via código:', error);
        showNotification('Erro ao criar quiz. Verifique o formato do código', 'error');
    }
}

async function loadAdmData() {
    try {
        // Carregar matérias
        const subjectsSnapshot = await db.ref('subjects').once('value');
        const admSubjects = document.getElementById('adm-subjects');
        admSubjects.innerHTML = '';

        subjectsSnapshot.forEach(child => {
            const subject = child.val();
            const item = document.createElement('div');
            item.className = 'adm-item';
            item.innerHTML = `
                <div class="adm-item-info">
                    <h4>${subject.title}</h4>
                    <p>${subject.description || 'Sem descrição'}</p>
                </div>
                <div class="adm-item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteSubject('${child.key}')">Deletar</button>
                </div>
            `;
            admSubjects.appendChild(item);
        });

        // Carregar quizzes
        const quizzesSnapshot = await db.ref('quizzes').once('value');
        const admQuizzes = document.getElementById('adm-quizzes');
        admQuizzes.innerHTML = '';

        quizzesSnapshot.forEach(child => {
            const quiz = child.val();
            const item = document.createElement('div');
            item.className = 'adm-item';
            item.innerHTML = `
                <div class="adm-item-info">
                    <h4>${quiz.title}</h4>
                    <p>${quiz.questions.length} perguntas</p>
                </div>
                <div class="adm-item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteQuiz('${child.key}')">Deletar</button>
                </div>
            `;
            admQuizzes.appendChild(item);
        });

        // Carregar usuários
        const usersSnapshot = await db.ref('users').once('value');
        const admUsers = document.getElementById('adm-users');
        admUsers.innerHTML = '';

        usersSnapshot.forEach(child => {
            const user = child.val();
            const item = document.createElement('div');
            
