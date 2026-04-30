'use strict';

// ========== CONFIG ==========
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

// ========== IMG LINKS ==========
const IMG = {
  logo: 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png',
  favicon: 'https://i.ibb.co/4nVtZpr2/Gemini-Generated-Image-vrc8thvrc8thvrc8.png',
  jarvis: 'https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png',
  seloVerificado: 'https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png',
  seloAdmin: 'https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png',
  seloPremium: 'https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png',
  seloProfessor: 'https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png',
  seloQuizzer: 'https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png',
  seloProfAula: 'https://i.ibb.co/tpCKGKxs/Gemini-Generated-Image-id0q3hid0q3hid0q.png',
  seloProfQuiz: 'https://i.ibb.co/tpCKGKxs/Gemini-Generated-Image-id0q3hid0q3hid0q.png',
  seloDica: 'https://i.ibb.co/tpCKGKxs/Gemini-Generated-Image-id0q3hid0q3hid0q.png',
  bannerSobre: 'https://i.ibb.co/fGqcL491/Gemini-Generated-Image-p9v6akp9v6akp9v6.png',
  iconeUpdate: 'https://i.ibb.co/PGzmcBmJ/Gemini-Generated-Image-u7ba35u7ba35u7ba.png',
  iconeDesafios: 'https://i.ibb.co/bjfhVJdq/Gemini-Generated-Image-4iw50v4iw50v4iw5.png',
  thumbPdf: 'https://i.ibb.co/5hSygf1c/a-clean-modern-icon-design-featuring-a-w-q0jdpg8-YTt2f-Hx-AB9n-HYJQ-k-D1y-Nb-J9-S1mi-Wiuy-PB-N9w-sd.jpg',
  iconeUpload: 'https://i.ibb.co/WNVyZhqc/Gemini-Generated-Image-c2mj8rc2mj8rc2mj.png',
  placeholderVideo: 'https://i.ibb.co/R4S25MLb/a-minimalist-video-placeholder-graphic-f-po-VW-34-So-GZi-R1-Jv-BJtq-Q-we-OQ6-QOs-Sw-WKo-FSe-T81-HHA-sd.jpg',
  iconeRanking: 'https://i.ibb.co/7Jwtbscy/a-modern-minimalist-icon-design-featurin-r-Yn-Y3-TVGSBKfajl-Sk-MYp-Sg-im17-Qrt-XQbmk-LFWWnc-QHLQ-sd.jpg',
  iconeTarefas: 'https://i.ibb.co/pB3yvfp3/image.png',
  iconeViews: 'https://i.ibb.co/gM7qmW8N/a-small-40x40-pixel-icon-featuring-a-sty-a-RQDe-K8u-Qou-OYMXLa-TFmhw-VS-z-FS4-SRn-W1-Ru2-H6-Vm-FKw-sd.jpg'
};

