'use strict';

// ========== FIREBASE ==========
const firebaseConfig = {
  apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
  authDomain: "sexta-feira-studies.firebaseapp.com",
  databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
  projectId: "sexta-feira-studies",
  storageBucket: "sexta-feira-studies.firebasestorage.app",
  messagingSenderId: "673251857052",
  appId: "1:673251857052:web:0ef6929ea93123f7a91359"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ========== API KEYS ==========
const IMGBB_API_KEY = '86427cccd2a94fb42a0754ffd7f19e79';
const GROQ_API_KEY = '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';

// ========== STATE ==========
const S = {
  user: null, ud: null, mid: null, tid: null,
  room: null, roomListener: null, pvUser: null, pvListener: null,
  mFilter: 'all', fFilter: 'all', pType: 'post',
  quiz: { q: [], i: 0, score: 0, corr: 0, timer: null, left: 30, start: 0, ans: [] }
};

let viewingUserId = null;
let questoesNormais = [];
let selectedInviteUsers = [];
let rankingModo = 'alunos';
let googleUserTemp = null;

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1e33) return (n/1e33).toFixed(1)+'Dc'; if (n >= 1e30) return (n/1e30).toFixed(1)+'No'; if (n >= 1e27) return (n/1e27).toFixed(1)+'Oc'; if (n >= 1e24) return (n/1e24).toFixed(1)+'Sp'; if (n >= 1e21) return (n/1e21).toFixed(1)+'Sx'; if (n >= 1e18) return (n/1e18).toFixed(1)+'Qi'; if (n >= 1e15) return (n/1e15).toFixed(1)+'Q'; if (n >= 1e12) return (n/1e12).toFixed(1)+'T'; if (n >= 1e9) return (n/1e9).toFixed(1)+'B'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return String(n); }
function ago(t) { if (!t) return 'agora'; const d = (Date.now()-t)/1000; if (d<60) return 'agora'; if (d<3600) return Math.floor(d/60)+'min'; if (d<86400) return Math.floor(d/3600)+'h'; return Math.floor(d/86400)+'d'; }

function toast(msg, type) {
  type = type || 'info';
  const c = $('toast-container'); if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const d = document.createElement('div');
  d.className = 'toast';
  d.style.borderLeftColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  d.innerHTML = (icons[type]||'') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(function() { d.style.opacity = '0'; d.style.transition = '0.3s'; setTimeout(function() { d.remove(); }, 300); }, 3000);
}

// ========== BADGES ==========
const BADGES = [
  { nome: '🌱 Novato', cond: function(u) { return true; } },
  { nome: '📖 Primeira Aula', cond: function(u) { return (u.materiasCreated||0) >= 1; } },
  { nome: '📚 Bibliotecário', cond: function(u) { return (u.materiasCreated||0) >= 5; } },
  { nome: '🎓 Universitário', cond: function(u) { return (u.materiasCreated||0) >= 25; } },
  { nome: '📝 Primeiro Tópico', cond: function(u) { return (u.topicosCreated||0) >= 1; } },
  { nome: '✍️ Escritor', cond: function(u) { return (u.topicosCreated||0) >= 10; } },
  { nome: '💬 Comentarista', cond: function(u) { return (u.comentarios||0) >= 10; } },
  { nome: '🗣️ Palestrante', cond: function(u) { return (u.comentarios||0) >= 50; } },
  { nome: '🎮 Primeiro Quiz', cond: function(u) { return (u.quizzesPlayed||0) >= 1; } },
  { nome: '🕹️ Gamer', cond: function(u) { return (u.quizzesPlayed||0) >= 10; } },
  { nome: '🎯 Viciado', cond: function(u) { return (u.quizzesPlayed||0) >= 50; } },
  { nome: '👑 Rei dos Quizzes', cond: function(u) { return (u.quizzesPlayed||0) >= 100; } },
  { nome: '🎯 Perfeito', cond: function(u) { return (u.quizPerfeito||0) >= 1; } },
  { nome: '💯 Perfeccionista', cond: function(u) { return (u.quizPerfeito||0) >= 5; } },
  { nome: '⭐ 1K', cond: function(u) { return (u.points||0) >= 1000; } },
  { nome: '💰 5K', cond: function(u) { return (u.points||0) >= 5000; } },
  { nome: '💎 10K', cond: function(u) { return (u.points||0) >= 10000; } },
  { nome: '🐉 1M', cond: function(u) { return (u.points||0) >= 1000000; } },
  { nome: '👤 Social', cond: function(u) { return (u.seguidores||0) >= 1; } },
  { nome: '👥 Popular', cond: function(u) { return (u.seguidores||0) >= 10; } },
  { nome: '🎉 Celebridade', cond: function(u) { return (u.seguidores||0) >= 50; } },
  { nome: '🌟 Estrela', cond: function(u) { return (u.seguidores||0) >= 100; } },
  { nome: '💬 Tagarela', cond: function(u) { return (u.msgsChat||0) >= 100; } },
  { nome: '🏠 Anfitrião', cond: function(u) { return (u.salasCriadas||0) >= 1; } },
  { nome: '📸 Perfil', cond: function(u) { return u.avatar && u.avatar.startsWith('http'); } },
  { nome: '✏️ Bio', cond: function(u) { return u.bio && u.bio.length > 0; } },
  { nome: '🥇 Top 1', cond: function(u) { return u.rankPosition === 1; } },
  { nome: '🥈 Top 3', cond: function(u) { return u.rankPosition && u.rankPosition <= 3; } },
  { nome: '✅ Professor', cond: function(u) { return u.isProf === true; } },
  { nome: '⚙️ Admin', cond: function(u) { return u.isAdmin === true; } },
  { nome: '🧠 Neurinho Friend', cond: function(u) { return (u.neurinhoMsgs||0) >= 10; } },
  { nome: '🎉 Fundador', cond: function(u) { return u.createdAt && u.createdAt < 1750000000000; } }
];

// ========== AUTH ==========
function switchAuthTab(t) {
  const tl = $('tab-login'), tr = $('tab-register');
  if (tl) { tl.className = t === 'login' ? 'btn btn-primary' : 'btn btn-outline'; tl.style.boxShadow = t === 'login' ? '' : 'none'; }
  if (tr) { tr.className = t === 'register' ? 'btn btn-primary' : 'btn btn-outline'; tr.style.boxShadow = t === 'register' ? '' : 'none'; }
  const lf = $('login-form'), rf = $('register-form');
  if (lf) lf.style.display = t === 'login' ? '' : 'none';
  if (rf) rf.style.display = t === 'register' ? '' : 'none';
  const le = $('login-error'), re = $('reg-error');
  if (le) le.style.display = 'none';
  if (re) re.style.display = 'none';
}

async function handleLogin() {
  const u = ($('login-username')?.value || '').trim();
  const p = $('login-password')?.value || '';
  const err = $('login-error');
  if (!u || !p) { if (err) { err.textContent = 'Preencha todos os campos'; err.style.display = ''; } return; }
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(u.replace('@','')).once('value');
    const users = snap.val();
    if (!users) { if (err) { err.textContent = '@' + u.replace('@','') + ' não encontrado'; err.style.display = ''; } return; }
    const uid = Object.keys(users)[0], data = users[uid];
    if (data.password !== p) { if (err) { err.textContent = 'Senha incorreta'; err.style.display = ''; } return; }
    await auth.signInWithEmailAndPassword(data.email, p);
  } catch(e) { if (err) { err.textContent = 'Erro: ' + e.message; err.style.display = ''; } }
}

async function handleRegister() {
  const fullname = ($('reg-fullname')?.value || '').trim();
  const username = ($('reg-username')?.value || '').trim().toLowerCase().replace('@','');
  const email = ($('reg-email')?.value || '').trim();
  const pw = $('reg-password')?.value || '';
  const cf = $('reg-confirm')?.value || '';
  const err = $('reg-error');
  
  if (!fullname || !username || !email || !pw || !cf) { if (err) { err.textContent = 'Preencha todos os campos'; err.style.display = ''; } return; }
  if (fullname.length < 3) { if (err) { err.textContent = 'Nome muito curto'; err.style.display = ''; } return; }
  if (username.length < 3) { if (err) { err.textContent = '@usuario deve ter pelo menos 3 caracteres'; err.style.display = ''; } return; }
  if (!/^[a-z0-9._]+$/.test(username)) { if (err) { err.textContent = '@usuario só pode ter letras minúsculas, números, . e _'; err.style.display = ''; } return; }
  if (pw.length < 6) { if (err) { err.textContent = 'Senha muito curta (mín. 6)'; err.style.display = ''; } return; }
  if (pw !== cf) { if (err) { err.textContent = 'Senhas não coincidem'; err.style.display = ''; } return; }
  
  try {
    const uSnap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    if (uSnap.val()) { if (err) { err.textContent = '@' + username + ' já está em uso!'; err.style.display = ''; } return; }
    const eSnap = await db.ref('usuarios').orderByChild('email').equalTo(email).once('value');
    if (eSnap.val()) { if (err) { err.textContent = 'E-mail já cadastrado!'; err.style.display = ''; } return; }
    
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid, fullname: fullname, username: username, email: email, password: pw,
      avatar: '🎓', bio: '', points: 0, creditos: 0, plano: 'gratis',
      adminLevel: 0, isProf: false, isQuizzer: false,
      uploadsHoje: 0, uploadsData: '', neurinhoMsgsHoje: 0, neurinhoData: '',
      quizzesPlayed: 0, materiasCreated: 0, topicosCreated: 0, comentarios: 0,
      seguidores: 0, seguindo: 0, msgsChat: 0, salasCriadas: 0,
      convitesEnviados: 0, pvCount: 0, quizPerfeito: 0, quizAltaNota: 0,
      neurinhoMsgs: 0, rankPosition: 0, createdAt: Date.now()
    });
    toast('Conta criada! Bem-vindo, @' + username + '! 🎉', 'success');
  } catch(ex) { if (err) { err.textContent = ex.message; err.style.display = ''; } }
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    if (!snap.val()) {
      googleUserTemp = user;
      $('modal-username').classList.add('show');
    }
  } catch(e) { toast('Erro ao entrar com Google: ' + e.message, 'error'); }
}

