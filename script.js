'use strict';

// ========== FIREBASE CONFIG ==========
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
const IMGBB_KEY = '86427cccd2a94fb42a0754ffd7f19e79';
const GROQ_KEY = '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';
const GEMINI_KEY = 'AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY';

// ========== IMAGENS ==========
const IMG = {
  logo: 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png',
  jarvis: 'https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png',
  seloAdmin: 'https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png',
  seloProfessor: 'https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png',
  seloPremium: 'https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png',
  seloQuizzer: 'https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png',
  seloVerificado: 'https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png',
  views: 'https://i.ibb.co/gM7qmW8N/a-small-40x40-pixel-icon-featuring-a-sty-a-RQDe-K8u-Qou-OYMXLa-TFmhw-VS-z-FS4-SRn-W1-Ru2-H6-Vm-FKw-sd.jpg'
};

// ========== STATE ==========
const S = { user: null, ud: null, mid: null, aid: null, room: null, roomListener: null, pvUser: null, pvListener: null, mFilter: 'all', fFilter: 'all', pType: 'post', perfilTab: 'aulas', quiz: { q: [], i: 0, score: 0, corr: 0, timer: null, left: 30, start: 0, ans: [] } };
let viewingUserId = null, questoesNormais = [], selectedInviteUsers = [], rankingModo = 'alunos', googleUserTemp = null, jarvisHistory = [], desafioAtual = null, respostasDesafio = [];

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1e9) return (n/1e9).toFixed(1)+'B'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
function ago(t) { if (!t) return 'agora'; const d = (Date.now()-t)/1000; if (d<60) return 'agora'; if (d<3600) return Math.floor(d/60)+'min'; if (d<86400) return Math.floor(d/3600)+'h'; return Math.floor(d/86400)+'d'; }
function toast(msg, type) {
  const c = $('toast-container'); if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const d = document.createElement('div'); d.className = 'toast';
  d.style.borderLeftColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  d.innerHTML = (icons[type]||'') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = '0.3s'; setTimeout(() => d.remove(), 300); }, 3000);
}

// ========== AUTH ==========
function switchAuthTab(t) {
  $('tab-login').className = t === 'login' ? 'btn btn-primary' : 'btn btn-outline';
  $('tab-register').className = t === 'register' ? 'btn btn-primary' : 'btn btn-outline';
  $('login-form').style.display = t === 'login' ? '' : 'none';
  $('register-form').style.display = t === 'register' ? '' : 'none';
  $('login-error').style.display = 'none';
  $('reg-error').style.display = 'none';
}

async function handleLogin() {
  const u = ($('login-username')?.value || '').trim().replace('@','');
  const p = $('login-password')?.value || '';
  const err = $('login-error');
  if (!u || !p) { err.textContent = 'Preencha todos os campos'; err.style.display = ''; return; }
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
    const users = snap.val();
    if (!users) { err.textContent = '@' + u + ' não encontrado'; err.style.display = ''; return; }
    const uid = Object.keys(users)[0], data = users[uid];
    if (data.password !== p) { err.textContent = 'Senha incorreta'; err.style.display = ''; return; }
    await auth.signInWithEmailAndPassword(data.email, p);
  } catch(e) { err.textContent = 'Erro: ' + e.message; err.style.display = ''; }
}

