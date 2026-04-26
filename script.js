'use strict';
// ========== BADGES ==========
const BADGES = [
  { nome: '🌱 Novato', cond: (u) => true },
  { nome: '📖 Primeira Aula', cond: (u) => (u.materiasCreated || 0) >= 1 },
  { nome: '📚 Bibliotecário', cond: (u) => (u.materiasCreated || 0) >= 5 },
  { nome: '🏛️ Arquiteto', cond: (u) => (u.materiasCreated || 0) >= 10 },
  { nome: '🎓 Universitário', cond: (u) => (u.materiasCreated || 0) >= 25 },
  { nome: '📝 Primeiro Tópico', cond: (u) => (u.topicosCreated || 0) >= 1 },
  { nome: '✍️ Escritor', cond: (u) => (u.topicosCreated || 0) >= 10 },
  { nome: '📜 Historiador', cond: (u) => (u.topicosCreated || 0) >= 25 },
  { nome: '🖋️ Best-Seller', cond: (u) => (u.topicosCreated || 0) >= 50 },
  { nome: '💬 Comentarista', cond: (u) => (u.comentarios || 0) >= 10 },
  { nome: '🗣️ Palestrante', cond: (u) => (u.comentarios || 0) >= 50 },
  { nome: '📢 Influenciador', cond: (u) => (u.comentarios || 0) >= 100 },
  { nome: '🎮 Primeiro Quiz', cond: (u) => (u.quizzesPlayed || 0) >= 1 },
  { nome: '🕹️ Gamer', cond: (u) => (u.quizzesPlayed || 0) >= 10 },
  { nome: '🎯 Viciado', cond: (u) => (u.quizzesPlayed || 0) >= 50 },
  { nome: '👑 Rei dos Quizzes', cond: (u) => (u.quizzesPlayed || 0) >= 100 },
  { nome: '🏆 Campeão', cond: (u) => (u.quizzesPlayed || 0) >= 500 },
  { nome: '🎯 Perfeito', cond: (u) => (u.quizPerfeito || 0) >= 1 },
  { nome: '💯 Perfeccionista', cond: (u) => (u.quizPerfeito || 0) >= 5 },
  { nome: '🌟 Impecável', cond: (u) => (u.quizPerfeito || 0) >= 10 },
  { nome: '⚡ Relâmpago', cond: (u) => (u.quizRapido || 0) >= 1 },
  { nome: '🚀 Turbo', cond: (u) => (u.quizRapido || 0) >= 5 },
  { nome: '🧠 Gênio', cond: (u) => (u.quizAltaNota || 0) >= 10 },
  { nome: '🎓 PhD', cond: (u) => (u.quizAltaNota || 0) >= 50 },
  { nome: '📊 Estatístico', cond: (u) => (u.quizzesCreated || 0) >= 5 },
  { nome: '🏗️ Construtor', cond: (u) => (u.quizzesCreated || 0) >= 25 },
  { nome: '🎪 Showman', cond: (u) => (u.quizzesCreated || 0) >= 100 },
  { nome: '⭐ 1K', cond: (u) => (u.points || 0) >= 1000 },
  { nome: '💰 5K', cond: (u) => (u.points || 0) >= 5000 },
  { nome: '💎 10K', cond: (u) => (u.points || 0) >= 10000 },
  { nome: '🏅 50K', cond: (u) => (u.points || 0) >= 50000 },
  { nome: '👑 100K', cond: (u) => (u.points || 0) >= 100000 },
  { nome: '🐉 1M', cond: (u) => (u.points || 0) >= 1000000 },
  { nome: '🌌 10M', cond: (u) => (u.points || 0) >= 10000000 },
  { nome: '🚀 100M', cond: (u) => (u.points || 0) >= 100000000 },
  { nome: '🌠 1B', cond: (u) => (u.points || 0) >= 1000000000 },
  { nome: '👤 Social', cond: (u) => (u.seguidores || 0) >= 1 },
  { nome: '👥 Popular', cond: (u) => (u.seguidores || 0) >= 10 },
  { nome: '🎉 Celebridade', cond: (u) => (u.seguidores || 0) >= 50 },
  { nome: '🌟 Estrela', cond: (u) => (u.seguidores || 0) >= 100 },
  { nome: '👑 Ícone', cond: (u) => (u.seguidores || 0) >= 500 },
  { nome: '💬 Tagarela', cond: (u) => (u.msgsChat || 0) >= 100 },
  { nome: '🏠 Anfitrião', cond: (u) => (u.salasCriadas || 0) >= 1 },
  { nome: '📸 Perfil', cond: (u) => u.avatar && u.avatar.startsWith('http') },
  { nome: '✏️ Bio', cond: (u) => u.bio && u.bio.length > 0 },
  { nome: '🥇 Top 1', cond: (u) => u.rankPosition === 1 },
  { nome: '🥈 Top 3', cond: (u) => u.rankPosition && u.rankPosition <= 3 },
  { nome: '✅ Professor', cond: (u) => u.isProf === true },
  { nome: '⚙️ Admin', cond: (u) => u.isAdmin === true },
  { nome: '🤖 IA Friend', cond: (u) => (u.neurinhoMsgs || 0) >= 10 },
  { nome: '🧠 Neurinho', cond: (u) => (u.neurinhoMsgs || 0) >= 100 },
  { nome: '🎉 Fundador', cond: (u) => u.createdAt && u.createdAt < 1750000000000 },
];
// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyBAs3irtV6MuTPHmsxYwYSFMTkX6_6ntz8",
  authDomain: "sexta-feira-fb01a.firebaseapp.com",
  databaseURL: "https://sexta-feira-fb01a-default-rtdb.firebaseio.com",
  projectId: "sexta-feira-fb01a",
  storageBucket: "sexta-feira-fb01a.firebasestorage.app",
  messagingSenderId: "82809140147",
  appId: "1:82809140147:web:2a3f3ece3e81c33b0b91c6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
console.log('✅ Firebase OK');

// ========== STATE ==========
const S = {
  user: null,
  ud: null,
  mid: null,    // materia atual
  tid: null,    // topico atual
  room: null,   // sala de chat atual
  roomListener: null,
  pvUser: null,
  pvListener: null,
  mFilter: 'all',
  fFilter: 'all',
  pType: 'post',
  quiz: { q: [], i: 0, score: 0, corr: 0, timer: null, left: 30, start: 0, ans: [] }
};

let viewingUserId = null;
let questoesNormais = [];
let selectedInviteUsers = [];
let rankingModo = 'alunos';
let feedListener = null;

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function ago(t) {
  if (!t) return 'agora';
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'agora';
  if (d < 3600) return Math.floor(d / 60) + 'min';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  return Math.floor(d / 86400) + 'd';
}

function toast(msg, type = 'info') {
  const c = $('toast-container');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const d = document.createElement('div');
  d.style.cssText = 'background:var(--card);padding:12px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-weight:600;font-size:14px;pointer-events:auto;border-left:3px solid ' + (type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6C5CE7') + ';transition:opacity 0.3s;';
  d.innerHTML = (icons[type] || '') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(() => {
    d.style.opacity = '0';
    setTimeout(() => d.remove(), 300);
  }, 3000);
}

// ========== AUTH ==========
function switchAuthTab(t) {
  const tlEl = $('tab-login');
  const trEl = $('tab-register');
  if (tlEl) {
    tlEl.style.background = t === 'login' ? 'white' : 'transparent';
    tlEl.style.color = t === 'login' ? '#6C5CE7' : 'var(--text3)';
  }
  if (trEl) {
    trEl.style.background = t === 'register' ? 'white' : 'transparent';
    trEl.style.color = t === 'register' ? '#6C5CE7' : 'var(--text3)';
  }
  const lf = $('login-form');
  const rf = $('register-form');
  if (lf) lf.style.display = t === 'login' ? '' : 'none';
  if (rf) rf.style.display = t === 'register' ? '' : 'none';
  const le = $('login-error');
  const re = $('reg-error');
  if (le) le.style.display = 'none';
  if (re) re.style.display = 'none';
}

async function handleLogin() {
  const u = $('login-username').value.trim();
  const p = $('login-password').value;
  const errEl = $('login-error');
  if (!u || !p) {
    errEl.textContent = 'Preencha todos os campos';
    errEl.style.display = '';
    return;
  }
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
    const users = snap.val();
    if (!users) {
      errEl.textContent = 'Usuário não encontrado';
      errEl.style.display = '';
      return;
    }
    const uid = Object.keys(users)[0];
    const data = users[uid];
    if (data.password !== p) {
      errEl.textContent = 'Senha incorreta';
      errEl.style.display = '';
      return;
    }
    await auth.signInWithEmailAndPassword(data.email, p);
  } catch (e) {
    console.error('Login error:', e);
    errEl.textContent = 'Erro ao entrar: ' + e.message;
    errEl.style.display = '';
  }
}

