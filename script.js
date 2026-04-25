/* ============================================================
   EduConnect — app.js
   Complete Firebase-powered Educational Social Network
   ============================================================ */

'use strict';

/* ==================== GLOBAL STATE ==================== */
const STATE = {
  user: null,
  userData: null,
  currentScreen: 'home',
  currentMateriaId: null,
  currentTopicoId: null,
  currentQuiz: null,
  currentRoom: null,
  selectedEmoji: { materia: '📚' },
  selectedAvatar: '🎓',
  postType: 'post',
  materiaFilter: 'all',
  feedFilter: 'all',
  quizState: {
    questions: [],
    currentIndex: 0,
    score: 0,
    correct: 0,
    timerInterval: null,
    timeLeft: 30,
    startTime: null,
    answers: []
  },
  listeners: [],
  chatListener: null,
  admTab: 'usuarios'
};

const AVATARS = ['🎓','🦁','🐯','🦊','🐼','🦅','🌟','🚀','⚡','🎯','🦄','🐉','🌈','🎭','💎','🔥','🌊','🌸','🍀','🎪'];
const LEVEL_NAMES = ['Iniciante','Aprendiz','Estudante','Scholar','Mestre','Especialista','Professor','Guru','Sábio','Lenda'];
const LEVEL_THRESHOLDS = [0,100,250,500,1000,2000,3500,5500,8000,12000,99999];

/* ==================== FIREBASE HELPERS ==================== */
function getFirebase() { return window._firebase; }
function fdb() { return getFirebase().db; }
function fauth() { return getFirebase().auth; }
function dbRef(path) { return getFirebase().ref(fdb(), path); }

async function dbGet(path) {
  try {
    const snap = await getFirebase().get(dbRef(path));
    return snap.exists() ? snap.val() : null;
  } catch(e) { console.error('dbGet error:', path, e); return null; }
}

async function dbSet(path, data) {
  try {
    await getFirebase().set(dbRef(path), data);
    return true;
  } catch(e) { console.error('dbSet error:', e); return false; }
}

async function dbPush(path, data) {
  try {
    const ref = await getFirebase().push(dbRef(path), data);
    return ref.key;
  } catch(e) { console.error('dbPush error:', e); return null; }
}

async function dbUpdate(path, data) {
  try {
    await getFirebase().update(dbRef(path), data);
    return true;
  } catch(e) { console.error('dbUpdate error:', e); return false; }
}

async function dbRemove(path) {
  try {
    await getFirebase().remove(dbRef(path));
    return true;
  } catch(e) { console.error('dbRemove error:', e); return false; }
}

function dbListen(path, callback) {
  const ref = dbRef(path);
  const unsub = getFirebase().onValue(ref, callback);
  STATE.listeners.push(unsub);
  return unsub;
}

/* ==================== APP INIT ==================== */
window.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase to be ready
  const waitForFirebase = setInterval(() => {
    if (window._firebase) {
      clearInterval(waitForFirebase);
      initApp();
    }
  }, 100);
});

function initApp() {
  const { onAuthStateChanged } = getFirebase();
  onAuthStateChanged(fauth(), async (user) => {
    if (user) {
      STATE.user = user;
      await loadUserData(user.uid);
      hideSplash();
      showApp();
      initRealtime();
    } else {
      STATE.user = null;
      STATE.userData = null;
      hideSplash();
      showAuthScreen();
    }
  });
}

function hideSplash() {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.4s ease';
      setTimeout(() => splash.classList.add('hidden'), 400);
    }
  }, 2000);
}

/* ==================== AUTH ==================== */
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateSidebarUser();
  showScreen('home');
  loadAvatarGrid();
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById(`${tab}-form`).classList.remove('hidden');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');

  if (!email || !pw) return showError(errEl, 'Preencha todos os campos');
  
  setLoading(btn, true);
  errEl.classList.add('hidden');

  try {
    const { signInWithEmailAndPassword } = getFirebase();
    await signInWithEmailAndPassword(fauth(), email, pw);
    // onAuthStateChanged will handle the rest
  } catch(e) {
    setLoading(btn, false);
    const msgs = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-email': 'E-mail inválido',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/invalid-credential': 'E-mail ou senha incorretos'
    };
    showError(errEl, msgs[e.code] || 'Erro ao fazer login: ' + e.message);
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const btn = document.getElementById('btn-register');
  const errEl = document.getElementById('reg-error');

  if (!name || !email || !pw) return showError(errEl, 'Preencha todos os campos');
  if (pw !== confirm) return showError(errEl, 'As senhas não coincidem');
  if (pw.length < 6) return showError(errEl, 'Senha deve ter pelo menos 6 caracteres');

  setLoading(btn, true);
  errEl.classList.add('hidden');

  try {
    const { createUserWithEmailAndPassword, updateProfile } = getFirebase();
    const cred = await createUserWithEmailAndPassword(fauth(), email, pw);
    await updateProfile(cred.user, { displayName: name });

    // Create user profile in DB
    const userData = {
      uid: cred.user.uid,
      name,
      email,
      avatar: '🎓',
      bio: '',
      points: 0,
      quizzesPlayed: 0,
      materiasCreated: 0,
      followers: 0,
      following: 0,
      isAdmin: false,
      createdAt: Date.now()
    };
    await dbSet(`users/${cred.user.uid}`, userData);
    
    // Add welcome notification
    await addNotification(cred.user.uid, '🎉 Bem-vindo ao EduConnect! Comece criando sua primeira matéria.', 'system');
    
    toast('Conta criada! Bem-vindo ao EduConnect! 🎉', 'success');
  } catch(e) {
    setLoading(btn, false);
    const msgs = {
      'auth/email-already-in-use': 'E-mail já cadastrado',
      'auth/invalid-email': 'E-mail inválido',
      'auth/weak-password': 'Senha muito fraca'
    };
    showError(errEl, msgs[e.code] || 'Erro ao criar conta: ' + e.message);
  }
}

async function doLogout() {
  if (!confirm('Deseja sair da sua conta?')) return;
  try {
    // Remove listeners
    STATE.listeners.forEach(u => u && u());
    STATE.listeners = [];
    if (STATE.chatListener) { STATE.chatListener(); STATE.chatListener = null; }
    
    const { signOut } = getFirebase();
    await signOut(fauth());
    STATE.user = null; STATE.userData = null;
    toast('Até logo! 👋', 'info');
  } catch(e) { toast('Erro ao sair: ' + e.message, 'error'); }
}

/* ==================== USER DATA ==================== */
async function loadUserData(uid) {
  const data = await dbGet(`users/${uid}`);
  if (data) {
    STATE.userData = data;
  } else {
    // Create profile if missing (Google sign-in edge case)
    const user = fauth().currentUser;
    const newData = {
      uid,
      name: user.displayName || 'Usuário',
      email: user.email || '',
      avatar: '🎓',
      bio: '',
      points: 0,
      quizzesPlayed: 0,
      materiasCreated: 0,
      followers: 0,
      following: 0,
      isAdmin: false,
      createdAt: Date.now()
    };
    await dbSet(`users/${uid}`, newData);
    STATE.userData = newData;
  }
  // Show ADM link if admin
  if (STATE.userData.isAdmin) {
    document.getElementById('nav-adm').style.display = 'flex';
  }
}

