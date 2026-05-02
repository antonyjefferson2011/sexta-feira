// ===== IMPORTS FIREBASE CDN =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  getDatabase, ref, get, set, push, update, remove,
  query, orderByChild, equalTo, limitToLast
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
  authDomain: "sexta-feira-studies.firebaseapp.com",
  databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
  projectId: "sexta-feira-studies",
  storageBucket: "sexta-feira-studies.firebasestorage.app",
  messagingSenderId: "673251857052",
  appId: "1:673251857052:web:0ef6929ea93123f7a91359"
};

const GROQ_KEY = "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";
const IMGBB_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ===== ESTADO GLOBAL =====
let usuarioAtual = null;
let dadosUsuario = null;
let disciplinaAtualId = null;
let quizAtual = null;
let quizQuestaoIdx = 0;
let quizAcertos = 0;
let quizTimer = null;
let quizTimerSeg = 30;
let quizRespondida = false;
let desafioAtual = null;
let desafioQuestaoIdx = 0;
let desafioAcertos = 0;
const histJarvis = [];
const SEEDS_DISC = [
  { name: 'Matemática', description: 'Álgebra, geometria, cálculo e mais', icon: '📐', color: '#10B981' },
  { name: 'Português', description: 'Gramática, interpretação e redação', icon: '📖', color: '#3B82F6' },
  { name: 'História', description: 'Da pré-história ao mundo contemporâneo', icon: '🌍', color: '#F59E0B' },
  { name: 'Ciências', description: 'Biologia, física e química', icon: '🔬', color: '#EF4444' },
];

// ===== TOAST =====
function toast(msg, tipo = '') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===== SHOW/HIDE =====
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.add('oculto'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('oculto');
}

window.mostrarTelaApp = function(id) {
  document.querySelectorAll('.tela-interna').forEach(t => t.classList.add('oculto'));
  const el = document.getElementById(id);
  if (el) { el.classList.remove('oculto'); el.scrollTop = 0; }
  // Carregar dados da tela
  if (id === 'tela-disciplinas') carregarDisciplinas();
  if (id === 'tela-ranking') carregarRanking();
  if (id === 'tela-desafios') carregarDesafios();
  if (id === 'tela-perfil') atualizarPerfil();
};

window.irHome = function() {
  mostrarTelaApp('tela-home');
};

// ===== AUTH =====
onAuthStateChanged(auth, async function(user) {
  if (user) {
    usuarioAtual = user;
    await carregarDadosUsuario(user.uid);
    mostrarTela('dummy'); // esconde telas auth
    document.getElementById('app').classList.remove('oculto');
    mostrarTelaApp('tela-home');
    atualizarHeader();
    carregarDisciplinas();
  } else {
    usuarioAtual = null;
    dadosUsuario = null;
    document.getElementById('app').classList.add('oculto');
    mostrarTela('tela-login');
  }
});

async function carregarDadosUsuario(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) dadosUsuario = snap.val();
  } catch(e) { console.error(e); }
}