async function salvarUsernameGoogle() {
  const username = ($('new-username-input')?.value || '').trim().toLowerCase().replace('@','');
  if (!username || username.length < 3) return toast('@usuario deve ter pelo menos 3 caracteres', 'error');
  if (!/^[a-z0-9._]+$/.test(username)) return toast('Apenas letras minúsculas, números, . e _', 'error');
  
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
  if (snap.val()) return toast('@' + username + ' já está em uso!', 'error');
  
  if (!googleUserTemp) return toast('Erro: dados do Google não encontrados', 'error');
  
  await db.ref('usuarios/' + googleUserTemp.uid).set({
    uid: googleUserTemp.uid, fullname: googleUserTemp.displayName || 'Usuário Google',
    username: username, email: googleUserTemp.email, password: '',
    avatar: googleUserTemp.photoURL || '🎓', bio: '', points: 0, creditos: 0, plano: 'gratis',
    adminLevel: 0, isProf: false, isQuizzer: false,
    uploadsHoje: 0, uploadsData: '', neurinhoMsgsHoje: 0, neurinhoData: '',
    quizzesPlayed: 0, materiasCreated: 0, topicosCreated: 0, comentarios: 0,
    seguidores: 0, seguindo: 0, msgsChat: 0, salasCriadas: 0,
    convitesEnviados: 0, pvCount: 0, quizPerfeito: 0, quizAltaNota: 0,
    neurinhoMsgs: 0, rankPosition: 0, createdAt: Date.now()
  });
  
  $('modal-username').classList.remove('show');
  googleUserTemp = null;
  $('new-username-input').value = '';
  toast('Conta criada! Bem-vindo, @' + username + '! 🎉', 'success');
}

async function handleLogout() {
  if (!confirm('Deseja sair?')) return;
  if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); S.roomListener = null; }
  if (S.pvListener) { S.pvListener(); S.pvListener = null; }
  await auth.signOut();
}

// ========== AUTH LISTENER ==========
auth.onAuthStateChanged(async function(user) {
  if (user) {
    S.user = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    S.ud = snap.val() || {};
    if (!S.ud.username) { $('auth-screen').style.display = ''; return; }
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    updateUI();
    navigate('home');
    if (S.ud.adminLevel >= 1) { const nav = $('nav-adm'); if (nav) nav.style.display = ''; }
    listenNotifs();
  } else {
    S.user = null; S.ud = null;
    $('app').style.display = 'none';
    $('auth-screen').style.display = '';
    switchAuthTab('login');
  }
});

// ========== UI ==========
function updateUI() {
  const u = S.ud; if (!u) return;
  const av = u.avatar || '🎓';
  const name = '@' + (u.username || 'usuario');
  
  const els = {
    'sidebar-name': name, 'sidebar-pts': fmt(u.points) + ' pts',
    'perfil-name': u.fullname || u.username || '?', 'perfil-email': name,
    'home-greeting': 'Olá, ' + (u.fullname || u.username || 'Estudante').split(' ')[0] + '! 👋',
    'plano-atual': u.plano === 'pro' ? '🚀 PRO' : u.plano === 'premium' ? '⭐ Premium' : '🆓 Grátis'
  };
  for (const id in els) { const el = $(id); if (el) el.textContent = els[id]; }
  
  // Avatar com imagem
  const avatarEls = ['sidebar-avatar', 'topbar-avatar', 'pc-avatar', 'perfil-avatar'];
  avatarEls.forEach(function(id) {
    const el = $(id); if (!el) return;
    if (av.startsWith('http')) { el.innerHTML = '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />'; }
    else { el.textContent = av; el.innerHTML = ''; }
  });
}

// ========== NAVEGAÇÃO ==========
function navigate(name) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  const t = $('screen-' + name); if (t) t.classList.add('active');
  const sb = $('sidebar'); const ov = $('sidebar-overlay');
  if (sb) sb.classList.remove('open'); if (ov) ov.classList.remove('show');
  const mc = $('main-content'); if (mc) mc.scrollTop = 0;
  window.scrollTo(0, 0);
  
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
  const s = $('sidebar'), o = $('sidebar-overlay');
  if (s) s.classList.toggle('open'); if (o) o.classList.toggle('show');
}

function openModal(id) {
  const m = $('modal-' + id); if (!m) return;
  m.classList.add('show');
  if (id === 'quiz-normal') { questoesNormais = []; const c = $('qn-questoes-container'); if (c) c.innerHTML = ''; addQuestaoNormal(); }
  if (id === 'invite') { selectedInviteUsers = []; const l = $('invite-users-list'); if (l) l.innerHTML = ''; const s = $('invite-selected'); if (s) s.textContent = '0 selecionados'; searchUsersToInvite(); }
}

function closeModal(id) {
  const m = $('modal-' + id); if (m) m.classList.remove('show');
}

// ========== HOME ==========
async function loadHome() {
  if (!S.ud || !S.user) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();

  const pts = S.ud.points || 0;
  const levels = [0, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000, 100000000000, 1000000000000, 10000000000000, 100000000000000, 1000000000000000, 10000000000000000, 100000000000000000, 1000000000000000000, 10000000000000000000, 100000000000000000000, 1000000000000000000000, 10000000000000000000000, 100000000000000000000000];
  const names = ['🌱 Brotinho','📖 Leitor','✍️ Anotador','🧠 Pensador','🎯 Focado','💡 Iluminado','🔥 Motivado','⚡ Rápido','🦉 Sábio','🏅 Dedicado','⭐ Estrela','🌟 Brilhante','💎 Raro','👑 Elite','🐉 Lendário','🌌 Cósmico','🔮 Místico','🎓 Mestre','🧙 Sábio Supremo','🚀 Transcendente','👻 Fantasma','🎪 Quântico','🌀 Dimensional','👁️ Onisciente','🌠 Astral','🎇 Universal','💫 Galáctico','🌟 Estelar','✨ Celestial','👼 Divino'];
  
  let lvl = 0;
  for (let i = 0; i < levels.length; i++) { if (pts >= levels[i]) lvl = i; }
  const nxt = levels[Math.min(lvl + 1, levels.length - 1)];
  const cur = levels[lvl];
  const pct = nxt > cur ? Math.min(((pts - cur) / (nxt - cur)) * 100, 100) : 100;

  const badge = $('level-badge'); if (badge) badge.textContent = '📈 Nível ' + (lvl + 1) + ' - ' + names[lvl];
  const sp = $('stat-pontos'); if (sp) sp.textContent = fmt(pts);
  const sq = $('stat-quizzes'); if (sq) sq.textContent = S.ud.quizzesPlayed || 0;
  const pt = $('progress-text'); if (pt) pt.textContent = fmt(pts) + '/' + fmt(nxt) + ' pts';
  const pf = $('progress-fill'); if (pf) pf.style.width = pct + '%';

  const ms = await db.ref('materias').orderByChild('autorId').equalTo(S.user.uid).once('value');
  const sm = $('stat-materias'); if (sm) sm.textContent = ms.val() ? Object.keys(ms.val()).length : 0;

  const us = await db.ref('usuarios').once('value');
  if (us.val()) {
    const arr = Object.values(us.val()).filter(function(u) { return !u.isAdmin; }).sort(function(a,b) { return (b.points||0)-(a.points||0); });
    const pos = arr.findIndex(function(u) { return u.uid === S.user.uid; });
    const sr = $('stat-rank'); if (sr) sr.textContent = pos >= 0 ? '#' + (pos + 1) : '#--';
  }

  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value', function(snap) {
    const posts = snap.val();
    const c = $('home-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>'; return; }
    const arr = Object.entries(posts).map(function(e) { return { id: e[0], ...e[1] }; }).reverse();
    c.innerHTML = arr.map(function(p) { return feedCardHTML(p, true); }).join('');
  });
}

