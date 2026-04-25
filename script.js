'use strict';

// ========== FIREBASE ==========
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
  mid: null,
  tid: null,
  room: null,
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

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return String(n); }
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
  d.style.cssText = 'background:var(--card);padding:12px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-weight:600;font-size:14px;';
  d.innerHTML = (icons[type] || '') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = '0.3s'; setTimeout(() => d.remove(), 300); }, 3000);
}

// ========== AUTH ==========
function switchAuthTab(t) {
  document.getElementById('tab-login').style.cssText = t === 'login' ? 'background:white;color:#6C5CE7' : 'background:transparent;color:var(--text3)';
  document.getElementById('tab-register').style.cssText = t === 'register' ? 'background:white;color:#6C5CE7' : 'background:transparent;color:var(--text3)';
  $('login-form').style.display = t === 'login' ? '' : 'none';
  $('register-form').style.display = t === 'register' ? '' : 'none';
  $('login-error').style.display = 'none';
  $('reg-error').style.display = 'none';
}

async function handleLogin() {
  const u = $('login-username').value.trim();
  const p = $('login-password').value;
  if (!u || !p) {
    $('login-error').textContent = 'Preencha todos os campos';
    $('login-error').style.display = '';
    return;
  }
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  const users = snap.val();
  if (!users) {
    $('login-error').textContent = 'Usuário não encontrado';
    $('login-error').style.display = '';
    return;
  }
  const uid = Object.keys(users)[0];
  const data = users[uid];
  if (data.password !== p) {
    $('login-error').textContent = 'Senha incorreta';
    $('login-error').style.display = '';
    return;
  }
  try { await auth.signInWithEmailAndPassword(data.email, p); } catch (e) {
    try { await auth.createUserWithEmailAndPassword(data.email, p); } catch (e2) { }
  }
}

async function handleRegister() {
  const u = $('reg-username').value.trim();
  const e = $('reg-email').value.trim();
  const p = $('reg-password').value;
  const c = $('reg-confirm').value;
  const err = $('reg-error');
  if (!u || !e || !p || !c) { err.textContent = 'Preencha todos os campos'; err.style.display = ''; return; }
  if (u.length < 3) { err.textContent = 'Nome muito curto (mín. 3)'; err.style.display = ''; return; }
  if (p.length < 6) { err.textContent = 'Senha muito curta (mín. 6)'; err.style.display = ''; return; }
  if (p !== c) { err.textContent = 'Senhas não coincidem'; err.style.display = ''; return; }
  const s1 = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  if (s1.val()) { err.textContent = 'Nome de usuário já está em uso!'; err.style.display = ''; return; }
  const s2 = await db.ref('usuarios').orderByChild('email').equalTo(e).once('value');
  if (s2.val()) { err.textContent = 'E-mail já cadastrado!'; err.style.display = ''; return; }
  let cred;
  try { cred = await auth.createUserWithEmailAndPassword(e, p); } catch (ex) { err.textContent = ex.message; err.style.display = ''; return; }
  await db.ref('usuarios/' + cred.user.uid).set({
    uid: cred.user.uid, username: u, email: e, password: p,
    avatar: '🎓', bio: '', points: 0, quizzesPlayed: 0, materiasCreated: 0,
    seguidores: 0, isAdmin: false, createdAt: Date.now()
  });
  await db.ref('notificacoes/' + cred.user.uid).push({
    mensagem: '🎉 Bem-vindo ao Sexta-Feira Studies!', tipo: 'system', lida: false, createdAt: Date.now()
  });
  toast('Conta criada! 🎉', 'success');
}

async function handleLogout() {
  if (!confirm('Sair?')) return;
  await auth.signOut();
  S.user = null;
  S.ud = null;
}

// ========== AUTH LISTENER ==========
auth.onAuthStateChanged(async (user) => {
  if (user) {
    S.user = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    S.ud = snap.val() || {};
    if (!S.ud.username) {
      S.ud = {
        uid: user.uid, username: user.email?.split('@')[0] || 'user', email: user.email,
        avatar: '🎓', bio: '', points: 0, quizzesPlayed: 0, materiasCreated: 0,
        seguidores: 0, isAdmin: false, createdAt: Date.now()
      };
      await db.ref('usuarios/' + user.uid).set(S.ud);
    }
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    updateUI();
    navigate('home');
    if (S.ud.isAdmin) $('nav-adm').style.display = '';
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
  $('sidebar-name').textContent = u.username || '?';
  $('sidebar-pts').textContent = fmt(u.points);
  const av = u.avatar || '🎓';
  $('sidebar-avatar').textContent = av;
  $('topbar-avatar').textContent = av;
  $('pc-avatar').textContent = av;
  $('perfil-avatar').textContent = av;
  $('perfil-name').textContent = u.username || '--';
  $('perfil-email').textContent = u.email || '--';
  $('home-greeting').textContent = 'Olá, ' + (u.username || 'Estudante').split(' ')[0] + '! 👋';
}

// ========== NAVEGAÇÃO ==========
function navigate(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-' + name);
  if (t) t.classList.add('active');
  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.remove('open');
  const overlay = $('sidebar-overlay');
  if (overlay) overlay.classList.remove('show');
  if (name === 'home') loadHome();
  if (name === 'materias') loadMaterias();
  if (name === 'descobrir') loadFeed();
  if (name === 'ranking') loadRanking();
  if (name === 'chat') loadChat();
  if (name === 'perfil') loadPerfil();
  if (name === 'notificacoes') loadNotifs();
  if (name === 'adm') loadAdm();
}

function toggleSidebar() {
  const s = $('sidebar');
  const o = $('sidebar-overlay');
  if (s) s.classList.toggle('open');
  if (o) o.classList.toggle('show');
}

function openModal(id) {
  const m = document.getElementById('modal-' + id);
  if (m) m.classList.add('show');
  if (id === 'quiz-normal') {
    questoesNormais = [];
    const container = $('qn-questoes-container');
    if (container) container.innerHTML = '';
    addQuestaoNormal();
  }
}

function closeModal(id) {
  const m = document.getElementById('modal-' + id);
  if (m) m.classList.remove('show');
}

// ========== HOME ==========
async function loadHome() {
  if (!S.ud) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();
  const pts = S.ud.points || 0;
  const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];
  const names = ['Iniciante', 'Aprendiz', 'Estudante', 'Dedicado', 'Scholar', 'Mestre', 'Especialista', 'Professor', 'Guru', 'Sábio', 'Lenda'];
  let lvl = 0;
  for (let i = 0; i < levels.length; i++) { if (pts >= levels[i]) lvl = i; }
  const nxt = levels[Math.min(lvl + 1, levels.length - 1)];
  const cur = levels[lvl];
  const pct = Math.min(((pts - cur) / (nxt - cur)) * 100, 100);
  $('level-badge').textContent = '📈 Nível ' + (lvl + 1) + ' - ' + names[lvl];
  $('stat-pontos').textContent = fmt(pts);
  $('stat-quizzes').textContent = S.ud.quizzesPlayed || 0;
  $('progress-text').textContent = fmt(pts) + '/' + fmt(nxt) + ' pts';
  const pf = $('progress-fill');
  if (pf) pf.style.width = pct + '%';
  const ms = await db.ref('materias').once('value');
  let cnt = 0;
  if (ms.val()) cnt = Object.values(ms.val()).filter(m => m.autorId === S.user.uid).length;
  $('stat-materias').textContent = cnt;
  const us = await db.ref('usuarios').once('value');
  if (us.val()) {
    const arr = Object.values(us.val()).sort((a, b) => (b.points || 0) - (a.points || 0));
    const pos = arr.findIndex(u => u.uid === S.user.uid);
    $('stat-rank').textContent = pos >= 0 ? '#' + (pos + 1) : '#--';
  }
  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value', snap => {
    const posts = snap.val();
    const c = $('home-feed');
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;">📭 Nenhum post</div>'; return; }
    const arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    c.innerHTML = arr.map(p => feedHTML(p, true)).join('');
  });
}

