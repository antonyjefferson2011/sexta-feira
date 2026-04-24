document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const footerUserName = document.getElementById('footerUserName');
    const rankingUserName = document.getElementById('rankingUserName');
    const historicoUserName = document.getElementById('historicoUserName');
    const changeNameBtn = document.getElementById('changeNameBtn');

    const materiaModal = document.getElementById('materia-modal');
    const materiaNameInput = document.getElementById('materia-name-input');
    const materiaDescriptionInput = document.getElementById('materia-description-input');
    const saveMateriaBtn = document.getElementById('save-materia-btn');
    const addMateriaBtn = document.getElementById('addMateriaBtn');
    const closeMateriaModal = materiaModal.querySelector('.close-button');
    const materiasListDiv = document.getElementById('materias-list');

    const topicoModal = document.getElementById('topico-modal');
    const topicoTitleInput = document.getElementById('topico-title-input');
    const topicoContentInput = document.getElementById('topico-content-input');
    const saveTopicoBtn = document.getElementById('save-topico-btn');
    const addTopicoBtn = document.getElementById('addTopicoBtn');
    const closeTopicoModal = topicoModal.querySelector('.close-button');
    const topicosListDiv = document.getElementById('topicos-list');
    let currentMateriaId = null;

    const quizListDiv = document.getElementById('quizzes-available');
    const createQuizBtn = document.getElementById('createQuizBtn');
    const quizTitleInput = document.getElementById('quiz-title-input');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const saveQuizBtn = document.getElementById('save-quiz-btn');
    const cancelCreateQuizBtn = document.getElementById('cancel-create-quiz-btn');
    const playQuizTitle = document.getElementById('play-quiz-title');
    const questionDisplay = document.getElementById('question-display');
    const alternativesDisplay = document.getElementById('alternatives-display');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const finishQuizBtn = document.getElementById('finish-quiz-btn');
    const refazerQuizBtn = document.getElementById('refazer-quiz-btn');
    const backToQuizListBtn = document.querySelectorAll('#play-quiz .btn-secondary');
    const quizResultSection = document.getElementById('quiz-result');
    const resultQuizTitle = document.getElementById('result-quiz-title');
    const scoreDisplay = document.getElementById('score-display');
    const correctAnswersDisplay = document.getElementById('correct-answers-display');
    const incorrectAnswersDisplay = document.getElementById('incorrect-answers-display');
    const refazerQuizBtnResult = document.getElementById('refazer-quiz-btn-result');
    const backToQuizListBtnResult = document.getElementById('backToQuizListBtn-result');

    const rankingListUl = document.getElementById('ranking-list');
    const historicoListUl = document.getElementById('historico-list');

    const POINTS_PER_CORRECT_ANSWER = 10;
    const LOCAL_STORAGE_KEY_USER = 'sfStudiesUserName';
    const LOCAL_STORAGE_KEY_MATERIAS = 'sfStudiesMaterias';
    const LOCAL_STORAGE_KEY_QUIZZES = 'sfStudiesQuizzes';
    const LOCAL_STORAGE_KEY_USER_STATS = 'sfStudiesUserStats';
    const LOCAL_STORAGE_KEY_HISTORY = 'sfStudiesHistory';

    let currentUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER) || 'Visitante';
    let materias = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MATERIAS)) || [];
    let quizzes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_QUIZZES)) || [];
    let userStats = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_USER_STATS)) || {};
    let quizHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY)) || [];

    let currentQuizData = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;

    // --- Navigation ---
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-nav') === pageId) {
                link.classList.add('active');
            }
        });
        loadContentForPage(pageId);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-nav');
            showPage(pageId);
        });
    });

    function loadContentForPage(pageId) {
        switch (pageId) {
            case 'home':
                updateUserNameDisplay();
                break;
            case 'materias':
                renderMaterias();
                break;
            case 'quiz-list':
                renderAvailableQuizzes();
                break;
            case 'ranking':
                renderRanking();
                break;
            case 'historico':
                renderHistory();
                break;
        }
    }

    // --- User Management ---
    function updateUserNameDisplay() {
        userNameDisplay.textContent = `Criado por: ${currentUser}`;
        footerUserName.textContent = currentUser;
        rankingUserName.textContent = currentUser;
        historicoUserName.textContent = currentUser;
    }

    changeNameBtn.addEventListener('click', () => {
        const newName = prompt("Qual o seu nome?", currentUser);
        if (newName && newName.trim() !== '') {
            currentUser = newName.trim();
            localStorage.setItem(LOCAL_STORAGE_KEY_USER, currentUser);
            updateUserNameDisplay();
            // Update user stats if they exist
            if (userStats[currentUser]) {
                userStats[currentUser].name = currentUser;
            }
            saveUserStats();
        }
    });

    // --- Materias Management ---
    function saveMaterias() {
        localStorage.setItem(LOCAL_STORAGE_KEY_MATERIAS, JSON.stringify(materias));
    }

    function renderMaterias() {
        materiasListDiv.innerHTML = '';
        if (materias.length === 0) {
            materiasListDiv.innerHTML = '<p>Nenhuma matéria adicionada ainda. Clique no "+" para criar uma.</p>';
            return;
        }
        materias.forEach(materia => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>${materia.name}</h3>
                <p>${materia.description}</p>
                <span class="author">Autor: ${materia.author || currentUser}</span>
            `;
            card.addEventListener('click', () => {
                currentMateriaId = materia.id;
                document.getElementById('materia-detail-title').textContent = materia.name;
                document.getElementById('materia-detail-description').textContent = materia.description;
                renderTopicos(materia.id);
                showPage('materia-detail');
            });
            materiasListDiv.appendChild(card);
        });
    }

    addMateriaBtn.addEventListener('click', () => {
        materiaNameInput.value = '';
        materiaDescriptionInput.value = '';
        materiaModal.style.display = 'block';
    });

    closeMateriaModal.addEventListener('click', () => {
        materiaModal.style.display = 'none';
    });

    saveMateriaBtn.addEventListener('click', () => {
        const name = materiaNameInput.value.trim();
        const description = materiaDescriptionInput.value.trim();

        if (!name) {
            alert('O nome da matéria é obrigatório.');
            return;
        }

        const newMateria = {
            id: Date.now().toString(),
            name: name,
            description: description,
            topics: [],
            author: currentUser
        };
        materias.push(newMateria);
        saveMaterias();
        renderMaterias();
        materiaModal.style.display = 'none';
    });

    // --- Tópicos Management ---
    function saveTopicsForMateria(materiaId) {
        const materiaIndex = materias.findIndex(m => m.id === materiaId);
        if (materiaIndex !== -1) {
            materias[materiaIndex].topics = materias[materiaIndex].topics;
            saveMaterias();
        }
    }

    function renderTopicos(materiaId) {
        topicosListDiv.innerHTML = '';
        const materia = materias.find(m => m.id === materiaId);
        if (!materia || materia.topics.length === 0) {
            topicosListDiv.innerHTML = '<p>Nenhum tópico adicionado para esta matéria.</p>';
            return;
        }
        materia.topics.forEach(topico => {
            const topicElement = document.createElement('div');
            topicElement.classList.add('card');
            topicElement.innerHTML = `
                <h3>${topico.title}</h3>
                <p>${topico.content}</p>
                <span class="author">Autor: ${topico.author || currentUser}</span>
            `;
            topicosListDiv.appendChild(topicElement);
        });
    }

    addTopicoBtn.addEventListener('click', () => {
        if (currentMateriaId) {
            topicoTitleInput.value = '';
            topicoContentInput.value = '';
            topicoModal.style.display = 'block';
        } else {
            alert('Selecione uma matéria primeiro.');
        }
    });

    closeTopicoModal.addEventListener('click', () => {
        topicoModal.style.display = 'none';
    });

    saveTopicoBtn.addEventListener('click', () => {
        const title = topicoTitleInput.value.trim();
        const content = topicoContentInput.value.trim();

        if (!title || !content) {
            alert('Título e conteúdo do tópico são obrigatórios.');
            return;
        }

        if (currentMateriaId) {
            const materiaIndex = materias.findIndex(m => m.id === currentMateriaId);
            if (materiaIndex !== -1) {
                materias[materiaIndex].topics.push({
                    id: Date.now().toString(),
                    title: title,
                    content: content,
                    author: currentUser
                });
                saveMaterias();
                renderTopicos(currentMateriaId);
                topicoModal.style.display = 'none';
            }
        }
    });

    document.getElementById('backToMateriasBtn').addEventListener('click', () => {
        showPage('materias');
    });

    // --- Quiz Management ---
    function saveQuizzes() {
        localStorage.setItem(LOCAL_STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
    }

    function renderAvailableQuizzes() {
        quizListDiv.innerHTML = '';
        if (quizzes.length === 0) {
            quizListDiv.innerHTML = '<p>Nenhum quiz criado ainda. Clique em "Criar Novo Quiz".</p>';
            return;
        }
        quizzes.forEach((quiz, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.questions.length} perguntas</p>
                <button class="btn-secondary play-quiz-btn" data-quiz-id="${quiz.id}">Jogar</button>
            `;
            quizListDiv.appendChild(card);
        });

        document.querySelectorAll('.play-quiz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = e.target.getAttribute('data-quiz-id');
                startQuiz(quizId);
            });
        });
    }

    createQuizBtn.addEventListener('click', () => {
        showPage('create-quiz');
        quizTitleInput.value = '';
        questionsContainer.innerHTML = '';
        currentQuestionIndex = 0; // Reset for new quiz creation
    });

    addQuestionBtn.addEventListener('click', () => {
        addQuestion();
    });

    saveQuizBtn.addEventListener('click', () => {
        const title = quizTitleInput.value.trim();
        if (!title) {
            alert('O título do quiz é obrigatório.');
            return;
        }

        const questionBlocks = document.querySelectorAll('.question-block');
        const newQuizQuestions = [];
        let isValid = true;

        questionBlocks.forEach((block, index) => {
            const questionText = block.querySelector('input[type="text"]').value.trim();
            const alternativesInputs = block.querySelectorAll('.alternative-input');
            const correctRadio = block.querySelector('input[type="radio"]:checked');

            if (!questionText) {
                alert(`Pergunta ${index + 1} está vazia.`);
                isValid = false;
                return;
            }

            const alternatives = [];
            let correctAnswerSelected = false;
            alternativesInputs.forEach(input => {
                if (input.value.trim()) {
                    alternatives.push(input.value.trim());
                }
            });

            if (alternatives.length < 4) {
                alert(`Pergunta ${index + 1} precisa ter 4 alternativas.`);
                isValid = false;
                return;
            }

            if (!correctRadio) {
                alert(`Selecione a alternativa correta para a pergunta ${index + 1}.`);
                isValid = false;
                return;
            }

            const correctAnswerIndex = Array.from(alternativesInputs).indexOf(correctRadio);
            newQuizQuestions.push({
                question: questionText,
                alternatives: alternatives,
                correctAnswerIndex: correctAnswerIndex
            });
        });

        if (isValid) {
            quizzes.push({
                id: Date.now().toString(),
                title: title,
                questions: newQuizQuestions,
                author: currentUser
            });
            saveQuizzes();
            showPage('quiz-list');
            renderAvailableQuizzes();
        }
    });

    cancelCreateQuizBtn.addEventListener('click', () => {
        showPage('quiz-list');
    });

    function addQuestion() {
        currentQuestionIndex++;
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        questionBlock.innerHTML = `
            <h4>Pergunta ${currentQuestionIndex}</h4>
            <input type="text" placeholder="Digite a pergunta...">
            <div class="alternatives-container">
                <label>
                    <input type="radio" name="correct-answer-${currentQuestionIndex}" value="0">
                    <input type="text" class="alternative-input" placeholder="Alternativa 1">
                </label>
                <label>
                    <input type="radio" name="correct-answer-${currentQuestionIndex}" value="1">
                    <input type="text" class="alternative-input" placeholder="Alternativa 2">
                </label>
                <label>
                    <input type="radio" name="correct-answer-${currentQuestionIndex}" value="2">
                    <input type="text" class="alternative-input" placeholder="Alternativa 3">
                </label>
                <label>
                    <input type="radio" name="correct-answer-${currentQuestionIndex}" value="3">
                    <input type="text" class="alternative-input" placeholder="Alternativa 4">
                </label>
            </div>
        `;
        questionsContainer.appendChild(questionBlock);

        // Add event listeners to radio buttons to ensure only one is selected per question set
        const radioGroup = questionBlock.querySelectorAll(`input[type="radio"][name="correct-answer-${currentQuestionIndex}"]`);
        radioGroup.forEach(radio => {
            radio.addEventListener('change', () => {
                radioGroup.forEach(r => r.checked = false);
                radio.checked = true;
            });
        });
    }

    // --- Playing Quiz ---
    function startQuiz(quizId) {
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) {
            alert('Quiz não encontrado!');
            return;
        }
        currentQuizData = quiz;
        currentQuestionIndex = 0;
        score = 0;
        correctAnswersCount = 0;
        incorrectAnswersCount = 0;

        playQuizTitle.textContent = quiz.title;
        showPage('play-quiz');
        renderQuestion();
    }

    function renderQuestion() {
        if (!currentQuizData || currentQuestionIndex >= currentQuizData.questions.length) {
            showQuizResult();
            return;
        }

        const questionData = currentQuizData.questions[currentQuestionIndex];
        document.getElementById('quiz-progress').textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuizData.questions.length}`;
        questionDisplay.textContent = questionData.question;
        alternativesDisplay.innerHTML = '';

        const shuffledAlternatives = shuffleArray([...questionData.alternatives]);
        const correctAnswerIndex = questionData.alternatives.indexOf(questionData.correctAnswerIndex); // Find original index

        shuffledAlternatives.forEach((alt, index) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'quiz-answer';
            radio.value = index; // Use index of shuffled array for selection
            label.appendChild(radio);
            label.appendChild(document.createTextNode(alt));
            alternativesDisplay.appendChild(label);
        });

        // Hide/show buttons
        nextQuestionBtn.style.display = 'none';
        finishQuizBtn.style.display = 'none';
        refazerQuizBtn.style.display = 'none';
        document.getElementById('backToQuizListBtn').style.display = 'none';

        // Add event listeners to radio buttons for this question
        alternativesDisplay.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // After selecting an answer, show the next/finish button
                if (currentQuestionIndex < currentQuizData.questions.length - 1) {
                    nextQuestionBtn.style.display = 'block';
                } else {
                    finishQuizBtn.style.display = 'block';
                }
            });
        });
    }

    nextQuestionBtn.addEventListener('click', () => {
        const selectedAnswerRadio = alternativesDisplay.querySelector('input[type="radio"]:checked');
        if (!selectedAnswerRadio) {
            alert('Por favor, selecione uma alternativa.');
            return;
        }

        const selectedIndex = parseInt(selectedAnswerRadio.value);
        const questionData = currentQuizData.questions[currentQuestionIndex];
        const questionAlternatives = Array.from(alternativesDisplay.querySelectorAll('label')).map(label => label.textContent.trim());

        // Find the original index of the selected alternative in the original question data
        const selectedAlternativeText = questionAlternatives[selectedIndex];
        const originalCorrectAnswerIndex = questionData.correctAnswerIndex;
        const originalCorrectAlternativeText = questionData.alternatives[originalCorrectAnswerIndex];

        if (selectedAlternativeText === originalCorrectAlternativeText) {
            score += POINTS_PER_CORRECT_ANSWER;
            correctAnswersCount++;
            selectedAnswerRadio.parentElement.classList.add('correct');
        } else {
            incorrectAnswersCount++;
            selectedAnswerRadio.parentElement.classList.add('incorrect');
            // Highlight the correct answer
            const correctLabel = alternativesDisplay.querySelector(`label:nth-child(${originalCorrectAnswerIndex + 1})`);
            if (correctLabel) {
                correctLabel.classList.add('correct');
            }
        }

        // Disable further selection for this question
        alternativesDisplay.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);

        currentQuestionIndex++;
        setTimeout(() => {
            renderQuestion();
        }, 1500); // Delay to show feedback
    });

    finishQuizBtn.addEventListener('click', showQuizResult);

    function showQuizResult() {
        saveQuizHistory();
        showPage('quiz-result');
        resultQuizTitle.textContent = currentQuizData.title;
        scoreDisplay.textContent = `${score} pontos`;
        correctAnswersDisplay.textContent = correctAnswersCount;
        incorrectAnswersDisplay.textContent = incorrectAnswersCount;

        // Update user stats
        if (!userStats[currentUser]) {
            userStats[currentUser] = { name: currentUser, totalScore: 0, quizzesPlayed: 0 };
        }
        userStats[currentUser].totalScore += score;
        userStats[currentUser].quizzesPlayed++;
        saveUserStats();

        // Show buttons
        refazerQuizBtnResult.style.display = 'block';
        backToQuizListBtnResult.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
        finishQuizBtn.style.display = 'none';
    }

    refazerQuizBtn.addEventListener('click', () => {
        startQuiz(currentQuizData.id); // Refazer current quiz
    });

    refazerQuizBtnResult.addEventListener('click', () => {
        startQuiz(currentQuizData.id); // Refazer current quiz
    });

    backToQuizListBtn.forEach(btn => {
        btn.addEventListener('click', () => showPage('quiz-list'));
    });
    backToQuizListBtnResult.addEventListener('click', () => showPage('quiz-list'));


    // --- Scoring and History ---
    function saveUserStats() {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER_STATS, JSON.stringify(userStats));
    }

    function saveQuizHistory() {
        const historyEntry = {
            quizTitle: currentQuizData.title,
            score: score,
            correct: correctAnswersCount,
            incorrect: incorrectAnswersCount,
            date: new Date().toLocaleString(),
            userName: currentUser
        };
        quizHistory.push(historyEntry);
        // Keep only the last X entries if needed, for now, save all
        localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(quizHistory));
    }

    function renderHistory() {
        historicoListUl.innerHTML = '';
        if (quizHistory.length === 0) {
            historicoListUl.innerHTML = '<li>Nenhum quiz realizado ainda.</li>';
            return;
        }
        // Filter history by current user if needed, for now show all
        const userHistory = quizHistory.filter(entry => entry.userName === currentUser);

        userHistory.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        userHistory.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${entry.quizTitle}</span>
                <span>Pontuação: ${entry.score} (${entry.correct} acertos)</span>
                <small>${entry.date}</small>
            `;
            historicoListUl.appendChild(li);
        });
    }

    // --- Ranking ---
    function renderRanking() {
        rankingListUl.innerHTML = '';
        const sortedUsers = Object.values(userStats).sort((a, b) => b.totalScore - a.totalScore);

        if (sortedUsers.length === 0) {
            rankingListUl.innerHTML = '<li>Nenhum usuário registrado para mostrar o ranking.</li>';
            return;
        }

        sortedUsers.forEach((user, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${index + 1}. ${user.name}</span>
                <span>${user.totalScore} pontos</span>
            `;
            rankingListUl.appendChild(li);
        });
    }

    // --- Utility Functions ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // --- Initial Load ---
    updateUserNameDisplay();
    showPage('home'); // Start on the home page
});