function feedCardHTML(p, compact) {
  compact = compact || false;
  const imgHTML = p.imagem ? '<img src="' + esc(p.imagem) + '" style="width:100%;max-height:250px;object-fit:cover;border-radius:10px;margin-top:8px" loading="lazy" />' : '';
  const likes = p.likes ? Object.keys(p.likes).length : 0;
  const liked = p.likes && p.likes[S.user?.uid];
  const isOwner = p.autorId === S.user?.uid;
  const canDelete = isOwner || (S.ud?.adminLevel >= 1) || (S.ud?.isProf);

  return '<div class="card" style="margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
      '<div onclick="verPerfil(\'' + esc(p.autorId) + '\')" style="width:36px;height:36px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;cursor:pointer;flex-shrink:0;overflow:hidden">' + (p.avatar && p.avatar.startsWith('http') ? '<img src="' + esc(p.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(p.avatar || '?')) + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:14px">' + esc(p.autorNome || '?') + '</div>' +
        '<div style="color:var(--text3);font-size:11px">' + ago(p.createdAt) + '</div>' +
      '</div>' +
      (canDelete ? '<button onclick="deletePost(\'' + p.id + '\')" style="border:none;background:none;cursor:pointer;color:#EF4444;font-size:16px;padding:4px">🗑</button>' : '') +
    '</div>' +
    (p.texto ? '<div style="font-size:14px;line-height:1.6;margin-bottom:' + (compact ? '0' : '8px') + '">' + esc(p.texto) + '</div>' : '') +
    imgHTML +
    (compact ? '' : '<div style="display:flex;align-items:center;gap:10px;padding-top:8px;border-top:1px solid var(--border);margin-top:8px">' +
      '<button onclick="likePost(\'' + p.id + '\')" style="border:none;background:none;cursor:pointer;font-weight:600;color:' + (liked ? '#EF4444' : 'var(--text3)') + ';font-size:13px">' + (liked ? '❤️' : '🤍') + ' ' + likes + '</button>' +
    '</div>') +
  '</div>';
}

// ========== MATÉRIAS ==========
let materiasListener = null;

function loadMaterias() {
  if (materiasListener) { db.ref('materias').off('value', materiasListener); }
  materiasListener = db.ref('materias').on('value', function(snap) {
    const mat = snap.val();
    const c = $('materias-grid'); if (!c) return;
    if (!mat) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📚 Nenhuma aula ainda</div>'; return; }
    let arr = Object.entries(mat).map(function(e) { return { id: e[0], ...e[1] }; });
    if (S.mFilter === 'mine') arr = arr.filter(function(m) { return m.autorId === S.user?.uid; });
    const s = ($('search-materias')?.value || '').toLowerCase();
    if (s) arr = arr.filter(function(m) { return (m.nome || '').toLowerCase().includes(s); });
    arr.sort(function(a,b) { return (b.createdAt||0)-(a.createdAt||0); });
    if (!arr.length) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">🔍 Nenhuma encontrada</div>'; return; }
    c.innerHTML = arr.map(function(m) {
      return '<div class="card card-clickable" onclick="openMateria(\'' + m.id + '\')" style="display:flex;gap:12px;align-items:center">' +
        '<span style="font-size:35px;flex-shrink:0">' + (m.icone || '📚') + '</span>' +
        '<div style="min-width:0"><div style="font-weight:700;font-size:15px">' + esc(m.nome) + '</div>' +
        '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + esc(m.descricao || 'Sem descrição') + '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:4px">Por: ' + esc(m.autorNome || '?') + '</div></div>' +
      '</div>';
    }).join('');
  });
}

function setMateriaFilter(f, btn) { S.mFilter = f; loadMaterias(); }
function filterMaterias() { loadMaterias(); }

async function criarMateria() {
  const n = ($('nm-nome')?.value || '').trim();
  const d = ($('nm-desc')?.value || '').trim();
  if (!n) { toast('Nome obrigatório', 'error'); return; }
  await db.ref('materias').push({ nome: n, descricao: d, icone: '📚', autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud.isProf || false, topicosCount: 0, createdAt: Date.now() });
  closeModal('materia');
  if ($('nm-nome')) $('nm-nome').value = '';
  if ($('nm-desc')) $('nm-desc').value = '';
  await addPts(20);
  toast('Aula criada! 📚', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val(); if (!m) { toast('Aula não encontrada', 'error'); return; }
  const icon = $('materia-hero-icon'); if (icon) icon.textContent = m.icone || '📚';
  const nome = $('materia-hero-nome'); if (nome) nome.textContent = m.nome;
  const desc = $('materia-hero-desc'); if (desc) desc.textContent = m.descricao || '';
  const autor = $('materia-hero-autor'); if (autor) autor.textContent = 'Por: @' + (m.autorNome || '?');
  navigate('materia-detalhe');

  db.ref('topicos/' + id).on('value', function(snap) {
    const t = snap.val();
    const c = $('topicos-list'); if (!c) return;
    if (!t) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">📝 Nenhum tópico</div>'; return; }
    c.innerHTML = Object.entries(t).map(function(e) {
      return '<div class="card card-clickable" onclick="openTopico(\'' + e[0] + '\')" style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:20px">' + (e[1].verificado ? '✅' : '📄') + '</span>' +
        '<div><div style="font-weight:600">' + esc(e[1].titulo) + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">Por @' + esc(e[1].autorNome || '?') + ' · ' + ago(e[1].createdAt) + '</div></div>' +
      '</div>';
    }).join('');
  });

  db.ref('quizzes/' + id).on('value', function(snap) {
    const q = snap.val();
    const c = $('quizzes-materia'); if (!c) return;
    if (!q) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">🎮 Nenhum quiz</div>'; return; }
    c.innerHTML = Object.entries(q).map(function(e) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center">' +
        '<div><strong>🎮 ' + esc(e[1].nome) + '</strong>' + (e[1].oficial ? ' <span style="color:#10B981;font-size:11px">✅ Oficial</span>' : '') +
        (e[1].nivel ? ' <span style="color:#3B82F6;font-size:11px">Nv.' + e[1].nivel + '</span>' : '') +
        '<br><span style="font-size:12px;color:var(--text3)">' + (e[1].questoes?.length || 0) + ' questões</span></div>' +
        '<button class="btn btn-primary btn-sm" onclick="startQuiz(\'' + id + '\',\'' + e[0] + '\')">▶ Jogar</button>' +
      '</div>';
    }).join('');
  });
}

// ========== TÓPICOS ==========
async function criarTopico() {
  const t = ($('nt-titulo')?.value || '').trim();
  const c = ($('nt-conteudo')?.value || '').trim();
  if (!t || !c) { toast('Preencha tudo', 'error'); return; }
  if (!S.mid) { toast('Selecione uma aula', 'error'); return; }
  await db.ref('topicos/' + S.mid).push({ titulo: t, conteudo: c, autorId: S.user.uid, autorNome: S.ud.username, verificado: false, createdAt: Date.now() });
  closeModal('topico');
  if ($('nt-titulo')) $('nt-titulo').value = '';
  if ($('nt-conteudo')) $('nt-conteudo').value = '';
  await addPts(15);
  toast('Tópico criado! 📝', 'success');
}

async function openTopico(id) {
  S.tid = id;
  const snap = await db.ref('topicos/' + S.mid + '/' + id).once('value');
  const t = snap.val(); if (!t) { toast('Tópico não encontrado', 'error'); return; }
  const title = $('topico-title'); if (title) title.innerHTML = esc(t.titulo) + (t.verificado ? ' <span style="color:#10B981;font-size:14px">✅ Verificado</span>' : '');
  const meta = $('topico-meta');
  if (meta) {
    meta.innerHTML = 'Por <strong>@' + esc(t.autorNome || '?') + '</strong> · ' + ago(t.createdAt);
    if (S.ud?.isProf && !t.verificado) {
      meta.innerHTML += ' <button class="btn btn-primary btn-sm" onclick="verificarTopico(\'' + id + '\')" style="font-size:10px;padding:3px 8px;margin-left:8px">✅ Verificar</button>';
    }
  }
  const body = $('topico-body'); if (body) body.textContent = t.conteudo;
  navigate('topico-detalhe');

  db.ref('comentarios/' + S.mid + '/' + id).on('value', function(snap) {
    const coms = snap.val();
    const c = $('topico-comentarios'); if (!c) return;
    if (!coms) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">💬 Seja o primeiro!</div>'; return; }
    const arr = Object.entries(coms).map(function(e) { return { id: e[0], ...e[1] }; }).sort(function(a,b) { return (a.createdAt||0)-(b.createdAt||0); });
    // Professores primeiro
    arr.sort(function(a,b) { if (a.isProf && !b.isProf) return -1; if (!a.isProf && b.isProf) return 1; return (a.createdAt||0)-(b.createdAt||0); });
    c.innerHTML = arr.map(function(com) {
      return '<div class="card" style="margin-bottom:8px;' + (com.isProf ? 'border-left:3px solid #10B981;background:var(--hover)' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:' + (com.isProf ? 'linear-gradient(135deg,#10B981,#3B82F6)' : '#10B981') + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;cursor:pointer" onclick="verPerfil(\'' + esc(com.autorId) + '\')">' + esc((com.autorNome || '?')[0].toUpperCase()) + '</div>' +
          '<div><span style="font-weight:700;font-size:13px">@' + esc(com.autorNome || '?') + '</span>' + (com.isProf ? ' <span style="color:#10B981;font-size:11px">✅ Prof</span>' : '') + ' <span style="color:var(--text3);font-size:11px">' + ago(com.createdAt) + '</span></div>' +
        '</div>' +
        '<div style="font-size:14px;line-height:1.5;padding-left:36px">' + esc(com.texto) + '</div>' +
      '</div>';
    }).join('');
  });
}

async function verificarTopico(tid) {
  if (!S.ud?.isProf) return toast('Só professores', 'error');
  await db.ref('topicos/' + S.mid + '/' + tid).update({ verificado: true, verificadoPor: S.ud.username, verificadoEm: Date.now() });
  toast('✅ Tópico verificado!', 'success');
  openTopico(tid);
}

async function addComment() {
  const input = $('new-comment'); const t = input ? input.value.trim() : '';
  if (!t) return;
  await db.ref('comentarios/' + S.mid + '/' + S.tid).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud?.isProf || false, createdAt: Date.now() });
  if (input) input.value = '';
  await addPts(S.ud?.isProf ? 6 : 3);
}

// ========== QUIZ ==========
function addQuestaoNormal() {
  const idx = questoesNormais.length;
  questoesNormais.push({ pergunta: '', alternativas: ['', '', '', ''], correta: 0 });
  const div = document.createElement('div');
  div.style.cssText = 'background:var(--input-bg);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)';
  div.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:14px">Questão ' + (idx + 1) + '</strong>' + (idx > 0 ? '<button onclick="removerQuestao(' + idx + ')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:16px">🗑</button>' : '') + '</div>' +
    '<input class="input-field" placeholder="Pergunta..." oninput="questoesNormais[' + idx + '].pergunta=this.value" style="margin-bottom:8px" />' +
    ['A','B','C','D'].map(function(l, i) {
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><input type="radio" name="qc' + idx + '" value="' + i + '" ' + (i === 0 ? 'checked' : '') + ' onchange="questoesNormais[' + idx + '].correta=' + i + '" /><span style="font-weight:700;width:20px">' + l + '</span><input class="input-field" placeholder="Alternativa ' + l + '..." style="margin:0;flex:1" oninput="questoesNormais[' + idx + '].alternativas[' + i + ']=this.value" /></div>';
    }).join('');
  const container = $('qn-questoes-container'); if (container) container.appendChild(div);
}

function removerQuestao(idx) {
  questoesNormais.splice(idx, 1);
  const container = $('qn-questoes-container'); if (!container) return;
  container.innerHTML = '';
  const backup = questoesNormais.slice();
  questoesNormais = [];
  backup.forEach(function() { addQuestaoNormal(); });
}

async function salvarQuizNormal() {
  const nome = ($('qn-nome')?.value || '').trim();
  const tempo = parseInt($('qn-tempo')?.value || '30') || 30;
  if (!nome) { toast('Nome obrigatório', 'error'); return; }
  if (!S.mid) { toast('Acesse uma aula primeiro', 'error'); return; }
  const validas = questoesNormais.filter(function(q) { return q.pergunta.trim() && q.alternativas.filter(function(a) { return a.trim(); }).length >= 2; });
  if (!validas.length) { toast('Adicione questões', 'error'); return; }
  await db.ref('quizzes/' + S.mid).push({ nome: nome, tempo: tempo, questoes: validas, autorId: S.user.uid, autorNome: S.ud.username, oficial: (S.ud?.isQuizzer || S.ud?.adminLevel >= 3) ? true : false, nivel: 1, totalPlays: 0, createdAt: Date.now() });
  closeModal('quiz-normal');
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function processarCmd() {
  const input = ($('cmd-input')?.value || '');
  if (!input.trim()) return toast('Digite os comandos', 'error');
  if (!S.mid) return toast('Acesse uma aula primeiro', 'error');
  const lines = input.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });
  let nome = '', questoes = [], curQ = null, alts = [], corr = -1, tempo = 30;
  
  for (const l of lines) {
    if (l.startsWith('/n ')) nome = l.substring(3).trim();
    else if (l.startsWith('/t ')) tempo = parseInt(l.substring(3)) || 30;
    else if (l.startsWith('/q ')) {
      if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts.slice(); curQ.correta = corr; questoes.push(curQ); }
      curQ = { pergunta: l.substring(3).trim() }; alts = []; corr = -1;
    }
    else if (l.startsWith('/a ')) alts.push(l.substring(3).trim());
    else if (l.startsWith('/c ')) { const map = { A: 0, B: 1, C: 2, D: 3 }; corr = map[l.substring(3).trim().toUpperCase()] ?? -1; }
    else if (l === '/f') { if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts.slice(); curQ.correta = corr; questoes.push(curQ); curQ = null; alts = []; corr = -1; } }
  }
  if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts.slice(); curQ.correta = corr; questoes.push(curQ); }
  
  if (!nome) return toast('Use /n Nome', 'error');
  if (!questoes.length) return toast('Adicione questões', 'error');
  
  await db.ref('quizzes/' + S.mid).push({ nome: nome, tempo: tempo, questoes: questoes, autorId: S.user.uid, autorNome: S.ud.username, oficial: false, totalPlays: 0, createdAt: Date.now() });
  closeModal('quiz-cmd');
  if ($('cmd-input')) $('cmd-input').value = '';
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val();
  if (!q || !q.questoes || !q.questoes.length) { toast('Quiz sem questões', 'error'); return; }
  S.quiz = { q: shuffle(q.questoes.slice()), i: 0, score: 0, corr: 0, timer: null, left: q.tempo || 30, tempoTotal: q.tempo || 30, start: Date.now(), ans: [], nome: q.nome, mId: mId, qId: qId };
  navigate('quiz-game');
  renderQ();
}