// ========== API KEYS ==========
const IMGBB_API_KEY = '86427cccd2a94fb42a0754ffd7f19e79';
const GROQ_API_KEY = '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';
const GEMINI_API_KEY = 'AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY';
// ========== STATE ==========
const S = {
  user: null, ud: null, mid: null, aid: null,
  room: null, roomListener: null, pvUser: null, pvListener: null,
  mFilter: 'all', fFilter: 'all', pType: 'post',
  perfilTab: 'aulas',
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
      uploadsHoje: 0, uploadsData: '', jarvisMsgsHoje: 0, jarvisData: '',
      quizzesPlayed: 0, materiasCreated: 0, aulasCreated: 0, comentarios: 0,
      seguidores: 0, seguindo: 0, msgsChat: 0, salasCriadas: 0,
      convitesEnviados: 0, pvCount: 0, quizPerfeito: 0, quizAltaNota: 0,
      jarvisMsgs: 0, rankPosition: 0, createdAt: Date.now()
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
    uploadsHoje: 0, uploadsData: '', jarvisMsgsHoje: 0, jarvisData: '',
    quizzesPlayed: 0, materiasCreated: 0, aulasCreated: 0, comentarios: 0,
    seguidores: 0, seguindo: 0, msgsChat: 0, salasCriadas: 0,
    convitesEnviados: 0, pvCount: 0, quizPerfeito: 0, quizAltaNota: 0,
    jarvisMsgs: 0, rankPosition: 0, createdAt: Date.now()
  });
  
  $('modal-username').classList.remove('show');
  $('new-username-input').value = '';
  googleUserTemp = null;
  
  S.user = auth.currentUser;
  const snap2 = await db.ref('usuarios/' + S.user.uid).once('value');
  S.ud = snap2.val();
  
  $('auth-screen').style.display = 'none';
  $('app').style.display = '';
  $('site-footer').style.display = '';
  updateUI();
  navigate('home');
  if (S.ud.adminLevel >= 1) { const nav = $('nav-adm'); if (nav) nav.style.display = ''; }
  listenNotifs();
  
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
    
    if (!S.ud.username) {
      googleUserTemp = user;
      $('auth-screen').style.display = 'none';
      $('app').style.display = 'none';
      $('modal-username').classList.add('show');
      return;
    }
    
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    $('site-footer').style.display = '';
    updateUI();
    navigate('home');
    if (S.ud.adminLevel >= 1) { const nav = $('nav-adm'); if (nav) nav.style.display = ''; }
    listenNotifs();
  } else {
    S.user = null; S.ud = null;
    $('app').style.display = 'none';
    $('site-footer').style.display = 'none';
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
  
  const avatarEls = ['sidebar-avatar', 'topbar-avatar', 'pc-avatar', 'perfil-avatar'];
  avatarEls.forEach(function(id) {
    const el = $(id); if (!el) return;
    if (av.startsWith('http')) { el.innerHTML = '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />'; }
    else { el.innerHTML = av; }
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
  else if (name === 'desafios') loadDesafios();
  else if (name === 'chat') loadChat();
  else if (name === 'perfil') loadPerfil();
  else if (name === 'notificacoes') loadNotifs();
  else if (name === 'adm') loadAdm();
  else if (name === 'sobre') loadSobre();
  else if (name === 'updates') loadUpdates();
  else if (name === 'tarefas') loadTarefas();
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

// ========== SISTEMA DE VIEWS ==========
async function addView(path) {
  if (!S.user) return;
  const ref = db.ref(path + '/views');
  const snap = await ref.once('value');
  const views = snap.val() || {};
  if (!views[S.user.uid]) {
    views[S.user.uid] = Date.now();
    await ref.set(views);
  }
}

async function getViewCount(path) {
  const snap = await db.ref(path + '/views').once('value');
  const views = snap.val() || {};
  return Object.keys(views).length;
}

// ========== HOME ==========
async function loadHome() {
  if (!S.ud || !S.user) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();

  const pts = S.ud.points || 0;
  const levels = [0, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000, 100000000000, 1000000000000, 10000000000000, 100000000000000, 1000000000000000, 10000000000000000, 100000000000000000, 1000000000000000000, 10000000000000000000, 100000000000000000000];
  const names = ['🌱 Brotinho','📖 Leitor','✍️ Anotador','🧠 Pensador','🎯 Focado','💡 Iluminado','🔥 Motivado','⚡ Rápido','🦉 Sábio','🏅 Dedicado','⭐ Estrela','🌟 Brilhante','💎 Raro','👑 Elite','🐉 Lendário','🌌 Cósmico','🔮 Místico','🎓 Mestre','🧙 Sábio Supremo','🚀 Transcendente','👻 Fantasma','🎪 Quântico','🌀 Dimensional','👁️ Onisciente','🌠 Astral','🎇 Universal','💫 Galáctico'];
  
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

  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value', async function(snap) {
    const posts = snap.val();
    const c = $('home-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>'; return; }
    const arr = Object.entries(posts).map(function(e) { return { id: e[0], ...e[1] }; }).reverse();
    let html = '';
    for (const p of arr) {
      const views = await getViewCount('posts/' + p.id);
      html += feedCardHTML(p, true, views);
    }
    c.innerHTML = html;
  });
}

function feedCardHTML(p, compact, views) {
  compact = compact || false;
  views = views || 0;
  const imgHTML = p.imagem ? '<img src="' + esc(p.imagem) + '" style="width:100%;max-height:250px;object-fit:cover;border-radius:10px;margin-top:8px" loading="lazy" />' : '';
  const likes = p.likes ? Object.keys(p.likes).length : 0;
  const liked = p.likes && p.likes[S.user?.uid];
  const isOwner = p.autorId === S.user?.uid;
  const canDelete = isOwner || (S.ud?.adminLevel >= 1) || (S.ud?.isProf);

  // Selos
  let selosHTML = '';
  if (p.isProf) selosHTML += '<img src="' + IMG.seloProfAula + '" class="selo-img" title="Professor" />';
  if (p.tipo === 'dica') selosHTML += '<img src="' + IMG.seloDica + '" class="selo-img" title="Dica Oficial" />';

  return '<div class="card" style="margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
      '<div onclick="verPerfil(\'' + esc(p.autorId) + '\')" style="width:36px;height:36px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;cursor:pointer;flex-shrink:0;overflow:hidden">' + (p.avatar && p.avatar.startsWith('http') ? '<img src="' + esc(p.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(p.avatar || '?')) + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:14px">' + esc(p.autorNome || '?') + selosHTML + '</div>' +
        '<div style="color:var(--text3);font-size:11px">' + ago(p.createdAt) + ' · <span class="view-count"><img src="' + IMG.iconeViews + '" style="width:12px;height:12px" /> ' + views + '</span></div>' +
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

// ========== DISCIPLINAS ==========
let materiasListener = null;

function loadMaterias() {
  if (materiasListener) { db.ref('materias').off('value', materiasListener); }
  materiasListener = db.ref('materias').on('value', function(snap) {
    const mat = snap.val();
    const c = $('materias-grid'); if (!c) return;
    if (!mat) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📚 Nenhuma disciplina ainda</div>'; return; }
    let arr = Object.entries(mat).map(function(e) { return { id: e[0], ...e[1] }; });
    if (S.mFilter === 'mine') arr = arr.filter(function(m) { return m.autorId === S.user?.uid; });
    const s = ($('search-materias')?.value || '').toLowerCase();
    if (s) arr = arr.filter(function(m) { return (m.nome || '').toLowerCase().includes(s); });
    arr.sort(function(a,b) { return (b.createdAt||0)-(a.createdAt||0); });
    if (!arr.length) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">🔍 Nenhuma encontrada</div>'; return; }
    c.innerHTML = arr.map(function(m) {
      const seloProf = m.isProf ? '<img src="' + IMG.seloProfessor + '" class="selo-img" style="width:20px;height:20px" />' : '';
      return '<div class="card card-clickable" onclick="openMateria(\'' + m.id + '\')" style="display:flex;gap:12px;align-items:center">' +
        '<span style="font-size:35px;flex-shrink:0">' + (m.icone || '📚') + '</span>' +
        '<div style="min-width:0"><div style="font-weight:700;font-size:15px">' + esc(m.nome) + seloProf + '</div>' +
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
  await db.ref('materias').push({ nome: n, descricao: d, icone: '📚', autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud.isProf || false, aulasCount: 0, createdAt: Date.now() });
  closeModal('materia');
  if ($('nm-nome')) $('nm-nome').value = '';
  if ($('nm-desc')) $('nm-desc').value = '';
  await addPts(20);
  toast('Disciplina criada! 📚', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val(); if (!m) { toast('Disciplina não encontrada', 'error'); return; }
  const icon = $('materia-hero-icon'); if (icon) icon.textContent = m.icone || '📚';
  const nome = $('materia-hero-nome'); if (nome) nome.textContent = m.nome;
  const desc = $('materia-hero-desc'); if (desc) desc.textContent = m.descricao || '';
  const autor = $('materia-hero-autor'); if (autor) autor.innerHTML = 'Por: @' + esc(m.autorNome || '?') + (m.isProf ? ' <img src="' + IMG.seloProfessor + '" style="width:16px;height:16px;vertical-align:middle" />' : '');
  navigate('materia-detalhe');
  addView('materias/' + id);

  // Aulas
  db.ref('aulas/' + id).on('value', async function(snap) {
    const t = snap.val();
    const c = $('aulas-list'); if (!c) return;
    if (!t) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">📝 Nenhuma aula</div>'; return; }
    let html = '';
    for (const [aid, a] of Object.entries(t)) {
      const views = await getViewCount('aulas/' + id + '/' + aid);
      html += '<div class="card card-clickable" onclick="openAula(\'' + id + '\',\'' + aid + '\')" style="display:flex;align-items:center;gap:10px">' +
        (a.verificado ? '<img src="' + IMG.seloVerificado + '" style="width:20px;height:20px;flex-shrink:0" />' : '<span style="font-size:20px">📄</span>') +
        '<div style="flex:1"><div style="font-weight:600">' + esc(a.titulo) + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">Por @' + esc(a.autorNome || '?') + (a.isProf ? ' <img src="' + IMG.seloProfAula + '" style="width:12px;height:12px;vertical-align:middle" />' : '') + ' · ' + ago(a.createdAt) + ' · <span class="view-count"><img src="' + IMG.iconeViews + '" style="width:10px;height:10px" /> ' + views + '</span></div></div>' +
      '</div>';
    }
    c.innerHTML = html;
  });

 // Vídeos
db.ref('videos/' + id).on('value', function(snap) {
  const v = snap.val();
  const c = $('videos-materia'); if (!c) return;
  if (!v) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">🎬 Nenhum vídeo</div>'; return; }
  c.innerHTML = Object.entries(v).map(function(e) {
    const vid = e[1];
    const youtubeId = vid.url ? vid.url.split('/embed/')[1] || vid.url.split('v=')[1]?.split('&')[0] : null;
    const thumbUrl = youtubeId ? 'https://img.youtube.com/vi/' + youtubeId + '/hqdefault.jpg' : 'https://i.ibb.co/R4S25MLb/a-minimalist-video-placeholder-graphic-f-po-VW-34-So-GZi-R1-Jv-BJtq-Q-we-OQ6-QOs-Sw-WKo-FSe-T81-HHA-sd.jpg';
    
    return '<div class="video-card" onclick="abrirVideo(\'' + esc(vid.url || vid.videoUrl) + '\')">' +
      '<div class="video-card-thumb">' +
        '<img src="' + thumbUrl + '" alt="' + esc(vid.titulo) + '" />' +
        '<div class="video-play-icon">▶</div>' +
      '</div>' +
      '<div style="font-weight:700;font-size:14px">🎬 ' + esc(vid.titulo || 'Vídeo') + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:4px">Por @' + esc(vid.autorNome || '?') + '</div>' +
    '</div>';
  }).join('');
});
  
  // Quizzes
  db.ref('quizzes/' + id).on('value', async function(snap) {
    const q = snap.val();
    const c = $('quizzes-materia'); if (!c) return;
    if (!q) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">🎮 Nenhum quiz</div>'; return; }
    let html = '';
    for (const [qid, quiz] of Object.entries(q)) {
      const views = await getViewCount('quizzes/' + id + '/' + qid);
      html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center">' +
        '<div><strong>🎮 ' + esc(quiz.nome) + '</strong>' + (quiz.oficial ? ' <img src="' + IMG.seloVerificado + '" style="width:14px;height:14px;vertical-align:middle" />' : '') +
        (quiz.isProf ? ' <img src="' + IMG.seloProfQuiz + '" style="width:14px;height:14px;vertical-align:middle" />' : '') +
        '<br><span style="font-size:12px;color:var(--text3)">' + (quiz.questoes?.length || 0) + ' questões · <span class="view-count"><img src="' + IMG.iconeViews + '" style="width:10px;height:10px" /> ' + views + '</span></span></div>' +
        '<button class="btn btn-primary btn-sm" onclick="startQuiz(\'' + id + '\',\'' + qid + '\')">▶ Jogar</button>' +
      '</div>';
    }
    c.innerHTML = html;
  });
}

// ========== AULAS ==========
async function criarAula() {
  const t = ($('nt-titulo')?.value || '').trim();
  const c = ($('nt-conteudo')?.value || '').trim();
  if (!t || !c) { toast('Preencha tudo', 'error'); return; }
  if (!S.mid) { toast('Selecione uma disciplina', 'error'); return; }
  await db.ref('aulas/' + S.mid).push({ titulo: t, conteudo: c, autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud.isProf || false, verificado: false, createdAt: Date.now(), views: {} });
  closeModal('aula');
  if ($('nt-titulo')) $('nt-titulo').value = '';
  if ($('nt-conteudo')) $('nt-conteudo').value = '';
  await addPts(15);
  toast('Aula criada! 📝', 'success');
}

async function openAula(mid, aid) {
  S.mid = mid;
  S.aid = aid;
  const snap = await db.ref('aulas/' + mid + '/' + aid).once('value');
  const t = snap.val(); if (!t) { toast('Aula não encontrada', 'error'); return; }
  addView('aulas/' + mid + '/' + aid);
  const title = $('aula-title'); if (title) title.innerHTML = esc(t.titulo) + (t.verificado ? ' <img src="' + IMG.seloVerificado + '" style="width:18px;height:18px;vertical-align:middle" />' : '');
  const meta = $('aula-meta');
  if (meta) {
    meta.innerHTML = 'Por <strong>@' + esc(t.autorNome || '?') + '</strong>' + (t.isProf ? ' <img src="' + IMG.seloProfAula + '" style="width:14px;height:14px;vertical-align:middle" />' : '') + ' · ' + ago(t.createdAt);
    if (S.ud?.isProf && !t.verificado) {
      meta.innerHTML += ' <button class="btn btn-primary btn-sm" onclick="verificarAula(\'' + aid + '\')" style="font-size:10px;padding:3px 8px;margin-left:8px">✅ Verificar</button>';
    }
  }
  const body = $('aula-body'); if (body) body.textContent = t.conteudo;
  navigate('aula-detalhe');

  db.ref('comentarios/' + mid + '/' + aid).on('value', function(snap) {
    const coms = snap.val();
    const c = $('aula-comentarios'); if (!c) return;
    if (!coms) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">💬 Seja o primeiro!</div>'; return; }
    const arr = Object.entries(coms).map(function(e) { return { id: e[0], ...e[1] }; }).sort(function(a,b) { return (a.createdAt||0)-(b.createdAt||0); });
    arr.sort(function(a,b) { if (a.isProf && !b.isProf) return -1; if (!a.isProf && b.isProf) return 1; return (a.createdAt||0)-(b.createdAt||0); });
    c.innerHTML = arr.map(function(com) {
      return '<div class="card" style="margin-bottom:8px;' + (com.isProf ? 'border-left:3px solid #10B981;background:var(--hover)' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:' + (com.isProf ? 'linear-gradient(135deg,#10B981,#3B82F6)' : '#10B981') + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;cursor:pointer" onclick="verPerfil(\'' + esc(com.autorId) + '\')">' + esc((com.autorNome || '?')[0].toUpperCase()) + '</div>' +
          '<div><span style="font-weight:700;font-size:13px">@' + esc(com.autorNome || '?') + '</span>' + (com.isProf ? ' <img src="' + IMG.seloProfAula + '" style="width:12px;height:12px;vertical-align:middle" />' : '') + ' <span style="color:var(--text3);font-size:11px">' + ago(com.createdAt) + '</span></div>' +
        '</div>' +
        '<div style="font-size:14px;line-height:1.5;padding-left:36px">' + esc(com.texto) + '</div>' +
      '</div>';
    }).join('');
  });
}

async function verificarAula(aid) {
  if (!S.ud?.isProf) return toast('Só professores', 'error');
  await db.ref('aulas/' + S.mid + '/' + aid).update({ verificado: true, verificadoPor: S.ud.username, verificadoEm: Date.now() });
  toast('✅ Aula verificada!', 'success');
  openAula(S.mid, aid);
}

async function addComment() {
  const input = $('new-comment'); const t = input ? input.value.trim() : '';
  if (!t) return;
  await db.ref('comentarios/' + S.mid + '/' + S.aid).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud?.isProf || false, createdAt: Date.now() });
  if (input) input.value = '';
  await addPts(S.ud?.isProf ? 6 : 3);
}

// ========== VÍDEOS ==========
async function adicionarVideo() {
  const titulo = ($('nv-titulo')?.value || '').trim();
  const url = ($('nv-url')?.value || '').trim();
  if (!titulo) return toast('Título obrigatório', 'error');
  if (!url) return toast('Link obrigatório', 'error');
  
  let videoUrl = url;
  // Converte link do YouTube para embed
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    videoUrl = 'https://www.youtube.com/embed/' + videoId;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    videoUrl = 'https://www.youtube.com/embed/' + videoId;
  }
  
  await db.ref('videos/' + S.mid).push({
    titulo: titulo, url: videoUrl, autorId: S.user.uid, autorNome: S.ud.username,
    isProf: S.ud.isProf || false, createdAt: Date.now()
  });
  closeModal('video');
  if ($('nv-titulo')) $('nv-titulo').value = '';
  if ($('nv-url')) $('nv-url').value = '';
  await addPts(10);
  toast('Vídeo adicionado! 🎬', 'success');
}

// ========== QUIZ ==========
function addQuestaoNormal() {
  const idx = questoesNormais.length;
  questoesNormais.push({ pergunta: '', alternativas: ['', '', '', ''], correta: 0 });
  const div = document.createElement('div');
  div.style.cssText = 'background:var(--input-bg);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)';
  div.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>Questão ' + (idx + 1) + '</strong>' + (idx > 0 ? '<button onclick="removerQuestao(' + idx + ')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:16px">🗑</button>' : '') + '</div>' +
    '<input class="input-field" placeholder="Pergunta..." oninput="questoesNormais[' + idx + '].pergunta=this.value" style="margin-bottom:8px" />' +
    ['A','B','C','D'].map(function(l, i) {
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><input type="radio" name="qc' + idx + '" value="' + i + '" ' + (i === 0 ? 'checked' : '') + ' onchange="questoesNormais[' + idx + '].correta=' + i + '" /><span>' + l + '</span><input class="input-field" placeholder="Alternativa ' + l + '..." style="margin:0;flex:1" oninput="questoesNormais[' + idx + '].alternativas[' + i + ']=this.value" /></div>';
    }).join('');
  const container = $('qn-questoes-container'); if (container) container.appendChild(div);
}

function removerQuestao(idx) {
  questoesNormais.splice(idx, 1);
  const container = $('qn-questoes-container'); if (!container) return;
  container.innerHTML = '';
  questoesNormais.forEach(function() { addQuestaoNormal(); });
}

async function salvarQuizNormal() {
  const nome = ($('qn-nome')?.value || '').trim();
  const tempo = parseInt($('qn-tempo')?.value || '30') || 30;
  if (!nome) { toast('Nome obrigatório', 'error'); return; }
  if (!S.mid) { toast('Acesse uma disciplina primeiro', 'error'); return; }
  const validas = questoesNormais.filter(function(q) { return q.pergunta.trim() && q.alternativas.filter(function(a) { return a.trim(); }).length >= 2; });
  if (!validas.length) { toast('Adicione questões', 'error'); return; }
  await db.ref('quizzes/' + S.mid).push({ nome: nome, tempo: tempo, questoes: validas, autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud.isProf || false, oficial: (S.ud?.isQuizzer || S.ud?.adminLevel >= 3) ? true : false, nivel: 1, totalPlays: 0, createdAt: Date.now(), views: {} });
  closeModal('quiz-normal');
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function processarCmd() {
  const input = ($('cmd-input')?.value || '');
  if (!input.trim()) return toast('Digite os comandos', 'error');
  if (!S.mid) return toast('Acesse uma disciplina primeiro', 'error');
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
  
  await db.ref('quizzes/' + S.mid).push({ nome: nome, tempo: tempo, questoes: questoes, autorId: S.user.uid, autorNome: S.ud.username, isProf: S.ud.isProf || false, oficial: false, totalPlays: 0, createdAt: Date.now(), views: {} });
  closeModal('quiz-cmd');
  if ($('cmd-input')) $('cmd-input').value = '';
  await addPts(30);
  toast('Quiz criado! 🎮', 'success');
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val();
  if (!q || !q.questoes || !q.questoes.length) { toast('Quiz sem questões', 'error'); return; }
  addView('quizzes/' + mId + '/' + qId);
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
  db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value', async function(snap) {
    const posts = snap.val();
    const c = $('descobrir-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>'; return; }
    let arr = Object.entries(posts).map(function(e) { return { id: e[0], ...e[1] }; }).reverse();
    if (S.fFilter !== 'all') arr = arr.filter(function(p) { return p.tipo === S.fFilter; });
    arr.sort(function(a,b) { if (a.isProf && !b.isProf) return -1; if (!a.isProf && b.isProf) return 1; return (b.createdAt||0)-(a.createdAt||0); });
    let html = '';
    for (const p of arr) {
      const views = await getViewCount('posts/' + p.id);
      html += feedCardHTML(p, false, views);
    }
    c.innerHTML = html || '<div style="color:var(--text3);padding:15px;text-align:center">📭 Nenhum post</div>';
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
  
  const hoje = new Date().toDateString();
  if (S.ud.uploadsData !== hoje) { S.ud.uploadsHoje = 0; S.ud.uploadsData = hoje; }
  const limite = S.ud.plano === 'pro' ? 20 : S.ud.plano === 'premium' ? 10 : 5;
  if (imgInput && imgInput.files[0] && S.ud.uploadsHoje >= limite && S.ud.creditos < 1) {
    return toast('Limite de ' + limite + ' imagens/dia atingido!', 'error');
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
  
  const ref = await db.ref('posts').push({ texto: t, tipo: S.pType, imagem: imagemUrl, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, isProf: S.ud.isProf || false, likes: {}, views: {}, createdAt: Date.now() });
  // Adiciona view do próprio autor
  await db.ref('posts/' + ref.key + '/views/' + S.user.uid).set(Date.now());
  
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
  
  const ref = await db.ref('posts').push({ texto: t, tipo: tp, imagem: imagemUrl, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, isProf: S.ud.isProf || false, likes: {}, views: {}, createdAt: Date.now() });
  await db.ref('posts/' + ref.key + '/views/' + S.user.uid).set(Date.now());
  
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

// ========== BUSCAR USUÁRIOS ==========
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
    let selos = '';
    if (u.isAdmin) selos += '<img src="' + IMG.seloAdmin + '" class="selo-img" title="Admin" style="width:16px;height:16px" />';
    if (u.isProf) selos += '<img src="' + IMG.seloProfessor + '" class="selo-img" title="Professor" style="width:16px;height:16px" />';
    if (u.isQuizzer) selos += '<img src="' + IMG.seloQuizzer + '" class="selo-img" title="Quizzer" style="width:16px;height:16px" />';
    if (u.plano === 'premium' || u.plano === 'pro') selos += '<img src="' + IMG.seloPremium + '" class="selo-img" title="Premium" style="width:16px;height:16px" />';
    
    return '<div class="card card-clickable" onclick="' + (isMe ? "navigate('perfil')" : "verPerfil('" + u.id + "')") + '" style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0;overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')) + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">@' + esc(u.username || '?') + ' ' + selos + '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-top:2px">⭐ ' + fmt(u.points) + ' pts · 👥 ' + (u.seguidores || 0) + ' seguidores</div></div>' +
      (!isMe ? '<button class="btn btn-sm ' + (isFollowing ? 'btn-primary' : 'btn-outline') + '" onclick="event.stopPropagation();toggleFollowUser(\'' + u.id + '\',this)" style="flex-shrink:0">' + (isFollowing ? '✅ Seguindo' : '👥 Seguir') + '</button>' : '') +
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
    if (btn) { btn.textContent = '👥 Seguir'; btn.className = 'btn btn-sm btn-outline'; }
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    const cSnap = await db.ref('usuarios/' + uid + '/seguidores').once('value');
    await db.ref('usuarios/' + uid).update({ seguidores: (cSnap.val() || 0) + 1 });
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 @' + S.ud.username + ' começou a te seguir!', tipo: 'follow', lida: false, createdAt: Date.now() });
    if (btn) { btn.textContent = '✅ Seguindo'; btn.className = 'btn btn-sm btn-primary'; }
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
      '<span style="font-weight:600;font-size:13px">@' + esc(u.username) + '</span>' +
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
    
    const podio = $('podio'); if (podio) {
      podio.innerHTML = [
        renderPodiumPlace(2, arr[1]),
        renderPodiumPlace(1, arr[0]),
        renderPodiumPlace(3, arr[2])
      ].join('');
    }
    
    const lista = $('ranking-list');
    if (lista) {
      lista.innerHTML = arr.slice(0, 50).map(function(u, i) {
        let selos = '';
        if (u.isAdmin) selos += '<img src="' + IMG.seloAdmin + '" class="selo-img" />';
        if (u.isProf) selos += '<img src="' + IMG.seloProfessor + '" class="selo-img" />';
        if (u.plano === 'premium' || u.plano === 'pro') selos += '<img src="' + IMG.seloPremium + '" class="selo-img" />';
        
        return '<div class="card card-clickable" onclick="verPerfil(\'' + u.uid + '\')" style="display:flex;align-items:center;gap:10px;' + (u.uid === S.user?.uid ? 'background:var(--hover);border:2px solid #10B981' : '') + '">' +
          '<span style="font-weight:800;width:28px;text-align:center;font-size:14px;color:' + (i < 3 ? '#10B981' : 'var(--text3)') + '">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')) + '</div>' +
          '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">@' + esc(u.username || '?') + selos + '</div></div>' +
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
    '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;background:' + colors[pos] + ';display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer;overflow:hidden" onclick="verPerfil(\'' + u.uid + '\')">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '?')) + '</div>' +
    '<div style="font-weight:700;font-size:12px;margin-top:6px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@' + esc((u.username || '')) + '</div>' +
    '<div style="color:#10B981;font-weight:700;font-size:13px">' + fmt(u.points || 0) + '</div>' +
    '<div style="font-size:16px;font-weight:800;color:var(--text3)">' + pos + '°</div></div>';
}

// ========== DESAFIOS ==========
async function loadDesafios() {
  const c = $('desafios-list'); if (!c) return;
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  if (!desafios) { c.innerHTML = '<div class="card" style="text-align:center;padding:30px"><img src="' + IMG.iconeDesafios + '" style="width:60px;height:60px;margin-bottom:10px" /><div style="font-weight:700">Nenhum desafio ativo</div><div style="color:var(--text3);font-size:12px">Fique ligado!</div></div>'; return; }
  
  c.innerHTML = Object.entries(desafios).reverse().map(function(e) {
    const d = e[1];
    const expirado = Date.now() > d.dataLimite;
    return '<div class="card" style="border-left:3px solid ' + (expirado ? '#EF4444' : '#10B981') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:start">' +
        '<div><h3 style="margin:0 0 5px">⚔️ ' + esc(d.titulo) + '</h3><p style="font-size:13px;color:var(--text2)">' + esc(d.descricao) + '</p>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:8px">🏆 Prêmio: <strong style="color:#10B981">+' + fmt(d.premio) + ' pontos</strong></div>' +
        '<div style="font-size:11px;color:var(--text3)">📅 Até: ' + new Date(d.dataLimite).toLocaleDateString('pt-BR') + '</div></div>' +
        '<span class="badge ' + (expirado ? 'badge-nao' : 'badge-sim') + '">' + (expirado ? 'Encerrado' : 'Ativo') + '</span>' +
      '</div></div>';
  }).join('');
}

// ========== JARVIS IA ==========
const jarvisHistory = [];

async function sendJarvisMsg() {
  const input = $('jarvis-input'); const msg = input ? input.value.trim() : '';
  if (!msg) return;
  
  const div = $('jarvis-messages'); if (!div) return;
  div.innerHTML += '<div style="text-align:right;margin-bottom:10px"><div style="display:inline-block;max-width:80%;padding:10px 14px;border-radius:18px;background:#10B981;color:white;font-size:14px">' + esc(msg) + '</div></div>';
  if (input) input.value = '';
  div.scrollTop = div.scrollHeight;
  
  const typingId = 'jtyping-' + Date.now();
  div.innerHTML += '<div id="' + typingId + '" style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:center;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px"><img src="' + IMG.jarvis + '" style="width:24px;height:24px;border-radius:50%" /> 🧠 Pensando...</div></div>';
  div.scrollTop = div.scrollHeight;
  
  // Adiciona ao histórico
  jarvisHistory.push({ role: 'user', content: msg });
  if (jarvisHistory.length > 20) jarvisHistory = jarvisHistory.slice(-20);
  
  try {
    const messages = [
      { role: 'system', content: 'Você é o Jarvis, um assistente de estudos brasileiro. Responda sempre em português com emojis. Seja amigável e paciente. Lembre-se do contexto da conversa.' },
      ...jarvisHistory // Inclui todo o histórico
    ];
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) throw new Error('Status ' + response.status);
    
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não entendi! 😅';
    
    const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
    div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:flex-start;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px;line-height:1.5"><img src="' + IMG.jarvis + '" style="width:28px;height:28px;border-radius:50%;margin-top:2px" /><span>' + esc(reply) + '</span></div></div>';
    
    jarvisHistory.push({ role: 'assistant', content: reply });
    if (jarvisHistory.length > 20) jarvisHistory = jarvisHistory.slice(-20);
    
  } catch(e) {
    console.error('Jarvis error:', e);
    const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
    const respostas = ['🧠 Hmm, interessante! Me conte mais! 🤔','🧠 Ótima pergunta! Continue explorando! 📚','🧠 Você está no caminho certo! 💪⭐'];
    div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:flex-start;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px;line-height:1.5"><img src="' + IMG.jarvis + '" style="width:28px;height:28px;border-radius:50%;margin-top:2px" /><span>' + respostas[Math.floor(Math.random()*respostas.length)] + '</span></div></div>';
  }
  div.scrollTop = div.scrollHeight;
}

async function sendJarvisImage() {
  const input = $('jarvis-image-input');
  if (!input || !input.files || !input.files[0]) return;
  
  const div = $('jarvis-messages'); if (!div) return;
  const file = input.files[0];
  
  const textoInput = $('jarvis-input');
  const mensagemTexto = textoInput ? textoInput.value.trim() : '';
  if (textoInput) textoInput.value = '';
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    div.innerHTML += '<div style="text-align:right;margin-bottom:10px"><img src="' + e.target.result + '" style="max-width:200px;max-height:200px;border-radius:12px;margin-bottom:5px" />' + 
      (mensagemTexto ? '<div style="display:inline-block;max-width:80%;padding:10px 14px;border-radius:18px;background:#10B981;color:white;font-size:14px">' + esc(mensagemTexto) + '</div>' : '') +
      '</div>';
    div.scrollTop = div.scrollHeight;
    
    const typingId = 'jtyping-' + Date.now();
    div.innerHTML += '<div id="' + typingId + '" style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:center;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px"><img src="' + IMG.jarvis + '" style="width:24px;height:24px;border-radius:50%" /> 🔍 Analisando imagem...</div></div>';
    div.scrollTop = div.scrollHeight;
    
    try {
      const base64Data = e.target.result.split(',')[1];
      const promptTexto = mensagemTexto || 'Descreva esta imagem em detalhes. Se for uma questão de estudo, explique a resposta correta. Responda em português.';
      
     const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptTexto },
              { inline_data: { mime_type: file.type, data: base64Data } }
            ]
          }]
        })
      });
      
      if (!geminiResponse.ok) {
        throw new Error('Gemini error: ' + geminiResponse.status);
      }
      
      const geminiData = await geminiResponse.json();
      const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui analisar a imagem 😅';
      
      const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
      div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:flex-start;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px;line-height:1.5"><img src="' + IMG.jarvis + '" style="width:28px;height:28px;border-radius:50%;margin-top:2px" /><span>' + esc(reply) + '</span></div></div>';
      
      jarvisHistory.push({ role: 'user', content: '[Imagem] ' + promptTexto });
      jarvisHistory.push({ role: 'assistant', content: reply });
      if (jarvisHistory.length > 20) jarvisHistory = jarvisHistory.slice(-20);
      
    } catch(e) {
      console.error('Erro ao analisar imagem:', e);
      const typingEl = document.getElementById(typingId); if (typingEl) typingEl.remove();
      div.innerHTML += '<div style="text-align:left;margin-bottom:10px"><div style="display:inline-flex;align-items:flex-start;gap:8px;max-width:80%;padding:10px 14px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:14px;line-height:1.5"><img src="' + IMG.jarvis + '" style="width:28px;height:28px;border-radius:50%;margin-top:2px" /><span>📷 Não consegui processar a imagem. Me descreva o que você vê que eu ajudo! 😊</span></div></div>';
    }
    div.scrollTop = div.scrollHeight;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

