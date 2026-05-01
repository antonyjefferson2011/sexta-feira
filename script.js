'use strict';

console.log('✅ SCRIPT CARREGADO!');

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
const GROQ_KEY = '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';
const GEMINI_KEY = 'AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY';
const IMGBB_KEY = '86427cccd2a94fb42a0754ffd7f19e79';

// ========== IMAGENS ==========
const IMG = {
  logo: 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png',
  jarvis: 'https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png',
  seloAdmin: 'https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png',
  seloProf: 'https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png',
  seloPremium: 'https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png',
  seloQuizzer: 'https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png',
  seloVerificado: 'https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png',
  views: 'https://i.ibb.co/gM7qmW8N/a-small-40x40-pixel-icon-featuring-a-sty-a-RQDe-K8u-Qou-OYMXLa-TFmhw-VS-z-FS4-SRn-W1-Ru2-H6-Vm-FKw-sd.jpg'
};

// ========== STATE ==========
const S = {
  user: null,
  ud: null,
  mid: null,
  aid: null,
  quiz: { q: [], i: 0, score: 0, corr: 0, timer: null, left: 30, nome: '' }
};

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1e9) return (n/1e9).toFixed(1)+'B'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
function ago(t) { if (!t) return 'agora'; const d = (Date.now()-t)/1000; if (d<60) return 'agora'; if (d<3600) return Math.floor(d/60)+'min'; if (d<86400) return Math.floor(d/3600)+'h'; if (d<2592000) return Math.floor(d/86400)+'d'; return Math.floor(d/2592000)+'m'; }

function toast(msg, type) {
  const c = $('toast-container'); if (!c) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.style.borderLeftColor = type === 'error' ? '#EF4444' : '#10B981';
  d.innerHTML = msg;
  c.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 300); }, 3000);
}

// ========== AUTH ==========
auth.onAuthStateChanged(async user => {
  if (user) {
    S.user = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    S.ud = snap.val() || {};
    if (!S.ud.username) {
      // Google sem username
      const username = prompt('Escolha um @usuario:');
      if (username) {
        await db.ref('usuarios/' + user.uid).set({
          uid: user.uid,
          fullname: user.displayName || 'Usuário',
          username: username.toLowerCase(),
          email: user.email,
          password: '',
          avatar: user.photoURL || '🎓',
          bio: '',
          points: 0,
          plano: 'gratis',
          adminLevel: 0,
          isProf: false,
          isQuizzer: false,
          createdAt: Date.now()
        });
        S.ud = (await db.ref('usuarios/' + user.uid).once('value')).val();
      }
    }
    $('auth-screen').style.display = 'none';
    $('app').style.display = '';
    $('site-footer').style.display = '';
    updateUI();
    navigate('home');
  } else {
    $('app').style.display = 'none';
    $('site-footer').style.display = 'none';
    $('auth-screen').style.display = '';
  }
});

async function login() {
  const u = $('login-user')?.value?.trim()?.replace('@','');
  const p = $('login-pass')?.value;
  if (!u || !p) return toast('Preencha todos os campos', 'error');
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
    const users = snap.val();
    if (!users) return toast('@' + u + ' não encontrado', 'error');
    const uid = Object.keys(users)[0];
    await auth.signInWithEmailAndPassword(users[uid].email, p);
  } catch(e) { toast('Erro: ' + e.message, 'error'); }
}

async function register() {
  const name = $('reg-name')?.value?.trim();
  const user = $('reg-user')?.value?.trim()?.toLowerCase()?.replace('@','');
  const email = $('reg-email')?.value?.trim();
  const pass = $('reg-pass')?.value;
  if (!name || !user || !email || !pass) return toast('Preencha todos', 'error');
  if (pass.length < 6) return toast('Senha mín. 6 caracteres', 'error');
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(user).once('value');
    if (snap.val()) return toast('@' + user + ' já existe', 'error');
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid, fullname: name, username: user, email, password: pass,
      avatar: '🎓', bio: '', points: 0, plano: 'gratis', adminLevel: 0, isProf: false, isQuizzer: false, createdAt: Date.now()
    });
    toast('Conta criada! 🎉', 'success');
  } catch(e) { toast('Erro: ' + e.message, 'error'); }
}

async function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try { await auth.signInWithPopup(provider); } catch(e) { toast('Erro Google', 'error'); }
}

function logout() { auth.signOut(); }

