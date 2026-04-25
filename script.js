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
let currentSubjectId = null;
let currentQuiz = null;
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        loadUserData();
        showScreen('home');
    } else {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});

document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).catch(error => alert(error.message));
});

document.getElementById('register-btn').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const cls = document.getElementById('class').value;
    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        db.collection('users').doc(cred.user.uid).set({ name, email, class: cls, points: 0 });
    }).catch(error => alert(error.message));
});

document.getElementById('google-login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) {
                db.collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    class: 'Não informado',
                    points: 0
                });
            }
        });
    }).catch(error => alert(error.message));
});

document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(`${screen}-screen`).style.display = 'block';
}

function loadUserData() {
    db.collection('users').doc(currentUser.uid).get().then(doc => {
        const data = doc.data();
        document.getElementById('user-name').textContent = data.name;
        document.getElementById('user-class').textContent = data.class;
    });
}

// Subjects
document.getElementById('create-subject-btn').addEventListener('click', () => {
    const title = prompt('Nome da Matéria');
    const description = prompt('Descrição');
    if (title && description) {
        db.collection('subjects').add({ title, description }).then(() => loadSubjects());
    }
});

function loadSubjects() {
    db.collection('subjects').get().then(snapshot => {
        const list = document.getElementById('subjects-list');
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = data.title;
            card.addEventListener('click', () => openSubject(doc.id, data));
            list.appendChild(card);
        });
    });
}

function openSubject(id, data) {
    currentSubjectId = id;
    document.getElementById('subject-title').textContent = data.title;
    document.getElementById('subject-description').textContent = data.description;
    showScreen('subject');
    loadQuizzes();
}

document.getElementById('back-to-subjects-btn').addEventListener('click', () => {
    showScreen('subjects');
});

document.getElementById('create-quiz-btn').addEventListener('click', () => {
    showScreen('quiz-create');
});

document.getElementById('add-question-btn').addEventListener('click', () => {
    const container = document.getElementById('questions-container');
    const question = document.createElement('div');
    question.className = 'question';
    question.innerHTML = `
        <input type="text" placeholder="Enunciado" class="question-text" required>
        <input type="text" placeholder="Alternativa A" class="alt-a" required>
        <input type="text" placeholder="Alternativa B" class="alt-b" required>
        <input type="text" placeholder="Alternativa C" class="alt-c" required>
        <input type="text" placeholder="Alternativa D" class="alt-d" required>
        <select class="correct-answer" required>
            <option value="">Correta</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
        </select>
    `;
    container.appendChild(question);
});

document.getElementById('save-quiz-btn').addEventListener('click', () => {
    const title = document.getElementById('quiz-title').value;
    const questions = [];
    document.querySelectorAll('.question').forEach(q => {
        const text = q.querySelector('.question-text').value;
        const a = q.querySelector('.alt-a').value;
        const b = q.querySelector('.alt-b').value;
        const c = q.querySelector('.alt-c').value;
        const d = q.querySelector('.alt-d').value;
        const correct = q.querySelector('.correct-answer').value;
        questions.push({ text, options: { A: a, B: b, C: c, D: d }, correct });
    });
    db.collection('quizzes').add({ title, subjectId: currentSubjectId, questions }).then(() => {
        showScreen('subject');
        loadQuizzes();
    });
});

document.getElementById('back-to-subject-btn').addEventListener('click', () => {
    showScreen('subject');
});

function loadQuizzes() {
    db.collection('quizzes').where('subjectId', '==', currentSubjectId).get().then(snapshot => {
        const list = document.getElementById('quizzes-list');
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = data.title;
            card.addEventListener('click', () => playQuiz(doc.id, data));
            list.appendChild(card);
        });
    });
}

function playQuiz(id, data) {
    currentQuiz = data;
    quizQuestions = data.questions;
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('quiz-play-title').textContent = data.title;
    showScreen('quiz-play');
    showQuestion();
}

function showQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.text;
    document.querySelectorAll('.answer-btn').forEach((btn, i) => {
        const letters = ['A', 'B', 'C', 'D'];
        btn.textContent = q.options[letters[i]];
        btn.dataset.answer = letters[i];
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
        btn.onclick = selectAnswer;
    });
    document.getElementById('next-question-btn').style.display = 'none';
    updateProgress();
}

function selectAnswer(e) {
    const selected = e.target.dataset.answer;
    const correct = quizQuestions[currentQuestionIndex].correct;
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn.dataset.answer === correct) btn.classList.add('correct');
        else if (btn.dataset.answer === selected && selected !== correct) btn.classList.add('incorrect');
        btn.disabled = true;
    });
    if (selected === correct) score += 10;
    document.getElementById('next-question-btn').style.display = 'block';
}

document.getElementById('next-question-btn').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion();
    } else {
        showResult();
    }
});

function showResult() {
    document.getElementById('question-display').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'block';
    document.getElementById('score').textContent = score;
    // Update user points
    db.collection('users').doc(currentUser.uid).update({
        points: firebase.firestore.FieldValue.increment(score)
    });
    // Save history
    db.collection('history').doc(currentUser.uid).collection('items').add({
        name: currentQuiz.title,
        score,
        date: new Date()
    });
}

document.getElementById('back-to-subject-from-quiz').addEventListener('click', () => {
    showScreen('subject');
    document.getElementById('question-display').style.display = 'block';
    document.getElementById('quiz-result').style.display = 'none';
});

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

// Ranking
function loadRanking() {
    db.collection('users').orderBy('points', 'desc').get().then(snapshot => {
        const list = document.getElementById('ranking-list');
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'card';
            item.innerHTML = `<p>${data.name} - ${data.class} - ${data.points} pontos</p>`;
            list.appendChild(item);
        });
    });
}

// History
function loadHistory() {
    db.collection('history').doc(currentUser.uid).collection('items').orderBy('date', 'desc').get().then(snapshot => {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'card';
            item.innerHTML = `<p>${data.name} - ${data.score} pontos - ${data.date.toDate().toLocaleDateString()}</p>`;
            list.appendChild(item);
        });
    });
}

// Load data on screen show
document.querySelector('[data-screen="subjects"]').addEventListener('click', loadSubjects);
document.querySelector('[data-screen="ranking"]').addEventListener('click', loadRanking);
document.querySelector('[data-screen="history"]').addEventListener('click', loadHistory);