function atualizarHeader() {
  if (!dadosUsuario) return;
  const nome = document.getElementById('header-nome');
  const avatar = document.getElementById('header-avatar');
  if (nome) nome.textContent = (dadosUsuario.fullname || '').split(' ')[0];
  if (avatar) {
    if (dadosUsuario.avatar) {
      avatar.innerHTML = `<img src="${dadosUsuario.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    } else {
      avatar.textContent = (dadosUsuario.fullname || 'U')[0].toUpperCase();
    }
  }
  document.getElementById('saudacao').textContent = `Olá, ${(dadosUsuario.fullname || 'Estudante').split(' ')[0]}! 👋`;
  document.getElementById('stat-pontos').textContent = dadosUsuario.points || 0;
  document.getElementById('stat-quizzes').textContent = dadosUsuario.quizzesPlayed || 0;
}

window.fazerLogin = async function() {
  const username = document.getElementById('login-username').value.trim().replace('@','');
  const senha = document.getElementById('login-password').value;
  if (!username || !senha) { toast('Preencha todos os campos', 'erro'); return; }
  try {
    const q = query(ref(db, 'users'), orderByChild('username'), equalTo(username));
    const snap = await get(q);
    if (!snap.exists()) { toast('Usuário não encontrado', 'erro'); return; }
    let email = '';
    snap.forEach(c => { email = c.val().email; });
    await signInWithEmailAndPassword(auth, email, senha);
    toast('Bem-vindo de volta! 🎉', 'sucesso');
  } catch(e) { toast('Senha ou usuário incorretos', 'erro'); console.error(e); }
};

window.fazerCadastro = async function() {
  const nome = document.getElementById('cad-nome').value.trim();
  const username = document.getElementById('cad-username').value.trim().toLowerCase().replace('@','').replace(/\s/g,'');
  const email = document.getElementById('cad-email').value.trim();
  const senha = document.getElementById('cad-senha').value;
  if (!nome || !username || !email || !senha) { toast('Preencha todos os campos', 'erro'); return; }
  if (username.includes(' ')) { toast('Username não pode ter espaços', 'erro'); return; }
  try {
    const q = query(ref(db, 'users'), orderByChild('username'), equalTo(username));
    const snap = await get(q);
    if (snap.exists()) { toast('Username já em uso', 'erro'); return; }
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await set(ref(db, `users/${cred.user.uid}`), {
      uid: cred.user.uid, fullname: nome, username, email,
      avatar: '', bio: '', points: 0, quizzesPlayed: 0,
      plano: 'free', adminLevel: 0, isProf: false, isQuizzer: false, isVerified: false,
      createdAt: Date.now()
    });
    toast('Conta criada! Bem-vindo! 🚀', 'sucesso');
  } catch(e) { toast('Erro ao criar conta: ' + e.message, 'erro'); console.error(e); }
};

window.loginGoogle = async function() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const snap = await get(ref(db, `users/${user.uid}`));
    if (!snap.exists()) {
      const username = (user.email || '').split('@')[0].replace(/[^a-zA-Z0-9_]/g,'') || `user${Date.now()}`;
      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid, fullname: user.displayName || 'Usuário',
        username, email: user.email, avatar: user.photoURL || '',
        bio: '', points: 0, quizzesPlayed: 0, plano: 'free',
        adminLevel: 0, isProf: false, isQuizzer: false, isVerified: false,
        createdAt: Date.now()
      });
    }
    toast('Login realizado!', 'sucesso');
  } catch(e) { toast('Erro: ' + e.message, 'erro'); console.error(e); }
};

window.fazerLogout = async function() {
  await signOut(auth);
  toast('Até logo!');
};

window.mostrarTela = mostrarTela;

// ===== DISCIPLINAS =====
async function carregarDisciplinas() {
  const lista = document.getElementById('lista-disciplinas');
  if (!lista) return;
  lista.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    const snap = await get(ref(db, 'disciplinas'));
    if (!snap.exists()) {
      await seedDisciplinas();
      return;
    }
    const discs = [];
    snap.forEach(c => discs.push({ id: c.key, ...c.val() }));
    discs.sort((a,b) => a.name.localeCompare(b.name));
    document.getElementById('disc-count').textContent = `${discs.length} matéria${discs.length !== 1 ? 's' : ''} disponíve${discs.length !== 1 ? 'is' : 'l'}`;
    if (discs.length === 0) { lista.innerHTML = '<div class="empty-msg">Nenhuma disciplina ainda</div>'; return; }
    lista.innerHTML = discs.map(d => `
      <button class="item-card" onclick="abrirDisciplina('${d.id}')">
        <div class="item-icon" style="background:${d.color}22">${d.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="item-nome">${d.name}</div>
          <div class="item-desc">${d.description}</div>
        </div>
      </button>
    `).join('');
  } catch(e) { lista.innerHTML = '<div class="empty-msg">Erro ao carregar</div>'; console.error(e); }
}

async function seedDisciplinas() {
  for (const d of SEEDS_DISC) {
    const r = push(ref(db, 'disciplinas'));
    await set(r, { ...d, createdAt: Date.now() });
  }
  carregarDisciplinas();
}

window.abrirDisciplina = async function(id) {
  disciplinaAtualId = id;
  mostrarTelaApp('tela-disciplina-detalhe');
  document.getElementById('lista-aulas').innerHTML = '<div class="loading">Carregando...</div>';
  document.getElementById('lista-quizzes-disc').innerHTML = '<div class="loading">Carregando...</div>';
  mudarTab('aulas');
  try {
    const snap = await get(ref(db, `disciplinas/${id}`));
    if (!snap.exists()) return;
    const d = snap.val();
    document.getElementById('disc-nome-titulo').textContent = d.name;
    document.getElementById('disc-desc-titulo').textContent = d.description;
    document.getElementById('disc-icone').textContent = d.icon || '📚';
    document.getElementById('disc-icone').style.background = `${d.color||'#10B981'}22`;
    // Aulas
    const aulasList = document.getElementById('lista-aulas');
    if (d.aulas) {
      const aulas = Object.entries(d.aulas).map(([id, v]) => ({ id, ...v })).sort((a,b) => b.createdAt - a.createdAt);
      aulasList.innerHTML = aulas.map(a => `
        <button class="item-card" onclick="abrirAula('${a.id}','${id}')">
          <div class="item-icon" style="background:#1E293B">📄</div>
          <div style="flex:1;min-width:0">
            <div class="item-nome">${a.title}</div>
            <div class="item-desc">${(a.content||'').slice(0,80)}...</div>
          </div>
        </button>
      `).join('');
    } else { aulasList.innerHTML = '<div class="empty-msg">Nenhuma aula ainda</div>'; }
    // Quizzes
    const quizzesSnap = await get(ref(db, 'quizzes'));
    const quizList = document.getElementById('lista-quizzes-disc');
    if (quizzesSnap.exists()) {
      const quizzes = [];
      quizzesSnap.forEach(c => { const v = c.val(); if (v.disciplinaId === id) quizzes.push({ id: c.key, ...v }); });
      if (quizzes.length > 0) {
        quizList.innerHTML = quizzes.map(q => `
          <button class="item-card" onclick="iniciarQuiz('${q.id}')">
            <div class="item-icon" style="background:#1E293B">🎯</div>
            <div style="flex:1;min-width:0">
              <div class="item-nome">${q.title}</div>
              <div class="item-desc">${(q.questions||[]).length} questões</div>
            </div>
            <span class="item-badge">Jogar</span>
          </button>
        `).join('');
      } else { quizList.innerHTML = '<div class="empty-msg">Nenhum quiz ainda</div>'; }
    } else { quizList.innerHTML = '<div class="empty-msg">Nenhum quiz ainda</div>'; }
  } catch(e) { console.error(e); }
};

window.abrirAula = async function(aulaId, discId) {
  try {
    const snap = await get(ref(db, `disciplinas/${discId}/aulas/${aulaId}`));
    if (!snap.exists()) return;
    const a = snap.val();
    document.getElementById('aula-titulo').textContent = a.title;
    document.getElementById('aula-conteudo').textContent = a.content;
    mostrarTelaApp('tela-aula');
  } catch(e) { console.error(e); }
};

window.mudarTab = function(tab) {
  document.getElementById('conteudo-aulas').classList.toggle('oculto', tab !== 'aulas');
  document.getElementById('conteudo-quizzes').classList.toggle('oculto', tab !== 'quizzes');
  document.getElementById('tab-aulas').classList.toggle('ativo', tab === 'aulas');
  document.getElementById('tab-quizzes').classList.toggle('ativo', tab === 'quizzes');
};

// ===== MODAIS =====
window.abrirModal = function(id) {
  document.getElementById('modal-overlay').classList.remove('oculto');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('oculto'));
  document.getElementById(id).classList.remove('oculto');
};

window.fecharModais = function() {
  document.getElementById('modal-overlay').classList.add('oculto');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('oculto'));
};

window.criarDisciplina = async function() {
  const nome = document.getElementById('modal-disc-nome').value.trim();
  const desc = document.getElementById('modal-disc-desc').value.trim();
  if (!nome || !desc) { toast('Preencha todos os campos', 'erro'); return; }
  const cores = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];
  const icons = ['📐','📖','🌍','🔬','🎨','💻','⚗️','🎵'];
  const i = Math.floor(Math.random() * cores.length);
  try {
    const r = push(ref(db, 'disciplinas'));
    await set(r, { name: nome, description: desc, color: cores[i], icon: icons[i], createdAt: Date.now() });
    toast('Disciplina criada!', 'sucesso');
    fecharModais();
    document.getElementById('modal-disc-nome').value = '';
    document.getElementById('modal-disc-desc').value = '';
    carregarDisciplinas();
  } catch(e) { toast('Erro ao criar', 'erro'); console.error(e); }
};

window.criarAula = async function() {
  const titulo = document.getElementById('modal-aula-titulo').value.trim();
  const conteudo = document.getElementById('modal-aula-conteudo').value.trim();
  if (!titulo || !conteudo) { toast('Preencha todos os campos', 'erro'); return; }
  if (!disciplinaAtualId) return;
  try {
    const r = push(ref(db, `disciplinas/${disciplinaAtualId}/aulas`));
    await set(r, { title: titulo, content: conteudo, createdAt: Date.now() });
    toast('Aula adicionada!', 'sucesso');
    fecharModais();
    document.getElementById('modal-aula-titulo').value = '';
    document.getElementById('modal-aula-conteudo').value = '';
    abrirDisciplina(disciplinaAtualId);
  } catch(e) { toast('Erro ao criar aula', 'erro'); console.error(e); }
};

// ===== QUIZ =====
window.iniciarQuiz = async function(quizId) {
  try {
    const snap = await get(ref(db, `quizzes/${quizId}`));
    if (!snap.exists()) { toast('Quiz não encontrado', 'erro'); return; }
    quizAtual = { id: quizId, ...snap.val() };
    quizQuestaoIdx = 0; quizAcertos = 0;
    mostrarTelaApp('tela-quiz');
    mostrarQuestao();
  } catch(e) { toast('Erro ao carregar quiz', 'erro'); console.error(e); }
};

function mostrarQuestao() {
  const q = quizAtual.questions[quizQuestaoIdx];
  const total = quizAtual.questions.length;
  document.getElementById('quiz-progresso').textContent = `${quizQuestaoIdx+1}/${total}`;
  document.getElementById('quiz-progress-fill').style.width = `${(quizQuestaoIdx/total)*100}%`;
  document.getElementById('quiz-pergunta-texto').textContent = q.question;
  quizRespondida = false;
  iniciarTimerQuiz();
  const opcoes = document.getElementById('quiz-opcoes');
  const letras = ['A','B','C','D'];
  opcoes.innerHTML = q.options.map((opt, i) => `
    <button class="opcao" onclick="responderQuiz(${i})">
      <div class="opcao-letra">${letras[i]}</div>
      <div class="opcao-texto">${opt}</div>
    </button>
  `).join('');
}

function iniciarTimerQuiz() {
  clearInterval(quizTimer);
  quizTimerSeg = 30;
  atualizarTimerUI(30);
  quizTimer = setInterval(function() {
    quizTimerSeg--;
    atualizarTimerUI(quizTimerSeg);
    if (quizTimerSeg <= 0) {
      clearInterval(quizTimer);
      if (!quizRespondida) {
        quizRespondida = true;
        const q = quizAtual.questions[quizQuestaoIdx];
        marcarOpcoes(q.correct, -1);
        setTimeout(avancarQuiz, 1800);
      }
    }
  }, 1000);
}

function atualizarTimerUI(seg) {
  const ring = document.getElementById('timer-ring');
  const badge = document.getElementById('timer-badge');
  if (ring) { ring.textContent = seg; ring.className = 'timer-ring' + (seg <= 10 ? ' vermelho' : seg <= 20 ? ' amarelo' : ''); }
  if (badge) { badge.textContent = seg + 's'; badge.style.color = seg <= 10 ? '#EF4444' : seg <= 20 ? '#F59E0B' : '#10B981'; }
}

window.responderQuiz = function(idx) {
  if (quizRespondida) return;
  quizRespondida = true;
  clearInterval(quizTimer);
  const q = quizAtual.questions[quizQuestaoIdx];
  if (idx === q.correct) quizAcertos++;
  marcarOpcoes(q.correct, idx);
  setTimeout(avancarQuiz, 1800);
};

function marcarOpcoes(certa, selecionada) {
  document.querySelectorAll('.opcao').forEach((el, i) => {
    el.classList.add('disabled');
    if (i === certa) el.classList.add('certa');
    else if (i === selecionada) el.classList.add('errada');
    else el.classList.add('neutra');
  });
}

async function avancarQuiz() {
  quizQuestaoIdx++;
  if (quizQuestaoIdx >= quizAtual.questions.length) {
    await finalizarQuiz();
  } else {
    mostrarQuestao();
  }
}

async function finalizarQuiz() {
  clearInterval(quizTimer);
  const total = quizAtual.questions.length;
  const pct = Math.round((quizAcertos / total) * 100);
  const bonus = quizAcertos * 10;
  // Salvar resultado
  if (usuarioAtual) {
    try {
      const r = push(ref(db, 'resultados'));
      await set(r, { userId: usuarioAtual.uid, quizId: quizAtual.id, quizTitle: quizAtual.title, score: pct, correctAnswers: quizAcertos, total, createdAt: Date.now() });
      const novosPontos = (dadosUsuario?.points || 0) + bonus;
      const novosQuizzes = (dadosUsuario?.quizzesPlayed || 0) + 1;
      await update(ref(db, `users/${usuarioAtual.uid}`), { points: novosPontos, quizzesPlayed: novosQuizzes });
      if (dadosUsuario) { dadosUsuario.points = novosPontos; dadosUsuario.quizzesPlayed = novosQuizzes; }
      atualizarHeader();
    } catch(e) { console.error(e); }
  }
  // Mostrar resultado
  mostrarTelaApp('tela-quiz-resultado');
  document.getElementById('resultado-emoji').textContent = pct >= 70 ? '🎉' : pct >= 40 ? '😊' : '😔';
  document.getElementById('resultado-quiz-titulo').textContent = quizAtual.title;
  document.getElementById('res-acertos').textContent = quizAcertos;
  document.getElementById('res-erros').textContent = total - quizAcertos;
  document.getElementById('res-bonus').textContent = `+${bonus}`;
  const pctEl = document.getElementById('resultado-pct');
  pctEl.textContent = pct + '%';
  pctEl.style.color = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
}

window.jogarNovamente = function() {
  if (!quizAtual) return;
  quizQuestaoIdx = 0; quizAcertos = 0;
  mostrarTelaApp('tela-quiz');
  mostrarQuestao();
};

// ===== RANKING =====
async function carregarRanking() {
  const lista = document.getElementById('lista-ranking');
  if (!lista) return;
  lista.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    const q = query(ref(db, 'users'), orderByChild('points'), limitToLast(50));
    const snap = await get(q);
    if (!snap.exists()) { lista.innerHTML = '<div class="empty-msg">Nenhum usuário ainda</div>'; return; }
    const users = [];
    snap.forEach(c => users.push({ uid: c.key, ...c.val() }));
    users.sort((a,b) => (b.points||0) - (a.points||0));
    const medalhas = ['🥇','🥈','🥉'];
    // Minha posição
    const myIdx = users.findIndex(u => u.uid === usuarioAtual?.uid);
    const minhaPos = document.getElementById('minha-posicao');
    if (myIdx >= 0 && dadosUsuario) {
      minhaPos.classList.remove('oculto');
      minhaPos.innerHTML = `<span style="font-size:22px;font-weight:800;color:#10B981">#${myIdx+1}</span><div style="flex:1"><div style="font-weight:600;font-size:14px">Sua posição atual</div><div style="color:#64748B;font-size:12px">${dadosUsuario.points||0} pontos</div></div>`;
    }
    lista.innerHTML = users.map((u, i) => {
      const eu = u.uid === usuarioAtual?.uid;
      const pts = u.points || 0;
      const ptsColor = i===0 ? '#FBBF24' : i===1 ? '#94A3B8' : i===2 ? '#CD7C2F' : eu ? '#10B981' : '#F1F5F9';
      const av = u.avatar ? `<img src="${u.avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : (u.fullname||'U')[0].toUpperCase();
      return `
        <div class="rank-item ${eu ? 'eu' : ''}">
          <div class="rank-pos">${i<3 ? medalhas[i] : `<span style="font-size:13px;font-weight:700;color:${eu?'#10B981':'#64748B'}">#${i+1}</span>`}</div>
          <div class="avatar-mini">${av}</div>
          <div class="rank-info">
            <div class="rank-nome">${u.fullname||'Usuário'}</div>
            <div class="rank-user">@${u.username||''}</div>
          </div>
          <div class="rank-pts" style="color:${ptsColor}">${pts} <span style="font-size:11px;color:#64748B">pts</span></div>
        </div>
      `;
    }).join('');
  } catch(e) { lista.innerHTML = '<div class="empty-msg">Erro ao carregar</div>'; console.error(e); }
}

// ===== DESAFIOS =====
async function carregarDesafios() {
  const lista = document.getElementById('lista-desafios');
  if (!lista) return;
  lista.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    const snap = await get(ref(db, 'desafios'));
    if (!snap.exists()) { lista.innerHTML = '<div class="empty-msg" style="text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:10px">⚡</div><div style="font-weight:600">Nenhum desafio ativo</div><div style="color:#64748B;margin-top:6px;font-size:13px">Volte mais tarde para novos desafios</div></div>'; return; }
    const desafios = [];
    snap.forEach(c => {
      const v = c.val();
      if (v.endDate > Date.now()) desafios.push({ id: c.key, ...v });
    });
    desafios.sort((a,b) => a.endDate - b.endDate);
    if (desafios.length === 0) { lista.innerHTML = '<div class="empty-msg" style="text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:10px">⚡</div><div style="font-weight:600">Nenhum desafio ativo</div></div>'; return; }
    lista.innerHTML = desafios.map(d => `
      <button class="desafio-card" onclick="abrirDesafio('${d.id}')">
        ${d.banner ? `<img src="${d.banner}" alt="${d.title}" onerror="this.style.display='none'" />` : ''}
        <div class="desafio-body">
          <div class="desafio-top">
            <div class="desafio-titulo">${d.title}</div>
            <span class="item-badge">+${d.prize} pts</span>
          </div>
          <div class="desafio-desc">${d.description||''}</div>
          <div class="desafio-footer">
            <span class="desafio-materia">📚 ${d.materia||''}</span>
            <span class="desafio-timer">⏱ ${tempoRestante(d.endDate)}</span>
          </div>
        </div>
      </button>
    `).join('');
  } catch(e) { lista.innerHTML = '<div class="empty-msg">Erro ao carregar</div>'; console.error(e); }
}

function tempoRestante(endDate) {
  const diff = endDate - Date.now();
  if (diff <= 0) return 'Encerrado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h/24)}d ${h%24}h` : `${h}h ${m}min`;
}

window.abrirDesafio = async function(id) {
  try {
    const snap = await get(ref(db, `desafios/${id}`));
    if (!snap.exists()) return;
    desafioAtual = { id, ...snap.val() };
    mostrarTelaApp('tela-desafios');
    // Verificar participação
    const jaParticipou = usuarioAtual && desafioAtual.participacoes && desafioAtual.participacoes[usuarioAtual.uid];
    const container = document.getElementById('lista-desafios');
    container.innerHTML = `
      ${desafioAtual.banner ? `<img src="${desafioAtual.banner}" alt="" style="width:100%;border-radius:16px;height:140px;object-fit:cover;margin-bottom:16px" onerror="this.style.display='none'" />` : ''}
      <button class="btn-voltar" onclick="carregarDesafios()">← Voltar</button>
      <h1 style="margin-bottom:8px">${desafioAtual.title}</h1>
      <p class="subtitulo" style="margin-bottom:16px">${desafioAtual.description||''}</p>
      <div style="display:flex;gap:16px;font-size:13px;color:#64748B;margin-bottom:20px">
        <span>📚 ${desafioAtual.materia||''}</span>
        <span>❓ ${(desafioAtual.questions||[]).length} questões</span>
        <span style="color:#10B981">+${desafioAtual.prize} pts</span>
      </div>
      ${jaParticipou
        ? '<div style="text-align:center;padding:24px;color:#64748B;border:1px solid #334155;border-radius:16px">Você já participou deste desafio!</div>'
        : `<button class="btn-primary" onclick="iniciarDesafio()">Iniciar Desafio</button>`}
    `;
  } catch(e) { console.error(e); }
};

window.iniciarDesafio = function() {
  if (!desafioAtual || !desafioAtual.questions || desafioAtual.questions.length === 0) {
    toast('Este desafio não tem questões', 'erro'); return;
  }
  desafioQuestaoIdx = 0; desafioAcertos = 0;
  mostrarTelaApp('tela-desafio-quiz');
  mostrarQuestaoDesafio();
};

function mostrarQuestaoDesafio() {
  const q = desafioAtual.questions[desafioQuestaoIdx];
  const total = desafioAtual.questions.length;
  document.getElementById('desafio-quiz-prog').textContent = `${desafioQuestaoIdx+1}/${total}`;
  document.getElementById('desafio-progress-fill').style.width = `${(desafioQuestaoIdx/total)*100}%`;
  document.getElementById('desafio-pergunta-texto').textContent = q.question;
  const letras = ['A','B','C','D'];
  document.getElementById('desafio-opcoes').innerHTML = q.options.map((opt,i) => `
    <button class="opcao" onclick="responderDesafio(${i})">
      <div class="opcao-letra">${letras[i]}</div>
      <div class="opcao-texto">${opt}</div>
    </button>
  `).join('');
}

window.responderDesafio = async function(idx) {
  const q = desafioAtual.questions[desafioQuestaoIdx];
  if (idx === q.correct) desafioAcertos++;
  document.querySelectorAll('#desafio-opcoes .opcao').forEach((el, i) => {
    el.classList.add('disabled');
    if (i === q.correct) el.classList.add('certa');
    else if (i === idx) el.classList.add('errada');
    else el.classList.add('neutra');
  });
  setTimeout(async function() {
    desafioQuestaoIdx++;
    if (desafioQuestaoIdx >= desafioAtual.questions.length) {
      await finalizarDesafio();
    } else {
      mostrarQuestaoDesafio();
    }
  }, 1800);
};

async function finalizarDesafio() {
  const total = desafioAtual.questions.length;
  const pct = desafioAcertos / total;
  const earned = Math.round(pct * desafioAtual.prize);
  if (usuarioAtual) {
    try {
      await set(ref(db, `desafios/${desafioAtual.id}/participacoes/${usuarioAtual.uid}`), {
        userId: usuarioAtual.uid, correctAnswers: desafioAcertos, total, earned, createdAt: Date.now()
      });
      const novosPontos = (dadosUsuario?.points || 0) + earned;
      await update(ref(db, `users/${usuarioAtual.uid}`), { points: novosPontos });
      if (dadosUsuario) dadosUsuario.points = novosPontos;
      atualizarHeader();
    } catch(e) { console.error(e); }
  }
  mostrarTelaApp('tela-desafio-resultado');
  document.getElementById('desafio-res-pts').textContent = `+${earned}`;
  const pctEl = document.getElementById('desafio-res-pts');
  pctEl.textContent = `+${earned}`;
  document.querySelector('#tela-desafio-resultado .subtitulo').textContent = `pontos ganhos (${Math.round(pct*100)}% de acerto)`;
}

// ===== JARVIS IA =====
window.enviarJarvis = async function() {
  const input = document.getElementById('jarvis-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  adicionarMensagemJarvis('user', msg);
  histJarvis.push({ role: 'user', content: msg });
  mostrarTyping();
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é Jarvis, um assistente de IA educacional do Sexta-Feira Studies. Ajude estudantes com dúvidas, explique conceitos, crie exemplos e encoraje o aprendizado. Responda sempre em português. Seja didático e encorajador.' },
          ...histJarvis
        ],
        temperature: 0.7, max_tokens: 1024
      })
    });
    removerTyping();
    if (!resp.ok) throw new Error('Erro na API');
    const data = await resp.json();
    const reply = data.choices[0].message.content;
    histJarvis.push({ role: 'assistant', content: reply });
    adicionarMensagemJarvis('assistant', reply);
  } catch(e) {
    removerTyping();
    adicionarMensagemJarvis('assistant', 'Desculpe, ocorreu um erro. Tente novamente!');
    console.error(e);
  }
};

