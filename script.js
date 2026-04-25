// ==================== LOCALSTORAGE MANAGER ====================
class StorageManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('subjects')) {
            localStorage.setItem('subjects', JSON.stringify([]));
        }
        if (!localStorage.getItem('quizzes')) {
            localStorage.setItem('quizzes', JSON.stringify([]));
        }
        if (!localStorage.getItem('topics')) {
            localStorage.setItem('topics', JSON.stringify([]));
        }
        if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(null));
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    getSubjects() {
        return JSON.parse(localStorage.getItem('subjects')) || [];
    }

    saveSubjects(subjects) {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    getQuizzes() {
        return JSON.parse(localStorage.getItem('quizzes')) || [];
    }

    saveQuizzes(quizzes) {
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
    }

    getTopics() {
        return JSON.parse(localStorage.getItem('topics')) || [];
    }

    saveTopics(topics) {
        localStorage.setItem('topics', JSON.stringify(topics));
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

    findUserByName(name) {
        const users = this.getUsers();
        return users.find(u => u.name.toLowerCase() === name.toLowerCase());
    }

    findUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    }

    updateUser(userId, userData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            this.saveUsers(users);
            return users[index];
        }
        return null;
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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App iniciado');
    setupAuthEventListeners();
    setupAppEventListeners();
    setupNavigationListeners();
    
    // Verificar se há usuário logado
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
        currentUser = savedUser;
        showApp();
        updateUserDisplay();
        loadHomeData();
        loadAllUsers();
        loadAllSubjects();
    } else {
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

function handleLogin() {
    const username = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showAuthError('Preencha todos os campos');
        return;
    }

    // Buscar usuário no localStorage
    const user = storage.findUserByName(username);

    if (!user) {
        showAuthError('Usuário não encontrado');
        return;
    }

    if (user.password !== password) {
        showAuthError('Senha incorreta');
        return;
    }

    // Login bem-sucedido
    currentUser = user;
    storage.setCurrentUser(user);
    console.log('✅ Login realizado com sucesso:', user.id);

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    showApp();
    updateUserDisplay();
    loadHomeData();
    loadAllUsers();
    loadAllSubjects();
}

