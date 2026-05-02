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
const GROQ_KEY = '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';

// ========== STATE ==========
let currentUser = null;
let currentUserData = null;
let currentMateriaId = null;
let quizData = null;
let quizIndex = 0;
let quizScore = 0;
let quizTimer = null;

// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

function toast(msg) {
  const c = $('toast-container'); if (!c) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 3000);
}

// ========== AUTH ==========
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    currentUserData = snap.val() || {};
    $('login-screen').style.display = 'none';
    $('app').style.display = '';
    updateUI();
    navigate('home');
  } else {
    $('app').style.display = 'none';
    $('login-screen').style.display = '';
  }
});

async function doLogin() {
  const u = $('login-user').value.trim().replace('@','');
  const p = $('login-pass').value;
  if (!u || !p) return toast('Preencha todos os campos');
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  const users = snap.val();
  if (!users) return toast('Usuário não encontrado');
  const uid = Object.keys(users)[0];
  try {
    await auth.signInWithEmailAndPassword(users[uid].email, p);
  } catch(e) {
    toast('Senha incorreta');
  }
}

async function doRegister() {
  const name = $('reg-name').value.trim();
  const user = $('reg-user').value.trim().toLowerCase().replace('@','');
  const email = $('reg-email').value.trim();
  const pass = $('reg-pass').value;
  if (!name || !user || !email || !pass) return toast('Preencha todos');
  if (pass.length < 6) return toast('Senha mín. 6 caracteres');
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(user).once('value');
  if (snap.val()) return toast('@' + user + ' já existe');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid, fullname: name, username: user, email, password: pass,
      avatar: '', bio: '', points: 0, plano: 'gratis', adminLevel: 0, isProf: false, isQuizzer: false, createdAt: Date.now()
    });
    toast('Conta criada! 🎉');
  } catch(e) {
    toast('Erro: ' + e.message);
  }
}

function loginGoogle() {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}

function showRegister() {
  $('register-form').style.display = $('register-form').style.display === 'none' ? '' : 'none';
}

// ========== UI ==========
function updateUI() {
  if (!currentUserData) return;
  $('perfil-nome').textContent = currentUserData.fullname || currentUserData.username;
  $('perfil-user').textContent = '@' + currentUserData.username;
  $('perfil-pts').textContent = fmt(currentUserData.points || 0);
  $('home-greeting').textContent = 'Olá, ' + (currentUserData.fullname || '').split(' ')[0] + '! 👋';
  $('home-points').textContent = fmt(currentUserData.points || 0);
  const av = currentUserData.avatar;
  $('nav-avatar').innerHTML = av && av.startsWith('http') ? '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : (currentUserData.fullname || '?')[0];
}

// ========== NAVEGAÇÃO ==========
function navigate(page) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-' + page);
  if (t) t.classList.add('active');
  window.scrollTo(0, 0);
  
  if (page === 'home') loadHome();
  else if (page === 'materias') loadMaterias();
  else if (page === 'ranking') loadRanking();
  else if (page === 'desafios') loadDesafios();
  else if (page === 'perfil') loadPerfil();
}

// ========== HOME ==========
async function loadHome() {
  const snap = await db.ref('posts').orderByChild('createdAt').limitToLast(10).once('value');
  const posts = snap.val();
  const c = $('feed-list');
  if (!posts) { c.innerHTML = '<p style="color:var(--text2);text-align:center">Nenhum post ainda</p>'; return; }
  c.innerHTML = Object.entries(posts).reverse().map(([id,p]) => 
    '<div class="post-card"><div class="post-header"><div class="post-avatar">' + (p.avatar && p.avatar.startsWith('http') ? '<img src="' + p.avatar + '" />' : (p.autorNome || '?')[0]) + '</div><div><strong>' + esc(p.autorNome) + '</strong><br><span style="font-size:11px;color:var(--text2)">' + new Date(p.createdAt).toLocaleDateString('pt-BR') + '</span></div></div><p>' + esc(p.texto || '') + '</p></div>'
  ).join('');
}

// ========== DISCIPLINAS ==========
function loadMaterias() {
  db.ref('materias').on('value', snap => {
    const mat = snap.val();
    const c = $('materias-list');
    if (!mat) { c.innerHTML = '<p style="color:var(--text2);text-align:center">Nenhuma disciplina</p>'; return; }
    c.innerHTML = Object.entries(mat).map(([id,m]) =>
      '<div class="card" onclick="openMateria(\'' + id + '\')" style="cursor:pointer"><strong>' + esc(m.nome) + '</strong><br><span style="font-size:12px;color:var(--text2)">' + esc(m.descricao || '') + '</span></div>'
    ).join('');
  });
}

function criarMateria() {
  const nome = prompt('Nome da disciplina:');
  if (!nome) return;
  const desc = prompt('Descrição:') || '';
  db.ref('materias').push({ nome, descricao: desc, icone: '📚', autorId: currentUser.uid, autorNome: currentUserData.username, createdAt: Date.now() });
  toast('Disciplina criada! 📚');
}