function renderQ() {
  const g = S.quiz;
  if (g.i >= g.q.length) { finishQ(); return; }
  const q = g.q[g.i];
  const counter = $('quiz-q-counter'); if (counter) counter.textContent = (g.i + 1) + '/' + g.q.length;
  const qnum = $('quiz-q-num'); if (qnum) qnum.textContent = 'Questão ' + (g.i + 1);
  const question = $('quiz-question'); if (question) question.textContent = q.pergunta;
  const pf = $('quiz-progress-fill'); if (pf) pf.style.width = (g.i / g.q.length * 100) + '%';
  const scoreEl = $('quiz-score-live'); if (scoreEl) scoreEl.textContent = g.score;
  const timerEl = $('quiz-timer');

  const opts = $('quiz-options');
  if (opts) {
    opts.innerHTML = q.alternativas.map(function(a, i) {
      return '<button onclick="selectA(' + i + ')" id="opt-' + i + '" style="display:flex;align-items:center;width:100%;padding:14px;margin-bottom:8px;border:2px solid var(--border);border-radius:12px;background:var(--card);text-align:left;font-size:15px;cursor:pointer;transition:all 0.15s;font-family:\'Sora\',sans-serif">' +
        '<span class="opt-letter" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#10B981;color:white;font-weight:700;font-size:13px;margin-right:12px;flex-shrink:0">' + ['A','B','C','D'][i] + '</span>' +
        '<span>' + esc(a) + '</span></button>';
    }).join('');
  }

  clearInterval(g.timer);
  g.left = g.tempoTotal || 30;
  if (timerEl) { timerEl.textContent = '⏱ ' + g.left + 's'; timerEl.style.background = 'var(--gold-light)'; }
  g.timer = setInterval(function() {
    g.left--;
    if (timerEl) { timerEl.textContent = '⏱ ' + g.left + 's'; timerEl.style.background = g.left <= 5 ? '#FEE2E2' : 'var(--gold-light)'; }
    if (g.left <= 0) { clearInterval(g.timer); selectA(-1); }
  }, 1000);
}

function selectA(chosen) {
  clearInterval(S.quiz.timer);
  const g = S.quiz, q = g.q[g.i], corr = q.correta, ok = chosen === corr;
  document.querySelectorAll('#quiz-options button').forEach(function(b, i) {
    b.disabled = true; b.style.cursor = 'default';
    if (i === corr) { b.style.background = '#D1FAE5'; b.style.borderColor = '#10B981'; const letter = b.querySelector('.opt-letter'); if (letter) letter.style.background = '#059669'; }
    if (i === chosen && !ok) { b.style.background = '#FEE2E2'; b.style.borderColor = '#EF4444'; const letter = b.querySelector('.opt-letter'); if (letter) letter.style.background = '#DC2626'; }
  });
  if (ok) { const bonus = Math.max(10, Math.round(10 + (g.left / (g.tempoTotal || 30)) * 10)); g.score += bonus; g.corr++; g.ans.push({ isCorrect: true, pts: bonus, pergunta: q.pergunta, correta: q.alternativas[corr] }); }
  else { g.ans.push({ isCorrect: false, pts: 0, pergunta: q.pergunta, correta: q.alternativas[corr] }); }
  const scoreEl = $('quiz-score-live'); if (scoreEl) scoreEl.textContent = g.score;
  setTimeout(function() { g.i++; renderQ(); }, 1500);
}

async function finishQ() {
  clearInterval(S.quiz.timer);
  const g = S.quiz, total = g.q.length, elapsed = Math.round((Date.now() - g.start) / 1000), pct = Math.round((g.corr / total) * 100);
  const bonus = pct >= 90 ? 50 : pct >= 70 ? 30 : pct >= 50 ? 15 : 0, totalPts = g.score + bonus;
  await db.ref('historico/' + S.user.uid).push({ quizNome: g.nome, score: totalPts, acertos: g.corr, total: total, pct: pct, tempo: elapsed, createdAt: Date.now() });
  await addPts(totalPts);
  await db.ref('usuarios/' + S.user.uid).update({ quizzesPlayed: (S.ud.quizzesPlayed || 0) + 1 });
  if (S.ud) S.ud.quizzesPlayed = (S.ud.quizzesPlayed || 0) + 1;
  navigate('resultado');

  const ac = $('res-acertos'); if (ac) ac.textContent = g.corr;
  const tot = $('res-total'); if (tot) tot.textContent = total;
  const pts = $('res-pontos'); if (pts) pts.textContent = '+' + totalPts;
  const tp = $('res-tempo'); if (tp) tp.textContent = elapsed + 's';
  const pctEl = $('resultado-pct'); if (pctEl) pctEl.textContent = pct + '%';
  const bar = $('resultado-barra-fill'); if (bar) setTimeout(function() { bar.style.width = pct + '%'; }, 100);
  const rev = $('resultado-review');
  if (rev) {
    rev.innerHTML = g.ans.map(function(a, i) {
      return '<div style="padding:10px;border-radius:10px;margin-bottom:6px;background:' + (a.isCorrect ? '#D1FAE5' : '#FEE2E2') + ';border-left:3px solid ' + (a.isCorrect ? '#10B981' : '#EF4444') + '">' +
        '<div style="font-weight:600;font-size:13px">' + (i + 1) + '. ' + esc(a.pergunta) + '</div>' +
        '<div style="font-size:12px;color:' + (a.isCorrect ? '#059669' : '#DC2626') + ';margin-top:4px">' + (a.isCorrect ? '✅ Correto! +' + a.pts + 'pts' : '❌ Errado · Certa: ' + esc(a.correta)) + '</div></div>';
    }).join('');
  }
}

function exitQuiz() { if (!confirm('Sair do quiz?')) return; clearInterval(S.quiz.timer); navigate('materia-detalhe'); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = a[i]; a[i] = a[j]; a[j] = tmp; } return a; }

// ========== FEED ==========
function loadFeed() {
  if (S.fFilter === 'usuarios') { loadAllUsers(); return; }
  db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value', function(snap) {
    const posts = snap.val();
    const c = $('descobrir-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>'; return; }
    let arr = Object.entries(posts).map(function(e) { return { id: e[0], ...e[1] }; }).reverse();
    if (S.fFilter !== 'all') arr = arr.filter(function(p) { return p.tipo === S.fFilter; });
    // Professores primeiro
    arr.sort(function(a,b) { if (a.isProf && !b.isProf) return -1; if (!a.isProf && b.isProf) return 1; return (b.createdAt||0)-(a.createdAt||0); });
    c.innerHTML = arr.length ? arr.map(function(p) { return feedCardHTML(p); }).join('') : '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>';
  });
}

function setPostType(t, btn) {
  S.pType = t;
  ['post','dica','duvida'].forEach(function(type) {
    const b = document.querySelector('#screen-descobrir .btn-sm[onclick*="' + type + '"]');
    if (!b) return;
    b.className = type === t ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  });
}

