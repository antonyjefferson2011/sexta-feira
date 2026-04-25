// script.js

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBAs3irtV6MuTPHmsxYwYSFMTkX6_6ntz8",
    authDomain: "sexta-feira-fb01a.firebaseapp.com",
    projectId: "sexta-feira-fb01a",
    storageBucket: "sexta-feira-fb01a.firebasestorage.app",
    messagingSenderId: "82809140147",
    appId: "1:82809140147:web:2a3f3ece3e81c33b0b91c6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const subjectsContainer = document.getElementById('subjects-container');
const subjectsList = document.getElementById('subjects-list');
const subjectDetailSection = document.getElementById('subject-detail-section');
const currentSubjectTitle = document.getElementById('current-subject-title');
const currentSubjectDescription = document.getElementById('current-subject-description');
const topicsList = document.getElementById('topics-list');
const quizzesList = document.getElementById('quizzes-list');
const quizPlayContainer = document.getElementById('quiz-play-container');
const questionContainer = document.getElementById('question-container');
const optionsContainer = document.getElementById('options-container');
const nextQuestionBtn = document.getElementById('next-question-btn');
const quizResults = document.getElementById('quiz-results');
const rankingSection = document.getElementById('ranking-section');
const historySection = document.getElementById('history-section');
const loggedInUserSpan = document.getElementById('loggedInUser');
const logoutBtn = document.getElementById('logout-btn');

// Auth Inputs
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupClassInput = document.getElementById('signup-class');
const signupBtn = document.getElementById('signup-btn');

// Profile Info
const profileNameSpan = document.getElementById('profile-name');
const profileClassSpan = document.getElementById('profile-class');
const profilePointsSpan = document.getElementById('profile-points');

// Modals
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal-btn');

// Buttons
const createSubjectBtn = document.getElementById('create-subject-btn');
const viewRankingBtn = document.getElementById('view-ranking-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const backToDashboardFromRankingBtn = document.getElementById('back-to-dashboard-from-ranking-btn');
const backToDashboardFromHistoryBtn = document.getElementById('back-to-dashboard-from-history-btn');
const createTopicBtn = document.getElementById('create-topic-btn');
const createQuizBtn = document.getElementById('create-quiz-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// --- State Variables ---
let currentUser = null;
let currentSubjectId = null;
let currentQuizId = null;
let currentQuizData = null;
let currentQuestionIndex = 0;
let userScore = 0;
let correctAnswersCount = 0;

// --- Helper Functions ---
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('animated-fade-in');
    }
}

function showModal(title, contentHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHtml;
    modalOverlay.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function hideModal() {
    modalOverlay.classList.add('hidden');
    modal.classList.add('hidden');
    modalBody.innerHTML = ''; // Clear content
}

function displayError(message) {
    console.error('Error:', message);
    alert(`Ocorreu um erro: ${message}`);
}

function clearForm(formElement) {
    formElement.querySelectorAll('input').forEach(input => input.value = '');
}

// --- Authentication ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loggedInUserSpan.textContent = user.displayName || user.email;
        logoutBtn.classList.remove('hidden');
        fetchUserProfile();
        loadDashboard();
        showSection('dashboard-section');
    } else {
        currentUser = null;
        loggedInUserSpan.textContent = '';
        logoutBtn.classList.add('hidden');
        showSection('auth-section');
        clearForm(document.querySelector('#auth-section .auth-form:nth-of-type(1)')); // Clear login form
        clearForm(document.querySelector('#auth-section .auth-form:nth-of-type(2)')); // Clear signup form
    }
});

loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        alert('Por favor, preencha todos os campos de login.');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        displayError(`Falha ao fazer login: ${error.message}`);
    }
});

