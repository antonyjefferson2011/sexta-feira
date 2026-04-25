/* ============================================================
   Sexta-Feira Studies — script.js
   Versão Corrigida — Funcional
   ============================================================ */

'use strict';

console.log('🚀 Sexta-Feira Studies — Iniciando...');
console.log('⏰', new Date().toLocaleString());

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
  selectedAvatar: '🎓',
  listeners: [],
  chatListener: null,
  materiaListener: null,
  quizState: {
    questions: [],
    currentIndex: 0,
    score: 0,
    correct: 0,
    timerInterval: null,
    timeLeft: 30,
    startTime: null,
    answers: []
  }
};

// ============================================================
// HELPERS DO FIREBASE
// ============================================================
function getFB() {
  if (!window._firebase) {
    console.error('❌ Firebase não disponível');
    throw new Error('Firebase não inicializado');
  }
  return window._firebase;
}

function fdb() { return getFB().db; }
function fauth() { return getFB().auth; }

async function dbGet(path) {
  try {
    const snap = await getFB().get(getFB().ref(fdb(), path));
    return snap.exists() ? snap.val() : null;
  } catch(e) {
    console.error('dbGet error:', path, e.message);
    return null;
  }
}

async function dbSet(path, data) {
  try {
    await getFB().set(getFB().ref(fdb(), path), data);
    return true;
  } catch(e) {
    console.error('dbSet error:', path, e.message);
    return false;
  }
}

async function dbPush(path, data) {
  try {
    const result = await getFB().push(getFB().ref(fdb(), path), data);
    return result.key;
  } catch(e) {
    console.error('dbPush error:', path, e.message);
    return null;
  }
}

async function dbUpdate(path, data) {
  try {
    await getFB().update(getFB().ref(fdb(), path), data);
    return true;
  } catch(e) {
    console.error('dbUpdate error:', path, e.message);
    return false;
  }
}

async function dbRemove(path) {
  try {
    await getFB().remove(getFB().ref(fdb(), path));
    return true;
  } catch(e) {
    console.error('dbRemove error:', path, e.message);
    return false;
  }
}

