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

let currentUser = null;
let currentSubject = null;
let currentQuiz = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let selectedAnswers = [];

// AUTH STATE
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
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
        }
        
        showApp();
        updateUserInfo();
    } else {
        currentUser = null;
        showAuth();
    }
});

// UI FUNCTIONS
function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    showScreen('home');
}

function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
    
    document.getElementById('authError').classList.remove('show');
}

function showError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (screenName === 'home') {
        updateHomeScreen();
    } else if (screenName === 'subjects') {
        loadSubjects();
    } else if (screenName === 'ranking') {
        loadRanking();
    } else if (screenName === 'history') {
        loadHistory();
    }
}

async function updateUserInfo() {
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    
    document.getElementById('userNameHeader').textContent = userData.name;
    document.getElementById('homeName').textContent = userData.name;
    document.getElementById('homeClass').textContent = userData.class;
    document.getElementById('homePoints').textContent = userData.points || 0;
}

async function updateHomeScreen() {
    await updateUserInfo();
}

// AUTH FUNCTIONS
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('Preencha todos os campos');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        showError('Erro: ' + error.message);
    }
});

document.getElementById('signupBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const classroom = document.getElementById('signupClass').value;
    
    if (!name || !email || !password || !classroom) {
        showError('Preencha todos os campos');
        return;
    }
    
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
    } catch (error) {
        showError('Erro: ' + error.message);
    }
});

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        showError('Erro: ' + error.message);
    }
});

document.getElementById('googleSignupBtn')?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        showError('Erro: ' + error.message);
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
});

