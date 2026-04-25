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
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentSubject = null;
let currentQuiz = null;
let currentChat = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let admLoggedIn = false;
let questionCount = 0;
let currentTopic = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App iniciado');
    setupAuthEventListeners();
    setupAppEventListeners();
    setupNavigationListeners();
});

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ Usuário autenticado:', user.uid);
        
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
            
            showApp();
            updateUserDisplay();
            loadHomeData();
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            showAuthError('Erro ao carregar dados do usuário', false);
        }
    } else {
        currentUser = null;
        console.log('❌ Usuário desconectado');
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
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        showAuthError('Preencha todos os campos');
        return;
    }

    if (!email.includes('@')) {
        showAuthError('Email inválido');
        return;
    }

    const btn = document.getElementById('login-form').querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login realizado com sucesso:', result.user.uid);
        
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } catch (error) {
        console.error('❌ Erro de login:', error.code, error.message);
        
        if (error.code === 'auth/user-not-found') {
            showAuthError('Usuário não encontrado');
        } else if (error.code === 'auth/wrong-password') {
            showAuthError('Senha incorreta');
        } else if (error.code === 'auth/invalid-email') {
            showAuthError('Email inválido');
        } else if (error.code === 'auth/too-many-requests') {
            showAuthError('Muitas tentativas. Tente novamente mais tarde');
        } else if (error.code === 'auth/user-disabled') {
            showAuthError('Usuário desativado');
        } else {
            showAuthError(error.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar na Plataforma';
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const passwordConfirm = document.getElementById('signup-password-confirm').value.trim();
    const classroom = document.getElementById('signup-class').value.trim();

    if (!name || !email || !password || !passwordConfirm || !classroom) {
        showAuthError('Preencha todos os campos', true);
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

    if (!email.includes('@')) {
        showAuthError('Email inválido', true);
        return;
    }

    const btn = document.getElementById('signup-form').querySelector('button[type="submit"]');
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
            friends: [],
            createdAt: new Date()
        });

        console.log('✅ Dados enviados com sucesso');
        console.log('📊 Usuário criado:', {
            uid: result.user.uid,
            name: name,
            email: email,
            class: classroom
        });

        showAuthSuccess('Conta criada com sucesso! Redirecionando...');

        setTimeout(() => {
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-password-confirm').value = '';
            document.getElementById('signup-class').value = '';
            toggleAuthForm();
        }, 1500);
    } catch (error) {
        console.error('❌ Erro de cadastro:', error.code, error.message);

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
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login com Google realizado com sucesso:', result.user.uid);
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
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Cadastro com Google realizado com sucesso:', result.user.uid);
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
        admLoggedIn = false;
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
    }
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

async function updateUserDisplay() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        document.getElementById('user-display').textContent = userData.name || 'Usuário';
    } catch (error) {
        console.error('❌ Erro ao atualizar display do usuário:', error);
    }
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
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
    } else if (screenName === 'chat') {
        loadChats();
    } else if (screenName === 'profile') {
        loadProfile();
    } else if (screenName === 'adm') {
        loadAdmPanel();
    }
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
    document.getElementById('btn-back-result')?.addEventListener('click', backToSubjects);
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