function dbListen(path, callback) {
  try {
    const ref = getFB().ref(fdb(), path);
    const unsub = getFB().onValue(ref, callback);
    STATE.listeners.push(unsub);
    return unsub;
  } catch(e) {
    console.error('dbListen error:', path, e.message);
    return null;
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
function initApp() {
  console.log('🔧 initApp() chamado');
  
  if (!window._firebase || !window._firebase.auth) {
    console.error('❌ Firebase não está pronto ainda');
    setTimeout(initApp, 300);
    return;
  }
  
  console.log('✅ Firebase pronto, configurando auth listener');
  
  const { onAuthStateChanged } = getFB();
  
  onAuthStateChanged(fauth(), (user) => {
    console.log('🔐 Auth State Changed:', user ? `Logado: ${user.email}` : 'DESLOGADO');
    
    if (user) {
      STATE.user = user;
      handleUserLoggedIn(user);
    } else {
      STATE.user = null;
      STATE.userData = null;
      handleUserLoggedOut();
    }
  }, (error) => {
    console.error('❌ Erro no auth listener:', error.message);
    // Fallback: remover splash e mostrar login
    removeSplashScreen();
    showAuthScreen();
  });
}

function handleUserLoggedIn(user) {
  console.log('👤 Usuário logado:', user.uid);
  
  // Carregar dados do usuário
  dbGet(`users/${user.uid}`).then(userData => {
    if (userData) {
      STATE.userData = userData;
      console.log('✅ Dados carregados:', userData.name, userData.points, 'pts');
    } else {
      // Criar perfil se não existir
      console.log('⚠️ Perfil não encontrado, criando...');
      const newData = {
        uid: user.uid,
        name: user.displayName || 'Estudante',
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
      dbSet(`users/${user.uid}`, newData);
      STATE.userData = newData;
    }
    
    // Atualizar UI
    updateUserUI();
    
    // Remover splash e mostrar app
    removeSplashScreen();
    showMainApp();
    
  }).catch(error => {
    console.error('❌ Erro ao carregar dados:', error);
    removeSplashScreen();
    showMainApp();
  });
}

function handleUserLoggedOut() {
  console.log('👋 Usuário deslogado');
  removeSplashScreen();
  showAuthScreen();
}

// ============================================================
// SPLASH SCREEN
// ============================================================
function removeSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  
  console.log('🎬 Removendo splash screen');
  
  splash.style.opacity = '0';
  splash.style.transition = 'opacity 0.4s ease';
  
  setTimeout(() => {
    splash.style.display = 'none';
    console.log('✅ Splash removida');
  }, 400);
}

// ============================================================
// AUTH SCREEN
// ============================================================
function showAuthScreen() {
  console.log('🔐 Mostrando tela de login');
  
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  
  if (authScreen) authScreen.style.display = 'flex';
  if (app) app.style.display = 'none';
  
  // Resetar formulários
  const loginEmail = document.getElementById('login-email');
  const loginPass = document.getElementById('login-password');
  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regPass = document.getElementById('reg-password');
  const regConfirm = document.getElementById('reg-confirm');
  
  if (loginEmail) loginEmail.value = '';
  if (loginPass) loginPass.value = '';
  if (regName) regName.value = '';
  if (regEmail) regEmail.value = '';
  if (regPass) regPass.value = '';
  if (regConfirm) regConfirm.value = '';
  
  // Esconder erros
  const loginError = document.getElementById('login-error');
  const regError = document.getElementById('reg-error');
  if (loginError) loginError.style.display = 'none';
  if (regError) regError.style.display = 'none';
  
  // Garantir que login está ativo
  switchAuthTab('login');
}

function showMainApp() {
  console.log('📱 Mostrando app principal');
  
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  
  if (authScreen) authScreen.style.display = 'none';
  if (app) app.style.display = 'block';
  
  showScreen('home');
}

function switchAuthTab(tab) {
  console.log('🔄 Mudando tab:', tab);
  
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  const tabBtn = document.getElementById(`tab-${tab}`);
  if (tabBtn) tabBtn.classList.add('active');
  
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  
  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (regForm) regForm.style.display = tab === 'register' ? 'block' : 'none';
}

// ============================================================
// LOGIN / REGISTER
// ============================================================
async function handleLogin() {
  console.log('🔑 Tentando login...');
  
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const btn = document.getElementById('btn-login');
  const errorEl = document.getElementById('login-error');
  
  if (!email || !password) {
    showAuthError('login', 'Preencha todos os campos');
    return;
  }
  
  setBtnLoading(btn, true);
  if (errorEl) errorEl.style.display = 'none';
  
  try {
    const { signInWithEmailAndPassword } = getFB();
    await signInWithEmailAndPassword(fauth(), email, password);
    console.log('✅ Login bem-sucedido');
    showToast('Login realizado! 🎉', 'success');
  } catch(e) {
    console.error('❌ Erro login:', e.code, e.message);
    setBtnLoading(btn, false);
    
    const msgs = {
      'auth/user-not-found': 'E-mail não cadastrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-email': 'E-mail inválido',
      'auth/invalid-credential': 'E-mail ou senha incorretos',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde.'
    };
    showAuthError('login', msgs[e.code] || e.message);
  }
}

async function handleRegister() {
  console.log('📝 Tentando registro...');
  
  const name = document.getElementById('reg-name')?.value?.trim();
  const email = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm = document.getElementById('reg-confirm')?.value;
  const btn = document.getElementById('btn-register');
  const errorEl = document.getElementById('reg-error');
  
  if (!name || !email || !password) {
    showAuthError('register', 'Preencha todos os campos');
    return;
  }
  if (password !== confirm) {
    showAuthError('register', 'Senhas não coincidem');
    return;
  }
  if (password.length < 6) {
    showAuthError('register', 'Senha deve ter 6+ caracteres');
    return;
  }
  
  setBtnLoading(btn, true);
  if (errorEl) errorEl.style.display = 'none';
  
  try {
    const { createUserWithEmailAndPassword, updateProfile } = getFB();
    const cred = await createUserWithEmailAndPassword(fauth(), email, password);
    
    await updateProfile(cred.user, { displayName: name });
    
    const userData = {
      uid: cred.user.uid,
      name, email,
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
    await dbPush(`notificacoes/${cred.user.uid}`, {
      mensagem: '🎉 Bem-vindo ao Sexta-Feira Studies!',
      tipo: 'system',
      lida: false,
      createdAt: Date.now()
    });
    
    console.log('✅ Registro bem-sucedido');
    showToast('Conta criada! 🎉', 'success');
  } catch(e) {
    console.error('❌ Erro registro:', e.code, e.message);
    setBtnLoading(btn, false);
    
    const msgs = {
      'auth/email-already-in-use': 'E-mail já cadastrado',
      'auth/invalid-email': 'E-mail inválido',
      'auth/weak-password': 'Senha muito fraca'
    };
    showAuthError('register', msgs[e.code] || e.message);
  }
}

async function handleLogout() {
  if (!confirm('Sair da conta?')) return;
  
  STATE.listeners.forEach(u => { try { u(); } catch(e){} });
  STATE.listeners = [];
  
  try {
    const { signOut } = getFB();
    await signOut(fauth());
    STATE.user = null;
    STATE.userData = null;
    showToast('Até logo! 👋', 'info');
  } catch(e) {
    showToast('Erro ao sair', 'error');
  }
}

// ============================================================
// UI HELPERS
// ============================================================
function updateUserUI() {
  if (!STATE.userData) return;
  const u = STATE.userData;
  
  setText('sidebar-name', u.name || 'Usuário');
  setText('sidebar-pts', formatPts(u.points || 0));
  setText('sidebar-avatar', u.avatar || '?');
  setText('topbar-avatar', u.avatar || '?');
  setText('pc-avatar', u.avatar || '?');
  
  const firstName = (u.name || 'Estudante').split(' ')[0];
  setText('home-greeting', `Olá, ${firstName}! 👋`);
  
  const navAdm = document.getElementById('nav-adm');
  if (navAdm) navAdm.style.display = u.isAdmin ? 'flex' : 'none';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatPts(pts) {
  if (pts >= 1000) return (pts/1000).toFixed(1) + 'K';
  return String(pts || 0);
}

function showAuthError(type, msg) {
  const el = document.getElementById(`${type}-error`);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function setBtnLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('span');
  const loader = btn.querySelector('.btn-loader');
  if (text) text.style.display = loading ? 'none' : 'inline';
  if (loader) loader.style.display = loading ? 'inline-block' : 'none';
  btn.disabled = loading;
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function showScreen(name) {
  console.log('📱 Navegando para:', name);
  
  STATE.currentScreen = name;
  
  // Esconder todas as sections
  document.querySelectorAll('.screen-section').forEach(s => {
    s.style.display = 'none';
  });
  
  // Mostrar a section alvo
  const target = document.getElementById(`screen-${name}`);
  if (target) {
    target.style.display = 'block';
  }
  
  // Atualizar nav ativa
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.screen === name);
  });
  
  // Fechar sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    toggleSidebar();
  }
  
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
    ranking: loadRanking,
    descobrir: loadFeed,
    chat: loadChat,
    perfil: loadPerfil,
    notificacoes: loadNotifs
  };
  if (loaders[name]) loaders[name]();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.style.display = sidebar?.classList.contains('open') ? 'block' : 'none';
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// ============================================================
// HOME
// ============================================================
async function loadHome() {
  if (!STATE.userData) return;
  
  const refresh = await dbGet(`users/${STATE.user.uid}`);
  if (refresh) { STATE.userData = refresh; updateUserUI(); }
  
  const pts = STATE.userData.points || 0;
  let level = 0;
  for (let i = 0; i < [0,100,250,500,1000,2000,3500,5500,8000,12000,20000].length; i++) {
    if (pts >= [0,100,250,500,1000,2000,3500,5500,8000,12000,20000][i]) level = i;
  }
  
  const thresholds = [0,100,250,500,1000,2000,3500,5500,8000,12000,20000];
  const names = ['Iniciante','Aprendiz','Estudante','Dedicado','Scholar','Mestre','Especialista','Professor','Guru','Sábio','Lenda'];
  const nextThreshold = thresholds[Math.min(level+1, thresholds.length-1)];
  const curThreshold = thresholds[level] || 0;
  const pct = Math.min(((pts - curThreshold) / (nextThreshold - curThreshold)) * 100, 100);
  
  setText('home-xp-badge', `Nível ${level+1} — ${names[level]}`);
  setText('stat-pontos', formatPts(pts));
  setText('stat-quizzes', refresh?.quizzesPlayed || 0);
  setText('progress-text', `${formatPts(pts)} / ${formatPts(nextThreshold)} pts`);
  
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${pct}%`;
  
  // Matérias
  const materias = await dbGet('materias');
  let count = 0;
  if (materias) count = Object.values(materias).filter(m => m.autorId === STATE.user.uid).length;
  setText('stat-materias', count);
  
  // Ranking
  const users = await dbGet('users');
  if (users) {
    const sorted = Object.values(users).filter(u => u && u.uid).sort((a,b) => (b.points||0)-(a.points||0));
    const pos = sorted.findIndex(u => u.uid === STATE.user.uid);
    setText('stat-rank', pos >= 0 ? `#${pos+1}` : '#--');
  }
  
  // Feed recente
  const posts = await dbGet('posts');
  const feedContainer = document.getElementById('home-feed');
  if (feedContainer) {
    if (!posts) {
      feedContainer.innerHTML = '<div class="empty-state">📭 Nenhuma atividade</div>';
    } else {
      const arr = Object.entries(posts).map(([id,p]) => ({id,...p})).sort((a,b) => (b.createdAt||0)-(a.createdAt||0)).slice(0,5);
      feedContainer.innerHTML = arr.length ? arr.map(p => renderFeedItem(p, true)).join('') : '<div class="empty-state">📭 Nenhuma atividade</div>';
    }
  }
}