// SUBJECTS
async function loadSubjects() {
    const subjectsList = document.getElementById('subjectsList');
    const subjectDetail = document.getElementById('subjectDetail');
    
    if (currentSubject) {
        subjectDetail.style.display = 'block';
        subjectsList.style.display = 'none';
        await loadSubjectDetail();
        return;
    }
    
    subjectsList.style.display = 'grid';
    subjectDetail.style.display = 'none';
    
    const snapshot = await db.collection('subjects').get();
    subjectsList.innerHTML = '';
    
    snapshot.forEach(doc => {
        const subject = doc.data();
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <h3>${subject.title}</h3>
            <p>${subject.description}</p>
        `;
        card.onclick = () => {
            currentSubject = { id: doc.id, ...subject };
            loadSubjects();
        };
        subjectsList.appendChild(card);
    });
}

async function loadSubjectDetail() {
    document.getElementById('subjectDetailTitle').textContent = currentSubject.title;
    document.getElementById('subjectDetailDesc').textContent = currentSubject.description;
    
    const quizzesList = document.getElementById('quizzesList');
    quizzesList.innerHTML = '';
    
    const snapshot = await db.collection('quizzes').where('subjectId', '==', currentSubject.id).get();
    
    snapshot.forEach(doc => {
        const quiz = doc.data();
        const item = document.createElement('div');
        item.className = 'quiz-item';
        item.innerHTML = `
            <span class="quiz-item-name">${quiz.title}</span>
            <button class="quiz-item-btn" onclick="startQuiz('${doc.id}')">Jogar</button>
        `;
        quizzesList.appendChild(item);
    });
}

function backToSubjects() {
    currentSubject = null;
    loadSubjects();
}

function openCreateSubject() {
    document.getElementById('createSubjectForm').style.display = 'block';
}

function closeCreateSubject() {
    document.getElementById('createSubjectForm').style.display = 'none';
    document.getElementById('subjectTitle').value = '';
    document.getElementById('subjectDesc').value = '';
}

async function createSubject() {
    const title = document.getElementById('subjectTitle').value;
    const description = document.getElementById('subjectDesc').value;
    
    if (!title || !description) {
        showError('Preencha todos os campos');
        return;
    }
    
    try {
        await db.collection('subjects').add({
            title: title,
            description: description,
            createdAt: new Date()
        });
        
        closeCreateSubject();
        loadSubjects();
    } catch (error) {
        showError('Erro: ' + error.message);
    }
}

// QUIZ
function openCreateQuiz() {
    document.getElementById('createQuizForm').style.display = 'block';
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion();
}

function closeCreateQuiz() {
    document.getElementById('createQuizForm').style.display = 'none';
    document.getElementById('quizTitle').value = '';
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const index = container.children.length;
    
    const questionBox = document.createElement('div');
    questionBox.className = 'question-box';
    questionBox.innerHTML = `
        <h5>Pergunta ${index + 1}</h5>
        <input type="text" placeholder="Enunciado da pergunta" class="question-text-${index}">
        <input type="text" placeholder="Alternativa A" class="question-alt-${index}-0">
        <input type="text" placeholder="Alternativa B" class="question-alt-${index}-1">
        <input type="text" placeholder="Alternativa C" class="question-alt-${index}-2">
        <input type="text" placeholder="Alternativa D" class="question-alt-${index}-3">
        <select class="question-correct-${index}">
            <option value="">Resposta correta</option>
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
        </select>
        <button onclick="removeQuestion(${index})">Remover</button>
    `;
    
    container.appendChild(questionBox);
}

function removeQuestion(index) {
    document.querySelectorAll('.question-box')[index].remove();
}

async function saveQuiz() {
    const title = document.getElementById('quizTitle').value;
    const questionBoxes = document.querySelectorAll('.question-box');
    
    if (!title || questionBoxes.length === 0) {
        showError('Preencha todos os campos');
        return;
    }
    
    const questions = [];
    
    for (let i = 0; i < questionBoxes.length; i++) {
        const text = document.querySelector(`.question-text-${i}`).value;
        const alternatives = [
            document.querySelector(`.question-alt-${i}-0`).value,
            document.querySelector(`.question-alt-${i}-1`).value,
            document.querySelector(`.question-alt-${i}-2`).value,
            document.querySelector(`.question-alt-${i}-3`).value
        ];
        const correct = parseInt(document.querySelector(`.question-correct-${i}`).value);
        
        if (!text || alternatives.some(a => !a) || isNaN(correct)) {
            showError('Preencha todas as perguntas corretamente');
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
            createdAt: new Date()
        });
        
        closeCreateQuiz();
        loadSubjectDetail();
    } catch (error) {
        showError('Erro: ' + error.message);
    }
}

async function startQuiz(quizId) {
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    currentQuiz = { id: quizId, ...quizDoc.data() };
    currentQuestions = currentQuiz.questions;
    currentQuestionIndex = 0;
    currentScore = 0;
    selectedAnswers = new Array(currentQuestions.length).fill(-1);
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('quizScreen').classList.add('active');
    
    showQuestion();
}

function showQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('progressText').textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
    
    const percentage = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = percentage + '%';
    
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    question.alternatives.forEach((alt, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = alt;
        btn.onclick = () => selectAnswer(index);
        answersContainer.appendChild(btn);
    });
    
    document.getElementById('nextQuestionBtn').style.display = 'none';
}

function selectAnswer(index) {
    selectedAnswers[currentQuestionIndex] = index;
    
    const question = currentQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.answer-btn');
    
    buttons.forEach((btn, i) => {
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
        document.getElementById('nextQuestionBtn').style.display = 'block';
    }, 500);
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    const userRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    const newPoints = (userData.points || 0) + currentScore;
    await userRef.update({ points: newPoints });
    
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
    
    document.getElementById('resultScore').textContent = currentScore;
    document.getElementById('resultMessage').textContent = 
        currentScore >= 50 ? 'Parabéns! Você foi bem! 🎉' : 'Continue estudando! 💪';
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('quizResultScreen').classList.add('active');
}

// RANKING
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';
    
    const snapshot = await db.collection('users').orderBy('points', 'desc').limit(50).get();
    
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
                <div class="ranking-name">${user.name}</div>
                <div class="ranking-class">${user.class}</div>
            </div>
            <div class="ranking-points">${user.points || 0} pts</div>
        `;
        
        rankingList.appendChild(item);
        position++;
    });
}

// HISTORY
async function loadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    const historyDoc = await db.collection('history').doc(currentUser.uid).get();
    
    if (!historyDoc.exists || !historyDoc.data().items) {
        historyList.innerHTML = '<p style="text-align:center;color:#666;">Nenhum quiz jogado ainda</p>';
        return;
    }
    
    const items = historyDoc.data().items.reverse();
    
    items.forEach(item => {
        const element = document.createElement('div');
        element.className = 'history-item';
        element.innerHTML = `
            <div class="history-item-title">${item.quizTitle}</div>
            <div class="history-item-info">
                <span>${item.subjectTitle}</span>
                <span>${item.date}</span>
                <span class="history-item-score">${item.score} pts</span>
            </div>
        `;
        historyList.appendChild(element);
    });
}