function setFeedFilter(f, btn) {
  S.fFilter = f;
  const si = $('search-users-input');
  if (f === 'usuarios') { if (si) si.style.display = ''; loadAllUsers(); }
  else { if (si) si.style.display = 'none'; loadFeed(); }
}

async function createPost() {
  const t = ($('new-post-text')?.value || '').trim();
  const imgInput = $('post-image-input');
  if (!t && (!imgInput || !imgInput.files[0])) return toast('Escreva algo ou adicione imagem', 'error');
  
  // Verificar limite diário
  const hoje = new Date().toDateString();
  if (S.ud.uploadsData !== hoje) { S.ud.uploadsHoje = 0; S.ud.uploadsData = hoje; }
  const limite = S.ud.plano === 'pro' ? 20 : S.ud.plano === 'premium' ? 10 : 5;
  if (imgInput && imgInput.files[0] && S.ud.uploadsHoje >= limite && S.ud.creditos < 1) {
    return toast('Limite de ' + limite + ' imagens/dia atingido! Compre créditos ou faça upgrade.', 'error');
  }
  
  let imagemUrl = null;
  if (imgInput && imgInput.files[0]) {
    toast('⏳ Enviando imagem...', 'info');
    imagemUrl = await uploadImage(imgInput.files[0]);
    if (!imagemUrl) return toast('Erro ao enviar imagem', 'error');
    S.ud.uploadsHoje++;
    if (S.ud.uploadsHoje > limite) S.ud.creditos = Math.max(0, (S.ud.creditos || 0) - 1);
    await db.ref('usuarios/' + S.user.uid).update({ uploadsHoje: S.ud.uploadsHoje, uploadsData: hoje, creditos: S.ud.creditos || 0 });
  }
  
  await db.ref('posts').push({ texto: t, tipo: S.pType, imagem: imagemUrl, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, isProf: S.ud.isProf || false, likes: {}, createdAt: Date.now() });
  if ($('new-post-text')) $('new-post-text').value = '';
  if (imgInput) imgInput.value = '';
  const preview = $('post-image-preview'); if (preview) preview.innerHTML = '';
  await addPts(5);
  toast('Publicado! 📢', 'success');
}

async function criarPostModal() {
  const t = ($('post-texto-modal')?.value || '').trim();
  const tp = $('post-tipo-modal')?.value || 'post';
  const imgInput = $('modal-post-image-input');
  if (!t && (!imgInput || !imgInput.files[0])) return toast('Escreva algo ou adicione imagem', 'error');
  
  const hoje = new Date().toDateString();
  if (S.ud.uploadsData !== hoje) { S.ud.uploadsHoje = 0; S.ud.uploadsData = hoje; }
  const limite = S.ud.plano === 'pro' ? 20 : S.ud.plano === 'premium' ? 10 : 5;
  
  let imagemUrl = null;
  if (imgInput && imgInput.files[0]) {
    if (S.ud.uploadsHoje >= limite && S.ud.creditos < 1) return toast('Limite de imagens atingido!', 'error');
    toast('⏳ Enviando imagem...', 'info');
    imagemUrl = await uploadImage(imgInput.files[0]);
    if (!imagemUrl) return toast('Erro ao enviar imagem', 'error');
    S.ud.uploadsHoje++;
    if (S.ud.uploadsHoje > limite) S.ud.creditos = Math.max(0, (S.ud.creditos || 0) - 1);
    await db.ref('usuarios/' + S.user.uid).update({ uploadsHoje: S.ud.uploadsHoje, uploadsData: hoje, creditos: S.ud.creditos || 0 });
  }
  
  await db.ref('posts').push({ texto: t, tipo: tp, imagem: imagemUrl, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, isProf: S.ud.isProf || false, likes: {}, createdAt: Date.now() });
  closeModal('post');
  if ($('post-texto-modal')) $('post-texto-modal').value = '';
  if (imgInput) imgInput.value = '';
  const preview = $('modal-post-image-preview'); if (preview) preview.innerHTML = '';
  await addPts(5);
  toast('Publicado! 📢', 'success');
}

function previewPostImage(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = $('post-image-preview');
    if (preview) preview.innerHTML = '<img src="' + e.target.result + '" class="image-preview large" />';
  };
  reader.readAsDataURL(input.files[0]);
}

function previewModalPostImage(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = $('modal-post-image-preview');
    if (preview) preview.innerHTML = '<img src="' + e.target.result + '" class="image-preview large" />';
  };
  reader.readAsDataURL(input.files[0]);
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

async function loadAllUsers() {
  const c = $('descobrir-feed'); if (!c) return;
  c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">⏳ Carregando...</div>';
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!users) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">Nenhum usuário</div>'; return; }
  await renderUserList(users);
}

async function searchUsers() {
  const term = ($('search-users-input')?.value || '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val(); if (!users) return;
  if (!term) { await renderUserList(users); return; }
  const filt = {};
  Object.entries(users).forEach(function(e) { if ((e[1].username || '').toLowerCase().includes(term) || (e[1].fullname || '').toLowerCase().includes(term)) filt[e[0]] = e[1]; });
  await renderUserList(filt);
}

async function renderUserList(users) {
  const c = $('descobrir-feed'); if (!c) return;
  const arr = Object.entries(users).map(function(e) { return { id: e[0], ...e[1] }; }).sort(function(a,b) { return (b.points||0)-(a.points||0); });
  if (!arr.length) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">Nenhum encontrado</div>'; return; }
  
  const myFollowing = {};
  if (S.user) {
    const fSnap = await db.ref('seguidores/' + S.user.uid).once('value');
    const fData = fSnap.val();
    if (fData) Object.keys(fData).forEach(function(uid) { myFollowing[uid] = true; });
  }
  
  c.innerHTML = arr.map(function(u) {
    const isMe = u.id === S.user?.uid;
    const isFollowing = myFollowing[u.id];
    let badges = '';
    if (u.isProf) badges += '<span style="color:#10B981;font-size:12px">✅</span>';
    if (u.isAdmin) badges += '<span style="color:#F59E0B;font-size:12px">⚙️</span>';
    
    return '<div class="card card-clickable" onclick="' + (isMe ? "navigate('perfil')" : "verPerfil('" + u.id + "')") + '" style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:' + (u.isProf ? 'linear-gradient(135deg,#10B981,#3B82F6)' : '#10B981') + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0;overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')[0]) + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">@' + esc(u.username || '?') + ' ' + badges + '</div>' +
      (isMe ? '<span style="background:#10B981;color:white;padding:2px 8px;border-radius:10px;font-size:10px">Você</span>' : '') +
      '<div style="font-size:12px;color:var(--text3);margin-top:2px">⭐ ' + fmt(u.points) + ' pts · 👥 ' + (u.seguidores || 0) + ' seguidores</div></div>' +
      (!isMe ? '<button class="btn btn-sm ' + (isFollowing ? 'btn-primary' : 'btn-outline') + '" onclick="event.stopPropagation();toggleFollowUser(\'' + u.id + '\',this)" style="flex-shrink:0;' + (isFollowing ? 'background:#10B981;' : '') + '">' + (isFollowing ? '✅ Seguindo' : '👥 Seguir') + '</button>' : '') +
    '</div>';
  }).join('');
}

async function toggleFollowUser(uid, btn) {
  if (!S.user) return;
  const ref = db.ref('seguidores/' + S.user.uid + '/' + uid);
  const snap = await ref.once('value');
  if (snap.val()) {
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + S.user.uid).remove();
    if (btn) { btn.textContent = '👥 Seguir'; btn.className = 'btn btn-sm btn-outline'; btn.style.background = ''; }
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    await db.ref('usuarios/' + uid).update({ seguidores: (cSnap.val() || 0) + 1 });
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 @' + S.ud.username + ' começou a te seguir!', tipo: 'follow', lida: false, createdAt: Date.now() });
    if (btn) { btn.textContent = '✅ Seguindo'; btn.className = 'btn btn-sm btn-primary'; btn.style.background = '#10B981'; }
  }
}

// ========== CHAT ==========
function loadChat() {
  db.ref('chat_rooms').on('value', function(snap) {
    const rooms = snap.val();
    const c = $('rooms-list'); if (!c) return;
    if (!rooms) { c.innerHTML = '<div style="padding:10px;color:var(--text3);font-size:12px">Nenhuma sala</div>'; return; }
    c.innerHTML = Object.entries(rooms).map(function(e) {
      return '<div onclick="joinRoom(\'' + e[0] + '\')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;' + (S.room === e[0] ? 'background:var(--hover);color:#10B981' : '') + '"># ' + esc(e[1].nome) + '</div>';
    }).join('');
  });
}

function joinRoom(id) {
  S.room = id;
  if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); }
  S.roomListener = db.ref('chat_messages/' + id).on('value', function(snap) {
    const msgs = snap.val();
    const c = $('chat-messages'); if (!c) return;
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px">💬 Envie a primeira mensagem!</div>'; return; }
    c.innerHTML = Object.entries(msgs).sort(function(a,b) { return (a[1].createdAt||0)-(b[1].createdAt||0); }).map(function(e) {
      const m = e[1]; const isMe = m.autorId === S.user?.uid;
      const imgHTML = m.imagem ? '<img src="' + esc(m.imagem) + '" style="max-width:200px;border-radius:10px;margin-top:5px" />' : '';
      return '<div style="display:flex;flex-direction:' + (isMe ? 'row-reverse' : 'row') + ';gap:8px;margin-bottom:10px;align-items:flex-end">' +
        (!isMe ? '<div onclick="openPV(\'' + m.autorId + '\')" style="width:26px;height:26px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">@</div>' : '') +
        '<div style="max-width:70%">' +
          (!isMe ? '<div style="font-size:10px;color:var(--text3);margin-bottom:2px">@' + esc(m.autorNome || '?') + '</div>' : '') +
          '<div style="padding:10px 14px;border-radius:' + (isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px') + ';background:' + (isMe ? '#10B981' : 'var(--input-bg)') + ';color:' + (isMe ? 'white' : 'var(--text)') + ';font-size:14px">' + esc(m.texto) + imgHTML + '<div style="font-size:9px;opacity:0.6;margin-top:4px;text-align:right">' + ago(m.createdAt) + '</div></div>' +
        '</div></div>';
    }).join('');
    c.scrollTop = c.scrollHeight;
  });
  
  const noRoom = $('chat-no-room'); if (noRoom) noRoom.style.display = 'none';
  const roomView = $('chat-room-view'); if (roomView) roomView.style.display = 'flex';
  const pvView = $('pv-chat-view'); if (pvView) pvView.style.display = 'none';
  const roomName = $('chat-room-name');
  db.ref('chat_rooms/' + id).once('value').then(function(s) { if (roomName) roomName.textContent = '# ' + (s.val()?.nome || 'Sala'); });
}

