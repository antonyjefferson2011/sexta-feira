document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a');
    const addMateriaBtn = document.getElementById('addMateriaBtn');
    const materiasContainer = document.getElementById('materiasContainer');
    const materiaForm = document.getElementById('materiaForm');
    const materiaInputNome = document.getElementById('materiaNome');
    const materiaInputDescricao = document.getElementById('materiaDescricao');
    const materiaDetailSection = document.getElementById('materia-detail');
    const currentMateriaTitle = document.getElementById('currentMateriaTitle');
    const currentMateriaDescription = document.getElementById('currentMateriaDescription');
    const topicosContainer = document.getElementById('topicosContainer');
    const addTopicoBtn = document.getElementById('addTopicoBtn');
    const topicoForm = document.getElementById('topicoForm');
    const topicoInputTitulo = document.getElementById('topicoTitulo');
    const topicoInputConteudo = document.getElementById('topicoConteudo');
    const backToMateriasBtn = document.getElementById('backToMaterias');
    const cancelAddMateriaBtn = document.getElementById('cancelAddMateria');
    const cancelAddTopicoBtn = document.getElementById('cancelAddTopico');
    const quizSection = document.getElementById('quiz');
    const quizListContainer = document.getElementById('quizListContainer');
    const createQuizBtn = document.getElementById('createQuizBtn');
    const quizCreationForm = document.getElementById('quizCreationForm');
    const quizTitleInput = document.getElementById('quizTitleInput');
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const cancelQuizCreationBtn = document.getElementById('cancelQuizCreation');
    const quizExecutionSection = document.getElementById('quiz-execution');
    const currentQuizTitleEl = document.getElementById('currentQuizTitle');
    const quizProgressEl = document.getElementById('quizProgress');
    const questionAreaEl = document.getElementById('questionArea');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const finishQuizBtn = document.getElementById('finishQuizBtn');
    const backToQuizListBtns = document.querySelectorAll('#backToQuizList, #backToQuizListFromResults');
    const quizResultSection = document.getElementById('quiz-result');
    const resultTitleEl = document.getElementById('resultTitle');
    const scoreSummaryEl = document.getElementById('scoreSummary');
    const answerDetailsEl = document.getElementById('answerDetails');
    const retakeQuizBtn = document.getElementById('retakeQuizBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const editUserButton = document.getElementById('editUserButton');
    const createdByEl = document.getElementById('createdBy');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const bodyElement = document.body;

    // --- Constants ---
    const LOCAL_STORAGE_KEY_USER = 'studiesAppName_userName';
    const LOCAL_STORAGE_KEY_MATERIAS = 'studiesAppName_materias';
    const LOCAL_STORAGE_KEY_QUIZZES = 'studiesAppName_quizzes';
    const CURRENT_MATEIRA_ID_STORAGE = 'studiesAppName_currentMateriaId';
    const CURRENT_QUIZ_ID_STORAGE = 'studiesAppName_currentQuizId';

    // --- State Variables ---
    let materias = [];
    let currentMateriaId = null;
    let quizzes = [];
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let darkMode = localStorage.getItem('darkMode') === 'true';

    // --- Utility Functions ---
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }

        // Update nav active state
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function loadFromLocalStorage(key, defaultValue = []) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function renderMaterias() {
        materiasContainer.innerHTML = '';
        if (materias.length === 0) {
            materiasContainer.innerHTML = '<p>Nenhuma matéria adicionada ainda. Clique no "+" para criar uma.</p>';
            return;
        }
        materias.forEach(materia => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>${materia.nome}</h3>
                <p>${materia.descricao || 'Sem descrição'}</p>
                <button class="btn btn-outline view-materia-btn" data-id="${materia.id}">Ver Detalhes</button>
            `;
            materiasContainer.appendChild(card);
        });
    }

    function renderTopicos(materiaId) {
        const materia = materias.find(m => m.id === materiaId);
        if (!materia) return;

        topicosContainer.innerHTML = '';
        currentMateriaTitle.textContent = materia.nome;
        currentMateriaDescription.textContent = materia.descricao || '';

        if (materia.topicos.length === 0) {
            topicosContainer.innerHTML = '<p>Nenhum tópico adicionado ainda. Clique no "+" para criar um.</p>';
            return;
        }

        materia.topicos.forEach(topico => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.style.cursor = 'default'; // Tópicos não são clicáveis para navegação aqui
            card.innerHTML = `
                <h4>${topico.titulo}</h4>
                <p>${topico.conteudo}</p>
                <div class="author">Criado por: ${topico.autor || 'Anônimo'}</div>
            `;
            topicosContainer.appendChild(card);
        });
    }

    function renderQuizzes() {
        quizListContainer.innerHTML = '';
        if (quizzes.length === 0) {
            quizListContainer.innerHTML = '<p>Nenhum quiz criado ainda. Clique no "+" para criar um.</p>';
            return;
        }
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.questions.length} perguntas</p>
                <button class="btn btn-primary start-quiz-btn" data-id="${quiz.id}">Iniciar Quiz</button>
            `;
            quizListContainer.appendChild(card);
        });
    }

    function renderQuestion(questionIndex) {
        const question = currentQuiz.questions[questionIndex];
        questionAreaEl.innerHTML = `
            <h3>${question.enunciado}</h3>
            <div class="options-container">
                ${question.options.map((option, index) => `
                    <div class="option">
                        <input type="radio" name="quiz-option" id="option-${index}" value="${index}" ${quizIsBeingTaken() ? '' : 'disabled'}>
                        <label for="option-${index}">${option}</label>
                    </div>
                `).join('')}
            </div>
        `;
        quizProgressEl.textContent = `Pergunta ${questionIndex + 1} de ${currentQuiz.questions.length}`;

        if (quizIsBeingTaken()) {
            nextQuestionBtn.classList.remove('hidden');
            finishQuizBtn.classList.add('hidden');
            if (questionIndex === currentQuiz.questions.length - 1) {
                nextQuestionBtn.classList.add('hidden');
                finishQuizBtn.classList.remove('hidden');
            }
        } else {
            nextQuestionBtn.classList.add('hidden');
            finishQuizBtn.classList.add('hidden');
            backToQuizListBtns.forEach(btn => btn.classList.remove('hidden'));
        }

        // Pre-select answers if quiz is being taken and answers are saved
        if (quizIsBeingTaken() && userAnswers[questionIndex] !== undefined) {
            const selectedOption = document.querySelector(`input[name="quiz-option"][value="${userAnswers[questionIndex]}"]`);
            if (selectedOption) {
                selectedOption.checked = true;
            }
        }
    }

    function renderQuizResult() {
        let correctCount = 0;
        answerDetailsEl.innerHTML = '';

        currentQuiz.questions.forEach((question, index) => {
            const userAnswerIndex = userAnswers[index];
            const correctAnswerIndex = question.correctAnswer;
            const isCorrect = userAnswerIndex === correctAnswerIndex;
            if (isCorrect) {
                correctCount++;
            }

            const li = document.createElement('li');
            li.innerHTML = `
                <strong>Pergunta:</strong> ${question.enunciado}<br>
                <strong>Sua Resposta:</strong> ${question.options[userAnswerIndex] || 'Não respondida'} <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">(${isCorrect ? 'Correto' : 'Incorreto'})</span><br>
                <strong>Resposta Correta:</strong> ${question.options[correctAnswerIndex]}
            `;
            answerDetailsEl.appendChild(li);
        });

        const totalQuestions = currentQuiz.questions.length;
        scoreSummaryEl.textContent = `Você acertou ${correctCount} de ${totalQuestions} perguntas.`;
        resultTitleEl.textContent = `Resultado do Quiz: ${currentQuiz.title}`;

        showSection('quiz-result');
        retakeQuizBtn.onclick = () => startQuiz(currentQuiz.id); // Use the same quiz ID to retake
    }

    function applyDarkMode() {
        if (darkMode) {
            bodyElement.classList.add('dark-mode');
            darkModeToggle.querySelector('.icon').textContent = '☀️';
        } else {
            bodyElement.classList.remove('dark-mode');
            darkModeToggle.querySelector('.icon').textContent = '🌙';
        }
        localStorage.setItem('darkMode', darkMode);
    }

    function quizIsBeingTaken() {
        return currentQuiz && currentQuestionIndex < currentQuiz.questions.length;
    }

    function getUserName() {
        let name = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
        if (!name) {
            name = prompt("Por favor, digite seu nome para personalizar sua experiência:");
            if (name) {
                localStorage.setItem(LOCAL_STORAGE_KEY_USER, name);
            } else {
                name = "Visitante"; // Default if no name is entered
            }
        }
        userNameDisplay.textContent = `Olá, ${name}!`;
        createdByEl.textContent = `Criado por: ${name}`;
        return name;
    }

    // --- Event Handlers ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    addMateriaBtn.addEventListener('click', () => {
        showSection('add-materia-form');
        materiaInputNome.value = '';
        materiaInputDescricao.value = '';
    });

    materiaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = materiaInputNome.value.trim();
        const descricao = materiaInputDescricao.value.trim();

        if (!nome) return;

        if (currentMateriaId) { // Editing existing materia
            materias = materias.map(m => m.id === currentMateriaId ? { ...m, nome, descricao } : m);
        } else { // Adding new materia
            materias.push({
                id: generateUniqueId(),
                nome: nome,
                descricao: descricao,
                topicos: []
            });
        }
        saveToLocalStorage(LOCAL_STORAGE_KEY_MATERIAS, materias);
        renderMaterias();
        showSection('materias');
        currentMateriaId = null; // Reset for next add
    });

    materiasContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-materia-btn')) {
            const id = e.target.dataset.id;
            currentMateriaId = id;
            saveToLocalStorage(CURRENT_MATEIRA_ID_STORAGE, id);
            renderTopicos(id);
            showSection('materia-detail');
        }
    });

    addTopicoBtn.addEventListener('click', () => {
        if (!currentMateriaId) return;
        showSection('add-topico-form');
        topicoInputTitulo.value = '';
        topicoInputConteudo.value = '';
        const materia = materias.find(m => m.id === currentMateriaId);
        if (materia) {
            document.getElementById('formTopicoTitle').textContent = `Adicionar Tópico para ${materia.nome}`;
        }
    });

    topicoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = topicoInputTitulo.value.trim();
        const conteudo = topicoInputConteudo.value.trim();
        const autor = localStorage.getItem(LOCAL_STORAGE_KEY_USER) || 'Anônimo';

        if (!titulo || !conteudo) return;

        const materiaIndex = materias.findIndex(m => m.id === currentMateriaId);
        if (materiaIndex !== -1) {
            materias[materiaIndex].topicos.push({
                id: generateUniqueId(),
                titulo: titulo,
                conteudo: conteudo,
                autor: autor
            });
            saveToLocalStorage(LOCAL_STORAGE_KEY_MATERIAS, materias);
            renderTopicos(currentMateriaId);
            showSection('materia-detail');
        }
    });

    backToMateriasBtn.addEventListener('click', () => {
        showSection('materias');
        currentMateriaId = null;
        localStorage.removeItem(CURRENT_MATEIRA_ID_STORAGE);
    });

    cancelAddMateriaBtn.addEventListener('click', () => showSection('materias'));
    cancelAddTopicoBtn.addEventListener('click', () => {
        if (currentMateriaId) {
            renderTopicos(currentMateriaId); // Re-render to show current topics
            showSection('materia-detail');
        } else {
            showSection('materias');
        }
    });

    createQuizBtn.addEventListener('click', () => {
        showSection('quiz-creation-form');
        quizTitleInput.value = '';
        questionsContainer.innerHTML = '';
        // Add the first question by default
        addQuestionToForm();
    });

    addQuestionBtn.addEventListener('click', () => addQuestionToForm());

    quizCreationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = quizTitleInput.value.trim();
        if (!title) return;

        const newQuiz = {
            id: generateUniqueId(),
            title: title,
            questions: []
        };

        const questionElements = questionsContainer.querySelectorAll('.question-block');
        questionElements.forEach((qBlock, index) => {
            const enunciado = qBlock.querySelector('.question-enunciado').value.trim();
            const options = [];
            const optionInputs = qBlock.querySelectorAll('.question-option');
            optionInputs.forEach(optInput => options.push(optInput.value.trim()));

            const correctAnswer = qBlock.querySelector('input[name="correct-answer"]:checked');
            const correctAnswerIndex = correctAnswer ? parseInt(correctAnswer.value) : -1;

            if (enunciado && options.every(opt => opt) && correctAnswerIndex !== -1) {
                newQuiz.questions.push({
                    id: generateUniqueId(),
                    enunciado: enunciado,
                    options: options,
                    correctAnswer: correctAnswerIndex
                });
            } else {
                alert(`Por favor, preencha todos os campos e selecione a resposta correta para a pergunta ${index + 1}.`);
                return; // Stop form submission if incomplete
            }
        });

        if (newQuiz.questions.length > 0) {
            quizzes.push(newQuiz);
            saveToLocalStorage(LOCAL_STORAGE_KEY_QUIZZES, quizzes);
            renderQuizzes();
            showSection('quiz');
        } else {
            alert("O quiz deve conter pelo menos uma pergunta válida.");
        }
    });

    cancelQuizCreationBtn.addEventListener('click', () => showSection('quiz'));

    quizListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('start-quiz-btn')) {
            const quizId = e.target.dataset.id;
            startQuiz(quizId);
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="quiz-option"]:checked');
        if (!selectedOption) {
            alert("Por favor, selecione uma resposta.");
            return;
        }
        userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    });

    finishQuizBtn.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="quiz-option"]:checked');
        if (selectedOption) {
            userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
        }
        renderQuizResult();
    });

    backToQuizListBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showSection('quiz');
            currentQuiz = null;
            currentQuestionIndex = 0;
            userAnswers = [];
            localStorage.removeItem(CURRENT_QUIZ_ID_STORAGE);
        });
    });

    retakeQuizBtn.addEventListener('click', () => {
        if (currentQuiz) {
            startQuiz(currentQuiz.id);
        }
    });

    editUserButton.addEventListener('click', () => {
        const newName = prompt("Digite seu novo nome:", userNameDisplay.textContent.replace('Olá, ', '').replace('!', ''));
        if (newName) {
            localStorage.setItem(LOCAL_STORAGE_KEY_USER, newName);
            getUserName(); // Re-render display
        }
    });

    darkModeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        applyDarkMode();
    });

    // --- Quiz Creation Helper ---
    function addQuestionToForm() {
        const questionCount = questionsContainer.querySelectorAll('.question-block').length;
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        questionBlock.innerHTML = `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: var(--border-radius);">
                <h4>Pergunta ${questionCount + 1}</h4>
                <label for="question-enunciado-${questionCount}">Enunciado:</label>
                <textarea class="question-enunciado" required></textarea>

                <label>Alternativas:</label>
                <div class="options-input-container">
                    ${Array.from({ length: 4 }).map((_, i) => `
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <input type="radio" name="correct-answer" value="${i}" id="correct-answer-${questionCount}-${i}" required>
                            <input type="text" class="question-option" placeholder="Alternativa ${i + 1}" required>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn btn-danger remove-question-btn" style="background-color: #dc3545; color: white;">Remover Pergunta</button>
            </div>
        `;
        questionsContainer.appendChild(questionBlock);

        // Add event listener for remove button
        questionBlock.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionBlock.remove();
            // Re-index question titles if needed, though not strictly necessary for functionality
        });
    }

    function startQuiz(quizId) {
        currentQuiz = quizzes.find(q => q.id === quizId);
        if (!currentQuiz) {
            alert("Quiz não encontrado!");
            return;
        }
        currentQuestionIndex = 0;
        userAnswers = [];
        saveToLocalStorage(CURRENT_QUIZ_ID_STORAGE, quizId);
        currentQuizTitleEl.textContent = currentQuiz.title;
        renderQuestion(currentQuestionIndex);
        showSection('quiz-execution');
    }

    // --- Initialization ---
    function initializeApp() {
        getUserName();
        materias = loadFromLocalStorage(LOCAL_STORAGE_KEY_MATERIAS);
        quizzes = loadFromLocalStorage(LOCAL_STORAGE_KEY_QUIZZES);
        const savedMateriaId = localStorage.getItem(CURRENT_MATEIRA_ID_STORAGE);
        const savedQuizId = localStorage.getItem(CURRENT_QUIZ_ID_STORAGE);

        applyDarkMode();

        if (savedMateriaId && materias.some(m => m.id === savedMateriaId)) {
            currentMateriaId = savedMateriaId;
            renderTopicos(currentMateriaId);
            showSection('materia-detail');
        } else {
            showSection('home');
        }

        renderMaterias();
        renderQuizzes();

        if (savedQuizId && quizzes.some(q => q.id === savedQuizId)) {
            // Do not auto-start quiz, let user click
        }
    }

    initializeApp();
});
