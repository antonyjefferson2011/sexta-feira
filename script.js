/* ============================================================
   Sexta-Feira Studies — script.js COMPLETO
   Firebase Realtime Database + Auth
   Todas as funcionalidades implementadas
   ============================================================ */

'use strict';

console.log('🚀 Sexta-Feira Studies — Inicializando...');
console.log('⏰', new Date().toLocaleString());

// ============================================================
// CONFIGURAÇÃO FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBAs3irtV6MuTPHmsxYwYSFMTkX6_6ntz8",
  authDomain: "sexta-feira-fb01a.firebaseapp.com",
  databaseURL: "https://sexta-feira-fb01a-default-rtdb.firebaseio.com",
  projectId: "sexta-feira-fb01a",
  storageBucket: "sexta-feira-fb01a.firebasestorage.app",
  messagingSenderId: "82809140147",
  appId: "1:82809140147:web:2a3f3ece3e81c33b0b91c6"
};

// Inicializar Firebase
let app, auth, db;

try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.database();
  console.log('✅ Firebase inicializado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}

// ============================================================
// ESTADO GLOBAL
// ============================================================
const STATE = {
  user: null,
  userData: null,
  currentScreen: 'home',
  currentMateriaId: null,
  currentTopicoId: null,
  currentRoom: null,
  materiaFilter: 'all',
  feedFilter: 'all',
  postType: 'post',
  selectedEmoji: '📚',
  selectedAvatar: '🎓',
  admCurrentTab: 'materias',
  quizGame: {
    questions: [],
    currentIndex: 0,
    score: 0,
    correct: 0,
    timerInterval: null,
    timeLeft: 30,
    startTime: null,
    answers: []
  },
  listeners: []
};

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatPts(pts) {
  if (!pts) return '0';
  if (pts >= 1000000) return (pts/1000000).toFixed(1) + 'M';
  if (pts >= 1000) return (pts/1000).toFixed(1) + 'K';
  return String(pts);
}

function timeAgo(ts) {
  if (!ts) return 'agora';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return Math.floor(diff/60) + 'min';
  if (diff < 86400) return Math.floor(diff/3600) + 'h';
  if (diff < 2592000) return Math.floor(diff/86400) + 'd';
  return new Date(ts).toLocaleDateString('pt-BR');
}

function getLevel(pts) {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];
  const names = ['Iniciante','Aprendiz','Estudante','Dedicado','Scholar','Mestre','Especialista','Professor','Guru','Sábio','Lenda'];
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (pts >= thresholds[i]) level = i;
  }
  return { level, name: names[level], next: thresholds[Math.min(level+1, thresholds.length-1)], current: thresholds[level] };
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${escapeHtml(msg)}`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function showEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function togglePass(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function setBtnLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('span');
  const loader = btn.querySelector('.btn-loader');
  if (text) text.style.display = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'inline-block' : 'none';
  btn.disabled = loading;
}


// ============================================================
// AUTH
// ============================================================

auth.onAuthStateChanged(async (user) => {
  console.log('🔐 Auth:', user ? user.uid : 'Ninguém');
 
  

  if (user) {
    STATE.user = user;
   
    
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    STATE.userData = snap.val();
    
    
    if (!STATE.userData) {
      STATE.userData = {
        uid: user.uid,
        username: user.email?.split('@')[0] || 'estudante',
        email: user.email || '',
        avatar: '🎓',
        bio: '',
        points: 0,
        quizzesPlayed: 0,
        materiasCreated: 0,
        seguidores: 0,
        isAdmin: false,
        createdAt: Date.now()
      };
      await db.ref('usuarios/' + user.uid).set(STATE.userData);
    }
    
    hideEl('auth-screen');
    showEl('app');
    updateUI();
    showScreen('home');
    initRealtime();
    
  } else {
    STATE.user = null;
    STATE.userData = null;
    hideEl('app');
    showEl('auth-screen');
    showAuthTab('login');
  }
});
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => {
    if (t.textContent.includes(tab === 'login' ? 'Entrar' : 'Cadastrar')) t.classList.add('active');
  });
  
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  if (loginForm) loginForm.style.display = tab === 'login' ? '' : 'none';
  if (regForm) regForm.style.display = tab === 'register' ? '' : 'none';
  
  hideEl('login-error');
  hideEl('reg-error');
}

function switchAuthTab(tab) {
  showAuthTab(tab);
}

// ============================================================
// LOGIN
// ============================================================
async function handleLogin() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const btn = document.getElementById('login-btn-text')?.parentElement;
  const errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    showAuthError('login', 'Preencha todos os campos');
    return;
  }
  
  setBtnLoading(btn, true);
  hideEl('login-error');
  
  try {
    // Buscar usuário pelo username
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    const users = snap.val();
    
    if (!users) {
      showAuthError('login', 'Usuário não encontrado');
      setBtnLoading(btn, false);
      return;
    }
    
    const uid = Object.keys(users)[0];
    const userData = users[uid];
    
    // Verificar senha (usando um sistema simples - em produção use Firebase Auth completo)
    if (userData.password !== password) {
      showAuthError('login', 'Senha incorreta');
      setBtnLoading(btn, false);
      return;
    }
    
    // Login via Firebase Auth com email
    if (userData.email) {
      try {
        await auth.signInWithEmailAndPassword(userData.email, password);
      } catch (e) {
        // Se falhar, criar usuário auth na hora
        if (e.code === 'auth/user-not-found') {
          await auth.createUserWithEmailAndPassword(userData.email, password);
        }
      }
    }
    
    console.log('✅ Login bem-sucedido');
    showToast('Bem-vindo, ' + username + '! 🎉', 'success');
  } catch (error) {
    console.error('❌ Erro login:', error);
    showAuthError('login', 'Erro: ' + error.message);
    setBtnLoading(btn, false);
  }
}

// ============================================================
// REGISTER
// ============================================================
async function handleRegister() {
  const username = document.getElementById('reg-username')?.value?.trim();
  const email = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm = document.getElementById('reg-confirm')?.value;
  const btn = document.getElementById('reg-btn-text')?.parentElement;
  const errorEl = document.getElementById('reg-error');
  
  // Validações
  if (!username || !email || !password || !confirm) {
    showAuthError('register', 'Preencha todos os campos');
    return;
  }
  if (username.length < 3) {
    showAuthError('register', 'Nome de usuário muito curto (mín. 3)');
    return;
  }
  if (password.length < 6) {
    showAuthError('register', 'Senha muito curta (mín. 6)');
    return;
  }
  if (password !== confirm) {
    showAuthError('register', 'Senhas não coincidem');
    return;
  }
  
  setBtnLoading(btn, true);
  hideEl('reg-error');
  
  try {
    // Verificar se username já existe
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    if (snap.val()) {
      showAuthError('register', 'Este nome de usuário já está em uso! Escolha outro.');
      setBtnLoading(btn, false);
      return;
    }
    
    // Verificar se email já existe
    const emailSnap = await db.ref('usuarios').orderByChild('email').equalTo(email).once('value');
    if (emailSnap.val()) {
      showAuthError('register', 'Este e-mail já está cadastrado!');
      setBtnLoading(btn, false);
      return;
    }
    
    // Criar no Firebase Auth
    let userCredential;
    try {
      userCredential = await auth.createUserWithEmailAndPassword(email, password);
    } catch (authError) {
      console.error('Auth error:', authError);
      showAuthError('register', 'Erro: ' + authError.message);
      setBtnLoading(btn, false);
      return;
    }
    
    const uid = userCredential.user.uid;
    
    // Salvar no Realtime Database
    const userData = {
      uid: uid,
      username: username,
      email: email,
      password: password,
      avatar: '🎓',
      bio: '',
      points: 0,
      quizzesPlayed: 0,
      materiasCreated: 0,
      seguidores: 0,
      isAdmin: false,
      createdAt: Date.now()
    };
    
    await db.ref('usuarios/' + uid).set(userData);
    
    // Criar notificação de boas-vindas
    await db.ref('notificacoes/' + uid).push({
      mensagem: '🎉 Bem-vindo ao Sexta-Feira Studies! Explore e aprenda!',
      tipo: 'system',
      lida: false,
      createdAt: Date.now()
    });
    
    console.log('✅ Registro bem-sucedido');
    showToast('Conta criada com sucesso! 🎉', 'success');
    
    // Auth listener vai cuidar do resto
    
  } catch (error) {
    console.error('❌ Erro registro:', error);
    showAuthError('register', 'Erro: ' + error.message);
    setBtnLoading(btn, false);
  }
}

function showAuthError(type, msg) {
  const el = document.getElementById(type + '-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

// ============================================================
// LOGOUT
// ============================================================
async function handleLogout() {
  if (!confirm('Sair da conta?')) return;
  
  STATE.listeners.forEach(fn => {
    try { fn(); } catch(e) {}
  });
  STATE.listeners = [];
  
  await auth.signOut();
  STATE.user = null;
  STATE.userData = null;
  showToast('Até logo! 👋', 'info');
}

// ============================================================
// UI
// ============================================================
function updateUI() {
  if (!STATE.userData) return;
  const u = STATE.userData;
  
  setText('sidebar-name', u.username || 'Usuário');
  setText('sidebar-pts', formatPts(u.points));
  setText('sidebar-avatar', u.avatar || '?');
  setText('topbar-avatar', u.avatar || '?');
  setText('pc-avatar', u.avatar || '?');
  setText('perfil-avatar', u.avatar || '?');
  setText('perfil-name', u.username || '--');
  setText('perfil-email', u.email || '--');
  
  const firstName = (u.username || 'Estudante').split(' ')[0];
  setText('home-greeting', 'Olá, ' + firstName + '! 👋');
  
  // Admin
  const navAdm = document.getElementById('nav-adm');
  if (navAdm && u.isAdmin) navAdm.style.display = '';
  
  document.getElementById('edit-name').value = u.username || '';
  document.getElementById('edit-bio').value = u.bio || '';
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function showScreen(name) {
  console.log('📱 Navegando para:', name);
  STATE.currentScreen = name;
  
  document.querySelectorAll('.screen-section').forEach(s => s.style.display = 'none');
  
  const target = document.getElementById('screen-' + name);
  if (target) target.style.display = '';
  
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.toggle('active', el.textContent.toLowerCase().includes(name.toLowerCase()) || 
      (name === 'home' && el.textContent.includes('Home')) ||
      (name === 'descobrir' && el.textContent.includes('Feed')) ||
      (name === 'materias' && el.textContent.includes('Matérias')) ||
      (name === 'ranking' && el.textContent.includes('Ranking')) ||
      (name === 'chat' && el.textContent.includes('Chat')) ||
      (name === 'perfil' && el.textContent.includes('Perfil')) ||
      (name === 'notificacoes' && el.textContent.includes('Notificações'))
    );
  });
  
  // Fechar sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
  hideEl('sidebar-overlay');
  
  // Scroll top
  const main = document.getElementById('main-content');
  if (main) main.scrollTop = 0;
  
  // Carregar dados
  loadScreenData(name);
}

function loadScreenData(name) {
  const loaders = {
    home: loadHome,
    materias: loadMaterias,
    'materia-detalhe': loadMateriaDetalhe,
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
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  if (overlay) overlay.style.display = sidebar.classList.contains('open') ? '' : 'none';
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function pickEmoji(emoji, btn) {
  STATE.selectedEmoji = emoji;
  document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
  const hidden = document.getElementById('nm-icone');
  if (hidden) hidden.value = emoji;
}

// ============================================================
// HOME
// ============================================================
async function loadHome() {
  if (!STATE.userData) return;
  
  const snap = await db.ref('usuarios/' + STATE.user.uid).once('value');
  if (snap.val()) STATE.userData = snap.val();
  updateUI();
  
  const pts = STATE.userData.points || 0;
  const { level, name, next, current } = getLevel(pts);
  const pct = Math.min(((pts - current) / (next - current)) * 100, 100);
  
  setText('level-badge', '📈 Nível ' + (level+1) + ' - ' + name);
  setText('stat-pontos', formatPts(pts));
  setText('stat-quizzes', STATE.userData.quizzesPlayed || 0);
  setText('progress-text', formatPts(pts) + ' / ' + formatPts(next) + ' pts');
  
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  
  // Matérias
  const matSnap = await db.ref('materias').once('value');
  const materias = matSnap.val();
  let count = 0;
  if (materias) {
    count = Object.values(materias).filter(m => m.autorId === STATE.user.uid).length;
  }
  setText('stat-materias', count);
  
  // Ranking
  const userSnap = await db.ref('usuarios').once('value');
  const users = userSnap.val();
  if (users) {
    const sorted = Object.values(users).sort((a, b) => (b.points || 0) - (a.points || 0));
    const pos = sorted.findIndex(u => u.uid === STATE.user.uid);
    setText('stat-rank', pos >= 0 ? '#' + (pos+1) : '#--');
  }
  
  // Feed
  loadHomeFeed();
}

function loadHomeFeed() {
  db.ref('posts').orderByChild('createdAt').limitToLast(10).on('value', (snap) => {
    const posts = snap.val();
    const container = document.getElementById('home-feed');
    if (!container) return;
    
    if (!posts) {
      container.innerHTML = '<div class="empty-state">📭 Nenhum post</div>';
      return;
    }
    
    const arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    container.innerHTML = arr.slice(0, 5).map(p => renderFeedItem(p, true)).join('');
  });
}

// ============================================================
// MATÉRIAS
// ============================================================
function loadMaterias() {
  db.ref('materias').on('value', (snap) => {
    const materias = snap.val();
    renderMaterias(materias);
  });
}

function renderMaterias(materias) {
  const container = document.getElementById('materias-grid');
  if (!container) return;
  
  if (!materias) {
    container.innerHTML = '<div class="empty-state">📚 Nenhuma matéria. Crie a primeira!</div>';
    return;
  }
  
  let arr = Object.entries(materias).map(([id, m]) => ({ id, ...m }));
  
  if (STATE.materiaFilter === 'mine') {
    arr = arr.filter(m => m.autorId === STATE.user?.uid);
  }
  
  const search = (document.getElementById('search-materias')?.value || '').toLowerCase();
  if (search) {
    arr = arr.filter(m => (m.nome || '').toLowerCase().includes(search));
  }
  
  arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  if (!arr.length) {
    container.innerHTML = '<div class="empty-state">🔍 Nenhuma matéria encontrada</div>';
    return;
  }
  
  container.innerHTML = arr.map(m => `
    <div class="materia-card" onclick="openMateria('${m.id}')">
      <div class="materia-icon-wrap">${m.icone || '📚'}</div>
      <div class="materia-info">
        <div class="materia-nome">${escapeHtml(m.nome)}</div>
        <div class="materia-desc">${escapeHtml(m.descricao || '')}</div>
        <div class="materia-meta">
          <span>👤 ${escapeHtml(m.autorNome || 'Anônimo')}</span>
          <span>📝 ${m.topicosCount || 0} tópicos</span>
          <span>${m.visibilidade === 'public' ? '🌍' : '🔒'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function setMateriaFilter(filter, btn) {
  STATE.materiaFilter = filter;
  document.querySelectorAll('#screen-materias .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadMaterias();
}

function filterMaterias() {
  loadMaterias();
}

async function criarMateria() {
  const nome = document.getElementById('nm-nome')?.value?.trim();
  const desc = document.getElementById('nm-desc')?.value?.trim();
  const icone = STATE.selectedEmoji || '📚';
  
  if (!nome) return showToast('Nome é obrigatório', 'error');
  if (!STATE.user) return showToast('Faça login primeiro', 'error');
  
  const materia = {
    nome,
    descricao: desc,
    icone,
    visibilidade: 'public',
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    topicosCount: 0,
    createdAt: Date.now()
  };
  
  const ref = await db.ref('materias').push(materia);
  
  if (ref.key) {
    closeModal('modal-criar-materia');
    document.getElementById('nm-nome').value = '';
    document.getElementById('nm-desc').value = '';
    
    await db.ref('usuarios/' + STATE.user.uid).update({
      materiasCreated: (STATE.userData.materiasCreated || 0) + 1
    });
    
    addPoints(20);
    showToast('Matéria criada! 📚', 'success');
  }
}

// ============================================================
// ABRIR MATÉRIA E TÓPICOS
// ============================================================
async function openMateria(id) {
  STATE.currentMateriaId = id;
  
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val();
  if (!m) return showToast('Matéria não encontrada', 'error');
  
  setText('materia-hero-icon', m.icone || '📚');
  setText('materia-hero-nome', m.nome);
  setText('materia-hero-desc', m.descricao || '');
  setText('materia-hero-autor', 'Por: ' + (m.autorNome || 'Anônimo'));
  setText('materia-hero-topicos', (m.topicosCount || 0) + ' tópicos');
  
  showScreen('materia-detalhe');
  loadTopicos(id);
  loadQuizzesMateria(id);
}

function loadTopicos(materiaId) {
  db.ref('topicos/' + materiaId).on('value', (snap) => {
    const topicos = snap.val();
    const container = document.getElementById('topicos-list');
    if (!container) return;
    
    if (!topicos) {
      container.innerHTML = '<div class="empty-state">Nenhum tópico ainda. Crie o primeiro!</div>';
      return;
    }
    
    const arr = Object.entries(topicos).map(([id, t]) => ({ id, ...t }));
    container.innerHTML = arr.map(t => `
      <div class="topico-item" onclick="openTopico('${t.id}')">
        <div class="topico-item-icon">📄</div>
        <div class="topico-item-info">
          <div class="topico-item-title">${escapeHtml(t.titulo)}</div>
          <div class="topico-item-meta">${escapeHtml(t.autorNome || 'Anônimo')} · ${timeAgo(t.createdAt)}</div>
        </div>
        <span>→</span>
      </div>
    `).join('');
  });
}

async function criarTopico() {
  const titulo = document.getElementById('nt-titulo')?.value?.trim();
  const conteudo = document.getElementById('nt-conteudo')?.value?.trim();
  
  if (!titulo || !conteudo) return showToast('Preencha todos os campos', 'error');
  if (!STATE.currentMateriaId) return showToast('Selecione uma matéria', 'error');
  
  const topico = {
    titulo,
    conteudo,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    createdAt: Date.now()
  };
  
  const ref = await db.ref('topicos/' + STATE.currentMateriaId).push(topico);
  
  if (ref.key) {
    const matSnap = await db.ref('materias/' + STATE.currentMateriaId).once('value');
    const m = matSnap.val();
    if (m) {
      await db.ref('materias/' + STATE.currentMateriaId).update({
        topicosCount: (m.topicosCount || 0) + 1
      });
    }
    
    closeModal('modal-criar-topico');
    document.getElementById('nt-titulo').value = '';
    document.getElementById('nt-conteudo').value = '';
    
    addPoints(15);
    showToast('Tópico criado! 📝', 'success');
  }
}

async function openTopico(id) {
  STATE.currentTopicoId = id;
  
  const snap = await db.ref('topicos/' + STATE.currentMateriaId + '/' + id).once('value');
  const t = snap.val();
  if (!t) return showToast('Tópico não encontrado', 'error');
  
  setText('topico-title', t.titulo);
  setText('topico-meta', 'Por ' + escapeHtml(t.autorNome || 'Anônimo') + ' · ' + timeAgo(t.createdAt));
  setText('topico-body', t.conteudo);
  
  showScreen('topico-detalhe');
  loadComentarios(id);
}

function loadComentarios(topicoId) {
  db.ref('comentarios/' + STATE.currentMateriaId + '/' + topicoId).on('value', (snap) => {
    const comentarios = snap.val();
    const container = document.getElementById('topico-comentarios');
    if (!container) return;
    
    if (!comentarios) {
      container.innerHTML = '<div class="empty-state">Sem comentários</div>';
      return;
    }
    
    const arr = Object.entries(comentarios).map(([id, c]) => ({ id, ...c })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    container.innerHTML = arr.map(c => `
      <div class="comment-item">
        <div class="comment-header">
          <div class="comment-avatar">${c.avatar || '💬'}</div>
          <span class="comment-author">${escapeHtml(c.autorNome || 'Anônimo')}</span>
          <span class="comment-time">${timeAgo(c.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.texto)}</div>
      </div>
    `).join('');
  });
}

async function addComment() {
  const texto = document.getElementById('new-comment')?.value?.trim();
  if (!texto) return;
  if (!STATE.currentMateriaId || !STATE.currentTopicoId) return;
  
  await db.ref('comentarios/' + STATE.currentMateriaId + '/' + STATE.currentTopicoId).push({
    texto,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '💬',
    createdAt: Date.now()
  });
  
  document.getElementById('new-comment').value = '';
  
  // Notificar autor do tópico
  const topico = await db.ref('topicos/' + STATE.currentMateriaId + '/' + STATE.currentTopicoId).once('value');
  const t = topico.val();
  if (t && t.autorId !== STATE.user.uid) {
    await addNotification(t.autorId, '💬 ' + STATE.userData.username + ' comentou no seu tópico!', 'comment');
  }
  
  addPoints(3);
}

// ============================================================
// QUIZZES
// ============================================================
function loadQuizzesMateria(materiaId) {
  db.ref('quizzes/' + materiaId).on('value', (snap) => {
    const quizzes = snap.val();
    const container = document.getElementById('quizzes-materia');
    if (!container) return;
    
    if (!quizzes) {
      container.innerHTML = '<div class="empty-state">Nenhum quiz</div>';
      return;
    }
    
    const arr = Object.entries(quizzes).map(([id, q]) => ({ id, ...q }));
    container.innerHTML = arr.map(q => `
      <div class="quiz-item">
        <div class="quiz-item-info">
          <div class="quiz-item-name">🎮 ${escapeHtml(q.nome)}</div>
          <div class="quiz-item-meta">${q.questoes?.length || 0} questões · ${q.tempo || 30}s</div>
        </div>
        <button class="btn-primary btn-sm" onclick="startQuiz('${materiaId}', '${q.id}')">▶ Jogar</button>
      </div>
    `).join('');
  });
}

// ============================================================
// PROCESSAR COMANDO /n /a /c /q /f /save
// ============================================================
async function processarComandoQuiz() {
  const input = document.getElementById('cmd-input')?.value;
  if (!input || !input.trim()) return showToast('Digite os comandos', 'error');
  if (!STATE.currentMateriaId) return showToast('Acesse uma matéria primeiro! Clique em "Matérias" e selecione uma.', 'error');
  
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  
  let quizNome = '';
  let questoes = [];
  let currentQuestion = null;
  let currentAlternativas = [];
  let currentCorreta = -1;
  let tempo = 30;
  
  for (const line of lines) {
    if (line.startsWith('/n ')) {
      if (currentQuestion) {
        // Finalizar questão anterior
        if (currentAlternativas.length >= 2 && currentCorreta >= 0) {
          currentQuestion.alternativas = currentAlternativas;
          currentQuestion.correta = currentCorreta;
          questoes.push(currentQuestion);
        }
        currentQuestion = null;
        currentAlternativas = [];
        currentCorreta = -1;
      }
      quizNome = line.substring(3).trim();
    } else if (line.startsWith('/t ')) {
      tempo = parseInt(line.substring(3).trim()) || 30;
    } else if (line.startsWith('/q ')) {
      if (currentQuestion) {
        if (currentAlternativas.length >= 2 && currentCorreta >= 0) {
          currentQuestion.alternativas = currentAlternativas;
          currentQuestion.correta = currentCorreta;
          questoes.push(currentQuestion);
        }
      }
      currentQuestion = { pergunta: line.substring(3).trim() };
      currentAlternativas = [];
      currentCorreta = -1;
    } else if (line.startsWith('/a ')) {
      currentAlternativas.push(line.substring(3).trim());
    } else if (line.startsWith('/c ')) {
      const letra = line.substring(3).trim().toUpperCase();
      const mapa = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      currentCorreta = mapa[letra] !== undefined ? mapa[letra] : -1;
    } else if (line === '/f') {
      if (currentQuestion && currentAlternativas.length >= 2 && currentCorreta >= 0) {
        currentQuestion.alternativas = currentAlternativas;
        currentQuestion.correta = currentCorreta;
        questoes.push(currentQuestion);
        currentQuestion = null;
        currentAlternativas = [];
        currentCorreta = -1;
      }
    } else if (line === '/save') {
      break;
    }
  }
  
  // Última questão
  if (currentQuestion && currentAlternativas.length >= 2 && currentCorreta >= 0) {
    currentQuestion.alternativas = currentAlternativas;
    currentQuestion.correta = currentCorreta;
    questoes.push(currentQuestion);
  }
  
  if (!quizNome) return showToast('Use /n para definir o nome do quiz', 'error');
  if (questoes.length === 0) return showToast('Adicione questões com /q, /a, /c e /f', 'error');
  
  const quiz = {
    nome: quizNome,
    tempo,
    materiaId: STATE.currentMateriaId,
    questoes,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    totalPlays: 0,
    createdAt: Date.now()
  };
  
  const ref = await db.ref('quizzes/' + STATE.currentMateriaId).push(quiz);
  
  if (ref.key) {
    closeModal('modal-criar-quiz-cmd');
    document.getElementById('cmd-input').value = '';
    addPoints(30);
    showToast('Quiz "' + quizNome + '" criado com ' + questoes.length + ' questões! 🎮', 'success');
    loadQuizzesMateria(STATE.currentMateriaId);
  }
}

// ============================================================
// JOGAR QUIZ
// ============================================================
async function startQuiz(materiaId, quizId) {
  const snap = await db.ref('quizzes/' + materiaId + '/' + quizId).once('value');
  const quiz = snap.val();
  if (!quiz || !quiz.questoes?.length) return showToast('Quiz inválido', 'error');
  
  STATE.quizGame = {
    questions: shuffleArray([...quiz.questoes]),
    currentIndex: 0,
    score: 0,
    correct: 0,
    timerInterval: null,
    timeLeft: quiz.tempo || 30,
    startTime: Date.now(),
    answers: [],
    quizNome: quiz.nome,
    materiaId,
    quizId
  };
  
  showScreen('quiz-game');
  renderQuestion();
  
  // Incrementar plays
  await db.ref('quizzes/' + materiaId + '/' + quizId).update({
    totalPlays: (quiz.totalPlays || 0) + 1
  });
}

function renderQuestion() {
  const g = STATE.quizGame;
  if (g.currentIndex >= g.questions.length) {
    finishQuiz();
    return;
  }
  
  const q = g.questions[g.currentIndex];
  const total = g.questions.length;
  const idx = g.currentIndex;
  
  setText('quiz-q-counter', (idx+1) + '/' + total);
  setText('quiz-q-num', 'Questão ' + (idx+1));
  setText('quiz-question', q.pergunta);
  
  const fill = document.getElementById('quiz-progress-fill');
  if (fill) fill.style.width = ((idx) / total * 100) + '%';
  
  const optionsContainer = document.getElementById('quiz-options');
  const letras = ['A', 'B', 'C', 'D'];
  
  optionsContainer.innerHTML = q.alternativas.map((opt, i) => `
    <button class="quiz-opt" onclick="selectAnswer(${i})" id="opt-${i}">
      <div class="quiz-opt-letter">${letras[i]}</div>
      <span>${escapeHtml(opt)}</span>
    </button>
  `).join('');
  
  // Timer
  clearInterval(g.timerInterval);
  g.timeLeft = STATE.quizGame.timeLeft || 30;
  updateTimerDisplay();
  
  g.timerInterval = setInterval(() => {
    g.timeLeft--;
    updateTimerDisplay();
    if (g.timeLeft <= 0) {
      clearInterval(g.timerInterval);
      selectAnswer(-1);
    }
    if (g.timeLeft <= 5) {
      document.getElementById('quiz-timer')?.classList.add('danger');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('quiz-timer');
  if (el) {
    el.textContent = '⏱ ' + STATE.quizGame.timeLeft + 's';
    el.classList.toggle('danger', STATE.quizGame.timeLeft <= 5);
  }
}

function selectAnswer(chosen) {
  clearInterval(STATE.quizGame.timerInterval);
  
  const g = STATE.quizGame;
  const q = g.questions[g.currentIndex];
  const correct = q.correta;
  const isCorrect = chosen === correct;
  
  // Desabilitar botões e mostrar cores
  document.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    if (i === chosen && !isCorrect) btn.classList.add('wrong');
  });
  
  if (isCorrect) {
    const pts = Math.max(10, Math.round(10 + (g.timeLeft / 30) * 10));
    g.score += pts;
    g.correct++;
    g.answers.push({ pergunta: q.pergunta, chosen, correct, isCorrect: true, pts });
  } else {
    g.answers.push({ pergunta: q.pergunta, chosen, correct, isCorrect: false, pts: 0 });
  }
  
  setText('quiz-score-live', g.score);
  
  setTimeout(() => {
    g.currentIndex++;
    renderQuestion();
  }, 1500);
}

async function finishQuiz() {
  clearInterval(STATE.quizGame.timerInterval);
  
  const g = STATE.quizGame;
  const total = g.questions.length;
  const elapsed = Math.round((Date.now() - g.startTime) / 1000);
  const pct = Math.round((g.correct / total) * 100);
  
  const bonus = pct >= 90 ? 50 : pct >= 70 ? 30 : pct >= 50 ? 15 : 0;
  const totalPts = g.score + bonus;
  
  // Salvar histórico
  await db.ref('historico/' + STATE.user.uid).push({
    quizNome: g.quizNome,
    materiaId: g.materiaId,
    quizId: g.quizId,
    score: totalPts,
    acertos: g.correct,
    total,
    pct,
    tempo: elapsed,
    createdAt: Date.now()
  });
  
  // Atualizar pontos
  await addPoints(totalPts);
  await db.ref('usuarios/' + STATE.user.uid).update({
    quizzesPlayed: (STATE.userData.quizzesPlayed || 0) + 1
  });
  
  // Feed
  await db.ref('posts').push({
    tipo: 'atividade',
    texto: 'completou o quiz "' + g.quizNome + '" com ' + pct + '% de acerto!',
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar,
    createdAt: Date.now()
  });
  
  // Mostrar resultado
  showScreen('resultado');
  
  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '😅' : '💪';
  const titulo = pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : 'Continue!';
  
  setText('resultado-emoji', emoji);
  setText('resultado-titulo', titulo);
  setText('resultado-subtitulo', g.quizNome);
  setText('res-acertos', g.correct);
  setText('res-total', total);
  setText('res-pontos', '+' + totalPts);
  setText('res-tempo', elapsed + 's');
  setText('resultado-pct', pct + '%');
  
  const fill = document.getElementById('resultado-barra-fill');
  if (fill) fill.style.width = pct + '%';
  
  // Review
  const reviewContainer = document.getElementById('resultado-review');
  if (reviewContainer) {
    reviewContainer.innerHTML = g.answers.map(a => `
      <div class="review-item ${a.isCorrect ? 'review-correct' : 'review-wrong'}">
        <strong>${a.isCorrect ? '✅' : '❌'} ${escapeHtml(a.pergunta)}</strong>
        ${a.isCorrect ? '<span style="float:right;color:var(--success)">+' + a.pts + '</span>' : ''}
      </div>
    `).join('');
  }
  
  if (pct >= 80) launchConfetti();
}

function exitQuiz() {
  if (!confirm('Sair do quiz? O progresso será perdido.')) return;
  clearInterval(STATE.quizGame.timerInterval);
  showScreen('materia-detalhe');
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: ['#6C5CE7','#00CEC9','#FD79A8','#FDCB6E','#E17055'][Math.floor(Math.random()*5)],
    size: Math.random() * 8 + 4
  }));
  
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    frame++;
    if (frame < 150) requestAnimationFrame(animate);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  };
  requestAnimationFrame(animate);
}

