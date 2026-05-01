// ============================================
// FIREBASE CONFIG - COLOQUE SUAS CREDENCIAIS
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let currentUserData = null;
let currentScreen = 'auth';
let currentDisciplina = null;
let currentAula = null;
let quizData = null;
let quizIndex = 0;
let quizScore = 0;
let quizTimer = null;
let quizTimeLeft = 30;

// Conquistas padrão
const CONQUISTAS = [
  { id: 'first_lesson', nome: 'Primeira Aula', icon: '📖', desc: 'Complete sua primeira aula' },
  { id: 'quiz_master', nome: 'Mestre Quiz', icon: '🧠', desc: 'Acerte 100% em um quiz' },
  { id: 'streak_7', nome: 'Semana Dedicada', icon: '🔥', desc: '7 dias seguidos de estudo' },
  { id: 'points_1000', nome: 'Milênio', icon: '🏆', desc: 'Alcance 1000 pontos' },
  { id: 'points_5000', nome: 'Lenda', icon: '👑', desc: 'Alcance 5000 pontos' },
  { id: 'challenger', nome: 'Desafiante', icon: '🎯', desc: 'Complete 10 desafios' }
];

// ============================================
// UTILITÁRIOS
// ============================================
function $(id) {
  return document.getElementById(id);
}