function adicionarMensagemJarvis(role, content) {
  const container = document.getElementById('jarvis-mensagens');
  const el = document.createElement('div');
  el.className = role === 'user' ? 'msg-user' : 'msg-jarvis';
  if (role === 'assistant') {
    el.innerHTML = `<img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" class="msg-avatar" alt="Jarvis" /><div class="msg-balao jarvis">${content}</div>`;
  } else {
    el.innerHTML = `<div class="msg-balao usuario">${content}</div>`;
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function mostrarTyping() {
  const container = document.getElementById('jarvis-mensagens');
  const el = document.createElement('div');
  el.className = 'msg-jarvis'; el.id = 'typing-indicator';
  el.innerHTML = `<img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" class="msg-avatar" alt="Jarvis" /><div class="msg-balao jarvis typing-dots"><span></span><span></span><span></span></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function removerTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ===== PERFIL =====
function atualizarPerfil() {
  if (!dadosUsuario) return;
  const nome = document.getElementById('perfil-nome');
  const username = document.getElementById('perfil-username');
  const avatarEl = document.getElementById('perfil-avatar');
  const selos = document.getElementById('perfil-selos');
  if (nome) nome.textContent = dadosUsuario.fullname || '';
  if (username) username.textContent = '@' + (dadosUsuario.username || '');
  if (avatarEl) {
    if (dadosUsuario.avatar) {
      avatarEl.innerHTML = `<img src="${dadosUsuario.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    } else {
      avatarEl.textContent = (dadosUsuario.fullname || 'U')[0].toUpperCase();
    }
  }
  document.getElementById('perfil-pontos').textContent = dadosUsuario.points || 0;
  document.getElementById('perfil-quizzes').textContent = dadosUsuario.quizzesPlayed || 0;
  document.getElementById('bio-texto').textContent = dadosUsuario.bio || 'Nenhuma bio ainda.';
  document.getElementById('bio-input').value = dadosUsuario.bio || '';
  // Selos
  if (selos) {
    const selosHtml = [];
    if ((dadosUsuario.adminLevel||0) > 0) selosHtml.push(`<div class="selo"><img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" />Admin</div>`);
    if (dadosUsuario.isProf) selosHtml.push(`<div class="selo"><img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" />Professor</div>`);
    if (dadosUsuario.plano !== 'free') selosHtml.push(`<div class="selo"><img src="https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png" />Premium</div>`);
    if (dadosUsuario.isQuizzer) selosHtml.push(`<div class="selo"><img src="https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png" />Quizzer</div>`);
    if (dadosUsuario.isVerified) selosHtml.push(`<div class="selo"><img src="https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png" />Verificado</div>`);
    selos.innerHTML = selosHtml.join('');
  }
}

window.toggleEditarBio = function() {
  const editor = document.getElementById('bio-editor');
  editor.classList.toggle('oculto');
};

window.salvarBio = async function() {
  if (!usuarioAtual) return;
  const bio = document.getElementById('bio-input').value.trim();
  try {
    await update(ref(db, `users/${usuarioAtual.uid}`), { bio });
    if (dadosUsuario) dadosUsuario.bio = bio;
    document.getElementById('bio-texto').textContent = bio || 'Nenhuma bio ainda.';
    document.getElementById('bio-editor').classList.add('oculto');
    toast('Bio atualizada!', 'sucesso');
  } catch(e) { toast('Erro ao salvar', 'erro'); }
};

window.uploadAvatar = async function(input) {
  const file = input.files[0];
  if (!file || !usuarioAtual) return;
  toast('Fazendo upload...');
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      const url = data.data.url;
      await update(ref(db, `users/${usuarioAtual.uid}`), { avatar: url });
      if (dadosUsuario) dadosUsuario.avatar = url;
      atualizarPerfil();
      atualizarHeader();
      toast('Avatar atualizado!', 'sucesso');
    } else { toast('Erro no upload', 'erro'); }
  } catch(e) { toast('Erro ao fazer upload', 'erro'); console.error(e); }
};