// ==================== HOME ====================
async function loadHomeData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        document.getElementById('welcome-name').textContent = userData.name || 'Usuário';
        document.getElementById('welcome-class').textContent = userData.class || 'Não definida';
        document.getElementById('welcome-points').textContent = userData.points || 0;

        // Carregar matérias recentes
        const subjectsSnapshot = await db.collection('subjects').limit(3).get();
        const subjectsList = document.getElementById('home-subjects');
        subjectsList.innerHTML = '';

        if (subjectsSnapshot.empty) {
            subjectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria disponível</p>';
        } else {
            subjectsSnapshot.forEach(doc => {
                const subject = doc.data();
                const card = createSubjectCard(doc.id, subject);
                subjectsList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar home:', error);
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
        alert('O nome da matéria é obrigatório');
        return;
    }

    try {
        await db.collection('subjects').add({
            title: title,
            description: desc || '',
            createdAt: new Date(),
            createdBy: currentUser.uid
        });

        console.log('✅ Matéria criada com sucesso');
        closeCreateSubject();
        loadSubjects();
    } catch (error) {
        console.error('❌ Erro ao criar matéria:', error);
        alert('Erro ao criar matéria');
    }
}

async function loadSubjects() {
    try {
        const subjectsSnapshot = await db.collection('subjects').get();
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

            if (subjectsSnapshot.empty) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Nenhuma matéria criada</p>';
            } else {
                subjectsSnapshot.forEach(doc => {
                    const subject = doc.data();
                    const card = createSubjectCard(doc.id, subject);
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
    `;
    card.addEventListener('click', () => {
        currentSubject = { id, ...subject };
        loadSubjects();
    });
    return card;
}

async function loadSubjectDetail() {
    try {
        document.getElementById('detail-title').textContent = currentSubject.title;
        document.getElementById('detail-desc').textContent = currentSubject.description || 'Sem descrição';

        // Carregar tópicos
        await loadTopics();

        // Carregar quizzes
        await loadQuizzes();
    } catch (error) {
        console.error('❌ Erro ao carregar detalhes da matéria:', error);
    }
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
        alert('Preencha todos os campos');
        return;
    }

    try {
        await db.collection('topics').add({
            title: title,
            content: content,
            subjectId: currentSubject.id,
            createdAt: new Date(),
            createdBy: currentUser.uid
        });

        console.log('✅ Tópico criado com sucesso');
        closeCreateTopic();
        loadTopics();
    } catch (error) {
        console.error('❌ Erro ao salvar tópico:', error);
        alert('Erro ao salvar tópico');
    }
}

async function loadTopics() {
    try {
        const topicsSnapshot = await db.collection('topics')
            .where('subjectId', '==', currentSubject.id)
            .get();

        const topicsList = document.getElementById('topics-list');
        topicsList.innerHTML = '';

        if (topicsSnapshot.empty) {
            topicsList.innerHTML = '<p style="color: #64748b;">Nenhum tópico nesta matéria</p>';
        } else {
            topicsSnapshot.forEach(doc => {
                const topic = doc.data();
                const item = document.createElement('div');
                item.className = 'topic-item';
                item.innerHTML = `
                    <h5>${topic.title}</h5>
                    <p>${topic.content.substring(0, 100)}...</p>
                `;
                item.addEventListener('click', () => {
                    currentTopic = { id: doc.id, ...topic };
                    showTopicDetail();
                });
                topicsList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar tópicos:', error);
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
        alert('Preencha todos os campos');
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
            alert('Preencha todas as perguntas corretamente');
            return;
        }

        questions.push({
            text: text,
            alternatives: alternatives,
            correct: correct
        });
    }

    try {
        await db.collection('quizzes').add({
            title: title,
            subjectId: currentSubject.id,
            questions: questions,
            createdAt: new Date(),
            createdBy: currentUser.uid
        });

        console.log('✅ Quiz criado com sucesso');
        closeCreateQuiz();
        loadQuizzes();
    } catch (error) {
        console.error('❌ Erro ao salvar quiz:', error);
        alert('Erro ao salvar quiz');
    }
}

async function loadQuizzes() {
    try {
        const quizzesSnapshot = await db.collection('quizzes')
            .where('subjectId', '==', currentSubject.id)
            .get();

        const quizzesList = document.getElementById('quizzes-list');
        quizzesList.innerHTML = '';

        if (quizzesSnapshot.empty) {
            quizzesList.innerHTML = '<p style="color: #64748b;">Nenhum quiz nesta matéria</p>';
        } else {
            quizzesSnapshot.forEach(doc => {
                const quiz = doc.data();
                const item = document.createElement('div');
                item.className = 'quiz-item';
                item.innerHTML = `
                    <span class="quiz-item-name">${quiz.title}</span>
                    <button class="btn btn-primary btn-small">Jogar</button>
                `;
                item.querySelector('button').addEventListener('click', () => startQuiz(doc.id));
                quizzesList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar quizzes:', error);
    }
}

async function startQuiz(quizId) {
    try {
        const quizDoc = await db.collection('quizzes').doc(quizId).get();
        currentQuiz = { id: quizId, ...quizDoc.data() };
        currentQuestions = currentQuiz.questions;
        currentQuestionIndex = 0;
        currentScore = 0;

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
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const newPoints = (userData.points || 0) + currentScore;
        await userRef.update({ points: newPoints });

        // Salvar no histórico
        const historyRef = db.collection('history').doc(currentUser.uid);
        const historyDoc = await historyRef.get();

        let historyItems = [];
        if (historyDoc.exists) {
            historyItems = historyDoc.data().items || [];
        }

        historyItems.push({
            quizTitle: currentQuiz.title,
            subjectTitle: currentSubject.title,
            score: currentScore,
            date: new Date().toLocaleString('pt-BR')
        });

        await historyRef.set({ items: historyItems });

        document.getElementById('result-score').textContent = currentScore;
        document.getElementById('result-message').textContent =
            currentScore >= 50 ? 'Parabéns! Você foi bem! 🎉' : 'Continue estudando! 💪';

        console.log('✅ Quiz finalizado com sucesso. Pontuação:', currentScore);
        showScreen('result');
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
        const snapshot = await db.collection('users')
            .orderBy('points', 'desc')
            .limit(50)
            .get();

        const rankingContainer = document.getElementById('ranking-container');
        rankingContainer.innerHTML = '';

        if (snapshot.empty) {
            rankingContainer.innerHTML = '<p style="text-align: center; color: #64748b;">Nenhum usuário ainda</p>';
            return;
        }

        let position = 1;
        snapshot.forEach(doc => {
            const user = doc.data();
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

// ==================== CHAT ====================
async function loadChats() {
    try {
        const chatList = document.getElementById('chat-list');
        const chatWindow = document.getElementById('chat-window');

        if (currentChat) {
            chatList.style.display = 'none';
            chatWindow.style.display = 'flex';
            await loadChatMessages();
        } else {
            chatList.style.display = 'grid';
            chatWindow.style.display = 'none';

            // Carregar lista de amigos para chat
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            const friends = userData.friends || [];

            chatList.innerHTML = '';

            if (friends.length === 0) {
                chatList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhum amigo para conversar. Adicione amigos na seção de Perfil!</p>';
            } else {
                for (const friendId of friends) {
                    const friendDoc = await db.collection('users').doc(friendId).get();
                    if (friendDoc.exists) {
                        const friend = friendDoc.data();
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
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar chats:', error);
    }
}

async function loadChatMessages() {
    try {
        document.getElementById('chat-title').textContent = currentChat.name;
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';

        // Aqui você pode carregar mensagens do Realtime Database
        messagesContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma mensagem ainda. Comece a conversa!</p>';
    } catch (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
    }
}

function backToChats() {
    currentChat = null;
    loadChats();
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) return;

    try {
        // Salvar mensagem no Realtime Database
        const chatKey = [currentUser.uid, currentChat.id].sort().join('_');
        rtdb.ref(`chats/${chatKey}`).push({
            sender: currentUser.uid,
            message: message,
            timestamp: new Date().getTime()
        });

        console.log('✅ Mensagem enviada');
        input.value = '';
        loadChatMessages();
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
    }
}

// ==================== PROFILE ====================
async function loadProfile() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        document.getElementById('profile-name').textContent = userData.name || 'Usuário';
        document.getElementById('profile-class').textContent = `Sala: ${userData.class || 'Não definida'}`;
        document.getElementById('profile-points').textContent = `${userData.points || 0} pontos ⭐`;

        document.getElementById('profile-email').textContent = userData.email || 'N/A';
        document.getElementById('profile-class-info').textContent = userData.class || 'Não definida';
        document.getElementById('profile-points-info').textContent = userData.points || 0;

        // Carregar amigos
        await loadFriends(userData.friends || []);
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
    }
}

async function loadFriends(friendIds) {
    try {
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';

        if (friendIds.length === 0) {
            friendsList.innerHTML = '<p style="color: #64748b;">Você ainda não tem amigos</p>';
            return;
        }

        for (const friendId of friendIds) {
            const friendDoc = await db.collection('users').doc(friendId).get();
            if (friendDoc.exists) {
                const friend = friendDoc.data();
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
        }
    } catch (error) {
        console.error('❌ Erro ao carregar amigos:', error);
    }
}

async function openEditProfile() {
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    const newClass = prompt('Digite sua nova sala:', userData.class);
    
    if (newClass !== null && newClass.trim() !== '') {
        try {
            await db.collection('users').doc(currentUser.uid).update({
                class: newClass.trim()
            });
            console.log('✅ Perfil atualizado com sucesso');
            loadProfile();
            loadHomeData();
        } catch (error) {
            console.error('❌ Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil');
        }
    }
}

async function openChangePassword() {
    const newPassword = prompt('Digite sua nova senha (mínimo 6 caracteres):');
    
    if (newPassword !== null && newPassword.trim() !== '') {
        if (newPassword.length < 6) {
            alert('Senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            await currentUser.updatePassword(newPassword);
            console.log('✅ Senha alterada com sucesso');
            alert('Senha alterada com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao alterar senha:', error);
            if (error.code === 'auth/requires-recent-login') {
                alert('Por favor, faça login novamente para alterar a senha');
            } else {
                alert('Erro ao alterar senha: ' + error.message);
            }
        }
    }
}

async function openAddFriend() {
    const friendEmail = prompt('Digite o email do amigo que deseja adicionar:');
    
    if (friendEmail !== null && friendEmail.trim() !== '') {
        try {
            // Buscar usuário pelo email
            const friendSnapshot = await db.collection('users')
                .where('email', '==', friendEmail.trim())
                .get();

            if (friendSnapshot.empty) {
                alert('Usuário não encontrado');
                return;
            }

            const friendDoc = friendSnapshot.docs[0];
            const friendId = friendDoc.id;

            if (friendId === currentUser.uid) {
                alert('Você não pode adicionar a si mesmo');
                return;
            }

            // Adicionar amigo
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            const friends = userDoc.data().friends || [];

            if (friends.includes(friendId)) {
                alert('Este usuário já é seu amigo');
                return;
            }

            friends.push(friendId);
            await userRef.update({ friends: friends });

            console.log('✅ Amigo adicionado com sucesso');
            alert('Amigo adicionado com sucesso!');
            loadProfile();
        } catch (error) {
            console.error('❌ Erro ao adicionar amigo:', error);
            alert('Erro ao adicionar amigo');
        }
    }
}

async function removeFriend(friendId) {
    if (confirm('Tem certeza que deseja remover este amigo?')) {
        try {
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            let friends = userDoc.data().friends || [];

            friends = friends.filter(id => id !== friendId);
            await userRef.update({ friends: friends });

            console.log('✅ Amigo removido com sucesso');
            loadProfile();
        } catch (error) {
            console.error('❌ Erro ao remover amigo:', error);
            alert('Erro ao remover amigo');
        }
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
        loadAdmData();
    }
}

function admLogin() {
    const password = document.getElementById('adm-password').value.trim();

    if (password === 'senhafacil') {
        admLoggedIn = true;
        document.getElementById('adm-password').value = '';
        console.log('✅ Acesso ao painel ADM concedido');
        loadAdmPanel();
    } else {
        alert('❌ Senha incorreta');
    }
}

function admLogout() {
    admLoggedIn = false;
    document.getElementById('adm-password').value = '';
    loadAdmPanel();
}

async function loadAdmData() {
    try {
        // Carregar matérias
        const subjectsSnapshot = await db.collection('subjects').get();
        const admSubjects = document.getElementById('adm-subjects');
        admSubjects.innerHTML = '';

        subjectsSnapshot.forEach(doc => {
            const subject = doc.data();
            const item = document.createElement('div');
            item.className = 'adm-item';
            item.innerHTML = `
                <div class="adm-item-info">
                    <h4>${subject.title}</h4>
                    <p>${subject.description || 'Sem descrição'}</p>
                </div>
                <div class="adm-item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteSubject('${doc.id}')">Deletar</button>
                </div>
            `;
            admSubjects.appendChild(item);
        });

        // Carregar quizzes
        const quizzesSnapshot = await db.collection('quizzes').get();
        const admQuizzes = document.getElementById('adm-quizzes');
        admQuizzes.innerHTML = '';

        quizzesSnapshot.forEach(doc => {
            const quiz = doc.data();
            const item = document.createElement('div');
            item.className = 'adm-item';
            item.innerHTML = `
                <div class="adm-item-info">
                    <h4>${quiz.title}</h4>
                    <p>${quiz.questions.length} perguntas</p>
                </div>
                <div class="adm-item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteQuiz('${doc.id}')">Deletar</button>
                </div>
            `;
            admQuizzes.appendChild(item);
        });

        // Carregar usuários
        const usersSnapshot = await db.collection('users').get();
        const admUsers = document.getElementById('adm-users');
        admUsers.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const item = document.createElement('div');
            item.className = 'adm-item';
            item.innerHTML = `
                <div class="adm-item-info">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                </div>
                <div class="adm-item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteUser('${doc.id}')">Deletar</button>
                </div>
            `;
            admUsers.appendChild(item);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar dados do ADM:', error);
    }
}

async function deleteSubject(id) {
    if (confirm('Tem certeza que deseja deletar esta matéria?')) {
        try {
            await db.collection('subjects').doc(id).delete();
            console.log('✅ Matéria deletada');
            loadAdmData();
        } catch (error) {
            console.error('❌ Erro ao deletar matéria:', error);
        }
    }
}

async function deleteQuiz(id) {
    if (confirm('Tem certeza que deseja deletar este quiz?')) {
        try {
            await db.collection('quizzes').doc(id).delete();
            console.log('✅ Quiz deletado');
            loadAdmData();
        } catch (error) {
            console.error('❌ Erro ao deletar quiz:', error);
        }
    }
}

async function deleteUser(id) {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
        try {
            await db.collection('users').doc(id).delete();
            console.log('✅ Usuário deletado');
            loadAdmData();
        } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error);
        }
    }
}

console.log('✅ Script carregado com sucesso - Todas as funções ativas!');