async function handleRegister() {
  const fullname = ($('reg-fullname')?.value || '').trim();
  const username = ($('reg-username')?.value || '').trim().toLowerCase().replace('@','');
  const email = ($('reg-email')?.value || '').trim();
  const pw = $('reg-password')?.value || '';
  const cf = $('reg-confirm')?.value || '';
  const err = $('reg-error');
  if (!fullname || !username || !email || !pw || !cf) { err.textContent = 'Preencha todos'; err.style.display = ''; return; }
  if (username.length < 3) { err.textContent = '@usuario mínimo 3 caracteres'; err.style.display = ''; return; }
  if (pw.length < 6) { err.textContent = 'Senha mínimo 6 caracteres'; err.style.display = ''; return; }
  if (pw !== cf) { err.textContent = 'Senhas não conferem'; err.style.display = ''; return; }
  try {
    const uSnap = await db.ref('usuarios').orderByChild('username').equalTo(username).once('value');
    if (uSnap.val()) { err.textContent = '@' + username + ' já existe'; err.style.display = ''; return; }
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid, fullname, username, email, password: pw, avatar: '🎓', bio: '', points: 0, plano: 'gratis', adminLevel: 0, isProf: false, isQuizzer: false, createdAt: Date.now()
    });
    toast('Bem-vindo @' + username + '! 🎉', 'success');
  } catch(ex) { err.textContent = ex.message; err.style.display = ''; }
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const snap = await db.ref('usuarios/' + result.user.uid).once('value');
    if (!snap.val()) {
      googleUserTemp = result.user;
      $('modal-username').classList.add('show');
    }
  } catch(e) { toast('Erro Google: ' + e.message, 'error'); }
}

async function salvarUsernameGoogle() { /* simplificado */ }

async function handleLogout() {
  if (S.roomListener) { db.ref('chat_messages/' + S.room).off(); S.roomListener = null; }
  if (S.pvListener) { S.pvListener(); S.pvListener = null; }
  await auth.signOut();
}

// ========== AUTH LISTENER ==========
auth.onAuthStateChanged(async user => {
  if (user) {
    S.user = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    S.ud = snap.val() || {};
    if (!S.ud.username) { $('modal-username').classList.add('show'); return; }
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    $('site-footer').style.display = '';
    updateUI();
    navigate('home');
    if (S.ud.adminLevel >= 1) $('nav-adm').style.display = '';
    listenNotifs();
  } else {
    $('app').style.display = 'none';
    $('site-footer').style.display = 'none';
    $('auth-screen').style.display = '';
  }
});

// ========== UI ==========
function updateUI() {
  const u = S.ud; if (!u) return;
  $('sidebar-name').textContent = '@' + (u.username || '?');
  $('sidebar-pts').textContent = fmt(u.points) + ' pts';
  $('perfil-name').textContent = u.fullname || u.username || '?';
  const av = u.avatar || '🎓';
  ['sidebar-avatar','topbar-avatar','pc-avatar','perfil-avatar'].forEach(id => {
    const el = $(id); if (!el) return;
    el.innerHTML = av.startsWith('http') ? '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : av;
  });
}

// ========== NAVEGAÇÃO ==========
function navigate(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-' + name); if (t) t.classList.add('active');
  $('sidebar').classList.remove('open');
  $('sidebar-overlay').classList.remove('show');
  window.scrollTo(0, 0);
  if (name === 'home') loadHome();
  else if (name === 'materias') loadMaterias();
  else if (name === 'descobrir') loadFeed();
  else if (name === 'ranking') loadRanking();
  else if (name === 'desafios') loadDesafios();
  else if (name === 'chat') loadChat();
  else if (name === 'perfil') loadPerfil();
  else if (name === 'notificacoes') loadNotifs();
  else if (name === 'sobre') loadSobre();
  else if (name === 'updates') loadUpdates();
  else if (name === 'jarvis') {}
}
function toggleSidebar() { $('sidebar').classList.toggle('open'); $('sidebar-overlay').classList.toggle('show'); }
function openModal(id) { const m = $('modal-' + id); if (m) m.classList.add('show'); }
function closeModal(id) { const m = $('modal-' + id); if (m) m.classList.remove('show'); }

// ========== VIEWS ==========
async function addView(path) { if (!S.user) return; const ref = db.ref(path + '/views'); const snap = await ref.once('value'); const v = snap.val() || {}; if (!v[S.user.uid]) { v[S.user.uid] = Date.now(); await ref.set(v); } }
async function getViewCount(path) { const snap = await db.ref(path + '/views').once('value'); const v = snap.val() || {}; return Object.keys(v).length; }

