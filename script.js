/* ============================================================
   Sexta-Feira Studies — app.js
   Complete Firebase-powered Educational Social Network
   Versão 2.0 — Robusta, funcional e completa
   ============================================================ */

'use strict';

// ============================================================
// GLOBAL STATE MANAGEMENT
// ============================================================
const STATE = {
  // User
  user: null,
  userData: null,
  
  // Navigation
  currentScreen: 'home',
  previousScreen: null,
  
  // Matéria & Tópico
  currentMateriaId: null,
  currentTopicoId: null,
  materiaListener: null,
  
  // Quiz
  currentQuiz: null,
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
  
  // Chat
  currentRoom: null,
  chatListener: null,
  
  // UI State
  selectedEmoji: { materia: '📚' },
  selectedAvatar: '🎓',
  postType: 'post',
  materiaFilter: 'all',
  feedFilter: 'all',
  admTab: 'usuarios',
  
  // Listeners
  listeners: [],
  
  // Cache
  materiasCache: null,
  usersCache: null,
  
  // App status
  isInitialized: false,
  isOnline: navigator.onLine
};

// ============================================================
// CONSTANTS
// ============================================================
const AVATARS = [
  '🎓', '🦁', '🐯', '🦊', '🐼', '🦅', '🌟', '🚀', 
  '⚡', '🎯', '🦄', '🐉', '🌈', '🎭', '💎', '🔥', 
  '🌊', '🌸', '🍀', '🎪', '🎨', '🎵', '📚', '💡'
];

const LEVEL_NAMES = [
  'Iniciante',      // 0
  'Aprendiz',       // 1
  'Estudante',      // 2
  'Dedicado',       // 3
  'Scholar',        // 4
  'Mestre',         // 5
  'Especialista',   // 6
  'Professor',      // 7
  'Guru',           // 8
  'Sábio',          // 9
  'Lenda'           // 10
];

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];

const BADGE_DEFINITIONS = [
  { id: 'novato', label: '🌱 Novato', class: 'badge-silver', condition: (u) => true },
  { id: '1k', label: '⭐ 1K pts', class: 'badge-gold', condition: (u) => (u.points || 0) >= 1000 },
  { id: '5k', label: '🌟 5K pts', class: 'badge-gold', condition: (u) => (u.points || 0) >= 5000 },
  { id: 'gamer', label: '🎮 Gamer', class: 'badge-blue', condition: (u) => (u.quizzesPlayed || 0) >= 10 },
  { id: 'pro_gamer', label: '🏅 Pro Gamer', class: 'badge-gold', condition: (u) => (u.quizzesPlayed || 0) >= 50 },
  { id: 'criador', label: '📚 Criador', class: 'badge-blue', condition: (u) => (u.materiasCreated || 0) >= 3 },
  { id: 'admin', label: '⚙️ Admin', class: 'badge-gold', condition: (u) => u.isAdmin === true },
  { id: 'seguidor', label: '👥 Popular', class: 'badge-silver', condition: (u) => (u.followers || 0) >= 10 },
];

// ============================================================
// FIREBASE HELPERS (com verificações de segurança)
// ============================================================
function getFB() {
  if (!window._firebase) {
    console.error('❌ Firebase não está inicializado! window._firebase é undefined');
    throw new Error('Firebase não inicializado');
  }
  return window._firebase;
}

function fdb() { return getFB().db; }
function fauth() { return getFB().auth; }

function dbRef(path) {
  try {
    return getFB().ref(fdb(), path);
  } catch (e) {
    console.error('❌ Erro ao criar referência:', path, e);
    throw e;
  }
}

async function dbGet(path) {
  try {
    console.log('📖 dbGet:', path);
    const snapshot = await getFB().get(dbRef(path));
    const data = snapshot.exists() ? snapshot.val() : null;
    console.log('📖 dbGet resultado:', path, data ? 'Dados encontrados' : 'Vazio');
    return data;
  } catch (e) {
    console.error('❌ dbGet error:', path, e);
    return null;
  }
}