function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const passwordConfirm = document.getElementById('signup-password-confirm').value.trim();
    const classroom = document.getElementById('signup-class').value.trim();

    if (!name || !password || !passwordConfirm || !classroom) {
        showAuthError('Preencha todos os campos', true);
        return;
    }

    // Verificar se nome já existe
    const nameExists = storage.findUserByName(name);
    if (nameExists) {
        showAuthNameError('Este nome já está em uso. Escolha outro');
        return;
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
        // Criar novo usuário
        const newUser = {
            id: storage.generateId(),
            name: name,
            password: password,
            class: classroom,
            points: 0,
            friends: [],
            createdAt: new Date().toISOString()
        };

        const users = storage.getUsers();
        users.push(newUser);
        storage.saveUsers(users);

        console.log('✅ Usuário criado com sucesso:', {
            id: newUser.id,
            name: newUser.name,
            class: newUser.class
        });

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
    // Limpar todas as seções
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        // Limpar conteúdo dinâmico
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

// ==================== HOME ====================
function loadHomeData() {
    if (!currentUser) return;

    document.getElementById('welcome-name').textContent = currentUser.name || 'Usuário';
    document.getElementById('welcome-class').textContent = currentUser.class || 'Não definida';
    document.getElementById('welcome-points').textContent = currentUser.points || 0;

    // Carregar matérias recentes
    const subjects = storage.getSubjects().slice(0, 3);
    const subjectsList = document.getElementById('home-subjects');
    subjectsList.innerHTML = '';

    if (subjects.length === 0) {
        subjectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria disponível</p>';
    } else {
        subjects.forEach(subject => {
            const card = createSubjectCard(subject.id, subject);
            subjectsList.appendChild(card);
        });
    }
}

// ==================== LOAD ALL DATA ====================
function loadAllUsers() {
    allUsers = storage.getUsers();
    console.log('✅ Usuários carregados:', allUsers.length);
}

function loadAllSubjects() {
    allSubjects = storage.getSubjects();
    console.log('✅ Matérias carregadas:', allSubjects.length);
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

function createSubject() {
    const title = document.getElementById('subject-title').value.trim();
    const desc = document.getElementById('subject-desc').value.trim();

    if (!title) {
        showNotification('O nome da matéria é obrigatório', 'error');
        return;
    }

    try {
        const newSubject = {
            id: storage.generateId(),
            title: title,
            description: desc || '',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        const subjects = storage.getSubjects();
        subjects.push(newSubject);
        storage.saveSubjects(subjects);

        console.log('✅ Matéria criada com sucesso');
        closeCreateSubject();
        loadSubjects();
        loadAllSubjects();
        loadAdmData();
    } catch (error) {
        console.error('❌ Erro ao criar matéria:', error);
        showNotification('Erro ao criar matéria', 'error');
    }
}

function loadSubjects() {
    const subjects = storage.getSubjects();
    const container = document.getElementById('subjects-container');
    const detail = document.getElementById('subject-detail');

    if (currentSubject) {
        container.style.display = 'none';
        detail.style.display = 'block';
        loadSubjectDetail();
    } else {
        container.style.display = 'grid';
        detail.style.display = 'none';
        container.innerHTML = '';

        if (subjects.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria criada</p>';
        } else {
            subjects.forEach(subject => {
                const card = createSubjectCard(subject.id, subject);
                container.appendChild(card);
            });
        }
    }
}

function createSubjectCard(id, subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
        <h3>${subject.title}</h3>
        <p>${subject.description || 'Sem descrição'}</p>
    `;
    card.addEventListener('click', () => {
        currentSubject = { id, ...subject };
        loadSubjects();
    });
    return card;
}

function loadSubjectDetail() {
    document.getElementById('detail-title').textContent = currentSubject.title;
    document.getElementById('detail-desc').textContent = currentSubject.description || 'Sem descrição';

    loadTopics();
    loadQuizzes();
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

function saveTopic() {
    const title = document.getElementById('topic-title').value.trim();
    const content = document.getElementById('topic-content').value.trim();

    if (!title || !content) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    try {
        const newTopic = {
            id: storage.generateId(),
            title: title,
            content: content,
            subjectId: currentSubject.id,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        const topics = storage.getTopics();
        topics.push(newTopic);
        storage.saveTopics(topics);

        console.log('✅ Tópico criado com sucesso');
        closeCreateTopic();
        loadTopics();
    } catch (error) {
        console.error('❌ Erro ao salvar tópico:', error);
        showNotification('Erro ao salvar tópico', 'error');
    }
}

function loadTopics() {
    const topics = storage.getTopics().filter(t => t.subjectId === currentSubject.id);
    const topicsList = document.getElementById('topics-list');
    topicsList.innerHTML = '';

    if (topics.length === 0) {
        topicsList.innerHTML = '<p style="color: #64748b;">Nenhum tópico nesta matéria</p>';
    } else {
        topics.forEach(topic => {
            const item = document.createElement('div');
            item.className = 'topic-item';
            item.innerHTML = `
                <h5>${topic.title}</h5>
                <p>${topic.content.substring(0, 100)}...</p>
            `;
            item.addEventListener('click', () => {
                currentTopic = { id: topic.id, ...topic };
                showTopicDetail();
            });
            topicsList.appendChild(item);
        });
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

function saveQuiz() {
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
            id: storage.generateId(),
            title: title,
            subjectId: currentSubject.id,
            questions: questions,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        const quizzes = storage.getQuizzes();
        quizzes.push(newQuiz);
        storage.saveQuizzes(quizzes);

        console.log('✅ Quiz criado com sucesso');
        closeCreateQuiz();
        loadQuizzes();
    } catch (error) {
        console.error('❌ Erro ao salvar quiz:', error);
        showNotification('Erro ao salvar quiz', 'error');
    }
}

function loadQuizzes() {
    const quizzes = storage.getQuizzes().filter(q => q.subjectId === currentSubject.id);
    const quizzesList = document.getElementById('quizzes-list');
    quizzesList.innerHTML = '';

    if (quizzes.length === 0) {
        quizzesList.innerHTML = '<p style="color: #64748b;">Nenhum quiz nesta matéria</p>';
    } else {
        quizzes.forEach(quiz => {
            const item = document.createElement('div');
            item.className = 'quiz-item';
            item.innerHTML = `
                <span class="quiz-item-name">${quiz.title}</span>
                <button class="btn btn-primary btn-small">Jogar</button>
            `;
            item.querySelector('button').addEventListener('click', () => startQuiz(quiz.id));
            quizzesList.appendChild(item);
        });
    }
}

function startQuiz(quizId) {
    const quizzes = storage.getQuizzes();
    const quiz = quizzes.find(q => q.id === quizId);

    if (!quiz) {
        showNotification('Quiz não encontrado', 'error');
        return;
    }

    currentQuiz = quiz;
    currentQuestions = quiz.questions;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentCorrect = 0;
    currentIncorrect = 0;

    showScreen('quiz');
    showQuestion();
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

function finishQuiz() {
    try {
        // Atualizar pontos do usuário
        currentUser.points = (currentUser.points || 0) + currentScore;
        storage.updateUser(currentUser.id, { points: currentUser.points });
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
function loadRanking() {
    const users = storage.getUsers()
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 50);

    const rankingContainer = document.getElementById('ranking-container');
    rankingContainer.innerHTML = '';

    if (users.length === 0) {
        rankingContainer.innerHTML = '<p style="text-align: center; color: #64748b;">Nenhum usuário ainda</p>';
        return;
    }

    let position = 1;
    users.forEach(user => {
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
}

// ==================== DESCOBRIR ====================
function loadDiscover() {
    document.getElementById('discover-search-input').value = '';
    setupDiscoverTabs();
    displayDiscoverSubjects('');
    displayDiscoverPeople('');
}

function setupDiscoverTabs() {
    const tabs = document.querySelectorAll('.discover-tab');
    const contents = document.querySelectorAll('.discover-tab-content');

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

function displayDiscoverSubjects(query) {
    let subjects = storage.getSubjects();
    
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
            </div>
            <div class="discover-item-actions">
                <button class="btn btn-primary btn-small" onclick="selectSubjectFromDiscover('${subject.id}')">Acessar</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function displayDiscoverPeople(query) {
    let people = storage.getUsers().filter(u => u.id !== currentUser.id);
    
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
        const isFriend = currentUser.friends && currentUser.friends.includes(person.id);
        
        const item = document.createElement('div');
        item.className = 'discover-item';
        item.innerHTML = `
            <div class="discover-item-info">
                <h4>${person.name}</h4>
                <p>${person.class || 'Não definida'} • ${person.points || 0} pontos</p>
            </div>
            <div class="discover-item-actions">
                <button class="btn ${isFriend ? 'btn-secondary' : 'btn-primary'} btn-small" onclick="addFriendFromDiscover('${person.id}', this)" ${isFriend ? 'disabled' : ''}>
                    ${isFriend ? '✓ Amigo' : '➕ Adicionar'}
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function selectSubjectFromDiscover(subjectId) {
    const subjects = storage.getSubjects();
    const subject = subjects.find(s => s.id === subjectId);
    currentSubject = subject;
    showScreen('subjects');
    loadSubjects();
}

function addFriendFromDiscover(friendId, btn) {
    if (currentUser.friends && currentUser.friends.includes(friendId)) {
        showNotification('Este usuário já é seu amigo', 'info');
        return;
    }

    if (!currentUser.friends) {
        currentUser.friends = [];
    }

    currentUser.friends.push(friendId);
    storage.updateUser(currentUser.id, { friends: currentUser.friends });
    storage.setCurrentUser(currentUser);

    console.log('✅ Amigo adicionado com sucesso');
    btn.disabled = true;
    btn.textContent = '✓ Amigo';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    
    showNotification('Amigo adicionado com sucesso!', 'success');
}

// ==================== CHAT ====================
function loadChats() {
    const chatList = document.getElementById('chat-list');
    const chatWindow = document.getElementById('chat-window');

    if (currentChat) {
        chatList.style.display = 'none';
        chatWindow.style.display = 'flex';
        loadChatMessages();
    } else {
        chatList.style.display = 'grid';
        chatWindow.style.display = 'none';

        const friends = currentUser.friends || [];
        chatList.innerHTML = '';

        if (friends.length === 0) {
            chatList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhum amigo para conversar. Adicione amigos na aba Descobrir!</p>';
        } else {
            friends.forEach(friendId => {
                const friend = storage.findUserById(friendId);
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
            });
        }
    }
}

function loadChatMessages() {
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
function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profile-name').textContent = currentUser.name || 'Usuário';
    document.getElementById('profile-class').textContent = `Sala: ${currentUser.class || 'Não definida'}`;
    document.getElementById('profile-points').textContent = `${currentUser.points || 0} pontos ⭐`;

    document.getElementById('profile-username').textContent = currentUser.name || 'N/A';
    document.getElementById('profile-class-info').textContent = currentUser.class || 'Não definida';
    document.getElementById('profile-points-info').textContent = currentUser.points || 0;

    loadFriends(currentUser.friends || []);
}

function loadFriends(friendIds) {
    const friendsList = document.getElementById('friends-list');
    friendsList.innerHTML = '';

    if (friendIds.length === 0) {
        friendsList.innerHTML = '<p style="color: #64748b;">Você ainda não tem amigos</p>';
        return;
    }

    friendIds.forEach(friendId => {
        const friend = storage.findUserById(friendId);
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
    });
}

function openEditProfile() {
    const newClass = prompt('Digite sua nova sala:', currentUser.class);
    
    if (newClass !== null && newClass.trim() !== '') {
        currentUser.class = newClass.trim();
        storage.updateUser(currentUser.id, { class: currentUser.class });
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
        storage.updateUser(currentUser.id, { password: currentUser.password });
        storage.setCurrentUser(currentUser);
        
        console.log('✅ Senha alterada com sucesso');
        showNotification('Senha alterada com sucesso!', 'success');
    }
}

function openAddFriend() {
    const friendName = prompt('Digite o nome do amigo que deseja adicionar:');
    
    if (friendName !== null && friendName.trim() !== '') {
        const friend = storage.findUserByName(friendName.trim());

        if (!friend) {
            showNotification('Usuário não encontrado', 'error');
            return;
        }

        if (friend.id === currentUser.id) {
            showNotification('Você não pode adicionar a si mesmo', 'error');
            return;
        }

        if (currentUser.friends && currentUser.friends.includes(friend.id)) {
            showNotification('Este usuário já é seu amigo', 'info');
            return;
        }

        if (!currentUser.friends) {
            currentUser.friends = [];
        }

        currentUser.friends.push(friend.id);
        storage.updateUser(currentUser.id, { friends: currentUser.friends });
        storage.setCurrentUser(currentUser);

        console.log('✅ Amigo adicionado com sucesso');
        showNotification('Amigo adicionado com sucesso!', 'success');
        loadProfile();
    }
}

function removeFriend(friendId) {
    if (confirm('Tem certeza que deseja remover este amigo?')) {
        currentUser.friends = currentUser.friends.filter(id => id !== friendId);
        storage.updateUser(currentUser.id, { friends: currentUser.friends });
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

function populateSubjectSelect() {
    const select = document.getElementById('adm-quiz-subject');
    select.innerHTML = '<option value="">-- Escolha uma matéria --</option>';
    
    const subjects = storage.getSubjects();
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.title;
        select.appendChild(option);
    });
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

function depositPoints() {
    const amount = parseInt(document.getElementById('adm-points-amount').value);

    if (!amount || amount < 1) {
        showNotification('Digite uma quantidade válida', 'error');
        return;
    }

    currentUser.points = (currentUser.points || 0) + amount;
    storage.updateUser(currentUser.id, { points: currentUser.points });
    storage.setCurrentUser(currentUser);

    document.getElementById('adm-points-amount').value = '';
    showNotification(`${amount} pontos depositados com sucesso!`, 'success');
    updateUserDisplay();
    loadHomeData();
    loadAllUsers();
}

function createQuizFromCode() {
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

            if (trimmed.startsWith('/q1')) {
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

        // Salvar quiz
        const newQuiz = {
            id: storage.generateId(),
            title: quizTitle,
            subjectId: subjectId,
            questions: questions,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        const quizzes = storage.getQuizzes();
        quizzes.push(newQuiz);
        storage.saveQuizzes(quizzes);

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

function loadAdmData() {
    // Carregar matérias
    const subjects = storage.getSubjects();
    const admSubjects = document.getElementById('adm-subjects');
    admSubjects.innerHTML = '';

    subjects.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'adm-item';
        item.innerHTML = `
            <div class="adm-item-info">
                <h4>${subject.title}</h4>
                <p>${subject.description || 'Sem descrição'}</p>
            </div>
            <div class="adm-item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteSubject('${subject.id}')">Deletar</button>
            </div>
        `;
        admSubjects.appendChild(item);
    });

    // Carregar quizzes
    const quizzes = storage.getQuizzes();
    const admQuizzes = document.getElementById('adm-quizzes');
    admQuizzes.innerHTML = '';

    quizzes.forEach(quiz => {
        const item = document.createElement('div');
        item.className = 'adm-item';
        item.innerHTML = `
            <div class="adm-item-info">
                <h4>${quiz.title}</h4>
                <p>${quiz.questions.length} perguntas</p>
            </div>
            <div class="adm-item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteQuiz('${quiz.id}')">Deletar</button>
            </div>
        `;
        admQuizzes.appendChild(item);
    });

    // Carregar usuários
    const users = storage.getUsers();
    const admUsers = document.getElementById('adm-users');
    admUsers.innerHTML = '';

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'adm-item';
        item.innerHTML = `
            <div class="adm-item-info">
                <h4>${user.name}</h4>
                <p>${user.class} • ${user.points || 0} pontos</p>
            </div>
            <div class="adm-item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteUser('${user.id}')">Deletar</button>
            </div>
        `;
        admUsers.appendChild(item);
    });
}

function deleteSubject(id) {
    if (confirm('Tem certeza que deseja deletar esta matéria?')) {
        const subjects = storage.getSubjects().filter(s => s.id !== id);
        storage.saveSubjects(subjects);
        console.log('✅ Matéria deletada');
        loadAdmData();
        loadAllSubjects();
        showNotification('Matéria deletada', 'success');
    }
}

function deleteQuiz(id) {
    if (confirm('Tem certeza que deseja deletar este quiz?')) {
        const quizzes = storage.getQuizzes().filter(q => q.id !== id);
        storage.saveQuizzes(quizzes);
        console.log('✅ Quiz deletado');
        loadAdmData();
        showNotification('Quiz deletado', 'success');
    }
}

function deleteUser(id) {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
        const users = storage.getUsers().filter(u => u.id !== id);
        storage.saveUsers(users);
        console.log('✅ Usuário deletado');
        loadAdmData();
        loadAllUsers();
        showNotification('Usuário deletado', 'success');
    }
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        z-index: 2000;
        animation: slideUp 0.3s ease;
        max-width: 300px;
    `;

    if (type === 'success') {
        notification.style.background = '#22c55e';
        notification.style.color = 'white';
        notification.textContent = '✅ ' + message;
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
        notification.style.color = 'white';
        notification.textContent = '❌ ' + message;
    } else {
        notification.style.background = '#2563eb';
        notification.style.color = 'white';
        notification.textContent = 'ℹ️ ' + message;
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDownOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== APP EVENT LISTENERS ====================
function setupAppEventListeners() {
    // Subjects
    document.getElementById('btn-new-subject')?.addEventListener('click', openCreateSubject);
    document.getElementById('btn-cancel-subject')?.addEventListener('click', closeCreateSubject);
    document.getElementById('btn-create-subject')?.addEventListener('click', createSubject);
    document.getElementById('btn-back-subject')?.addEventListener('click', backToSubjects);

    // Topics
    document.getElementById('btn-new-topic')?.addEventListener('click', openCreateTopic);
    document.getElementById('btn-cancel-topic')?.addEventListener('click', closeCreateTopic);
    document.getElementById('btn-save-topic')?.addEventListener('click', saveTopic);

    // Quiz
    document.getElementById('btn-new-quiz')?.addEventListener('click', openCreateQuiz);
    document.getElementById('btn-cancel-quiz')?.addEventListener('click', closeCreateQuiz);
    document.getElementById('btn-save-quiz')?.addEventListener('click', saveQuiz);
    document.getElementById('btn-add-question')?.addEventListener('click', addQuestion);

    // Quiz Player
    document.getElementById('btn-back-quiz')?.addEventListener('click', backToSubjects);
    document.getElementById('btn-next-question')?.addEventListener('click', nextQuestion);

    // Result
    document.getElementById('btn-back-home-result')?.addEventListener('click', () => showScreen('home'));

    // Chat
    document.getElementById('btn-back-chat')?.addEventListener('click', backToChats);
    document.getElementById('btn-send-message')?.addEventListener('click', sendMessage);

    // Profile
    document.getElementById('btn-edit-profile')?.addEventListener('click', openEditProfile);
    document.getElementById('btn-change-password')?.addEventListener('click', openChangePassword);
    document.getElementById('btn-add-friend')?.addEventListener('click', openAddFriend);
    document.getElementById('btn-access-adm')?.addEventListener('click', () => showScreen('adm'));

    // ADM
    document.getElementById('btn-adm-login')?.addEventListener('click', admLogin);
    document.getElementById('btn-adm-logout')?.addEventListener('click', admLogout);
    document.getElementById('btn-exit-adm')?.addEventListener('click', () => showScreen('profile'));
    document.getElementById('btn-deposit-points')?.addEventListener('click', depositPoints);
    document.getElementById('btn-create-quiz-code')?.addEventListener('click', createQuizFromCode);
}

function setupNavigationListeners() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    document.querySelectorAll('.quick-card').forEach(card => {
        card.addEventListener('click', () => {
            const screen = card.getAttribute('data-screen');
            showScreen(screen);
        });
    });
}

console.log('✅ Script carregado com sucesso - localStorage ativo!');