function showToast(message, type = 'info') {
  const toast = $('toast');
  const toastMessage = $('toastMessage');
  toast.className = 'toast ' + type;
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showLoading() {
  $('loading').classList.remove('hidden');
}

function hideLoading() {
  $('loading').classList.add('hidden');
}

function generateAvatar(name) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=128`;
}

// ============================================
// NAVEGAÇÃO
// ============================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(screenId + 'Screen').classList.remove('hidden');
  currentScreen = screenId;
  
  // Atualizar nav ativa
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenId);
  });
  
  // Fechar menu mobile
  $('navMobile').classList.add('hidden');
  
  // Carregar conteúdo da tela
  if (screenId === 'home') loadHome();
  if (screenId === 'disciplinas') loadDisciplinas();
  if (screenId === 'ranking') loadRanking();
  if (screenId === 'desafios') loadDesafios();
  if (screenId === 'perfil') loadPerfil();
}

// ============================================
// AUTENTICAÇÃO
// ============================================
auth.onAuthStateChanged(async (user) => {
  hideLoading();
  if (user) {
    currentUser = user;
    await loadUserData();
    $('header').classList.remove('hidden');
    showScreen('home');
  } else {
    currentUser = null;
    currentUserData = null;
    $('header').classList.add('hidden');
    showScreen('auth');
  }
});

async function loadUserData() {
  const snapshot = await db.ref('users/' + currentUser.uid).once('value');
  currentUserData = snapshot.val();
  
  if (currentUserData) {
    // Atualizar header
    $('userPoints').textContent = (currentUserData.points || 0) + ' XP';
    $('headerAvatar').src = currentUserData.avatar || generateAvatar(currentUserData.name);
    
    // Verificar streak
    checkStreak();
  }
}

async function checkStreak() {
  const today = new Date().toDateString();
  const lastLogin = currentUserData.lastLogin;
  
  if (lastLogin !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = 1;
    
    if (lastLogin === yesterday) {
      newStreak = (currentUserData.streak || 0) + 1;
    }
    
    await db.ref('users/' + currentUser.uid).update({
      lastLogin: today,
      streak: newStreak
    });
    
    currentUserData.lastLogin = today;
    currentUserData.streak = newStreak;
  }
}

// Login com email
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value;
  const password = $('loginPassword').value;
  
  showLoading();
  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Login realizado com sucesso!', 'success');
  } catch (error) {
    hideLoading();
    let msg = 'Erro ao fazer login';
    if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
    if (error.code === 'auth/wrong-password') msg = 'Senha incorreta';
    showToast(msg, 'error');
  }
});

// Cadastro
$('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('registerName').value;
  const username = $('registerUsername').value.toLowerCase();
  const email = $('registerEmail').value;
  const password = $('registerPassword').value;
  
  showLoading();
  try {
    // Verificar username único
    const usernameSnap = await db.ref('usernames/' + username).once('value');
    if (usernameSnap.exists()) {
      hideLoading();
      showToast('Este @usuário já está em uso', 'error');
      return;
    }
    
    // Criar usuário
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    
    // Salvar dados
    await db.ref('users/' + cred.user.uid).set({
      name,
      username,
      email,
      avatar: generateAvatar(name),
      points: 0,
      streak: 1,
      lessonsCompleted: 0,
      quizzesCompleted: 0,
      challengesCompleted: 0,
      conquistas: [],
      isAdmin: false,
      createdAt: Date.now(),
      lastLogin: new Date().toDateString()
    });
    
    // Reservar username
    await db.ref('usernames/' + username).set(cred.user.uid);
    
    showToast('Conta criada com sucesso!', 'success');
  } catch (error) {
    hideLoading();
    let msg = 'Erro ao criar conta';
    if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso';
    showToast(msg, 'error');
  }
});

// Login com Google
$('googleLoginBtn').addEventListener('click', async () => {
  showLoading();
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    
    // Verificar se já existe no DB
    const snapshot = await db.ref('users/' + result.user.uid).once('value');
    if (!snapshot.exists()) {
      // Criar novo usuário
      const username = result.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      await db.ref('users/' + result.user.uid).set({
        name: result.user.displayName,
        username,
        email: result.user.email,
        avatar: result.user.photoURL || generateAvatar(result.user.displayName),
        points: 0,
        streak: 1,
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        challengesCompleted: 0,
        conquistas: [],
        isAdmin: false,
        createdAt: Date.now(),
        lastLogin: new Date().toDateString()
      });
    }
    
    showToast('Login realizado com sucesso!', 'success');
  } catch (error) {
    hideLoading();
    let msg = 'Erro ao fazer login com Google';
    if (error.code === 'auth/unauthorized-domain') {
      msg = 'Domínio não autorizado. Adicione nas configurações do Firebase.';
    }
    showToast(msg, 'error');
  }
});

// Logout
$('logoutBtn').addEventListener('click', () => {
  auth.signOut();
  showToast('Você saiu da conta', 'success');
});

// Tabs de auth
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tab.dataset.tab === 'login') {
      $('loginForm').classList.remove('hidden');
      $('registerForm').classList.add('hidden');
    } else {
      $('loginForm').classList.add('hidden');
      $('registerForm').classList.remove('hidden');
    }
  });
});

// ============================================
// HOME
// ============================================
async function loadHome() {
  if (!currentUserData) return;
  
  $('welcomeName').textContent = currentUserData.name.split(' ')[0];
  $('statPoints').textContent = currentUserData.points || 0;
  $('statStreak').textContent = currentUserData.streak || 0;
  $('statLessons').textContent = currentUserData.lessonsCompleted || 0;
  $('statQuizzes').textContent = currentUserData.quizzesCompleted || 0;
  
  // Carregar desafio do dia
  const desafiosSnap = await db.ref('desafios').orderByChild('tipo').equalTo('diario').limitToFirst(1).once('value');
  const desafios = desafiosSnap.val();
  
  if (desafios) {
    const desafio = Object.values(desafios)[0];
    $('dailyChallengeTitle').textContent = desafio.titulo;
    $('dailyChallengeDesc').textContent = desafio.descricao;
    $('dailyChallengeReward').textContent = '+' + desafio.recompensa + ' XP';
  } else {
    $('dailyChallengeTitle').textContent = 'Complete 3 quizzes';
    $('dailyChallengeDesc').textContent = 'Faça quizzes de qualquer disciplina';
    $('dailyChallengeReward').textContent = '+50 XP';
  }
}

// ============================================
// DISCIPLINAS
// ============================================
async function loadDisciplinas() {
  const grid = $('disciplinasGrid');
  grid.innerHTML = '<p style="color: var(--text-muted)">Carregando...</p>';
  
  const snapshot = await db.ref('disciplinas').once('value');
  const disciplinas = snapshot.val();
  
  if (!disciplinas) {
    grid.innerHTML = '<p style="color: var(--text-muted)">Nenhuma disciplina cadastrada ainda.</p>';
    return;
  }
  
  grid.innerHTML = '';
  Object.entries(disciplinas).forEach(([id, disc]) => {
    const card = document.createElement('div');
    card.className = 'disciplina-card';
    card.innerHTML = `
      <div class="disciplina-icon">${disc.icon || '📚'}</div>
      <h3>${disc.nome}</h3>
      <p>${disc.descricao || ''}</p>
      <div class="disciplina-meta">
        <span>${disc.aulasCount || 0} aulas</span>
      </div>
    `;
    card.addEventListener('click', () => openDisciplina(id, disc));
    grid.appendChild(card);
  });
}

function openDisciplina(id, disc) {
  currentDisciplina = { id, ...disc };
  $('aulasTitle').textContent = disc.nome;
  loadAulas(id);
  showScreen('aulas');
}

async function loadAulas(disciplinaId) {
  const list = $('aulasList');
  list.innerHTML = '<p style="color: var(--text-muted)">Carregando...</p>';
  
  const snapshot = await db.ref('aulas').orderByChild('disciplinaId').equalTo(disciplinaId).once('value');
  const aulas = snapshot.val();
  
  if (!aulas) {
    list.innerHTML = '<p style="color: var(--text-muted)">Nenhuma aula cadastrada ainda.</p>';
    return;
  }
  
  list.innerHTML = '';
  Object.entries(aulas).forEach(([id, aula]) => {
    const item = document.createElement('div');
    item.className = 'aula-item';
    item.innerHTML = `
      <div>
        <h3>${aula.titulo}</h3>
        <div class="aula-item-meta">
          <span class="difficulty ${aula.dificuldade}">${aula.dificuldade}</span>
          <span class="duration">${aula.duracao || '10'} min</span>
        </div>
      </div>
      <span class="aula-item-arrow">→</span>
    `;
    item.addEventListener('click', () => openAula(id, aula));
    list.appendChild(item);
  });
}

function openAula(id, aula) {
  currentAula = { id, ...aula };
  $('aulaDetailTitle').textContent = aula.titulo;
  $('aulaDetailDifficulty').textContent = aula.dificuldade;
  $('aulaDetailDifficulty').className = 'difficulty ' + aula.dificuldade;
  $('aulaDetailDuration').textContent = (aula.duracao || 10) + ' min';
  $('aulaDetailBody').innerHTML = aula.conteudo || '<p>Conteúdo da aula...</p>';
  
  $('startQuizBtn').onclick = () => startQuiz(id);
  showScreen('aulaDetail');
}

$('backToAulas').addEventListener('click', () => {
  showScreen('aulas');
});

// ============================================
// QUIZ
// ============================================
async function startQuiz(aulaId) {
  showLoading();
  
  const snapshot = await db.ref('quizzes').orderByChild('aulaId').equalTo(aulaId).once('value');
  const quizzes = snapshot.val();
  
  hideLoading();
  
  if (!quizzes) {
    showToast('Nenhum quiz disponível para esta aula', 'error');
    return;
  }
  
  quizData = Object.values(quizzes);
  quizIndex = 0;
  quizScore = 0;
  
  showScreen('quiz');
  $('quizResult').classList.add('hidden');
  $('quizOptions').parentElement.classList.remove('hidden');
  $('quizProgressBar').parentElement.parentElement.classList.remove('hidden');
  
  showQuestion();
}

function showQuestion() {
  if (quizIndex >= quizData.length) {
    finishQuiz();
    return;
  }
  
  const q = quizData[quizIndex];
  $('quizProgress').textContent = `Questão ${quizIndex + 1} de ${quizData.length}`;
  $('quizProgressBar').style.width = ((quizIndex + 1) / quizData.length * 100) + '%';
  $('quizQuestion').textContent = q.pergunta;
  
  const optionsDiv = $('quizOptions');
  optionsDiv.innerHTML = '';
  
  q.opcoes.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectAnswer(i, q.correta));
    optionsDiv.appendChild(btn);
  });
  
  // Timer
  quizTimeLeft = 30;
  $('quizTimer').textContent = quizTimeLeft + 's';
  
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    quizTimeLeft--;
    $('quizTimer').textContent = quizTimeLeft + 's';
    
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimer);
      selectAnswer(-1, quizData[quizIndex].correta);
    }
  }, 1000);
}

function selectAnswer(selected, correct) {
  clearInterval(quizTimer);
  
  const options = $('quizOptions').querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    opt.disabled = true;
    if (i === correct) opt.classList.add('correct');
    if (i === selected && selected !== correct) opt.classList.add('wrong');
  });
  
  if (selected === correct) {
    quizScore++;
  }
  
  setTimeout(() => {
    quizIndex++;
    showQuestion();
  }, 1500);
}

async function finishQuiz() {
  $('quizOptions').parentElement.classList.add('hidden');
  $('quizProgressBar').parentElement.parentElement.classList.add('hidden');
  $('quizResult').classList.remove('hidden');
  
  const total = quizData.length;
  const percentage = (quizScore / total * 100).toFixed(0);
  const xpEarned = quizScore * 10;
  
  if (percentage >= 70) {
    $('resultIcon').textContent = '🎉';
    $('resultTitle').textContent = 'Parabéns!';
  } else if (percentage >= 50) {
    $('resultIcon').textContent = '👍';
    $('resultTitle').textContent = 'Bom trabalho!';
  } else {
    $('resultIcon').textContent = '📚';
    $('resultTitle').textContent = 'Continue estudando!';
  }
  
  $('resultMessage').textContent = `Você acertou ${quizScore} de ${total} questões (${percentage}%)`;
  $('resultXP').textContent = '+' + xpEarned + ' XP';
  
  // Atualizar pontos no banco
  if (currentUser && currentUserData) {
    const newPoints = (currentUserData.points || 0) + xpEarned;
    const newQuizzes = (currentUserData.quizzesCompleted || 0) + 1;
    
    await db.ref('users/' + currentUser.uid).update({
      points: newPoints,
      quizzesCompleted: newQuizzes
    });
    
    currentUserData.points = newPoints;
    currentUserData.quizzesCompleted = newQuizzes;
    $('userPoints').textContent = newPoints + ' XP';
    
    // Verificar conquistas
    if (percentage === 100) {
      addConquista('quiz_master');
    }
    if (newPoints >= 1000) addConquista('points_1000');
    if (newPoints >= 5000) addConquista('points_5000');
  }
}

async function addConquista(id) {
  if (!currentUserData.conquistas) currentUserData.conquistas = [];
  if (currentUserData.conquistas.includes(id)) return;
  
  currentUserData.conquistas.push(id);
  await db.ref('users/' + currentUser.uid + '/conquistas').set(currentUserData.conquistas);
  
  const conquista = CONQUISTAS.find(c => c.id === id);
  if (conquista) {
    showToast(`Nova conquista: ${conquista.nome} ${conquista.icon}`, 'success');
  }
}

$('backToDisciplinas').addEventListener('click', () => {
  showScreen('disciplinas');
});

// ============================================
// RANKING
// ============================================
async function loadRanking(period = 'global') {
  const list = $('rankingList');
  list.innerHTML = '<p style="color: var(--text-muted)">Carregando...</p>';
  
  const snapshot = await db.ref('users').orderByChild('points').limitToLast(50).once('value');
  const users = snapshot.val();
  
  if (!users) {
    list.innerHTML = '<p style="color: var(--text-muted)">Nenhum usuário encontrado.</p>';
    return;
  }
  
  // Ordenar por pontos (decrescente)
  const sorted = Object.entries(users)
    .map(([id, u]) => ({ id, ...u }))
    .sort((a, b) => (b.points || 0) - (a.points || 0));
  
  list.innerHTML = '';
  sorted.forEach((user, i) => {
    const position = i + 1;
    const item = document.createElement('div');
    item.className = 'ranking-item';
    if (position === 1) item.classList.add('top-1');
    if (position === 2) item.classList.add('top-2');
    if (position === 3) item.classList.add('top-3');
    
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position;
    
    item.innerHTML = `
      <span class="ranking-position">${medal}</span>
      <img src="${user.avatar || generateAvatar(user.name)}" alt="" class="ranking-avatar">
      <div class="ranking-info">
        <h3>${user.name}</h3>
        <span>@${user.username}</span>
      </div>
      <span class="ranking-points">${user.points || 0} XP</span>
    `;
    
    list.appendChild(item);
  });
}

// Tabs de ranking
document.querySelectorAll('.ranking-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadRanking(tab.dataset.period);
  });
});

// ============================================
// DESAFIOS
// ============================================
async function loadDesafios(tipo = 'diarios') {
  const list = $('desafiosList');
  list.innerHTML = '<p style="color: var(--text-muted)">Carregando...</p>';
  
  const tipoDb = tipo === 'diarios' ? 'diario' : 'semanal';
  const snapshot = await db.ref('desafios').orderByChild('tipo').equalTo(tipoDb).once('value');
  const desafios = snapshot.val();
  
  if (!desafios) {
    list.innerHTML = `
      <div class="desafio-item">
        <div class="desafio-header">
          <h3>${tipo === 'diarios' ? 'Complete 3 quizzes' : 'Estude 5 disciplinas'}</h3>
          <span class="desafio-reward">${tipo === 'diarios' ? '+50' : '+200'} XP</span>
        </div>
        <p>${tipo === 'diarios' ? 'Faça quizzes de qualquer disciplina' : 'Acesse pelo menos 5 disciplinas diferentes'}</p>
        <div class="desafio-progress">
          <div class="desafio-progress-bar">
            <div class="desafio-progress-fill" style="width: 0%"></div>
          </div>
          <span>0/${tipo === 'diarios' ? '3' : '5'}</span>
        </div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = '';
  Object.entries(desafios).forEach(([id, desafio]) => {
    const userProgress = currentUserData?.desafiosProgress?.[id] || 0;
    const completed = userProgress >= desafio.meta;
    const percentage = Math.min((userProgress / desafio.meta) * 100, 100);
    
    const item = document.createElement('div');
    item.className = 'desafio-item' + (completed ? ' completed' : '');
    item.innerHTML = `
      <div class="desafio-header">
        <h3>${desafio.titulo}</h3>
        <span class="desafio-reward">+${desafio.recompensa} XP</span>
      </div>
      <p>${desafio.descricao}</p>
      <div class="desafio-progress">
        <div class="desafio-progress-bar">
          <div class="desafio-progress-fill" style="width: ${percentage}%"></div>
        </div>
        <span>${userProgress}/${desafio.meta}</span>
      </div>
      <button class="desafio-btn" ${completed ? 'disabled' : ''}>
        ${completed ? 'Concluído ✓' : 'Iniciar'}
      </button>
    `;
    
    list.appendChild(item);
  });
}

