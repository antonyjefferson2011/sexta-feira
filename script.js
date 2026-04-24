document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const toggleThemeButton = document.getElementById('toggleTheme');
    const theme = localStorage.getItem('theme');

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    toggleThemeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.removeItem('theme');
        }
    });

    // --- Data Storage ---
    const STORAGE_KEY_MATERIAS = 'sextaEstudosMaterias';
    const STORAGE_KEY_QUIZ = 'sextaEstudosQuiz';

    function getMaterias() {
        const materias = localStorage.getItem(STORAGE_KEY_MATERIAS);
        return materias ? JSON.parse(materias) : [];
    }

    function saveMaterias(materias) {
        localStorage.setItem(STORAGE_KEY_MATERIAS, JSON.stringify(materias));
    }

    function getQuizData() {
        const quiz = localStorage.getItem(STORAGE_KEY_QUIZ);
        return quiz ? JSON.parse(quiz) : [];
    }

    function saveQuizData(quizData) {
        localStorage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(quizData));
    }

    // --- Routing ---
    const routes = {
        '#home': renderHomePage,
        '#materias': renderMateriasPage,
        '#materia-detail': renderMateriaDetailPage,
        '#quiz': renderQuizPage
    };

    let currentRoute = window.location.hash || '#home';
    let currentMateriaId = null;
    let currentQuizId = null;

    function navigateTo(path, materiaId = null, quizId = null) {
        currentRoute = path;
        currentMateriaId = materiaId;
        currentQuizId = quizId;
        window.location.hash = path;
        renderPage();
    }

    function renderPage() {
        const handler = routes[currentRoute];
        if (handler) {
            app.innerHTML = ''; // Clear previous content
            handler();
        } else {
            navigateTo('#home'); // Fallback to home if route not found
        }
    }

    window.addEventListener('hashchange', () => {
        currentRoute = window.location.hash;
        // Reset IDs when hash changes, unless it's a detail route
        if (!currentRoute.startsWith('#materia-detail') && !currentRoute.startsWith('#quiz')) {
            currentMateriaId = null;
            currentQuizId = null;
        }
        renderPage();
    });

    // --- Page Render Functions ---

    function renderHomePage() {
        app.innerHTML = `
            <section id="home-page" class="page active">
                <div class="welcome-message">
                    <h2>Bem-vindo ao Sexta-Feira Studies!</h2>
                    <p>Seu universo de aprendizado e conhecimento. Explore matérias, crie seus tópicos e teste seus conhecimentos com nossos quizzes.</p>
                    <button onclick="navigateTo('#materias')" style="margin-top: 20px;">Ver Matérias</button>
                </div>
            </section>
        `;
        addNavButtonStyles();
    }

    function renderMateriasPage() {
        const materias = getMaterias();
        const html = `
            <section id="materias-page" class="page active">
                <h1>Matérias</h1>
                <div class="form-section">
                    <h3>Criar Nova Matéria</h3>
                    <input type="text" id="new-materia-name" placeholder="Nome da Matéria">
                    <input type="text" id="new-materia-author" placeholder="Nome do Autor">
                    <button onclick="addMateria()">Adicionar Matéria</button>
                </div>
                <h2>Listagem de Matérias</h2>
                <div class="materias-list">
                    ${materias.length > 0 ? materias.map(materia => `
                        <div class="card" onclick="navigateTo('#materia-detail', '${materia.id}')">
                            <h3>${materia.name}</h3>
                            <p class="card-author">Criado por: ${materia.author}</p>
                        </div>
                    `).join('') : '<p>Nenhuma matéria criada ainda. Crie uma!</p>'}
                </div>
            </section>
        `;
        app.innerHTML = html;
        addNavButtonStyles();
    }

    function renderMateriaDetailPage() {
        const materias = getMaterias();
        const materia = materias.find(m => m.id === currentMateriaId);

        if (!materia) {
            navigateTo('#materias');
            return;
        }

        const html = `
            <section id="materia-detail-page" class="page active">
                <div class="materia-detail">
                    <h2>${materia.name}</h2>
                    <p class="creator-info">Criado por: ${materia.author}</p>

                    <div class="form-section">
                        <h3>Adicionar Tópico</h3>
                        <input type="text" id="new-topic-title" placeholder="Título do Tópico">
                        <button onclick="addTopic('${materia.id}')">Adicionar Tópico</button>
                    </div>

                    <div class="topics-list">
                        <h3>Tópicos</h3>
                        ${materia.topics && materia.topics.length > 0 ? materia.topics.map(topic => `
                            <div class="topic-item">
                                <p>${topic.title}</p>
                            </div>
                        `).join('') : '<p>Nenhum tópico adicionado ainda.</p>'}
                    </div>

                    <div class="form-section">
                        <h3>Criar Quiz para esta Matéria</h3>
                        <input type="text" id="new-quiz-question" placeholder="Pergunta do Quiz">
                        <input type="text" class="quiz-option" placeholder="Alternativa 1">
                        <input type="text" class="quiz-option" placeholder="Alternativa 2">
                        <input type="text" class="quiz-option" placeholder="Alternativa 3">
                        <input type="text" class="quiz-option" placeholder="Alternativa 4">
                        <input type="number" id="correct-answer-index" placeholder="Índice da resposta correta (1-4)">
                        <button onclick="addQuiz('${materia.id}')">Criar Quiz</button>
                    </div>

                    <div class="navigation-buttons">
                        <button onclick="navigateTo('#materias')">Voltar para Matérias</button>
                        <button onclick="navigateTo('#quiz', null, '${materia.id}')">Ir para Quiz</button>
                    </div>
                </div>
            </section>
        `;
        app.innerHTML = html;
        addNavButtonStyles();
    }

    function renderQuizPage() {
        const quizData = getQuizData();
        const quiz = quizData.find(q => q.materiaId === currentMateriaId);

        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            let materiaName = 'a Matéria';
            if (currentMateriaId) {
                const materias = getMaterias();
                const materia = materias.find(m => m.id === currentMateriaId);
                if (materia) materiaName = `a Matéria "${materia.name}"`;
            }
            app.innerHTML = `
                <section id="quiz-page" class="page active">
                    <div class="quiz-container">
                        <h1>Quiz</h1>
                        <p>Nenhum quiz disponível para ${materiaName} ainda. Crie um na página de detalhes da matéria!</p>
                        <div class="navigation-buttons">
                            <button onclick="navigateTo('#materias')">Voltar para Matérias</button>
                        </div>
                    </div>
                </section>
            `;
            addNavButtonStyles();
            return;
        }

        const html = `
            <section id="quiz-page" class="page active">
                <div class="quiz-container">
                    <h1>Quiz: ${quiz.materiaName || 'Quiz'}</h1>
                    <div id="quiz-content">
                        <!-- Quiz questions will be loaded here -->
                        <div class="question-area">
                            <p id="question-text"></p>
                            <div class="options-area" id="options-area">
                                <!-- Options will be loaded here -->
                            </div>
                        </div>
                        <div class="quiz-feedback" id="quiz-feedback"></div>
                        <div class="navigation-buttons">
                            <button id="next-question-btn" style="display: none;">Próxima Pergunta</button>
                            <button id="submit-quiz-btn" style="display: none;">Finalizar Quiz</button>
                            <button onclick="navigateTo('#materias')">Voltar para Matérias</button>
                        </div>
                        <div id="score-display" class="score-display" style="display: none;"></div>
                    </div>
                </div>
            </section>
        `;
        app.innerHTML = html;
        addNavButtonStyles();
        startQuiz(quiz);
    }

    // --- Quiz Logic ---
    let currentQuestionIndex = 0;
    let score = 0;
    let currentQuizData = null;

    function startQuiz(quiz) {
        currentQuizData = quiz;
        currentQuestionIndex = 0;
        score = 0;
        displayQuestion();
    }

    function displayQuestion() {
        const questionData = currentQuizData.questions[currentQuestionIndex];
        document.getElementById('question-text').textContent = questionData.question;

        const optionsArea = document.getElementById('options-area');
        optionsArea.innerHTML = '';
        questionData.options.forEach((option, index) => {
            const div = document.createElement('div');
            div.textContent = option;
            div.dataset.index = index;
            div.onclick = () => selectOption(index, div);
            optionsArea.appendChild(div);
        });

        document.getElementById('quiz-feedback').textContent = '';
        document.getElementById('quiz-feedback').className = 'quiz-feedback';
        document.getElementById('next-question-btn').style.display = 'none';
        document.getElementById('submit-quiz-btn').style.display = 'none';
        document.getElementById('score-display').style.display = 'none';
        document.getElementById('options-area').style.pointerEvents = 'auto'; // Enable clicking options
    }

    function selectOption(selectedIndex, selectedDiv) {
        const options = document.querySelectorAll('#options-area div');
        options.forEach(option => option.classList.remove('selected'));
        selectedDiv.classList.add('selected');

        // Disable further clicks on options for this question
        document.getElementById('options-area').style.pointerEvents = 'none';

        // Check answer
        const correctAnswerIndex = currentQuizData.questions[currentQuestionIndex].correctAnswerIndex;
        if (selectedIndex === correctAnswerIndex) {
            score++;
            document.getElementById('quiz-feedback').textContent = 'Correto!';
            document.getElementById('quiz-feedback').classList.add('correct');
        } else {
            document.getElementById('quiz-feedback').textContent = `Incorreto! A resposta correta era: ${currentQuizData.questions[currentQuestionIndex].options[correctAnswerIndex]}`;
            document.getElementById('quiz-feedback').classList.add('incorrect');
            // Highlight correct answer
            options[correctAnswerIndex].style.backgroundColor = 'lightgreen';
            options[correctAnswerIndex].style.borderColor = 'green';
        }

        // Show next/submit button
        if (currentQuestionIndex < currentQuizData.questions.length - 1) {
            document.getElementById('next-question-btn').style.display = 'inline-block';
            document.getElementById('next-question-btn').onclick = () => {
                currentQuestionIndex++;
                displayQuestion();
            };
        } else {
            document.getElementById('submit-quiz-btn').style.display = 'inline-block';
            document.getElementById('submit-quiz-btn').onclick = () => {
                showFinalScore();
            };
        }
    }

    function showFinalScore() {
        document.getElementById('question-text').style.display = 'none';
        document.getElementById('options-area').style.display = 'none';
        document.getElementById('quiz-feedback').style.display = 'none';
        document.getElementById('next-question-btn').style.display = 'none';
        document.getElementById('submit-quiz-btn').style.display = 'none';

        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.textContent = `Sua pontuação final: ${score} de ${currentQuizData.questions.length}`;
        scoreDisplay.style.display = 'block';

        // Optionally add a button to restart or go back
        const backButton = document.createElement('button');
        backButton.textContent = 'Refazer Quiz';
        backButton.onclick = () => {
            startQuiz(currentQuizData); // Restart quiz
        };
        document.querySelector('.navigation-buttons').appendChild(backButton);
    }


    // --- CRUD Operations ---

    function addMateria() {
        const nameInput = document.getElementById('new-materia-name');
        const authorInput = document.getElementById('new-materia-author');

        const name = nameInput.value.trim();
        const author = authorInput.value.trim();

        if (!name || !author) {
            alert('Por favor, preencha o nome da matéria e o autor.');
            return;
        }

        const materias = getMaterias();
        const newMateria = {
            id: Date.now().toString(), // Simple unique ID
            name: name,
            author: author,
            topics: [],
            quizId: null // To link to a quiz later if needed
        };
        materias.push(newMateria);
        saveMaterias(materias);
        nameInput.value = '';
        authorInput.value = '';
        navigateTo('#materias'); // Refresh the page
    }

    function addTopic(materiaId) {
        const titleInput = document.getElementById('new-topic-title');
        const title = titleInput.value.trim();

        if (!title) {
            alert('Por favor, insira um título para o tópico.');
            return;
        }

        const materias = getMaterias();
        const materiaIndex = materias.findIndex(m => m.id === materiaId);

        if (materiaIndex === -1) {
            alert('Matéria não encontrada!');
            return;
        }

        materias[materiaIndex].topics.push({ title: title });
        saveMaterias(materias);
        titleInput.value = '';
        navigateTo(currentRoute, currentMateriaId); // Refresh detail page
    }

    function addQuiz(materiaId) {
        const questionInput = document.getElementById('new-quiz-question');
        const correctAnswerIndexInput = document.getElementById('correct-answer-index');
        const optionsInputs = document.querySelectorAll('.quiz-option');

        const question = questionInput.value.trim();
        const correctAnswerIndex = parseInt(correctAnswerIndexInput.value) - 1; // 0-indexed

        const options = Array.from(optionsInputs).map(input => input.value.trim());

        if (!question || options.some(opt => opt === '') || isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
            alert('Por favor, preencha todos os campos do quiz e selecione uma resposta correta válida (1-4).');
            return;
        }

        const materias = getMaterias();
        const materiaIndex = materias.findIndex(m => m.id === materiaId);
        const materiaName = materias[materiaIndex]?.name || 'Quiz';

        if (materiaIndex === -1) {
            alert('Matéria não encontrada!');
            return;
        }

        const quizData = getQuizData();
        const existingQuizIndex = quizData.findIndex(q => q.materiaId === materiaId);

        const newQuizQuestion = {
            question: question,
            options: options,
            correctAnswerIndex: correctAnswerIndex
        };

        if (existingQuizIndex !== -1) {
            // Update existing quiz
            quizData[existingQuizIndex].questions.push(newQuizQuestion);
        } else {
            // Create new quiz
            quizData.push({
                id: Date.now().toString(),
                materiaId: materiaId,
                materiaName: materiaName,
                questions: [newQuizQuestion]
            });
        }

        saveQuizData(quizData);

        questionInput.value = '';
        correctAnswerIndexInput.value = '';
        optionsInputs.forEach(input => input.value = '');
        alert('Quiz criado/atualizado com sucesso!');
        navigateTo(currentRoute, currentMateriaId); // Refresh detail page
    }

    // --- Helper Functions ---
    function addNavButtonStyles() {
        // Add styles to navigation links to indicate active page
        document.querySelectorAll('nav a').forEach(link => {
            if (link.getAttribute('href') === currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Initial render
    renderPage();

    // Expose navigateTo globally for inline onclick calls
    window.navigateTo = navigateTo;
    window.addMateria = addMateria;
    window.addTopic = addTopic;
    window.addQuiz = addQuiz;
});