function feedHTML(p, compact) {
  return `<div class="card">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${esc(p.avatar || '?')}</div>
      <div><span style="font-weight:700;">${esc(p.autorNome || '?')}</span> <span style="color:var(--text3);font-size:11px;">${ago(p.createdAt)}</span></div>
    </div>
    <div>${esc(p.texto)}</div>
    ${!compact ? `<div style="margin-top:8px;">
      <button onclick="likePost('${p.id}')" style="border:none;background:none;cursor:pointer;font-weight:600;color:var(--text3);">❤️ ${p.likes ? Object.keys(p.likes).length : 0}</button>
      ${p.autorId === S.user?.uid ? `<button onclick="deletePost('${p.id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-weight:600;">🗑</button>` : ''}
    </div>` : ''}
  </div>`;
}

// ========== MATÉRIAS ==========
function loadMaterias() {
  db.ref('materias').on('value', snap => {
    const mat = snap.val();
    const c = $('materias-grid');
    if (!mat) { c.innerHTML = '<div style="color:var(--text3);padding:15px;">📚 Nenhuma matéria</div>'; return; }
    let arr = Object.entries(mat).map(([id, m]) => ({ id, ...m }));
    if (S.mFilter === 'mine') arr = arr.filter(m => m.autorId === S.user?.uid);
    const s = ($('search-materias')?.value || '').toLowerCase();
    if (s) arr = arr.filter(m => (m.nome || '').toLowerCase().includes(s));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    c.innerHTML = arr.length ? arr.map(m => `<div class="card" onclick="openMateria('${m.id}')" style="cursor:pointer;display:flex;gap:12px;align-items:center;"><span style="font-size:35px;">${m.icone || '📚'}</span><div><div style="font-weight:700;">${esc(m.nome)}</div><div style="font-size:12px;color:var(--text3);">${esc(m.descricao || '')}</div></div></div>`).join('') : '<div style="color:var(--text3);padding:15px;">🔍 Nenhuma</div>';
  });
}

function setMateriaFilter(f, btn) { S.mFilter = f; loadMaterias(); }
function filterMaterias() { loadMaterias(); }

async function criarMateria() {
  const n = $('nm-nome').value.trim();
  const d = $('nm-desc').value.trim();
  if (!n) { toast('Nome obrigatório', 'error'); return; }
  await db.ref('materias').push({ nome: n, descricao: d, icone: '📚', autorId: S.user.uid, autorNome: S.ud.username, topicosCount: 0, createdAt: Date.now() });
  closeModal('materia');
  $('nm-nome').value = '';
  $('nm-desc').value = '';
  addPts(20);
  toast('Matéria criada!', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val();
  $('materia-hero-icon').textContent = m.icone || '📚';
  $('materia-hero-nome').textContent = m.nome;
  $('materia-hero-desc').textContent = m.descricao || '';
  $('materia-hero-autor').textContent = 'Por: ' + m.autorNome;
  navigate('materia-detalhe');
  db.ref('topicos/' + id).on('value', snap => {
    const t = snap.val();
    const c = $('topicos-list');
    if (!t) { c.innerHTML = '<div style="color:var(--text3);padding:10px;">Nenhum tópico</div>'; return; }
    c.innerHTML = Object.entries(t).map(([tid, top]) => `<div class="card" onclick="openTopico('${tid}')" style="cursor:pointer;">📄 ${esc(top.titulo)}</div>`).join('');
  });
  db.ref('quizzes/' + id).on('value', snap => {
    const q = snap.val();
    const c = $('quizzes-materia');
    if (!q) { c.innerHTML = '<div style="color:var(--text3);padding:10px;">Nenhum quiz</div>'; return; }
    c.innerHTML = Object.entries(q).map(([qid, quiz]) => `<div class="card" style="display:flex;justify-content:space-between;align-items:center;"><div><strong>🎮 ${esc(quiz.nome)}</strong><br><span style="font-size:12px;color:var(--text3);">${quiz.questoes?.length || 0} questões</span></div><button class="btn btn-primary btn-sm" onclick="startQuiz('${id}','${qid}')">▶ Jogar</button></div>`).join('');
  });
}

async function criarTopico() {
  const t = $('nt-titulo').value.trim();
  const c = $('nt-conteudo').value.trim();
  if (!t || !c) { toast('Preencha tudo', 'error'); return; }
  await db.ref('topicos/' + S.mid).push({ titulo: t, conteudo: c, autorId: S.user.uid, autorNome: S.ud.username, createdAt: Date.now() });
  closeModal('topico');
  $('nt-titulo').value = '';
  $('nt-conteudo').value = '';
  addPts(15);
  toast('Tópico criado!', 'success');
}

async function openTopico(id) {
  S.tid = id;
  const snap = await db.ref('topicos/' + S.mid + '/' + id).once('value');
  const t = snap.val();
  $('topico-title').textContent = t.titulo;
  $('topico-meta').textContent = 'Por ' + t.autorNome + ' · ' + ago(t.createdAt);
  $('topico-body').textContent = t.conteudo;
  navigate('topico-detalhe');
  db.ref('comentarios/' + S.mid + '/' + id).on('value', snap => {
    const com = snap.val();
    const c = $('topico-comentarios');
    if (!com) { c.innerHTML = '<div style="color:var(--text3);">Sem comentários</div>'; return; }
    c.innerHTML = Object.entries(com).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)).map(([cid, co]) => `<div class="card"><strong>${esc(co.autorNome)}</strong> · ${ago(co.createdAt)}<div>${esc(co.texto)}</div></div>`).join('');
  });
}