// Tabs de desafios
document.querySelectorAll('.desafio-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.desafio-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadDesafios(tab.dataset.type);
  });
});

// ============================================
// JARVIS IA
// ============================================
$('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('chatInput');
  const message = input.value.trim();
  if (!message) return;
  
  // Adicionar mensagem do usuário
  addMessage(message, 'user');
  input.value = '';
  
  // Simular resposta do Jarvis
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.innerHTML = '<div class="message-content">Pensando...</div>';
  $('chatMessages').appendChild(typingDiv);
  $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
  
  // Aqui você pode integrar com a API da Groq ou outra IA
  // Por enquanto, respostas simples
  setTimeout(() => {
    typingDiv.remove();
    
    let response = getJarvisResponse(message);
    addMessage(response, 'bot');
  }, 1000);
});

function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = 'message ' + type;
  div.innerHTML = `<div class="message-content">${text}</div>`;
  $('chatMessages').appendChild(div);
  $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
}

function getJarvisResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('hey')) {
    return 'Olá! Como posso ajudar você nos estudos hoje?';
  }
  if (msg.includes('matemática') || msg.includes('math')) {
    return 'Matemática é uma disciplina fascinante! Posso ajudar com aritmética, álgebra, geometria e muito mais. Qual tópico específico você quer estudar?';
  }
  if (msg.includes('português') || msg.includes('gramática')) {
    return 'Português é essencial! Posso ajudar com gramática, redação, interpretação de texto e literatura. O que você precisa?';
  }
  if (msg.includes('física')) {
    return 'Física explica como o universo funciona! Mecânica, termodinâmica, eletromagnetismo... Qual área te interessa?';
  }
  if (msg.includes('química')) {
    return 'Química estuda a composição da matéria. Posso ajudar com química orgânica, inorgânica, cálculos estequiométricos e muito mais!';
  }
  if (msg.includes('história')) {
    return 'História nos ensina sobre o passado! Brasil, mundo, antiga, moderna... Qual período você quer explorar?';
  }
  if (msg.includes('obrigado') || msg.includes('valeu')) {
    return 'Por nada! Estou aqui para ajudar. Bons estudos! 📚';
  }
  if (msg.includes('dica') || msg.includes('estudar')) {
    return 'Dicas de estudo: 1) Faça pausas regulares (técnica Pomodoro). 2) Revise o conteúdo em intervalos. 3) Ensine o que aprendeu. 4) Durma bem! O sono ajuda a fixar o conteúdo.';
  }
  
  return 'Interessante! Posso ajudar você a estudar qualquer matéria. Tente me perguntar sobre Matemática, Português, Física, Química, História, ou peça dicas de estudo!';
}