function renderFeedItem(p, compact=false) {
  const tipoLabel = { post: '💬', dica: '💡', duvida: '❓', atividade: '⚡' }[p.tipo] || '💬';
  const tipoClass = { post: 'type-post', dica: 'type-dica', duvida: 'type-duvida', atividade: 'type-post' }[p.tipo] || 'type-post';
  
  return `
    <div class="feed-item">
      <div class="feed-item-header">
        <div class="feed-avatar">${p.autorAvatar || '?'}</div>
        <div class="feed-meta">
          <div class="feed-author">${escapeHtml(p.autorNome || 'Anônimo')}</div>
          <div class="feed-time">${timeAgo(p.createdAt)}</div>
        </div>
        <span class="feed-type-badge ${tipoClass}">${tipoLabel}</span>
      </div>
      <div class="feed-text">${escapeHtml(p.texto)}</div>
      ${!compact ? `<div class="feed-actions">
        <button class="feed-action-btn" onclick="likePost('${p.id}')">❤️ ${p.likes ? Object.keys(p.likes).length : 0}</button>
      </div>` : ''}
    </div>
  `;
}

// ============================================================
// MATÉRIAS
// ============================================================
function loadMaterias() {
  if (STATE.materiaListener) { try { STATE.materiaListener(); } catch(e){} }
  
  STATE.materiaListener = dbListen('materias', (snap) => {
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
  
  let arr = Object.entries(materias).map(([id,m]) => ({id,...m}));
  
  if (STATE.materiaFilter === 'mine') arr = arr.filter(m => m.autorId === STATE.user?.uid);
  else if (STATE.materiaFilter === 'public') arr = arr.filter(m => m.visibilidade === 'public');
  
  const search = (document.getElementById('search-materias')?.value || '').toLowerCase();
  if (search) arr = arr.filter(m => (m.nome||'').toLowerCase().includes(search));
  
  arr.sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
  
  container.innerHTML = arr.length ? arr.map(m => `
    <div class="materia-card" onclick="openMateria('${m.id}')">
      <div class="materia-icon-wrap">${m.icone || '📚'}</div>
      <div class="materia-info">
        <div class="materia-nome">${escapeHtml(m.nome)}</div>
        <div class="materia-desc">${escapeHtml(m.descricao || 'Sem descrição')}</div>
        <div class="materia-meta">
          <span>👤 ${escapeHtml(m.autorNome || 'Anônimo')}</span>
          <span>📝 ${m.topicosCount || 0} tópicos</span>
        </div>
      </div>
    </div>
  `).join('') : '<div class="empty-state">🔍 Nenhuma matéria encontrada</div>';
}

function setMateriaFilter(filter, btn) {
  STATE.materiaFilter = filter;
  document.querySelectorAll('#screen-materias .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadMaterias();
}

function filterMaterias() { loadMaterias(); }

async function openMateria(id) {
  STATE.currentMateriaId = id;
  const m = await dbGet(`materias/${id}`);
  if (!m) return showToast('Matéria não encontrada', 'error');
  
  setText('materia-hero-icon', m.icone || '📚');
  setText('materia-hero-nome', m.nome);
  setText('materia-hero-desc', m.descricao || '');
  setText('materia-hero-autor', `Por: ${m.autorNome || 'Anônimo'}`);
  setText('materia-hero-topicos', `${m.topicosCount || 0} tópicos`);
  
  showScreen('materia-detalhe');
  loadTopicos(id);
}

async function loadTopicos(materiaId) {
  const container = document.getElementById('topicos-list');
  if (!container) return;
  
  const topicos = await dbGet(`topicos/${materiaId}`);
  if (!topicos) {
    container.innerHTML = '<div class="empty-state">Nenhum tópico ainda</div>';
    return;
  }
  
  const arr = Object.entries(topicos).map(([id,t]) => ({id,...t}));
  container.innerHTML = arr.map(t => `
    <div class="topico-item" onclick="openTopico('${t.id}')">
      <div class="topico-item-icon">📄</div>
      <div class="topico-item-info">
        <div class="topico-item-title">${escapeHtml(t.titulo)}</div>
        <div class="topico-item-meta">${escapeHtml(t.autorNome || 'Anônimo')} · ${timeAgo(t.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// CRIAR MATÉRIA
// ============================================================
async function criarMateria() {
  const nome = document.getElementById('nm-nome')?.value?.trim();
  const desc = document.getElementById('nm-desc')?.value?.trim();
  const vis = document.getElementById('nm-vis')?.value || 'public';
  
  if (!nome) return showToast('Nome é obrigatório', 'error');
  
  const materia = {
    nome, descricao: desc, visibilidade: vis,
    icone: '📚',
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
    
    await dbUpdate(`users/${STATE.user.uid}`, {
      materiasCreated: (STATE.userData.materiasCreated || 0) + 1
    });
    
    addPoints(20);
    showToast('Matéria criada! 📚', 'success');
  }
}

async function criarTopico() {
  const titulo = document.getElementById('nt-titulo')?.value?.trim();
  const conteudo = document.getElementById('nt-conteudo')?.value?.trim();
  
  if (!titulo || !conteudo) return showToast('Preencha todos os campos', 'error');
  if (!STATE.currentMateriaId) return showToast('Selecione uma matéria', 'error');
  
  const topico = {
    titulo, conteudo,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    createdAt: Date.now()
  };
  
  const key = await dbPush(`topicos/${STATE.currentMateriaId}`, topico);
  if (key) {
    const m = await dbGet(`materias/${STATE.currentMateriaId}`);
    if (m) await dbUpdate(`materias/${STATE.currentMateriaId}`, { topicosCount: (m.topicosCount||0)+1 });
    
    closeModal('modal-novo-topico');
    document.getElementById('nt-titulo').value = '';
    document.getElementById('nt-conteudo').value = '';
    
    addPoints(15);
    showToast('Tópico criado! 📝', 'success');
    loadTopicos(STATE.currentMateriaId);
  }
}

// ============================================================
// RANKING
// ============================================================
async function loadRanking() {
  const container = document.getElementById('ranking-list');
  if (!container) return;
  
  dbListen('users', (snap) => {
    const users = snap.val();
    if (!users) return;
    
    const arr = Object.values(users).filter(u => u && u.uid).sort((a,b) => (b.points||0)-(a.points||0));
    
    // Pódio
    const setPodio = (n, u) => {
      if (!u) return;
      setText(`podio${n}-av`, u.avatar || '?');
      setText(`podio${n}-name`, (u.name||'User').split(' ')[0]);
      setText(`podio${n}-pts`, formatPts(u.points||0));
    };
    setPodio(1, arr[0]); setPodio(2, arr[1]); setPodio(3, arr[2]);
    
    // Minha posição
    const myPos = arr.findIndex(u => u.uid === STATE.user?.uid);
    setText('my-rank-num', myPos >= 0 ? `#${myPos+1}` : '#--');
    setText('my-rank-pts', formatPts(arr[myPos]?.points || 0));
    
    // Lista
    container.innerHTML = arr.slice(0, 50).map((u, i) => `
      <div class="ranking-item ${u.uid === STATE.user?.uid ? 'rank-me' : ''}">
        <div class="rank-pos">${i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</div>
        <div class="rank-avatar">${u.avatar || '?'}</div>
        <div class="rank-info">
          <div class="rank-name">${escapeHtml(u.name||'Usuário')} ${u.uid===STATE.user?.uid?'(Você)':''}</div>
          <div class="rank-sub">${u.quizzesPlayed||0} quizzes</div>
        </div>
        <div class="rank-pts">${formatPts(u.points||0)}</div>
      </div>
    `).join('');
  });
}

// ============================================================
// PONTOS
// ============================================================
async function addPoints(pts) {
  const current = await dbGet(`users/${STATE.user.uid}/points`) || 0;
  const newPts = current + pts;
  await dbSet(`users/${STATE.user.uid}/points`, newPts);
  if (STATE.userData) STATE.userData.points = newPts;
  updateUserUI();
  showToast(`+${pts} pontos! ⭐`, 'success');
}

// ============================================================
// FEED / DESCOBRIR
// ============================================================
function loadFeed() {
  const container = document.getElementById('descobrir-feed');
  if (!container) return;
  
  dbListen('posts', (snap) => {
    const posts = snap.val();
    if (!posts) {
      container.innerHTML = '<div class="empty-state">Nenhum post ainda</div>';
      return;
    }
    
    let arr = Object.entries(posts).map(([id,p]) => ({id,...p}));
    if (STATE.feedFilter !== 'all') arr = arr.filter(p => p.tipo === STATE.feedFilter);
    arr.sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
    
    container.innerHTML = arr.length ? arr.map(p => renderFeedItem(p)).join('') : '<div class="empty-state">Nenhum post</div>';
  });
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
  const text = document.getElementById('new-post-text')?.value?.trim();
  if (!text) return showToast('Escreva algo', 'error');
  
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
    addPoints(5);
    showToast('Publicado! 🎉', 'success');
  }
}

// ============================================================
// CHAT
// ============================================================
function loadChat() {
  const roomsContainer = document.getElementById('rooms-list');
  if (!roomsContainer) return;
  
  dbListen('chat_rooms', (snap) => {
    const rooms = snap.val();
    if (!rooms) {
      roomsContainer.innerHTML = '<div class="room-item">Nenhuma sala</div>';
      return;
    }
    
    roomsContainer.innerHTML = Object.entries(rooms).map(([id, r]) => `
      <div class="room-item ${STATE.currentRoom===id?'active':''}" onclick="joinRoom('${id}')">
        <div class="room-name"># ${escapeHtml(r.nome)}</div>
        <div class="room-last">${escapeHtml(r.descricao || '')}</div>
      </div>
    `).join('');
  });
}

async function joinRoom(roomId) {
  STATE.currentRoom = roomId;
  const room = await dbGet(`chat_rooms/${roomId}`);
  if (!room) return;
  
  setText('chat-room-name', '# ' + room.nome);
  document.getElementById('chat-no-room').style.display = 'none';
  document.getElementById('chat-room-view').style.display = 'flex';
  
  if (STATE.chatListener) { try { STATE.chatListener(); } catch(e){} }
  
  STATE.chatListener = dbListen(`chat_messages/${roomId}`, (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (!msgs) {
      container.innerHTML = '<div class="empty-state">Sem mensagens. Diga olá! 👋</div>';
      return;
    }
    
    const arr = Object.entries(msgs).map(([id,m]) => ({id,...m})).sort((a,b) => (a.createdAt||0)-(b.createdAt||0));
    container.innerHTML = arr.map(m => `
      <div class="chat-msg ${m.autorId===STATE.user?.uid?'mine':''}">
        <div class="chat-msg-avatar">${m.autorAvatar || '?'}</div>
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

async function sendChatMessage() {
  const input = document.getElementById('chat-msg-input');
  const text = input?.value?.trim();
  if (!text || !STATE.currentRoom) return;
  
  await dbPush(`chat_messages/${STATE.currentRoom}`, {
    texto: text,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.name,
    autorAvatar: STATE.userData.avatar || '🎓',
    createdAt: Date.now()
  });
  
  input.value = '';
}

async function criarSala() {
  const nome = document.getElementById('ns-nome')?.value?.trim();
  const desc = document.getElementById('ns-desc')?.value?.trim();
  if (!nome) return showToast('Nome é obrigatório', 'error');
  
  const key = await dbPush('chat_rooms', {
    nome, descricao: desc,
    criadorId: STATE.user.uid,
    createdAt: Date.now()
  });
  
  if (key) {
    closeModal('modal-nova-sala');
    document.getElementById('ns-nome').value = '';
    document.getElementById('ns-desc').value = '';
    showToast('Sala criada! 💬', 'success');
    joinRoom(key);
  }
}

// ============================================================
// PERFIL
// ============================================================
async function loadPerfil() {
  if (!STATE.userData) return;
  
  const fresh = await dbGet(`users/${STATE.user.uid}`);
  if (fresh) STATE.userData = fresh;
  
  const u = STATE.userData;
  setText('perfil-avatar', u.avatar || '?');
  setText('perfil-name', u.name || 'Usuário');
  setText('perfil-email', u.email || '');
  setText('pstat-pts', formatPts(u.points||0));
  setText('pstat-quizzes', u.quizzesPlayed||0);
  setText('pstat-materias', u.materiasCreated||0);
  setText('pstat-seguidores', u.followers||0);
  
  document.getElementById('edit-name').value = u.name || '';
  document.getElementById('edit-bio').value = u.bio || '';
  
  // Badges
  const badges = [];
  if ((u.points||0) >= 1000) badges.push('<span class="badge badge-gold">⭐ 1K pts</span>');
  if ((u.quizzesPlayed||0) >= 10) badges.push('<span class="badge badge-blue">🎮 Gamer</span>');
  if ((u.materiasCreated||0) >= 3) badges.push('<span class="badge badge-silver">📚 Criador</span>');
  if (u.isAdmin) badges.push('<span class="badge badge-gold">⚙️ Admin</span>');
  if (!badges.length) badges.push('<span class="badge badge-silver">🌱 Novato</span>');
  
  document.getElementById('perfil-badges').innerHTML = badges.join(' ');
  
  // Histórico
  const hist = await dbGet(`historico/${STATE.user.uid}`);
  const histContainer = document.getElementById('perfil-historico');
  if (histContainer) {
    if (!hist) {
      histContainer.innerHTML = '<div class="empty-state">Nenhum quiz ainda</div>';
    } else {
      const arr = Object.entries(hist).map(([id,h]) => ({id,...h})).sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
      histContainer.innerHTML = arr.map(h => `
        <div class="historico-item">
          <div class="hist-icon">🎮</div>
          <div class="hist-info">
            <div class="hist-name">${escapeHtml(h.quizNome || 'Quiz')}</div>
            <div class="hist-meta">${h.acertos}/${h.total} · ${h.pct}%</div>
          </div>
          <div class="hist-pts">+${formatPts(h.score)}</div>
        </div>
      `).join('');
    }
  }
}

async function saveProfile() {
  const name = document.getElementById('edit-name')?.value?.trim();
  const bio = document.getElementById('edit-bio')?.value?.trim();
  
  if (!name) return showToast('Nome é obrigatório', 'error');
  
  await dbUpdate(`users/${STATE.user.uid}`, { name, bio });
  STATE.userData.name = name;
  STATE.userData.bio = bio;
  
  try {
    await getFB().updateProfile(fauth().currentUser, { displayName: name });
  } catch(e) {}
  
  updateUserUI();
  setText('perfil-name', name);
  showToast('Perfil salvo! ✅', 'success');
}

// ============================================================
// AVATAR
// ============================================================
function loadAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;
  
  const avatars = ['🎓','🦁','🐯','🦊','🐼','🦅','🌟','🚀','⚡','🎯','🦄','🐉','🌈','🎭','💎','🔥','🌊','🌸','🍀','🎪'];
  
  grid.innerHTML = avatars.map(a => `
    <button class="avatar-opt ${a === STATE.userData?.avatar ? 'selected' : ''}" onclick="selectAvatar('${a}', this)">${a}</button>
  `).join('');
}

function selectAvatar(avatar, btn) {
  STATE.selectedAvatar = avatar;
  document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
}

async function saveAvatar() {
  const avatar = STATE.selectedAvatar || '🎓';
  await dbUpdate(`users/${STATE.user.uid}`, { avatar });
  STATE.userData.avatar = avatar;
  updateUserUI();
  setText('perfil-avatar', avatar);
  closeModal('modal-edit-avatar');
  showToast('Avatar atualizado! ' + avatar, 'success');
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================
function loadNotifs() {
  const container = document.getElementById('notificacoes-list');
  if (!container) return;
  
  dbGet(`notificacoes/${STATE.user.uid}`).then(notifs => {
    if (!notifs) {
      container.innerHTML = '<div class="empty-state">Sem notificações</div>';
      return;
    }
    
    const arr = Object.entries(notifs).map(([id,n]) => ({id,...n})).sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
    container.innerHTML = arr.map(n => `
      <div class="notif-item ${n.lida ? '' : 'unread'}">
        <div class="notif-icon">🔔</div>
        <div class="notif-content">
          <div class="notif-msg">${escapeHtml(n.mensagem)}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join('');
    
    // Marcar como lidas
    arr.forEach(n => {
      if (!n.lida) dbUpdate(`notificacoes/${STATE.user.uid}/${n.id}`, { lida: true });
    });
    
    updateNotifBadge(0);
  });
}

function updateNotifBadge(count) {
  const badge = document.getElementById('notif-count');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

async function markAllRead() {
  const notifs = await dbGet(`notificacoes/${STATE.user.uid}`);
  if (!notifs) return;
  
  for (const id of Object.keys(notifs)) {
    await dbUpdate(`notificacoes/${STATE.user.uid}/${id}`, { lida: true });
  }
  
  showToast('Todas lidas ✓', 'info');
  loadNotifs();
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function timeAgo(ts) {
  if (!ts) return 'agora';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return Math.floor(diff/60) + 'min';
  if (diff < 86400) return Math.floor(diff/3600) + 'h';
  if (diff < 2592000) return Math.floor(diff/86400) + 'd';
  return new Date(ts).toLocaleDateString('pt-BR');
}

// ============================================================
// INIT
// ============================================================
// Aguardar Firebase e iniciar
const waitForFirebase = setInterval(() => {
  if (window._firebase && window._firebase.auth) {
    clearInterval(waitForFirebase);
    console.log('✅ Firebase detectado, iniciando app');
    initApp();
  } else {
    console.log('⏳ Aguardando Firebase...');
  }
}, 200);

// Timeout de segurança: depois de 8 segundos, força remover splash
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  const auth = document.getElementById('auth-screen');
  
  if (splash && splash.style.display !== 'none') {
    console.warn('⚠️ Timeout! Forçando remoção da splash');
    splash.style.display = 'none';
    
    if (auth && auth.style.display === 'none') {
      auth.style.display = 'flex';
    }
  }
}, 8000);

// Fechar modais com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => {
      if (m.style.display === 'flex') m.style.display = 'none';
    });
  }
});

console.log('📋 script.js carregado completamente');
console.log('🎯 Sexta-Feira Studies pronto!');