async function addComment() {
  const t = $('new-comment').value.trim();
  if (!t) return;
  await db.ref('comentarios/' + S.mid + '/' + S.tid).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, createdAt: Date.now() });
  $('new-comment').value = '';
  addPts(3);
}

// ========== QUIZ ==========
function addQuestaoNormal() {
  const idx = questoesNormais.length;
  questoesNormais.push({ pergunta: '', alternativas: ['', '', '', ''], correta: 0 });
  const div = document.createElement('div');
  div.style.cssText = 'background:var(--input-bg);border-radius:12px;padding:12px;margin-bottom:10px;border:2px solid var(--border);';
  div.innerHTML = `<strong>Questão ${idx + 1}</strong>
    <input class="input-field" placeholder="Pergunta" oninput="questoesNormais[${idx}].pergunta=this.value" />
    ${['A', 'B', 'C', 'D'].map((l, i) => `<div style="display:flex;align-items:center;gap:8px;margin-top:5px;">
      <input type="radio" name="qc${idx}" value="${i}" ${i === 0 ? 'checked' : ''} onchange="questoesNormais[${idx}].correta=${i}" />
      <span>${l})</span><input class="input-field" placeholder="Alt ${l}" style="margin:0;" oninput="questoesNormais[${idx}].alternativas[${i}]=this.value" />
    </div>`).join('')}`;
  $('qn-questoes-container').appendChild(div);
}

async function salvarQuizNormal() {
  const nome = $('qn-nome').value.trim();
  const tempo = parseInt($('qn-tempo').value) || 30;
  if (!nome) { toast('Nome obrigatório', 'error'); return; }
  const validas = questoesNormais.filter(q => q.pergunta.trim() && q.alternativas.filter(a => a.trim()).length >= 2);
  if (!validas.length) { toast('Adicione questões', 'error'); return; }
  await db.ref('quizzes/' + S.mid).push({ nome, tempo, questoes: validas, autorId: S.user.uid, autorNome: S.ud.username, totalPlays: 0, createdAt: Date.now() });
  closeModal('quiz-normal');
  addPts(30);
  toast('Quiz criado!', 'success');
}

async function processarCmd() {
  const input = $('cmd-input').value;
  if (!input.trim()) return toast('Digite os comandos', 'error');
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  let nome = '', questoes = [], curQ = null, alts = [], corr = -1, tempo = 30;
  for (const l of lines) {
    if (l.startsWith('/n ')) nome = l.substring(3);
    else if (l.startsWith('/t ')) tempo = parseInt(l.substring(3)) || 30;
    else if (l.startsWith('/q ')) {
      if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts; curQ.correta = corr; questoes.push(curQ); }
      curQ = { pergunta: l.substring(3) }; alts = []; corr = -1;
    }
    else if (l.startsWith('/a ')) alts.push(l.substring(3));
    else if (l.startsWith('/c ')) { const map = { A: 0, B: 1, C: 2, D: 3 }; corr = map[l.substring(3).toUpperCase()] ?? -1; }
    else if (l === '/f') { if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts; curQ.correta = corr; questoes.push(curQ); curQ = null; alts = []; corr = -1; } }
  }
  if (curQ && alts.length >= 2 && corr >= 0) { curQ.alternativas = alts; curQ.correta = corr; questoes.push(curQ); }
  if (!nome) return toast('Use /n para o nome', 'error');
  if (!questoes.length) return toast('Adicione questões', 'error');
  await db.ref('quizzes/' + S.mid).push({ nome, tempo, questoes, autorId: S.user.uid, autorNome: S.ud.username, totalPlays: 0, createdAt: Date.now() });
  closeModal('quiz-cmd');
  $('cmd-input').value = '';
  addPts(30);
  toast('Quiz criado!', 'success');
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val();
  S.quiz = { q: shuffle([...q.questoes]), i: 0, score: 0, corr: 0, timer: null, left: q.tempo || 30, start: Date.now(), ans: [], nome: q.nome, mId, qId };
  navigate('quiz-game');
  renderQ();
}