// ========== PERFIL ==========
function switchPerfilTab(tab, btn) {
  S.perfilTab = tab;
  document.querySelectorAll('#screen-perfil .btn-sm').forEach(function(b) {
    if (b.textContent.includes('Aulas') || b.textContent.includes('Posts') || b.textContent.includes('Disciplinas')) {
      b.className = 'btn btn-outline btn-sm';
    }
  });
  if (btn) btn.className = 'btn btn-primary btn-sm';
  
  $('perfil-aulas').style.display = tab === 'aulas' ? '' : 'none';
  $('perfil-posts').style.display = tab === 'posts' ? '' : 'none';
  $('perfil-disciplinas').style.display = tab === 'disciplinas' ? '' : 'none';
  
  if (tab === 'aulas') loadPerfilAulas();
  else if (tab === 'posts') loadPerfilPosts();
  else if (tab === 'disciplinas') loadPerfilDisciplinas();
}

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
  if (S.ud.isAdmin) badges.push('<img src="' + IMG.seloAdmin + '" style="width:20px;height:20px" title="Admin" />');
  if (S.ud.isProf) badges.push('<img src="' + IMG.seloProfessor + '" style="width:20px;height:20px" title="Professor" />');
  if (S.ud.isQuizzer) badges.push('<img src="' + IMG.seloQuizzer + '" style="width:20px;height:20px" title="Quizzer" />');
  if (S.ud.plano === 'premium' || S.ud.plano === 'pro') badges.push('<img src="' + IMG.seloPremium + '" style="width:20px;height:20px" title="Premium" />');
  const be = $('perfil-badges'); if (be) be.innerHTML = badges.join(' ') || '<span class="badge">🌱 Estudante</span>';
  
  const eu = $('edit-username'); if (eu) eu.value = S.ud.username || '';
  const eb = $('edit-bio'); if (eb) eb.value = S.ud.bio || '';
  
  switchPerfilTab('aulas', document.querySelector('#screen-perfil .btn-sm'));
  
  // Histórico de quizzes
  const hs = await db.ref('historico/' + S.user.uid).once('value');
  const h = hs.val();
  const he = $('perfil-historico');
  if (he) {
    he.innerHTML = h ? Object.entries(h).sort(function(a,b) { return (b[1].createdAt||0)-(a[1].createdAt||0); }).slice(0,10).map(function(e) {
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600;font-size:14px">🎮 ' + esc(e[1].quizNome || 'Quiz') + '</div><div style="font-size:11px;color:var(--text3)">' + e[1].acertos + '/' + e[1].total + ' · ' + (e[1].pct || 0) + '% · ' + ago(e[1].createdAt) + '</div></div><span style="color:#10B981;font-weight:700">+' + fmt(e[1].score) + '</span></div>';
    }).join('') : '<div style="color:var(--text3);padding:10px;text-align:center">Nenhum quiz</div>';
  }
}

