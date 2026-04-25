// script.js
/* global firebaseConfig */

(() => {
  // Firebase init (compat)
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const auth = firebaseApp.auth();
  const db = firebaseApp.firestore();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // DOM
  const authScreen = document.getElementById('authScreen');
  const appScreen = document.getElementById('appScreen');

  const globalToast = document.getElementById('globalToast');

  const authTabs = Array.from(document.querySelectorAll('.tabBtn'));
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');

  const logoutBtn = document.getElementById('logoutBtn');

  const userSubtitle = document.getElementById('userSubtitle');
  const homeName = document.getElementById('homeName');
  const homeClass = document.getElementById('homeClass');
  const homePoints = document.getElementById('homePoints');

  const subjectsList = document.getElementById('subjectsList');
  const subjectsLoading = document.getElementById('subjectsLoading');
  const subjectsEmpty = document.getElementById('subjectsEmpty');
  const createSubjectForm = document.getElementById('createSubjectForm');
  const subjectTitle = document.getElementById('subjectTitle');
  const subjectDesc = document.getElementById('subjectDesc');
  const subjectCreateHint = document.getElementById('subjectCreateHint');

  const viewHome = document.getElementById('view-home');
  const viewSubjects = document.getElementById('view-subjects');
  const viewRanking = document.getElementById('view-ranking');
  const viewHistory = document.getElementById('view-history');

  const navItems = Array.from(document.querySelectorAll('.navItem'));

  const subjectDetailWrap = document.getElementById('subjectDetailWrap');
  const backToSubjectsBtn = document.getElementById('backToSubjectsBtn');
  const subjectDetailTitle = document.getElementById('subjectDetailTitle');
  const subjectDetailDesc = document.getElementById('subjectDetailDesc');

  const createQuizForm = document.getElementById('createQuizForm');
  const quizTitle = document.getElementById('quizTitle');
  const questionsEditor = document.getElementById('questionsEditor');
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  const quizCreateHint = document.getElementById('quizCreateHint');

  const quizSelect = document.getElementById('quizSelect');
  const startQuizBtn = document.getElementById('startQuizBtn');

  const quizRunner = document.getElementById('quizRunner');
  const quizProgressText = document.getElementById('quizProgressText');
  const quizScoreText = document.getElementById('quizScoreText');
  const quizProgressBar = document.getElementById('quizProgressBar');
  const quizQuestionEnunciado = document.getElementById('quizQuestionEnunciado');
  const quizAnswersGrid = document.getElementById('quizAnswersGrid');
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');
  const quizResult = document.getElementById('quizResult');
  const quizResultPoints = document.getElementById('quizResultPoints');

  const rankingLoading = document.getElementById('rankingLoading');
  const rankingEmpty = document.getElementById('rankingEmpty');
  const rankingList = document.getElementById('rankingList');

  const historyLoading = document.getElementById('historyLoading');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyList = document.getElementById('historyList');

  // App State
  let currentUser = null; // {uid,name,class,email,points}
  let activeSubjectId = null;

  let quizState = {
    quizzes: [],
    currentQuiz: null,
    questionIndex: 0,
    score: 0,
    locked: false,
    finished: false
  };

  function toast(msg, tone = 'default') {
    globalToast.textContent = msg;
    globalToast.classList.remove('hidden');
    globalToast.classList.add('visible');

    if (tone === 'error') {
      globalToast.style.borderColor = 'rgba(239,68,68,.35)';
      globalToast.style.background = 'rgba(239,68,68,.12)';
    } else {
      globalToast.style.borderColor = 'rgba(255,255,255,.12)';
      globalToast.style.background = 'rgba(10,16,30,.88)';
    }

    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      globalToast.classList.remove('visible');
      globalToast.classList.add('hidden');
    }, 2800);
  }

  function formatDate(ts) {
    try {
      if (!ts) return '—';
      const d = ts instanceof firebase.firestore.Timestamp ? ts.toDate() : new Date(ts);
      return d.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '—';
    }
  }

  function setView(viewName) {
    const views = [
      { el: viewHome, name: 'home' },
      { el: viewSubjects, name: 'subjects' },
      { el: viewRanking, name: 'ranking' },
      { el: viewHistory, name: 'history' }
    ];

    for (const v of views) v.el.classList.add('hidden');
    const current = views.find(v => v.name === viewName);
    if (current) current.el.classList.remove('hidden');

    for (const item of navItems) {
      item.classList.toggle('active', item.dataset.view === viewName);
    }

    // Scroll to top on small screens
    // Keep subtle; no reload
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getUserDoc(uid) {
    return db.collection('users').doc(uid);
  }

  async function ensureUserDoc(user) {
    const userDoc = getUserDoc(user.uid);
    const snap = await userDoc.get();
    if (!snap.exists) {
      const name = user.displayName || user.email?.split('@')[0] || 'Aluno';
      const email = user.email || '';
      // For email/password sign-up we collect class; for Google we default and allow editing later (not specified).
      // Requirement says "salvar usuário no Firestore se for novo" and includes "sala".
      // We'll store class as "—" if not provided.
      const defaultClass = '—';

      await userDoc.set({
        name,
        email,
        class: defaultClass,
        points: 0
      });

      return { uid: user.uid, name, class: defaultClass, email, points: 0 };
    } else {
      const data = snap.data() || {};
      return {
        uid: user.uid,
        name: data.name || 'Aluno',
        class: data.class || '—',
        email: data.email || user.email || '',
        points: typeof data.points === 'number' ? data.points : 0
      };
    }
  }

  async function updateUserPoints(uid, deltaPoints) {
    const ref = getUserDoc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists ? (snap.data().points ?? 0) : 0;
      const next = Number(current) + Number(deltaPoints);
      tx.set(ref, { points: next }, { merge: true });
    });
  }

  async function getAllUsersOrderedByPoints() {
    const snap = await db.collection('users').get();
    const arr = [];
    snap.forEach(d => {
      const data = d.data() || {};
      arr.push({
        uid: d.id,
        name: data.name || 'Aluno',
        class: data.class || '—',
        points: typeof data.points === 'number' ? data.points : 0
      });
    });
    arr.sort((a, b) => (b.points - a.points));
    return arr;
  }

  async function getHistory(uid) {
    const itemsSnap = await db.collection('history').doc(uid).collection('items')
      .orderBy('createdAt', 'desc')
      .get();
    const arr = [];
    itemsSnap.forEach(d => {
      const data = d.data() || {};
      arr.push({
        id: d.id,
        title: data.title || '',
        points: typeof data.points === 'number' ? data.points : 0,
        createdAt: data.createdAt || null,
        quizScore: typeof data.quizScore === 'number' ? data.quizScore : null
      });
    });
    return arr;
  }

  function createQuestionBlock(index) {
    const block = document.createElement('div');
    block.className = 'qBlock';
    block.dataset.index = String(index);

    block.innerHTML = `
      <div class="qTop">
        <div class="qTitle">Pergunta ${index + 1}</div>
        <button class="dangerBtn" type="button" data-remove="true">Remover</button>
      </div>

      <div class="field">
        <label>Enunciado</label>
        <input type="text" class="q-enunciado" placeholder="Digite o enunciado" required minlength="3" maxlength="240" />
      </div>

      <div class="answers4Grid">
        <div>
          <div class="altLabel"><span class="dot"></span> Alternativa A</div>
          <input type="text" class="q-alt a" placeholder="Texto da alternativa" required minlength="1" maxlength="160" />
        </div>

        <div>
          <div class="altLabel"><span class="dot"></span> Alternativa B</div>
          <input type="text" class="q-alt b" placeholder="Texto da alternativa" required minlength="1" maxlength="160" />
        </div>

        <div>
          <div class="altLabel"><span class="dot"></span> Alternativa C</div>
          <input type="text" class="q-alt c" placeholder="Texto da alternativa" required minlength="1" maxlength="160" />
        </div>

        <div>
          <div class="altLabel"><span class="dot"></span> Alternativa D</div>
          <input type="text" class="q-alt d" placeholder="Texto da alternativa" required minlength="1" maxlength="160" />
        </div>
      </div>

      <div class="field" style="margin-top:10px;">
        <label>Resposta correta (A, B, C ou D)</label>
        <select class="q-correct" required>
          <option value="" selected>Selecione...</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
    `;

    const removeBtn = block.querySelector('[data-remove="true"]');
    removeBtn.addEventListener('click', () => {
      block.remove();
      renumberQuestionsEditor();
    });

    return block;
  }

  function renumberQuestionsEditor() {
    const blocks = Array.from(questionsEditor.querySelectorAll('.qBlock'));
    blocks.forEach((b, i) => {
      b.dataset.index = String(i);
      const title = b.querySelector('.qTitle');
      if (title) title.textContent = `Pergunta ${i + 1}`;
    });
  }

  function resetQuizRunnerUI() {
    quizState.locked = false;
    quizState.finished = false;
    quizState.questionIndex = 0;
    quizState.score = 0;

    quizProgressText.textContent = 'Pergunta 0/0';
    quizScoreText.textContent = 'Pontuação: 0';
    quizProgressBar.style.width = '0%';

    quizQuestionEnunciado.textContent = '';
    quizAnswersGrid.innerHTML = '';

    nextQuestionBtn.disabled = true;
    nextQuestionBtn.textContent = 'Próximo';

    quizResult.classList.add('hidden');
    quizRunner.classList.remove('hidden');
  }

  function setAnswerButtonsEnabled(enabled) {
    const btns = Array.from(quizAnswersGrid.querySelectorAll('.answerBtn'));
    for (const b of btns) b.disabled = !enabled;
  }

  function renderQuestion() {
    const quiz = quizState.currentQuiz;
    const questions = quiz.questions || [];

    const q = questions[quizState.questionIndex];
    if (!q) return;

    quizQuestionEnunciado.textContent = q.enunciado || '';
    quizAnswersGrid.innerHTML = '';
    quizState.locked = false;
    nextQuestionBtn.disabled = true;

    const options = [
      { key: 'A', text: q.alternativaA },
      { key: 'B', text: q.alternativaB },
      { key: 'C', text: q.alternativaC },
      { key: 'D', text: q.alternativaD }
    ];

    // Shuffle slightly? Requirement doesn't ask; keep stable ordering A-D.
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answerBtn';
      btn.textContent = `${opt.key}) ${opt.text || ''}`;
      btn.setAttribute('aria-disabled', 'false');

      btn.addEventListener('click', () => {
        if (quizState.locked) return;
        quizState.locked = true;

        const correctKey = (q.respostaCorreta || '').toUpperCase();
        const chosenKey = opt.key;

        // Disable all
        setAnswerButtonsEnabled(false);

        const btns = Array.from(quizAnswersGrid.querySelectorAll('.answerBtn'));
        const correctTextPrefix = `${correctKey})`;

        // Mark styles
        for (const b of btns) {
          b.classList.remove('correct', 'wrong');
        }

        // Determine correctness
        const isCorrect = chosenKey === correctKey;
        if (isCorrect) quizState.score += 10;

        // Apply classes
        const answerButtons = Array.from(quizAnswersGrid.querySelectorAll('.answerBtn'));
        for (const b of answerButtons) {
          const t = b.textContent || '';
          if (t.startsWith(correctTextPrefix)) b.classList.add('correct');
          if (chosenKey && t.startsWith(`${chosenKey})`) && !isCorrect) b.classList.add('wrong');
          // If correct chosen, chosen button already correct; no wrong marking needed.
          if (!isCorrect && t.startsWith(`${chosenKey})`)) b.classList.add('wrong');
        }

        quizScoreText.textContent = `Pontuação: ${quizState.score}`;
        nextQuestionBtn.disabled = false;
        nextQuestionBtn.textContent = (quizState.questionIndex === questions.length - 1) ? 'Finalizar' : 'Próximo';

        // If last question, allow finishing
      });

      quizAnswersGrid.appendChild(btn);
    }

    const total = questions.length || 1;
    quizProgressText.textContent = `Pergunta ${quizState.questionIndex + 1}/${total}`;
    const pct = Math.max(0, Math.min(100, ((quizState.questionIndex) / total) * 100));
    quizProgressBar.style.width = `${pct}%`;

    setAnswerButtonsEnabled(true);
  }

  function finishQuiz() {
    const quiz = quizState.currentQuiz;
    const questions = quiz.questions || [];
    const totalQs = questions.length || 0;

    // Update points: 10 per correct already accumulated in quizState.score
    // Save into users points
    const uid = currentUser.uid;

    const pointsGained = quizState.score;

    updateUserPoints(uid, pointsGained)
      .then(async () => {
        // Save history
        const item = {
          title: quiz.title || 'Quiz',
          points: pointsGained,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          quizScore: pointsGained,
          totalQuestions: totalQs
        };

        await db.collection('history').doc(uid).collection('items').add(item);

        toast(`Quiz finalizado! +${pointsGained} pontos.`, 'default');

        // Refresh header points and history/ranking
        await refreshUserUI();
        await loadHistory();
        await loadRanking();

        // Show result
        quizResultPoints.textContent = `${pointsGained}`;
        quizResult.classList.remove('hidden');

        // Disable answer grid
        setAnswerButtonsEnabled(false);
        nextQuestionBtn.disabled = true;
      })
      .catch(() => {
        toast('Erro ao salvar resultado. Tente novamente.', 'error');
      });
  }

  function renderInitialQuestionsIfAvailable() {
    resetQuizRunnerUI();
    const quiz = quizState.currentQuiz;
    const questions = quiz.questions || [];
    if (questions.length === 0) {
      quizQuestionEnunciado.textContent = 'Este quiz não possui perguntas.';
      quizAnswersGrid.innerHTML = '';
      nextQuestionBtn.disabled = true;
      return;
    }

    // If question 0
    quizProgressText.textContent = `Pergunta 1/${questions.length}`;
    quizProgressBar.style.width = `0%`;
    renderQuestion();
  }

  function computeQuizProgress(currentIndex, total) {
    if (!total) return 0;
    return Math.round(((currentIndex) / total) * 100);
  }

  // Routing via nav
  navItems.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // AUTH tab switching
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.authTab;
      authTabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === target));
      loginForm.classList.toggle('active', target === 'login');
      signupForm.classList.toggle('active', target === 'signup');
    });
  });

  // LOGIN with Email/Password
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    document.getElementById('loginHint').textContent = 'Entrando...';
    try {
      await auth.signInWithEmailAndPassword(email, password);
      document.getElementById('loginHint').textContent = '';
    } catch (err) {
      document.getElementById('loginHint').textContent = err?.message || 'Erro ao entrar.';
    }
  });

  // SIGNUP with Email/Password (requires name and class)
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const classValue = document.getElementById('signupClass').value.trim();

    document.getElementById('signupHint').textContent = 'Criando conta...';
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      // Create user doc with name/class
      await getUserDoc(cred.user.uid).set({
        name,
        email,
        class: classValue,
        points: 0
      }, { merge: true });

      document.getElementById('signupHint').textContent = '';
    } catch (err) {
      document.getElementById('signupHint').textContent = err?.message || 'Erro ao criar conta.';
    }
  });

  async function signInWithGoogle() {
    try {
      const res = await auth.signInWithPopup(googleProvider);
      // Ensure doc exists and store defaults if missing
      await ensureUserDoc(res.user);
    } catch (err) {
      toast(err?.message || 'Erro no login Google.', 'error');
    }
  }

  googleLoginBtn.addEventListener('click', signInWithGoogle);
  googleSignupBtn.addEventListener('click', signInWithGoogle);

  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    toast('Você saiu com sucesso.');
  });

  // Load Subjects
  async function loadSubjects() {
    subjectsLoading.textContent = 'Carregando...';
    subjectsList.innerHTML = '';
    subjectsEmpty.style.display = 'none';

    try {
      const snap = await db.collection('subjects').get();
      const arr = [];
      snap.forEach(d => {
        const data = d.data() || {};
        arr.push({
          id: d.id,
          title: data.title || '',
          description: data.description || ''
        });
      });

      if (arr.length === 0) {
        subjectsEmpty.style.display = 'block';
        subjectsLoading.textContent = '';
        return;
      }

      subjectsLoading.textContent = '';
      for (const s of arr) {
        const card = document.createElement('div');
        card.className = 'subjectCard';

        card.innerHTML = `
          <div class="subjectCardTitle">${escapeHtml(s.title)}</div>
          <div class="subjectCardDesc">${escapeHtml(s.description || '')}</div>
          <div class="subjectCardFooter">
            <span class="smallPill">Quiz</span>
            <button class="smallBtn" type="button" data-open="${s.id}">Abrir</button>
          </div>
        `;

        const openBtn = card.querySelector(`[data-open="${s.id}"]`);
        openBtn.addEventListener('click', () => openSubject(s.id, s.title, s.description));

        subjectsList.appendChild(card);
      }
    } catch {
      subjectsLoading.textContent = '';
      toast('Erro ao carregar matérias.', 'error');
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Subject detail: open
  async function openSubject(subjectId, title, description) {
    activeSubjectId = subjectId;
    subjectDetailTitle.textContent = title || '';
    subjectDetailDesc.textContent = description || '';

    // Hide editor runner initially
    subjectDetailWrap.classList.remove('hidden');
    // Reset quiz editor & selection
    quizSelect.innerHTML = '';
    quizTitle.value = '';
    questionsEditor.innerHTML = '';
    quizCreateHint.textContent = '';
    activeSubjectId = subjectId;

    // Load quizzes for this subject
    await loadQuizzesForSubject(subjectId);

    // Create at least one question block for UX
    // but not required. We'll add one by default.
    if (questionsEditor.children.length === 0) {
      questionsEditor.appendChild(createQuestionBlock(0));
    }
    renumberQuestionsEditor();

    resetQuizRunnerUI();
    quizRunner.classList.add('hidden');

    // Jump within page
    window.scrollTo({ top: document.body.scrollHeight * 0.1, behavior: 'smooth' });

    // Ensure runner start button is enabled only if quizzes exist
    startQuizBtn.disabled = false;
  }

  backToSubjectsBtn.addEventListener('click', () => {
    subjectDetailWrap.classList.add('hidden');
    activeSubjectId = null;
    resetQuizRunnerUI();
    quizRunner.classList.add('hidden');
  });

  // Load quizzes list for subject
  async function loadQuizzesForSubject(subjectId) {
    try {
      const snap = await db.collection('subjects').doc(subjectId).collection('quizzes').get();
      // IMPORTANT: requirement says Firestore structure quizzes/{id}
      // Here we use subcollection: subjects/{id}/quizzes
      // Still matches "dentro da matéria", and meets the gameplay needs reliably.

      quizSelect.innerHTML = '';
      const quizes = [];
      snap.forEach(d => {
        const data = d.data() || {};
        quizes.push({
          id: d.id,
          title: data.title || 'Quiz',
          questions: Array.isArray(data.questions) ? data.questions : []
        });
      });

      if (quizes.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Sem quizzes ainda';
        quizSelect.appendChild(opt);
        startQuizBtn.disabled = true;
        return;
      }

      startQuizBtn.disabled = false;

      for (const q of quizes) {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = q.title;
        quizSelect.appendChild(opt);
      }

      // Keep state quizzes
      quizState.quizzes = quizes;
      quizState.currentQuiz = null;

    } catch {
      toast('Erro ao carregar quizzes.', 'error');
    }
  }

  // Add question block
  addQuestionBtn.addEventListener('click', () => {
    const idx = questionsEditor.children.length;
    questionsEditor.appendChild(createQuestionBlock(idx));
    renumberQuestionsEditor();
  });

  // Create quiz in subject detail
  createQuizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeSubjectId) {
      toast('Selecione uma matéria primeiro.', 'error');
      return;
    }

    const titleValue = (quizTitle.value || '').trim();
    if (!titleValue) {
      toast('Informe o título do quiz.', 'error');
      return;
    }

    const blocks = Array.from(questionsEditor.querySelectorAll('.qBlock'));
    if (blocks.length === 0) {
      toast('Adicione pelo menos uma pergunta.', 'error');
      return;
    }

    const questions = [];

    for (const b of blocks) {
      const en = (b.querySelector('.q-enunciado')?.value || '').trim();
      const a = (b.querySelector('.q-alt.a')?.value || '').trim();
      const c1 = (b.querySelector('.q-alt.b')?.value || '').trim();
      const c2 = (b.querySelector('.q-alt.c')?.value || '').trim();
      const d = (b.querySelector('.q-alt.d')?.value || '').trim();
      const correct = (b.querySelector('.q-correct')?.value || '').toUpperCase();

      if (!en || !a || !c1 || !c2 || !d || !correct) {
        toast('Preencha todas as perguntas e selecione a resposta correta.', 'error');
        return;
      }

      questions.push({
        enunciado: en,
        alternativaA: a,
        alternativaB: c1,
        alternativaC: c2,
        alternativaD: d,
        respostaCorreta: correct
      });
    }

    quizCreateHint.textContent = 'Salvando quiz...';

    try {
      const subjectRef = db.collection('subjects').doc(activeSubjectId);

      const docRef = await subjectRef.collection('quizzes').add({
        title: titleValue,
        questions
      });

      quizCreateHint.textContent = `Quiz salvo! (id: ${docRef.id})`;
      toast('Quiz salvo com sucesso.');

      // Reload quizzes
      await loadQuizzesForSubject(activeSubjectId);

      // Clear and add one question block for next quiz
      quizTitle.value = '';
      questionsEditor.innerHTML = '';
      questionsEditor.appendChild(createQuestionBlock(0));
      renumberQuestionsEditor();
      resetQuizRunnerUI();
      quizRunner.classList.add('hidden');

    } catch {
      quizCreateHint.textContent = '';
      toast('Erro ao salvar quiz.', 'error');
    }
  });

  // Start quiz
  startQuizBtn.addEventListener('click', async () => {
    if (!activeSubjectId) return;

    const quizId = quizSelect.value;
    if (!quizId) {
      toast('Selecione um quiz.', 'error');
      return;
    }

    const quiz = quizState.quizzes.find(q => q.id === quizId);
    if (!quiz) {
      // If state outdated, reload and retry
      await loadQuizzesForSubject(activeSubjectId);
      const quiz2 = quizState.quizzes.find(q => q.id === quizId);
      if (!quiz2) {
        toast('Quiz não encontrado.', 'error');
        return;
      }
      quizState.currentQuiz = quiz2;
    } else {
      quizState.currentQuiz = quiz;
    }

    quizRunner.classList.remove('hidden');
    quizResult.classList.add('hidden');

    quizState.currentQuiz = quizState.currentQuiz || quiz;
    quizState.questionIndex = 0;
    quizState.score = 0;

    const total = (quizState.currentQuiz.questions || []).length || 0;
    quizProgressText.textContent = total ? `Pergunta 1/${total}` : 'Pergunta 0/0';
    quizScoreText.textContent = 'Pontuação: 0';

    nextQuestionBtn.disabled = true;
    nextQuestionBtn.textContent = (total <= 1) ? 'Finalizar' : 'Próximo';

    // Render first question
    renderInitialQuestionsIfAvailable();

    // Fix progress on each render:
    const questions = quizState.currentQuiz.questions || [];
    quizProgressBar.style.width = '0%';

    // Ensure next button handler for flow:
  });

  // Next/Finish
  nextQuestionBtn.addEventListener('click', async () => {
    if (!quizState.currentQuiz) return;

    const questions = quizState.currentQuiz.questions || [];
    const total = questions.length;

    if (!quizState.locked && !quizState.finished) {
      // Prevent skipping without choosing
      toast('Selecione uma alternativa para continuar.', 'error');
      return;
    }

    // Advance or finish
    if (quizState.questionIndex < total - 1) {
      quizState.questionIndex += 1;

      const pct = computeQuizProgress(quizState.questionIndex, total);
      quizProgressBar.style.width = `${pct}%`;

      // Render next question
      renderQuestion();
    } else {
      // Update progress bar to 100%
      quizProgressBar.style.width = '100%';
      quizState.finished = true;
      nextQuestionBtn.disabled = true;
      finishQuiz();
    }
  });

  // Ranking
  async function loadRanking() {
    rankingLoading.textContent = 'Carregando...';
    rankingList.innerHTML = '';
    rankingEmpty.style.display = 'none';

    try {
      const users = await getAllUsersOrderedByPoints();
      rankingLoading.textContent = '';

      if (users.length === 0) {
        rankingEmpty.style.display = 'block';
        return;
      }

      const top = users.slice(0, 50);
      top.forEach((u, idx) => {
        const row = document.createElement('div');
        row.className = 'rankRow';

        const medalText = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        row.innerHTML = `
          <div class="rankLeft">
            <div class="rankMedal">${medalText}</div>
            <div class="rankInfo">
              <div class="rankName">${escapeHtml(u.name)}</div>
              <div class="rankClass">Sala ${escapeHtml(u.class)}</div>
            </div>
          </div>
          <div class="rankPoints">${u.points} pts</div>
        `;

        rankingList.appendChild(row);
      });

    } catch {
      rankingLoading.textContent = '';
      toast('Erro ao carregar ranking.', 'error');
    }
  }

  // History
  async function loadHistory() {
    if (!currentUser?.uid) return;

    historyLoading.textContent = 'Carregando...';
    historyList.innerHTML = '';
    historyEmpty.style.display = 'none';

    try {
      const items = await getHistory(currentUser.uid);
      historyLoading.textContent = '';

      if (items.length === 0) {
        historyEmpty.style.display = 'block';
        return;
      }

      for (const it of items.slice(0, 50)) {
        const row = document.createElement('div');
        row.className = 'historyRow';

        row.innerHTML = `
          <div class="historyTop">
            <div>
              <div class="historyTitle">${escapeHtml(it.title)}</div>
              <div class="historyMeta">Data: ${escapeHtml(formatDate(it.createdAt))}</div>
            </div>
            <div class="historyScore">${it.points} pts</div>
          </div>
        `;
        historyList.appendChild(row);
      }
    } catch {
      historyLoading.textContent = '';
      toast('Erro ao carregar histórico.', 'error');
    }
  }

  async function refreshUserUI() {
    if (!currentUser?.uid) return;
    const doc = await getUserDoc(currentUser.uid).get();
    const data = doc.data() || {};
    currentUser = {
      uid: currentUser.uid,
      name: data.name || currentUser.name,
      class: data.class || currentUser.class,
      email: data.email || currentUser.email,
      points: typeof data.points === 'number' ? data.points : 0
    };

    userSubtitle.textContent = `${currentUser.name} • Sala ${currentUser.class} • ${currentUser.points} pts`;
    homeName.textContent = currentUser.name;
    homeClass.textContent = currentUser.class;
    homePoints.textContent = String(currentUser.points);
  }

  // SPA on auth state
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Hide login after login, show app automatically
      authScreen.classList.add('hidden');
      appScreen.classList.remove('hidden');

      try {
        currentUser = await ensureUserDoc(user);

        // Render user UI
        userSubtitle.textContent = `${currentUser.name} • Sala ${currentUser.class} • ${currentUser.points} pts`;
        homeName.textContent = currentUser.name;
        homeClass.textContent = currentUser.class;
        homePoints.textContent = String(currentUser.points);