function renderQ() {
  const g = S.quiz;
  if (g.i >= g.q.length) { finishQ(); return; }
  const q = g.q[g.i];
  $('quiz-q-counter').textContent = (g.i + 1) + '/' + g.q.length;
  $('quiz-q-num').textContent = 'Questão ' + (g.i + 1);
  $('quiz-question').textContent = q.pergunta;
  const pf = $('quiz-progress-fill');
  if (pf) pf.style.width = ((g.i) / g.q.length * 100) + '%';
 $('quiz-options').innerHTML = q.alternativas.map((a,i)=>`
  <button onclick="selectA(${i})" id="opt-${i}" style="display:block;width:100%;padding:14px;margin-bottom:8px;border:2px solid var(--border);border-radius:12px;background:var(--card);text-align:left;font-size:15px;cursor:pointer;transition:0.2s;">
    <span class="opt-letter" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;font-weight:700;font-size:14px;margin-right:12px;flex-shrink:0;">${['A','B','C','D'][i]}</span>${esc(a)}
  </button>
`).join('');
  clearInterval(g.timer);
  g.left = S.quiz.left || 30;
  $('quiz-timer').textContent = '⏱ ' + g.left + 's';
  g.timer = setInterval(() => {
    g.left--;
    $('quiz-timer').textContent = '⏱ ' + g.left + 's';
    if (g.left <= 0) { clearInterval(g.timer); selectA(-1); }
  }, 1000);
}

function selectA(c) {
  clearInterval(S.quiz.timer);
  const g = S.quiz, q = g.q[g.i], corr = q.correta, ok = c === corr;
  document.querySelectorAll('#quiz-options button').forEach((b, i) => {
    b.disabled = true;
  if(i===corr) {
  b.style.background='#d1fae5';
  b.style.borderColor='#10b981';
  const letter = b.querySelector('.opt-letter');
  if(letter) letter.style.background='#10b981';
}
if(i===c&&!ok) {
  b.style.background='#fee2e2';
  b.style.borderColor='#ef4444';
  const letter = b.querySelector('.opt-letter');
  if(letter) letter.style.background='#ef4444';
}
  });
  if (ok) { const pts = Math.max(10, Math.round(10 + (g.left / 30) * 10)); g.score += pts; g.corr++; g.ans.push({ isCorrect: true, pts }); }
  else { g.ans.push({ isCorrect: false, pts: 0 }); }
  $('quiz-score-live').textContent = g.score;
  setTimeout(() => { g.i++; renderQ(); }, 1500);
}

async function finishQ() {
  clearInterval(S.quiz.timer);
  const g = S.quiz, total = g.q.length, elapsed = Math.round((Date.now() - g.start) / 1000), pct = Math.round((g.corr / total) * 100);
  const bonus = pct >= 90 ? 50 : pct >= 70 ? 30 : pct >= 50 ? 15 : 0, totalPts = g.score + bonus;
  await db.ref('historico/' + S.user.uid).push({ quizNome: g.nome, score: totalPts, acertos: g.corr, total, pct, tempo: elapsed, createdAt: Date.now() });
  await addPts(totalPts);
  await db.ref('usuarios/' + S.user.uid).update({ quizzesPlayed: (S.ud.quizzesPlayed || 0) + 1 });
  navigate('resultado');
  $('res-acertos').textContent = g.corr;
  $('res-total').textContent = total;
  $('res-pontos').textContent = '+' + totalPts;
  $('res-tempo').textContent = elapsed + 's';
  $('resultado-pct').textContent = pct + '%';
  const rb = $('resultado-barra-fill');
  if (rb) rb.style.width = pct + '%';
  $('resultado-review').innerHTML = g.ans.map(a => `<div style="padding:8px;border-radius:8px;margin-bottom:5px;background:${a.isCorrect ? '#d1fae5' : '#fee2e2'};border-left:3px solid ${a.isCorrect ? '#10b981' : '#ef4444'};">${a.isCorrect ? '✅' : '❌'} ${a.isCorrect ? '+' + a.pts + 'pts' : ''}</div>`).join('');
}

function exitQuiz() { if (!confirm('Sair?')) return; clearInterval(S.quiz.timer); navigate('materia-detalhe'); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ========== FEED ==========
function loadFeed() {
  db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value', snap => {
    const posts = snap.val();
    const c = $('descobrir-feed');
    if (!posts) { c.innerHTML = '<div style="color:var(--text3);padding:15px;">📭 Nenhum post</div>'; return; }
    let arr = Object.entries(posts).map(([id, p]) => ({ id, ...p })).reverse();
    if (S.fFilter !== 'all') arr = arr.filter(p => p.tipo === S.fFilter);
    c.innerHTML = arr.length ? arr.map(p => feedHTML(p)).join('') : '<div style="color:var(--text3);padding:15px;">📭 Nenhum post</div>';
  });
}

function setPostType(t, btn) {
  S.pType = t;
  document.querySelectorAll('#screen-descobrir .btn-sm').forEach(b => {
    if (['💬 Post', '💡 Dica', '❓ Dúvida'].some(x => b.textContent.includes(x))) {
      b.style.cssText = 'background:white;color:var(--text);border:2px solid var(--border);border-radius:20px;';
    }
  });
  if (btn) btn.style.cssText = 'background:#6C5CE7;color:white;border:none;border-radius:20px;';
}

function setFeedFilter(f, btn) {
  S.fFilter = f;
  document.querySelectorAll('#screen-descobrir .btn-sm').forEach(b => {
    if (['Todos', 'Posts', 'Dicas', 'Dúvidas', 'Usuários'].some(x => b.textContent.includes(x))) {
      b.style.cssText = 'background:white;color:var(--text);border:2px solid var(--border);border-radius:20px;';
    }
  });
  if (btn) btn.style.cssText = 'background:#6C5CE7;color:white;border:none;border-radius:20px;';
  if (f === 'usuarios') {
    const si = $('search-users-input');
    if (si) si.style.display = '';
    loadAllUsers();
  } else {
    const si = $('search-users-input');
    if (si) si.style.display = 'none';
    loadFeed();
  }
}