// ========== HOME ==========
async function loadHome() {
  if (!S.ud) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();
  const pts = S.ud.points || 0;
  const levels = [0,100,500,1000,5000,10000,50000,100000,500000,1e6];
  let lvl = 0;
  for (let i = 0; i < levels.length; i++) if (pts >= levels[i]) lvl = i;
  const nxt = levels[Math.min(lvl+1, levels.length-1)];
  const pct = nxt > levels[lvl] ? Math.min(((pts-levels[lvl])/(nxt-levels[lvl]))*100, 100) : 100;
  $('level-badge').textContent = '📈 Nível ' + (lvl+1);
  $('stat-pontos').textContent = fmt(pts);
  $('stat-quizzes').textContent = S.ud.quizzesPlayed || 0;
  $('progress-text').textContent = fmt(pts) + '/' + fmt(nxt) + ' pts';
  $('progress-fill').style.width = pct + '%';
  const ms = await db.ref('materias').orderByChild('autorId').equalTo(S.user.uid).once('value');
  $('stat-materias').textContent = ms.val() ? Object.keys(ms.val()).length : 0;
  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value', async snap => {
    const posts = snap.val();
    const c = $('home-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:15px">📭 Nenhum post</div>'; return; }
    let html = '';
    for (const [id, p] of Object.entries(posts).reverse()) {
      const views = await getViewCount('posts/' + id);
      html += renderPost(p, id, views, true);
    }
    c.innerHTML = html;
  });
}

function renderPost(p, id, views, compact) {
  views = views || 0;
  const imgHTML = p.imagem ? '<img src="' + esc(p.imagem) + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-top:8px" />' : '';
  const likes = p.likes ? Object.keys(p.likes).length : 0;
  const liked = p.likes && S.user ? p.likes[S.user.uid] : false;
  let selos = '';
  if (p.isProf) selos += '<img src="' + IMG.seloProfessor + '" style="width:14px;height:14px;vertical-align:middle;margin-left:3px" />';
  return '<div class="card" style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
    '<div onclick="verPerfil(\'' + p.autorId + '\')" style="width:32px;height:32px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;cursor:pointer;overflow:hidden">' + (p.avatar?.startsWith('http') ? '<img src="' + p.avatar + '" style="width:100%;height:100%;object-fit:cover" />' : (p.avatar || '?')) + '</div>' +
    '<div style="flex:1"><div style="font-weight:600;font-size:13px">' + esc(p.autorNome || '?') + selos + '</div><div style="font-size:11px;color:var(--text3)">' + ago(p.createdAt) + ' · 👁 ' + views + '</div></div></div>' +
    (p.texto ? '<div style="font-size:14px;margin-bottom:8px">' + esc(p.texto) + '</div>' : '') + imgHTML +
    '<div style="display:flex;gap:10px;padding-top:8px;border-top:1px solid var(--border)"><button onclick="likePost(\'' + id + '\')" style="border:none;background:none;cursor:pointer;font-weight:600;color:' + (liked ? '#EF4444' : 'var(--text3)') + '">' + (liked ? '❤️' : '🤍') + ' ' + likes + '</button></div></div>';
}