async function dbSet(path, data) {
  try {
    console.log('✏️ dbSet:', path);
    await getFB().set(dbRef(path), data);
    console.log('✅ dbSet sucesso:', path);
    return true;
  } catch (e) {
    console.error('❌ dbSet error:', path, e);
    return false;
  }
}

async function dbPush(path, data) {
  try {
    console.log('➕ dbPush:', path);
    const result = await getFB().push(dbRef(path), data);
    console.log('✅ dbPush sucesso:', path, result.key);
    return result.key;
  } catch (e) {
    console.error('❌ dbPush error:', path, e);
    return null;
  }
}

async function dbUpdate(path, data) {
  try {
    console.log('🔄 dbUpdate:', path);
    await getFB().update(dbRef(path), data);
    console.log('✅ dbUpdate sucesso:', path);
    return true;
  } catch (e) {
    console.error('❌ dbUpdate error:', path, e);
    return false;
  }
}

async function dbRemove(path) {
  try {
    console.log('🗑️ dbRemove:', path);
    await getFB().remove(dbRef(path));
    console.log('✅ dbRemove sucesso:', path);
    return true;
  } catch (e) {
    console.error('❌ dbRemove error:', path, e);
    return false;
  }
}

function dbListen(path, callback) {
  try {
    console.log('👂 dbListen:', path);
    const ref = dbRef(path);
    const unsubscribe = getFB().onValue(ref, (snapshot) => {
      console.log('👂 dbListen update:', path);
      callback(snapshot);
    }, (error) => {
      console.error('❌ dbListen error:', path, error);
    });
    STATE.listeners.push(unsubscribe);
    return unsubscribe;
  } catch (e) {
    console.error('❌ dbListen setup error:', path, e);
    return null;
  }
}

// ============================================================
// APP INITIALIZATION
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM Content Loaded - Aguardando Firebase...');
  
  // Verificar se Firebase já está disponível
  const checkFirebase = () => {
    if (window._firebase && window._firebase.auth && window._firebase.db) {
      console.log('✅ Firebase detectado, iniciando app...');
      initApp();
    } else {
      console.log('⏳ Aguardando Firebase...');
      setTimeout(checkFirebase, 200);
    }
  };
  
  // Pequeno delay para garantir que o module script carregou
  setTimeout(checkFirebase, 500);
});

function initApp() {
  console.log('🔧 Inicializando Sexta-Feira Studies...');
  
  try {
    const { onAuthStateChanged } = getFB();
    
    // Verificar estado de autenticação
    onAuthStateChanged(fauth(), async (user) => {
      console.log('🔐 Auth state changed:', user ? `Usuário logado: ${user.email}` : 'Nenhum usuário');
      
      if (user) {
        // Usuário está logado
        STATE.user = user;
        console.log('👤 Usuário autenticado:', user.uid, user.email);
        
        // Carregar dados do usuário
        const userDataLoaded = await loadUserData(user.uid);
        
        if (userDataLoaded) {
          console.log('✅ Dados do usuário carregados com sucesso');
          hideSplashScreen();
          showMainApp();
          initializeRealtimeListeners();
        } else {
          console.log('⚠️ Dados do usuário não encontrados, criando perfil...');
          await createUserProfile(user);
          hideSplashScreen();
          showMainApp();
          initializeRealtimeListeners();
        }
      } else {
        // Nenhum usuário logado
        console.log('ℹ️ Nenhum usuário autenticado, mostrando tela de login');
        STATE.user = null;
        STATE.userData = null;
        hideSplashScreen();
        showAuthScreen();
      }
    }, (error) => {
      console.error('❌ Erro no onAuthStateChanged:', error);
      hideSplashScreen();
      showAuthScreen();
    });
    
  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    hideSplashScreen();
    showAuthScreen();
    showToast('Erro ao inicializar app. Recarregue a página.', 'error');
  }
}

