document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const darkModeToggle = document.createElement('button');
    darkModeToggle.classList.add('dark-mode-toggle');
    darkModeToggle.innerHTML = '🌙'; // Lua para modo escuro
    document.body.appendChild(darkModeToggle);

    // Carrega o estado do modo escuro do LocalStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '☀️'; // Sol para modo claro
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '☀️';
        } else {
            localStorage.removeItem('darkMode');
            darkModeToggle.innerHTML = '🌙';
        }
    });

    // --- Gerenciamento de Dados do LocalStorage ---
    const STORAGE_KEYS = {
        USER_NAME: 'userName',
        SUBJECTS: 'subjects',
        TOPICS: 'topics',
        QUIZZES: 'quizzes'
    };

    function getStoredData(key, defaultValue = []) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    function saveStoredData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Navegação SPA ---
    function navigateTo(view, data = null) {
        appContent.innerHTML = ''; // Limpa o conteúdo atual

        switch (view) {
            case 'home':
                renderHomePage();
                break;
            case 'materias':
                renderMateriasPage();
                break;
            case 'criar-materia':
                renderCriarMateriaPage();
                break;
            case 'detalhe-materia':
                renderDetalheMateriaPage(data.subjectId);
                break;
            case 'criar-topico':
                renderCriarTopicoPage(data.subjectId);
                break;
            case 'criar-quiz':
                renderCriarQuizPage(data.subjectId);
                break;
            case 'jogar-quiz':
                renderJogarQuizPage(data.subjectId, data.quizId);
                break;
            case 'resultados-quiz':
                renderResultadosQuizPage(data.subjectId, data.quizId, data.results);
                break;
            default:
                renderHomePage();
        }
    }

    document.querySelectorAll('nav button').forEach(button => {
        button.addEventListener('click', () => {
            const view = button.id.replace('nav-', '');
            navigateTo(view);
        });
    });

    // --- Renderização das Páginas ---

    // Home Page
    function renderHomePage() {
        appContent.innerHTML = `
            <div class="section" id="home-content">
                <h2>Bem-vindo ao Sexta-Feira Studies!</h2>
                <p>Organize seus estudos, crie conteúdos e teste seus conhecimentos com quizzes interativos.</p>
                <div class="cta-buttons">
                    <button class="cta-button" id="btn-ver-materias">Ver Matérias</button>
                    <button class="cta-button secondary" id="btn-criar-materia">Criar Matéria</button>
                    <button class="cta-button" id="btn-meus-estudos">Meus Estudos (em breve!)</button>
                </div>
            </div>
        `;

        document.getElementById('btn-ver-materias').addEventListener('click', () => navigateTo('materias'));
        document.getElementById('btn-criar-materia').addEventListener('click', () => navigateTo('criar-materia'));
        // O botão "Meus Estudos" é um placeholder por enquanto
    }

    // Matérias Page
    function renderMateriasPage() {
        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        let subjectsHtml = '';

        if (subjects.length === 0) {
            subjectsHtml = '<p>Nenhuma matéria criada ainda. Que tal criar uma?</p>';
        } else {
            subjectsHtml = subjects.map(subject => `
                <div class="subject-card" data-subject-id="${subject.id}">
                    <h3>${subject.name}</h3>
                    <p class="creator-info">Criado por: ${subject.creatorName || 'Anônimo'}</p>
                </div>
            `).join('');
        }

        appContent.innerHTML = `
            <div class="section">
                <h2>Suas Matérias</h2>
                <div class="subjects-grid">
                    ${subjectsHtml}
                </div>
            </div>
            <div class="section">
                <h2>Criar Nova Matéria</h2>
                <form id="create-subject-form">
                    <input type="text" id="subject-name" placeholder="Nome da Matéria" required>
                    <textarea id="subject-description" placeholder="Descrição (opcional)"></textarea>
                    <button type="submit" class="cta-button">Criar Matéria</button>
                </form>
            </div>
        `;

        // Evento para criar matéria
        document.getElementById('create-subject-form').addEventListener('submit', handleCreateSubject);

        // Evento para navegar para o detalhe da matéria
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo('detalhe-materia', { subjectId: card.dataset.subjectId });
            });
        });
    }

    // Detalhe da Matéria Page
    function renderDetalheMateriaPage(subjectId) {
        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        const topics = getStoredData(STORAGE_KEYS.TOPICS);
        const quizzes = getStoredData(STORAGE_KEYS.QUIZZES);

        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) {
            navigateTo('home'); // Redireciona se a matéria não for encontrada
            return;
        }

        const subjectTopics = topics.filter(t => t.subjectId === subjectId);
        const subjectQuizzes = quizzes.filter(q => q.subjectId === subjectId);

        const topicsHtml = subjectTopics.map(topic => `
            <div class="topic-card">
                <div class="topic-title">${topic.title}</div>
                <div class="topic-content" style="display: none;">
                    <p>${topic.content.replace(/\n/g, '<br>')}</p>
                    <p class="creator-info">Criado por: ${topic.creatorName || 'Anônimo'}</p>
                </div>
            </div>
        `).join('');

        const quizzesHtml = subjectQuizzes.map(quiz => `
            <div class="subject-card quiz-card-link" data-quiz-id="${quiz.id}">
                <h3>${quiz.title}</h3>
                <p class="creator-info">Perguntas: ${quiz.questions.length}</p>
            </div>
        `).join('');

        appContent.innerHTML = `
            <div class="section">
                <div class="subject-detail-header">
                    <h2>${subject.name}</h2>
                    <p class="creator-info">Criado por: ${subject.creatorName || 'Anônimo'}</p>
                </div>
                <p>${subject.description || ''}</p>

                <div style="margin-top: 2rem;">
                    <button class="cta-button" id="btn-criar-topico">Adicionar Tópico</button>
                    <button class="cta-button secondary" id="btn-criar-quiz">Criar Quiz</button>
                </div>
            </div>

            ${subjectTopics.length > 0 ? `
                <div class="section">
                    <h2>Tópicos</h2>
                    ${topicsHtml}
                </div>
            ` : ''}

            ${subjectQuizzes.length > 0 ? `
                <div class="section">
                    <h2>Quizzes</h2>
                    <div class="subjects-grid">
                        ${quizzesHtml}
                    </div>
                </div>
            ` : ''}
        `;

        // Adiciona evento para criar tópico
        document.getElementById('btn-criar-topico').addEventListener('click', () => navigateTo('criar-topico', { subjectId }));
        // Adiciona evento para criar quiz
        document.getElementById('btn-criar-quiz').addEventListener('click', () => navigateTo('criar-quiz', { subjectId }));

        // Adiciona evento para expandir/recolher tópicos
        document.querySelectorAll('.topic-title').forEach(title => {
            title.addEventListener('click', () => {
                const content = title.nextElementSibling;
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            });
        });

        // Adiciona evento para navegar para jogar quiz
        document.querySelectorAll('.quiz-card-link').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo('jogar-quiz', { subjectId, quizId: card.dataset.quizId });
            });
        });
    }

    // Criar Matéria Page
    function renderCriarMateriaPage() {
        appContent.innerHTML = `
            <div class="section">
                <h2>Criar Nova Matéria</h2>
                <form id="create-subject-form">
                    <input type="text" id="subject-name" placeholder="Nome da Matéria" required>
                    <textarea id="subject-description" placeholder="Descrição (opcional)"></textarea>
                    <button type="submit" class="cta-button">Criar Matéria</button>
                </form>
            </div>
        `;
        document.getElementById('create-subject-form').addEventListener('submit', handleCreateSubject);
    }

    // Criar Tópico Page
    function renderCriarTopicoPage(subjectId) {
        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        const subject = subjects.find(s => s.id === subjectId);

        appContent.innerHTML = `
            <div class="section">
                <h2>Adicionar Tópico para: ${subject ? subject.name : 'Matéria Desconhecida'}</h2>
                <form id="create-topic-form">
                    <input type="text" id="topic-title" placeholder="Título do Tópico" required>
                    <textarea id="topic-content" placeholder="Conteúdo do Tópico (texto simples)"></textarea>
                    <input type="hidden" id="topic-subject-id" value="${subjectId}">
                    <button type="submit" class="cta-button">Adicionar Tópico</button>
                </form>
            </div>
        `;
        document.getElementById('create-topic-form').addEventListener('submit', handleCreateTopic);
    }

    // Criar Quiz Page
    function renderCriarQuizPage(subjectId) {
        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        const subject = subjects.find(s => s.id === subjectId);

        appContent.innerHTML = `
            <div class="section">
                <h2>Criar Quiz para: ${subject ? subject.name : 'Matéria Desconhecida'}</h2>
                <form id="create-quiz-form">
                    <input type="text" id="quiz-title" placeholder="Título do Quiz" required>
                    <div id="questions-container">
                        <!-- Perguntas serão adicionadas aqui -->
                    </div>
                    <input type="hidden" id="quiz-subject-id" value="${subjectId}">
                    <button type="button" id="add-question-btn" class="cta-button secondary">Adicionar Pergunta</button>
                    <button type="submit" class="cta-button">Salvar Quiz</button>
                </form>
            </div>
        `;

        const questionsContainer = document.getElementById('questions-container');
        let questionCount = 0;

        function addQuestionField() {
            questionCount++;
            const questionHtml = `
                <div class="question-block" data-question-index="${questionCount}">
                    <h4>Pergunta ${questionCount}</h4>
                    <input type="text" name="question-text-${questionCount}" placeholder="Enunciado da pergunta" required>
                    <input type="text" name="option1-${questionCount}" placeholder="Opção 1" required>
                    <input type="text" name="option2-${questionCount}" placeholder="Opção 2" required>
                    <input type="text" name="option3-${questionCount}" placeholder="Opção 3" required>
                    <input type="text" name="option4-${questionCount}" placeholder="Opção 4" required>
                    <input type="text" name="correct-option-${questionCount}" placeholder="Número da resposta correta (1-4)" required>
                    <button type="button" class="remove-question-btn" style="background-color: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: var(--border-radius); cursor: pointer; margin-top: 0.5rem;">Remover Pergunta</button>
                </div>
            `;
            questionsContainer.insertAdjacentHTML('beforeend', questionHtml);

            // Adiciona listener para o botão de remover
            document.querySelector(`.remove-question-btn[style*="margin-top"]`).addEventListener('click', (e) => {
                e.target.closest('.question-block').remove();
                // Reindexar perguntas se necessário, mas para este exemplo simples, não é crucial
            });
        }

        document.getElementById('add-question-btn').addEventListener('click', addQuestionField);
        document.getElementById('create-quiz-form').addEventListener('submit', handleCreateQuiz);

        // Adiciona uma pergunta inicial
        addQuestionField();
    }

    // Jogar Quiz Page
    function renderJogarQuizPage(subjectId, quizId) {
        const quizzes = getStoredData(STORAGE_KEYS.QUIZZES);
        const quiz = quizzes.find(q => q.id === quizId);

        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            appContent.innerHTML = `<div class="section"><p>Este quiz não possui perguntas ou não foi encontrado.</p></div>`;
            return;
        }

        const quizContainer = document.createElement('div');
        quizContainer.classList.add('quiz-container');
        quizContainer.innerHTML = `<h2>${quiz.title}</h2><div id="quiz-questions"></div><div id="quiz-navigation"></div>`;
        appContent.appendChild(quizContainer);

        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = []; // Armazena as respostas do usuário

        function renderQuestion() {
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('question-block');
            const currentQuestion = quiz.questions[currentQuestionIndex];

            const optionsHtml = currentQuestion.options.map((option, index) => `
                <li data-option-index="${index}">${option}</li>
            `).join('');

            questionBlock.innerHTML = `
                <p class="question-text">${currentQuestion.enunciado}</p>
                <ul class="options-list">${optionsHtml}</ul>
            `;

            const questionsContainer = document.getElementById('quiz-questions');
            questionsContainer.innerHTML = ''; // Limpa a pergunta anterior
            questionsContainer.appendChild(questionBlock);

            const navigationDiv = document.getElementById('quiz-navigation');
            navigationDiv.innerHTML = '';
            if (currentQuestionIndex < quiz.questions.length - 1) {
                navigationDiv.innerHTML = '<button id="next-question-btn">Próxima</button>';
            } else {
                navigationDiv.innerHTML = '<button id="finish-quiz-btn">Finalizar Quiz</button>';
            }

            addOptionListeners();
            addNavigationListeners();
        }

        function addOptionListeners() {
            document.querySelectorAll('.options-list li').forEach(optionLi => {
                optionLi.addEventListener('click', () => {
                    // Desabilita a seleção após escolher uma resposta
                    document.querySelectorAll('.options-list li').forEach(li => li.removeEventListener('click', () => {}));
                    optionLi.classList.add('selected');
                    userAnswers[currentQuestionIndex] = parseInt(optionLi.dataset.optionIndex);
                });
            });
        }

        function addNavigationListeners() {
            const nextBtn = document.getElementById('next-question-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentQuestionIndex++;
                    renderQuestion();
                });
            }

            const finishBtn = document.getElementById('finish-quiz-btn');
            if (finishBtn) {
                finishBtn.addEventListener('click', () => {
                    calculateScore();
                    navigateTo('resultados-quiz', { subjectId, quizId, results: { score, total: quiz.questions.length, userAnswers, quizQuestions: quiz.questions } });
                });
            }
        }

        function calculateScore() {
            score = 0;
            for (let i = 0; i < quiz.questions.length; i++) {
                if (userAnswers[i] === quiz.questions[i].correctOptionIndex) {
                    score++;
                }
            }
        }

        renderQuestion();
    }

    // Resultados Quiz Page
    function renderResultadosQuizPage(subjectId, quizId, results) {
        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        const subject = subjects.find(s => s.id === subjectId);
        const quizzes = getStoredData(STORAGE_KEYS.QUIZZES);
        const quiz = quizzes.find(q => q.id === quizId);

        const { score, total, userAnswers, quizQuestions } = results;

        let summaryHtml = '<ul>';
        quizQuestions.forEach((question, index) => {
            const isCorrect = userAnswers[index] === question.correctOptionIndex;
            const liClass = isCorrect ? 'correct' : 'incorrect';
            const status = isCorrect ? 'Correto' : 'Incorreto';
            const correctAnswerText = question.options[question.correctOptionIndex];

            summaryHtml += `
                <li class="${liClass}">
                    <strong>Pergunta ${index + 1}:</strong> ${question.enunciado}<br>
                    <em>Sua resposta: ${question.options[userAnswers[index]] || 'Não respondida'}</em><br>
                    <strong>${status}</strong> (Resposta correta: ${correctAnswerText})
                </li>
            `;
        });
        summaryHtml += '</ul>';

        appContent.innerHTML = `
            <div class="section quiz-results">
                <h3>Resultados do Quiz</h3>
                <h4>${quiz ? quiz.title : 'Quiz'}</h4>
                <p class="score-display">${score}/${total} acertos</p>
                <div class="results-summary">
                    ${summaryHtml}
                </div>
                <button class="cta-button restart-quiz-button">Refazer Quiz</button>
                <button class="cta-button secondary" id="back-to-subject-btn">Voltar para Matéria</button>
            </div>
        `;

        document.querySelector('.restart-quiz-button').addEventListener('click', () => {
            navigateTo('jogar-quiz', { subjectId, quizId });
        });

        document.getElementById('back-to-subject-btn').addEventListener('click', () => {
            navigateTo('detalhe-materia', { subjectId });
        });
    }

    // --- Manipuladores de Eventos de Formulário ---

    function handleCreateSubject(event) {
        event.preventDefault();
        const userName = prompt("Qual o seu nome? (Será exibido como autor)");
        if (userName === null) return; // Usuário cancelou

        const nameInput = document.getElementById('subject-name');
        const descriptionInput = document.getElementById('subject-description');

        const newSubject = {
            id: Date.now().toString(), // ID simples baseado em timestamp
            name: nameInput.value,
            description: descriptionInput.value,
            creatorName: userName || 'Anônimo'
        };

        const subjects = getStoredData(STORAGE_KEYS.SUBJECTS);
        subjects.push(newSubject);
        saveStoredData(STORAGE_KEYS.SUBJECTS, subjects);

        nameInput.value = '';
        descriptionInput.value = '';
        navigateTo('materias'); // Volta para a lista de matérias
    }

    function handleCreateTopic(event) {
        event.preventDefault();
        const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        // Pede o nome se não estiver salvo ou se o usuário quiser atualizar
        const finalUserName = userName ? userName : prompt("Qual o seu nome? (Será exibido como autor)");
        if (finalUserName === null) return; // Usuário cancelou
        if (userName !== finalUserName) {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, finalUserName);
        }

        const titleInput = document.getElementById('topic-title');
        const contentInput = document.getElementById('topic-content');
        const subjectIdInput = document.getElementById('topic-subject-id');

        const newTopic = {
            id: Date.now().toString(),
            subjectId: subjectIdInput.value,
            title: titleInput.value,
            content: contentInput.value,
            creatorName: finalUserName || 'Anônimo'
        };

        const topics = getStoredData(STORAGE_KEYS.TOPICS);
        topics.push(newTopic);
        saveStoredData(STORAGE_KEYS.TOPICS, topics);

        titleInput.value = '';
        contentInput.value = '';
        navigateTo('detalhe-materia', { subjectId: subjectIdInput.value });
    }

    function handleCreateQuiz(event) {
        event.preventDefault();
        const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        const finalUserName = userName ? userName : prompt("Qual o seu nome? (Será exibido como autor)");
        if (finalUserName === null) return;
        if (userName !== finalUserName) {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, finalUserName);
        }

        const quizTitleInput = document.getElementById('quiz-title');
        const subjectIdInput = document.getElementById('quiz-subject-id');
        const questionsContainer = document.getElementById('questions-container');
        const questionBlocks = questionsContainer.querySelectorAll('.question-block');

        const questions = [];
        let isValid = true;

        questionBlocks.forEach((block, index) => {
            const questionText = block.querySelector(`input[name="question-text-${index + 1}"]`).value;
            const option1 = block.querySelector(`input[name="option1-${index + 1}"]`).value;
            const option2 = block.querySelector(`input[name="option2-${index + 1}"]`).value;
            const option3 = block.querySelector(`input[name="option3-${index + 1}"]`).value;
            const option4 = block.querySelector(`input[name="option4-${index + 1}"]`).value;
            const correctOptionIndexInput = block.querySelector(`input[name="correct-option-${index + 1}"]`).value;

            const correctOptionIndex = parseInt(correctOptionIndexInput) - 1;

            if (!questionText || !option1 || !option2 || !option3 || !option4 || isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
                isValid = false;
                block.style.border = '2px solid red'; // Destaca blocos inválidos
                alert(`Por favor, preencha todos os campos da pergunta ${index + 1} corretamente e certifique-se de que a resposta correta seja um número entre 1 e 4.`);
            } else {
                block.style.border = 'none'; // Remove destaque se válido
                questions.push({
                    enunciado: questionText,
                    options: [option1, option2, option3, option4],
                    correctOptionIndex: correctOptionIndex
                });
            }
        });

        if (!isValid) return;

        const newQuiz = {
            id: Date.now().toString(),
            subjectId: subjectIdInput.value,
            title: quizTitleInput.value,
            questions: questions,
            creatorName: finalUserName || 'Anônimo'
        };

        const quizzes = getStoredData(STORAGE_KEYS.QUIZZES);
        quizzes.push(newQuiz);
        saveStoredData(STORAGE_KEYS.QUIZZES, quizzes);

        quizTitleInput.value = '';
        questionsContainer.innerHTML = ''; // Limpa os campos de pergunta
        navigateTo('detalhe-materia', { subjectId: subjectIdInput.value });
    }

    // --- Inicialização ---
    // Verifica se o nome do usuário já está salvo
    let initialUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (!initialUserName) {
        const namePrompt = prompt("Olá! Para começar, por favor, digite seu nome. Ele será usado para identificar seus conteúdos.");
        if (namePrompt) {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, namePrompt);
            initialUserName = namePrompt;
        } else {
            // Se o usuário cancelar, usa um nome padrão
            localStorage.setItem(STORAGE_KEYS.USER_NAME, 'Anônimo');
            initialUserName = 'Anônimo';
        }
    }

    navigateTo('home'); // Carrega a página inicial ao iniciar
});
