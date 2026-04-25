document.addEventListener('DOMContentLoaded', () => {

    // ===== VARIÁVEIS =====
    let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    let currentQuizData = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;

    const POINTS_PER_CORRECT_ANSWER = 10;

    const questionDisplay = document.getElementById('question-display');
    const alternativesDisplay = document.getElementById('alternatives-display');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const finishQuizBtn = document.getElementById('finish-quiz-btn');

    // ===== INICIAR QUIZ =====
    window.startQuiz = function (quizId) {
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        currentQuizData = quiz;
        currentQuestionIndex = 0;
        score = 0;
        correctAnswersCount = 0;
        incorrectAnswersCount = 0;

        renderQuestion();
    }

    // ===== MOSTRAR PERGUNTA =====
    function renderQuestion() {
        if (currentQuestionIndex >= currentQuizData.questions.length) {
            showResult();
            return;
        }

        const q = currentQuizData.questions[currentQuestionIndex];

        questionDisplay.textContent = q.question;
        alternativesDisplay.innerHTML = "";

        // junta texto + índice
        let alternatives = q.alternatives.map((text, index) => ({
            text,
            index
        }));

        // embaralha
        alternatives = shuffle(alternatives);

        alternatives.forEach(alt => {
            const label = document.createElement('label');
            const radio = document.createElement('input');

            radio.type = "radio";
            radio.name = "quiz";
            radio.value = alt.index; // 🔥 índice real

            label.appendChild(radio);
            label.appendChild(document.createTextNode(alt.text));

            alternativesDisplay.appendChild(label);
        });

        nextQuestionBtn.style.display = "none";
        finishQuizBtn.style.display = "none";

        document.querySelectorAll('input[name="quiz"]').forEach(r => {
            r.addEventListener('change', () => {
                if (currentQuestionIndex < currentQuizData.questions.length - 1) {
                    nextQuestionBtn.style.display = "block";
                } else {
                    finishQuizBtn.style.display = "block";
                }
            });
        });
    }

    // ===== PRÓXIMA PERGUNTA =====
    nextQuestionBtn.addEventListener('click', () => {
        const selected = document.querySelector('input[name="quiz"]:checked');
        if (!selected) return alert("Escolhe uma resposta");

        const answer = parseInt(selected.value);
        const correct = currentQuizData.questions[currentQuestionIndex].correctAnswerIndex;

        if (answer === correct) {
            score += POINTS_PER_CORRECT_ANSWER;
            correctAnswersCount++;
        } else {
            incorrectAnswersCount++;
        }

        currentQuestionIndex++;
        renderQuestion();
    });

    // ===== FINALIZAR =====
    finishQuizBtn.addEventListener('click', showResult);

    function showResult() {
        alert(`Resultado: ${correctAnswersCount} acertos de ${currentQuizData.questions.length}\nPontuação: ${score}`);
    }

    // ===== EMBARALHAR =====
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

});