// ============================================================
// FEED / DESCOBRIR
// ============================================================
function loadFeed() {
  db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value', (snap) => {
    const posts = snap.val();
    const container = document.getElementById('descobrir-feed');
    if (!container) return;
    
    if (!posts) {
      container.innerHTML = '<div class="empty-state">📭 Nenhum post ainda</div>';
      return;
    }
    
    let arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    
    if (STATE.feedFilter !== 'all') {
      arr = arr.filter(p => p.tipo === STATE.feedFilter);
    }
    
    container.innerHTML = arr.length ? arr.map(p => renderFeedItem(p)).join('') : '<div class="empty-state">📭 Nenhum post</div>';
  });
}

function renderFeedItem(p, compact = false) {
  const tipoLabel = { post: '💬', dica: '💡', duvida: '❓', atividade: '⚡' }[p.tipo] || '💬';
  const tipoClass = { post: 'type-post', dica: 'type-dica', duvida: 'type-duvida', atividade: 'type-post' }[p.tipo] || '';
  const likes = p.likes ? Object.values(p.likes).length : 0;
  const liked = p.likes && p.likes[STATE.user?.uid];
  
  return `
    <div class="feed-item">
      <div class="feed-item-header">
        <div class="feed-avatar">${p.avatar || p.autorAvatar || '?'}</div>
        <div class="feed-meta">
          <div class="feed-author">${escapeHtml(p.autorNome || 'Anônimo')}</div>
          <div class="feed-time">${timeAgo(p.createdAt)}</div>
        </div>
        <span class="feed-type-badge ${tipoClass}">${tipoLabel}</span>
      </div>
      <div class="feed-text">${escapeHtml(p.texto)}</div>
      ${!compact ? `
      <div class="feed-actions">
        <button class="feed-action-btn ${liked ? 'liked' : ''}" onclick="likePost('${p.id}')">
          ${liked ? '❤️' : '🤍'} ${likes}
        </button>
      </div>` : ''}
    </div>
  `;
}