// ========== UI ==========
function updateUI() {
  const u = S.ud; if (!u) return;
  $('perfil-nome').textContent = u.fullname || u.username;
  $('perfil-user').textContent = u.username;
  $('perfil-pts').textContent = fmt(u.points || 0);
  $('home-greeting').textContent = 'Olá, ' + (u.fullname || u.username) + '! 👋';
  const av = u.avatar || '🎓';
  const avEl = $('perfil-avatar');
  if (avEl) avEl.innerHTML = av.startsWith('http') ? '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : av;
}

// ========== NAVEGAÇÃO ==========
function navigate(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-' + name); if (t) t.classList.add('active');
  window.scrollTo(0, 0);
  
  if (name === 'home') loadHome();
  else if (name === 'materias') loadMaterias();
  else if (name === 'ranking') loadRanking();
  else if (name === 'desafios') loadDesafios();
}

// ========== HOME ==========
async function loadHome() {
  if (!S.ud) return;
  $('hpontos').textContent = fmt(S.ud.points || 0);
  $('hquizzes').textContent = S.ud.quizzesPlayed || 0;
}

// ========== DISCIPLINAS ==========
let materiasListener = null;

function loadMaterias() {
  if (materiasListener) db.ref('materias').off('value', materiasListener);
  materiasListener = db.ref('materias').on('value', snap => {
    const mat = snap.val();
    const c = $('materias-list'); if (!c) return;
    if (!mat) { c.innerHTML = '<p style="color:var(--text2);text-align:center">Nenhuma disciplina</p>'; return; }
    c.innerHTML = Object.entries(mat).map(([id,m]) => 
      '<div class="card" onclick="openMateria(\'' + id + '\')" style="cursor:pointer"><strong>' + esc(m.nome) + '</strong><br><span style="font-size:11px;color:var(--text2)">' + esc(m.descricao||'') + '</span></div>'
    ).join('');
  });
}

function criarDisciplina() {
  const nome = prompt('Nome da disciplina:');
  if (!nome) return;
  const desc = prompt('Descrição:') || '';
  db.ref('materias').push({ nome, descricao: desc, icone: '📚', autorId: S.user.uid, autorNome: S.ud.username, createdAt: Date.now() });
  toast('Disciplina criada! 📚', 'success');
}

async function openMateria(id) {
  S.mid = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val(); if (!m) return;
  $('mat-nome').textContent = m.nome;
  $('mat-desc').textContent = m.descricao || '';
  navigate('materia');
  
  // Aulas
  db.ref('aulas/' + id).on('value', snap => {
    const aulas = snap.val();
    const c = $('aulas-list'); if (!c) return;
    if (!aulas) { c.innerHTML = '<p style="color:var(--text2)">Nenhuma aula</p>'; return; }
    c.innerHTML = Object.entries(aulas).map(([aid,a]) =>
      '<div class="card" onclick="openAula(\'' + id + '\',\'' + aid + '\')" style="cursor:pointer"><strong>📝 ' + esc(a.titulo) + '</strong><br><span style="font-size:11px;color:var(--text2)">Por @' + esc(a.autorNome) + '</span></div>'
    ).join('');
  });
  
  // Quizzes
  db.ref('quizzes/' + id).on('value', snap => {
    const quizzes = snap.val();
    const c = $('quizzes-list'); if (!c) return;
    if (!quizzes) { c.innerHTML = '<p style="color:var(--text2)">Nenhum quiz</p>'; return; }
    c.innerHTML = Object.entries(quizzes).map(([qid,q]) =>
      '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>🎮 ' + esc(q.nome) + '</strong><br><span style="font-size:11px;color:var(--text2)">' + (q.questoes?.length||0) + ' questões</span></div><button class="btn btn-p" style="width:auto" onclick="startQuiz(\'' + id + '\',\'' + qid + '\')">▶ Jogar</button></div>'
    ).join('');
  });
}

function criarAula() {
  const titulo = prompt('Título da aula:');
  if (!titulo) return;
  const conteudo = prompt('Conteúdo:') || '';
  db.ref('aulas/' + S.mid).push({ titulo, conteudo, autorId: S.user.uid, autorNome: S.ud.username, createdAt: Date.now() });
  toast('Aula criada! 📝', 'success');
}

async function openAula(mid, aid) {
  S.mid = mid; S.aid = aid;
  const snap = await db.ref('aulas/' + mid + '/' + aid).once('value');
  const a = snap.val(); if (!a) return;
  $('aula-titulo').textContent = a.titulo;
  $('aula-conteudo').textContent = a.conteudo;
  navigate('aula');
}

function voltarMateria() { navigate('materia'); }