signupBtn.addEventListener('click', async () => {
    const name = signupNameInput.value;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const className = signupClassInput.value;

    if (!name || !email || !password || !className) {
        alert('Por favor, preencha todos os campos de cadastro.');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });

        // Save user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            class: className,
            points: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Conta criada com sucesso! Faça login para continuar.');
        showSection('auth-section'); // Return to login
        clearForm(document.querySelector('#auth-section .auth-form:nth-of-type(2)')); // Clear signup form

    } catch (error) {
        displayError(`Falha ao criar conta: ${error.message}`);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        alert('Logout realizado com sucesso!');
    } catch (error) {
        displayError(`Falha ao fazer logout: ${error.message}`);
    }
});

// --- User Profile ---
async function fetchUserProfile() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            profileNameSpan.textContent = userData.name;
            profileClassSpan.textContent = userData.class;
            profilePointsSpan.textContent = userData.points || 0;
        }
    } catch (error) {
        displayError(`Erro ao carregar perfil do usuário: ${error.message}`);
    }
}

// --- Dashboard and Subjects ---
function loadDashboard() {
    subjectsList.innerHTML = ''; // Clear existing subjects
    db.collection('subjects').where('ownerId', '==', currentUser.uid).get()
        .then(snapshot => {
            if (snapshot.empty) {
                subjectsList.innerHTML = '<p>Você ainda não criou nenhuma matéria. Clique em "Criar Matéria" para começar!</p>';
                return;
            }
            snapshot.forEach(doc => {
                const subject = { id: doc.id, ...doc.data() };
                const subjectCard = document.createElement('div');
                subjectCard.classList.add('subject-card');
                subjectCard.innerHTML = `
                    <h4>${subject.name}</h4>
                    <p>${subject.description}</p>
                    <button class="view-subject-btn" data-subject-id="${subject.id}">Ver Matéria</button>
                `;
                subjectsList.appendChild(subjectCard);
            });
        })
        .catch(error => {
            displayError(`Erro ao carregar matérias: ${error.message}`);
        });
}