async function handleRegister() {
  const u = $('reg-username').value.trim();
  const e = $('reg-email').value.trim();
  const p = $('reg-password').value;
  const c = $('reg-confirm').value;
  const err = $('reg-error');

  if (!u || !e || !p || !c) { err.textContent = 'Preencha todos os campos'; err.style.display = ''; return; }
  if (u.length < 3) { err.textContent = 'Nome muito curto (mín. 3 caracteres)'; err.style.display = ''; return; }
  if (p.length < 6) { err.textContent = 'Senha muito curta (mín. 6 caracteres)'; err.style.display = ''; return; }
  if (p !== c) { err.textContent = 'Senhas não coincidem'; err.style.display = ''; return; }

  try {
    const s1 = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
    if (s1.val()) { err.textContent = 'Nome de usuário já está em uso!'; err.style.display = ''; return; }
    const s2 = await db.ref('usuarios').orderByChild('email').equalTo(e).once('value');
    if (s2.val()) { err.textContent = 'E-mail já cadastrado!'; err.style.display = ''; return; }

    const cred = await auth.createUserWithEmailAndPassword(e, p);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid,
      username: u,
      email: e,
      password: p,
      avatar: '🎓',
      bio: '',
      points: 0,
      quizzesPlayed: 0,
      materiasCreated: 0,
      seguidores: 0,
      isAdmin: false,
      isProf: false,
      createdAt: Date.now()
    });
    await db.ref('notificacoes/' + cred.user.uid).push({
      mensagem: '🎉 Bem-vindo ao Sexta-Feira Studies!',
      tipo: 'system',
      lida: false,
      createdAt: Date.now()
    });
    toast('Conta criada! 🎉', 'success');
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = '';
  }
}

async function handleLogout() {
  if (!confirm('Deseja sair da conta?')) return;
  if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); S.roomListener = null; }
  if (S.pvListener) { S.pvListener(); S.pvListener = null; }
  await auth.signOut();
}

// ========== AUTH LISTENER ==========
auth.onAuthStateChanged(async (user) => {
  if (user) {
    S.user = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    S.ud = snap.val() || {};
    if (!S.ud.username) {
      S.ud = {
        uid: user.uid,
        username: user.email?.split('@')[0] || 'user',
        email: user.email,
        avatar: '🎓',
        bio: '',
        points: 0,
        quizzesPlayed: 0,
        materiasCreated: 0,
        seguidores: 0,
        isAdmin: false,
        isProf: false,
        createdAt: Date.now()
      };
      await db.ref('usuarios/' + user.uid).set(S.ud);
    }
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    updateUI();
    navigate('home');
    if (S.ud.isAdmin) {
      const navAdm = $('nav-adm');
      if (navAdm) navAdm.style.display = '';
    }
    listenNotifs();
  } else {
    S.user = null;
    S.ud = null;
    $('app').style.display = 'none';
    $('auth-screen').style.display = '';
    switchAuthTab('login');
  }
});

// ========== UI ==========
function updateUI() {
  const u = S.ud;
  if (!u) return;
  const av = u.avatar || '🎓';
  const name = u.username || '?';

  const els = {
    'sidebar-name': name,
    'sidebar-pts': fmt(u.points) + ' pts',
    'sidebar-avatar': av,
    'topbar-avatar': av,
    'pc-avatar': av,
    'perfil-avatar': av,
    'perfil-name': name,
    'perfil-email': u.email || '--',
    'home-greeting': 'Olá, ' + name.split(' ')[0] + '! 👋'
  };

  for (const [id, val] of Object.entries(els)) {
    const el = $(id);
    if (el) el.textContent = val;
  }
}

// ========== NAVEGAÇÃO ==========
function navigate(name) {
  // Esconder todas as telas
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Ativar tela alvo
  const target = $('screen-' + name);
  if (target) target.classList.add('active');

  // Fechar sidebar
  const sidebar = $('sidebar');
  const overlay = $('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');

  // Scroll para o topo — FIX #1
  const mc = $('main-content');
  if (mc) mc.scrollTop = 0;
  window.scrollTo(0, 0);

  // Carregar dados da tela
  if (name === 'home') loadHome();
  else if (name === 'materias') loadMaterias();
  else if (name === 'descobrir') loadFeed();
  else if (name === 'ranking') loadRanking();
  else if (name === 'chat') loadChat();
  else if (name === 'perfil') loadPerfil();
  else if (name === 'notificacoes') loadNotifs();
  else if (name === 'adm') loadAdm();
}

function toggleSidebar() {
  const s = $('sidebar');
  const o = $('sidebar-overlay');
  if (s) s.classList.toggle('open');
  if (o) o.classList.toggle('show');
}

function openModal(id) {
  const m = $('modal-' + id);
  if (!m) return;
  m.classList.add('show');
  if (id === 'quiz-normal') {
    questoesNormais = [];
    const container = $('qn-questoes-container');
    if (container) container.innerHTML = '';
    addQuestaoNormal();
  }
  if (id === 'invite') {
    selectedInviteUsers = [];
    const list = $('invite-users-list');
    if (list) list.innerHTML = '';
    const sel = $('invite-selected');
    if (sel) sel.textContent = '0 selecionados';
    searchUsersToInvite();
  }
}

function closeModal(id) {
  const m = $('modal-' + id);
  if (m) m.classList.remove('show');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
  }
});

// ========== HOME ==========
async function loadHome() {
  if (!S.ud || !S.user) return;

  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();

  const pts = S.ud.points || 0;
  const levels = [0, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000, 100000000000, 1000000000000, 10000000000000, 100000000000000, 1000000000000000, 10000000000000000, 100000000000000000, 1000000000000000000, 10000000000000000000, 100000000000000000000, 1000000000000000000000, 10000000000000000000000, 100000000000000000000000];
const names = [
  '🌱 Brotinho',
  '📖 Leitor',
  '✍️ Anotador',
  '🧠 Pensador',
  '🎯 Focado',
  '💡 Iluminado',
  '🔥 Motivado',
  '⚡ Rápido',
  '🦉 Sábio',
  '🏅 Dedicado',
  '⭐ Estrela',
  '🌟 Brilhante',
  '💎 Raro',
  '👑 Elite',
  '🐉 Lendário',
  '🌌 Cósmico',
  '🔮 Místico',
  '🎓 Mestre',
  '🧙 Sábio Supremo',
  '🚀 Transcendente',
  '👻 Fantasma',
  '🎪 Quântico',
  '🌀 Dimensional',
  '👁️ Onisciente',
  '🌠 Astral',
  '🎇 Universal',
  '💫 Galáctico',
  '🌟 Estelar',
  '✨ Celestial',
  '👼 Divino'
];
  let lvl = 0;
  for (let i = 0; i < levels.length; i++) { if (pts >= levels[i]) lvl = i; }
  const nxt = levels[Math.min(lvl + 1, levels.length - 1)];
  const cur = levels[lvl];
  const pct = nxt > cur ? Math.min(((pts - cur) / (nxt - cur)) * 100, 100) : 100;

  const badge = $('level-badge');
  if (badge) badge.textContent = '📈 Nível ' + (lvl + 1) + ' - ' + names[lvl];

  const sp = $('stat-pontos');
  const sq = $('stat-quizzes');
  const pt = $('progress-text');
  const pf = $('progress-fill');
  if (sp) sp.textContent = fmt(pts);
  if (sq) sq.textContent = S.ud.quizzesPlayed || 0;
  if (pt) pt.textContent = fmt(pts) + '/' + fmt(nxt) + ' pts';
  if (pf) pf.style.width = pct + '%';

  // Matérias criadas
  const ms = await db.ref('materias').orderByChild('autorId').equalTo(S.user.uid).once('value');
  const smEl = $('stat-materias');
  if (smEl) smEl.textContent = ms.val() ? Object.keys(ms.val()).length : 0;

  // Ranking
  const us = await db.ref('usuarios').once('value');
  if (us.val()) {
    const arr = Object.values(us.val()).filter(u => !u.isAdmin).sort((a, b) => (b.points || 0) - (a.points || 0));
    const pos = arr.findIndex(u => u.uid === S.user.uid);
    const srEl = $('stat-rank');
    if (srEl) srEl.textContent = pos >= 0 ? '#' + (pos + 1) : '#--';
  }

  // Feed recente
  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value', snap => {
    const posts = snap.val();
    const c = $('home-feed');
    if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center;">📭 Nenhum post ainda</div>'; return; }
    const arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    c.innerHTML = arr.map(p => feedCardHTML(p, true)).join('');
  });
}

// ========== FEED CARD HTML ==========
function feedCardHTML(p, compact = false) {
  const typeColors = { dica: '#10b981', duvida: '#f59e0b', post: '#6C5CE7' };
  const typeLabels = { dica: '💡 Dica', duvida: '❓ Dúvida', post: '💬 Post' };
  const color = typeColors[p.tipo] || '#6C5CE7';
  const label = typeLabels[p.tipo] || '💬 Post';
  const isOwner = p.autorId === S.user?.uid;
  const likeCount = p.likes ? Object.keys(p.likes).length : 0;

  return `<div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div onclick="verPerfil('${esc(p.autorId)}')" style="width:36px;height:36px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;cursor:pointer;flex-shrink:0">${esc(p.avatar || '?')}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px">${esc(p.autorNome || '?')}</div>
        <div style="color:var(--text3);font-size:11px">${ago(p.createdAt)} · <span style="color:${color};font-weight:600">${label}</span></div>
      </div>
      ${isOwner || S.ud?.isAdmin || S.ud?.isProf ? `<button onclick="deletePost('${p.id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:16px;padding:4px">🗑</button>` : ''}
    </div>
    <div style="font-size:14px;line-height:1.6;margin-bottom:${compact ? '0' : '10px'}">${esc(p.texto)}</div>
    ${!compact ? `<div style="display:flex;align-items:center;gap:10px;padding-top:8px;border-top:1px solid var(--border)">
      <button onclick="likePost('${p.id}')" style="border:none;background:none;cursor:pointer;font-weight:600;color:var(--text3);font-size:13px;display:flex;align-items:center;gap:4px">❤️ ${likeCount}</button>
    </div>` : ''}
  </div>`;
}

// ========== MATÉRIAS ==========
let materiasListener = null;