// ============================================================
// SPLASH SCREEN
// ============================================================
function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  
  console.log('🎬 Escondendo splash screen...');
  
  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      splash.classList.add('hidden');
      console.log('✅ Splash screen removida');
    }, 500);
  }, 1500); // Mostrar splash por pelo menos 1.5 segundos
}

// ============================================================
// AUTH SCREEN
// ============================================================
function showAuthScreen() {
  console.log('🔐 Mostrando tela de autenticação');
  
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  
  if (authScreen) authScreen.classList.remove('hidden');
  if (app) app.classList.add('hidden');
  
  // Resetar formulários
  resetAuthForms();
  
  // Garantir que a tab de login está ativa
  switchAuthTab('login');
}

function showMainApp() {
  console.log('📱 Mostrando aplicativo principal');
  
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  
  if (authScreen) authScreen.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  
  // Atualizar UI do usuário
  updateUserInterface();
  
  // Navegar para home
  showScreen('home');
  
  // Carregar avatar grid para o modal
  loadAvatarGrid();
  
  console.log('✅ App principal exibido');
}

function resetAuthForms() {
  // Limpar campos de login
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  if (loginEmail) loginEmail.value = '';
  if (loginPassword) loginPassword.value = '';
  
  // Limpar campos de registro
  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regPassword = document.getElementById('reg-password');
  const regConfirm = document.getElementById('reg-confirm');
  if (regName) regName.value = '';
  if (regEmail) regEmail.value = '';
  if (regPassword) regPassword.value = '';
  if (regConfirm) regConfirm.value = '';
  
  // Esconder erros
  hideAuthErrors();
}

function hideAuthErrors() {
  const loginError = document.getElementById('login-error');
  const regError = document.getElementById('reg-error');
  if (loginError) loginError.classList.add('hidden');
  if (regError) regError.classList.add('hidden');
}

function switchAuthTab(tab) {
  console.log('🔄 Mudando para tab:', tab);
  
  // Atualizar botões de tab
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  const tabButton = document.getElementById(`tab-${tab}`);
  if (tabButton) tabButton.classList.add('active');
  
  // Mostrar/esconder formulários
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) loginForm.classList.toggle('hidden', tab !== 'login');
  if (registerForm) registerForm.classList.toggle('hidden', tab !== 'register');
  
  // Limpar erros
  hideAuthErrors();
}