async function loadPerfilAulas() {
  const uid = viewingUserId || S.user?.uid;
  const c = $('perfil-aulas'); if (!c) return;
  c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">⏳ Carregando...</div>';
  
  // Busca todas as aulas do usuário
  const materiasSnap = await db.ref('materias').once('value');
  const materias = materiasSnap.val() || {};
  let html = '';
  
  for (const [mid, m] of Object.entries(materias)) {
    const aulasSnap = await db.ref('aulas/' + mid).once('value');
    const aulas = aulasSnap.val() || {};
    for (const [aid, a] of Object.entries(aulas)) {
      if (a.autorId === uid) {
        html += '<div class="card card-clickable" onclick="navigate(\'materias\');setTimeout(function(){openMateria(\'' + mid + '\');setTimeout(function(){openAula(\'' + mid + '\',\'' + aid + '\')},500)},100)" style="font-size:13px">📝 ' + esc(a.titulo) + ' <span style="color:var(--text3);font-size:11px">em ' + esc(m.nome || '?') + '</span></div>';
      }
    }
  }
  c.innerHTML = html || '<div style="color:var(--text3);padding:10px;text-align:center">Nenhuma aula criada</div>';
}

async function loadPerfilPosts() {
  const uid = viewingUserId || S.user?.uid;
  const c = $('perfil-posts'); if (!c) return;
  c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">⏳ Carregando...</div>';
  
  const snap = await db.ref('posts').orderByChild('autorId').equalTo(uid).once('value');
  const posts = snap.val();
  if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">Nenhum post</div>'; return; }
  
  let html = '';
  const arr = Object.entries(posts).reverse();
  for (const [pid, p] of arr) {
    const views = await getViewCount('posts/' + pid);
    html += '<div class="card" style="font-size:13px">' + esc((p.texto || '').substring(0, 100)) + ' <span style="color:var(--text3);font-size:11px">· ' + ago(p.createdAt) + ' · <span class="view-count"><img src="' + IMG.iconeViews + '" style="width:10px;height:10px" /> ' + views + '</span></span></div>';
  }
  c.innerHTML = html;
}