function loadMaterias() {
  if (materiasListener) { db.ref('materias').off('value', materiasListener); }
  materiasListener = db.ref('materias').on('value', snap => {
    const mat = snap.val();
    const c = $('materias-grid');
    if (!c) return;
    if (!mat) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center;">📚 Nenhuma matéria ainda</div>'; return; }
    let arr = Object.entries(mat).map(([id, m]) => ({ id, ...m }));
    if (S.mFilter === 'mine') arr = arr.filter(m => m.autorId === S.user?.uid);
    const searchEl = $('search-materias');
    const s = (searchEl?.value || '').toLowerCase();
    if (s) arr = arr.filter(m => (m.nome || '').toLowerCase().includes(s));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!arr.length) {
      c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center;">🔍 Nenhuma matéria encontrada</div>';
      return;
    }
    c.innerHTML = arr.map(m => `
      <div class="card card-3d" onclick="openMateria('${m.id}')" style="display:flex;gap:12px;align-items:center;">
        <span style="font-size:35px;flex-shrink:0">${m.icone || '📚'}</span>
        <div style="min-width:0">
          <div style="font-weight:700;font-size:15px">${esc(m.nome)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">${esc(m.descricao || 'Sem descrição')}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">Por: ${esc(m.autorNome || '?')}</div>
        </div>
      </div>
    `).join('');
  });
}

function setMateriaFilter(f, btn) {
  S.mFilter = f;
  // Atualizar estilo dos botões
  const btnAll = $('filter-all');
  const btnMine = $('filter-mine');
  if (btnAll) btnAll.style.cssText = f === 'all' ? '' : 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
  if (btnAll) btnAll.className = f === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-sm';
  if (btnMine) btnMine.className = f === 'mine' ? 'btn btn-primary btn-sm' : 'btn btn-sm';
  if (btnMine) btnMine.style.cssText = f === 'mine' ? '' : 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
  loadMaterias();
}

function filterMaterias() { loadMaterias(); }