// ========== DISCIPLINAS ==========
function loadMaterias() {
  db.ref('materias').on('value', snap => {
    const mat = snap.val();
    const c = $('materias-grid'); if (!c) return;
    if (!mat) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:15px">📚 Nenhuma disciplina</div>'; return; }
    let arr = Object.entries(mat).map(([id,m]) => ({id, ...m}));
    if (S.mFilter === 'mine') arr = arr.filter(m => m.autorId === S.user?.uid);
    arr.sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
    c.innerHTML = arr.map(m => '<div class="card card-clickable" onclick="openMateria(\'' + m.id + '\')" style="display:flex;gap:12px;align-items:center">' +
      '<span style="font-size:35px">' + (m.icone||'📚') + '</span><div><div style="font-weight:700">' + esc(m.nome) + '</div><div style="font-size:11px;color:var(--text3)">' + esc(m.autorNome) + '</div></div></div>').join('');
  });
}
function setMateriaFilter(f) { S.mFilter = f; loadMaterias(); }
async function criarMateria() {
  const nome = $('nm-nome')?.value?.trim();
  if (!nome) return toast('Nome obrigatório', 'error');
  await db.ref('materias').push({ nome, descricao: $('nm-desc')?.value||'', icone:'📚', autorId:S.user.uid, autorNome:S.ud.username, createdAt:Date.now() });
  closeModal('materia');
  toast('Disciplina criada! 📚', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val(); if (!m) return;
  $('materia-hero-nome').textContent = m.nome;
  $('materia-hero-desc').textContent = m.descricao || '';
  navigate('materia-detalhe');
  addView('materias/' + id);
  
  db.ref('aulas/' + id).on('value', async snap => {
    const aulas = snap.val();
    const c = $('aulas-list'); if (!c) return;
    if (!aulas) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">📝 Nenhuma aula</div>'; return; }
    let html = '';
    for (const [aid, a] of Object.entries(aulas)) {
      const views = await getViewCount('aulas/' + id + '/' + aid);
      html += '<div class="card card-clickable" onclick="openAula(\'' + id + '\',
\'' + aid + '\')"><strong>' + esc(a.titulo) + '</strong> <span style="font-size:11px;color:var(--text3)">· ' + views + ' views</span></div>';
    }
    c.innerHTML = html;
  });
  
  db.ref('quizzes/' + id).on('value', async snap => {
    const quizzes = snap.val();
    const c = $('quizzes-materia'); if (!c) return;
    if (!quizzes) { c.innerHTML = '<div style="color:var(--text3);padding:10px;text-align:center">🎮 Nenhum quiz</div>'; return; }
    let html = '';
    for (const [qid, q] of Object.entries(quizzes)) {
      const views = await getViewCount('quizzes/' + id + '/' + qid);
      html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>🎮 ' + esc(q.nome) + '</strong><br><span style="font-size:11px;color:var(--text3)">' + (q.questoes?.length||0) + ' questões · ' + views + ' views</span></div><button class="btn btn-primary btn-sm" onclick="startQuiz(\'' + id + '\',\'' + qid + '\')">▶ Jogar</button></div>';
    }
    c.innerHTML = html;
  });
}

// ========== AULAS ==========
async function criarAula() {
  const t = $('nt-titulo')?.value?.trim();
  const c = $('nt-conteudo')?.value?.trim();
  if (!t || !c) return toast('Preencha tudo', 'error');
  await db.ref('aulas/' + S.mid).push({ titulo: t, conteudo: c, autorId: S.user.uid, autorNome: S.ud.username, createdAt: Date.now(), views: {} });
  closeModal('aula');
  toast('Aula criada! 📝', 'success');
}

async function openAula(mid, aid) {
  S.mid = mid; S.aid = aid;
  const snap = await db.ref('aulas/' + mid + '/' + aid).once('value');
  const a = snap.val(); if (!a) return;
  addView('aulas/' + mid + '/' + aid);
  $('aula-title').textContent = a.titulo;
  $('aula-body').textContent = a.conteudo;
  navigate('aula-detalhe');
}

// ========== QUIZ ==========
async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val(); if (!q?.questoes?.length) return;
  addView('quizzes/' + mId + '/' + qId);
  S.quiz = { q: q.questoes.sort(() => Math.random() - 0.5), i: 0, score: 0, corr: 0, left: q.tempo || 30, tempoTotal: q.tempo || 30, start: Date.now(), nome: q.nome };
  navigate('quiz-game');
  renderQ();
}