// ========== QUIZ ==========
async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  const q = snap.val(); if (!q?.questoes?.length) return toast('Quiz sem questões', 'error');
  S.quiz = { q: q.questoes.sort(() => Math.random() - 0.5), i: 0, score: 0, corr: 0, left: q.tempo || 30, nome: q.nome };
  navigate('quiz');
  renderQuiz();
}

function renderQuiz() {
  const g = S.quiz;
  if (g.i >= g.q.length) { finishQuiz(); return; }
  const q = g.q[g.i];
  $('quiz-counter').textContent = (g.i+1) + '/' + g.q.length;
  $('quiz-question').textContent = q.pergunta;
  $('quiz-options').innerHTML = q.alternativas.map((a,i) =>
    '<button onclick="selectAnswer(' + i + ')" style="display:block;width:100%;padding:12px;margin:5px 0;border:2px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);cursor:pointer;text-align:left;font-size:14px;font-family:Sora,sans-serif">' + 'ABCD'[i] + ') ' + esc(a) + '</button>'
  ).join('');
  g.left = 30;
  clearInterval(g.timer);
  g.timer = setInterval(() => { g.left--; if(g.left<=0){clearInterval(g.timer);selectAnswer(-1);} }, 1000);
}

function selectAnswer(chosen) {
  clearInterval(S.quiz.timer);
  const g = S.quiz, q = g.q[g.i], ok = chosen === q.correta;
  const btns = document.querySelectorAll('#quiz-options button');
  btns.forEach((b,i) => {
    b.disabled = true;
    b.style.background = i === q.correta ? '#D1FAE5' : i === chosen && !ok ? '#FEE2E2' : '';
    b.style.borderColor = i === q.correta ? '#10B981' : i === chosen && !ok ? '#EF4444' : '';
  });
  if (ok) { g.score += 10; g.corr++; }
  setTimeout(() => { g.i++; renderQuiz(); }, 1500);
}

async function finishQuiz() {
  clearInterval(S.quiz.timer);
  const g = S.quiz, total = g.q.length, pct = Math.round(g.corr/total*100);
  const pts = g.score + (pct>=90?50:pct>=70?30:0);
  await db.ref('usuarios/' + S.user.uid + '/points').once('value').then(s => {
    const cur = s.val() || 0;
    return db.ref('usuarios/' + S.user.uid).update({ points: cur + pts, quizzesPlayed: (S.ud.quizzesPlayed||0) + 1 });
  });
  alert('🎉 Quiz finalizado!\nAcertos: ' + g.corr + '/' + total + ' (' + pct + '%)\nPontos: +' + pts);
  S.ud.points = (S.ud.points||0) + pts;
  S.ud.quizzesPlayed = (S.ud.quizzesPlayed||0) + 1;
  navigate('materia');
}

function sairQuiz() { clearInterval(S.quiz.timer); navigate('materia'); }

// ========== RANKING ==========
function loadRanking() {
  db.ref('usuarios').on('value', snap => {
    const users = snap.val(); if (!users) return;
    let arr = Object.values(users).sort((a,b) => (b.points||0)-(a.points||0)).slice(0,50);
    $('ranking-list').innerHTML = arr.map((u,i) =>
      '<div class="card" style="display:flex;align-items:center;gap:10px"><span style="font-weight:800;font-size:16px;width:30px">' + (i+1) + '</span><span>@' + esc(u.username) + '</span><span style="margin-left:auto;color:#10B981;font-weight:700">' + fmt(u.points) + ' pts</span></div>'
    ).join('');
  });
}

// ========== DESAFIOS ==========
async function loadDesafios() {
  const c = $('desafios-list'); if (!c) return;
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  const agora = Date.now();
  if (!desafios) { c.innerHTML = '<div class="card" style="text-align:center;padding:20px">⚔️ Nenhum desafio no momento</div>'; return; }
  c.innerHTML = Object.entries(desafios).reverse().map(([id,d]) => {
    const ativo = agora >= d.inicio && agora <= d.fim;
    return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>⚔️ ' + esc(d.titulo) + '</strong><br><span style="font-size:11px">🏆 +' + d.premio + ' pts</span></div>' + (ativo ? '<button class="btn btn-p" style="width:auto" onclick="participarDesafio(\'' + id + '\')">▶ Participar</button>' : '<span class="badge">Encerrado</span>') + '</div>';
  }).join('');
}

let desafioAtual = null;
let respostasDesafio = [];