createSubjectBtn.addEventListener('click', () => {
    showModal('Criar Nova Matéria', `
        <input type="text" id="modal-subject-name" placeholder="Nome da Matéria">
        <textarea id="modal-subject-description" placeholder="Descrição da Matéria"></textarea>
        <button id="save-subject-btn">Salvar Matéria</button>
    `);

    document.getElementById('save-subject-btn').addEventListener('click', async () => {
        const name = document.getElementById('modal-subject-name').value;
        const description = document.getElementById('modal-subject-description').value;

        if (!name || !description) {
            alert('Por favor, preencha nome e descrição da matéria.');
            return;
        }

        try {
            await db.collection('subjects').add({
                name: name,
                description: description,
                ownerId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            hideModal();
            loadDashboard();
        } catch (error) {
            displayError(`Erro ao criar matéria: ${error.message}`);
        }
    });
});

// Event delegation for viewing subjects
subjectsList.addEventListener('click', (event) => {
    if (event.target.classList.contains('view-subject-btn')) {
        currentSubjectId = event.target.dataset.subjectId;
        loadSubjectDetails(currentSubjectId);
    }
});

function loadSubjectDetails(subjectId) {
    db.collection('subjects').doc(subjectId).get()
        .then(doc => {
            if (!doc.exists) {
                alert('Matéria não encontrada.');
                return;
            }
            const subjectData = doc.data();
            currentSubjectTitle.textContent = subjectData.name;
            currentSubjectDescription.textContent = subjectData.description;

            loadTopics(subjectId);
            loadQuizzes(subjectId);

            showSection('subject-detail-section');
        })
        .catch(error => {
            displayError(`Erro ao carregar detalhes da matéria: ${error.message}`);
        });
}

function loadTopics(subjectId) {
    topicsList.innerHTML = '';
    db.collection('subjects').doc(subjectId).collection('topics').orderBy('createdAt').get()
        .then(snapshot => {
            if (snapshot.empty) {
                topicsList.innerHTML = '<li>Nenhum tópico encontrado para esta matéria.</li>';
                return;
            }
            snapshot.forEach(doc => {
                const topic = { id: doc.id, ...doc.data() };
                const topicItem = document.createElement('li');
                topicItem.innerHTML = `
                    <div>
                        <strong>${topic.title}</strong>
                        <p>${topic.content}</p>
                    </div>
                `;
                topicsList.appendChild(topicItem);
            });
        })
        .catch(error => {
            displayError(`Erro ao carregar tópicos: ${error.message}`);
        });
}

createTopicBtn.addEventListener('click', () => {
    showModal('Criar Novo Tópico', `
        <input type="text" id="modal-topic-title" placeholder="Título do Tópico">
        <textarea id="modal-topic-content" placeholder="Conteúdo do Tópico"></textarea>
        <button id="save-topic-btn">Salvar Tópico</button>
    `);

    document.getElementById('save-topic-btn').addEventListener('click', async () => {
        const title = document.getElementById('modal-topic-title').value;
        const content = document.getElementById('modal-topic-content').value;

        if (!title || !content) {
            alert('Por favor, preencha título e conteúdo do tópico.');
            return;
        }

        try {
            await db.collection('subjects').doc(currentSubjectId).collection('topics').add({
                title: title,
                content: content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            hideModal();
            loadTopics(currentSubjectId);
        } catch (error) {
            displayError(`Erro ao criar tópico: ${error.message}`);
        }
    });
});

function loadQuizzes(subjectId) {
    quizzesList.innerHTML = '';
    db.collection('subjects').doc(subjectId).collection('quizzes').get()
        .then(snapshot => {
            if (snapshot.empty) {
                quizzesList.innerHTML = '<li>Nenhum quiz encontrado para esta matéria.</li>';
                return;
            }
            snapshot.forEach(doc => {
                const quiz = { id: doc.id, ...doc.data() };
                const quizItem = document.createElement('li');
                quizItem.classList.add('quiz-item');
                quizItem.innerHTML = `
                    <span class="quiz-item-title">${quiz.title}</span>
                    <button class="play-quiz-btn" data-quiz-id="${doc.id}">Jogar Quiz</button>
                `;
                quizzesList.appendChild(quizItem);
            });
        })
        .catch(error => {
            displayError(`Erro ao carregar quizzes: ${error.message}`);
        });
}

createQuizBtn.addEventListener('click', () => {
    showModal('Criar Novo Quiz', `
        <input type="text" id="modal-quiz-title" placeholder="Título do Quiz">
        <button id="add-question-btn">Adicionar Pergunta</button>
        <div id="modal-quiz-questions"></div>
        <button id="save-quiz-btn">Salvar Quiz</button>
    `);

    const modalQuizQuestionsDiv = document.getElementById('modal-quiz-questions');
    let questionsArray = [];

    document.getElementById('add-question-btn').addEventListener('click', () => {
        const questionNumber = questionsArray.length + 1;
        const questionHtml = `
            <div class="modal-question">
                <h4>Pergunta ${questionNumber}</h4>
                <input type="text" placeholder="Enunciado da Pergunta" class="modal-question-text"><br>
                <input type="text" placeholder="Alternativa A" class="modal-option" data-option="A"><br>
                <input type="text" placeholder="Alternativa B" class="modal-option" data-option="B"><br>
                <input type="text" placeholder="Alternativa C" class="modal-option" data-option="C"><br>
                <input type="text" placeholder="Alternativa D" class="modal-option" data-option="D"><br>
                <input type="text" placeholder="Letra da Resposta Correta (A, B, C, D)" class="modal-correct-answer"><br>
            </div>
        `;
        modalQuizQuestionsDiv.insertAdjacentHTML('beforeend', questionHtml);
    });

    document.getElementById('save-quiz-btn').addEventListener('click', async () => {
        const quizTitle = document.getElementById('modal-quiz-title').value;
        if (!quizTitle) {
            alert('Por favor, insira um título para o quiz.');
            return;
        }

        const questionElements = modalQuizQuestionsDiv.querySelectorAll('.modal-question');
        questionsArray = [];

        questionElements.forEach(qElement => {
            const questionText = qElement.querySelector('.modal-question-text').value;
            const options = {};
            qElement.querySelectorAll('.modal-option').forEach(opt => {
                options[opt.dataset.option] = opt.value;
            });
            const correctAnswer = qElement.querySelector('.modal-correct-answer').value.toUpperCase();

            if (questionText && options.A && options.B && options.C && options.D && correctAnswer) {
                questionsArray.push({
                    text: questionText,
                    options: options,
                    correctAnswer: correctAnswer
                });
            } else {
                alert('Por favor, preencha todos os campos para cada pergunta.');
                return; // Stop saving if any question is incomplete
            }
        });

        if (questionsArray.length === 0) {
            alert('Adicione pelo menos uma pergunta ao quiz.');
            return;
        }

        try {
            await db.collection('subjects').doc(currentSubjectId).collection('quizzes').add({
                title: quizTitle,
                questions: questionsArray,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            hideModal();
            loadQuizzes(currentSubjectId);
        } catch (error) {
            displayError(`Erro ao salvar quiz: ${error.message}`);
        }
    });
});

// Event delegation for playing quizzes
quizzesList.addEventListener('click', (event) => {
    if (event.target.classList.contains('play-quiz-btn')) {
        currentQuizId = event.target.dataset.quizId;
        playQuiz(currentSubjectId, currentQuizId);
    }
});

function playQuiz(subjectId, quizId) {
    db.collection('subjects').doc(subjectId).collection('quizzes').doc(quizId).get()
        .then(doc => {
            if (!doc.exists) {
                alert('Quiz não encontrado.');
                return;
            }
            currentQuizData = { id: doc.id, ...doc.data() };
            currentQuestionIndex = 0;
            userScore = 0;
            correctAnswersCount = 0;
            displayQuestion();
            showSection('subject-detail-section'); // Ensure we are on the detail page
            quizPlayContainer.classList.remove('hidden');
        })
        .catch(error => {
            displayError(`Erro ao carregar quiz: ${error.message}`);
        });
}

function displayQuestion() {
    if (!currentQuizData || currentQuestionIndex >= currentQuizData.questions.length) {
        showQuizResults();
        return;
    }

    const question = currentQuizData.questions[currentQuestionIndex];
    questionContainer.innerHTML = `
        <p>${question.text}</p>
        <div id="options-container"></div>
    `;
    optionsContainer = document.getElementById('options-container'); // Re-get element

    const options = Object.entries(question.options);
    options.forEach(([key, value]) => {
        const button = document.createElement('button');
        button.textContent = `${key}: ${value}`;
        button.dataset.option = key;
        button.addEventListener('click', handleOptionClick);
        optionsContainer.appendChild(button);
    });

    nextQuestionBtn.textContent = 'Próximo';
    nextQuestionBtn.classList.add('hidden'); // Hide until an option is selected
    quizResults.classList.add('hidden');
    quizPlayContainer.classList.remove('hidden');
}

function handleOptionClick(event) {
    const selectedOption = event.target.dataset.option;
    const question = currentQuizData.questions[currentQuestionIndex];
    const isCorrect = (selectedOption === question.correctAnswer);

    // Disable all option buttons
    optionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('selected');
        if (btn.dataset.option === question.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.dataset.option === selectedOption) {
            btn.classList.add('incorrect');
        }
    });

    // Update score and count
    if (isCorrect) {
        userScore += 10;
        correctAnswersCount++;
    }

    event.target.classList.add('selected'); // Highlight selected option

    nextQuestionBtn.textContent = 'Próximo';
    nextQuestionBtn.classList.remove('hidden');
}

nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.questions.length) {
        displayQuestion();
    } else {
        showQuizResults();
    }
});

function showQuizResults() {
    document.getElementById('final-score').textContent = userScore;
    document.getElementById('correct-answers').textContent = correctAnswersCount;
    quizResults.classList.remove('hidden');
    nextQuestionBtn.classList.add('hidden');
    questionContainer.classList.add('hidden'); // Hide question container

    // Save quiz history
    saveQuizHistory(currentQuizData.title, userScore, correctAnswersCount);

    // Update user points in Firestore
    updateUserPoints(userScore);
}

async function saveQuizHistory(quizTitle, score, correctAnswers) {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('history').add({
            quizName: quizTitle,
            score: score,
            correctAnswers: correctAnswers,
            playedAt: firebase.firestore.FieldValue.serverTimestamp(),
            subjectId: currentSubjectId // Optional: link to subject
        });
    } catch (error) {
        displayError(`Erro ao salvar histórico do quiz: ${error.message}`);
    }
}