function renderQ() {
  const g = S.quiz;
  if (g.i >= g.q.length) { finishQ(); return; }
  const q = g.q[g.i];
  $('quiz-q-counter').textContent = (g.i+1) + '/' + g.q.length;
  $('quiz-question').textContent = q.pergunta;
  $('quiz-options').innerHTML = q.alternativas.map((a,i) => '<button onclick="selectA(' + i + ')" style="display:flex;width:100%;padding:12px;margin-bottom:6px;border:2px solid var(--border);border-radius:10px;background:var(--card);cursor:pointer;text-align:left;font-size:14px"><span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:#10B981;color:white;align-items:center;justify-content:center;margin-right:10px;font-weight:700">' + 'ABCD'[i] + '</span>' + esc(a) + '</button>').join('');
  g.left = g.tempoTotal;
  clearInterval(g.timer);
  g.timer = setInterval(() => { g.left--; if(g.left<=0){clearInterval(g.timer);selectA(-1);} }, 1000);
}

function selectA(chosen) {
  clearInterval(S.quiz.timer);
  const g = S.quiz, q = g.q[g.i], ok = chosen === q.correta;
  document.querySelectorAll('#quiz-options button').forEach((b,i) => { b.disabled = true; b.style.background = i === q.correta ? '#D1FAE5' : i === chosen && !ok ? '#FEE2E2' : ''; });
  if (ok) { g.score += 10 + g.left; g.corr++; }
  setTimeout(() => { g.i++; renderQ(); }, 1200);
}

async function finishQ() {
  clearInterval(S.quiz.timer);
  const g = S.quiz, total = g.q.length, pct = Math.round(g.corr/total*100);
  const pts = g.score + (pct>=90?50:pct>=70?30:0);
  await db.ref('historico/' + S.user.uid).push({ quizNome: g.nome, score: pts, acertos: g.corr, total, pct, tempo: Math.round((Date.now()-g.start)/1000), createdAt: Date.now() });
  await addPts(pts);
  navigate('resultado');
  $('res-acertos').textContent = g.corr;
  $('res-total').textContent = total;
  $('res-pontos').textContent = '+' + pts;
  $('resultado-pct').textContent = pct + '%';
}

// ========== FEED ==========
function loadFeed() {
  db.ref('posts').orderByChild('createdAt').limitToLast(30).on('value', async snap => {
    const posts = snap.val();
    const c = $('descobrir-feed'); if (!c) return;
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);text-align:center;padding:15px">📭 Nenhum post</div>'; return; }
    let html = '';
    for (const [id, p] of Object.entries(posts).reverse()) {
      const views = await getViewCount('posts/' + id);
      html += renderPost(p, id, views);
    }
    c.innerHTML = html;
  });
}

async function createPost() {
  const texto = $('new-post-text')?.value?.trim();
  if (!texto) return toast('Escreva algo', 'error');
  await db.ref('posts').push({ texto, tipo: S.pType, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, isProf: S.ud.isProf, likes: {}, views: {}, createdAt: Date.now() });
  $('new-post-text').value = '';
  toast('Publicado! 📢', 'success');
}

async function likePost(id) {
  if (!S.user) return;
  const ref = db.ref('posts/' + id + '/likes/' + S.user.uid);
  const snap = await ref.once('value');
  if (snap.val()) await ref.remove();
  else await ref.set(true);
}

// ========== RANKING ==========
function loadRanking() {
  db.ref('usuarios').on('value', snap => {
    const users = snap.val(); if (!users) return;
    let arr = Object.values(users).filter(u => !u.isAdmin).sort((a,b) => (b.points||0)-(a.points||0));
    $('ranking-list').innerHTML = arr.slice(0,50).map((u,i) => '<div class="card" style="display:flex;align-items:center;gap:10px"><span style="font-weight:800;width:25px">' + (i+1) + '</span><span style="font-weight:600">@' + esc(u.username) + '</span><span style="margin-left:auto;color:#10B981;font-weight:700">' + fmt(u.points) + ' pts</span></div>').join('');
  });
}