// ============================================================
// LOGIN / REGISTER / LOGOUT
// ============================================================
async function handleLogin() {
  console.log('🔑 Tentando login...');
  
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const btnLogin = document.getElementById('btn-login');
  const errorEl = document.getElementById('login-error');
  
  // Validações
  if (!email) {
    showAuthError('login', 'Por favor, informe seu e-mail');
    return;
  }
  if (!password) {
    showAuthError('login', 'Por favor, informe sua senha');
    return;
  }
  if (password.length < 6) {
    showAuthError('login', 'Senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  // Mostrar loading
  setButtonLoading(btnLogin, true);
  hideAuthErrors();
  
  try {
    const { signInWithEmailAndPassword } = getFB();
    const userCredential = await signInWithEmailAndPassword(fauth(), email, password);
    console.log('✅ Login bem-sucedido:', userCredential.user.email);
    showToast('Login realizado com sucesso! 🎉', 'success');
    // onAuthStateChanged vai lidar com o resto
  } catch (error) {
    console.error('❌ Erro no login:', error.code, error.message);
    setButtonLoading(btnLogin, false);
    
    const errorMessages = {
      'auth/user-not-found': 'E-mail não cadastrado. Crie uma conta!',
      'auth/wrong-password': 'Senha incorreta. Tente novamente.',
      'auth/invalid-email': 'Formato de e-mail inválido.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };
    
    const message = errorMessages[error.code] || `Erro: ${error.message}`;
    showAuthError('login', message);
  }
}

async function handleRegister() {
  console.log('📝 Tentando registro...');
  
  const name = document.getElementById('reg-name')?.value?.trim();
  const email = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm = document.getElementById('reg-confirm')?.value;
  const btnRegister = document.getElementById('btn-register');
  const errorEl = document.getElementById('reg-error');
  
  // Validações
  if (!name) {
    showAuthError('register', 'Por favor, informe seu nome');
    return;
  }
  if (name.length < 2) {
    showAuthError('register', 'Nome muito curto');
    return;
  }
  if (!email) {
    showAuthError('register', 'Por favor, informe seu e-mail');
    return;
  }
  if (!password) {
    showAuthError('register', 'Por favor, crie uma senha');
    return;
  }
  if (password.length < 6) {
    showAuthError('register', 'Senha deve ter pelo menos 6 caracteres');
    return;
  }
  if (password !== confirm) {
    showAuthError('register', 'As senhas não coincidem');
    return;
  }
  
  // Mostrar loading
  setButtonLoading(btnRegister, true);
  hideAuthErrors();
  
  try {
    const { createUserWithEmailAndPassword, updateProfile } = getFB();
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(fauth(), email, password);
    const user = userCredential.user;
    console.log('✅ Conta criada:', user.email);
    
    // Atualizar perfil com nome
    await updateProfile(user, { displayName: name });
    console.log('✅ Perfil atualizado com nome:', name);
    
    // Criar dados do usuário no Realtime Database
    const userData = {
      uid: user.uid,
      name: name,
      email: email,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      bio: '',
      points: 0,
      quizzesPlayed: 0,
      materiasCreated: 0,
      followers: 0,
      following: 0,
      isAdmin: false,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    
    await dbSet(`users/${user.uid}`, userData);
    console.log('✅ Dados do usuário salvos no banco');
    
    // Notificação de boas-vindas
    await addNotification(user.uid, '🎉 Bem-vindo ao Sexta-Feira Studies! Comece criando sua primeira matéria.', 'system');
    
    showToast('Conta criada com sucesso! Bem-vindo! 🎉', 'success');
    // onAuthStateChanged vai lidar com o resto
    
  } catch (error) {
    console.error('❌ Erro no registro:', error.code, error.message);
    setButtonLoading(btnRegister, false);
    
    const errorMessages = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado. Faça login!',
      'auth/invalid-email': 'Formato de e-mail inválido.',
      'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
      'auth/operation-not-allowed': 'Cadastro desabilitado temporariamente.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };
    
    const message = errorMessages[error.code] || `Erro: ${error.message}`;
    showAuthError('register', message);
  }
}

async function handleLogout() {
  if (!confirm('Tem certeza que deseja sair da sua conta?')) return;
  
  console.log('🚪 Fazendo logout...');
  
  try {
    // Remover todos os listeners
    STATE.listeners.forEach(unsub => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch (e) { /* ignore */ }
      }
    });
    STATE.listeners = [];
    
    if (STATE.chatListener) {
      try { STATE.chatListener(); } catch (e) { /* ignore */ }
      STATE.chatListener = null;
    }
    
    const { signOut } = getFB();
    await signOut(fauth());
    
    // Limpar estado
    STATE.user = null;
    STATE.userData = null;
    STATE.currentMateriaId = null;
    STATE.currentTopicoId = null;
    STATE.currentRoom = null;
    
    console.log('✅ Logout realizado');
    showAuthScreen();
    showToast('Até logo! 👋', 'info');
    
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    showToast('Erro ao sair. Tente novamente.', 'error');
  }
}

async function resetPassword() {
  const email = document.getElementById('login-email')?.value?.trim();
  
  if (!email) {
    showToast('Digite seu e-mail no campo acima para recuperar a senha', 'info');
    return;
  }
  
  try {
    const { sendPasswordResetEmail } = getFB();
    await sendPasswordResetEmail(fauth(), email);
    showToast('E-mail de recuperação enviado! Verifique sua caixa de entrada 📧', 'success');
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    const messages = {
      'auth/user-not-found': 'E-mail não encontrado',
      'auth/invalid-email': 'E-mail inválido'
    };
    showToast(messages[error.code] || 'Erro ao enviar e-mail', 'error');
  }
}

// ============================================================
// USER DATA MANAGEMENT
// ============================================================
async function loadUserData(uid) {
  console.log('👤 Carregando dados do usuário:', uid);
  
  try {
    const data = await dbGet(`users/${uid}`);
    
    if (data) {
      STATE.userData = data;
      console.log('✅ Dados do usuário carregados:', data.name, data.points, 'pts');
      
      // Atualizar último login
      await dbUpdate(`users/${uid}`, { lastLogin: Date.now() });
      
      return true;
    } else {
      console.log('⚠️ Dados do usuário não encontrados');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return false;
  }
}

async function createUserProfile(user) {
  console.log('📝 Criando perfil para:', user.uid);
  
  const userData = {
    uid: user.uid,
    name: user.displayName || 'Estudante',
    email: user.email || '',
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    bio: '',
    points: 0,
    quizzesPlayed: 0,
    materiasCreated: 0,
    followers: 0,
    following: 0,
    isAdmin: false,
    createdAt: Date.now(),
    lastLogin: Date.now()
  };
  
  const success = await dbSet(`users/${user.uid}`, userData);
  
  if (success) {
    STATE.userData = userData;
    console.log('✅ Perfil criado com sucesso');
    await addNotification(user.uid, '🎉 Bem-vindo ao Sexta-Feira Studies!', 'system');
  }
  
  return success;
}

function updateUserInterface() {
  if (!STATE.userData) return;
  
  const u = STATE.userData;
  
  // Sidebar
  setElementText('sidebar-name', u.name || 'Usuário');
  setElementText('sidebar-pts', formatPoints(u.points || 0));
  setElementText('sidebar-avatar', u.avatar || getInitials(u.name));
  
  // Topbar
  setElementText('topbar-avatar', u.avatar || getInitials(u.name));
  
  // Post creator avatar
  setElementText('pc-avatar', u.avatar || getInitials(u.name));
  
  // Home greeting
  const firstName = (u.name || 'Estudante').split(' ')[0];
  setElementText('home-greeting', `Olá, ${firstName}! 👋`);
  
  // Mostrar link ADM se for admin
  const navAdm = document.getElementById('nav-adm');
  if (navAdm) {
    navAdm.style.display = u.isAdmin ? 'flex' : 'none';
  }
  
  console.log('✅ Interface do usuário atualizada');
}

// ============================================================
// SCREEN NAVIGATION
// ============================================================
function showScreen(screenName) {
  console.log('📱 Navegando para:', screenName);
  
  // Salvar tela anterior
  STATE.previousScreen = STATE.currentScreen;
  STATE.currentScreen = screenName;
  
  // Esconder todas as telas
  document.querySelectorAll('.screen-section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Mostrar tela alvo
  const target = document.getElementById(`screen-${screenName}`);
  if (target) {
    target.classList.remove('hidden');
    console.log('✅ Tela exibida:', screenName);
  } else {
    console.warn('⚠️ Tela não encontrada:', screenName);
    // Fallback para home
    const homeScreen = document.getElementById('screen-home');
    if (homeScreen) homeScreen.classList.remove('hidden');
  }
  
  // Atualizar navegação ativa
  updateActiveNav(screenName);
  
  // Fechar sidebar no mobile
  closeSidebar();
  
  // Scroll para o topo
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;
  
  // Carregar dados da tela
  loadScreenData(screenName);
}

function updateActiveNav(screenName) {
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === screenName);
  });
  
  // Bottom nav (mobile)
  document.querySelectorAll('.bnav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === screenName);
  });
}