// ============================================
// PERFIL
// ============================================
async function loadPerfil() {
  if (!currentUserData) return;
  
  $('perfilAvatar').src = currentUserData.avatar || generateAvatar(currentUserData.name);
  $('perfilName').textContent = currentUserData.name;
  $('perfilUsername').textContent = '@' + currentUserData.username;
  $('perfilPoints').textContent = currentUserData.points || 0;
  $('perfilStreak').textContent = currentUserData.streak || 0;
  
  // Calcular posição no ranking
  const snapshot = await db.ref('users').orderByChild('points').once('value');
  const users = snapshot.val();
  const sorted = Object.entries(users)
    .sort((a, b) => (b[1].points || 0) - (a[1].points || 0));
  const position = sorted.findIndex(([id]) => id === currentUser.uid) + 1;
  $('perfilRank').textContent = '#' + position;
  
  // Conquistas
  const grid = $('conquistasGrid');
  grid.innerHTML = '';
  
  CONQUISTAS.forEach(conquista => {
    const unlocked = currentUserData.conquistas?.includes(conquista.id);
    const div = document.createElement('div');
    div.className = 'conquista-item' + (unlocked ? '' : ' locked');
    div.innerHTML = `
      <span class="conquista-icon">${conquista.icon}</span>
      <span class="conquista-name">${conquista.nome}</span>
    `;
    div.title = conquista.desc;
    grid.appendChild(div);
  });
  
  // Botão admin
  if (currentUserData.isAdmin) {
    $('adminBtn').classList.remove('hidden');
  } else {
    $('adminBtn').classList.add('hidden');
  }
}