async function updateUserPoints(pointsToAdd) {
    if (!currentUser) return;
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(pointsToAdd)
        });
        // Update local profile display
        profilePointsSpan.textContent = parseInt(profilePointsSpan.textContent) + pointsToAdd;
    } catch (error) {
        displayError(`Erro ao atualizar pontos do usuário: ${error.message}`);
    }
}

playAgainBtn.addEventListener('click', () => {
    // Reset UI for playing again
    questionContainer.classList.remove('hidden');
    quizResults.classList.add('hidden');
    currentQuestionIndex = 0;
    userScore = 0;
    correctAnswersCount = 0;
    displayQuestion();
});

backToDashboardBtn.addEventListener('click', () => {
    quizPlayContainer.classList.add('hidden'); // Hide quiz play area
    subjectDetailSection.classList.add('hidden');
    loadDashboard(); // Reload dashboard to show subjects
    showSection('dashboard-section');
});

// --- Ranking ---
viewRankingBtn.addEventListener('click', loadRanking);

function loadRanking() {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = ''; // Clear previous ranking

    db.collection('users').orderBy('points', 'desc').limit(20).get() // Limit to top 20
        .then(snapshot => {
            if (snapshot.empty) {
                rankingList.innerHTML = '<li>Nenhum usuário encontrado para exibir o ranking.</li>';
                return;
            }
            snapshot.forEach((doc, index) => {
                const user = doc.data();
                const rankItem = document.createElement('li');
                rankItem.innerHTML = `
                    <span>${user.name}</span>
                    <span>Sala: ${user.class}</span>
                    <span>Pontos: ${user.points || 0}</span>
                `;
                rankingList.appendChild(rankItem);
            });
            showSection('ranking-section');
        })
        .catch(error => {
            displayError(`Erro ao carregar ranking: ${error.message}`);
        });
}