function openMateria(id) {
  currentMateriaId = id;
  db.ref('materias/' + id).once('value').then(snap => {
    const m = snap.val();
    $('mat-nome').textContent = m.nome;
    $('mat-desc').textContent = m.descricao || '';
    navigate('materia-detalhe');
    loadAulasEquizzes(id);
  });
}

function loadAulasEquizzes(id) {
  db.ref('aulas/' + id).on('value', snap => {
    const aulas = snap.val();
    $('aulas-list').innerHTML = aulas ? Object.entries(aulas).map(([aid,a]) =>
      '<div class="card" onclick="openAula(\'' + id + '\',\'' + aid + '\')" style="cursor:pointer"><strong>📝 ' + esc(a.titulo) + '</strong></div>'
    ).join('') : '<p style="color:var(--text2)">Nenhuma aula</p>';
  });
  
  db.ref('quizzes/' + id).on('value', snap => {
    const quizzes = snap.val();
    $('quizzes-list').innerHTML = quizzes ? Object.entries(quizzes).map(([qid,q]) =>
      '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>🎮 ' + esc(q.nome) + '</strong><br><span style="font-size:11px;color:var(--text2)">' + (q.questoes?.length || 0) + ' questões</span></div><button class="btn btn-primary btn-sm" onclick="startQuiz(\'' + id + '\',\'' + qid + '\')">▶ Jogar</button></div>'
    ).join('') : '<p style="color:var(--text2)">Nenhum quiz</p>';
  });
}

function criarAula() {
  const titulo = prompt('Título da aula:');
  if (!titulo) return;
  const conteudo = prompt('Conteúdo:') || '';
  db.ref('aulas/' + currentMateriaId).push({ titulo, conteudo, autorId: currentUser.uid, autorNome: currentUserData.username, createdAt: Date.now() });
  toast('Aula criada! 📝');
}

function openAula(mid, aid) {
  db.ref('aulas/' + mid + '/' + aid).once('value').then(snap => {
    const a = snap.val();
    $('aula-titulo').textContent = a.titulo;
    $('aula-conteudo').textContent = a.conteudo;
    navigate('aula');
  });
}

function voltarMateria() { navigate('materia-detalhe'); }

// ========== QUIZ ==========
function criarQuiz() {
  const nome = prompt('Nome do quiz:');
  if (!nome) return;
  const qtd = parseInt(prompt('Quantas questões?') || '5');
  const questoes = [];
  for (let i = 0; i < qtd; i++) {
    const pergunta = prompt('Questão ' + (i+1) + ':');
    if (!pergunta) continue;
    const alts = [];
    for (let j = 0; j < 4; j++) {
      const alt = prompt('Alternativa ' + 'ABCD'[j] + ':');
      if (alt) alts.push(alt);
    }
    const correta = prompt('Alternativa correta (0=A, 1=B, 2=C, 3=D):');
    questoes.push({ pergunta, alternativas: alts, correta: parseInt(correta) || 0 });
  }
  if (questoes.length > 0) {
    db.ref('quizzes/' + currentMateriaId).push({ nome, tempo: 30, questoes, createdAt: Date.now() });
    toast('Quiz criado! 🎮');
  }
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  quizData = snap.val();
  quizIndex = 0;
  quizScore = 0;
  navigate('quiz');
  renderQuiz();
}

function renderQuiz() {
  if (quizIndex >= quizData.questoes.length) {
    finishQuiz();
    return;
  }
  const q = quizData.questoes[quizIndex];
  $('quiz-counter').textContent = 'Questão ' + (quizIndex+1) + '/' + quizData.questoes.length;
  $('quiz-question').textContent = q.pergunta;
  $('quiz-options').innerHTML = q.alternativas.map((a,i) =>
    '<button class="quiz-option" onclick="answerQuiz(' + i + ')">' + 'ABCD'[i] + ') ' + esc(a) + '</button>'
  ).join('');
}

function answerQuiz(chosen) {
  const q = quizData.questoes[quizIndex];
  const btns = document.querySelectorAll('#quiz-options .quiz-option');
  btns.forEach((b,i) => {
    b.style.pointerEvents = 'none';
    if (i === q.correta) b.classList.add('correct');
    if (i === chosen && chosen !== q.correta) b.classList.add('wrong');
  });
  if (chosen === q.correta) quizScore++;
  setTimeout(() => { quizIndex++; renderQuiz(); }, 1500);
}