function leaveRoom() { if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); S.roomListener = null; } S.room = null; const noRoom = $('chat-no-room'); if (noRoom) noRoom.style.display = 'flex'; const roomView = $('chat-room-view'); if (roomView) roomView.style.display = 'none'; }

function openPV(uid) {
  if (!uid || uid === S.user?.uid) return;
  S.pvUser = uid;
  db.ref('usuarios/' + uid).once('value').then(function(s) {
    const u = s.val(); if (!u) return;
    const av = $('pv-chat-avatar'); if (av) av.textContent = (u.username || '?')[0].toUpperCase();
    const nm = $('pv-chat-name'); if (nm) nm.textContent = '@' + (u.username || '?');
  });
  const roomView = $('chat-room-view'); if (roomView) roomView.style.display = 'none';
  const noRoom = $('chat-no-room'); if (noRoom) noRoom.style.display = 'none';
  const pvView = $('pv-chat-view'); if (pvView) pvView.style.display = 'flex';
  
  const chatId = [S.user.uid, uid].sort().join('_');
  if (S.pvListener) { S.pvListener(); }
  S.pvListener = db.ref('private_chats/' + chatId).on('value', function(snap) {
    const msgs = snap.val();
    const c = $('pv-chat-messages'); if (!c) return;
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px">👋 Diga olá!</div>'; return; }
    c.innerHTML = Object.entries(msgs).sort(function(a,b) { return (a[1].createdAt||0)-(b[1].createdAt||0); }).map(function(e) {
      const m = e[1]; const isMe = m.autorId === S.user?.uid;
      return '<div style="display:flex;flex-direction:' + (isMe ? 'row-reverse' : 'row') + ';gap:8px;margin-bottom:8px">' +
        '<div style="max-width:75%;padding:10px 14px;border-radius:' + (isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px') + ';background:' + (isMe ? '#10B981' : 'var(--input-bg)') + ';color:' + (isMe ? 'white' : 'var(--text)') + ';font-size:14px">' + esc(m.texto) + '</div></div>';
    }).join('');
    c.scrollTop = c.scrollHeight;
  });
}

function closePV() { if (S.pvListener) { S.pvListener(); S.pvListener = null; } S.pvUser = null; const pvView = $('pv-chat-view'); if (pvView) pvView.style.display = 'none'; if (S.room) { const roomView = $('chat-room-view'); if (roomView) roomView.style.display = 'flex'; } else { const noRoom = $('chat-no-room'); if (noRoom) noRoom.style.display = 'flex'; } }

async function sendChatMsg() {
  const t = ($('chat-msg-input')?.value || '').trim();
  if (!t || !S.room) return;
  await db.ref('chat_messages/' + S.room).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  if ($('chat-msg-input')) $('chat-msg-input').value = '';
}

async function sendChatImage() {
  const input = $('chat-image-input');
  if (!input || !input.files || !input.files[0] || !S.room) return;
  toast('⏳ Enviando imagem...', 'info');
  const url = await uploadImage(input.files[0]);
  if (!url) return toast('Erro ao enviar', 'error');
  await db.ref('chat_messages/' + S.room).push({ texto: '📷 Imagem', imagem: url, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  input.value = '';
}

async function sendPvChatMsg() {
  const t = ($('pv-chat-input')?.value || '').trim();
  if (!t || !S.pvUser) return;
  const chatId = [S.user.uid, S.pvUser].sort().join('_');
  await db.ref('private_chats/' + chatId).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  await db.ref('notificacoes/' + S.pvUser).push({ mensagem: '💬 @' + S.ud.username + ' te enviou uma mensagem!', tipo: 'message', lida: false, createdAt: Date.now() });
  if ($('pv-chat-input')) $('pv-chat-input').value = '';
}

async function sendPvChatImage() {
  const input = $('pv-image-input');
  if (!input || !input.files || !input.files[0] || !S.pvUser) return;
  toast('⏳ Enviando imagem...', 'info');
  const url = await uploadImage(input.files[0]);
  if (!url) return toast('Erro ao enviar', 'error');
  const chatId = [S.user.uid, S.pvUser].sort().join('_');
  await db.ref('private_chats/' + chatId).push({ texto: '📷 Imagem', imagem: url, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  input.value = '';
}

async function criarSala() {
  const n = ($('ns-nome')?.value || '').trim();
  if (!n) return toast('Nome obrigatório', 'error');
  const ref = await db.ref('chat_rooms').push({ nome: n, descricao: ($('ns-desc')?.value || '').trim(), criadorId: S.user.uid, createdAt: Date.now() });
  closeModal('sala');
  joinRoom(ref.key);
}

async function searchUsersToInvite() {
  const term = ($('invite-search')?.value || '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val(); if (!users) return;
  let arr = Object.entries(users).map(function(e) { return { id: e[0], ...e[1] }; }).filter(function(u) { return u.id !== S.user?.uid; });
  if (term) arr = arr.filter(function(u) { return (u.username || '').toLowerCase().includes(term); });
  const list = $('invite-users-list'); if (!list) return;
  list.innerHTML = arr.map(function(u) {
    return '<div onclick="toggleInviteUser(\'' + u.id + '\',this)" style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;border-radius:8px;background:' + (selectedInviteUsers.includes(u.id) ? 'var(--hover)' : 'transparent') + '">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">' + esc(u.username[0] || '?') + '</div>' +
      '<span style="flex:1;font-weight:600;font-size:13px">@' + esc(u.username) + '</span>' +
      '<span style="font-size:16px">' + (selectedInviteUsers.includes(u.id) ? '✅' : '○') + '</span></div>';
  }).join('');
}

function toggleInviteUser(uid, el) {
  const i = selectedInviteUsers.indexOf(uid);
  if (i > -1) { selectedInviteUsers.splice(i, 1); el.style.background = 'transparent'; }
  else { selectedInviteUsers.push(uid); el.style.background = 'var(--hover)'; }
  const sel = $('invite-selected'); if (sel) sel.textContent = selectedInviteUsers.length + ' selecionados';
}

async function sendInvites() {
  if (!selectedInviteUsers.length) return toast('Selecione alguém', 'info');
  if (!S.room) return toast('Entre em uma sala', 'error');
  const snap = await db.ref('chat_rooms/' + S.room).once('value');
  const roomName = snap.val()?.nome || 'Sala';
  for (const uid of selectedInviteUsers) {
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 @' + S.ud.username + ' te convidou para: ' + roomName, tipo: 'invite', lida: false, roomId: S.room, createdAt: Date.now() });
  }
  toast('Convites enviados! 📨', 'success');
  closeModal('invite');
  selectedInviteUsers = [];
}

// ========== RANKING ==========
function switchRanking(modo, btn) {
  rankingModo = modo;
  const ba = $('rank-btn-alunos'), bp = $('rank-btn-professores');
  if (ba) { ba.className = modo === 'alunos' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'; }
  if (bp) { bp.className = modo === 'professores' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'; }
  loadRanking();
}

function loadRanking() {
  db.ref('usuarios').on('value', function(snap) {
    const users = snap.val(); if (!users) return;
    let arr = Object.values(users).filter(function(u) { return !u.isAdmin; });
    if (rankingModo === 'professores') { arr = arr.filter(function(u) { return u.isProf; }); }
    else { arr = arr.filter(function(u) { return !u.isProf; }); }
    arr.sort(function(a,b) { return (b.points||0)-(a.points||0); });
    
    const rm = $('my-rank-mode'); if (rm) rm.textContent = rankingModo === 'professores' ? '(Professores)' : '(Alunos)';
    
    // Pódio
    const podio = $('podio'); if (podio) {
      podio.innerHTML = [
        renderPodiumPlace(2, arr[1]),
        renderPodiumPlace(1, arr[0]),
        renderPodiumPlace(3, arr[2])
      ].join('');
    }
    
    // Minha posição
    const isIn = (S.ud?.isProf && rankingModo === 'professores') || (!S.ud?.isProf && rankingModo === 'alunos');
    const pos = arr.findIndex(function(u) { return u.uid === S.user?.uid; });
    const mn = $('my-rank-num'); if (mn) mn.textContent = (pos >= 0 && isIn) ? '#' + (pos + 1) : '--';
    const mp = $('my-rank-pts'); if (mp) mp.textContent = isIn && pos >= 0 ? fmt(arr[pos]?.points || 0) + ' pts' : '-- pts';
    
    // Lista
    const lista = $('ranking-list');
    if (lista) {
      lista.innerHTML = arr.slice(0, 50).map(function(u, i) {
        return '<div class="card card-clickable" onclick="verPerfil(\'' + u.uid + '\')" style="display:flex;align-items:center;gap:10px;' + (u.uid === S.user?.uid ? 'background:var(--hover);border:2px solid #10B981' : '') + '">' +
          '<span style="font-weight:800;width:28px;text-align:center;font-size:' + (i < 3 ? '18' : '14') + 'px;color:' + (i < 3 ? '#10B981' : 'var(--text3)') + '">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:' + (u.isProf ? 'linear-gradient(135deg,#10B981,#3B82F6)' : '#10B981') + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')[0]) + '</div>' +
          '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">@' + esc(u.username || '?') + (u.isProf ? ' <span style="color:#10B981">✅</span>' : '') + '</div>' + (u.uid === S.user?.uid ? '<span style="background:#10B981;color:white;padding:1px 7px;border-radius:10px;font-size:10px">Você</span>' : '') + '</div>' +
          '<span style="font-weight:700;color:#10B981;font-size:14px">' + fmt(u.points || 0) + ' pts</span></div>';
      }).join('');
    }
  });
}

function renderPodiumPlace(pos, u) {
  if (!u) return '';
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const sizes = { 1: 70, 2: 58, 3: 55 };
  const sz = sizes[pos];
  return '<div style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;' + (pos === 2 ? 'order:-1' : '') + '">' +
    (pos === 1 ? '<div style="font-size:22px;margin-bottom:4px">👑</div>' : '') +
    '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;background:' + colors[pos] + ';display:flex;align-items:center;justify-content:center;font-size:' + (pos === 1 ? 30 : 24) + 'px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer;overflow:hidden" onclick="verPerfil(\'' + u.uid + '\')">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')) + '</div>' +
    '<div style="font-weight:700;font-size:12px;margin-top:6px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@' + esc((u.username || '').split(' ')[0]) + '</div>' +
    '<div style="color:#10B981;font-weight:700;font-size:13px">' + fmt(u.points || 0) + '</div>' +
    '<div style="font-size:' + (pos === 1 ? 20 : 16) + 'px;font-weight:800;color:var(--text3)">' + pos + '°</div></div>';
}

// ========== PERFIL ==========
async function loadPerfil() {
  if (!S.ud || !S.user) return;
  viewingUserId = null;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();
  
  const pp = $('pstat-pts'); if (pp) pp.textContent = fmt(S.ud.points || 0);
  const pq = $('pstat-quizzes'); if (pq) pq.textContent = S.ud.quizzesPlayed || 0;
  const pm = $('pstat-materias'); if (pm) pm.textContent = S.ud.materiasCreated || 0;
  const ps = $('pstat-seguidores'); if (ps) ps.textContent = S.ud.seguidores || 0;
  
  const segSnap = await db.ref('seguindo/' + S.user.uid).once('value');
  const seguSnap = await db.ref('seguidores/' + S.user.uid).once('value');
  const cs = $('count-seguidores'); if (cs) cs.textContent = segSnap.val() ? Object.keys(segSnap.val()).length : 0;
  const cg = $('count-seguindo'); if (cg) cg.textContent = seguSnap.val() ? Object.keys(seguSnap.val()).length : 0;
  
  // Badges
  const badges = [];
  BADGES.forEach(function(b) { if (b.cond(S.ud)) badges.push('<span class="badge green">' + b.nome + '</span>'); });
  const be = $('perfil-badges'); if (be) be.innerHTML = badges.join('') || '<span class="badge">🌱 Novato</span>';
  
  // Campos edição
  const eu = $('edit-username'); if (eu) eu.value = S.ud.username || '';
  const eb = $('edit-bio'); if (eb) eb.value = S.ud.bio || '';
  
  // Histórico
  const hs = await db.ref('historico/' + S.user.uid).once('value');
  const h = hs.val();
  const he = $('perfil-historico');
  if (he) {
    he.innerHTML = h ? Object.entries(h).sort(function(a,b) { return (b[1].createdAt||0)-(a[1].createdAt||0); }).slice(0,10).map(function(e) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600;font-size:14px">🎮 ' + esc(e[1].quizNome || 'Quiz') + '</div><div style="font-size:11px;color:var(--text3)">' + e[1].acertos + '/' + e[1].total + ' · ' + (e[1].pct || 0) + '% · ' + ago(e[1].createdAt) + '</div></div><span style="color:#10B981;font-weight:700">+' + fmt(e[1].score) + '</span></div>';
    }).join('') : '<div style="color:var(--text3);padding:10px;text-align:center">Nenhum quiz</div>';
  }
}

async function saveProfile() {
  const username = ($('edit-username')?.value || '').trim().toLowerCase().replace('@','');
  const bio = ($('edit-bio')?.value || '').trim();
  const updates = {};
  let changed = false;
  
  if (username && username !== S.ud.username) {
    if (username.length < 3) return toast('Mín. 3 caracteres', 'error');
    if (!/^[a-z0-9._]+$/.test(username)) return toast('Apenas minúsculas, números, . e _', 'error');
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    if (snap.val()) { const other = Object.keys(snap.val())[0]; if (other !== S.user.uid) return toast('@' + username + ' já está em uso!', 'error'); }
    updates.username = username; changed = true;
  }
  if (bio !== (S.ud.bio || '')) { updates.bio = bio; changed = true; }
  if (!changed) return toast('Nada para salvar', 'info');
  
  await db.ref('usuarios/' + S.user.uid).update(updates);
  if (updates.username) S.ud.username = updates.username;
  if ('bio' in updates) S.ud.bio = updates.bio;
  updateUI();
  toast('Perfil salvo! ✅', 'success');
}

// ========== PERFIL FULLSCREEN ==========
async function verPerfil(uid) {
  if (!uid) return;
  if (uid === S.user?.uid) { navigate('perfil'); return; }
  viewingUserId = uid;
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val(); if (!u) return toast('Não encontrado', 'error');
  
  const fSnap = await db.ref('seguidores/' + S.user.uid + '/' + uid).once('value');
  const isFollowing = !!fSnap.val();
  const segSnap = await db.ref('seguindo/' + uid).once('value');
  const segCount = segSnap.val() ? Object.keys(segSnap.val()).length : 0;
  const seguSnap = await db.ref('seguidores/' + uid).once('value');
  const seguCount = seguSnap.val() ? Object.keys(seguSnap.val()).length : 0;
  
  const badges = [];
  BADGES.forEach(function(b) { if (b.cond(u)) badges.push('<span class="badge green">' + b.nome + '</span>'); });
  
  const content = $('profile-fullscreen-content');
  if (content) {
    content.innerHTML = '<div style="background:linear-gradient(135deg,#10B981,#3B82F6);border-radius:20px;padding:30px 20px;text-align:center;color:white;margin-bottom:20px">' +
      '<div style="width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.2);color:white;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 12px;border:3px solid rgba(255,255,255,0.5);overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '🎓')) + '</div>' +
      '<h2 style="font-size:22px;margin-bottom:5px">' + esc(u.fullname || u.username || '?') + '</h2>' +
      '<p style="opacity:0.85;font-size:14px;margin-bottom:3px">@' + esc(u.username || '?') + '</p>' +
      '<p style="opacity:0.75;font-size:13px;margin-bottom:10px">' + esc(u.bio || 'Sem bio') + '</p>' +
      '<div>' + badges.join(' ') + '</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px">' +
        '<div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800;color:#10B981">' + fmt(u.points || 0) + '</div><div style="font-size:10px;color:var(--text3)">Pontos</div></div>' +
        '<div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">' + (u.quizzesPlayed || 0) + '</div><div style="font-size:10px;color:var(--text3)">Quizzes</div></div>' +
        '<div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">' + segCount + '</div><div style="font-size:10px;color:var(--text3)">Seguidores</div></div>' +
        '<div class="card" style="text-align:center"><div style="font-size:22px;font-weight:800">' + seguCount + '</div><div style="font-size:10px;color:var(--text3)">Seguindo</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-bottom:20px">' +
        '<button class="btn btn-full" id="btn-follow-profile" onclick="toggleFollowProfile(\'' + uid + '\')" style="background:' + (isFollowing ? '#10B981' : '#3B82F6') + ';color:white;flex:1">' + (isFollowing ? '✅ Seguindo' : '👥 Seguir') + '</button>' +
        '<button class="btn btn-primary btn-full" onclick="closeProfileFullscreen();setTimeout(function(){navigate(\'chat\');setTimeout(function(){openPV(\'' + uid + '\')},300)},100)" style="flex:1">💬 Mensagem</button>' +
      '</div>';
  }
  
  const fs = $('profile-fullscreen'); if (fs) { fs.style.display = 'block'; fs.scrollTop = 0; }
}

function closeProfileFullscreen() {
  const fs = $('profile-fullscreen'); if (fs) fs.style.display = 'none';
  viewingUserId = null;
}

async function toggleFollowProfile(uid) {
  const ref = db.ref('seguidores/' + S.user.uid + '/' + uid);
  const snap = await ref.once('value');
  const btn = $('btn-follow-profile');
  if (snap.val()) {
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + S.user.uid).remove();
    if (btn) { btn.textContent = '👥 Seguir'; btn.style.background = '#3B82F6'; }
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    await db.ref('usuarios/' + uid).update({ seguidores: (cSnap.val() || 0) + 1 });
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 @' + S.ud.username + ' te seguiu!', tipo: 'follow', lida: false, createdAt: Date.now() });
    if (btn) { btn.textContent = '✅ Seguindo'; btn.style.background = '#10B981'; }
  }
}

async function showFollowers() {
  const uid = viewingUserId || S.user?.uid; if (!uid) return;
  const snap = await db.ref('seguindo/' + uid).once('value');
  const data = snap.val();
  if (!data || !Object.keys(data).length) return alert('Nenhum seguidor');
  const names = [];
  for (const sid of Object.keys(data)) { const u = await db.ref('usuarios/' + sid + '/username').once('value'); if (u.val()) names.push('@' + u.val()); }
  alert('Seguidores:\n' + names.join('\n'));
}

async function showFollowing() {
  const uid = viewingUserId || S.user?.uid; if (!uid) return;
  const snap = await db.ref('seguidores/' + uid).once('value');
  const data = snap.val();
  if (!data || !Object.keys(data).length) return alert('Não segue ninguém');
  const names = [];
  for (const fid of Object.keys(data)) { const u = await db.ref('usuarios/' + fid + '/username').once('value'); if (u.val()) names.push('@' + u.val()); }
  alert('Seguindo:\n' + names.join('\n'));
}

async function uploadAvatar(input) {
  if (!input.files || !input.files[0]) return;
  toast('⏳ Enviando foto...', 'info');
  const url = await uploadImage(input.files[0]);
  if (!url) return toast('Erro ao enviar', 'error');
  await db.ref('usuarios/' + S.user.uid).update({ avatar: url });
  S.ud.avatar = url;
  updateUI();
  toast('Foto atualizada! 📷', 'success');
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs() {
  if (!S.user) return;
  db.ref('notificacoes/' + S.user.uid).on('value', function(snap) {
    const n = snap.val();
    const badge = $('notif-badge'); if (!badge) return;
    if (!n) { badge.style.display = 'none'; return; }
    const unread = Object.values(n).filter(function(x) { return !x.lida; }).length;
    if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  });
}

async function loadNotifs() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = snap.val();
  const list = $('notificacoes-list'); if (!list) return;
  if (!n) { list.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center">🔔 Nenhuma notificação</div>'; return; }
  list.innerHTML = Object.entries(n).reverse().map(function(e) {
    return '<div class="card ' + (e[1].lida ? '' : 'unread') + '" onclick="' + (e[1].roomId ? "navigate('chat');joinRoom('" + e[1].roomId + "')" : '') + '" style="cursor:' + (e[1].roomId ? 'pointer' : 'default') + ';margin-bottom:8px;' + (e[1].lida ? '' : 'border-left:3px solid #10B981') + '">' +
      '<div style="font-size:14px">' + esc(e[1].mensagem) + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:4px">' + ago(e[1].createdAt) + '</div></div>';
  }).join('');
  const updates = {};
  Object.entries(n).forEach(function(e) { if (!e[1].lida) updates[e[0] + '/lida'] = true; });
  if (Object.keys(updates).length) await db.ref('notificacoes/' + S.user.uid).update(updates);
}

async function marcarLidas() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).once('value');
  const n = snap.val(); if (!n) return;
  const updates = {};
  Object.keys(n).forEach(function(id) { updates[id + '/lida'] = true; });
  await db.ref('notificacoes/' + S.user.uid).update(updates);
  toast('Todas lidas ✓', 'info');
}

// ========== PONTOS ==========
async function addPts(pts) {
  if (!S.user || !pts) return;
  const multiplier = S.ud?.isProf ? 2 : 1;
  const total = pts * multiplier;
  const curSnap = await db.ref('usuarios/' + S.user.uid + '/points').once('value');
  const cur = curSnap.val() || 0;
  await db.ref('usuarios/' + S.user.uid).update({ points: cur + total });
  if (S.ud) S.ud.points = cur + total;
  updateUI();
}

// ========== NEURINHO IA ==========
const neurinhoHistory = [];

async function sendNeurinhoMsg() {
  const input = $('neurinho-input'); const msg = input ? input.value.trim() : '';
  if (!msg) return;
  
  const div = $('neurinho-messages'); if (!div) return;
  div.innerHTML += '<div style="text-align:right;margin-bottom:10px"><div style="display:inline-block;max-width:80%;padding:10px 14px;border-radius:18px;background:#10B981;color:white;font-size:14px">' + esc(msg) + '</div></div>';
  if (input) input.value = '';
  div.scrollTop = div.scrollHeight;
  
  const typingId = 'ntyping-' + Date.now();
  div.innerHTML += '<div id="' + typingId + '" style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:center;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px"><img src="https://i.ibb.co/neurinho-logo.png" style="width:24px;height:24px;border-radius:50%" /> 🧠 Pensando...</div></div>';
  div.scrollTop = div.scrollHeight;
  
  neurinhoHistory.push({ role: 'user', content: msg });
  if (neurinhoHistory.length > 20) neurinhoHistory.shift();
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'system', content: 'Você é o Neurinho 🧠, assistente de estudos amigável do Sexta-Feira Studies. Você é um cérebro falante que ajuda alunos. Use português brasileiro, emojis e seja animado! Responda sempre em português.' }, ...neurinhoHistory],
        max_tokens: 500, temperature: 0.7
      })
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não entendi! 😅';
    
    const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
    div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:flex-start;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px;line-height:1.5"><img src="https://i.ibb.co/neurinho-logo.png" style="width:28px;height:28px;border-radius:50%;margin-top:2px" /><span>' + esc(reply) + '</span></div></div>';
    neurinhoHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
    div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:center;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:#FEE2E2;color:#991B1B;font-size:14px"><img src="https://i.ibb.co/neurinho-logo.png" style="width:24px;height:24px;border-radius:50%" /> 🧠❌ Ops! Meu cérebro deu um nó! Tente de novo em instantes...</div></div>';
  }
  div.scrollTop = div.scrollHeight;
}