async function createPost() {
  const t = $('new-post-text').value.trim();
  if (!t) return toast('Escreva algo', 'error');
  await db.ref('posts').push({ texto: t, tipo: S.pType, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  $('new-post-text').value = '';
  addPts(5);
  toast('Publicado!', 'success');
}

async function criarPostModal() {
  const t = $('post-texto-modal').value.trim();
  const tp = $('post-tipo-modal').value;
  if (!t) return toast('Escreva algo', 'error');
  await db.ref('posts').push({ texto: t, tipo: tp, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  closeModal('post');
  addPts(5);
  toast('Publicado!', 'success');
}

async function likePost(id) {
  if (!S.user) return;
  const ref = db.ref('posts/' + id + '/likes/' + S.user.uid);
  const snap = await ref.once('value');
  if (snap.val()) await ref.remove();
  else await ref.set(true);
}

async function deletePost(id) {
  if (!confirm('Excluir?')) return;
  await db.ref('posts/' + id).remove();
  toast('Excluído', 'info');
}

async function loadAllUsers() {
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  const c = $('descobrir-feed');
  if (!users) { c.innerHTML = '<div style="color:var(--text3);padding:15px;">Nenhum usuário</div>'; return; }
  renderUserList(users);
}

async function searchUsers() {
  const term = ($('search-users-input').value || '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!term) { renderUserList(users); return; }
  const filt = {};
  Object.entries(users).forEach(([id, u]) => { if ((u.username || '').toLowerCase().includes(term)) filt[id] = u; });
  renderUserList(filt);
}

function renderUserList(users) {
  const arr = Object.entries(users).map(([id, u]) => ({ id, ...u })).sort((a, b) => (b.points || 0) - (a.points || 0));
  const c = $('descobrir-feed');
  c.innerHTML = arr.map(u => {
    const isMe = u.id === S.user?.uid;
    const badges = [];
    if (u.isProf) badges.push('<span style="color:#6C5CE7;font-size:14px;" title="Professor Verificado">✅</span>');
    if (u.isAdmin) badges.push('<span style="color:#f59e0b;font-size:14px;" title="Administrador">⚙️</span>');
    
    return `<div class="card" onclick="${isMe ? "navigate('perfil')" : "verPerfil('" + u.id + "')"}" style="cursor:pointer;display:flex;align-items:center;gap:10px;">
      <div style="width:40px;height:40px;border-radius:50%;background:${u.isProf ? 'linear-gradient(135deg,#6C5CE7,#10b981)' : '#6C5CE7'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">${u.avatar || '🎓'}</div>
      <div style="flex:1;">
        <strong>${esc(u.username)} ${badges.join(' ')}</strong>
        ${isMe ? '<span style="background:#6C5CE7;color:white;padding:2px 8px;border-radius:10px;font-size:10px;">Você</span>' : ''}
        <br><span style="font-size:12px;color:var(--text3);">⭐ ${fmt(u.points)} pts · 👥 ${u.seguidores || 0} seguidores</span>
      </div>
      ${!isMe ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();toggleFollowUser('${u.id}',this)">Seguir</button>` : ''}
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
    if (btn) btn.textContent = 'Seguir';
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 ' + S.ud.username + ' te seguiu!', tipo: 'follow', lida: false, createdAt: Date.now() });
    if (btn) { btn.textContent = '✅ Seguindo'; btn.style.background = '#10b981'; }
  }
}
// ========== CHAT ==========
function loadChat() {
  db.ref('chat_rooms').on('value', snap => {
    const rooms = snap.val();
    const c = $('rooms-list');
    if (!rooms) { c.innerHTML = '<div style="padding:10px;color:var(--text3);">Nenhuma sala</div>'; return; }
    c.innerHTML = Object.entries(rooms).map(([id, r]) => `<div onclick="joinRoom('${id}')" style="padding:10px;cursor:pointer;border-bottom:1px solid var(--border);${S.room === id ? 'background:var(--hover);' : ''}"># ${esc(r.nome)}</div>`).join('');
  });
  loadPVList();
}

async function loadPVList() {
  const c = $('pv-list');
  if (!c || !S.user) return;
  const snap = await db.ref('private_chats').once('value');
  const chats = snap.val();
  if (!chats) { c.innerHTML = '<div style="padding:10px;color:var(--text3);">Nenhuma conversa</div>'; return; }
  const userChats = Object.entries(chats).filter(([chatId]) => chatId.split('_').includes(S.user.uid));
  if (!userChats.length) { c.innerHTML = '<div style="padding:10px;color:var(--text3);">Nenhuma conversa</div>'; return; }
  let html = '';
  for (const [chatId, msgs] of userChats) {
    const otherUid = chatId.split('_').find(p => p !== S.user.uid);
    if (!otherUid) continue;
    const uSnap = await db.ref('usuarios/' + otherUid).once('value');
    const u = uSnap.val();
    if (!u) continue;
    const arr = Object.values(msgs || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    html += `<div onclick="openPV('${otherUid}')" style="padding:10px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;">${u.avatar || '?'}</div>
      <div><div style="font-weight:600;font-size:12px;">${esc(u.username)}</div><div style="font-size:10px;color:var(--text3);">${esc(arr[0]?.texto || 'Nova conversa')}</div></div>
    </div>`;
  }
  c.innerHTML = html;
}

function joinRoom(id) {
  S.room = id;
  if (S.roomListener) S.roomListener();
  db.ref('chat_rooms/' + id).once('value').then(s => { $('chat-room-name').textContent = '# ' + (s.val()?.nome || 'Sala'); });
  $('chat-no-room').style.display = 'none';
  $('chat-room-view').style.display = 'flex';
  $('pv-chat-view').style.display = 'none';
  S.roomListener = db.ref('chat_messages/' + id).on('value', snap => {
    const msgs = snap.val();
    const c = $('chat-messages');
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);">Vazio</div>'; return; }
    c.innerHTML = Object.entries(msgs).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)).map(([mid, m]) => `<div style="display:flex;flex-direction:${m.autorId === S.user?.uid ? 'row-reverse' : 'row'};gap:8px;margin-bottom:8px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;cursor:pointer;" onclick="${m.autorId !== S.user?.uid ? "openPV('" + m.autorId + "')" : ''}">${esc(m.avatar || '?')}</div>
      <div style="max-width:70%;padding:10px 14px;border-radius:18px;background:${m.autorId === S.user?.uid ? '#6C5CE7' : 'var(--input-bg)'};color:${m.autorId === S.user?.uid ? 'white' : 'var(--text)'};">${esc(m.texto)}<div style="font-size:9px;opacity:0.7;">${ago(m.createdAt)}</div></div>
    </div>`).join('');
    c.scrollTop = c.scrollHeight;
  });
}

function leaveRoom() {
  if (S.roomListener) S.roomListener();
  S.room = null;
  $('chat-no-room').style.display = 'flex';
  $('chat-room-view').style.display = 'none';
}

function openPV(uid) {
  if (uid === S.user?.uid) return;
  S.pvUser = uid;
  db.ref('usuarios/' + uid).once('value').then(s => {
    const u = s.val();
    if (u) { $('pv-chat-avatar').textContent = u.avatar || '?'; $('pv-chat-name').textContent = u.username; }
  });
  $('chat-room-view').style.display = 'none';
  $('chat-no-room').style.display = 'none';
  $('pv-chat-view').style.display = 'flex';
  const chatId = [S.user.uid, uid].sort().join('_');
  if (S.pvListener) S.pvListener();
  S.pvListener = db.ref('private_chats/' + chatId).on('value', snap => {
    const msgs = snap.val();
    const c = $('pv-chat-messages');
    if (!msgs) { c.innerHTML = '<div style="color:var(--text3);">Diga olá!</div>'; return; }
    c.innerHTML = Object.entries(msgs).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)).map(([mid, m]) => `<div style="display:flex;flex-direction:${m.autorId === S.user?.uid ? 'row-reverse' : 'row'};gap:8px;margin-bottom:8px;">
      <div style="max-width:70%;padding:10px 14px;border-radius:18px;background:${m.autorId === S.user?.uid ? '#6C5CE7' : 'var(--input-bg)'};color:${m.autorId === S.user?.uid ? 'white' : 'var(--text)'};">${esc(m.texto)}</div>
    </div>`).join('');
    c.scrollTop = c.scrollHeight;
  });
}

function closePV() {
  if (S.pvListener) S.pvListener();
  S.pvUser = null;
  $('pv-chat-view').style.display = 'none';
  if (S.room) { $('chat-room-view').style.display = 'flex'; }
  else { $('chat-no-room').style.display = 'flex'; }
}

async function sendChatMsg() {
  const t = $('chat-msg-input').value.trim();
  if (!t || !S.room) return;
  await db.ref('chat_messages/' + S.room).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  $('chat-msg-input').value = '';
}

async function sendPvChatMsg() {
  const t = $('pv-chat-input').value.trim();
  if (!t || !S.pvUser) return;
  const chatId = [S.user.uid, S.pvUser].sort().join('_');
  await db.ref('private_chats/' + chatId).push({ texto: t, autorId: S.user.uid, autorNome: S.ud.username, avatar: S.ud.avatar, createdAt: Date.now() });
  await db.ref('notificacoes/' + S.pvUser).push({ mensagem: '💬 ' + S.ud.username + ' te enviou mensagem!', tipo: 'message', lida: false, fromUid: S.user.uid, createdAt: Date.now() });
  $('pv-chat-input').value = '';
}

async function criarSala() {
  const n = $('ns-nome').value.trim();
  if (!n) return toast('Nome obrigatório', 'error');
  const ref = await db.ref('chat_rooms').push({ nome: n, descricao: $('ns-desc').value.trim(), criadorId: S.user.uid, createdAt: Date.now() });
  closeModal('sala');
  joinRoom(ref.key);
  toast('Sala criada! 💬', 'success');
}

async function searchUsersToInvite() {
  const term = ($('invite-search').value || '').toLowerCase();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  let arr = Object.entries(users).map(([id, u]) => ({ id, ...u })).filter(u => u.id !== S.user?.uid);
  if (term) arr = arr.filter(u => (u.username || '').toLowerCase().includes(term));
  $('invite-users-list').innerHTML = arr.map(u => `<div onclick="toggleInviteUser('${u.id}',this)" style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;border-radius:10px;background:${selectedInviteUsers.includes(u.id) ? 'var(--hover)' : 'transparent'};">
    <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${u.avatar || '?'}</div>
    <span>${esc(u.username)}</span><span>${selectedInviteUsers.includes(u.id) ? '✅' : '○'}</span>
  </div>`).join('');
}

function toggleInviteUser(uid, el) {
  const i = selectedInviteUsers.indexOf(uid);
  if (i > -1) { selectedInviteUsers.splice(i, 1); el.style.background = 'transparent'; }
  else { selectedInviteUsers.push(uid); el.style.background = 'var(--hover)'; }
  $('invite-selected').textContent = selectedInviteUsers.length + ' selecionados';
}

async function sendInvites() {
  if (!selectedInviteUsers.length) return toast('Selecione alguém', 'info');
  if (!S.room) return toast('Entre numa sala primeiro', 'error');
  const roomSnap = await db.ref('chat_rooms/' + S.room).once('value');
  const roomName = roomSnap.val()?.nome || 'Sala';
  for (const uid of selectedInviteUsers) {
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 ' + S.ud.username + ' te convidou para: ' + roomName + '!', tipo: 'invite', lida: false, roomId: S.room, createdAt: Date.now() });
  }
  toast('Convites enviados! 📨', 'success');
  closeModal('invite');
  selectedInviteUsers = [];
}

// ========== RANKING ==========
function loadRanking() {
  db.ref('usuarios').on('value', snap => {
    const users = snap.val();
    if (!users) return;
    const arr = Object.values(users).sort((a, b) => (b.points || 0) - (a.points || 0));
    const podio = $('podio');
    podio.innerHTML = '';
    const setP = (n, u) => {
      if (!u) return;
      podio.innerHTML += `<div style="text-align:center;"><div style="width:${n===1?65:55}px;height:${n===1?65:55}px;border-radius:50%;background:${n===1?'#ffd700':'#ddd'};margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:${n===1?28:24}px;">${u.avatar||'?'}</div><div style="font-weight:700;">${(u.username||'').split(' ')[0]}</div><div style="color:#6C5CE7;">${fmt(u.points)}</div></div>`;
    };
    setP(1, arr[0]); setP(2, arr[1]); setP(3, arr[2]);
    const pos = arr.findIndex(u => u.uid === S.user?.uid);
    $('my-rank-num').textContent = pos >= 0 ? '#' + (pos + 1) : '#--';
    $('my-rank-pts').textContent = fmt(arr[pos]?.points || 0);
    $('ranking-list').innerHTML = arr.slice(0, 50).map((u, i) => `<div class="card" onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;cursor:pointer;${u.uid===S.user?.uid?'background:var(--hover);':''}"><span style="font-weight:800;width:24px;">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${esc(u.avatar||'?')}</div><div style="flex:1;"><strong>${esc(u.username)} ${u.isProf ? '✅' : ''}</strong>${u.uid===S.user?.uid?' (Você)':''}</div><span style="font-weight:700;color:#6C5CE7;">${fmt(u.points)}</span></div>`).join('');
  });
}

// ========== PERFIL ==========
async function verPerfil(uid) {
  if (!uid) return;
  if (uid === S.user?.uid) { navigate('perfil'); return; }
  viewingUserId = uid;
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;

  const fSnap = await db.ref('seguidores/' + S.user.uid + '/' + uid).once('value');
  const isFollowing = fSnap.val() ? true : false;

  $('user-profile-content').innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:60px;">${u.avatar || '🎓'}</div>
      <h3>${esc(u.username || '?')}</h3>
      <p style="color:var(--text3);">${esc(u.bio || 'Sem bio')}</p>
      <div style="margin:10px 0;">
        <span style="background:var(--hover);padding:5px 12px;border-radius:15px;font-weight:600;">⭐ ${fmt(u.points || 0)} pts</span>
        <span style="background:var(--hover);padding:5px 12px;border-radius:15px;font-weight:600;margin-left:5px;">👥 ${u.seguidores || 0} seguidores</span>
      </div>
      <button class="btn btn-primary btn-full" id="btn-follow-modal" onclick="toggleFollowUserModal('${uid}')" style="margin-top:8px;background:${isFollowing ? '#10b981' : '#6C5CE7'};">
        ${isFollowing ? '✅ Seguindo' : '👥 Seguir'}
      </button>
      <button class="btn btn-green btn-full" onclick="closeModal('user');navigate('chat');setTimeout(function(){openPV('${uid}');},500);" style="margin-top:5px;">
        💬 Enviar Mensagem
      </button>
    </div>
  `;

  openModal('user');
}
// Nova função para seguir do modal
async function toggleFollowUserModal(uid) {
  const ref = db.ref('seguidores/' + S.user.uid + '/' + uid);
  const snap = await ref.once('value');
  const btn = document.getElementById('btn-follow-modal');

  if (snap.val()) {
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + S.user.uid).remove();
    if (btn) { btn.textContent = '👥 Seguir'; btn.style.background = '#6C5CE7'; }
    toast('Deixou de seguir', 'info');
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + S.user.uid).set(true);
    await db.ref('notificacoes/' + uid).push({ mensagem: '👥 ' + S.ud.username + ' te seguiu!', tipo: 'follow', lida: false, createdAt: Date.now() });
    if (btn) { btn.textContent = '✅ Seguindo'; btn.style.background = '#10b981'; }
    toast('Seguindo! 👥', 'success');
  }
}

async function showFollowers() {
  const uid = viewingUserId || S.user?.uid;
  const snap = await db.ref('seguindo/' + uid).once('value');
  const data = snap.val();
  let html = '';
  if (data) { for (const sid of Object.keys(data)) { const u = await db.ref('usuarios/' + sid).once('value'); if (u.val()) html += u.val().username + '\n'; } }
  alert('Seguidores:\n' + (html || 'Nenhum'));
}

async function showFollowing() {
  const uid = viewingUserId || S.user?.uid;
  const snap = await db.ref('seguidores/' + uid).once('value');
  const data = snap.val();
  let html = '';
  if (data) { for (const fid of Object.keys(data)) { const u = await db.ref('usuarios/' + fid).once('value'); if (u.val()) html += u.val().username + '\n'; } }
  alert('Seguindo:\n' + (html || 'Nenhum'));
}

async function loadPerfil() {
  if (!S.ud) return;
  const snap = await db.ref('usuarios/' + S.user.uid).once('value');
  if (snap.val()) S.ud = snap.val();
  updateUI();
  viewingUserId = null;
  $('pstat-pts').textContent = fmt(S.ud.points);
  $('pstat-quizzes').textContent = S.ud.quizzesPlayed || 0;
  $('pstat-materias').textContent = S.ud.materiasCreated || 0;
  $('pstat-seguidores').textContent = S.ud.seguidores || 0;
  const segSnap = await db.ref('seguindo/' + S.user.uid).once('value');
  $('count-seguidores').textContent = segSnap.val() ? Object.keys(segSnap.val()).length : 0;
  const seguSnap = await db.ref('seguidores/' + S.user.uid).once('value');
  $('count-seguindo').textContent = seguSnap.val() ? Object.keys(seguSnap.val()).length : 0;
  const badges = [];
  if ((S.ud.points || 0) >= 1000) badges.push('<span class="badge" style="background:#fef3c7;color:#92400e;">⭐ 1K</span>');
  if ((S.ud.quizzesPlayed || 0) >= 10) badges.push('<span class="badge" style="background:#dbeafe;color:#1d4ed8;">🎮 Gamer</span>');
  if (S.ud.isAdmin) badges.push('<span class="badge" style="background:#fef3c7;color:#92400e;">⚙️ Admin</span>');
  if (S.ud.isProf) badges.push('<span class="badge" style="background:#e0e7ff;color:#6C5CE7;">✅ Professor</span>');
  $('perfil-badges').innerHTML = badges.join('') || '<span class="badge">🌱 Novato</span>';
  const hs = await db.ref('historico/' + S.user.uid).once('value');
  const h = hs.val();
  $('perfil-historico').innerHTML = h ? Object.entries(h).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0)).map(([id, x]) => `<div class="card" style="display:flex;justify-content:space-between;"><span>🎮 ${esc(x.quizNome)}</span><span style="color:#10b981;">+${fmt(x.score)}</span></div>`).join('') : '<div style="color:var(--text3);">Nenhum quiz</div>';
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs() {
  if (!S.user) return;
  db.ref('notificacoes/' + S.user.uid).on('value', snap => {
    const n = snap.val();
    const badge = $('notif-badge');
    if (!n) { badge.style.display = 'none'; return; }
    const unread = Object.values(n).filter(x => !x.lida).length;
    if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  });
}

async function loadNotifs() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = snap.val();
  $('notificacoes-list').innerHTML = n ? Object.entries(n).reverse().map(([id, x]) => `<div class="card ${!x.lida ? 'unread' : ''}" onclick="${x.roomId ? "navigate('chat');joinRoom('" + x.roomId + "')" : ''}" style="cursor:pointer;"><div>${esc(x.mensagem)}</div><div style="font-size:11px;color:var(--text3);">${ago(x.createdAt)}</div></div>`).join('') : '<div style="color:var(--text3);">🔔 Nenhuma notificação</div>';
  const updates = {};
  if (n) Object.entries(n).forEach(([id, x]) => { if (!x.lida) updates[id + '/lida'] = true; });
  if (Object.keys(updates).length) await db.ref('notificacoes/' + S.user.uid).update(updates);
}

async function marcarLidas() {
  if (!S.user) return;
  const snap = await db.ref('notificacoes/' + S.user.uid).once('value');
  const n = snap.val();
  if (!n) return;
  const u = {};
  Object.keys(n).forEach(id => { u[id + '/lida'] = true; });
  await db.ref('notificacoes/' + S.user.uid).update(u);
  toast('Todas lidas ✓', 'info');
}

// ========== PONTOS ==========
async function addPts(pts) {
  if (!S.user) return;
  const cur = (await db.ref('usuarios/' + S.user.uid + '/points').once('value')).val() || 0;
  const nw = cur + pts;
  await db.ref('usuarios/' + S.user.uid).update({ points: nw });
  S.ud.points = nw;
  updateUI();
}

// ========== ADM ==========
async function loadAdm() {
  if (!S.ud?.isAdmin) return toast('Acesso negado', 'error');
  const us = await db.ref('usuarios').once('value');
  $('adm-users').textContent = us.val() ? Object.keys(us.val()).length : 0;
  const ps = await db.ref('posts').once('value');
  $('adm-posts').textContent = ps.val() ? Object.keys(ps.val()).length : 0;
  admLoad('materias');
}

async function admLoad(tab, btn) {
  const c = $('adm-content-list');
  if (tab === 'materias') {
    const s = await db.ref('materias').once('value');
    const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(([id, m]) => `<div class="card" style="display:flex;justify-content:space-between;"><span>${m.icone || '📚'} ${esc(m.nome)}</span><button class="btn-red btn-sm" onclick="admDel('materias','${id}')">🗑</button></div>`).join('') : 'Nenhuma';
  } else if (tab === 'posts') {
    const s = await db.ref('posts').once('value');
    const d = s.val();
    c.innerHTML = d ? Object.entries(d).map(([id, p]) => `<div class="card" style="display:flex;justify-content:space-between;"><span>${esc(p.autorNome)}: ${esc((p.texto || '').substring(0, 40))}</span><button class="btn-red btn-sm" onclick="admDel('posts','${id}')">🗑</button></div>`).join('') : 'Nenhum';
  } else if (tab === 'usuarios') {
    const s = await db.ref('usuarios').once('value');
    const d = s.val();
 c.innerHTML = d ? Object.values(d).map(u => `
  <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
    <span>
      ${u.avatar} ${esc(u.username)} ${u.isProf ? '✅' : ''} ${u.isAdmin ? '⚙️' : ''} · ${fmt(u.points)} pts
    </span>
    <div style="display:flex;gap:5px;">
      ${!u.isAdmin && u.uid !== S.user?.uid ? `
        <button class="btn btn-sm" onclick="admToggleProf('${u.uid}')" style="background:${u.isProf ? '#fef3c7' : '#e0e0e0'};color:#333;box-shadow:none;font-size:11px;">
          ${u.isProf ? '✅ Prof' : '👨‍🏫 Tornar Prof'}
        </button>
        <button class="btn-red btn-sm" onclick="admDelUser('${u.uid}')">🗑</button>
      ` : ''}
    </div>
  </div>
`).join('') : 'Nenhum';
  }
}

async function admDel(path, id) {
  if (!confirm('Excluir?')) return;
  await db.ref(path + '/' + id).remove();
  admLoad('materias');
}

async function admDelUser(uid) {
  if (!confirm('Excluir permanentemente?')) return;
  await db.ref('usuarios/' + uid).remove();
  admLoad('usuarios');
}

async function admAddPts() {
  const pts = parseInt($('adm-add-pts').value);
  if (!pts) return;
  await addPts(pts);
  $('adm-add-pts').value = '';
  toast('+' + fmt(pts) + ' pontos!', 'success');
}

// ========== CLOSE MODALS ==========
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
  }
});
// ========== TORNAR PROFESSOR ==========
async function admToggleProf(uid) {
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;
  const novoStatus = !u.isProf;
  await db.ref('usuarios/' + uid).update({ isProf: novoStatus });
  toast(novoStatus ? '✅ Agora é Professor!' : '❌ Removeu Professor', 'success');
  admLoad('usuarios');
}
console.log('✅ Sexta-Feira Studies PRONTO!');