async function criarMateria() {
  const n = $('nm-nome').value.trim();
  const d = $('nm-desc').value.trim();
  if (!n) { toast('Nome obrigatório', 'error'); return; }
  await db.ref('materias').push({
    nome: n,
    descricao: d,
    icone: '📚',
    autorId: S.user.uid,
    autorNome: S.ud.username,
    topicosCount: 0,
    createdAt: Date.now()
  });
  closeModal('materia');
  $('nm-nome').value = '';
  $('nm-desc').value = '';
  await addPts(20);
  toast('Matéria criada! 📚', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val();
  if (!m) { toast('Matéria não encontrada', 'error'); return; }

  const icon = $('materia-hero-icon');
  const nome = $('materia-hero-nome');
  const desc = $('materia-hero-desc');
  const autor = $('materia-hero-autor');
  if (icon) icon.textContent = m.icone || '📚';
  if (nome) nome.textContent = m.nome;
  if (desc) desc.textContent = m.descricao || 'Sem descrição';
  if (autor) autor.textContent = 'Por: ' + (m.autorNome || '?');

  navigate('materia-detalhe');

  // Tópicos
  db.ref('topicos/' + id).on('value', snap => {
    const t = snap.val();
    const c = $('topicos-list');
    if (!c) return;
    if (!t) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center;">📝 Nenhum tópico ainda</div>'; return; }
    c.innerHTML = Object.entries(t).map(([tid, top]) => `
      <div class="card" onclick="openTopico('${tid}')" style="cursor:pointer;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px">${top.verificado ? '✅' : '📄'}</span>
        <div>
          <div style="font-weight:600">${esc(top.titulo)}</div>
          <div style="font-size:11px;color:var(--text3)">Por ${esc(top.autorNome || '?')} · ${ago(top.createdAt)}</div>
        </div>
      </div>
    `).join('');
  });

  // Quizzes
  db.ref('quizzes/' + id).on('value', snap => {
    const q = snap.val();
    const c = $('quizzes-materia');
    if (!c) return;
    if (!q) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center;">🎮 Nenhum quiz ainda</div>'; return; }
    c.innerHTML = Object.entries(q).map(([qid, quiz]) => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>🎮 ${esc(quiz.nome)}</strong>
          <br><span style="font-size:12px;color:var(--text3)">${quiz.questoes?.length || 0} questões · ${quiz.tempo || 30}s/questão</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="startQuiz('${id}','${qid}')">▶ Jogar</button>
      </div>
    `).join('');
  });
}

// ========== TÓPICOS ==========
async function criarTopico() {
  const t = $('nt-titulo').value.trim();
  const c = $('nt-conteudo').value.trim();
  if (!t || !c) { toast('Preencha título e conteúdo', 'error'); return; }
  await db.ref('topicos/' + S.mid).push({
    titulo: t,
    conteudo: c,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    verificado: false,
    createdAt: Date.now()
  });
  closeModal('topico');
  $('nt-titulo').value = '';
  $('nt-conteudo').value = '';
  await addPts(15);
  toast('Tópico criado! 📝', 'success');
}

async function openTopico(id) {
  S.tid = id;
  const snap = await db.ref('topicos/' + S.mid + '/' + id).once('value');
  const t = snap.val();
  if (!t) { toast('Tópico não encontrado', 'error'); return; }

  const titleEl = $('topico-title');
  const metaEl = $('topico-meta');
  const bodyEl = $('topico-body');

  if (titleEl) {
    titleEl.innerHTML = esc(t.titulo) + (t.verificado ? ' <span style="color:#10b981;font-size:14px" title="Verificado por professor">✅ Verificado</span>' : '');
  }
  if (metaEl) {
    metaEl.innerHTML = 'Por <strong>' + esc(t.autorNome || '?') + '</strong> · ' + ago(t.createdAt);
    // Botão verificar para professores
    if (S.ud?.isProf && !t.verificado) {
      metaEl.innerHTML += ` <button class="btn btn-sm" onclick="verificarTopico('${id}')" style="background:#6C5CE7;color:white;box-shadow:none;font-size:11px;margin-left:10px;padding:4px 10px;">✅ Verificar</button>`;
    }
  }
  if (bodyEl) bodyEl.textContent = t.conteudo;

  navigate('topico-detalhe');

  // Carregar comentários — FIX #8
  db.ref('comentarios/' + S.mid + '/' + id).on('value', snap => {
    const coms = snap.val();
    const c = $('topico-comentarios');
    if (!c) return;
    if (!coms) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center;">💬 Seja o primeiro a comentar!</div>'; return; }
    const arr = Object.entries(coms).map(([cid, com]) => ({ cid, ...com })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    c.innerHTML = arr.map(com => `
      <div class="card" style="margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div onclick="verPerfil('${esc(com.autorId)}')" style="width:28px;height:28px;border-radius:50%;background:${com.isProf ? 'linear-gradient(135deg,#6C5CE7,#10b981)' : '#6C5CE7'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;cursor:pointer">
            ${esc(com.avatar || com.autorNome?.charAt(0) || '?')}
          </div>
          <div>
            <span style="font-weight:700;font-size:13px">${esc(com.autorNome || '?')}</span>
            ${com.isProf ? '<span style="color:#10b981;font-size:11px;margin-left:4px">✅ Prof</span>' : ''}
            <span style="color:var(--text3);font-size:11px;margin-left:6px">${ago(com.createdAt)}</span>
          </div>
        </div>
        <div style="font-size:14px;line-height:1.5;padding-left:36px">${esc(com.texto)}</div>
      </div>
    `).join('');
  });
}

async function verificarTopico(tid) {
  if (!S.ud?.isProf) return toast('Só professores podem verificar', 'error');
  await db.ref('topicos/' + S.mid + '/' + tid).update({
    verificado: true,
    verificadoPor: S.ud.username,
    verificadoEm: Date.now()
  });
  toast('✅ Tópico verificado!', 'success');
  openTopico(tid);
}

async function addComment() {
  const input = $('new-comment');
  const t = input ? input.value.trim() : '';
  if (!t) return;
  if (!S.mid || !S.tid) return toast('Erro: tópico não definido', 'error');
  await db.ref('comentarios/' + S.mid + '/' + S.tid).push({
    texto: t,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    avatar: S.ud.avatar || '🎓',
    isProf: S.ud?.isProf || false,
    createdAt: Date.now()
  });
  if (input) input.value = '';
  await addPts(S.ud?.isProf ? 6 : 3);
}

// ========== QUIZ ==========
function addQuestaoNormal() {
  const idx = questoesNormais.length;
  questoesNormais.push({ pergunta: '', alternativas: ['', '', '', ''], correta: 0 });
  const div = document.createElement('div');
  div.style.cssText = 'background:var(--input-bg);border-radius:12px;padding:12px;margin-bottom:10px;border:2px solid var(--border);';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong style="font-size:14px">Questão ${idx + 1}</strong>
      ${idx > 0 ? `<button onclick="removerQuestao(${idx})" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:16px">🗑</button>` : ''}
    </div>
    <input class="input-field" placeholder="Pergunta..." oninput="questoesNormais[${idx}].pergunta=this.value" style="margin-bottom:8px" />
    ${['A', 'B', 'C', 'D'].map((l, i) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <input type="radio" name="qc${idx}" value="${i}" ${i === 0 ? 'checked' : ''} onchange="questoesNormais[${idx}].correta=${i}" />
        <span style="font-weight:700;width:20px">${l}</span>
        <input class="input-field" placeholder="Alternativa ${l}..." style="margin:0;flex:1" oninput="questoesNormais[${idx}].alternativas[${i}]=this.value" />
      </div>
    `).join('')}
  `;
  const container = $('qn-questoes-container');
  if (container) container.appendChild(div);
}

function removerQuestao(idx) {
  questoesNormais.splice(idx, 1);
  const container = $('qn-questoes-container');
  if (container) container.innerHTML = '';
  const backup = [...questoesNormais];
  questoesNormais = [];
  backup.forEach(() => addQuestaoNormal());
}

async function salvarQuizNormal() {
  const nomeEl = $('qn-nome');
  const tempoEl = $('qn-tempo');
  const nome = nomeEl ? nomeEl.value.trim() : '';
  const tempo = parseInt(tempoEl ? tempoEl.value : '30') || 30;
  if (!nome) { toast('Nome do quiz obrigatório', 'error'); return; }
  const validas = questoesNormais.filter(q => q.pergunta.trim() && q.alternativas.filter(a => a.trim()).length >= 2);
  if (!validas.length) { toast('Adicione pelo menos uma questão', 'error'); return; }
  await db.ref('quizzes/' + S.mid).push({
    nome, tempo,
    questoes: validas,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    totalPlays: 0,
    createdAt: Date.now()
  });
  closeModal('quiz-normal');
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function processarCmd() {
  const inputEl = $('cmd-input');
  const input = inputEl ? inputEl.value : '';
  if (!input.trim()) return toast('Digite os comandos', 'error');
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  let nome = '', questoes = [], curQ = null, alts = [], corr = -1, tempo = 30;

  for (const l of lines) {
    if (l.startsWith('/n ')) nome = l.substring(3).trim();
    else if (l.startsWith('/t ')) tempo = parseInt(l.substring(3)) || 30;
    else if (l.startsWith('/q ')) {
      if (curQ && alts.length >= 2 && corr >= 0) {
        curQ.alternativas = [...alts]; curQ.correta = corr; questoes.push(curQ);
      }
      curQ = { pergunta: l.substring(3).trim() }; alts = []; corr = -1;
    }
    else if (l.startsWith('/a ')) alts.push(l.substring(3).trim());
    else if (l.startsWith('/c ')) {
      const map = { A: 0, B: 1, C: 2, D: 3 };
      corr = map[l.substring(3).trim().toUpperCase()] ?? -1;
    }
    else if (l === '/f') {
      if (curQ && alts.length >= 2 && corr >= 0) {
        curQ.alternativas = [...alts]; curQ.correta = corr; questoes.push(curQ);
        curQ = null; alts = []; corr = -1;
      }
    }
  }
  // Finalizar questão aberta
  if (curQ && alts.length >= 2 && corr >= 0) {
    curQ.alternativas = [...alts]; curQ.correta = corr; questoes.push(curQ);
  }

  if (!nome) return toast('Use /n para definir o nome', 'error');
  if (!questoes.length) return toast('Adicione questões com /q, /a, /c, /f', 'error');

  await db.ref('quizzes/' + S.mid).push({
    nome, tempo, questoes,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    totalPlays: 0,
    createdAt: Date.now()
  });
  closeModal('quiz-cmd');
  if (inputEl) inputEl.value = '';
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val();
  if (!q || !q.questoes || !q.questoes.length) { toast('Quiz sem questões', 'error'); return; }
  S.quiz = {
    q: shuffle([...q.questoes]),
    i: 0, score: 0, corr: 0,
    timer: null,
    left: q.tempo || 30,
    tempoTotal: q.tempo || 30,
    start: Date.now(),
    ans: [],
    nome: q.nome,
    mId, qId
  };
  navigate('quiz-game');
  renderQ();
}

function renderQ() {
  const g = S.quiz;
  if (g.i >= g.q.length) { finishQ(); return; }
  const q = g.q[g.i];

  const counter = $('quiz-q-counter');
  const qnum = $('quiz-q-num');
  const question = $('quiz-question');
  const pf = $('quiz-progress-fill');
  const scoreEl = $('quiz-score-live');
  const timerEl = $('quiz-timer');

  if (counter) counter.textContent = (g.i + 1) + '/' + g.q.length;
  if (qnum) qnum.textContent = 'Questão ' + (g.i + 1);
  if (question) question.textContent = q.pergunta;
  if (pf) pf.style.width = (g.i / g.q.length * 100) + '%';
  if (scoreEl) scoreEl.textContent = g.score;

  const opts = $('quiz-options');
  if (opts) {
    opts.innerHTML = q.alternativas.map((a, i) => `
      <button onclick="selectA(${i})" id="opt-${i}" style="display:flex;align-items:center;width:100%;padding:14px;margin-bottom:8px;border:2px solid var(--border);border-radius:12px;background:var(--card);text-align:left;font-size:15px;cursor:pointer;transition:all 0.15s;font-family:'Sora',sans-serif;">
        <span class="opt-letter" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#6C5CE7;color:white;font-weight:700;font-size:13px;margin-right:12px;flex-shrink:0">${['A','B','C','D'][i]}</span>
        <span>${esc(a)}</span>
      </button>
    `).join('');
  }

  // Timer
  clearInterval(g.timer);
  g.left = g.tempoTotal || 30;
  if (timerEl) timerEl.textContent = '⏱ ' + g.left + 's';

  g.timer = setInterval(() => {
    g.left--;
    if (timerEl) {
      timerEl.textContent = '⏱ ' + g.left + 's';
      timerEl.style.background = g.left <= 5 ? '#fee2e2' : '#fff3cd';
    }
    if (g.left <= 0) { clearInterval(g.timer); selectA(-1); }
  }, 1000);
}

function selectA(chosen) {
  clearInterval(S.quiz.timer);
  const g = S.quiz;
  const q = g.q[g.i];
  const corr = q.correta;
  const ok = chosen === corr;

  document.querySelectorAll('#quiz-options button').forEach((b, i) => {
    b.disabled = true;
    b.style.cursor = 'default';
    if (i === corr) {
      b.style.background = '#d1fae5';
      b.style.borderColor = '#10b981';
      const letter = b.querySelector('.opt-letter');
      if (letter) letter.style.background = '#10b981';
    }
    if (i === chosen && !ok) {
      b.style.background = '#fee2e2';
      b.style.borderColor = '#ef4444';
      const letter = b.querySelector('.opt-letter');
      if (letter) letter.style.background = '#ef4444';
    }
  });

  if (ok) {
    const bonus = Math.max(10, Math.round(10 + (g.left / (g.tempoTotal || 30)) * 10));
    g.score += bonus;
    g.corr++;
    g.ans.push({ isCorrect: true, pts: bonus, pergunta: q.pergunta, correta: q.alternativas[corr] });
  } else {
    g.ans.push({ isCorrect: false, pts: 0, pergunta: q.pergunta, correta: q.alternativas[corr] });
  }

  const scoreEl = $('quiz-score-live');
  if (scoreEl) scoreEl.textContent = g.score;

  setTimeout(() => { g.i++; renderQ(); }, 1500);
}

async function finishQ() {
  clearInterval(S.quiz.timer);
  const g = S.quiz;
  const total = g.q.length;
  const elapsed = Math.round((Date.now() - g.start) / 1000);
  const pct = Math.round((g.corr / total) * 100);
  const bonus = pct >= 90 ? 50 : pct >= 70 ? 30 : pct >= 50 ? 15 : 0;
  const totalPts = g.score + bonus;

  await db.ref('historico/' + S.user.uid).push({
    quizNome: g.nome,
    score: totalPts,
    acertos: g.corr,
    total, pct,
    tempo: elapsed,
    createdAt: Date.now()
  });
  await addPts(totalPts);
  await db.ref('usuarios/' + S.user.uid).update({
    quizzesPlayed: (S.ud.quizzesPlayed || 0) + 1
  });
  S.ud.quizzesPlayed = (S.ud.quizzesPlayed || 0) + 1;

  navigate('resultado');

  const acEl = $('res-acertos');
  const totEl = $('res-total');
  const ptsEl = $('res-pontos');
  const tpEl = $('res-tempo');
  const pctEl = $('resultado-pct');
  const barEl = $('resultado-barra-fill');
  const revEl = $('resultado-review');

  if (acEl) acEl.textContent = g.corr;
  if (totEl) totEl.textContent = total;
  if (ptsEl) ptsEl.textContent = '+' + totalPts;
  if (tpEl) tpEl.textContent = elapsed + 's';
  if (pctEl) pctEl.textContent = pct + '%';
  if (barEl) setTimeout(() => { barEl.style.width = pct + '%'; }, 100);
  if (revEl) {
    revEl.innerHTML = g.ans.map((a, i) => `
      <div style="padding:10px;border-radius:10px;margin-bottom:6px;background:${a.isCorrect ? '#d1fae5' : '#fee2e2'};border-left:3px solid ${a.isCorrect ? '#10b981' : '#ef4444'};">
        <div style="font-weight:600;font-size:13px">${i + 1}. ${esc(a.pergunta)}</div>
        <div style="font-size:12px;color:${a.isCorrect ? '#059669' : '#dc2626'};margin-top:4px">
          ${a.isCorrect ? '✅ Correto! +' + a.pts + 'pts' : '❌ Errado · Certa: ' + esc(a.correta)}
        </div>
      </div>
    `).join('');
  }
}

function exitQuiz() {
  if (!confirm('Sair do quiz? O progresso será perdido.')) return;
  clearInterval(S.quiz.timer);
  navigate('materia-detalhe');
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ========== FEED ==========
function loadFeed() {
  if (S.fFilter === 'usuarios') {
    loadAllUsers();
    return;
  }
  if (feedListener) { db.ref('posts').off('value', feedListener); feedListener = null; }
  feedListener = db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value', snap => {
    const posts = snap.val();
    const c = $('descobrir-feed');
    if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center;">📭 Nenhum post ainda</div>'; return; }
    let arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    if (S.fFilter !== 'all') arr = arr.filter(p => p.tipo === S.fFilter);
    c.innerHTML = arr.length ? arr.map(p => feedCardHTML(p)).join('') : '<div style="color:var(--text3);padding:15px;text-align:center;">📭 Nenhum post nesta categoria</div>';
  });
}

function setPostType(t, btn) {
  S.pType = t;
  ['post','dica','duvida'].forEach(type => {
    const b = $('ptype-' + type);
    if (!b) return;
    if (type === t) {
      b.className = 'btn btn-primary btn-sm';
      b.style.cssText = '';
    } else {
      b.className = 'btn btn-sm';
      b.style.cssText = 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
    }
  });
}

function setFeedFilter(f, btn) {
  S.fFilter = f;
  // Atualizar botões de filtro
  ['all','post','dica','duvida','usuarios'].forEach(type => {
    const b = $('ffilter-' + type);
    if (!b) return;
    if (type === f) {
      b.className = 'btn btn-primary btn-sm';
      b.style.cssText = '';
    } else {
      b.className = 'btn btn-sm';
      b.style.cssText = 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
    }
  });

  const si = $('search-users-input');
  if (f === 'usuarios') {
    if (si) si.style.display = '';
    loadAllUsers();
  } else {
    if (si) si.style.display = 'none';
    loadFeed();
  }
}

async function createPost() {
  const t = $('new-post-text').value.trim();
  if (!t) return toast('Escreva algo para publicar', 'error');
  await db.ref('posts').push({
    texto: t,
    tipo: S.pType,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    avatar: S.ud.avatar || '🎓',
    likes: {},
    createdAt: Date.now()
  });
  $('new-post-text').value = '';
  await addPts(5);
  toast('Publicado! 📢', 'success');
}

async function criarPostModal() {
  const t = $('post-texto-modal').value.trim();
  const tp = $('post-tipo-modal').value;
  if (!t) return toast('Escreva algo para publicar', 'error');
  await db.ref('posts').push({
    texto: t,
    tipo: tp,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    avatar: S.ud.avatar || '🎓',
    likes: {},
    createdAt: Date.now()
  });
  closeModal('post');
  $('post-texto-modal').value = '';
  await addPts(5);
  toast('Publicado! 📢', 'success');
}

async function likePost(id) {
  if (!S.user) return;
  const ref = db.ref('posts/' + id + '/likes/' + S.user.uid);
  const snap = await ref.once('value');
  if (snap.val()) await ref.remove();
  else await ref.set(true);
}

async function deletePost(id) {
  if (!confirm('Excluir este post?')) return;
  await db.ref('posts/' + id).remove();
  toast('Post excluído', 'info');
}

// FIX #4: Usuários aparecendo corretamente na aba "Usuários"
async function loadAllUsers() {
  const c = $('descobrir-feed');
  if (!c) return;
  c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">⏳ Carregando...</div>';
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!users) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">Nenhum usuário</div>'; return; }
  await renderUserList(users);
}

async function searchUsers() {
  const searchEl = $('search-users-input');
  const term = (searchEl ? searchEl.value : '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!users) return;
  if (!term) { await renderUserList(users); return; }
  const filt = {};
  Object.entries(users).forEach(([id, u]) => {
    if ((u.username || '').toLowerCase().includes(term)) filt[id] = u;
  });
  await renderUserList(filt);
}

async function renderUserList(users) {
  const c = $('descobrir-feed');
  if (!c) return;

  const arr = Object.entries(users)
    .map(([id, u]) => ({ ...u, id }))
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  if (!arr.length) {
    c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">Nenhum usuário encontrado</div>';
    return;
  }

  // Verificar quem eu sigo
  const myFollowing = {};
  if (S.user) {
    const fSnap = await db.ref('seguidores/' + S.user.uid).once('value');
    const fData = fSnap.val();
    if (fData) Object.keys(fData).forEach(uid => { myFollowing[uid] = true; });
  }

  c.innerHTML = arr.map(u => {
    const isMe = u.id === S.user?.uid;
    const isFollowing = myFollowing[u.id];
    const badges = [];
    if (u.isProf) badges.push('<span style="color:#6C5CE7;font-size:12px">✅</span>');
    if (u.isAdmin) badges.push('<span style="color:#f59e0b;font-size:12px">⚙️</span>');

    return `<div class="card" onclick="${isMe ? "navigate('perfil')" : "verPerfil('" + u.id + "')"}" style="cursor:pointer;display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;border-radius:50%;background:${u.isProf ? 'linear-gradient(135deg,#6C5CE7,#10b981)' : '#6C5CE7'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0">${esc(u.avatar || '🎓')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">${esc(u.username || '?')} ${badges.join(' ')}</div>
        ${isMe ? '<span style="background:#6C5CE7;color:white;padding:2px 8px;border-radius:10px;font-size:10px">Você</span>' : ''}
        <div style="font-size:12px;color:var(--text3);margin-top:2px">⭐ ${fmt(u.points)} pts · 👥 ${u.seguidores || 0} seguidores</div>
      </div>
      ${!isMe ? `<button class="btn btn-sm ${isFollowing ? 'btn-green' : 'btn-primary'}" onclick="event.stopPropagation();toggleFollowUser('${u.id}',this)" style="flex-shrink:0;${isFollowing ? 'background:#10b981;box-shadow:0 4px 0 #059669;' : ''}">${isFollowing ? '✅ Seguindo' : '👥 Seguir'}</button>` : ''}
    </div>`;
  }).join('');
}

async function toggleFollowUser(uid, btn) {
  if (!S.user) return;
  const ref = db.ref('seguidores/' + S.user.uid + '/' + uid);
  const snap = await ref.once('value');
  if (snap.val()) {
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + S.user.uid).remove();
    // Decrementar seguidores
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    const cur = cSnap.val() || 0;
    if (cur > 0) await db.ref('usuarios/' + uid + '/seguidores').set(cur - 1);
    if (btn) {
      btn.textContent = '👥 Seguir';
      btn.className = 'btn btn-sm btn-primary';
      btn.style.cssText = 'flex-shrink:0';
    }
    toast('Deixou de seguir', 'info');
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    await db.ref('usuarios/' + uid + '/seguidores').set((cSnap.val() || 0) + 1);
    await db.ref('notificacoes/' + uid).push({
      mensagem: '👥 ' + S.ud.username + ' começou a te seguir!',
      tipo: 'follow',
      lida: false,
      fromUid: S.user.uid,
      createdAt: Date.now()
    });
    if (btn) {
      btn.textContent = '✅ Seguindo';
      btn.className = 'btn btn-sm btn-green';
      btn.style.cssText = 'flex-shrink:0;background:#10b981;box-shadow:0 4px 0 #059669;';
    }
    toast('Seguindo! 👥', 'success');
  }
}

// ========== CHAT ==========
function loadChat() {
  db.ref('chat_rooms').on('value', snap => {
    const rooms = snap.val();
    const c = $('rooms-list');
    if (!c) return;
    if (!rooms) { c.innerHTML = '<div style="padding:10px;color:var(--text3);font-size:12px">Nenhuma sala</div>'; return; }
    c.innerHTML = Object.entries(rooms).map(([id, r]) => `
      <div onclick="joinRoom('${id}')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;${S.room === id ? 'background:var(--hover);color:#6C5CE7;' : ''}transition:background 0.15s"># ${esc(r.nome)}</div>
    `).join('');
  });
  loadPVList();
}

async function loadPVList() {
  const c = $('pv-list');
  if (!c || !S.user) return;
  const snap = await db.ref('private_chats').once('value');
  const chats = snap.val();
  if (!chats) { c.innerHTML = '<div style="padding:10px;color:var(--text3);font-size:11px">Sem conversas</div>'; return; }

  const userChats = Object.entries(chats).filter(([chatId]) =>
    chatId.split('_').includes(S.user.uid)
  );
  if (!userChats.length) { c.innerHTML = '<div style="padding:10px;color:var(--text3);font-size:11px">Sem conversas</div>'; return; }

  let html = '';
  for (const [chatId, msgs] of userChats) {
    const otherUid = chatId.split('_').find(p => p !== S.user.uid);
    if (!otherUid) continue;
    const uSnap = await db.ref('usuarios/' + otherUid).once('value');
    const u = uSnap.val();
    if (!u) continue;
    const arr = Object.values(msgs || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    html += `<div onclick="openPV('${otherUid}')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;transition:background 0.15s" onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background=''">
      <div style="width:28px;height:28px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${esc(u.avatar || '?')}</div>
      <div style="min-width:0">
        <div style="font-weight:600;font-size:12px">${esc(u.username)}</div>
        <div style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((arr[0]?.texto || 'Nova conversa').substring(0, 20))}</div>
      </div>
    </div>`;
  }
  c.innerHTML = html || '<div style="padding:10px;color:var(--text3);font-size:11px">Sem conversas</div>';
}

function joinRoom(id) {
  S.room = id;
  if (S.roomListener) { db.ref('chat_messages/' + (S.previousRoom || id)).off(); }

  db.ref('chat_rooms/' + id).once('value').then(s => {
    const rName = $('chat-room-name');
    if (rName) rName.textContent = '# ' + (s.val()?.nome || 'Sala');
  });

  const noRoom = $('chat-no-room');
  const roomView = $('chat-room-view');
  const pvView = $('pv-chat-view');
  if (noRoom) noRoom.style.display = 'none';
  if (roomView) roomView.style.display = 'flex';
  if (pvView) pvView.style.display = 'none';

  S.previousRoom = id;
  S.roomListener = db.ref('chat_messages/' + id).on('value', snap => {
    const msgs = snap.val();
    const c = $('chat-messages');
    if (!c) return;
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px">💬 Seja o primeiro a mandar mensagem!</div>'; return; }
    c.innerHTML = Object.entries(msgs)
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0))
      .map(([mid, m]) => {
        const isMe = m.autorId === S.user?.uid;
        return `<div style="display:flex;flex-direction:${isMe ? 'row-reverse' : 'row'};gap:8px;margin-bottom:10px;align-items:flex-end">
          ${!isMe ? `<div onclick="openPV('${m.autorId}')" style="width:26px;height:26px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">${esc(m.avatar || '?')}</div>` : ''}
          <div style="max-width:70%">
            ${!isMe ? `<div style="font-size:10px;color:var(--text3);margin-bottom:2px;margin-left:4px">${esc(m.autorNome || '?')}</div>` : ''}
            <div style="padding:10px 14px;border-radius:${isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${isMe ? '#6C5CE7' : 'var(--input-bg)'};color:${isMe ? 'white' : 'var(--text)'};font-size:14px;word-break:break-word">${esc(m.texto)}<div style="font-size:9px;opacity:0.6;margin-top:4px;text-align:right">${ago(m.createdAt)}</div></div>
          </div>
        </div>`;
      }).join('');
    c.scrollTop = c.scrollHeight;
  });
}

function leaveRoom() {
  if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); S.roomListener = null; }
  S.room = null;
  const noRoom = $('chat-no-room');
  const roomView = $('chat-room-view');
  if (noRoom) noRoom.style.display = 'flex';
  if (roomView) roomView.style.display = 'none';
}

function openPV(uid) {
  if (!uid || uid === S.user?.uid) return;
  S.pvUser = uid;

  db.ref('usuarios/' + uid).once('value').then(s => {
    const u = s.val();
    const avEl = $('pv-chat-avatar');
    const nameEl = $('pv-chat-name');
    if (avEl && u) avEl.textContent = u.avatar || '?';
    if (nameEl && u) nameEl.textContent = u.username || '?';
  });

  const roomView = $('chat-room-view');
  const noRoom = $('chat-no-room');
  const pvView = $('pv-chat-view');
  if (roomView) roomView.style.display = 'none';
  if (noRoom) noRoom.style.display = 'none';
  if (pvView) pvView.style.display = 'flex';

  const chatId = [S.user.uid, uid].sort().join('_');
  if (S.pvListener) { S.pvListener(); S.pvListener = null; }

  S.pvListener = db.ref('private_chats/' + chatId).on('value', snap => {
    const msgs = snap.val();
    const c = $('pv-chat-messages');
    if (!c) return;
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px">👋 Diga olá!</div>'; return; }
    c.innerHTML = Object.entries(msgs)
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0))
      .map(([mid, m]) => {
        const isMe = m.autorId === S.user?.uid;
        return `<div style="display:flex;flex-direction:${isMe ? 'row-reverse' : 'row'};gap:8px;margin-bottom:8px">
          <div style="max-width:75%;padding:10px 14px;border-radius:${isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${isMe ? '#6C5CE7' : 'var(--input-bg)'};color:${isMe ? 'white' : 'var(--text)'};font-size:14px;word-break:break-word">${esc(m.texto)}</div>
        </div>`;
      }).join('');
    c.scrollTop = c.scrollHeight;
  });

  // Se veio de outra tela, navega para o chat
  const chatScreen = $('screen-chat');
  if (!chatScreen?.classList.contains('active')) navigate('chat');
}

function closePV() {
  if (S.pvListener) { S.pvListener(); S.pvListener = null; }
  S.pvUser = null;
  const pvView = $('pv-chat-view');
  const roomView = $('chat-room-view');
  const noRoom = $('chat-no-room');
  if (pvView) pvView.style.display = 'none';
  if (S.room && roomView) roomView.style.display = 'flex';
  else if (noRoom) noRoom.style.display = 'flex';
}

async function sendChatMsg() {
  const inputEl = $('chat-msg-input');
  const t = inputEl ? inputEl.value.trim() : '';
  if (!t || !S.room) return;
  await db.ref('chat_messages/' + S.room).push({
    texto: t,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    avatar: S.ud.avatar || '🎓',
    createdAt: Date.now()
  });
  if (inputEl) inputEl.value = '';
}

async function sendPvChatMsg() {
  const inputEl = $('pv-chat-input');
  const t = inputEl ? inputEl.value.trim() : '';
  if (!t || !S.pvUser) return;
  const chatId = [S.user.uid, S.pvUser].sort().join('_');
  await db.ref('private_chats/' + chatId).push({
    texto: t,
    autorId: S.user.uid,
    autorNome: S.ud.username,
    avatar: S.ud.avatar || '🎓',
    createdAt: Date.now()
  });
  await db.ref('notificacoes/' + S.pvUser).push({
    mensagem: '💬 ' + S.ud.username + ' te enviou uma mensagem!',
    tipo: 'message',
    lida: false,
    fromUid: S.user.uid,
    createdAt: Date.now()
  });
  if (inputEl) inputEl.value = '';
}

async function criarSala() {
  const nEl = $('ns-nome');
  const dEl = $('ns-desc');
  const n = nEl ? nEl.value.trim() : '';
  if (!n) return toast('Nome da sala obrigatório', 'error');
  const ref = await db.ref('chat_rooms').push({
    nome: n,
    descricao: dEl ? dEl.value.trim() : '',
    criadorId: S.user.uid,
    criadorNome: S.ud.username,
    createdAt: Date.now()
  });
  closeModal('sala');
  if (nEl) nEl.value = '';
  if (dEl) dEl.value = '';
  joinRoom(ref.key);
  toast('Sala criada! 💬', 'success');
}

async function searchUsersToInvite() {
  const searchEl = $('invite-search');
  const term = (searchEl ? searchEl.value : '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!users) return;
  let arr = Object.entries(users).map(([id, u]) => ({ id, ...u })).filter(u => u.id !== S.user?.uid);
  if (term) arr = arr.filter(u => (u.username || '').toLowerCase().includes(term));

  const listEl = $('invite-users-list');
  if (!listEl) return;
  listEl.innerHTML = arr.map(u => `
    <div onclick="toggleInviteUser('${u.id}',this)" style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;border-radius:8px;background:${selectedInviteUsers.includes(u.id) ? 'var(--hover)' : 'transparent'};transition:background 0.15s">
      <div style="width:32px;height:32px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${esc(u.avatar || '?')}</div>
      <span style="flex:1;font-weight:600;font-size:13px">${esc(u.username)}</span>
      <span style="font-size:16px">${selectedInviteUsers.includes(u.id) ? '✅' : '○'}</span>
    </div>
  `).join('');
}

function toggleInviteUser(uid, el) {
  const i = selectedInviteUsers.indexOf(uid);
  if (i > -1) {
    selectedInviteUsers.splice(i, 1);
    el.style.background = 'transparent';
  } else {
    selectedInviteUsers.push(uid);
    el.style.background = 'var(--hover)';
  }
  const selEl = $('invite-selected');
  if (selEl) selEl.textContent = selectedInviteUsers.length + ' selecionado(s)';
}

async function sendInvites() {
  if (!selectedInviteUsers.length) return toast('Selecione pelo menos uma pessoa', 'info');
  if (!S.room) return toast('Entre em uma sala primeiro', 'error');
  const roomSnap = await db.ref('chat_rooms/' + S.room).once('value');
  const roomName = roomSnap.val()?.nome || 'Sala';
  for (const uid of selectedInviteUsers) {
    await db.ref('notificacoes/' + uid).push({
      mensagem: '👥 ' + S.ud.username + ' te convidou para a sala: ' + roomName,
      tipo: 'invite',
      lida: false,
      roomId: S.room,
      createdAt: Date.now()
    });
  }
  toast('Convites enviados! 📨', 'success');
  closeModal('invite');
  selectedInviteUsers = [];
}

// ========== RANKING — FIX #3 ==========
function switchRanking(modo, btn) {
  rankingModo = modo;

  // Resetar botões — FIX: verificação de null
  const btnAlunos = $('rank-btn-alunos');
  const btnProf = $('rank-btn-professores');

  if (btnAlunos) {
    if (modo === 'alunos') {
      btnAlunos.className = 'btn btn-primary btn-sm';
      btnAlunos.style.cssText = '';
    } else {
      btnAlunos.className = 'btn btn-sm';
      btnAlunos.style.cssText = 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
    }
  }
  if (btnProf) {
    if (modo === 'professores') {
      btnProf.className = 'btn btn-primary btn-sm';
      btnProf.style.cssText = '';
    } else {
      btnProf.className = 'btn btn-sm';
      btnProf.style.cssText = 'background:var(--card);color:var(--text);border:2px solid var(--border);box-shadow:none';
    }
  }

  loadRanking();
}

function loadRanking() {
  db.ref('usuarios').on('value', snap => {
    const users = snap.val();
    if (!users) return;

    let arr = Object.values(users).filter(u => !u.isAdmin);

    if (rankingModo === 'professores') {
      arr = arr.filter(u => u.isProf);
    } else {
      arr = arr.filter(u => !u.isProf);
    }

    arr.sort((a, b) => (b.points || 0) - (a.points || 0));

    // Atualizar label — FIX #7: verificar se elemento existe
    const rankMode = $('my-rank-mode');
    if (rankMode) rankMode.textContent = rankingModo === 'professores' ? '(Professores)' : '(Alunos)';

    // Pódio
    const podio = $('podio');
    if (podio) {
      const renderPlace = (pos, u) => {
        if (!u) return '';
        const colors = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' };
        const sizes = { 1: 70, 2: 58, 3: 55 };
        const sz = sizes[pos];
        return `<div style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;${pos===2?'order:-1':''}">
          ${pos === 1 ? '<div style="font-size:22px;margin-bottom:4px">👑</div>' : ''}
          <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${colors[pos]};display:flex;align-items:center;justify-content:center;font-size:${pos===1?30:24}px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer" onclick="verPerfil('${u.uid}')">${esc(u.avatar || '?')}</div>
          <div style="font-weight:700;font-size:12px;margin-top:6px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((u.username || '').split(' ')[0])} ${u.isProf ? '✅' : ''}</div>
          <div style="color:#6C5CE7;font-weight:700;font-size:13px">${fmt(u.points || 0)}</div>
          <div style="font-size:${pos===1?20:16}px;font-weight:800;color:var(--text3)">${pos}°</div>
        </div>`;
      };
      // Ordem: 2º, 1º, 3º
      podio.innerHTML = [
        renderPlace(2, arr[1]),
        renderPlace(1, arr[0]),
        renderPlace(3, arr[2])
      ].join('');
    }

    // Minha posição — FIX #7: verificação de null
    const isInRanking = (S.ud?.isProf && rankingModo === 'professores') || (!S.ud?.isProf && rankingModo === 'alunos');
    const pos = arr.findIndex(u => u.uid === S.user?.uid);
    const myRankNum = $('my-rank-num');
    const myRankPts = $('my-rank-pts');
    if (myRankNum) myRankNum.textContent = (pos >= 0 && isInRanking) ? '#' + (pos + 1) : '--';
    if (myRankPts) myRankPts.textContent = isInRanking && pos >= 0 ? fmt(arr[pos]?.points || 0) + ' pts' : '-- pts';

    // Lista
    const lista = $('ranking-list');
    if (lista) {
      lista.innerHTML = arr.slice(0, 50).map((u, i) => `
        <div class="card" onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;cursor:pointer;${u.uid === S.user?.uid ? 'background:var(--hover);border:2px solid #6C5CE7;' : ''}">
          <span style="font-weight:800;width:28px;text-align:center;font-size:${i < 3 ? '18' : '14'}px;color:${i < 3 ? '#6C5CE7' : 'var(--text3)'}">
            ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}
          </span>
          <div style="width:34px;height:34px;border-radius:50%;background:${u.isProf ? 'linear-gradient(135deg,#6C5CE7,#10b981)' : '#6C5CE7'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0">${esc(u.avatar || '?')}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">${esc(u.username || '?')} ${u.isProf ? '<span style="color:#6C5CE7;font-size:12px">✅</span>' : ''}</div>
            ${u.uid === S.user?.uid ? '<span style="background:#6C5CE7;color:white;padding:1px 7px;border-radius:10px;font-size:10px">Você</span>' : ''}
          </div>
          <span style="font-weight:700;color:#6C5CE7;font-size:14px">${fmt(u.points || 0)} pts</span>
        </div>
      `).join('');
    }
  });
}

// ========== PERFIL ==========
async function loadPerfil() {
  if (!S.ud || !S.user) return;
  viewingUserId = null;

  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();

  // Estatísticas
  const pPts = $('pstat-pts');
  const pQ = $('pstat-quizzes');
  const pM = $('pstat-materias');
  const pS = $('pstat-seguidores');
  if (pPts) pPts.textContent = fmt(S.ud.points || 0);
  if (pQ) pQ.textContent = S.ud.quizzesPlayed || 0;
  if (pM) pM.textContent = S.ud.materiasCreated || 0;
  if (pS) pS.textContent = S.ud.seguidores || 0;

  // Seguidores/seguindo
  const segSnap = await db.ref('seguindo/' + S.user.uid).once('value');
  const seguSnap = await db.ref('seguidores/' + S.user.uid).once('value');
  const cSegEl = $('count-seguidores');
  const cSeguEl = $('count-seguindo');
  if (cSegEl) cSegEl.textContent = segSnap.val() ? Object.keys(segSnap.val()).length : 0;
  if (cSeguEl) cSeguEl.textContent = seguSnap.val() ? Object.keys(seguSnap.val()).length : 0;

  // Preencher campos de edição — FIX #6
  const editUsername = $('edit-username');
  const editBio = $('edit-bio');
  if (editUsername) editUsername.value = S.ud.username || '';
  if (editBio) editBio.value = S.ud.bio || '';
  
  // ========== BADGES ==========
  const badges = [];
  BADGES.forEach(b => {
    if (b.cond(S.ud)) {
      badges.push('<span class="badge" title="' + b.nome + '">' + b.nome + '</span>');
    }
  });
  const badgeEl = $('perfil-badges');
  if (badgeEl) badgeEl.innerHTML = badges.join('') || '<span class="badge">🌱 Novato</span>';
  
  // Histórico
  const hs = await db.ref('historico/' + S.user.uid).once('value');
  const h = hs.val();
  const histEl = $('perfil-historico');
  if (histEl) {
    histEl.innerHTML = h
      ? Object.entries(h)
          .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
          .slice(0, 10)
          .map(([id, x]) => `
            <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:600;font-size:14px">🎮 ${esc(x.quizNome || 'Quiz')}</div>
                <div style="font-size:11px;color:var(--text3)">${x.acertos}/${x.total} acertos · ${x.pct || 0}% · ${ago(x.createdAt)}</div>
              </div>
              <span style="color:#10b981;font-weight:700">+${fmt(x.score)}</span>
            </div>
          `).join('')
      : '<div style="color:var(--text3);padding:10px;text-align:center">Nenhum quiz ainda</div>';
  }
}

// FIX #5: Bio salva mesmo sem alterar o nome
async function saveProfile() {
  const usernameEl = $('edit-username');
  const bioEl = $('edit-bio');
  const username = usernameEl ? usernameEl.value.trim() : '';
  const bio = bioEl ? bioEl.value.trim() : '';

  const updates = {};
  let changed = false;

  // Atualizar nome se foi preenchido e é diferente
  if (username && username !== S.ud.username) {
    if (username.length < 3) { toast('Nome deve ter pelo menos 3 caracteres', 'error'); return; }
    // Verificar unicidade
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    const existing = snap.val();
    if (existing) {
      const otherUid = Object.keys(existing)[0];
      if (otherUid !== S.user.uid) { toast('Nome de usuário já está em uso!', 'error'); return; }
    }
    updates.username = username;
    changed = true;
  }

  // Sempre atualizar bio se mudou
  if (bio !== (S.ud.bio || '')) {
    updates.bio = bio;
    changed = true;
  }

  if (!changed) { toast('Nenhuma alteração para salvar', 'info'); return; }

  await db.ref('usuarios/' + S.user.uid).update(updates);

  // Atualizar estado local
  if (updates.username) S.ud.username = updates.username;
  if ('bio' in updates) S.ud.bio = updates.bio;

  updateUI();

  // Atualizar campos
  if (usernameEl) usernameEl.value = S.ud.username || '';
  if (bioEl) bioEl.value = S.ud.bio || '';

  toast('Perfil salvo! ✅', 'success');
}

// ========== VER PERFIL FULLSCREEN — FIX #2 ==========
async function verPerfil(uid) {
  if (!uid) return;
  if (uid === S.user?.uid) { navigate('perfil'); return; }
  viewingUserId = uid;

  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) { toast('Usuário não encontrado', 'error'); return; }

  // Verificar se sigo
  const fSnap = await db.ref('seguidores/' + S.user.uid + '/' + uid).once('value');
  const isFollowing = !!fSnap.val();

  // Contadores
  const segSnap = await db.ref('seguindo/' + uid).once('value');
  const segCount = segSnap.val() ? Object.keys(segSnap.val()).length : 0;
  const seguSnap = await db.ref('seguidores/' + uid).once('value');
  const seguCount = seguSnap.val() ? Object.keys(seguSnap.val()).length : 0;

  // Badges
  const badges = [];
  BADGES.forEach(b => {
    if (b.cond(u)) {
      badges.push('<span class="badge" title="' + b.nome + '">' + b.nome + '</span>');
    }
  });
  
  // Posts do usuário
  const postsSnap = await db.ref('posts').orderByChild('autorId').equalTo(uid).limitToLast(5).once('value');
  const posts = postsSnap.val();
  let postsHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post ainda</div>';
  if (posts) {
    const arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    postsHTML = arr.map(p => `
      <div class="card" style="margin-bottom:8px">
        <div style="font-size:11px;color:var(--text3);margin-bottom:5px">${ago(p.createdAt)}</div>
        <div style="font-size:14px;line-height:1.5">${esc(p.texto)}</div>
      </div>
    `).join('');
  }

  // Montar conteúdo
  const content = $('profile-fullscreen-content');
  if (content) {
    content.innerHTML = `
      <div style="background:linear-gradient(135deg,#6C5CE7,#a855f7);border-radius:20px;padding:30px 20px;text-align:center;color:white;margin-bottom:20px">
        <div style="width:90px;height:90px;border-radius:50%;background:${u.isProf ? 'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(16,185,129,0.4))' : 'rgba(255,255,255,0.2)'};color:white;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 12px;border:3px solid rgba(255,255,255,0.5)">${esc(u.avatar || '🎓')}</div>
        <h2 style="font-size:22px;margin-bottom:5px">${esc(u.username || '?')}</h2>
        <p style="opacity:0.85;font-size:14px;margin-bottom:10px">${esc(u.bio || 'Sem bio')}</p>
        <div>${badges.join(' ')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px">
        <div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800;color:#6C5CE7">${fmt(u.points || 0)}</div><div style="font-size:10px;color:var(--text3)">Pontos</div></div>
        <div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">${u.quizzesPlayed || 0}</div><div style="font-size:10px;color:var(--text3)">Quizzes</div></div>
        <div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">${segCount}</div><div style="font-size:10px;color:var(--text3)">Seguidores</div></div>
        <div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">${seguCount}</div><div style="font-size:10px;color:var(--text3)">Seguindo</div></div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px">
        <button class="btn btn-full" id="btn-follow-profile" onclick="toggleFollowProfile('${uid}')" style="background:${isFollowing ? '#10b981' : '#6C5CE7'};box-shadow:0 4px 0 ${isFollowing ? '#059669' : '#5541c8'};color:white;flex:1">
          ${isFollowing ? '✅ Seguindo' : '👥 Seguir'}
        </button>
        <button class="btn btn-green btn-full" onclick="closeProfileFullscreen();setTimeout(()=>{navigate('chat');setTimeout(()=>openPV('${uid}'),300)},100)" style="flex:1">
          💬 Mensagem
        </button>
      </div>
      <div class="section-title">📰 Posts recentes</div>
      ${postsHTML}
    `;
  }

  // Mostrar fullscreen — FIX #2: garantir display correto
  const fs = $('profile-fullscreen');
  if (fs) {
    fs.style.display = 'block';
    fs.scrollTop = 0;
  }
}

function closeProfileFullscreen() {
  const fs = $('profile-fullscreen');
  if (fs) fs.style.display = 'none';
  viewingUserId = null;
}

// Seguir/deixar de seguir do perfil fullscreen
async function toggleFollowProfile(uid) {
  const ref = db.ref('seguidores/' + S.user.uid + '/' + uid);
  const snap = await ref.once('value');
  const btn = $('btn-follow-profile');

  if (snap.val()) {
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + S.user.uid).remove();
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    const cur = cSnap.val() || 0;
    if (cur > 0) await db.ref('usuarios/' + uid + '/seguidores').set(cur - 1);
    if (btn) {
      btn.textContent = '👥 Seguir';
      btn.style.background = '#6C5CE7';
      btn.style.boxShadow = '0 4px 0 #5541c8';
    }
    toast('Deixou de seguir', 'info');
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    await db.ref('usuarios/' + uid + '/seguidores').set((cSnap.val() || 0) + 1);
    await db.ref('notificacoes/' + uid).push({
      mensagem: '👥 ' + S.ud.username + ' começou a te seguir!',
      tipo: 'follow',
      lida: false,
      fromUid: S.user.uid,
      createdAt: Date.now()
    });
    if (btn) {
      btn.textContent = '✅ Seguindo';
      btn.style.background = '#10b981';
      btn.style.boxShadow = '0 4px 0 #059669';
    }
    toast('Seguindo! 👥', 'success');
  }
}