backToDashboardFromRankingBtn.addEventListener('click', () => {
    rankingSection.classList.add('hidden');
    showSection('dashboard-section');
});

// --- History ---
viewHistoryBtn.addEventListener('click', loadHistory);

function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = ''; // Clear previous history

    if (!currentUser) {
        historyList.innerHTML = '<li>Faça login para ver seu histórico.</li>';
        showSection('history-section');
        return;
    }

    db.collection('users').doc(currentUser.uid).collection('history').orderBy('playedAt', 'desc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                historyList.innerHTML = '<li>Você ainda não jogou nenhum quiz.</li>';
                return;
            }
            snapshot.forEach(doc => {
                const historyEntry = doc.data();
                const historyItem = document.createElement('li');
                const playedDate = historyEntry.playedAt ? historyEntry.playedAt.toDate().toLocaleString() : 'Data indisponível';
                historyItem.innerHTML = `
                    <strong>${historyEntry.quizName}</strong>
                    <p>Pontuação: ${historyEntry.score} (${historyEntry.correctAnswers} acertos)</p>
                    <small>Jogada em: ${playedDate}</small>
                `;
                historyList.appendChild(historyItem);
            });
            showSection('history-section');
        })
        .catch(error => {
            displayError(`Erro ao carregar histórico: ${error.message}`);
        });
}

backToDashboardFromHistoryBtn.addEventListener('click', () => {
    historySection.classList.add('hidden');
    showSection('dashboard-section');
});

// --- Close Modal Button ---
closeModalBtn.addEventListener('click', hideModal);
modalOverlay.addEventListener('click', hideModal); // Close modal when clicking overlay

// --- Initial Load ---
// `onAuthStateChanged` will handle showing the correct section initially.