// ========== DESAFIOS ==========
async function loadDesafios() {
  const c = $('desafios-lista'); if (!c) return;
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  const agora = Date.now();
  if (!desafios) { c.innerHTML = '<div class="card" style="text-align:center;padding:30px">⚔️ Nenhum desafio no momento</div>'; return; }
  c.innerHTML = Object.entries(desafios).reverse().map(([id,d]) => {
    const ativo = agora >= d.inicio && agora <= d.fim;
    return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>⚔️ ' + esc(d.titulo) + '</strong><br><span style="font-size:11px;color:var(--text3)">🏆 +' + d.premio + ' pts</span></div>' + (ativo ? '<button class="btn btn-dourado btn-sm" onclick="participarDesafio(\'' + id + '\')">▶ Participar</button>' : '<span class="badge">Encerrado</span>') + '</div>';
  }).join('');
}

async function participarDesafio(id) {
  const snap = await db.ref('desafios/' + id).once('value');
  const d = snap.val(); if (!d) return;
  desafioAtual = { id, ...d };
  respostasDesafio = [];
  const c = $('desafios-lista'); if (!c) return;
  const questoes = parseQuestoesDesafio(d.questoes);
  c.innerHTML = '<div class="card" style="background:linear-gradient(135deg,#10B981,#3B82F6);color:white;text-align:center;padding:20px;margin-bottom:20px"><h2>⚔️ ' + esc(d.titulo) + '</h2><p>🏆 +' + d.premio + ' pts</p></div>' +
    questoes.map((q,i) => '<div class="card" style="margin-bottom:15px"><strong>' + (i+1) + '. ' + esc(q.pergunta) + '</strong><div style="margin-top:10px">' + q.alternativas.map((a,j) => '<label style="display:block;padding:8px;cursor:pointer"><input type="radio" name="q' + i + '" value="' + j + '" onchange="respostaDesafio(' + i + ',' + j + ')"> ' + esc(a) + '</label>').join('') + '</div></div>').join('') +
    '<button class="btn btn-dourado btn-full" onclick="finalizarDesafio()">🏆 Enviar</button>';
}

function respostaDesafio(i, v) { respostasDesafio[i] = v; }

async function finalizarDesafio() {
  if (!desafioAtual) return;
  const questoes = parseQuestoesDesafio(desafioAtual.questoes);
  let acertos = 0;
  questoes.forEach((q,i) => { const letras = {a:0,b:1,c:2,d:3}; if (parseInt(respostasDesafio[i]) === (letras[q.resposta?.toLowerCase()] ?? -1)) acertos++; });
  const pct = Math.round(acertos/questoes.length*100);
  const ganhou = pct >= 70 ? desafioAtual.premio : Math.round(desafioAtual.premio*(pct/100));
  await db.ref('desafios/' + desafioAtual.id + '/participantes/' + S.user.uid).set({ nome: S.ud.username, acertos, total: questoes.length, pct, ganhou, data: Date.now() });
  if (ganhou > 0) await addPts(ganhou);
  alert('🏆 Acertos: ' + acertos + '/' + questoes.length + ' (' + pct + '%)\nPontos: +' + ganhou);
  desafioAtual = null;
}

function parseQuestoesDesafio(txt) {
  if (!txt) return [];
  return txt.split('\n\n').filter(b => b.trim()).map(b => {
    const l = b.trim().split('\n');
    const resp = l.find(x => x.toUpperCase().startsWith('RESPOSTA:'))?.replace(/RESPOSTA:/i,'').trim() || '';
    const alts = l.filter(x => /^[a-dA-D]\)/.test(x)).map(x => x.replace(/^[a-dA-D]\)\s*/,''));
    return { pergunta: l[0], alternativas: alts, resposta: resp, tipo: alts.length ? 'multipla' : 'dissertativa' };
  });
}