// ========== IMGBB UPLOAD ==========
async function uploadImage(file) {
  const base64 = await fileToBase64(file);
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64.split(',')[1]);
  try {
    const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
    const data = await response.json();
    return data.success ? data.data.url : null;
  } catch(e) { return null; }
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function(e) { reject(e); };
    reader.readAsDataURL(file);
  });
}

// ========== ADM ==========
async function loadAdm() {
  if (!S.ud || !(S.ud.adminLevel >= 1)) return toast('Acesso negado', 'error');
  const us = await db.ref('usuarios').once('value');
  const ps = await db.ref('posts').once('value');
  const au = $('adm-users'); if (au) au.textContent = us.val() ? Object.keys(us.val()).length : 0;
  const ap = $('adm-posts'); if (ap) ap.textContent = ps.val() ? Object.keys(ps.val()).length : 0;
  admLoad('materias');
}

async function admLoad(tab) {
  const c = $('adm-content-list'); if (!c) return;
  if (tab === 'materias') {
    const s = await db.ref('materias').once('value'); const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(function(e) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><span>' + (e[1].icone || '📚') + ' ' + esc(e[1].nome) + '</span><button class="btn btn-danger btn-sm" onclick="admDel(\'materias\',\'' + e[0] + '\')">🗑</button></div>';
    }).join('') : 'Nenhuma';
  } else if (tab === 'posts') {
    const s = await db.ref('posts').once('value'); const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(function(e) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px">@' + esc(e[1].autorNome) + ': ' + esc((e[1].texto || '').substring(0,40)) + '</span><button class="btn btn-danger btn-sm" onclick="admDel(\'posts\',\'' + e[0] + '\')">🗑</button></div>';
    }).join('') : 'Nenhum';
  } else if (tab === 'usuarios') {
    const s = await db.ref('usuarios').once('value'); const d = s.val();
    c.innerHTML = d ? Object.values(d).map(function(u) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:13px">@' + esc(u.username) + ' · ' + fmt(u.points) + ' pts</span>' +
        '<div style="display:flex;gap:5px">' +
          (S.ud.adminLevel >= 3 ? '<button class="btn btn-sm" onclick="admToggleQuizzer(\'' + u.uid + '\')" style="background:' + (u.isQuizzer ? '#FEF3C7' : 'var(--border)') + ';color:var(--text);box-shadow:none;font-size:11px">' + (u.isQuizzer ? '🎮 Quizzer' : 'Tornar Quizzer') + '</button>' : '') +
          (S.ud.adminLevel >= 2 ? '<button class="btn btn-sm" onclick="admToggleProf(\'' + u.uid + '\')" style="background:' + (u.isProf ? '#D1FAE5' : 'var(--border)') + ';color:var(--text);box-shadow:none;font-size:11px">' + (u.isProf ? '✅ Prof' : 'Tornar Prof') + '</button>' : '') +
          '<button class="btn btn-danger btn-sm" onclick="admDelUser(\'' + u.uid + '\')">🗑</button>' +
        '</div></div>';
    }).join('') : 'Nenhum';
  }
}