async function finishQuiz() {
  const total = quizData.questoes.length;
  const pct = Math.round(quizScore / total * 100);
  const pts = quizScore * 10 + (pct >= 90 ? 50 : pct >= 70 ? 30 : 0);
  
  const curSnap = await db.ref('usuarios/' + currentUser.uid + '/points').once('value');
  await db.ref('usuarios/' + currentUser.uid).update({ 
    points: (curSnap.val() || 0) + pts,
    quizzesPlayed: (currentUserData.quizzesPlayed || 0) + 1
  });
  currentUserData.points = (currentUserData.points || 0) + pts;
  
  alert('🎉 Quiz finalizado!\nAcertos: ' + quizScore + '/' + total + ' (' + pct + '%)\nPontos: +' + pts);
  navigate('materia-detalhe');
}

function sairQuiz() { navigate('materia-detalhe'); }

// ========== RANKING ==========
function loadRanking() {
  db.ref('usuarios').orderByChild('points').limitToLast(50).once('value').then(snap => {
    const users = [];
    snap.forEach(c => users.push(c.val()));
    users.reverse();
    $('ranking-list').innerHTML = users.map((u,i) =>
      '<div class="card" style="display:flex;align-items:center;gap:10px"><span style="font-weight:800;width:25px">' + (i+1) + '</span><span>@' + esc(u.username) + '</span><span style="margin-left:auto;color:var(--primary);font-weight:700">' + fmt(u.points || 0) + ' pts</span></div>'
    ).join('');
  });
}

// ========== DESAFIOS ==========
function loadDesafios() {
  db.ref('desafios').once('value').then(snap => {
    const desafios = snap.val();
    const now = Date.now();
    $('desafios-list').innerHTML = desafios ? Object.entries(desafios).map(([id,d]) => {
      const ativo = now >= d.inicio && now <= d.fim;
      return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><strong>⚔️ ' + esc(d.titulo) + '</strong><br><span style="font-size:11px;color:var(--text2)">🏆 +' + d.premio + ' pts</span></div>' + (ativo ? '<button class="btn btn-primary btn-sm" onclick="participarDesafio(\'' + id + '\')">▶ Participar</button>' : '<span style="color:var(--text2);font-size:11px">Encerrado</span>') + '</div>';
    }).join('') : '<p style="color:var(--text2);text-align:center">Nenhum desafio</p>';
  });
}

async function participarDesafio(id) {
  const snap = await db.ref('desafios/' + id).once('value');
  const d = snap.val();
  if (!d || !d.questoes) return;
  
  // Parse das questões
  const questoes = d.questoes.split('\n\n').filter(b => b.trim()).map(b => {
    const l = b.trim().split('\n');
    const resp = l.find(x => x.toUpperCase().startsWith('RESPOSTA:'))?.replace(/RESPOSTA:/i,'').trim() || '';
    const alts = l.filter(x => /^[a-dA-D]\)/.test(x)).map(x => x.replace(/^[a-dA-D]\)\s*/,''));
    return { pergunta: l[0], alternativas: alts, resposta: resp };
  });
  
  let score = 0;
  for (const q of questoes) {
    const answer = prompt(q.pergunta + '\n' + q.alternativas.map((a,i) => 'ABCD'[i] + ') ' + a).join('\n') + '\n\nResposta (A/B/C/D):');
    if (answer && answer.toUpperCase() === q.resposta.toUpperCase()) score++;
  }
  
  const pct = Math.round(score / questoes.length * 100);
  const ganhou = pct >= 70 ? d.premio : Math.round(d.premio * (pct / 100));
  
  if (ganhou > 0) {
    const cur = (await db.ref('usuarios/' + currentUser.uid + '/points').once('value')).val() || 0;
    await db.ref('usuarios/' + currentUser.uid).update({ points: cur + ganhou });
    currentUserData.points = cur + ganhou;
  }
  
  alert('🏆 Desafio concluído!\nAcertos: ' + score + '/' + questoes.length + ' (' + pct + '%)\nPontos: +' + ganhou);
  loadDesafios();
}

// ========== JARVIS ==========
async function sendJarvis() {
  const msg = $('jarvis-input').value.trim();
  if (!msg) return;
  $('jarvis-input').value = '';
  
  const div = $('jarvis-msgs');
  div.innerHTML += '<p style="text-align:right"><span style="background:var(--primary);color:white;padding:8px 12px;border-radius:12px">' + esc(msg) + '</span></p>';
  
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{role:'system',content:'Você é o Jarvis, assistente de estudos. Responda em português.'},{role:'user',content:msg}],
        max_tokens: 500
      })
    });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || 'Não entendi 😅';
    div.innerHTML += '<p><span style="background:var(--bg);padding:8px 12px;border-radius:12px;border:1px solid var(--border)">' + esc(reply) + '</span></p>';
  } catch(e) {
    div.innerHTML += '<p><span style="background:var(--bg);padding:8px 12px;border-radius:12px">Erro técnico 😢</span></p>';
  }
  div.scrollTop = div.scrollHeight;
}

// ========== PERFIL ==========
function loadPerfil() {
  if (!currentUserData) return;
  updateUI();
}

// ========== NOTIFICAÇÕES ==========
// Simplificado por enquanto

console.log('✅ Sexta-Feira Studies PRONTO!');