// ========== JARVIS ==========
async function sendJarvisMsg() {
  const msg = $('jarvis-input')?.value?.trim();
  if (!msg) return;
  $('jarvis-input').value = '';
  const div = $('jarvis-messages');
  div.innerHTML += '<div style="text-align:right;margin:8px"><span style="background:#10B981;color:white;padding:10px 14px;border-radius:18px;font-size:14px">' + esc(msg) + '</span></div>';
  jarvisHistory.push({ role: 'user', content: msg });
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role:'system',content:'Você é o Jarvis, assistente de estudos brasileiro.' }, ...jarvisHistory], max_tokens: 500 })
    });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || 'Não entendi 😅';
    div.innerHTML += '<div style="text-align:left;margin:8px"><span style="background:var(--input-bg);color:var(--text);padding:10px 14px;border-radius:18px;font-size:14px"><img src="' + IMG.jarvis + '" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:8px" />' + esc(reply) + '</span></div>';
    jarvisHistory.push({ role:'assistant', content: reply });
  } catch(e) { div.innerHTML += '<div style="text-align:left;margin:8px"><span style="background:var(--input-bg);color:var(--text);padding:10px 14px;border-radius:18px">🧠 Me desculpe, erro técnico!</span></div>'; }
  div.scrollTop = div.scrollHeight;
}

// ========== PERFIL ==========
async function loadPerfil() {
  if (!S.ud) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();
  $('pstat-pts').textContent = fmt(S.ud.points || 0);
  $('perfil-badges').innerHTML = (S.ud.isAdmin ? '<img src="' + IMG.seloAdmin + '" style="width:20px;height:20px;margin:2px" />' : '') + (S.ud.isProf ? '<img src="' + IMG.seloProfessor + '" style="width:20px;height:20px;margin:2px" />' : '');
}

// ========== PONTOS ==========
async function addPts(pts) {
  if (!S.user) return;
  const curSnap = await db.ref('usuarios/' + S.user.uid + '/points').once('value');
  const cur = curSnap.val() || 0;
  await db.ref('usuarios/' + S.user.uid).update({ points: cur + pts });
  S.ud.points = cur + pts;
  updateUI();
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs() {
  if (!S.user) return;
  db.ref('notificacoes/' + S.user.uid).on('value', snap => {
    const n = snap.val();
    if (!n) return;
    const unread = Object.values(n).filter(x => !x.lida).length;
    const badge = $('notif-badge');
    if (badge) badge.style.display = unread ? 'flex' : 'none';
  });
}

async function loadNotifs() {
  const list = $('notificacoes-list'); if (!list) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).once('value');
  const n = snap.val();
  list.innerHTML = n ? Object.entries(n).reverse().map(([id,x]) => '<div class="card">' + esc(x.mensagem) + ' <span style="font-size:10px;color:var(--text3)">' + ago(x.createdAt) + '</span></div>').join('') : '🔔 Nenhuma notificação';
}

// ========== SOBRE / UPDATES ==========
async function loadSobre() {
  const snap = await db.ref('config/sobre').once('value');
  const d = snap.val();
  $('sobre-content').innerHTML = d?.texto || '<p style="text-align:center;padding:20px">📚 Sexta-Feira Studies - Plataforma de estudos gamificada</p>';
}

async function loadUpdates() {
  const snap = await db.ref('config/updates').once('value');
  const u = snap.val();
  $('updates-list').innerHTML = u ? Object.entries(u).reverse().map(([id,x]) => '<div class="card"><strong>📋 ' + esc(x.titulo) + '</strong> <span class="badge">v' + x.versao + '</span><p style="font-size:12px;color:var(--text2)">' + esc(x.descricao) + '</p></div>').join('') : '📋 Nenhuma atualização';
}

// ========== IMAGEM ==========
async function uploadImage(file) {
  const base64 = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
  const fd = new FormData(); fd.append('key', IMGBB_KEY); fd.append('image', base64.split(',')[1]);
  const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
  const d = await r.json();
  return d.success ? d.data.url : null;
}

// ========== CHAT (simplificado) ==========
function loadChat() { $('rooms-list').innerHTML = '<div style="padding:10px;color:var(--text3)">💬 Em breve!</div>'; }

// ========== MISC ==========
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show')); });

console.log('✅ Sexta-Feira Studies PRONTO!');