function updateSidebarUser() {
  if (!STATE.userData) return;
  const u = STATE.userData;
  setEl('sidebar-name', u.name || 'Usuário');
  setEl('sidebar-pts', formatPts(u.points || 0));
  setEl('sidebar-avatar', u.avatar || getInitial(u.name));
  setEl('topbar-avatar', u.avatar || getInitial(u.name));
  setEl('pc-avatar', u.avatar || getInitial(u.name));
  setEl('home-greeting', `Olá, ${(u.name || 'estudante').split(' ')[0]}! 👋`);
}

/* ==================== SCREEN NAVIGATION ==================== */
function showScreen(name) {
  // Hide all sections
  document.querySelectorAll('.screen-section').forEach(s => s.classList.add('hidden'));
  
  // Show target
  const target = document.getElementById(`screen-${name}`);
  if (target) {
    target.classList.remove('hidden');
    STATE.currentScreen = name;
  }

  // Update nav items
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.screen === name);
  });

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) toggleSidebar();

  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;

  // Load screen data
  const loaders = {
    home: loadHomeScreen,
    materias: loadMaterias,
    ranking: loadRanking,
    descobrir: loadFeed,
    chat: loadChatRooms,
    perfil: loadPerfil,
    notificacoes: loadNotificacoes,
    adm: loadAdm
  };
  if (loaders[name]) loaders[name]();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden');
}

/* ==================== HOME ==================== */
async function loadHomeScreen() {
  if (!STATE.userData) return;
  const u = STATE.userData;

  // Refresh user data
  const fresh = await dbGet(`users/${STATE.user.uid}`);
  if (fresh) { STATE.userData = fresh; updateSidebarUser(); }

  const pts = fresh?.points || 0;
  const level = getLevel(pts);
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
  const curThreshold = LEVEL_THRESHOLDS[level];
  const pct = Math.min(((pts - curThreshold) / (nextThreshold - curThreshold)) * 100, 100);

  setEl('home-xp-badge', `Nível ${level + 1} — ${LEVEL_NAMES[level]}`);
  setEl('stat-pontos', formatPts(pts));
  setEl('stat-quizzes', fresh?.quizzesPlayed || 0);
  setEl('progress-text', `${pts} / ${nextThreshold} pts`);
  animateWidth('progress-fill', pct);

  // Count matérias
  const materias = await dbGet('materias');
  let myMaterias = 0;
  if (materias) {
    myMaterias = Object.values(materias).filter(m => m.autorId === STATE.user.uid).length;
    setEl('stat-materias', myMaterias);
  }

  // Rank position
  const users = await dbGet('users');
  if (users) {
    const sorted = Object.values(users).sort((a,b) => (b.points||0) - (a.points||0));
    const pos = sorted.findIndex(u => u.uid === STATE.user.uid);
    setEl('stat-rank', pos >= 0 ? `#${pos+1}` : '#--');
  }

  // Recent feed
  loadRecentFeed();
}

async function loadRecentFeed() {
  const container = document.getElementById('home-feed');
  const posts = await dbGet('posts');
  if (!posts) { container.innerHTML = '<div class="empty-state">Sem atividade ainda</div>'; return; }

  const arr = Object.entries(posts).map(([id, p]) => ({id, ...p}))
    .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
    .slice(0, 5);

  if (!arr.length) { container.innerHTML = '<div class="empty-state">Sem atividade ainda</div>'; return; }

  container.innerHTML = arr.map(p => renderFeedItem(p, true)).join('');
}

/* ==================== MATÉRIAS ==================== */
async function loadMaterias() {
  const container = document.getElementById('materias-grid');
  container.innerHTML = '<div class="empty-state">Carregando...</div>';

  dbListen('materias', (snap) => {
    const materias = snap.val();
    if (!materias) { container.innerHTML = '<div class="empty-state">Nenhuma matéria. Crie a primeira!</div>'; return; }

    const arr = Object.entries(materias).map(([id, m]) => ({id, ...m}))
      .sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

    renderMaterias(arr);
  });
}