// ============================================
// PAINEL ADMIN
// ============================================
let currentAdminTab = 'usuarios';

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentAdminTab = tab.dataset.admin;
    loadAdminContent();
  });
});

async function loadAdminContent() {
  const content = $('adminContent');
  
  switch (currentAdminTab) {
    case 'usuarios':
      await loadAdminUsuarios();
      break;
    case 'disciplinas':
      await loadAdminDisciplinas();
      break;
    case 'quizzes':
      await loadAdminQuizzes();
      break;
    case 'desafios':
      await loadAdminDesafios();
      break;
  }
}

async function loadAdminUsuarios() {
  const content = $('adminContent');
  const snapshot = await db.ref('users').once('value');
  const users = snapshot.val() || {};
  
  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Username</th>
          <th>Pontos</th>
          <th>Admin</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.entries(users).forEach(([id, user]) => {
    html += `
      <tr>
        <td>${user.name}</td>
        <td>@${user.username}</td>
        <td>${user.points || 0} XP</td>
        <td>${user.isAdmin ? '✓' : '✗'}</td>
        <td class="admin-actions">
          <button class="btn-edit" onclick="toggleAdmin('${id}', ${!user.isAdmin})">${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  content.innerHTML = html;
}

window.toggleAdmin = async (userId, isAdmin) => {
  await db.ref('users/' + userId + '/isAdmin').set(isAdmin);
  showToast('Permissões atualizadas!', 'success');
  loadAdminUsuarios();
};

async function loadAdminDisciplinas() {
  const content = $('adminContent');
  const snapshot = await db.ref('disciplinas').once('value');
  const disciplinas = snapshot.val() || {};
  
  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Icon</th>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.entries(disciplinas).forEach(([id, disc]) => {
    html += `
      <tr>
        <td>${disc.icon || '📚'}</td>
        <td>${disc.nome}</td>
        <td>${disc.descricao || '-'}</td>
        <td class="admin-actions">
          <button class="btn-delete" onclick="deleteDisciplina('${id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <form class="admin-form" onsubmit="addDisciplina(event)">
      <h3>Adicionar Disciplina</h3>
      <input type="text" id="newDiscIcon" placeholder="Emoji (ex: 📐)" required>
      <input type="text" id="newDiscNome" placeholder="Nome da disciplina" required>
      <input type="text" id="newDiscDesc" placeholder="Descrição">
      <button type="submit" class="btn-primary">Adicionar</button>
    </form>
  `;
  
  content.innerHTML = html;
}

window.addDisciplina = async (e) => {
  e.preventDefault();
  const icon = $('newDiscIcon').value;
  const nome = $('newDiscNome').value;
  const descricao = $('newDiscDesc').value;
  
  await db.ref('disciplinas').push({
    icon,
    nome,
    descricao,
    aulasCount: 0,
    createdAt: Date.now()
  });
  
  showToast('Disciplina adicionada!', 'success');
  loadAdminDisciplinas();
};

window.deleteDisciplina = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
    await db.ref('disciplinas/' + id).remove();
    showToast('Disciplina excluída!', 'success');
    loadAdminDisciplinas();
  }
};

async function loadAdminQuizzes() {
  const content = $('adminContent');
  
  // Carregar disciplinas e aulas para o select
  const discSnap = await db.ref('disciplinas').once('value');
  const disciplinas = discSnap.val() || {};
  
  const aulasSnap = await db.ref('aulas').once('value');
  const aulas = aulasSnap.val() || {};
  
  const quizzesSnap = await db.ref('quizzes').once('value');
  const quizzes = quizzesSnap.val() || {};
  
  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Pergunta</th>
          <th>Aula</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.entries(quizzes).forEach(([id, quiz]) => {
    const aula = aulas[quiz.aulaId];
    html += `
      <tr>
        <td>${quiz.pergunta.substring(0, 50)}...</td>
        <td>${aula?.titulo || 'N/A'}</td>
        <td class="admin-actions">
          <button class="btn-delete" onclick="deleteQuiz('${id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
  
  let aulasOptions = '';
  Object.entries(aulas).forEach(([id, aula]) => {
    aulasOptions += `<option value="${id}">${aula.titulo}</option>`;
  });
  
  html += `
      </tbody>
    </table>
    <form class="admin-form" onsubmit="addQuiz(event)">
      <h3>Adicionar Quiz</h3>
      <select id="newQuizAula" required>
        <option value="">Selecione a aula</option>
        ${aulasOptions}
      </select>
      <input type="text" id="newQuizPergunta" placeholder="Pergunta" required>
      <input type="text" id="newQuizOpcao1" placeholder="Opção 1 (correta)" required>
      <input type="text" id="newQuizOpcao2" placeholder="Opção 2" required>
      <input type="text" id="newQuizOpcao3" placeholder="Opção 3" required>
      <input type="text" id="newQuizOpcao4" placeholder="Opção 4" required>
      <button type="submit" class="btn-primary">Adicionar</button>
    </form>
  `;
  
  content.innerHTML = html;
}

window.addQuiz = async (e) => {
  e.preventDefault();
  const aulaId = $('newQuizAula').value;
  const pergunta = $('newQuizPergunta').value;
  const opcoes = [
    $('newQuizOpcao1').value,
    $('newQuizOpcao2').value,
    $('newQuizOpcao3').value,
    $('newQuizOpcao4').value
  ];
  
  await db.ref('quizzes').push({
    aulaId,
    pergunta,
    opcoes,
    correta: 0, // Primeira opção é sempre a correta
    createdAt: Date.now()
  });
  
  showToast('Quiz adicionado!', 'success');
  loadAdminQuizzes();
};

window.deleteQuiz = async (id) => {
  if (confirm('Tem certeza que deseja excluir este quiz?')) {
    await db.ref('quizzes/' + id).remove();
    showToast('Quiz excluído!', 'success');
    loadAdminQuizzes();
  }
};

async function loadAdminDesafios() {
  const content = $('adminContent');
  const snapshot = await db.ref('desafios').once('value');
  const desafios = snapshot.val() || {};
  
  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Tipo</th>
          <th>Recompensa</th>
          <th>Meta</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.entries(desafios).forEach(([id, desafio]) => {
    html += `
      <tr>
        <td>${desafio.titulo}</td>
        <td>${desafio.tipo}</td>
        <td>${desafio.recompensa} XP</td>
        <td>${desafio.meta}</td>
        <td class="admin-actions">
          <button class="btn-delete" onclick="deleteDesafio('${id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <form class="admin-form" onsubmit="addDesafio(event)">
      <h3>Adicionar Desafio</h3>
      <input type="text" id="newDesafioTitulo" placeholder="Título do desafio" required>
      <input type="text" id="newDesafioDesc" placeholder="Descrição" required>
      <select id="newDesafioTipo" required>
        <option value="diario">Diário</option>
        <option value="semanal">Semanal</option>
      </select>
      <input type="number" id="newDesafioMeta" placeholder="Meta (número)" required>
      <input type="number" id="newDesafioRecompensa" placeholder="Recompensa em XP" required>
      <button type="submit" class="btn-primary">Adicionar</button>
    </form>
  `;
  
  content.innerHTML = html;
}

window.addDesafio = async (e) => {
  e.preventDefault();
  const titulo = $('newDesafioTitulo').value;
  const descricao = $('newDesafioDesc').value;
  const tipo = $('newDesafioTipo').value;
  const meta = parseInt($('newDesafioMeta').value);
  const recompensa = parseInt($('newDesafioRecompensa').value);
  
  await db.ref('desafios').push({
    titulo,
    descricao,
    tipo,
    meta,
    recompensa,
    createdAt: Date.now()
  });
  
  showToast('Desafio adicionado!', 'success');
  loadAdminDesafios();
};

window.deleteDesafio = async (id) => {
  if (confirm('Tem certeza que deseja excluir este desafio?')) {
    await db.ref('desafios/' + id).remove();
    showToast('Desafio excluído!', 'success');
    loadAdminDesafios();
  }
};

// ============================================
// EVENT LISTENERS
// ============================================

// Navegação
document.querySelectorAll('[data-screen]').forEach(btn => {
  btn.addEventListener('click', () => {
    const screen = btn.dataset.screen;
    if (screen === 'painel') {
      showScreen('painel');
      loadAdminContent();
    } else {
      showScreen(screen);
    }
  });
});

// Menu mobile
$('menuMobileBtn').addEventListener('click', () => {
  $('navMobile').classList.toggle('hidden');
});

// Busca disciplinas
$('searchDisciplinas').addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  document.querySelectorAll('.disciplina-card').forEach(card => {
    const nome = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = nome.includes(search) ? 'block' : 'none';
  });
});

// Inicialização
showLoading();