async function participarDesafio(id) {
  const snap = await db.ref('desafios/' + id).once('value');
  const d = snap.val(); if (!d) return;
  desafioAtual = { id, ...d };
  respostasDesafio = [];
  const questoes = parseQuestoes(d.questoes).sort(() => Math.random() - 0.5).slice(0, d.totalQuestoes || 20);
  
  const c = $('desafios-list');
  c.innerHTML = '<div class="card" style="background:linear-gradient(135deg,#10B981,#3B82F6);color:white;text-align:center;padding:20px;margin-bottom:15px"><h2>⚔️ ' + esc(d.titulo) + '</h2><p>🏆 +' + d.premio + ' pts</p></div>' +
    questoes.map((q,i) => '<div class="card" style="margin-bottom:12px"><strong>' + (i+1) + '. ' + esc(q.pergunta) + '</strong><div style="margin-top:8px">' + 
      q.alternativas.map((a,j) => '<label style="display:block;padding:6px;cursor:pointer;border-radius:6px" onmouseover="this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'transparent\'"><input type="radio" name="dq' + i + '" value="' + j + '" onchange="respDesafio(' + i + ',' + j + ')"> ' + esc(a) + '</label>').join('') +
    '</div></div>').join('') +
    '<button class="btn btn-p" style="width:100%" onclick="finalizarDesafio()">🏆 Enviar Respostas</button>';
}

function respDesafio(i, v) { respostasDesafio[i] = v; }

async function finalizarDesafio() {
  if (!desafioAtual) return;
  const questoes = parseQuestoes(desafioAtual.questoes).slice(0, desafioAtual.totalQuestoes || 20);
  let acertos = 0;
  const letras = { a:0, b:1, c:2, d:3 };
  questoes.forEach((q,i) => {
    if (parseInt(respostasDesafio[i]) === (letras[q.resposta?.toLowerCase()] ?? -1)) acertos++;
  });
  const pct = Math.round(acertos/questoes.length*100);
  const ganhou = pct >= 70 ? desafioAtual.premio : Math.round(desafioAtual.premio*(pct/100));
  
  await db.ref('desafios/' + desafioAtual.id + '/participantes/' + S.user.uid).set({
    nome: S.ud.username, acertos, total: questoes.length, pct, ganhou, data: Date.now()
  });
  
  if (ganhou > 0) {
    const cur = (await db.ref('usuarios/' + S.user.uid + '/points').once('value')).val() || 0;
    await db.ref('usuarios/' + S.user.uid).update({ points: cur + ganhou });
    S.ud.points = cur + ganhou;
  }
  
  alert('🏆 Desafio concluído!\n\nAcertos: ' + acertos + '/' + questoes.length + ' (' + pct + '%)\nPontos: +' + ganhou);
  desafioAtual = null;
  navigate('desafios');
}

function parseQuestoes(txt) {
  if (!txt) return [];
  return txt.split('\n\n').filter(b => b.trim()).map(b => {
    const l = b.trim().split('\n');
    const resp = l.find(x => x.toUpperCase().startsWith('RESPOSTA:'))?.replace(/RESPOSTA:/i,'').trim() || '';
    const alts = l.filter(x => /^[a-dA-D]\)/.test(x)).map(x => x.replace(/^[a-dA-D]\)\s*/,''));
    return { pergunta: l[0].replace(/^\d+[\.\)\-]\s*/, ''), alternativas: alts, resposta: resp };
  });
}

// ========== JARVIS ==========
async function jarvisAsk() {
  const msg = $('jarvis-input')?.value?.trim();
  if (!msg) return;
  $('jarvis-input').value = '';
  const div = $('jarvis-msgs');
  div.innerHTML += '<p style="text-align:right"><span style="background:#10B981;color:white;padding:8px 12px;border-radius:15px;font-size:13px">' + esc(msg) + '</span></p>';
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role:'system',content:'Você é o Jarvis, assistente de estudos. Responda em português.' },{ role:'user',content:msg }], max_tokens: 500 })
    });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || 'Não entendi 😅';
    div.innerHTML += '<p><img src="' + IMG.jarvis + '" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:5px" /><span style="background:var(--card);padding:8px 12px;border-radius:15px;font-size:13px">' + esc(reply) + '</span></p>';
  } catch(e) {
    div.innerHTML += '<p><span style="background:var(--card);padding:8px 12px;border-radius:15px;font-size:13px">Erro técnico 😢</span></p>';
  }
  div.scrollTop = div.scrollHeight;
}

console.log('✅ Sexta-Feira Studies PRONTO!');