function loadScreenData(screenName) {
  const loaders = {
    'home': loadHomeScreen,
    'materias': loadMateriasScreen,
    'ranking': loadRankingScreen,
    'descobrir': loadDescobrirScreen,
    'chat': loadChatScreen,
    'perfil': loadPerfilScreen,
    'notificacoes': loadNotificacoesScreen,
    'adm': loadAdmScreen
  };
  
  if (loaders[screenName]) {
    console.log('📊 Carregando dados para:', screenName);
    loaders[screenName]();
  }
}

// ============================================================
// HOME SCREEN
// ============================================================
async function loadHomeScreen() {
  console.log('🏠 Carregando home...');
  
  if (!STATE.userData) {
    console.warn('⚠️ Dados do usuário não disponíveis');
    return;
  }
  
  try {
    // Recarregar dados frescos
    const freshData = await dbGet(`users/${STATE.user.uid}`);
    if (freshData) {
      STATE.userData = freshData;
      updateUserInterface();
    }
    
    const pts = STATE.userData.points || 0;
    const level = calculateLevel(pts);
    const nextThreshold = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
    const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
    const progressPercent = Math.min(((pts - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
    
    // Atualizar elementos
    setElementText('home-xp-badge', `Nível ${level + 1} — ${LEVEL_NAMES[level]}`);
    setElementText('stat-pontos', formatPoints(pts));
    setElementText('stat-quizzes', freshData?.quizzesPlayed || 0);
    setElementText('progress-text', `${formatPoints(pts)} / ${formatPoints(nextThreshold)} pts`);
    animateProgressBar('progress-fill', progressPercent);
    
    // Contar matérias do usuário
    const materias = await dbGet('materias');
    let myMateriasCount = 0;
    if (materias) {
      myMateriasCount = Object.values(materias).filter(m => m.autorId === STATE.user.uid).length;
    }
    setElementText('stat-materias', myMateriasCount);
    
    // Posição no ranking
    const users = await dbGet('users');
    if (users) {
      const sortedUsers = Object.values(users)
        .filter(u => u && u.uid)
        .sort((a, b) => (b.points || 0) - (a.points || 0));
      const position = sortedUsers.findIndex(u => u.uid === STATE.user.uid);
      setElementText('stat-rank', position >= 0 ? `#${position + 1}` : '#--');
    }
    
    // Carregar feed recente
    await loadRecentFeed();
    
  } catch (error) {
    console.error('❌ Erro ao carregar home:', error);
  }
}

async function loadRecentFeed() {
  const container = document.getElementById('home-feed');
  if (!container) return;
  
  try {
    const posts = await dbGet('posts');
    
    if (!posts) {
      container.innerHTML = '<div class="empty-state">📭 Nenhuma atividade ainda. Seja o primeiro a postar!</div>';
      return;
    }
    
    const postsArray = Object.entries(posts)
      .map(([id, post]) => ({ id, ...post }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);
    
    if (postsArray.length === 0) {
      container.innerHTML = '<div class="empty-state">📭 Nenhuma atividade recente</div>';
      return;
    }
    
    container.innerHTML = postsArray.map(post => renderFeedItem(post, true)).join('');
    
  } catch (error) {
    console.error('❌ Erro ao carregar feed recente:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar atividades</div>';
  }
}

// ============================================================
// MATÉRIAS SCREEN
// ============================================================
function loadMateriasScreen() {
  console.log('📚 Carregando matérias...');
  
  // Remover listener anterior se existir
  if (STATE.materiaListener) {
    try { STATE.materiaListener(); } catch (e) { /* ignore */ }
    STATE.materiaListener = null;
  }
  
  const container = document.getElementById('materias-grid');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state">⏳ Carregando matérias...</div>';
  
  // Listener em tempo real
  STATE.materiaListener = dbListen('materias', (snapshot) => {
    const materias = snapshot.val();
    renderMaterias(materias);
  });
}

function renderMaterias(materias) {
  const container = document.getElementById('materias-grid');
  if (!container) return;
  
  if (!materias) {
    container.innerHTML = '<div class="empty-state">📚 Nenhuma matéria ainda. Crie a primeira!</div>';
    return;
  }
  
  let materiasArray = Object.entries(materias)
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  // Aplicar filtro
  const filter = STATE.materiaFilter;
  if (filter === 'mine') {
    materiasArray = materiasArray.filter(m => m.autorId === STATE.user?.uid);
  } else if (filter === 'public') {
    materiasArray = materiasArray.filter(m => m.visibilidade === 'public');
  }
  
  // Aplicar busca
  const searchTerm = (document.getElementById('search-materias')?.value || '').toLowerCase();
  if (searchTerm) {
    materiasArray = materiasArray.filter(m => 
      (m.nome || '').toLowerCase().includes(searchTerm) ||
      (m.descricao || '').toLowerCase().includes(searchTerm)
    );
  }
  
  if (materiasArray.length === 0) {
    container.innerHTML = '<div class="empty-state">🔍 Nenhuma matéria encontrada</div>';
    return;
  }
  
  container.innerHTML = materiasArray.map(m => `
    <div class="materia-card" onclick="openMateria('${m.id}')">
      <div class="materia-icon-wrap">${m.icone || '📚'}</div>
      <div class="materia-info">
        <div class="materia-nome">${escapeHtml(m.nome || 'Sem nome')}</div>
        <div class="materia-desc">${escapeHtml(m.descricao || 'Sem descrição')}</div>
        <div class="materia-meta">
          <span class="materia-tag">👤 ${escapeHtml(m.autorNome || 'Anônimo')}</span>
          <span class="materia-tag">📝 ${m.topicosCount || 0} tópicos</span>
          <span class="materia-tag">${m.visibilidade === 'public' ? '🌍 Pública' : '🔒 Privada'}</span>
        </div>
      </div>
      <div class="materia-actions" onclick="event.stopPropagation()">
        ${m.autorId === STATE.user?.uid ? 
          `<button class="btn-sm btn-danger" onclick="deleteMateria('${m.id}')" title="Excluir matéria">🗑️</button>` : ''}
      </div>
    </div>
  `).join('');
}

function setMateriaFilter(filter, buttonElement) {
  STATE.materiaFilter = filter;
  
  // Atualizar UI dos botões
  document.querySelectorAll('#screen-materias .filter-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  if (buttonElement) buttonElement.classList.add('active');
  
  // Re-renderizar
  loadMateriasScreen();
}

function filterMaterias() {
  // Re-renderizar com o termo de busca atual
  loadMateriasScreen();
}

async function openMateria(materiaId) {
  console.log('📖 Abrindo matéria:', materiaId);
  
  STATE.currentMateriaId = materiaId;
  
  try {
    const materia = await dbGet(`materias/${materiaId}`);
    
    if (!materia) {
      showToast('Matéria não encontrada', 'error');
      return;
    }
    
    // Atualizar hero da matéria
    setElementText('materia-hero-icon', materia.icone || '📚');
    setElementText('materia-hero-nome', materia.nome || 'Sem nome');
    setElementText('materia-hero-desc', materia.descricao || 'Sem descrição');
    setElementText('materia-hero-autor', `Por: ${materia.autorNome || 'Anônimo'}`);
    setElementText('materia-hero-topicos', `${materia.topicosCount || 0} tópicos`);
    
    // Navegar para tela de detalhe
    showScreen('materia-detalhe');
    
    // Carregar tópicos e quizzes
    await loadTopicos(materiaId);
    await loadQuizzesMateria(materiaId);
    
  } catch (error) {
    console.error('❌ Erro ao abrir matéria:', error);
    showToast('Erro ao carregar matéria', 'error');
  }
}

// ============================================================
// TÓPICOS
// ============================================================
async function loadTopicos(materiaId) {
  const container = document.getElementById('topicos-list');
  if (!container) return;
  
  try {
    const topicos = await dbGet(`topicos/${