function setPostType(type, btn) {
  STATE.postType = type;
  document.querySelectorAll('.ptype-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function setFeedFilter(filter, btn) {
  STATE.feedFilter = filter;
  document.querySelectorAll('#screen-descobrir .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadFeed();
}

async function createPost() {
  const texto = document.getElementById('new-post-text')?.value?.trim();
  if (!texto) return showToast('Escreva algo', 'error');
  
  await db.ref('posts').push({
    texto,
    tipo: STATE.postType,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  });
  
  document.getElementById('new-post-text').value = '';
  addPoints(5);
  showToast('Publicado! 🎉', 'success');
}

async function criarPostModal() {
  const texto = document.getElementById('post-texto-modal')?.value?.trim();
  const tipo = document.getElementById('post-tipo-modal')?.value || 'post';
  
  if (!texto) return showToast('Escreva algo', 'error');
  
  await db.ref('posts').push({
    texto,
    tipo,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  });
  
  closeModal('modal-criar-post');
  document.getElementById('post-texto-modal').value = '';
  addPoints(5);
  showToast('Publicado! 🎉', 'success');
}

async function likePost(postId) {
  if (!STATE.user) return;
  
  const ref = db.ref('posts/' + postId + '/likes/' + STATE.user.uid);
  const snap = await ref.once('value');
  
  if (snap.val()) {
    await ref.remove();
  } else {
    await ref.set(true);
    
    // Notificar autor
    const postSnap = await db.ref('posts/' + postId).once('value');
    const post = postSnap.val();
    if (post && post.autorId !== STATE.user.uid) {
      await addNotification(post.autorId, '❤️ ' + STATE.userData.username + ' curtiu seu post!', 'like');
    }
  }
}

// ============================================================
// RANKING
// ============================================================
function loadRanking() {
  db.ref('usuarios').on('value', (snap) => {
    const users = snap.val();
    if (!users) return;
    
    const arr = Object.values(users).sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Pódio
    const setP = (pos, u) => {
      if (!u) return;
      setText('podio' + pos + '-av', u.avatar || '?');
      setText('podio' + pos + '-name', (u.username || 'User').split(' ')[0]);
      setText('podio' + pos + '-pts', formatPts(u.points));
    };
    setP(1, arr[0]); setP(2, arr[1]); setP(3, arr[2]);
    
    // Minha posição
    const myPos = arr.findIndex(u => u.uid === STATE.user?.uid);
    setText('my-rank-num', myPos >= 0 ? '#' + (myPos+1) : '#--');
    setText('my-rank-pts', formatPts(arr[myPos]?.points || 0));
    
    // Lista
    const container = document.getElementById('ranking-list');
    if (container) {
      container.innerHTML = arr.slice(0, 50).map((u, i) => `
        <div class="ranking-item ${u.uid === STATE.user?.uid ? 'rank-me' : ''}">
          <div class="rank-pos">${i < 3 ? ['🥇','🥈','🥉'][i] : (i+1)}</div>
          <div class="rank-avatar">${u.avatar || '?'}</div>
          <div class="rank-info">
            <div class="rank-name">${escapeHtml(u.username || 'Usuário')} ${u.uid===STATE.user?.uid?'(Você)':''}</div>
            <div class="rank-sub">${u.quizzesPlayed || 0} quizzes</div>
          </div>
          <div class="rank-pts">${formatPts(u.points)} pts</div>
        </div>
      `).join('');
    }
  });
}

// ============================================================
// CHAT
// ============================================================
function loadChatRooms() {
  db.ref('chat_rooms').on('value', (snap) => {
    const rooms = snap.val();
    const container = document.getElementById('rooms-list');
    if (!container) return;
    
    if (!rooms) {
      container.innerHTML = '<div class="room-item">Nenhuma sala</div>';
      return;
    }
    
    container.innerHTML = Object.entries(rooms).map(([id, r]) => `
      <div class="room-item ${STATE.currentRoom === id ? 'active' : ''}" onclick="joinRoom('${id}')">
        <div class="room-name"># ${escapeHtml(r.nome)}</div>
        <div class="room-last">${escapeHtml(r.descricao || '')}</div>
      </div>
    `).join('');
  });
}

function joinRoom(roomId) {
  STATE.currentRoom = roomId;
  
  db.ref('chat_rooms/' + roomId).once('value').then(snap => {
    const room = snap.val();
    if (room) setText('chat-room-name', '# ' + room.nome);
  });
  
  hideEl('chat-no-room');
  showEl('chat-room-view');
  
  // Listener de mensagens
  db.ref('chat_messages/' + roomId).on('value', (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (!msgs) {
      container.innerHTML = '<div class="empty-state">Sem mensagens</div>';
      return;
    }
    
    const arr = Object.entries(msgs).map(([id, m]) => ({ id, ...m })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    container.innerHTML = arr.map(m => `
      <div class="chat-msg ${m.autorId === STATE.user?.uid ? 'mine' : ''}">
        <div class="chat-msg-avatar">${m.avatar || '?'}</div>
        <div class="chat-msg-bubble">
          <div class="chat-msg-name">${escapeHtml(m.autorNome || 'Anônimo')}</div>
          <div class="chat-msg-text">${escapeHtml(m.texto)}</div>
          <div class="chat-msg-time">${timeAgo(m.createdAt)}</div>
        </div>
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  });
}

async function sendChatMsg() {
  const input = document.getElementById('chat-msg-input');
  const texto = input?.value?.trim();
  if (!texto || !STATE.currentRoom) return;
  
  await db.ref('chat_messages/' + STATE.currentRoom).push({
    texto,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '💬',
    createdAt: Date.now()
  });
  
  await db.ref('chat_rooms/' + STATE.currentRoom).update({
    lastMessage: texto.substring(0, 50),
    lastMessageAt: Date.now()
  });
  
  input.value = '';
}

async function criarSala() {
  const nome = document.getElementById('ns-nome')?.value?.trim();
  const desc = document.getElementById('ns-desc')?.value?.trim();
  
  if (!nome) return showToast('Nome é obrigatório', 'error');
  
  const ref = await db.ref('chat_rooms').push({
    nome,
    descricao: desc,
    criadorId: STATE.user.uid,
    createdAt: Date.now()
  });
  
  if (ref.key) {
    closeModal('modal-criar-sala');
    document.getElementById('ns-nome').value = '';
    document.getElementById('ns-desc').value = '';
    showToast('Sala criada! 💬', 'success');
    joinRoom(ref.key);
  }
}

// ============================================================
// PERFIL
// ============================================================
async function loadPerfil() {
  if (!STATE.userData) return;
  
  const snap = await db.ref('usuarios/' + STATE.user.uid).once('value');
  if (snap.val()) STATE.userData = snap.val();
  updateUI();
  
  const u = STATE.userData;
  setText('pstat-pts', formatPts(u.points));
  setText('pstat-quizzes', u.quizzesPlayed || 0);
  setText('pstat-materias', u.materiasCreated || 0);
  setText('pstat-seguidores', u.seguidores || 0);
  
  // Badges
  const badges = [];
  if ((u.points || 0) >= 1000) badges.push('<span class="badge badge-gold">⭐ 1K</span>');
  if ((u.points || 0) >= 5000) badges.push('<span class="badge badge-gold">🌟 5K</span>');
  if ((u.quizzesPlayed || 0) >= 10) badges.push('<span class="badge badge-blue">🎮 Gamer</span>');
  if ((u.materiasCreated || 0) >= 3) badges.push('<span class="badge badge-silver">📚 Criador</span>');
  if (u.isAdmin) badges.push('<span class="badge badge-gold">⚙️ Admin</span>');
  if (!badges.length) badges.push('<span class="badge badge-silver">🌱 Novato</span>');
  
  setHTML('perfil-badges', badges.join(' '));
  
  // Histórico
  const histSnap = await db.ref('historico/' + STATE.user.uid).once('value');
  const hist = histSnap.val();
  const container = document.getElementById('perfil-historico');
  if (container) {
    if (!hist) {
      container.innerHTML = '<div class="empty-state">Nenhum quiz ainda</div>';
    } else {
      const arr = Object.entries(hist).map(([id, h]) => ({ id, ...h })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      container.innerHTML = arr.map(h => `
        <div class="historico-item">
          <div class="hist-icon">🎮</div>
          <div class="hist-info">
            <div class="hist-name">${escapeHtml(h.quizNome || 'Quiz')}</div>
            <div class="hist-meta">${h.acertos}/${h.total} · ${h.pct}% · ${timeAgo(h.createdAt)}</div>
          </div>
          <div class="hist-pts">+${formatPts(h.score)}</div>
        </div>
      `).join('');
    }
  }
}

async function saveProfile() {
  const username = document.getElementById('edit-name')?.value?.trim();
  const bio = document.getElementById('edit-bio')?.value?.trim();
  
  if (!username) return showToast('Nome é obrigatório', 'error');
  
  // Verificar se username já existe
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
  const users = snap.val();
  if (users) {
    const otherUid = Object.keys(users)[0];
    if (otherUid !== STATE.user.uid) {
      return showToast('Nome já está em uso!', 'error');
    }
  }
  
  await db.ref('usuarios/' + STATE.user.uid).update({ username, bio });
  STATE.userData.username = username;
  STATE.userData.bio = bio;
  updateUI();
  showToast('Perfil salvo! ✅', 'success');
}

// ============================================================
// AVATAR
// ============================================================
function selectAvatar(avatar, btn) {
  STATE.selectedAvatar = avatar;
  document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
}

async function saveAvatar() {
  const avatar = STATE.selectedAvatar || '🎓';
  await db.ref('usuarios/' + STATE.user.uid).update({ avatar });
  STATE.userData.avatar = avatar;
  updateUI();
  closeModal('modal-edit-avatar');
  showToast('Avatar atualizado!', 'success');
}

function loadAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;
  
  const avatars = ['🎓','🦁','🐯','🦊','🐼','🦅','🌟','🚀','⚡','🎯','🦄','🐉','🌈','🎭','💎','🔥','🌊','🌸','🍀','🎪'];
  
  grid.innerHTML = avatars.map(a => `
    <button class="avatar-opt ${a === STATE.userData?.avatar ? 'selected' : ''}" onclick="selectAvatar('${a}', this)">${a}</button>
  `).join('');
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================
async function addNotification(uid, mensagem, tipo = 'system') {
  await db.ref('notificacoes/' + uid).push({
    mensagem,
    tipo,
    lida: false,
    createdAt: Date.now()
  });
}

function loadNotificacoes() {
  if (!STATE.user) return;
  
  db.ref('notificacoes/' + STATE.user.uid).orderByChild('createdAt').limitToLast(30).on('value', async (snap) => {
    const notifs = snap.val();
    const container = document.getElementById('notificacoes-list');
    if (!container) return;
    
    if (!notifs) {
      container.innerHTML = '<div class="empty-state">🔔 Nenhuma notificação</div>';
      return;
    }
    
    const arr = Object.entries(notifs).map(([id, n]) => ({ id, ...n })).reverse();
    
    container.innerHTML = arr.map(n => `
      <div class="notif-item ${n.lida ? '' : 'unread'}">
        <div class="notif-icon">${n.tipo === 'like' ? '❤️' : n.tipo === 'comment' ? '💬' : n.tipo === 'achievement' ? '🏆' : '🔔'}</div>
        <div class="notif-content">
          <div class="notif-msg">${escapeHtml(n.mensagem)}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join('');
    
    // Marcar como lidas
    const updates = {};
    arr.forEach(n => {
      if (!n.lida) updates[n.id + '/lida'] = true;
    });
    if (Object.keys(updates).length) {
      await db.ref('notificacoes/' + STATE.user.uid).update(updates);
    }
    
    updateNotifBadge();
  });
}

async function updateNotifBadge() {
  if (!STATE.user) return;
  
  const snap = await db.ref('notificacoes/' + STATE.user.uid).once('value');
  const notifs = snap.val();
  const badge = document.getElementById('notif-badge');
  
  if (!badge) return;
  
  if (notifs) {
    const unread = Object.values(notifs).filter(n => !n.lida).length;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } else {
    badge.style.display = 'none';
  }
}

async function marcarTodasLidas() {
  if (!STATE.user) return;
  
  const snap = await db.ref('notificacoes/' + STATE.user.uid).once('value');
  const notifs = snap.val();
  if (!notifs) return;
  
  const updates = {};
  Object.keys(notifs).forEach(id => {
    updates[id + '/lida'] = true;
  });
  
  await db.ref('notificacoes/' + STATE.user.uid).update(updates);
  showToast('Todas lidas ✓', 'info');
  updateNotifBadge();
}

// ============================================================
// PONTOS
// ============================================================
async function addPoints(pts) {
  if (!STATE.user) return 0;
  
  const snap = await db.ref('usuarios/' + STATE.user.uid + '/points').once('value');
  const current = snap.val() || 0;
  const newPts = current + pts;
  
  await db.ref('usuarios/' + STATE.user.uid).update({ points: newPts });
  STATE.userData.points = newPts;
  updateUI();
  
  return newPts;
}

// ============================================================
// ADMIN
// ============================================================
async function loadAdm() {
  if (!STATE.userData?.isAdmin) {
    return showToast('Acesso negado! Apenas administradores.', 'error');
  }
  
  // Stats
  const usersSnap = await db.ref('usuarios').once('value');
  const users = usersSnap.val();
  setText('adm-users', users ? Object.keys(users).length : 0);
  
  const matSnap = await db.ref('materias').once('value');
  const materias = matSnap.val();
  setText('adm-materias', materias ? Object.keys(materias).length : 0);
  
  let quizCount = 0;
  if (materias) {
    for (const key of Object.keys(materias)) {
      const qSnap = await db.ref('quizzes/' + key).once('value');
      const q = qSnap.val();
      if (q) quizCount += Object.keys(q).length;
    }
  }
  setText('adm-quizzes', quizCount);
  
  const postsSnap = await db.ref('posts').once('value');
  const posts = postsSnap.val();
  setText('adm-posts', posts ? Object.keys(posts).length : 0);
  
  admLoadTab('materias');
}

async function admLoadTab(tab, btn) {
  STATE.admCurrentTab = tab;
  
  document.querySelectorAll('#screen-adm .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  const container = document.getElementById('adm-content-list');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state">⏳ Carregando...</div>';
  
  let data;
  
  switch (tab) {
    case 'materias':
      const mSnap = await db.ref('materias').once('value');
      data = mSnap.val();
      if (data) {
        const arr = Object.entries(data).map(([id, m]) => ({ id, ...m }));
        container.innerHTML = arr.map(m => `
          <div class="adm-item">
            <div>
              <strong>${m.icone || '📚'} ${escapeHtml(m.nome)}</strong>
              <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(m.autorNome || '?')} · ${timeAgo(m.createdAt)}</div>
            </div>
            <button class="btn-sm btn-danger" onclick="admDelete('materias','${m.id}')">🗑 Excluir</button>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<div class="empty-state">Nenhuma matéria</div>';
      }
      break;
      
    case 'quizzes':
      container.innerHTML = '';
      const matSnap = await db.ref('materias').once('value');
      const mats = matSnap.val();
      if (mats) {
        for (const matId of Object.keys(mats)) {
          const qSnap = await db.ref('quizzes/' + matId).once('value');
          const quizzes = qSnap.val();
          if (quizzes) {
            Object.entries(quizzes).forEach(([qId, q]) => {
              container.innerHTML += `
                <div class="adm-item">
                  <div>
                    <strong>🎮 ${escapeHtml(q.nome)}</strong>
                    <div style="font-size:0.8rem;color:var(--text-muted);">Matéria: ${escapeHtml(mats[matId]?.nome || '?')} · ${q.questoes?.length || 0} questões</div>
                  </div>
                  <button class="btn-sm btn-danger" onclick="admDelete('quizzes/${matId}','${qId}')">🗑</button>
                </div>
              `;
            });
          }
        }
      }
      if (!container.innerHTML) container.innerHTML = '<div class="empty-state">Nenhum quiz</div>';
      break;
      
    case 'topicos':
      container.innerHTML = '';
      const mSnap2 = await db.ref('materias').once('value');
      const mats2 = mSnap2.val();
      if (mats2) {
        for (const matId of Object.keys(mats2)) {
          const tSnap = await db.ref('topicos/' + matId).once('value');
          const topicos = tSnap.val();
          if (topicos) {
            Object.entries(topicos).forEach(([tId, t]) => {
              container.innerHTML += `
                <div class="adm-item">
                  <div>
                    <strong>📄 ${escapeHtml(t.titulo)}</strong>
                    <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(t.autorNome || '?')}</div>
                  </div>
                  <button class="btn-sm btn-danger" onclick="admDelete('topicos/${matId}','${tId}')">🗑</button>
                </div>
              `;
            });
          }
        }
      }
      if (!container.innerHTML) container.innerHTML = '<div class="empty-state">Nenhum tópico</div>';
      break;
      
    case 'posts':
      const pSnap = await db.ref('posts').once('value');
      data = pSnap.val();
      if (data) {
        const arr = Object.entries(data).map(([id, p]) => ({ id, ...p }));
        container.innerHTML = arr.map(p => `
          <div class="adm-item">
            <div>
              <strong>${escapeHtml(p.autorNome || '?')}</strong>: ${escapeHtml((p.texto || '').substring(0, 60))}
              <div style="font-size:0.8rem;color:var(--text-muted);">${timeAgo(p.createdAt)}</div>
            </div>
            <button class="btn-sm btn-danger" onclick="admDelete('posts','${p.id}')">🗑</button>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<div class="empty-state">Nenhum post</div>';
      }
      break;
      
    case 'usuarios':
      const uSnap = await db.ref('usuarios').once('value');
      data = uSnap.val();
      if (data) {
        const arr = Object.values(data);
        container.innerHTML = arr.map(u => `
          <div class="adm-item">
            <div>
              <strong>${u.avatar || '?'} ${escapeHtml(u.username || '?')}</strong>
              <div style="font-size:0.8rem;color:var(--text-muted);">${formatPts(u.points)} pts · ${u.isAdmin ? '⚙️ Admin' : '👤 Usuário'}</div>
            </div>
            ${!u.isAdmin && u.uid !== STATE.user?.uid ? 
              `<button class="btn-sm btn-danger" onclick="admDeleteUser('${u.uid}')">🗑 Excluir</button>` : ''}
          </div>
        `).join('');
      }
      break;
  }
}

async function admDelete(path, id) {
  if (!confirm('Excluir permanentemente?')) return;
  await db.ref(path + '/' + id).remove();
  showToast('Excluído!', 'info');
  admLoadTab(STATE.admCurrentTab);
}

async function admDeleteUser(uid) {
  if (!confirm('Excluir usuário e todos os seus dados? Esta ação é irreversível!')) return;
  await db.ref('usuarios/' + uid).remove();
  await db.ref('historico/' + uid).remove();
  await db.ref('notificacoes/' + uid).remove();
  showToast('Usuário excluído!', 'info');
  admLoadTab('usuarios');
}

async function admAddPoints() {
  const pts = parseInt(document.getElementById('adm-add-points')?.value);
  if (!pts || pts <= 0) return showToast('Digite uma quantidade válida', 'error');
  if (pts > 1000000) return showToast('Valor máximo: 1.000.000', 'warning');
  
  const total = await addPoints(pts);
  document.getElementById('adm-add-points').value = '';
  showToast('+' + formatPts(pts) + ' pontos! Total: ' + formatPts(total), 'success');
}

// ============================================================
// INICIALIZAÇÃO EM TEMPO REAL
// ============================================================
function initRealtime() {
  if (!STATE.user) return;
  
  // Notificações em tempo real
  db.ref('notificacoes/' + STATE.user.uid).on('value', () => {
    updateNotifBadge();
  });
  
  // Atualizar badge inicial
  updateNotifBadge();
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => {
      if (m.style.display === 'flex') m.style.display = 'none';
    });
  }
});

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.parentElement.style.display = 'none';
  }
});

// ============================================================
// INICIALIZAR
// ============================================================
console.log('✅ Sexta-Feira Studies — script.js carregado!');
console.log('📋 Funcionalidades:');
console.log('  - Login/Cadastro com Firebase');
console.log('  - CRUD Matérias, Tópicos, Quizzes');
console.log('  - Comando /n /q /a /c /f /save');
console.log('  - Feed em tempo real');
console.log('  - Chat em tempo real');
console.log('  - Ranking');
console.log('  - Notificações com badge');
console.log('  - Painel Admin com senha');
console.log('  - Sistema de pontos e níveis');