async function admDel(path, id) { if (!confirm('Excluir?')) return; await db.ref(path + '/' + id).remove(); admLoad('materias'); toast('Excluído', 'info'); }
async function admDelUser(uid) { if (!confirm('Excluir usuário?')) return; await db.ref('usuarios/' + uid).remove(); admLoad('usuarios'); toast('Excluído', 'info'); }

async function admAddPts() {
  const el = $('adm-add-pts'); const pts = parseInt(el ? el.value : '0');
  if (!pts || pts <= 0) return toast('Valor inválido', 'error');
  await addPts(pts);
  if (el) el.value = '';
  toast('+' + fmt(pts) + ' pontos!', 'success');
}

async function admToggleProf(uid) {
  if (S.ud.adminLevel < 2) return toast('Sem permissão', 'error');
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val(); if (!u) return;
  await db.ref('usuarios/' + uid).update({ isProf: !u.isProf });
  toast(u.isProf ? '❌ Professor removido' : '✅ Agora é Professor!', 'success');
  admLoad('usuarios');
}

async function admToggleQuizzer(uid) {
  if (S.ud.adminLevel < 3) return toast('Sem permissão (nível 3+)', 'error');
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val(); if (!u) return;
  await db.ref('usuarios/' + uid).update({ isQuizzer: !u.isQuizzer });
  toast(u.isQuizzer ? '❌ Quizzer removido' : '🎮 Agora é Quizzer!', 'success');
  admLoad('usuarios');
}

async function ativarTodasBadges() {
  const senha = prompt('Senha secreta:');
  if (senha !== 'sextafeira') return toast('Senha incorreta!', 'error');
  const dados = { materiasCreated: 100, topicosCreated: 100, topicosLidos: 200, comentarios: 200, quizzesPlayed: 600, quizzesCreated: 200, quizPerfeito: 50, quizRapido: 50, quizAltaNota: 200, postsDuvida: 50, postsDica: 50, totalPosts: 200, maxLikes: 100, seguidores: 600, seguindo: 100, msgsChat: 2000, salasCriadas: 10, convitesEnviados: 100, pvCount: 100, verificados: 20, neurinhoMsgs: 200, rankPosition: 1, isProf: true, points: 99999999999999999999999999 };
  await db.ref('usuarios/' + S.user.uid).update(dados);
  Object.assign(S.ud, dados);
  updateUI();
  toast('🏅 TODAS AS BADGES ATIVADAS! Recarregue (F5)!', 'success');
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { document.querySelectorAll('.modal.show').forEach(function(m) { m.classList.remove('show'); }); } });

console.log('✅ Sexta-Feira Studies PRONTO!');