async function showFollowers() {
  const uid = viewingUserId || S.user?.uid;
  if (!uid) return;
  const snap = await db.ref('seguindo/' + uid).once('value');
  const data = snap.val();
  if (!data || !Object.keys(data).length) return alert('Nenhum seguidor ainda.');
  const names = [];
  for (const sid of Object.keys(data)) {
    const u = await db.ref('usuarios/' + sid + '/username').once('value');
    if (u.val()) names.push(u.val());
  }
  alert('Seguidores:\n' + names.join('\n'));
}

async function showFollowing() {
  const uid = viewingUserId || S.user?.uid;
  if (!uid) return;
  const snap = await db.ref('seguidores/' + uid).once('value');
  const data = snap.val();
  if (!data || !Object.keys(data).length) return alert('Não está seguindo ninguém.');
  const names = [];
  for (const fid of Object.keys(data)) {
    const u = await db.ref('usuarios/' + fid + '/username').once('value');
    if (u.val()) names.push(u.val());
  }
  alert('Seguindo:\n' + names.join('\n'));
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs() {
  if (!S.user) return;
  db.ref('notificacoes/' + S.user.uid).on('value', snap => {
    const n = snap.val();
    const badge = $('notif-badge');
    if (!badge) return;
    if (!n) { badge.style.display = 'none'; return; }
    const unread = Object.values(n).filter(x => !x.lida).length;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

async function loadNotifs() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = snap.val();
  const listEl = $('notificacoes-list');
  if (!listEl) return;

  if (!n) {
    listEl.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center">🔔 Nenhuma notificação</div>';
    return;
  }

  listEl.innerHTML = Object.entries(n)
    .reverse()
    .map(([id, x]) => `
      <div class="card ${!x.lida ? 'unread' : ''}" onclick="${x.roomId ? "navigate('chat');joinRoom('" + x.roomId + "')" : ''}" style="cursor:${x.roomId ? 'pointer' : 'default'};margin-bottom:8px">
        <div style="font-size:14px">${esc(x.mensagem)}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">${ago(x.createdAt)}</div>
      </div>
    `).join('');

  // Marcar como lidas
  const updates = {};
  Object.entries(n).forEach(([id, x]) => { if (!x.lida) updates[id + '/lida'] = true; });
  if (Object.keys(updates).length) await db.ref('notificacoes/' + S.user.uid).update(updates);
}

async function marcarLidas() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).once('value');
  const n = snap.val();
  if (!n) return;
  const updates = {};
  Object.keys(n).forEach(id => { updates[id + '/lida'] = true; });
  await db.ref('notificacoes/' + S.user.uid).update(updates);
  toast('Todas marcadas como lidas ✓', 'info');
}

// ========== PONTOS (2x para professores) ==========
async function addPts(pts) {
  if (!S.user || !pts) return;
  const multiplier = S.ud?.isProf ? 2 : 1;
  const total = pts * multiplier;
  const curSnap = await db.ref('usuarios/' + S.user.uid + '/points').once('value');
  const cur = curSnap.val() || 0;
  const newPts = cur + total;
  await db.ref('usuarios/' + S.user.uid).update({ points: newPts });
  S.ud.points = newPts;
  updateUI();
  if (multiplier > 1) toast('+' + fmt(total) + ' pts (2x Professor! ✅)', 'success');
}

// ========== ADM ==========
async function loadAdm() {
  if (!S.ud?.isAdmin) { toast('Acesso negado', 'error'); return; }
  const us = await db.ref('usuarios').once('value');
  const ps = await db.ref('posts').once('value');
  const admU = $('adm-users');
  const admP = $('adm-posts');
  if (admU) admU.textContent = us.val() ? Object.keys(us.val()).length : 0;
  if (admP) admP.textContent = ps.val() ? Object.keys(ps.val()).length : 0;
  admLoad('materias');
}

async function admLoad(tab, btn) {
  const c = $('adm-content-list');
  if (!c) return;

  if (tab === 'materias') {
    const s = await db.ref('materias').once('value');
    const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(([id, m]) => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <span>${esc(m.icone || '📚')} ${esc(m.nome)}</span>
        <button class="btn btn-red btn-sm" onclick="admDel('materias','${id}')">🗑</button>
      </div>
    `).join('') : '<div style="color:var(--text3)">Nenhuma matéria</div>';

  } else if (tab === 'posts') {
    const s = await db.ref('posts').once('value');
    const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(([id, p]) => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.autorNome)}: ${esc((p.texto || '').substring(0, 40))}</span>
        <button class="btn btn-red btn-sm" onclick="admDel('posts','${id}')">🗑</button>
      </div>
    `).join('') : '<div style="color:var(--text3)">Nenhum post</div>';

  } else if (tab === 'usuarios') {
    const s = await db.ref('usuarios').once('value');
    const d = s.val();
    c.innerHTML = d ? Object.values(d).map(u => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <span style="font-size:13px;flex:1;min-width:0">
          ${esc(u.avatar || '?')} <strong>${esc(u.username)}</strong> ${u.isProf ? '✅' : ''} ${u.isAdmin ? '⚙️' : ''}
          <br><span style="color:var(--text3);font-size:11px">${fmt(u.points)} pts</span>
        </span>
        <div style="display:flex;gap:5px;flex-shrink:0">
          ${!u.isAdmin && u.uid !== S.user?.uid ? `
            <button class="btn btn-sm" onclick="admToggleProf('${u.uid}')" style="background:${u.isProf ? '#e0e7ff' : 'var(--border)'};color:${u.isProf ? '#6C5CE7' : 'var(--text)'};box-shadow:none;font-size:11px">${u.isProf ? '✅ Prof' : '👨‍🏫 Prof'}</button>
            <button class="btn btn-red btn-sm" onclick="admDelUser('${u.uid}')">🗑</button>
          ` : '<span style="font-size:12px;color:var(--text3)">Admin</span>'}
        </div>
      </div>
    `).join('') : '<div style="color:var(--text3)">Nenhum usuário</div>';
  }
}

async function admDel(path, id) {
  if (!confirm('Excluir permanentemente?')) return;
  await db.ref(path + '/' + id).remove();
  admLoad(path === 'materias' ? 'materias' : path === 'posts' ? 'posts' : 'usuarios');
  toast('Excluído!', 'info');
}

async function admDelUser(uid) {
  if (!confirm('Excluir usuário permanentemente?')) return;
  await db.ref('usuarios/' + uid).remove();
  admLoad('usuarios');
  toast('Usuário excluído', 'info');
}

async function admAddPts() {
  const el = $('adm-add-pts');
  const pts = parseInt(el ? el.value : '0');
  if (!pts || pts <= 0) return toast('Digite uma quantidade válida', 'error');
  await addPts(pts);
  if (el) el.value = '';
  toast('+' + fmt(pts) + ' pontos adicionados!', 'success');
}

async function admToggleProf(uid) {
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;
  const novoStatus = !u.isProf;
  await db.ref('usuarios/' + uid).update({ isProf: novoStatus });
  toast(novoStatus ? '✅ Agora é Professor!' : '❌ Professor removido', novoStatus ? 'success' : 'info');
  admLoad('usuarios');
}



console.log('✅ Sexta-Feira Studies carregado com sucesso!');