function renderMaterias(arr) {
  const container = document.getElementById('materias-grid');
  const filter = STATE.materiaFilter;
  const search = (document.getElementById('search-materias')?.value || '').toLowerCase();

  let filtered = arr.filter(m => {
    const matchFilter = filter === 'all' || (filter === 'mine' && m.autorId === STATE.user.uid) || (filter === 'public' && m.visibilidade === 'public');
    const matchSearch = !search || m.nome?.toLowerCase().includes(search) || m.descricao?.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">Nenhuma matéria encontrada</div>';
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="materia-card" onclick="openMateria('${m.id}')">
      <div class="materia-icon-wrap">${m.icone || '📚'}</div>
      <div class="materia-info">
        <div class="materia-nome">${esc(m.nome)}</div>
        <div class="materia-desc">${esc(m.descricao || 'Sem descrição')}</div>
        <div class="materia-meta">
          <span class="materia-tag">👤 ${esc(m.autorNome || 'Anônimo')}</span>
          <span class="materia-tag">📝 ${m.topicosCount || 0} tópicos</span>
          <span class="materia-tag">${m.visibilidade === 'public' ? '🌍' : '🔒'}</span>
        </div>
      </div>
      <div class="materia-actions">
        ${m.autorId === STATE.user.uid ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation(); deleteMateria('${m.id}')">🗑</button>` : ''}
      </div>
    </div>
  `).join('');
}

function setMateriaFilter(filter, btn) {
  STATE.materiaFilter = filter;
  document.querySelectorAll('#screen-materias .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  // Trigger re-render via listener
  loadMaterias();
}

function filterMaterias() { loadMaterias(); }

async function openMateria(id) {
  STATE.currentMateriaId = id;
  const m = await dbGet(`materias/${id}`);
  if (!m) return toast('Matéria não encontrada', 'error');

  setEl('materia-hero-icon', m.icone || '📚');
  setEl('materia-hero-nome', m.nome);
  setEl('materia-hero-desc', m.descricao || 'Sem descrição');
  setEl('materia-hero-autor', `Por: ${m.autorNome || 'Anônimo'}`);
  setEl('materia-hero-topicos', `${m.topicosCount || 0} tópicos`);

  showScreen('materia-detalhe');
  loadTopicos(id);
  loadQuizzesMateria(id);
}

async function loadTopicos(materiaId) {
  const container = document.getElementById('topicos-list');
  const topicos = await dbGet(`topicos/${materiaId}`);

  if (!topicos) {
    container.innerHTML = '<div class="empty-state">Nenhum tópico ainda. Crie o primeiro!</div>';
    return;
  }

  const arr = Object.entries(topicos).map(([id, t]) => ({id, ...t}))
    .sort((a,b) => (a.createdAt||0) - (b.createdAt||0));

  container.innerHTML = arr.map(t => `
    <div class="topico-item" onclick="openTopico('${t.id}')">
      <div class="topico-item-icon">📄</div>
      <div class="topico-item-info">
        <div class="topico-item-title">${esc(t.titulo)}</div>
        <div class="topico-item-meta">Por ${esc(t.autorNome || 'Anônimo')} · ${timeAgo(t.createdAt)}</div>
      </div>
      ${t.autorId === STATE.user.uid ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation(); deleteTopico('${t.id}')">🗑</button>` : '→'}
    </div>
  `).join('');
}

async function openTopico(id) {
  STATE.currentTopicoId = id;
  const t = await dbGet(`topicos/${STATE.currentMateriaId}/${id}`);
  if (!t) return toast('Tópico não encontrado', 'error');

  setEl('topico-title', t.titulo);
  setEl('topico-meta', `Por ${esc(t.autorNome || 'Anônimo')} · ${timeAgo(t.createdAt)}${t.tags ? ` · Tags: ${t.tags}` : ''}`);
  setEl('topico-body', t.conteudo);

  showScreen('topico-detalhe');
  loadComments(id);
}

async function loadComments(topicoId) {
  const container = document.getElementById('topico-comentarios');
  const comments = await dbGet(`comentarios/${STATE.currentMateriaId}/${topicoId}`);

  if (!comments) { container.innerHTML = '<div class="empty-state">Sem comentários ainda. Seja o primeiro!</div>'; return; }

  const arr = Object.entries(comments).map(([id, c]) => ({id, ...c})).sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  container.innerHTML = arr.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${c.autorAvatar || getInitial(c.autorNome)}</div>
        <span class="comment-author">${esc(c.autorNome || 'Anônimo')}</span>
        <span class="comment-time">${timeAgo(c.createdAt)}</span>
      </div>
      <div class="comment-text">${esc(c.texto)}</div>
    </div>
  `).join('');
}

async function addComment() {
  const input = document.getElementById('new-comment');
  const text = input.value.trim();
  if (!text) return;

  const comment = {
    texto: text,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    autorAvatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  };

  const key = await dbPush(`comentarios/${STATE.currentMateriaId}/${STATE.currentTopicoId}`, comment);
  if (key) {
    input.value = '';
    loadComments(STATE.currentTopicoId);
    await addPoints(5, 'Comentário adicionado');
  }
}

/* ==================== CRUD: CRIAR MATÉRIA ==================== */
async function criarMateria() {
  const nome = document.getElementById('nm-nome').value.trim();
  const desc = document.getElementById('nm-desc').value.trim();
  const vis = document.querySelector('input[name="nm-vis"]:checked').value;
  const icone = STATE.selectedEmoji.materia || '📚';

  if (!nome) return toast('Nome da matéria é obrigatório', 'error');

  const materia = {
    nome,
    descricao: desc,
    visibilidade: vis,
    icone,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    topicosCount: 0,
    createdAt: Date.now()
  };

  const key = await dbPush('materias', materia);
  if (key) {
    closeModal('modal-nova-materia');
    document.getElementById('nm-nome').value = '';
    document.getElementById('nm-desc').value = '';
    
    // Update user stats
    await dbUpdate(`users/${STATE.user.uid}`, { materiasCreated: (STATE.userData.materiasCreated||0) + 1 });
    await addPoints(20, 'Matéria criada');
    
    toast('Matéria criada com sucesso! 📚', 'success');
    
    // Add to feed
    await dbPush('posts', {
      tipo: 'atividade',
      texto: `criou a matéria "${nome}" ${icone}`,
      autorId: STATE.user.uid,
      autorNome: STATE.userData.name,
      autorAvatar: STATE.userData.avatar || '🎓',
      createdAt: Date.now()
    });
  } else {
    toast('Erro ao criar matéria. Tente novamente.', 'error');
  }
}

/* ==================== CRUD: CRIAR TÓPICO ==================== */
async function criarTopico() {
  const titulo = document.getElementById('nt-titulo').value.trim();
  const conteudo = document.getElementById('nt-conteudo').value.trim();
  const tags = document.getElementById('nt-tags').value.trim();

  if (!titulo || !conteudo) return toast('Título e conteúdo são obrigatórios', 'error');
  if (!STATE.currentMateriaId) return toast('Selecione uma matéria primeiro', 'error');

  const topico = {
    titulo, conteudo, tags,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    createdAt: Date.now()
  };

  const key = await dbPush(`topicos/${STATE.currentMateriaId}`, topico);
  if (key) {
    // Update matéria counter
    const m = await dbGet(`materias/${STATE.currentMateriaId}`);
    if (m) await dbUpdate(`materias/${STATE.currentMateriaId}`, { topicosCount: (m.topicosCount||0)+1 });

    closeModal('modal-novo-topico');
    document.getElementById('nt-titulo').value = '';
    document.getElementById('nt-conteudo').value = '';
    document.getElementById('nt-tags').value = '';
    
    await addPoints(15, 'Tópico criado');
    toast('Tópico criado! 📝', 'success');
    loadTopicos(STATE.currentMateriaId);
  } else {
    toast('Erro ao criar tópico', 'error');
  }
}

/* ==================== DELETE ==================== */
async function deleteMateria(id) {
  if (!confirm('Excluir esta matéria e todos os seus tópicos?')) return;
  await dbRemove(`materias/${id}`);
  await dbRemove(`topicos/${id}`);
  toast('Matéria excluída', 'info');
}

async function deleteTopico(id) {
  if (!confirm('Excluir este tópico?')) return;
  await dbRemove(`topicos/${STATE.currentMateriaId}/${id}`);
  // Update counter
  const m = await dbGet(`materias/${STATE.currentMateriaId}`);
  if (m && m.topicosCount > 0) await dbUpdate(`materias/${STATE.currentMateriaId}`, { topicosCount: m.topicosCount - 1 });
  loadTopicos(STATE.currentMateriaId);
  toast('Tópico excluído', 'info');
}

/* ==================== QUIZ BUILDER ==================== */
let quizQuestions = [];

function showModal(id) {
  if (id === 'modal-novo-quiz') {
    quizQuestions = [];
    document.getElementById('quiz-questions-builder').innerHTML = '';
    addQuizQuestion(); // start with 1 question
  }
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function addQuizQuestion() {
  const idx = quizQuestions.length;
  quizQuestions.push({ pergunta: '', opcoes: ['','','',''], correta: 0 });

  const div = document.createElement('div');
  div.className = 'qb-item';
  div.id = `qb-${idx}`;
  div.innerHTML = `
    <div class="qb-item-header">
      <span class="qb-item-title">Questão ${idx + 1}</span>
      ${idx > 0 ? `<button class="btn-sm btn-danger" onclick="removeQuestion(${idx})">Remover</button>` : ''}
    </div>
    <div class="field-group">
      <label>Pergunta</label>
      <div class="input-wrap">
        <input type="text" placeholder="Digite a pergunta..." oninput="quizQuestions[${idx}].pergunta=this.value" />
      </div>
    </div>
    <div class="qb-opts">
      <label style="font-size:0.82rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;display:block;">Opções (marque a correta)</label>
      ${['A','B','C','D'].map((l,i) => `
        <div class="qb-opt">
          <input type="radio" name="correct-${idx}" value="${i}" ${i===0?'checked':''} onchange="quizQuestions[${idx}].correta=${i}" />
          <span style="font-weight:700;font-size:0.85rem;width:16px">${l})</span>
          <input type="text" placeholder="Opção ${l}" oninput="quizQuestions[${idx}].opcoes[${i}]=this.value" />
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('quiz-questions-builder').appendChild(div);
}

function removeQuestion(idx) {
  quizQuestions.splice(idx, 1);
  document.getElementById(`qb-${idx}`).remove();
}

async function salvarQuiz() {
  const nome = document.getElementById('nq-nome').value.trim();
  const tempo = parseInt(document.getElementById('nq-tempo').value) || 30;

  if (!nome) return toast('Nome do quiz é obrigatório', 'error');
  if (!STATE.currentMateriaId) return toast('Acesse uma matéria primeiro', 'error');

  // Validate questions
  const valid = quizQuestions.filter(q => q.pergunta.trim() && q.opcoes.filter(o => o.trim()).length >= 2);
  if (valid.length < 1) return toast('Adicione pelo menos 1 questão completa', 'error');

  const quiz = {
    nome,
    tempo,
    materiaId: STATE.currentMateriaId,
    questoes: valid,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    totalPlays: 0,
    createdAt: Date.now()
  };

  const key = await dbPush(`quizzes/${STATE.currentMateriaId}`, quiz);
  if (key) {
    closeModal('modal-novo-quiz');
    await addPoints(30, 'Quiz criado');
    toast(`Quiz criado com ${valid.length} questão(ões)! 🎮`, 'success');
    loadQuizzesMateria(STATE.currentMateriaId);
  } else {
    toast('Erro ao salvar quiz', 'error');
  }
}

async function loadQuizzesMateria(materiaId) {
  const container = document.getElementById('quizzes-materia');
  const quizzes = await dbGet(`quizzes/${materiaId}`);

  if (!quizzes) { container.innerHTML = '<div class="empty-state">Nenhum quiz ainda</div>'; return; }

  const arr = Object.entries(quizzes).map(([id, q]) => ({id, ...q}));
  container.innerHTML = arr.map(q => `
    <div class="quiz-item">
      <div class="quiz-item-info">
        <div class="quiz-item-name">🎮 ${esc(q.nome)}</div>
        <div class="quiz-item-meta">${q.questoes?.length || 0} questões · ${q.tempo}s/questão · ${q.totalPlays||0} jogadas</div>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center">
        <button class="btn-primary btn-sm" onclick="startQuiz('${materiaId}','${q.id}')">▶ Jogar</button>
        ${q.autorId === STATE.user.uid ? `<button class="btn-sm btn-danger" onclick="deleteQuiz('${materiaId}','${q.id}')">🗑</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function deleteQuiz(materiaId, quizId) {
  if (!confirm('Excluir este quiz?')) return;
  await dbRemove(`quizzes/${materiaId}/${quizId}`);
  loadQuizzesMateria(materiaId);
  toast('Quiz excluído', 'info');
}

/* ==================== QUIZ GAME ==================== */
async function startQuiz(materiaId, quizId) {
  const quiz = await dbGet(`quizzes/${materiaId}/${quizId}`);
  if (!quiz) return toast('Quiz não encontrado', 'error');
  if (!quiz.questoes?.length) return toast('Quiz sem questões', 'error');

  STATE.currentQuiz = { ...quiz, id: quizId, materiaId };

  const qs = STATE.quizState;
  qs.questions = shuffle([...quiz.questoes]);
  qs.currentIndex = 0;
  qs.score = 0;
  qs.correct = 0;
  qs.startTime = Date.now();
  qs.answers = [];

  showScreen('quiz');
  renderQuizQuestion();

  // Update play count
  dbUpdate(`quizzes/${materiaId}/${quizId}`, { totalPlays: (quiz.totalPlays||0) + 1 });
}

function renderQuizQuestion() {
  const qs = STATE.quizState;
  const q = qs.questions[qs.currentIndex];
  if (!q) { finishQuiz(); return; }

  const total = qs.questions.length;
  const idx = qs.currentIndex;

  setEl('quiz-q-counter', `${idx+1}/${total}`);
  setEl('quiz-q-num', `Questão ${idx+1}`);
  setEl('quiz-question', q.pergunta);
  animateWidth('quiz-progress-fill', ((idx) / total) * 100);

  const opts = q.opcoes;
  const letters = ['A','B','C','D'];
  document.getElementById('quiz-options').innerHTML = opts.map((opt, i) => `
    <button class="quiz-opt" onclick="selectAnswer(${i})" id="quiz-opt-${i}">
      <div class="quiz-opt-letter">${letters[i]}</div>
      <span>${esc(opt)}</span>
    </button>
  `).join('');

  // Start timer
  clearQuizTimer();
  qs.timeLeft = STATE.currentQuiz.tempo || 30;
  updateTimerDisplay();
  qs.timerInterval = setInterval(() => {
    qs.timeLeft--;
    updateTimerDisplay();
    if (qs.timeLeft <= 0) {
      clearQuizTimer();
      selectAnswer(-1); // timeout = wrong
    }
    if (qs.timeLeft <= 5) {
      document.getElementById('quiz-timer').classList.add('danger');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('quiz-timer');
  if (el) el.textContent = `⏱ ${STATE.quizState.timeLeft}s`;
}

function clearQuizTimer() {
  if (STATE.quizState.timerInterval) {
    clearInterval(STATE.quizState.timerInterval);
    STATE.quizState.timerInterval = null;
  }
  document.getElementById('quiz-timer')?.classList.remove('danger');
}

function selectAnswer(chosen) {
  clearQuizTimer();
  const qs = STATE.quizState;
  const q = qs.questions[qs.currentIndex];
  const correct = q.correta;
  const isCorrect = chosen === correct;

  // Disable all buttons
  document.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    if (i === chosen && !isCorrect) btn.classList.add('wrong');
  });

  if (isCorrect) {
    const pts = Math.max(10, Math.round(10 + (qs.timeLeft / (STATE.currentQuiz.tempo||30)) * 10));
    qs.score += pts;
    qs.correct++;
    qs.answers.push({ pergunta: q.pergunta, chosen, correct, isCorrect, pts });
  } else {
    qs.answers.push({ pergunta: q.pergunta, chosen, correct, isCorrect, pts: 0 });
  }

  setEl('quiz-score-live', qs.score);

  // Next question after delay
  setTimeout(() => {
    qs.currentIndex++;
    if (qs.currentIndex < qs.questions.length) {
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  }, 1200);
}

async function finishQuiz() {
  clearQuizTimer();
  const qs = STATE.quizState;
  const total = qs.questions.length;
  const elapsed = Math.round((Date.now() - qs.startTime) / 1000);
  const pct = Math.round((qs.correct / total) * 100);

  // Bonus points for completion
  const bonus = pct >= 80 ? 50 : pct >= 60 ? 25 : pct >= 40 ? 10 : 0;
  const totalPts = qs.score + bonus;

  // Save to DB
  const history = {
    quizId: STATE.currentQuiz.id,
    quizNome: STATE.currentQuiz.nome,
    materiaId: STATE.currentQuiz.materiaId,
    score: totalPts,
    acertos: qs.correct,
    total,
    pct,
    tempo: elapsed,
    createdAt: Date.now()
  };

  await dbPush(`historico/${STATE.user.uid}`, history);
  await addPoints(totalPts, `Quiz: ${STATE.currentQuiz.nome}`);
  await dbUpdate(`users/${STATE.user.uid}`, { quizzesPlayed: (STATE.userData.quizzesPlayed||0) + 1 });

  // Notifications
  if (pct === 100) await addNotification(STATE.user.uid, '🏆 Quiz perfeito! Você acertou 100%!', 'achievement');
  else if (pct >= 80) await addNotification(STATE.user.uid, `⭐ Ótimo! ${pct}% de acerto no quiz "${STATE.currentQuiz.nome}"`, 'achievement');

  // Add to feed
  await dbPush('posts', {
    tipo: 'atividade',
    texto: `completou o quiz "${STATE.currentQuiz.nome}" com ${pct}% de acerto`,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    autorAvatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  });

  // Show resultado
  showScreen('resultado');

  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '😅' : '💪';
  const titulo = pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : pct >= 40 ? 'Continue praticando!' : 'Não desista!';

  setEl('resultado-emoji', emoji);
  setEl('resultado-titulo', titulo);
  setEl('resultado-subtitulo', `${STATE.currentQuiz.nome}`);
  setEl('res-acertos', qs.correct);
  setEl('res-total', total);
  setEl('res-pontos', `+${totalPts}`);
  setEl('res-tempo', `${elapsed}s`);
  setEl('resultado-pct', `${pct}% de acerto`);
  animateWidth('resultado-barra-fill', pct);

  // Review
  document.getElementById('resultado-review').innerHTML = qs.answers.map(a => `
    <div class="review-item ${a.isCorrect ? 'review-correct' : 'review-wrong'}">
      <strong>${a.isCorrect ? '✅' : '❌'} ${esc(a.pergunta)}</strong>
      ${!a.isCorrect ? `<br><span>Resposta correta: Opção ${['A','B','C','D'][a.correct]}</span>` : ''}
      ${a.isCorrect ? `<span style="float:right;font-weight:700;color:var(--success)">+${a.pts}pts</span>` : ''}
    </div>
  `).join('');

  if (pct >= 80) launchConfetti();
}

function exitQuiz() {
  clearQuizTimer();
  if (confirm('Sair do quiz? O progresso será perdido.')) {
    showScreen('materia-detalhe');
  }
}

/* ==================== RANKING ==================== */
async function loadRanking() {
  const container = document.getElementById('ranking-list');
  container.innerHTML = '<div class="empty-state">Carregando...</div>';

  dbListen('users', (snap) => {
    const users = snap.val();
    if (!users) return;

    const arr = Object.values(users).filter(u => u.uid).sort((a,b) => (b.points||0) - (a.points||0));
    const top50 = arr.slice(0, 50);

    // Pódio
    const setP = (n, u) => {
      if (!u) return;
      setEl(`podio${n}-av`, u.avatar || getInitial(u.name));
      setEl(`podio${n}-name`, (u.name||'').split(' ')[0]);
      setEl(`podio${n}-pts`, formatPts(u.points||0));
    };
    setP(1, top50[0]); setP(2, top50[1]); setP(3, top50[2]);

    // My position
    const myPos = arr.findIndex(u => u.uid === STATE.user.uid);
    setEl('my-rank-num', myPos >= 0 ? `#${myPos+1}` : '#--');
    setEl('my-rank-pts', formatPts(arr[myPos]?.points || 0));

    // List
    container.innerHTML = top50.map((u, i) => `
      <div class="ranking-item ${u.uid === STATE.user.uid ? 'rank-me' : ''}" onclick="viewUserProfile('${u.uid}')">
        <div class="rank-pos ${i<3?'top3':''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</div>
        <div class="rank-avatar">${u.avatar || getInitial(u.name)}</div>
        <div class="rank-info">
          <div class="rank-name">${esc(u.name||'Usuário')} ${u.uid===STATE.user.uid?'(Você)':''}</div>
          <div class="rank-sub">Nível ${getLevel(u.points||0)+1} · ${u.quizzesPlayed||0} quizzes</div>
        </div>
        <div class="rank-pts">${formatPts(u.points||0)} pts</div>
      </div>
    `).join('');
  });
}

/* ==================== DESCOBRIR / FEED ==================== */
async function loadFeed() {
  const container = document.getElementById('descobrir-feed');
  container.innerHTML = '<div class="empty-state">Carregando...</div>';

  dbListen('posts', (snap) => {
    const posts = snap.val();
    if (!posts) { container.innerHTML = '<div class="empty-state">Nenhum post ainda. Seja o primeiro!</div>'; return; }

    const arr = Object.entries(posts).map(([id, p]) => ({id, ...p}))
      .filter(p => {
        if (STATE.feedFilter === 'all') return true;
        return p.tipo === STATE.feedFilter;
      })
      .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
      .slice(0, 50);

    if (!arr.length) { container.innerHTML = '<div class="empty-state">Nenhum post encontrado</div>'; return; }
    container.innerHTML = arr.map(p => renderFeedItem(p)).join('');
  });
}

function renderFeedItem(p, compact = false) {
  const tipo = p.tipo || 'post';
  const tipoLabel = { post: '💬 Post', dica: '💡 Dica', duvida: '❓ Dúvida', atividade: '⚡ Atividade' }[tipo] || tipo;
  const tipoClass = { post: 'type-post', dica: 'type-dica', duvida: 'type-duvida', atividade: 'type-post' }[tipo] || 'type-post';
  const likes = p.likes ? Object.keys(p.likes).length : 0;
  const liked = p.likes && STATE.user && p.likes[STATE.user.uid];

  return `
    <div class="feed-item" id="post-${p.id||''}">
      <div class="feed-item-header">
        <div class="feed-avatar">${p.autorAvatar || getInitial(p.autorNome)}</div>
        <div class="feed-meta">
          <div class="feed-author">${esc(p.autorNome || 'Anônimo')}</div>
          <div class="feed-time">${timeAgo(p.createdAt)}</div>
        </div>
        <span class="feed-type-badge ${tipoClass}">${tipoLabel}</span>
      </div>
      <div class="feed-text">${esc(p.texto)}</div>
      ${!compact ? `
      <div class="feed-actions">
        <button class="feed-action-btn ${liked?'liked':''}" onclick="toggleLike('${p.id}')">
          ${liked?'❤️':'🤍'} ${likes}
        </button>
        <button class="feed-action-btn" onclick="viewUserProfile('${p.autorId}')">👤 Ver perfil</button>
        ${p.autorId === STATE.user?.uid ? `<button class="feed-action-btn" style="color:var(--danger)" onclick="deletePost('${p.id}')">🗑 Excluir</button>` : ''}
      </div>
      ` : ''}
    </div>
  `;
}

async function createPost() {
  const text = document.getElementById('new-post-text').value.trim();
  if (!text) return toast('Escreva algo antes de publicar', 'error');
  if (text.length < 5) return toast('Post muito curto', 'error');

  const post = {
    texto: text,
    tipo: STATE.postType,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    autorAvatar: STATE.userData.avatar || '🎓',
    likes: {},
    createdAt: Date.now()
  };

  const key = await dbPush('posts', post);
  if (key) {
    document.getElementById('new-post-text').value = '';
    await addPoints(10, 'Post publicado');
    toast('Publicado! 🎉', 'success');
  } else {
    toast('Erro ao publicar', 'error');
  }
}

async function toggleLike(postId) {
  if (!postId || !STATE.user) return;
  const path = `posts/${postId}/likes/${STATE.user.uid}`;
  const exists = await dbGet(path);
  if (exists) {
    await dbRemove(path);
  } else {
    await dbSet(path, true);
    // Notify post author
    const post = await dbGet(`posts/${postId}`);
    if (post && post.autorId !== STATE.user.uid) {
      await addNotification(post.autorId, `❤️ ${STATE.userData.name} curtiu seu post`, 'like');
    }
  }
}

async function deletePost(postId) {
  if (!confirm('Excluir este post?')) return;
  await dbRemove(`posts/${postId}`);
  toast('Post excluído', 'info');
}

function setPostType(type, btn) {
  STATE.postType = type;
  document.querySelectorAll('.ptype-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setFeedFilter(filter, btn) {
  STATE.feedFilter = filter;
  document.querySelectorAll('#screen-descobrir .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadFeed();
}

/* ==================== CHAT ==================== */
async function loadChatRooms() {
  const container = document.getElementById('rooms-list');

  dbListen('chat_rooms', (snap) => {
    const rooms = snap.val();
    if (!rooms) { container.innerHTML = '<div class="room-item"><div class="room-name">Nenhuma sala</div></div>'; return; }

    const arr = Object.entries(rooms).map(([id, r]) => ({id, ...r})).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    container.innerHTML = arr.map(r => `
      <div class="room-item ${STATE.currentRoom===r.id?'active':''}" onclick="joinRoom('${r.id}')">
        <div class="room-name"># ${esc(r.nome)}</div>
        <div class="room-last">${esc(r.lastMessage || r.descricao || 'Sem mensagens')}</div>
      </div>
    `).join('');
  });
}

async function joinRoom(roomId) {
  STATE.currentRoom = roomId;
  const room = await dbGet(`chat_rooms/${roomId}`);
  if (!room) return;

  setEl('chat-room-name', '# ' + room.nome);
  setEl('chat-room-members', room.descricao || '');

  document.getElementById('chat-no-room').classList.add('hidden');
  document.getElementById('chat-room-view').classList.remove('hidden');

  // Remove old listener
  if (STATE.chatListener) { STATE.chatListener(); STATE.chatListener = null; }

  // Update rooms UI
  document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));

  // Listen to messages
  const ref = dbRef(`chat_messages/${roomId}`);
  STATE.chatListener = getFirebase().onValue(ref, (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('chat-messages');
    if (!msgs) { container.innerHTML = '<div class="empty-state">Sem mensagens ainda. Diga olá! 👋</div>'; return; }

    const arr = Object.entries(msgs).map(([id, m]) => ({id, ...m})).sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
    const mine = arr.map(m => {
      const isMe = m.autorId === STATE.user.uid;
      return `
        <div class="chat-msg ${isMe?'mine':''}">
          <div class="chat-msg-avatar">${m.autorAvatar || getInitial(m.autorNome)}</div>
          <div class="chat-msg-bubble">
            <div class="chat-msg-name">${esc(m.autorNome || 'Anônimo')}</div>
            <div class="chat-msg-text">${esc(m.texto)}</div>
            <div class="chat-msg-time">${timeAgo(m.createdAt)}</div>
          </div>
        </div>
      `;
    }).join('');
    container.innerHTML = mine;
    container.scrollTop = container.scrollHeight;
  });
}

async function sendChatMessage() {
  const input = document.getElementById('chat-msg-input');
  const text = input.value.trim();
  if (!text || !STATE.currentRoom) return;

  const msg = {
    texto: text,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    autorAvatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  };

  await dbPush(`chat_messages/${STATE.currentRoom}`, msg);
  await dbUpdate(`chat_rooms/${STATE.currentRoom}`, { lastMessage: text.slice(0, 50) });
  input.value = '';
}

async function criarSala() {
  const nome = document.getElementById('ns-nome').value.trim();
  const desc = document.getElementById('ns-desc').value.trim();
  if (!nome) return toast('Nome da sala é obrigatório', 'error');

  const sala = { nome, descricao: desc, criadorId: STATE.user.uid, createdAt: Date.now() };
  const key = await dbPush('chat_rooms', sala);
  if (key) {
    closeModal('modal-nova-sala');
    document.getElementById('ns-nome').value = '';
    document.getElementById('ns-desc').value = '';
    toast('Sala criada! 💬', 'success');
    joinRoom(key);
  }
}

/* ==================== PERFIL ==================== */
async function loadPerfil() {
  const fresh = await dbGet(`users/${STATE.user.uid}`);
  if (fresh) STATE.userData = fresh;
  const u = STATE.userData;

  setEl('perfil-avatar', u.avatar || '🎓');
  setEl('perfil-name', u.name || 'Usuário');
  setEl('perfil-email', u.email || STATE.user.email || '');
  setEl('pstat-pts', formatPts(u.points||0));
  setEl('pstat-quizzes', u.quizzesPlayed||0);
  setEl('pstat-materias', u.materiasCreated||0);
  setEl('pstat-seguidores', u.followers||0);

  document.getElementById('edit-name').value = u.name || '';
  document.getElementById('edit-bio').value = u.bio || '';

  // Badges
  const badges = getBadges(u);
  document.getElementById('perfil-badges').innerHTML = badges.map(b => `<span class="badge ${b.class}">${b.label}</span>`).join('');

  // Histórico
  loadHistorico();
}

function getBadges(u) {
  const badges = [];
  if ((u.points||0) >= 1000) badges.push({label:'⭐ 1K pts', class:'badge-gold'});
  if ((u.quizzesPlayed||0) >= 10) badges.push({label:'🎮 Gamer', class:'badge-blue'});
  if ((u.materiasCreated||0) >= 3) badges.push({label:'📚 Criador', class:'badge-silver'});
  if (u.isAdmin) badges.push({label:'⚙️ Admin', class:'badge-gold'});
  if (!badges.length) badges.push({label:'🌱 Novato', class:'badge-silver'});
  return badges;
}

async function loadHistorico() {
  const container = document.getElementById('perfil-historico');
  const hist = await dbGet(`historico/${STATE.user.uid}`);
  if (!hist) { container.innerHTML = '<div class="empty-state">Nenhum quiz realizado ainda</div>'; return; }

  const arr = Object.entries(hist).map(([id, h]) => ({id, ...h})).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  container.innerHTML = arr.map(h => `
    <div class="historico-item">
      <div class="hist-icon">🎮</div>
      <div class="hist-info">
        <div class="hist-name">${esc(h.quizNome||'Quiz')}</div>
        <div class="hist-meta">${h.acertos}/${h.total} acertos · ${h.pct}% · ${timeAgo(h.createdAt)}</div>
      </div>
      <div class="hist-pts">+${formatPts(h.score)}</div>
    </div>
  `).join('');
}

async function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  if (!name) return toast('Nome é obrigatório', 'error');

  const ok = await dbUpdate(`users/${STATE.user.uid}`, { name, bio });
  if (ok) {
    STATE.userData.name = name;
    STATE.userData.bio = bio;
    await getFirebase().updateProfile(fauth().currentUser, { displayName: name });
    updateSidebarUser();
    setEl('perfil-name', name);
    toast('Perfil salvo! ✅', 'success');
  }
}

/* ==================== AVATAR ==================== */
function loadAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;
  grid.innerHTML = AVATARS.map(a => `
    <button class="avatar-opt ${a === (STATE.userData?.avatar||'🎓') ? 'selected' : ''}" onclick="selectAvatar('${a}', this)">${a}</button>
  `).join('');
}

function selectAvatar(emoji, btn) {
  STATE.selectedAvatar = emoji;
  document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

async function saveAvatar() {
  const avatar = STATE.selectedAvatar || '🎓';
  const ok = await dbUpdate(`users/${STATE.user.uid}`, { avatar });
  if (ok) {
    STATE.userData.avatar = avatar;
    updateSidebarUser();
    setEl('perfil-avatar', avatar);
    closeModal('modal-edit-avatar');
    toast('Avatar atualizado! ' + avatar, 'success');
  }
}

/* ==================== NOTIFICAÇÕES ==================== */
function initRealtime() {
  // Listen to notifications
  dbListen(`notificacoes/${STATE.user.uid}`, (snap) => {
    const notifs = snap.val();
    if (!notifs) { setNotifBadge(0); return; }
    const arr = Object.values(notifs);
    const unread = arr.filter(n => !n.lida).length;
    setNotifBadge(unread);
  });

  // Create default chat room if none exists
  createDefaultRooms();
}

async function createDefaultRooms() {
  const rooms = await dbGet('chat_rooms');
  if (!rooms) {
    await dbPush('chat_rooms', { nome: 'Geral', descricao: 'Sala geral de bate-papo', criadorId: 'system', createdAt: Date.now() });
    await dbPush('chat_rooms', { nome: 'Dúvidas', descricao: 'Tire suas dúvidas aqui', criadorId: 'system', createdAt: Date.now() });
    await dbPush('chat_rooms', { nome: 'Quizzes', descricao: 'Fale sobre os quizzes', criadorId: 'system', createdAt: Date.now() });
  }
}

function setNotifBadge(count) {
  const badge = document.getElementById('notif-count');
  const btn = document.getElementById('notif-btn');
  if (count > 0) {
    badge?.classList.remove('hidden');
    if (badge) badge.textContent = count > 9 ? '9+' : count;
  } else {
    badge?.classList.add('hidden');
  }
}

async function addNotification(uid, mensagem, tipo = 'system') {
  await dbPush(`notificacoes/${uid}`, {
    mensagem, tipo,
    lida: false,
    createdAt: Date.now()
  });
}

async function loadNotificacoes() {
  const container = document.getElementById('notificacoes-list');
  const notifs = await dbGet(`notificacoes/${STATE.user.uid}`);
  if (!notifs) { container.innerHTML = '<div class="empty-state">Nenhuma notificação</div>'; return; }

  const arr = Object.entries(notifs).map(([id, n]) => ({id, ...n})).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  container.innerHTML = arr.map(n => `
    <div class="notif-item ${n.lida?'':'unread'}">
      <div class="notif-icon">${getNotifIcon(n.tipo)}</div>
      <div class="notif-content">
        <div class="notif-msg">${esc(n.mensagem)}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('');

  // Mark all as read
  const updates = {};
  arr.forEach(n => { if (!n.lida) updates[`notificacoes/${STATE.user.uid}/${n.id}/lida`] = true; });
  if (Object.keys(updates).length) {
    await getFirebase().update(dbRef(''), updates);
  }
  setNotifBadge(0);
}

function getNotifIcon(tipo) {
  return { system:'ℹ️', achievement:'🏆', like:'❤️', comment:'💬', follow:'👤' }[tipo] || '🔔';
}

async function markAllRead() {
  const notifs = await dbGet(`notificacoes/${STATE.user.uid}`);
  if (!notifs) return;
  const updates = {};
  Object.keys(notifs).forEach(id => { updates[`notificacoes/${STATE.user.uid}/${id}/lida`] = true; });
  await getFirebase().update(dbRef(''), updates);
  setNotifBadge(0);
  loadNotificacoes();
  toast('Todas lidas ✓', 'info');
}

/* ==================== POINTS & LEVELS ==================== */
async function addPoints(pts, reason = '') {
  const current = await dbGet(`users/${STATE.user.uid}/points`) || 0;
  const newPts = current + pts;
  await dbSet(`users/${STATE.user.uid}/points`, newPts);
  if (STATE.userData) STATE.userData.points = newPts;
  updateSidebarUser();

  // Check level up
  const oldLevel = getLevel(current);
  const newLevel = getLevel(newPts);
  if (newLevel > oldLevel) {
    toast(`🎉 Subiu para ${LEVEL_NAMES[newLevel]}! Nível ${newLevel+1}`, 'success');
    await addNotification(STATE.user.uid, `🎓 Parabéns! Você chegou ao nível ${newLevel+1}: ${LEVEL_NAMES[newLevel]}!`, 'achievement');
  }
}

function getLevel(pts) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

/* ==================== ADM PANEL ==================== */
async function loadAdm() {
  if (!STATE.userData?.isAdmin) {
    toast('Acesso negado. Apenas administradores.', 'error');
    showScreen('home');
    return;
  }

  // Stats
  const users = await dbGet('users');
  const materias = await dbGet('materias');
  const posts = await dbGet('posts');

  setEl('adm-total-users', users ? Object.keys(users).length : 0);
  setEl('adm-total-materias', materias ? Object.keys(materias).length : 0);
  setEl('adm-total-posts', posts ? Object.keys(posts).length : 0);

  // Count quizzes
  let totalQuizzes = 0;
  if (materias) {
    for (const mId of Object.keys(materias)) {
      const q = await dbGet(`quizzes/${mId}`);
      if (q) totalQuizzes += Object.keys(q).length;
    }
  }
  setEl('adm-total-quizzes', totalQuizzes);

  // Load users list
  admLoadUsers(users);
}

function admLoadUsers(users) {
  const container = document.getElementById('adm-users-list');
  if (!users) { container.innerHTML = '<div class="empty-state">Nenhum usuário</div>'; return; }

  const arr = Object.values(users).sort((a,b) => (b.points||0) - (a.points||0));
  container.innerHTML = arr.map(u => `
    <div class="adm-user-item">
      <div class="adm-user-avatar">${u.avatar || getInitial(u.name)}</div>
      <div class="adm-user-info">
        <div class="adm-user-name">${esc(u.name||'Usuário')} ${u.isAdmin?'⚙️':''}</div>
        <div class="adm-user-meta">${esc(u.email||'')} · ${formatPts(u.points||0)} pts · ${u.quizzesPlayed||0} quizzes</div>
      </div>
      <div class="adm-user-actions">
        ${!u.isAdmin ? `<button class="btn-sm btn-primary" onclick="admMakeAdmin('${u.uid}')">Tornar Admin</button>` : ''}
        ${u.uid !== STATE.user.uid ? `<button class="btn-sm btn-danger" onclick="admDeleteUser('${u.uid}')">Excluir</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function admSearchUser() {
  const q = document.getElementById('adm-search-user').value.toLowerCase();
  const users = await dbGet('users');
  if (!users) return;
  const filtered = {};
  Object.entries(users).forEach(([k,v]) => {
    if ((v.name||'').toLowerCase().includes(q) || (v.email||'').toLowerCase().includes(q)) filtered[k] = v;
  });
  admLoadUsers(filtered);
}

async function admMakeAdmin(uid) {
  if (!confirm('Tornar este usuário administrador?')) return;
  await dbUpdate(`users/${uid}`, { isAdmin: true });
  await addNotification(uid, '⚙️ Você foi promovido a administrador!', 'system');
  loadAdm();
  toast('Usuário promovido a admin ⚙️', 'success');
}

async function admDeleteUser(uid) {
  if (!confirm('ATENÇÃO: Excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) return;
  await dbRemove(`users/${uid}`);
  await dbRemove(`historico/${uid}`);
  await dbRemove(`notificacoes/${uid}`);
  loadAdm();
  toast('Usuário excluído', 'info');
}

function setAdmTab(tab, btn) {
  STATE.admTab = tab;
  document.querySelectorAll('#screen-adm .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.adm-tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(`adm-${tab}`).classList.remove('hidden');
}

/* ==================== VIEW USER PROFILE ==================== */
async function viewUserProfile(uid) {
  if (!uid) return;
  const u = await dbGet(`users/${uid}`);
  if (!u) return toast('Usuário não encontrado', 'error');

  const isMe = uid === STATE.user.uid;
  const badges = getBadges(u).map(b => `<span class="badge ${b.class}">${b.label}</span>`).join('');

  document.getElementById('modal-user-profile-body').innerHTML = `
    <div style="text-align:center;padding:1rem 0">
      <div style="font-size:3rem;margin-bottom:0.5rem">${u.avatar || '🎓'}</div>
      <h3 style="font-size:1.2rem;font-weight:800">${esc(u.name||'Usuário')}</h3>
      <p style="color:var(--text-muted);font-size:0.85rem;margin:0.25rem 0 0.75rem">${esc(u.bio || 'Sem bio ainda')}</p>
      <div style="display:flex;gap:0.4rem;justify-content:center;flex-wrap:wrap;margin-bottom:1rem">${badges}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem">
        <div class="pstat"><div class="pstat-val">${formatPts(u.points||0)}</div><div class="pstat-label">Pontos</div></div>
        <div class="pstat"><div class="pstat-val">${u.quizzesPlayed||0}</div><div class="pstat-label">Quizzes</div></div>
        <div class="pstat"><div class="pstat-val">${u.materiasCreated||0}</div><div class="pstat-label">Matérias</div></div>
      </div>
      ${!isMe ? `<button class="btn-primary btn-full" style="margin-top:1rem" onclick="followUser('${uid}')">👤 Seguir</button>` : ''}
    </div>
  `;
  showModal('modal-user-profile');
}

async function followUser(uid) {
  const me = STATE.user.uid;
  const following = await dbGet(`following/${me}/${uid}`);
  if (following) {
    await dbRemove(`following/${me}/${uid}`);
    const count = (await dbGet(`users/${uid}/followers`)||1) - 1;
    await dbSet(`users/${uid}/followers`, Math.max(0, count));
    toast('Deixou de seguir', 'info');
  } else {
    await dbSet(`following/${me}/${uid}`, true);
    const count = (await dbGet(`users/${uid}/followers`)||0) + 1;
    await dbSet(`users/${uid}/followers`, count);
    await addNotification(uid, `👤 ${STATE.userData.name} começou a te seguir!`, 'follow');
    toast('Seguindo! 👤', 'success');
  }
  closeModal('modal-user-profile');
}

/* ==================== EMOJI / MISC ==================== */
function selectEmoji(type, emoji, btn) {
  STATE.selectedEmoji[type] = emoji;
  document.querySelectorAll(`#emoji-picker-${type} .emoji-opt`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

/* ==================== CONFETTI ==================== */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({length: 120}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    color: ['#2563eb','#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'][Math.floor(Math.random()*6)],
    size: Math.random() * 8 + 4,
    rot: Math.random() * 360,
    vr: (Math.random()-0.5) * 5
  }));

  let frame = 0;
  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(loop);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.classList.add('hidden'); }
  };
  requestAnimationFrame(loop);
}

/* ==================== UTILS ==================== */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getInitial(name) {
  return (name || 'U').charAt(0).toUpperCase();
}

function formatPts(pts) {
  if (pts >= 1000) return (pts/1000).toFixed(1).replace('.0','') + 'K';
  return String(pts);
}

function timeAgo(ts) {
  if (!ts) return 'agora';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff/60)}min`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function animateWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) setTimeout(() => el.style.width = `${pct}%`, 50);
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function setLoading(btn, loading) {
  const span = btn.querySelector('span');
  const loader = btn.querySelector('.btn-loader');
  if (span) span.style.display = loading ? 'none' : 'inline';
  if (loader) loader.classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁' : '🙈';
}

/* ==================== TOAST ==================== */
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${esc(msg)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

/* ==================== KEYBOARD SHORTCUTS ==================== */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

/* ==================== SERVICE WORKER (optional offline) ==================== */
// Intentionally omitted for Firebase compatibility

console.log('EduConnect v1.0 — Plataforma pronta! ⚡');