async function loadPerfilDisciplinas() {
  const uid = viewingUserId || S.user?.uid;
  const c = $('perfil-disciplinas'); if (!c) return;
  c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">⏳ Carregando...</div>';
  
  const snap = await db.ref('materias').orderByChild('autorId').equalTo(uid).once('value');
  const mats = snap.val();
  if (!mats) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">Nenhuma disciplina</div>'; return; }
  
  c.innerHTML = Object.entries(mats).map(function(e) {
    return '<div class="card card-clickable" onclick="navigate(\'materias\');setTimeout(function(){openMateria(\'' + e[0] + '\')},100)" style="font-size:13px">📚 ' + esc(e[1].nome) + ' <span style="color:var(--text3);font-size:11px">· ' + (e[1].aulasCount || 0) + ' aulas</span></div>';
  }).join('');
}

async function saveProfile() {
  const username = ($('edit-username')?.value || '').trim().toLowerCase().replace('@','');
  const bio = ($('edit-bio')?.value || '').trim();
  const updates = {};
  
  if (username && username !== S.ud.username) {
    if (username.length < 3) return toast('Mín. 3 caracteres', 'error');
    if (!/^[a-z0-9._]+$/.test(username)) return toast('Apenas minúsculas, números, . e _', 'error');
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    if (snap.val()) { const other = Object.keys(snap.val())[0]; if (other !== S.user.uid) return toast('@' + username + ' já está em uso!', 'error'); }
    updates.username = username;
  }
  if (bio !== (S.ud.bio || '')) updates.bio = bio;
  if (!Object.keys(updates).length) return toast('Nada para salvar', 'info');
  
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
  
  let selos = '';
  if (u.isAdmin) selos += '<img src="' + IMG.seloAdmin + '" style="width:22px;height:22px" /> ';
  if (u.isProf) selos += '<img src="' + IMG.seloProfessor + '" style="width:22px;height:22px" /> ';
  if (u.isQuizzer) selos += '<img src="' + IMG.seloQuizzer + '" style="width:22px;height:22px" /> ';
  if (u.plano === 'premium' || u.plano === 'pro') selos += '<img src="' + IMG.seloPremium + '" style="width:22px;height:22px" />';
  
  const content = $('profile-fullscreen-content');
  if (content) {
    content.innerHTML = '<div style="background:linear-gradient(135deg,#10B981,#3B82F6);border-radius:20px;padding:30px 20px;text-align:center;color:white;margin-bottom:20px">' +
      '<div style="width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.2);color:white;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 12px;border:3px solid rgba(255,255,255,0.5);overflow:hidden">' + (u.avatar && u.avatar.startsWith('http') ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : esc(u.avatar || '🎓')) + '</div>' +
      '<h2 style="font-size:22px;margin-bottom:5px">' + esc(u.fullname || u.username || '?') + '</h2>' +
      '<p style="opacity:0.85;font-size:14px;margin-bottom:3px">@' + esc(u.username || '?') + ' ' + selos + '</p>' +
      '<p style="opacity:0.75;font-size:13px;margin-bottom:10px">' + esc(u.bio || 'Sem bio') + '</p></div>' +
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
    return '<div class="card" style="cursor:pointer;margin-bottom:8px;' + (e[1].lida ? '' : 'border-left:3px solid #10B981') + '">' +
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

// ========== SOBRE NÓS ==========
async function loadSobre() {
  const c = $('sobre-content'); if (!c) return;
  const snap = await db.ref('config/sobre').once('value');
  const data = snap.val();
  if (data && data.texto) {
    c.innerHTML = '<div style="line-height:1.8;font-size:14px">' + esc(data.texto).replace(/\n/g, '<br>') + '</div>';
  } else {
    c.innerHTML = '<div style="text-align:center;padding:20px"><p style="font-size:16px;font-weight:700;margin-bottom:10px">📚 Sexta-Feira Studies</p><p style="color:var(--text2);font-size:14px">Uma plataforma de estudos gamificada feita para estudantes e professores.</p><p style="color:var(--text2);font-size:14px;margin-top:10px">Aprenda, conecte-se e evolua com a gente!</p><p style="color:var(--text3);font-size:12px;margin-top:15px">Versão 3.0 - 2024</p></div>';
  }
}

// ========== UPDATES ==========
async function loadUpdates() {
  const c = $('updates-list'); if (!c) return;
  const snap = await db.ref('config/updates').once('value');
  const updates = snap.val();
  if (!updates) {
    c.innerHTML = '<div class="card" style="text-align:center;padding:20px"><div style="font-weight:700">Nenhuma atualização</div><div style="color:var(--text3);font-size:12px">Em breve!</div></div>';
    return;
  }
  c.innerHTML = Object.entries(updates).reverse().map(function(e) {
    const u = e[1];
    return '<div class="card" style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<h3 style="margin:0;font-size:15px">📋 ' + esc(u.titulo) + '</h3>' +
        '<span class="badge" style="font-size:10px">v' + esc(u.versao) + '</span>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--text2);line-height:1.6">' + esc(u.descricao).replace(/\n/g, '<br>') + '</p>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:8px">📅 ' + new Date(u.data).toLocaleDateString('pt-BR') + '</div>' +
    '</div>';
  }).join('');
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
          (S.ud.adminLevel >= 3 ? '<button class="btn btn-sm" onclick="admToggleQuizzer(\'' + u.uid + '\')" style="background:' + (u.isQuizzer ? '#FEF3C7' : 'var(--border)') + ';color:var(--text)">' + (u.isQuizzer ? '🎮 Quizzer' : 'Tornar Quizzer') + '</button>' : '') +
          (S.ud.adminLevel >= 2 ? '<button class="btn btn-sm" onclick="admToggleProf(\'' + u.uid + '\')" style="background:' + (u.isProf ? '#D1FAE5' : 'var(--border)') + ';color:var(--text)">' + (u.isProf ? '✅ Prof' : 'Tornar Prof') + '</button>' : '') +
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
  if (S.ud.adminLevel < 3) return toast('Sem permissão', 'error');
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val(); if (!u) return;
  await db.ref('usuarios/' + uid).update({ isQuizzer: !u.isQuizzer });
  toast(u.isQuizzer ? '❌ Quizzer removido' : '🎮 Agora é Quizzer!', 'success');
  admLoad('usuarios');
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { document.querySelectorAll('.modal.show').forEach(function(m) { m.classList.remove('show'); }); } });

// ========== ABRIR VÍDEO EM TELA CHEIA ==========
function abrirVideo(url) {
  // Remove player anterior se existir
  const existente = document.querySelector('.video-overlay');
  if (existente) existente.remove();
  
  // Cria overlay
  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';
  
  // Cria botão fechar
  const closeBtn = document.createElement('button');
  closeBtn.className = 'video-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = function() { overlay.remove(); };
  
  // Cria container do vídeo
  const container = document.createElement('div');
  container.className = 'video-container';
  
  // Verifica se é YouTube ou vídeo direto
  if (url.includes('youtube.com/embed/') || url.includes('youtube.com/watch') || url.includes('youtu.be')) {
    let embedUrl = url;
    if (url.includes('watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    } else if (!url.includes('autoplay')) {
      embedUrl += '?autoplay=1';
    }
    container.innerHTML = '<iframe src="' + embedUrl + '" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>';
  } else {
    container.innerHTML = '<video src="' + url + '" controls autoplay></video>';
  }
  
  overlay.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  // Fecha com ESC
  const escHandler = function(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ========== CRIADOR DE TAREFAS PDF ==========
function loadTarefas() {
  // Carrega os dados do usuário nos campos
  if (S.ud) {
    const profInput = $('tarefa-professor');
    if (profInput && !profInput.value) profInput.value = S.ud.fullname || '';
  }
}

function gerarPDF() {
  const titulo = $('tarefa-titulo')?.value || 'Lista de Exercícios';
  const disciplina = $('tarefa-disciplina')?.value || '';
  const professor = $('tarefa-professor')?.value || '';
  const alinhamento = $('tarefa-alinhamento')?.value || 'centro';
  const conteudo = $('tarefa-conteudo')?.value || '';
  
  if (!conteudo.trim()) {
    toast('Digite as questões ou use "Gerar com IA"!', 'error');
    return;
  }
  
  const questoes = conteudo
    .split('\n')
    .map(q => q.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter(q => q.length > 5);
  
  if (questoes.length === 0) {
    toast('Nenhuma questão encontrada!', 'error');
    return;
  }
  
  const alinhamentoCSS = alinhamento === 'esquerda' ? 'left' : alinhamento === 'direita' ? 'right' : 'center';
  
  const html = `
    <div style="text-align:${alinhamentoCSS};margin-bottom:25px">
      <h2 style="margin:0 0 5px;font-size:20px">${titulo}</h2>
      ${disciplina ? '<p style="color:#555;margin:2px 0;font-size:13px"><strong>Disciplina:</strong> ' + disciplina + '</p>' : ''}
      ${professor ? '<p style="color:#555;margin:2px 0;font-size:13px"><strong>Professor(a):</strong> ' + professor + '</p>' : ''}
      <p style="color:#888;font-size:11px;margin:2px 0">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      <div style="margin-top:10px;font-size:12px;color:#555">
        👤 Aluno: ___________________ &nbsp;&nbsp; 📅 Data: ____/____/____ &nbsp;&nbsp; ⭐ Nota: _____
      </div>
    </div>
    
    <hr style="border:1px solid #ddd;margin-bottom:20px">
    
    <div style="line-height:2.2;font-size:14px">
      ${questoes.map((q, i) => `
        <div style="margin-bottom:15px">
          <strong>${i+1}.</strong> ${q}
          <div style="margin-top:3px;color:#aaa;font-size:12px">R: _____________________________________________</div>
        </div>
      `).join('')}
    </div>
    
    <div style="text-align:center;margin-top:40px;font-size:11px;color:#999">
      Feito com ❤️ por Sexta-Feira Studies
    </div>
  `;
  
  $('pdf-preview-card').style.display = 'block';
  $('pdf-preview-content').innerHTML = html;
  $('pdf-preview-card').scrollIntoView({ behavior: 'smooth' });
  
  toast('✅ Visualização pronta!', 'success');
}
function imprimirPDF() {
  const conteudo = $('pdf-preview-content')?.innerHTML;
  if (!conteudo) return;
  
  const titulo = $('tarefa-titulo')?.value || 'Tarefa';
  
  const novaJanela = window.open('', '_blank', 'width=900,height=700');
  novaJanela.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo} - Sexta-Feira Studies</title>
      <style>
        @media print { body { margin: 0; padding: 20px; } }
        body { font-family: 'Sora', Arial, sans-serif; padding: 40px; }
      </style>
    </head>
    <body>${conteudo}</body>
    </html>
  `);
  novaJanela.document.close();
  
  setTimeout(() => {
    novaJanela.print();
  }, 500);
}

function fecharPreview() {
  const previewCard = $('pdf-preview-card');
  if (previewCard) previewCard.style.display = 'none';
}

async function gerarQuestoesIA() {
  const disciplina = $('tarefa-disciplina')?.value.trim();
  const titulo = $('tarefa-titulo')?.value.trim();
  const qtd = parseInt($('tarefa-qtd')?.value || '10');
  
  if (!disciplina && !titulo) {
    toast('Preencha Disciplina ou Título!', 'error');
    return;
  }
  
  const tema = titulo || disciplina;
  toast('🤖 Gerando ' + qtd + ' questões...', 'info');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ 
          role: 'user', 
          content: `Crie exatamente ${qtd} questões sobre "${tema}". Regras:
1. Apenas as questões, sem introdução
2. Uma questão por linha
3. NÃO numere as questões
4. Não diga "aqui estão as questões"
5. Vá direto para as perguntas` 
        }],
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    let questoes = data.choices?.[0]?.message?.content || '';
    
    // Limpa a resposta da IA
    questoes = questoes
      .replace(/^(Aqui estão|Segue|Lista|Eis).*?\n/i, '') // Remove frases introdutórias
      .replace(/^\d+\.\s*/gm, '') // Remove numeração existente
      .split('\n')
      .filter(q => q.trim().length > 10)
      .slice(0, qtd)
      .join('\n');
    
    const campo = $('tarefa-conteudo');
    if (campo) {
      campo.value = questoes;
      toast('✅ ' + qtd + ' questões geradas! Clique em Visualizar', 'success');
    }
  } catch(e) {
    console.error('Erro IA:', e);
    toast('❌ Erro ao gerar questões', 'error');
  }
}

// ========== HISTÓRICO DE NAVEGAÇÃO ==========
let navHistory = [];

// Substitua a função navigate original por esta:
const navigateOriginal = navigate;
navigate = function(name) {
  // Salva no histórico
  if (navHistory.length === 0 || navHistory[navHistory.length - 1] !== name) {
    navHistory.push(name);
  }
  if (navHistory.length > 20) navHistory.shift();
  
  // Atualiza a URL sem recarregar
  history.pushState({ screen: name }, '', '#' + name);
  
  // Chama a função original
  navigateOriginal(name);
};

// Quando o usuário clica no botão voltar do navegador
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.screen) {
    navigateOriginal(e.state.screen);
  } else {
    navigateOriginal('home');
  }
});

// Inicializa com a URL atual
if (window.location.hash) {
  const screen = window.location.hash.substring(1);
  setTimeout(function() {
    navigateOriginal(screen);
  }, 500);
}
// ========== IMPRIMIR TAREFA ==========
function imprimirTarefa() {
  const conteudo = $('pdf-preview-content')?.innerHTML;
  if (!conteudo) return;
  
  const titulo = $('tarefa-titulo')?.value || 'Tarefa';
  
  const novaJanela = window.open('', '_blank', 'width=900,height=700');
  novaJanela.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo} - Sexta-Feira Studies</title>
      <style>
        @media print { 
          body { margin: 0; padding: 15px; }
          @page { margin: 1cm; }
        }
        body { 
          font-family: Arial, sans-serif; 
          padding: 30px; 
          color: #1A1A2E;
        }
      </style>
    </head>
    <body>${conteudo}</body>
    </html>
  `);
  novaJanela.document.close();
  
  setTimeout(() => {
    novaJanela.print();
  }, 800);
}

// ========== LOAD TAREFAS ==========
function loadTarefas() {
  if (S.ud) {
    const profInput = $('tarefa-professor');
    if (profInput && !profInput.value) {
      profInput.value = S.ud.fullname || S.ud.username || '';
    }
  }
}

// ========== FECHAR PREVIEW ==========
function fecharPreview() {
  $('pdf-preview-card').style.display = 'none';
}

console.log('✅ Sexta-Feira Studies v3.0 PRONTO!');
