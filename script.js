// ===== SEXTA-FEIRA STUDIES - SCRIPT.JS =====
// Firebase e Groq/Gemini integrados

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, sendPasswordResetEmail, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, push, update, remove, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
  authDomain: "sexta-feira-studies.firebaseapp.com",
  databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
  projectId: "sexta-feira-studies"
};

const GROQ_KEY = "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";
const GEMINI_KEY = "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY";
const IMGBB_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// ===== ESTADO GLOBAL =====
let usuarioAtual = null;
let discAtual = null;
let turmaAtual = null;
let postAtual = null;
let quizAtual = null;
let quizQuestaoIdx = 0;
let quizAcertos = 0;
let quizTimer = null;
let quizContadorQuestoes = 0;
let chatImagemBase64 = null;
let postImagemUrl = null;
let paginaAnterior = null;
let historicoPaginas = [];

// ===== AUTH STATE =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    carregarUsuario(user.uid);
  } else {
    mostrarAuth();
  }
});

function mostrarAuth() {
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('bottomNav').style.display = 'none';
  mostrarTela('auth');
}

async function carregarUsuario(uid) {
  const snap = await get(ref(db, `usuarios/${uid}`));
  if (snap.exists()) {
    usuarioAtual = { uid, ...snap.val() };
  } else {
    const u = auth.currentUser;
    usuarioAtual = {
      uid,
      fullname: u.displayName || 'Usuário',
      username: u.email.split('@')[0],
      email: u.email,
      avatar: u.photoURL || '',
      bio: '',
      points: 0,
      plano: 'free',
      adminLevel: 0,
      isProf: false,
      isQuizzer: false,
      createdAt: Date.now()
    };
    await set(ref(db, `usuarios/${uid}`), usuarioAtual);
  }
  iniciarApp();
}

function iniciarApp() {
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('bottomNav').style.display = 'flex';
  atualizarTopbarAvatar();
  historicoPaginas = [];
  navegarPara('home');
  carregarNotificacoesContagem();
}

// ===== NAVEGAÇÃO =====
function mostrarTela(nome) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  const el = document.getElementById(`tela-${nome}`);
  if (el) el.classList.add('ativa');
  // Atualizar nav ativo
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
  const navEl = document.getElementById(`nav-${nome}`);
  if (navEl) navEl.classList.add('ativo');
}

window.navegarPara = function(nome) {
  fecharDropdowns();
  // Guardar a página atual no histórico antes de navegar
  const telaAtiva = document.querySelector('.tela.ativa');
  if (telaAtiva) {
    const idAtual = telaAtiva.id.replace('tela-', '');
    if (idAtual !== nome && idAtual !== 'auth') {
      historicoPaginas.push(idAtual);
    }
  }
  mostrarTela(nome);
  // Carregar conteúdo da página
  switch(nome) {
    case 'home': carregarHome(); break;
    case 'disciplinas': carregarDisciplinas(); break;
    case 'ranking': carregarRanking(); break;
    case 'feed': carregarFeed(); break;
    case 'desafios': carregarDesafios(); break;
    case 'agenda': carregarAgenda(); break;
    case 'anotacoes': carregarAnotacoes(); break;
    case 'chamada': carregarChamada(); break;
    case 'perfil': carregarPerfil(); break;
    case 'notificacoes': carregarNotificacoes(); break;
    case 'sobre': carregarSobre(); break;
    case 'updates': carregarUpdates(); break;
    case 'config': carregarConfig(); break;
  }
}

window.voltarPagina = function() {
  if (historicoPaginas.length > 0) {
    const anterior = historicoPaginas.pop();
    mostrarTela(anterior);
    // Recarregar conteúdo se necessário
    switch(anterior) {
      case 'home': carregarHome(); break;
      case 'disciplinas': carregarDisciplinas(); break;
      case 'disc-detalhe': if (discAtual) abrirDisciplina(discAtual, true); break;
      case 'ranking': carregarRanking(); break;
      case 'feed': carregarFeed(); break;
      case 'desafios': carregarDesafios(); break;
      case 'agenda': carregarAgenda(); break;
      case 'anotacoes': carregarAnotacoes(); break;
      case 'chamada': carregarChamada(); break;
      case 'perfil': carregarPerfil(); break;
    }
  } else {
    navegarPara('home');
  }
}

// Navegar internamente (sem salvar histórico extra, apenas empilha)
function irParaTela(nome, carregarFn) {
  const telaAtiva = document.querySelector('.tela.ativa');
  if (telaAtiva) {
    const idAtual = telaAtiva.id.replace('tela-', '');
    if (idAtual !== nome) historicoPaginas.push(idAtual);
  }
  mostrarTela(nome);
  if (carregarFn) carregarFn();
}

// ===== AUTH FUNCTIONS =====
window.trocarAuthTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('ativa'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('ativa'));
  event.target.classList.add('ativa');
  document.getElementById(`form-${tab}`).classList.add('ativa');
}

window.fazerLogin = async function() {
  const emailInput = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  if (!emailInput || !senha) return mostrarToast('Preencha todos os campos', 'erro');
  
  let email = emailInput;
  // Se começar com @, buscar email pelo username
  if (emailInput.startsWith('@') || !emailInput.includes('@')) {
    const username = emailInput.replace('@','');
    try {
      const snap = await get(ref(db, 'usuarios'));
      let encontrado = false;
      snap.forEach(child => {
        if (child.val().username === username) {
          email = child.val().email;
          encontrado = true;
        }
      });
      if (!encontrado) return mostrarToast('Usuário não encontrado', 'erro');
    } catch(e) { return mostrarToast('Erro ao buscar usuário', 'erro'); }
  }
  
  try {
    mostrarToast('Entrando...', '');
    await signInWithEmailAndPassword(auth, email, senha);
  } catch(e) {
    mostrarToast('Email ou senha incorretos', 'erro');
  }
}

window.fazerCadastro = async function() {
  const nome = document.getElementById('cad-nome').value.trim();
  const usuario = document.getElementById('cad-usuario').value.trim().replace('@','');
  const email = document.getElementById('cad-email').value.trim();
  const senha = document.getElementById('cad-senha').value;
  if (!nome || !usuario || !email || !senha) return mostrarToast('Preencha todos os campos', 'erro');
  if (senha.length < 6) return mostrarToast('Senha mínima: 6 caracteres', 'erro');
  try {
    mostrarToast('Criando conta...', '');
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = cred.user.uid;
    const dados = { fullname: nome, username: usuario, email, avatar: '', bio: '', points: 0, plano: 'free', adminLevel: 0, isProf: false, isQuizzer: false, createdAt: Date.now() };
    await set(ref(db, `usuarios/${uid}`), dados);
    mostrarToast('Conta criada com sucesso! 🎉');
  } catch(e) {
    mostrarToast(e.code === 'auth/email-already-in-use' ? 'Email já cadastrado' : 'Erro ao criar conta', 'erro');
  }
}

window.loginGoogle = async function() {
  try {
    await signInWithPopup(auth, provider);
  } catch(e) {
    mostrarToast('Erro ao entrar com Google', 'erro');
  }
}

window.fazerLogout = async function() {
  fecharDropdowns();
  await signOut(auth);
  historicoPaginas = [];
}

window.mostrarRecuperacao = function() {
  abrirModal('modalRecuperacao');
}

window.enviarRecuperacao = async function() {
  const email = document.getElementById('recuperacaoEmail').value.trim();
  if (!email) return mostrarToast('Digite seu email', 'erro');
  try {
    await sendPasswordResetEmail(auth, email);
    mostrarToast('Email de recuperação enviado!');
    fecharModal('modalRecuperacao');
  } catch(e) {
    mostrarToast('Erro ao enviar email', 'erro');
  }
}

window.alterarSenha = async function() {
  const nova = document.getElementById('configSenha').value;
  if (!nova || nova.length < 6) return mostrarToast('Senha mínima: 6 caracteres', 'erro');
  try {
    await updatePassword(auth.currentUser, nova);
    mostrarToast('Senha alterada!');
    document.getElementById('configSenha').value = '';
  } catch(e) {
    mostrarToast('Faça login novamente para alterar a senha', 'aviso');
  }
}

// ===== HOME =====
async function carregarHome() {
  if (!usuarioAtual) return;
  // Saudação
  const hora = new Date().getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('saudacaoNome').textContent = `${saud}, ${usuarioAtual.fullname.split(' ')[0]}! 👋`;
  document.getElementById('saudacaoSub').textContent = 'Pronto para estudar hoje?';
  
  // Stats
  document.getElementById('statXP').textContent = usuarioAtual.points || 0;
  
  // Quizzes feitos
  const histSnap = await get(ref(db, `historico/${usuarioAtual.uid}`));
  const totalQuizzes = histSnap.exists() ? Object.keys(histSnap.val()).length : 0;
  document.getElementById('statQuizzes').textContent = totalQuizzes;
  
  // Ranking
  const rankSnap = await get(ref(db, 'usuarios'));
  let pos = 1;
  if (rankSnap.exists()) {
    const lista = [];
    rankSnap.forEach(c => lista.push(c.val().points || 0));
    lista.sort((a,b) => b-a);
    pos = lista.indexOf(usuarioAtual.points) + 1;
  }
  document.getElementById('statRanking').textContent = `#${pos}`;
  
  // Disciplinas
  const discSnap = await get(ref(db, 'materias'));
  document.getElementById('statDisciplinas').textContent = discSnap.exists() ? Object.keys(discSnap.val()).length : 0;
  
  // Nível
  const pts = usuarioAtual.points || 0;
  const nivel = Math.floor(pts / 100) + 1;
  const xpAtual = pts % 100;
  document.getElementById('nivelLabel').textContent = `Nível ${nivel}`;
  document.getElementById('progressFill').style.width = `${xpAtual}%`;
  document.getElementById('progressText').textContent = `${xpAtual} / 100 XP`;
  
  // Banner desafio
  const dSnap = await get(ref(db, 'desafios'));
  if (dSnap.exists()) {
    const agora = Date.now();
    let ativo = null;
    dSnap.forEach(c => {
      const d = c.val();
      if (d.inicio <= agora && d.fim >= agora) ativo = d;
    });
    if (ativo) {
      document.getElementById('bannerDesafioTitulo').textContent = ativo.titulo;
      document.getElementById('bannerDesafioDesc').textContent = ativo.descricao || 'Participe e ganhe XP extra!';
      document.getElementById('bannerDesafio').style.display = 'block';
    }
  }
  
  // Próximos eventos
  const evSnap = await get(ref(db, `agenda/${usuarioAtual.uid}`));
  const proxEventosEl = document.getElementById('proximosEventos');
  if (evSnap.exists()) {
    const eventos = [];
    evSnap.forEach(c => eventos.push({ id: c.key, ...c.val() }));
    const agora = new Date().toISOString().split('T')[0];
    const prox = eventos.filter(e => e.data >= agora && !e.concluido).slice(0, 3);
    if (prox.length > 0) {
      proxEventosEl.innerHTML = prox.map(ev => `
        <div class="evento-card">
          <div class="evento-cor" style="background:${ev.cor||'var(--verde)'}"></div>
          <div class="evento-info">
            <div class="evento-titulo">${ev.titulo}</div>
            <div class="evento-meta">${formatarData(ev.data)} ${ev.hora ? '· '+ev.hora : ''} · ${ev.disciplina||''}</div>
          </div>
          <span class="tag tag-${corTipoEvento(ev.tipo)}">${ev.tipo||'Evento'}</span>
        </div>
      `).join('');
    } else {
      proxEventosEl.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fas fa-calendar" style="font-size:28px;"></i><p>Nenhum evento próximo</p></div>';
    }
  }
  
  // Feed resumo (3 posts)
  const feedSnap = await get(query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(3)));
  const homeFeedEl = document.getElementById('homeFeed');
  if (feedSnap.exists()) {
    const posts = [];
    feedSnap.forEach(c => posts.unshift({ id: c.key, ...c.val() }));
    homeFeedEl.innerHTML = posts.map(p => renderPost(p)).join('');
  } else {
    homeFeedEl.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fas fa-newspaper" style="font-size:28px;"></i><p>Nenhum post ainda</p></div>';
  }
}

// ===== DISCIPLINAS =====
async function carregarDisciplinas() {
  const snap = await get(ref(db, 'materias'));
  const grid = document.getElementById('gridDisciplinas');
  if (!snap.exists()) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><h4>Nenhum item</h4><p>Crie sua primeira disciplina</p></div>';
    return;
  }
  const disc = [];
  snap.forEach(c => disc.push({ id: c.key, ...c.val() }));
  grid.innerHTML = disc.map(d => `
    <div class="disciplina-card" onclick="abrirDisciplina('${d.id}')">
      <div class="disc-icon">${d.icone || '📚'}</div>
      <div class="disc-nome">${d.nome}</div>
      <div class="disc-info">${d.descricao || ''}</div>
    </div>
  `).join('');
}

window.criarDisciplina = async function() {
  const nome = document.getElementById('discNome').value.trim();
  const desc = document.getElementById('discDesc').value.trim();
  const icone = document.getElementById('discIcone').value.trim() || '📚';
  if (!nome) return mostrarToast('Informe o nome', 'erro');
  const dados = { nome, descricao: desc, icone, autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname, createdAt: Date.now() };
  await push(ref(db, 'materias'), dados);
  fecharModal('modalNovaDisc');
  ['discNome','discDesc','discIcone'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Disciplina criada!');
  carregarDisciplinas();
}

window.abrirDisciplina = function(id, semHistorico) {
  if (!semHistorico) {
    const telaAtiva = document.querySelector('.tela.ativa');
    if (telaAtiva) historicoPaginas.push(telaAtiva.id.replace('tela-', ''));
  }
  discAtual = id;
  get(ref(db, `materias/${id}`)).then(snap => {
    if (snap.exists()) {
      document.getElementById('discDetalheTitulo').textContent = `${snap.val().icone||'📚'} ${snap.val().nome}`;
    }
  });
  mostrarTela('disc-detalhe');
  trocarTabDisc('aulas', document.querySelector('#tela-disc-detalhe .tab-btn'));
  carregarAulas();
}

// ===== TABS =====
window.trocarTabDisc = function(nome, btn) {
  ['aulas','quizzes','videos'].forEach(t => {
    const el = document.getElementById(`tabDisc-${t}`);
    if (el) el.style.display = t === nome ? 'block' : 'none';
  });
  document.querySelectorAll('#tela-disc-detalhe .tab-btn').forEach(b => b.classList.remove('ativo'));
  if (btn) btn.classList.add('ativo');
  else {
    const btns = document.querySelectorAll('#tela-disc-detalhe .tab-btn');
    if (nome === 'aulas' && btns[0]) btns[0].classList.add('ativo');
    if (nome === 'quizzes' && btns[1]) btns[1].classList.add('ativo');
    if (nome === 'videos' && btns[2]) btns[2].classList.add('ativo');
  }
  if (nome === 'aulas') carregarAulas();
  if (nome === 'quizzes') carregarQuizzes();
  if (nome === 'videos') carregarVideos();
}

window.trocarTabPerfil = function(nome, btn) {
  ['historico','desempenho','ficha'].forEach(t => {
    const el = document.getElementById(`tabPerfil-${t}`);
    if (el) el.style.display = t === nome ? 'block' : 'none';
  });
  document.querySelectorAll('#tela-perfil .tab-btn').forEach(b => b.classList.remove('ativo'));
  if (btn) btn.classList.add('ativo');
  if (nome === 'historico') carregarHistoricoQuizzes();
  if (nome === 'desempenho') carregarGraficoDesempenho();
  if (nome === 'ficha') carregarFichaAluno();
}

// ===== AULAS =====
async function carregarAulas() {
  if (!discAtual) return;
  const snap = await get(ref(db, `aulas/${discAtual}`));
  const lista = document.getElementById('listaAulas');
  if (!snap.exists()) {
    lista.innerHTML = '<div class="empty-state"><i class="fas fa-book-open"></i><h4>Nenhum item</h4><p>Crie a primeira aula</p></div>';
    return;
  }
  const aulas = [];
  snap.forEach(c => aulas.push({ id: c.key, ...c.val() }));
  lista.innerHTML = aulas.map(a => `
    <div class="aula-card" onclick="abrirAula('${a.id}')">
      <h4>${a.titulo}</h4>
      <p>${(a.conteudo||'').substring(0,100)}${a.conteudo&&a.conteudo.length>100?'...':''}</p>
      <div class="aula-meta">
        <span><i class="fas fa-eye"></i> ${a.views||0} views</span>
        <span><i class="fas fa-user"></i> ${a.autorNome||''}</span>
        ${a.youtubeUrl ? '<span><i class="fab fa-youtube" style="color:#EF4444;"></i> Vídeo</span>' : ''}
      </div>
    </div>
  `).join('');
}

window.criarAula = async function() {
  const titulo = document.getElementById('aulaTitulo').value.trim();
  const conteudo = document.getElementById('aulaConteudo').value.trim();
  const youtube = document.getElementById('aulaYoutube').value.trim();
  if (!titulo) return mostrarToast('Informe o título', 'erro');
  const dados = { titulo, conteudo, youtubeUrl: youtube, autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname, views: 0, verificado: false, createdAt: Date.now() };
  await push(ref(db, `aulas/${discAtual}`), dados);
  fecharModal('modalNovaAula');
  ['aulaTitulo','aulaConteudo','aulaYoutube'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Aula criada!');
  carregarAulas();
}

window.abrirAula = async function(id) {
  historicoPaginas.push('disc-detalhe');
  const snap = await get(ref(db, `aulas/${discAtual}/${id}`));
  if (!snap.exists()) return;
  const aula = snap.val();
  // Incrementar views
  await update(ref(db, `aulas/${discAtual}/${id}`), { views: (aula.views||0)+1 });
  document.getElementById('aulaDetalheTitulo').textContent = aula.titulo;
  document.getElementById('aulaDetalheConteudo').textContent = aula.conteudo || '';
  document.getElementById('aulaViews').textContent = (aula.views||0)+1;
  document.getElementById('aulaAutor').textContent = aula.autorNome || '';
  // Video
  const videoDiv = document.getElementById('aulaDetalheVideo');
  if (aula.youtubeUrl) {
    const id_yt = extrairYtId(aula.youtubeUrl);
    videoDiv.innerHTML = id_yt ? `
      <div style="background:#000;border-radius:12px;overflow:hidden;position:relative;">
        <img src="https://img.youtube.com/vi/${id_yt}/mqdefault.jpg" style="width:100%;display:block;cursor:pointer;" onclick="abrirVideo('${aula.youtubeUrl}','${aula.titulo}')" />
        <div onclick="abrirVideo('${aula.youtubeUrl}','${aula.titulo}')" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <div style="width:56px;height:56px;background:rgba(255,0,0,0.85);border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-play" style="color:white;font-size:22px;margin-left:4px;"></i></div>
        </div>
      </div>
    ` : '';
  } else { videoDiv.innerHTML = ''; }
  // Carregar comentários
  window._aulaDetalheId = id;
  carregarComentariosAula(id);
  mostrarTela('aula-detalhe');
}

async function carregarComentariosAula(aulaId) {
  const snap = await get(ref(db, `comentarios/${discAtual}/${aulaId}`));
  const lista = document.getElementById('listaComentarios');
  if (!snap.exists()) { lista.innerHTML = '<p style="color:var(--texto-muted);font-size:13px;">Nenhum comentário ainda.</p>'; return; }
  const coms = [];
  snap.forEach(c => coms.push({ id: c.key, ...c.val() }));
  lista.innerHTML = coms.map(c => `
    <div class="comentario-item">
      <img class="comentario-avatar" src="${c.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(c.autorNome)+'&background=10B981&color=fff'}" />
      <div class="comentario-bubble">
        <div class="comentario-nome">${c.autorNome}</div>
        <div class="comentario-texto">${c.texto}</div>
        <div class="comentario-data">${formatarDataHora(c.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

window.comentarAula = async function() {
  const texto = document.getElementById('comentarioInput').value.trim();
  if (!texto) return;
  const aulaId = window._aulaDetalheId;
  await push(ref(db, `comentarios/${discAtual}/${aulaId}`), {
    texto, autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname,
    avatar: usuarioAtual.avatar || '', createdAt: Date.now()
  });
  document.getElementById('comentarioInput').value = '';
  carregarComentariosAula(aulaId);
  mostrarToast('Comentário enviado!');
}

// ===== QUIZZES =====
let questoesCount = 0;
async function carregarQuizzes() {
  if (!discAtual) return;
  const snap = await get(ref(db, `quizzes/${discAtual}`));
  const lista = document.getElementById('listaQuizzes');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-question-circle"></i><h4>Nenhum item</h4><p>Crie o primeiro quiz</p></div>'; return; }
  const quizzes = [];
  snap.forEach(c => quizzes.push({ id: c.key, ...c.val() }));
  lista.innerHTML = quizzes.map(q => `
    <div class="quiz-card" onclick="iniciarQuiz('${q.id}')">
      <div class="quiz-icon"><i class="fas fa-gamepad"></i></div>
      <div class="quiz-info">
        <div class="quiz-nome">${q.nome}</div>
        <div class="quiz-meta">${(q.questoes||[]).length} questões · ${q.tempo||30}s por questão</div>
      </div>
      <span class="quiz-xp">+${(q.questoes||[]).length * 10} XP</span>
    </div>
  `).join('');
}

window.adicionarQuestao = function() {
  questoesCount++;
  const i = questoesCount;
  const editor = document.getElementById('questoesEditor');
  const div = document.createElement('div');
  div.className = 'questao-box';
  div.id = `questao-${i}`;
  div.innerHTML = `
    <div class="questao-titulo">
      <span>Questão ${i+1}</span>
      <button class="btn btn-ghost" style="font-size:18px;" onclick="this.closest('.questao-box').remove()"><i class="fas fa-trash" style="color:var(--danger);"></i></button>
    </div>
    <input type="text" placeholder="Pergunta..." id="q${i}-pergunta" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;margin-bottom:8px;" />
    <div style="display:flex;flex-direction:column;gap:6px;">
      <input type="text" placeholder="A) ..." id="q${i}-a" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
      <input type="text" placeholder="B) ..." id="q${i}-b" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
      <input type="text" placeholder="C) ..." id="q${i}-c" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
      <input type="text" placeholder="D) ..." id="q${i}-d" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
    </div>
    <div style="margin-top:8px;">
      <label style="font-size:12px;font-weight:600;">Resposta correta</label>
      <select id="q${i}-correta" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;margin-top:4px;">
        <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
      </select>
    </div>
  `;
  editor.appendChild(div);
}

// Inicializar a primeira questão no modal
window.abrirModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('aberto');
  if (id === 'modalNovoQuiz') {
    questoesCount = 0;
    const editor = document.getElementById('questoesEditor');
    editor.innerHTML = `
      <div class="questao-box" id="questao-0">
        <div class="questao-titulo">
          <span>Questão 1</span>
          <button class="btn btn-ghost" style="font-size:18px;" onclick="this.closest('.questao-box').remove()"><i class="fas fa-trash" style="color:var(--danger);"></i></button>
        </div>
        <input type="text" placeholder="Pergunta..." id="q0-pergunta" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;margin-bottom:8px;" />
        <div style="display:flex;flex-direction:column;gap:6px;">
          <input type="text" placeholder="A) ..." id="q0-a" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
          <input type="text" placeholder="B) ..." id="q0-b" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
          <input type="text" placeholder="C) ..." id="q0-c" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
          <input type="text" placeholder="D) ..." id="q0-d" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;" />
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:12px;font-weight:600;">Resposta correta</label>
          <select id="q0-correta" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;margin-top:4px;">
            <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
          </select>
        </div>
      </div>
    `;
  }
  document.addEventListener('keydown', fecharModalEsc);
}

window.fecharModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('aberto');
}

function fecharModalEsc(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.aberto').forEach(m => m.classList.remove('aberto'));
    document.removeEventListener('keydown', fecharModalEsc);
  }
}

// Fechar modal ao clicar no overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('aberto');
  });
});

window.criarQuiz = async function() {
  const nome = document.getElementById('quizNome').value.trim();
  const tempo = parseInt(document.getElementById('quizTempo').value) || 30;
  if (!nome) return mostrarToast('Informe o nome', 'erro');
  const questoes = [];
  document.querySelectorAll('#questoesEditor .questao-box').forEach((box, i) => {
    const idxRaw = box.id.replace('questao-','');
    const el = n => document.getElementById(`q${idxRaw}-${n}`);
    if (el('pergunta') && el('pergunta').value.trim()) {
      questoes.push({
        pergunta: el('pergunta').value.trim(),
        alternativas: [el('a').value||'A', el('b').value||'B', el('c').value||'C', el('d').value||'D'],
        correta: parseInt(el('correta').value) || 0
      });
    }
  });
  if (questoes.length === 0) return mostrarToast('Adicione pelo menos 1 questão', 'erro');
  await push(ref(db, `quizzes/${discAtual}`), { nome, tempo, questoes, createdAt: Date.now() });
  fecharModal('modalNovoQuiz');
  mostrarToast('Quiz criado!');
  carregarQuizzes();
}

window.iniciarQuiz = async function(id) {
  const snap = await get(ref(db, `quizzes/${discAtual}/${id}`));
  if (!snap.exists()) return;
  quizAtual = { id, discId: discAtual, ...snap.val() };
  quizQuestaoIdx = 0;
  quizAcertos = 0;
  quizContadorQuestoes = quizAtual.questoes.length;
  historicoPaginas.push('disc-detalhe');
  mostrarTela('quiz');
  mostrarQuestao();
}

function mostrarQuestao() {
  const q = quizAtual.questoes[quizQuestaoIdx];
  const total = quizContadorQuestoes;
  document.getElementById('quizJogoNome').textContent = quizAtual.nome;
  document.getElementById('quizProgresso').textContent = `${quizQuestaoIdx+1} / ${total}`;
  document.getElementById('quizProgressBar').style.width = `${(quizQuestaoIdx/total)*100}%`;
  document.getElementById('quizPerguntaTexto').textContent = q.pergunta;
  const letras = ['A','B','C','D'];
  document.getElementById('quizAlternativas').innerHTML = q.alternativas.map((alt,i) => `
    <button class="alternativa-btn" onclick="responderQuiz(${i})">
      <span class="letra">${letras[i]}</span>${alt}
    </button>
  `).join('');
  // Timer
  let t = quizAtual.tempo || 30;
  document.getElementById('timerCirculo').textContent = t;
  document.getElementById('timerCirculo').className = 'timer-circulo';
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    t--;
    document.getElementById('timerCirculo').textContent = t;
    if (t <= 5) document.getElementById('timerCirculo').className = 'timer-circulo urgente';
    if (t <= 0) { clearInterval(quizTimer); proximaQuestao(false); }
  }, 1000);
}

window.responderQuiz = function(idx) {
  clearInterval(quizTimer);
  const q = quizAtual.questoes[quizQuestaoIdx];
  const btns = document.querySelectorAll('.alternativa-btn');
  btns.forEach((b, i) => {
    b.onclick = null;
    if (i === q.correta) b.classList.add('correta');
    else if (i === idx) b.classList.add('errada');
  });
  const acertou = idx === q.correta;
  if (acertou) quizAcertos++;
  setTimeout(() => proximaQuestao(acertou), 1200);
}

function proximaQuestao(acertou) {
  quizQuestaoIdx++;
  if (quizQuestaoIdx >= quizContadorQuestoes) {
    finalizarQuiz();
  } else {
    mostrarQuestao();
  }
}

async function finalizarQuiz() {
  clearInterval(quizTimer);
  const total = quizContadorQuestoes;
  const pct = Math.round((quizAcertos/total)*100);
  const xp = quizAcertos * 10;
  // Salvar histórico
  await push(ref(db, `historico/${usuarioAtual.uid}`), {
    quizNome: quizAtual.nome, acertos: quizAcertos, total, pct, score: xp,
    disciplina: discAtual, createdAt: Date.now()
  });
  // Adicionar XP
  const novosPts = (usuarioAtual.points||0) + xp;
  await update(ref(db, `usuarios/${usuarioAtual.uid}`), { points: novosPts });
  usuarioAtual.points = novosPts;
  // Mostrar resultado
  document.getElementById('resultadoIcone').textContent = pct >= 70 ? '🎉' : pct >= 40 ? '😊' : '😢';
  document.getElementById('resultadoTitulo').textContent = pct >= 70 ? 'Parabéns!' : pct >= 40 ? 'Bom trabalho!' : 'Continue tentando!';
  document.getElementById('resultadoPts').textContent = `Você acertou ${quizAcertos} de ${total} (${pct}%)`;
  document.getElementById('resultadoXP').textContent = `+${xp} XP`;
  abrirModal('modalResultadoQuiz');
}

window.sairQuiz = function() {
  clearInterval(quizTimer);
  voltarPagina();
}

// ===== VIDEOS =====
async function carregarVideos() {
  if (!discAtual) return;
  const snap = await get(ref(db, `videos/${discAtual}`));
  const lista = document.getElementById('listaVideos');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fab fa-youtube"></i><h4>Nenhum item</h4><p>Adicione o primeiro vídeo</p></div>'; return; }
  const videos = [];
  snap.forEach(c => videos.push({ id: c.key, ...c.val() }));
  lista.innerHTML = videos.map(v => {
    const ytId = extrairYtId(v.url);
    return `
      <div class="aula-card" onclick="abrirVideo('${v.url}','${v.titulo}')">
        ${ytId ? `<img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" style="width:100%;border-radius:8px;margin-bottom:8px;" />` : ''}
        <h4>${v.titulo}</h4>
        <div class="aula-meta"><span><i class="fab fa-youtube" style="color:#EF4444;"></i> YouTube</span></div>
      </div>
    `;
  }).join('');
}

window.criarVideo = async function() {
  const titulo = document.getElementById('videoTitulo').value.trim();
  const url = document.getElementById('videoUrl').value.trim();
  if (!titulo || !url) return mostrarToast('Preencha todos os campos', 'erro');
  await push(ref(db, `videos/${discAtual}`), { titulo, url, autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname, createdAt: Date.now() });
  fecharModal('modalNovoVideo');
  ['videoTitulo','videoUrl'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Vídeo adicionado!');
  carregarVideos();
}

window.abrirVideo = function(url, titulo) {
  const ytId = extrairYtId(url);
  if (!ytId) return;
  document.getElementById('videoTituloOverlay').textContent = titulo;
  document.getElementById('videoFrame').src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  document.getElementById('videoOverlay').classList.add('aberto');
}

window.fecharVideo = function() {
  document.getElementById('videoOverlay').classList.remove('aberto');
  document.getElementById('videoFrame').src = '';
}

// ===== RANKING =====
async function carregarRanking() {
  const snap = await get(ref(db, 'usuarios'));
  if (!snap.exists()) return;
  const lista = [];
  snap.forEach(c => lista.push({ uid: c.key, ...c.val() }));
  lista.sort((a,b) => (b.points||0)-(a.points||0));
  const top50 = lista.slice(0,50);
  
  // Pódio
  const podium = document.getElementById('podium');
  const top3 = top50.slice(0,3);
  if (top3.length >= 3) {
    podium.innerHTML = `
      <div class="podium-item podium-2">
        <img class="podium-avatar" src="${top3[1].avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(top3[1].fullname)+'&background=94A3B8&color=fff'}" />
        <div class="podium-nome">${top3[1].fullname.split(' ')[0]}</div>
        <div class="podium-pts">${top3[1].points||0} pts</div>
        <div class="podium-base">2</div>
      </div>
      <div class="podium-item podium-1">
        <img class="podium-avatar" src="${top3[0].avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(top3[0].fullname)+'&background=F59E0B&color=fff'}" />
        <div class="podium-nome">${top3[0].fullname.split(' ')[0]}</div>
        <div class="podium-pts">${top3[0].points||0} pts</div>
        <div class="podium-base">1</div>
      </div>
      <div class="podium-item podium-3">
        <img class="podium-avatar" src="${top3[2].avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(top3[2].fullname)+'&background=D97706&color=fff'}" />
        <div class="podium-nome">${top3[2].fullname.split(' ')[0]}</div>
        <div class="podium-pts">${top3[2].points||0} pts</div>
        <div class="podium-base">3</div>
      </div>
    `;
  }
  
  // Lista
  const rankLista = document.getElementById('rankingLista');
  const meuPos = top50.findIndex(u => u.uid === usuarioAtual.uid);
  rankLista.innerHTML = top50.slice(3).map((u, i) => `
    <div class="ranking-item ${u.uid === usuarioAtual.uid ? 'meu-rank' : ''}">
      <span class="ranking-pos">${i+4}</span>
      <img class="ranking-avatar" src="${u.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(u.fullname)+'&background=10B981&color=fff'}" />
      <span class="ranking-nome">${u.fullname} ${u.uid===usuarioAtual.uid?'(você)':''}</span>
      <span class="ranking-pts">${u.points||0} pts</span>
    </div>
  `).join('');
}

// ===== JARVIS IA =====
window.enviarMensagem = async function() {
  const input = document.getElementById('chatInput');
  const texto = input.value.trim();
  if (!texto && !chatImagemBase64) return;
  
  const msgs = document.getElementById('chatMessages');
  // Mensagem do usuário
  const imgPreviewEl = document.getElementById('chatImgPreview');
  const imgHTML = chatImagemBase64 ? `<br><img src="${chatImagemBase64}" style="max-width:200px;border-radius:8px;margin-top:6px;" />` : '';
  msgs.innerHTML += `<div class="chat-bubble user">${texto||'Analisar imagem'}${imgHTML}</div>`;
  input.value = '';
  imgPreviewEl.innerHTML = '';
  msgs.innerHTML += `<div class="chat-bubble jarvis" id="jarvisLoading"><img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" onerror="this.src='https://ui-avatars.com/api/?name=J&background=10B981&color=fff'" /><span>Pensando... 🤔</span></div>`;
  msgs.scrollTop = msgs.scrollHeight;
  
  try {
    let resposta = '';
    if (chatImagemBase64) {
      // Usar Gemini para análise de imagem
      const base64Data = chatImagemBase64.split(',')[1];
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: texto || 'Descreva e analise esta imagem de forma educativa.' },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
          ]}]
        })
      });
      const data = await res.json();
      resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui analisar a imagem.';
      chatImagemBase64 = null;
    } else {
      // Usar Groq
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Você é o Jarvis, assistente de estudos do Sexta-Feira Studies. Responda em português de forma clara e educativa. Seja direto e útil.' },
            { role: 'user', content: texto }
          ],
          max_tokens: 1024
        })
      });
      const data = await res.json();
      resposta = data.choices?.[0]?.message?.content || 'Não consegui responder agora.';
    }
    const loading = document.getElementById('jarvisLoading');
    if (loading) {
      loading.querySelector('span').textContent = resposta;
      loading.id = '';
    }
  } catch(e) {
    const loading = document.getElementById('jarvisLoading');
    if (loading) {
      loading.querySelector('span').textContent = 'Erro ao conectar com a IA. Tente novamente.';
      loading.id = '';
    }
  }
  msgs.scrollTop = msgs.scrollHeight;
}

window.previewChatImg = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    chatImagemBase64 = e.target.result;
    document.getElementById('chatImgPreview').innerHTML = `
      <div class="img-preview-wrap">
        <img src="${chatImagemBase64}" class="img-preview" />
        <button class="img-preview-remove" onclick="removerChatImg()"><i class="fas fa-times"></i></button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

window.removerChatImg = function() {
  chatImagemBase64 = null;
  document.getElementById('chatImgPreview').innerHTML = '';
}

// ===== FEED / POSTS =====
async function carregarFeed() {
  const snap = await get(query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(20)));
  const lista = document.getElementById('listaFeed');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><h4>Nenhum item</h4><p>Seja o primeiro a postar!</p></div>'; return; }
  const posts = [];
  snap.forEach(c => posts.unshift({ id: c.key, ...c.val() }));
  lista.innerHTML = posts.map(p => renderPost(p)).join('');
}

function renderPost(p) {
  const curtiu = p.likes && p.likes[usuarioAtual?.uid];
  const totalLikes = p.likes ? Object.keys(p.likes).length : 0;
  const totalComentarios = p.comentarios || 0;
  return `
    <div class="post-card" id="post-${p.id}">
      <div class="post-header">
        <img class="post-avatar" src="${p.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(p.autorNome||'U')+'&background=10B981&color=fff'}" />
        <div class="post-info">
          <div class="post-nome">${p.autorNome||'Usuário'}</div>
          <div class="post-data">${formatarDataHora(p.createdAt)}</div>
        </div>
        <div class="post-selos">
          ${p.isProf ? `<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" title="Professor" />` : ''}
        </div>
        ${p.autorId === usuarioAtual?.uid ? `<button class="btn btn-ghost" onclick="excluirPost('${p.id}')" style="padding:4px 8px;font-size:14px;"><i class="fas fa-trash" style="color:var(--danger);"></i></button>` : ''}
      </div>
      ${p.texto ? `<div class="post-texto">${p.texto}</div>` : ''}
      ${p.imagem ? `<img class="post-img" src="${p.imagem}" />` : ''}
      <div class="post-acoes">
        <button class="post-acao-btn ${curtiu?'curtido':''}" onclick="curtirPost('${p.id}')">
          <i class="${curtiu?'fas':'far'} fa-heart"></i> ${totalLikes}
        </button>
        <button class="post-acao-btn" onclick="abrirComentariosPost('${p.id}')">
          <i class="far fa-comment"></i> ${totalComentarios}
        </button>
        <button class="post-acao-btn">
          <i class="far fa-eye"></i> ${p.views||0}
        </button>
      </div>
    </div>
  `;
}

window.criarPost = async function() {
  const texto = document.getElementById('novoPostTexto').value.trim();
  if (!texto && !postImagemUrl) return mostrarToast('Escreva algo ou adicione uma imagem', 'erro');
  
  let imgUrl = postImagemUrl;
  const fileInput = document.getElementById('novoPostImg');
  if (fileInput.files[0] && !postImagemUrl) {
    imgUrl = await uploadImgBB(fileInput.files[0]);
  }
  
  await push(ref(db, 'posts'), {
    texto, imagem: imgUrl||'', autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname,
    avatar: usuarioAtual.avatar||'', isProf: usuarioAtual.isProf||false,
    likes: {}, views: 0, comentarios: 0, createdAt: Date.now()
  });
  document.getElementById('novoPostTexto').value = '';
  document.getElementById('novoPostImgPreview').innerHTML = '';
  fileInput.value = '';
  postImagemUrl = null;
  mostrarToast('Post publicado!');
  carregarFeed();
}

window.previewPostImg = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('novoPostImgPreview').innerHTML = `
      <div class="img-preview-wrap">
        <img src="${e.target.result}" class="img-preview" />
        <button class="img-preview-remove" onclick="removerPostImg()"><i class="fas fa-times"></i></button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

window.removerPostImg = function() {
  postImagemUrl = null;
  document.getElementById('novoPostImgPreview').innerHTML = '';
  document.getElementById('novoPostImg').value = '';
}

window.curtirPost = async function(id) {
  const likeRef = ref(db, `posts/${id}/likes/${usuarioAtual.uid}`);
  const snap = await get(likeRef);
  if (snap.exists()) await remove(likeRef);
  else await set(likeRef, true);
  carregarFeed();
}

window.excluirPost = async function(id) {
  if (!confirm('Excluir este post?')) return;
  await remove(ref(db, `posts/${id}`));
  mostrarToast('Post excluído');
  carregarFeed();
}

window.abrirComentariosPost = async function(id) {
  postAtual = id;
  const snap = await get(ref(db, `posts/${id}/comentariosLista`));
  const lista = document.getElementById('comentariosPost');
  if (!snap.exists()) { lista.innerHTML = '<p style="color:var(--texto-muted);font-size:13px;text-align:center;">Nenhum comentário ainda.</p>'; }
  else {
    const coms = [];
    snap.forEach(c => coms.push(c.val()));
    lista.innerHTML = coms.map(c => `
      <div class="comentario-item">
        <img class="comentario-avatar" src="${c.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(c.autorNome)+'&background=10B981&color=fff'}" />
        <div class="comentario-bubble">
          <div class="comentario-nome">${c.autorNome}</div>
          <div class="comentario-texto">${c.texto}</div>
        </div>
      </div>
    `).join('');
  }
  abrirModal('modalComentarios');
}

window.publicarComentario = async function() {
  const texto = document.getElementById('novoComentarioInput').value.trim();
  if (!texto || !postAtual) return;
  await push(ref(db, `posts/${postAtual}/comentariosLista`), {
    texto, autorId: usuarioAtual.uid, autorNome: usuarioAtual.fullname,
    avatar: usuarioAtual.avatar||'', createdAt: Date.now()
  });
  const snap = await get(ref(db, `posts/${postAtual}/comentariosLista`));
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  await update(ref(db, `posts/${postAtual}`), { comentarios: count });
  document.getElementById('novoComentarioInput').value = '';
  abrirComentariosPost(postAtual);
  mostrarToast('Comentário enviado!');
}

// ===== DESAFIOS =====
async function carregarDesafios() {
  const snap = await get(ref(db, 'desafios'));
  const lista = document.getElementById('listaDesafios');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-bolt"></i><h4>Nenhum item</h4><p>Nenhum desafio disponível</p></div>'; return; }
  const desafios = [];
  snap.forEach(c => desafios.push({ id: c.key, ...c.val() }));
  const agora = Date.now();
  lista.innerHTML = desafios.map(d => {
    const ativo = d.inicio <= agora && d.fim >= agora;
    const terminado = d.fim < agora;
    return `
      <div class="aula-card" onclick="abrirDesafio('${d.id}')">
        ${d.banner ? `<img src="${d.banner}" style="width:100%;border-radius:8px;margin-bottom:10px;" />` : ''}
        <h4>${d.titulo}</h4>
        <p>${d.descricao||''}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span class="tag ${ativo?'tag-verde':terminado?'tag-vermelho':'tag-azul'}">${ativo?'Ativo':terminado?'Encerrado':'Em breve'}</span>
          <span style="font-size:12px;color:var(--texto-muted);"><i class="fas fa-gift"></i> ${d.premio||'—'}</span>
        </div>
      </div>
    `;
  }).join('');
}

window.abrirDesafio = async function(id) {
  historicoPaginas.push('desafios');
  const snap = await get(ref(db, `desafios/${id}`));
  if (!snap.exists()) return;
  const d = snap.val();
  document.getElementById('desafioDetalheTitulo').textContent = d.titulo;
  const agora = Date.now();
  const ativo = d.inicio <= agora && d.fim >= agora;
  const jaParticipou = d.participantes && d.participantes[usuarioAtual.uid];
  let html = `<p style="font-size:14px;color:var(--texto-muted);margin-bottom:12px;">${d.descricao||''}</p>`;
  html += `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
    <span class="tag tag-verde"><i class="fas fa-gift"></i> ${d.premio||'—'}</span>
    <span class="tag tag-azul"><i class="fas fa-calendar"></i> Até ${formatarDataHora(d.fim)}</span>
  </div>`;
  if (ativo && !jaParticipou && d.questoes) {
    html += `<h4 style="margin-bottom:12px;">Responda o desafio:</h4>`;
    html += `<form id="formDesafio">`;
    d.questoes.forEach((q, i) => {
      html += `<div style="margin-bottom:16px;">
        <p style="font-size:14px;font-weight:700;margin-bottom:8px;">${i+1}. ${q.pergunta}</p>
        ${q.alternativas.map((alt, j) => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border:2px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;">
            <input type="radio" name="q${i}" value="${j}" /> ${alt}
          </label>
        `).join('')}
      </div>`;
    });
    html += `</form><button class="btn btn-verde btn-full" onclick="enviarRespostaDesafio('${id}')"><i class="fas fa-paper-plane"></i> Enviar Respostas</button>`;
  } else if (jaParticipou) {
    html += `<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--verde);opacity:1;"></i><h4>Você já participou!</h4></div>`;
  } else if (!ativo) {
    html += `<div class="empty-state"><i class="fas fa-clock"></i><h4>Desafio ${agora > d.fim ? 'encerrado' : 'ainda não iniciado'}</h4></div>`;
  }
  document.getElementById('desafioDetalheConteudo').innerHTML = html;
  mostrarTela('desafio-detalhe');
}

window.enviarRespostaDesafio = async function(id) {
  const snap = await get(ref(db, `desafios/${id}`));
  if (!snap.exists()) return;
  const d = snap.val();
  let acertos = 0;
  d.questoes.forEach((q, i) => {
    const sel = document.querySelector(`#formDesafio input[name="q${i}"]:checked`);
    if (sel && parseInt(sel.value) === q.correta) acertos++;
  });
  const xp = acertos * 20;
  await update(ref(db, `desafios/${id}/participantes/${usuarioAtual.uid}`), { acertos, total: d.questoes.length, createdAt: Date.now() });
  const novosPts = (usuarioAtual.points||0) + xp;
  await update(ref(db, `usuarios/${usuarioAtual.uid}`), { points: novosPts });
  usuarioAtual.points = novosPts;
  mostrarToast(`Desafio concluído! +${xp} XP (${acertos}/${d.questoes.length})`);
  abrirDesafio(id);
}

// ===== PERFIL =====
async function carregarPerfil() {
  const snap = await get(ref(db, `usuarios/${usuarioAtual.uid}`));
  if (!snap.exists()) return;
  const u = snap.val();
  usuarioAtual = { uid: usuarioAtual.uid, ...u };
  document.getElementById('perfilAvatar').src = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}&background=10B981&color=fff`;
  document.getElementById('perfilNome').textContent = u.fullname;
  document.getElementById('perfilUsuario').textContent = `@${u.username}`;
  document.getElementById('perfilBio').textContent = u.bio || 'Sem bio';
  // Selos
  let selos = '';
  if (u.adminLevel > 0) selos += `<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" title="Admin" style="width:24px;height:24px;" />`;
  if (u.isProf) selos += `<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" title="Professor" style="width:24px;height:24px;" />`;
  document.getElementById('perfilSelos').innerHTML = selos;
  // Stats
  document.getElementById('perfilXP').textContent = u.points || 0;
  const histSnap = await get(ref(db, `historico/${usuarioAtual.uid}`));
  document.getElementById('perfilQuizzes').textContent = histSnap.exists() ? Object.keys(histSnap.val()).length : 0;
  // Seguidores/Seguindo
  const segSnap = await get(ref(db, `seguidores/${usuarioAtual.uid}`));
  document.getElementById('perfilSeguidores').textContent = segSnap.exists() ? Object.keys(segSnap.val()).length : 0;
  document.getElementById('perfilSeguindo').textContent = 0;
  // Abrir aba histórico
  carregarHistoricoQuizzes();
}

async function carregarHistoricoQuizzes() {
  const snap = await get(ref(db, `historico/${usuarioAtual.uid}`));
  const lista = document.getElementById('historicoQuizzes');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><h4>Nenhum item</h4><p>Você ainda não fez nenhum quiz</p></div>'; return; }
  const hist = [];
  snap.forEach(c => hist.push(c.val()));
  hist.sort((a,b) => b.createdAt-a.createdAt);
  lista.innerHTML = hist.map(h => `
    <div class="quiz-card" style="cursor:default;">
      <div class="quiz-icon" style="background:${h.pct>=70?'var(--verde-light)':'#FEE2E2'};color:${h.pct>=70?'var(--verde)':'var(--danger)'};">
        <i class="fas fa-${h.pct>=70?'check':'times'}"></i>
      </div>
      <div class="quiz-info">
        <div class="quiz-nome">${h.quizNome}</div>
        <div class="quiz-meta">${h.acertos}/${h.total} acertos · ${h.pct}% · ${formatarDataHora(h.createdAt)}</div>
      </div>
      <span class="quiz-xp">+${h.score} XP</span>
    </div>
  `).join('');
}

async function carregarGraficoDesempenho() {
  const snap = await get(ref(db, `historico/${usuarioAtual.uid}`));
  const el = document.getElementById('graficoDesempenho');
  if (!snap.exists()) { el.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h4>Nenhum item</h4><p>Faça quizzes para ver seu desempenho</p></div>'; return; }
  const hist = [];
  snap.forEach(c => hist.push(c.val()));
  // Agrupar por disciplina
  const grupos = {};
  for (const h of hist) {
    const d = h.disciplina || 'Geral';
    if (!grupos[d]) grupos[d] = { acertos: 0, total: 0 };
    grupos[d].acertos += h.acertos;
    grupos[d].total += h.total;
  }
  let html = '<div class="card" style="padding:16px;">';
  html += '<h4 style="margin-bottom:16px;">Desempenho por Disciplina</h4>';
  for (const [disc, dados] of Object.entries(grupos)) {
    const pct = Math.round((dados.acertos/dados.total)*100);
    html += `
      <div class="barra-desempenho">
        <div class="barra-label"><span>${disc.substring(0,20)}</span><span class="barra-pct">${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>=70?'var(--verde)':pct>=40?'var(--warning)':'var(--danger)'}"></div></div>
        <p style="font-size:11px;color:var(--texto-muted);margin-top:2px;">${dados.acertos}/${dados.total} acertos · ${pct>=70?'Ótimo! 🌟':pct>=40?'Bom 👍':'Precisa melhorar 📚'}</p>
      </div>
    `;
  }
  html += '</div>';
  el.innerHTML = html;
}

async function carregarFichaAluno() {
  const snap = await get(ref(db, `fichas/${usuarioAtual.uid}`));
  const el = document.getElementById('fichaAluno');
  const u = usuarioAtual;
  let ficha = snap.exists() ? snap.val() : {};
  el.innerHTML = `
    <div class="ficha-section">
      <h4><i class="fas fa-user"></i> Dados Pessoais</h4>
      <p><strong>Nome:</strong> ${u.fullname}</p>
      <p><strong>Email:</strong> ${u.email}</p>
      <p><strong>@usuário:</strong> @${u.username}</p>
    </div>
    <div class="ficha-section">
      <h4><i class="fas fa-sticky-note"></i> Observações</h4>
      <p>${ficha.observacoes || 'Nenhuma observação registrada.'}</p>
    </div>
    <div class="ficha-section">
      <h4><i class="fas fa-robot"></i> Análise da IA</h4>
      <button class="btn btn-azul btn-full" onclick="analisarFichaIA()"><i class="fas fa-robot"></i> Analisar com IA</button>
      <div id="fichaIAResult" style="margin-top:12px;font-size:13px;line-height:1.6;"></div>
    </div>
  `;
}

window.analisarFichaIA = async function() {
  const el = document.getElementById('fichaIAResult');
  el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Analisando...</span></div>';
  const histSnap = await get(ref(db, `historico/${usuarioAtual.uid}`));
  let resumo = `Aluno: ${usuarioAtual.fullname}, XP: ${usuarioAtual.points||0}.`;
  if (histSnap.exists()) {
    const hist = [];
    histSnap.forEach(c => hist.push(c.val()));
    const pctMedio = hist.length > 0 ? Math.round(hist.reduce((s,h)=>s+h.pct,0)/hist.length) : 0;
    resumo += ` Média de acertos em quizzes: ${pctMedio}%. Total de quizzes: ${hist.length}.`;
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Você é um assistente pedagógico. Analise o desempenho do aluno e dê sugestões específicas em português. Seja encorajador mas honesto.' },
          { role: 'user', content: `Analise o desempenho: ${resumo}. Dê uma análise de pontos fortes, pontos fracos e 3 sugestões de estudo.` }
        ],
        max_tokens: 512
      })
    });
    const data = await res.json();
    el.textContent = data.choices?.[0]?.message?.content || 'Não foi possível analisar.';
  } catch(e) { el.textContent = 'Erro ao conectar com a IA.'; }
}

window.salvarPerfil = async function() {
  const nome = document.getElementById('editNome').value.trim();
  const usuario = document.getElementById('editUsuario').value.trim();
  const bio = document.getElementById('editBio').value.trim();
  if (!nome) return mostrarToast('Informe o nome', 'erro');
  await update(ref(db, `usuarios/${usuarioAtual.uid}`), { fullname: nome, username: usuario, bio });
  usuarioAtual.fullname = nome; usuarioAtual.username = usuario; usuarioAtual.bio = bio;
  fecharModal('modalEditarPerfil');
  mostrarToast('Perfil atualizado!');
  carregarPerfil();
  atualizarTopbarAvatar();
}

window.uploadAvatar = async function(input) {
  const file = input.files[0];
  if (!file) return;
  mostrarToast('Enviando imagem...');
  try {
    const url = await uploadImgBB(file);
    await update(ref(db, `usuarios/${usuarioAtual.uid}`), { avatar: url });
    usuarioAtual.avatar = url;
    document.getElementById('perfilAvatar').src = url;
    atualizarTopbarAvatar();
    mostrarToast('Avatar atualizado!');
  } catch(e) { mostrarToast('Erro ao enviar imagem', 'erro'); }
}

function atualizarTopbarAvatar() {
  if (usuarioAtual) {
    document.getElementById('topbarAvatar').src = usuarioAtual.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioAtual.fullname)}&background=10B981&color=fff`;
  }
}

// ===== AGENDA =====
let agendaFiltroAtual = 'todos';
async function carregarAgenda() {
  const snap = await get(ref(db, `agenda/${usuarioAtual.uid}`));
  renderAgenda(snap, agendaFiltroAtual);
}

function renderAgenda(snap, filtro) {
  const lista = document.getElementById('listaAgenda');
  if (!snap || !snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><h4>Nenhum item</h4><p>Adicione um evento</p></div>'; return; }
  let eventos = [];
  snap.forEach(c => eventos.push({ id: c.key, ...c.val() }));
  if (filtro !== 'todos') eventos = eventos.filter(e => e.tipo === filtro);
  eventos.sort((a,b) => (a.data||'').localeCompare(b.data||''));
  lista.innerHTML = eventos.map(ev => `
    <div class="evento-card">
      <div class="evento-cor" style="background:${ev.cor||'var(--verde)'}"></div>
      <div class="evento-info">
        <div class="evento-titulo">${ev.titulo}</div>
        <div class="evento-meta">${formatarData(ev.data)} ${ev.hora?'· '+ev.hora:''} ${ev.disciplina?'· '+ev.disciplina:''}</div>
        <span class="tag tag-${corTipoEvento(ev.tipo)}" style="margin-top:4px;">${ev.tipo||'Evento'}</span>
      </div>
      <button onclick="toggleEventoConcluido('${ev.id}',${!ev.concluido})" style="background:none;border:none;cursor:pointer;font-size:22px;">${ev.concluido?'✅':'⬜'}</button>
      <button onclick="excluirEvento('${ev.id}')" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--danger);"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
}

window.filtrarAgenda = async function(tipo, btn) {
  agendaFiltroAtual = tipo;
  document.querySelectorAll('.agenda-filtro-btn').forEach(b => b.classList.remove('ativo'));
  if (btn) btn.classList.add('ativo');
  const snap = await get(ref(db, `agenda/${usuarioAtual.uid}`));
  renderAgenda(snap, tipo);
}

window.criarEvento = async function() {
  const titulo = document.getElementById('eventoTitulo').value.trim();
  const data = document.getElementById('eventoData').value;
  const hora = document.getElementById('eventoHora').value;
  const tipo = document.getElementById('eventoTipo').value;
  const cor = document.getElementById('eventoCor').value;
  const disciplina = document.getElementById('eventoDisciplina').value.trim();
  if (!titulo || !data) return mostrarToast('Informe título e data', 'erro');
  await push(ref(db, `agenda/${usuarioAtual.uid}`), { titulo, data, hora, tipo, cor, disciplina, concluido: false, createdAt: Date.now() });
  fecharModal('modalNovoEvento');
  ['eventoTitulo','eventoData','eventoHora','eventoDisciplina'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Evento criado!');
  carregarAgenda();
}

window.toggleEventoConcluido = async function(id, val) {
  await update(ref(db, `agenda/${usuarioAtual.uid}/${id}`), { concluido: val });
  carregarAgenda();
}

window.excluirEvento = async function(id) {
  if (!confirm('Excluir evento?')) return;
  await remove(ref(db, `agenda/${usuarioAtual.uid}/${id}`));
  mostrarToast('Evento excluído');
  carregarAgenda();
}

// ===== ANOTAÇÕES =====
async function carregarAnotacoes(busca) {
  const snap = await get(ref(db, `anotacoes/${usuarioAtual.uid}`));
  const lista = document.getElementById('listaAnotacoes');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><h4>Nenhum item</h4><p>Crie sua primeira anotação</p></div>'; return; }
  let notas = [];
  snap.forEach(c => notas.push({ id: c.key, ...c.val() }));
  notas.sort((a,b) => (b.atualizadoEm||b.createdAt)-(a.atualizadoEm||a.createdAt));
  if (busca) notas = notas.filter(n => n.titulo.toLowerCase().includes(busca.toLowerCase()) || (n.conteudo||'').toLowerCase().includes(busca.toLowerCase()));
  lista.innerHTML = notas.map(n => `
    <div class="anotacao-card" onclick="editarAnotacao('${n.id}','${encodeURIComponent(n.titulo)}','${encodeURIComponent(n.conteudo||'')}')">
      <div class="anotacao-titulo">${n.titulo}</div>
      <div class="anotacao-preview">${n.conteudo||''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="anotacao-data">${formatarDataHora(n.atualizadoEm||n.createdAt)}</div>
        <button onclick="event.stopPropagation();excluirAnotacao('${n.id}')" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:14px;"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.buscarAnotacoes = function(q) { carregarAnotacoes(q); }

window.salvarAnotacao = async function() {
  const titulo = document.getElementById('anotacaoTituloInput').value.trim();
  const conteudo = document.getElementById('anotacaoConteudoInput').value.trim();
  const editId = document.getElementById('anotacaoEditId').value;
  if (!titulo) return mostrarToast('Informe o título', 'erro');
  const agora = Date.now();
  if (editId) {
    await update(ref(db, `anotacoes/${usuarioAtual.uid}/${editId}`), { titulo, conteudo, atualizadoEm: agora });
    mostrarToast('Anotação atualizada!');
  } else {
    await push(ref(db, `anotacoes/${usuarioAtual.uid}`), { titulo, conteudo, createdAt: agora, atualizadoEm: agora });
    mostrarToast('Anotação salva!');
  }
  fecharModal('modalNovaAnotacao');
  document.getElementById('anotacaoTituloInput').value = '';
  document.getElementById('anotacaoConteudoInput').value = '';
  document.getElementById('anotacaoEditId').value = '';
  document.getElementById('modalAnotacaoTitulo').textContent = 'Nova Anotação';
  carregarAnotacoes();
}

window.editarAnotacao = function(id, titulo, conteudo) {
  document.getElementById('anotacaoEditId').value = id;
  document.getElementById('anotacaoTituloInput').value = decodeURIComponent(titulo);
  document.getElementById('anotacaoConteudoInput').value = decodeURIComponent(conteudo);
  document.getElementById('modalAnotacaoTitulo').textContent = 'Editar Anotação';
  abrirModal('modalNovaAnotacao');
}

window.excluirAnotacao = async function(id) {
  if (!confirm('Excluir anotação?')) return;
  await remove(ref(db, `anotacoes/${usuarioAtual.uid}/${id}`));
  mostrarToast('Anotação excluída');
  carregarAnotacoes();
}

// ===== CHAMADA =====
async function carregarChamada() {
  const snap = await get(ref(db, `turmas/${usuarioAtual.uid}`));
  const lista = document.getElementById('listaTurmas');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h4>Nenhum item</h4><p>Crie sua primeira turma</p></div>'; return; }
  const turmas = [];
  snap.forEach(c => turmas.push({ id: c.key, ...c.val() }));
  lista.innerHTML = turmas.map(t => `
    <div class="turma-card" onclick="abrirTurma('${t.id}')">
      <div class="turma-icon"><i class="fas fa-users"></i></div>
      <div class="turma-info">
        <div class="turma-nome">${t.nome}</div>
        <div class="turma-meta">${t.disciplina} · ${(t.alunos||[]).length} alunos</div>
      </div>
      <i class="fas fa-chevron-right" style="color:var(--texto-muted);"></i>
    </div>
  `).join('');
}

window.criarTurma = async function() {
  const nome = document.getElementById('turmaNome').value.trim();
  const disciplina = document.getElementById('turmaDisciplina').value.trim();
  if (!nome) return mostrarToast('Informe o nome', 'erro');
  await push(ref(db, `turmas/${usuarioAtual.uid}`), { nome, disciplina, alunos: [], createdAt: Date.now() });
  fecharModal('modalNovaTurma');
  ['turmaNome','turmaDisciplina'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Turma criada!');
  carregarChamada();
}

window.abrirTurma = async function(id) {
  historicoPaginas.push('chamada');
  turmaAtual = id;
  const snap = await get(ref(db, `turmas/${usuarioAtual.uid}/${id}`));
  if (!snap.exists()) return;
  const turma = snap.val();
  document.getElementById('turmaDetalheTitulo').textContent = turma.nome;
  document.getElementById('chamadaData').value = new Date().toISOString().split('T')[0];
  // Carregar chamada do dia
  const dataHoje = document.getElementById('chamadaData').value;
  const chamadaSnap = await get(ref(db, `chamadas/${id}/${dataHoje}`));
  const registros = chamadaSnap.exists() ? chamadaSnap.val().registros || {} : {};
  renderAlunos(turma.alunos || [], registros, id);
  mostrarTela('turma-detalhe');
}

function renderAlunos(alunos, registros, turmaId) {
  const lista = document.getElementById('listaAlunos');
  if (alunos.length === 0) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-user"></i><h4>Nenhum item</h4><p>Adicione alunos à turma</p></div>'; return; }
  lista.innerHTML = alunos.map((a, i) => {
    const status = registros[i] || 'pendente';
    return `
      <div class="aluno-row">
        <span class="aluno-num">${a.numero||i+1}</span>
        <span class="aluno-nome">${a.nome}</span>
        <div class="presenca-btns">
          <button class="presenca-btn ${status==='presente'?'presente':''}" onclick="setPresenca(${i},'presente','${turmaId}')">✅</button>
          <button class="presenca-btn ${status==='falta'?'falta':''}" onclick="setPresenca(${i},'falta','${turmaId}')">❌</button>
          <button class="presenca-btn ${status==='justificado'?'justificado':''}" onclick="setPresenca(${i},'justificado','${turmaId}')">⚠️</button>
        </div>
      </div>
    `;
  }).join('');
}

let chamadaAtual = {};
window.setPresenca = function(idx, status, turmaId) {
  chamadaAtual[idx] = status;
  get(ref(db, `turmas/${usuarioAtual.uid}/${turmaId}`)).then(snap => {
    if (snap.exists()) renderAlunos(snap.val().alunos || [], chamadaAtual, turmaId);
  });
}

window.salvarChamada = async function() {
  if (!turmaAtual) return;
  const data = document.getElementById('chamadaData').value;
  if (!data) return mostrarToast('Selecione a data', 'erro');
  await set(ref(db, `chamadas/${turmaAtual}/${data}`), { data, registros: chamadaAtual, createdAt: Date.now() });
  mostrarToast('Chamada salva!');
}

window.adicionarAluno = async function() {
  const nome = document.getElementById('alunoNomeInput').value.trim();
  const num = document.getElementById('alunoNumInput').value;
  if (!nome) return mostrarToast('Informe o nome', 'erro');
  const snap = await get(ref(db, `turmas/${usuarioAtual.uid}/${turmaAtual}`));
  if (!snap.exists()) return;
  const alunos = snap.val().alunos || [];
  alunos.push({ nome, numero: num || alunos.length + 1 });
  await update(ref(db, `turmas/${usuarioAtual.uid}/${turmaAtual}`), { alunos });
  fecharModal('modalAddAluno');
  ['alunoNomeInput','alunoNumInput'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('Aluno adicionado!');
  abrirTurma(turmaAtual);
}

// ===== NOTIFICAÇÕES =====
async function carregarNotificacoes() {
  const snap = await get(ref(db, `notificacoes/${usuarioAtual.uid}`));
  const lista = document.getElementById('listaNotificacoes');
  if (!snap.exists()) { lista.innerHTML = '<div class="empty-state"><i class="fas fa-bell"></i><h4>Nenhum item</h4><p>Nenhuma notificação</p></div>'; return; }
  const notifs = [];
  snap.forEach(c => notifs.push({ id: c.key, ...c.val() }));
  notifs.sort((a,b) => b.createdAt-a.createdAt);
  lista.innerHTML = notifs.map(n => `
    <div class="notif-item ${!n.lida?'nao-lida':''}" onclick="marcarNotifLida('${n.id}')">
      <div class="notif-icon"><i class="fas fa-${n.tipo==='quiz'?'gamepad':n.tipo==='post'?'newspaper':'bell'}"></i></div>
      <div class="notif-texto">
        <div class="notif-msg">${n.mensagem}</div>
        <div class="notif-data">${formatarDataHora(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
  // Marcar todas como lidas
  notifs.filter(n => !n.lida).forEach(n => update(ref(db, `notificacoes/${usuarioAtual.uid}/${n.id}`), { lida: true }));
  document.getElementById('badgeNotif').style.display = 'none';
}

async function carregarNotificacoesContagem() {
  const snap = await get(ref(db, `notificacoes/${usuarioAtual.uid}`));
  if (!snap.exists()) return;
  let naoLidas = 0;
  snap.forEach(c => { if (!c.val().lida) naoLidas++; });
  const badge = document.getElementById('badgeNotif');
  if (naoLidas > 0) { badge.style.display = 'flex'; badge.textContent = naoLidas; }
  else badge.style.display = 'none';
}

window.marcarNotifLida = async function(id) {
  await update(ref(db, `notificacoes/${usuarioAtual.uid}/${id}`), { lida: true });
}

// ===== SOBRE =====
async function carregarSobre() {
  const snap = await get(ref(db, 'config/sobre'));
  const el = document.getElementById('sobreConteudo');
  if (snap.exists()) {
    el.innerHTML = `<p>${(snap.val().texto || '').replace(/\n/g,'<br>')}</p>`;
  } else {
    el.innerHTML = `<p>O <strong>Sexta-Feira Studies</strong> é uma rede social de estudos gamificada que conecta alunos e professores em uma experiência de aprendizado única e divertida.</p>
    <p style="margin-top:12px;">Acumule XP fazendo quizzes, participe de desafios, assista a aulas e interaja com outros estudantes!</p>
    <p style="margin-top:12px;color:var(--verde);font-weight:600;">Versão 1.0 — Feito com ❤️</p>`;
  }
}

// ===== UPDATES =====
async function carregarUpdates() {
  const snap = await get(ref(db, 'config/updates'));
  const lista = document.getElementById('listaUpdates');
  if (!snap.exists()) {
    lista.innerHTML = `
      <div class="update-card">
        <span class="update-badge">v1.0</span>
        <div class="update-titulo">Lançamento Inicial 🎉</div>
        <div class="update-desc">Sexta-Feira Studies está no ar! Feed, Quizzes, Rankings, Jarvis IA, Agenda, Anotações, Chamada e muito mais!</div>
        <div class="update-data">Maio 2025</div>
      </div>
    `;
    return;
  }
  const updates = [];
  snap.forEach(c => updates.push({ id: c.key, ...c.val() }));
  updates.sort((a,b) => b.createdAt-a.createdAt);
  lista.innerHTML = updates.map(u => `
    <div class="update-card">
      <span class="update-badge">${u.versao||'v1.0'}</span>
      <div class="update-titulo">${u.titulo}</div>
      <div class="update-desc">${u.descricao||''}</div>
      <div class="update-data">${u.data||formatarDataHora(u.createdAt)}</div>
    </div>
  `).join('');
}

// ===== CONFIG =====
function carregarConfig() {
  if (usuarioAtual) document.getElementById('configEmail').value = usuarioAtual.email || '';
}

// ===== PDF =====
window.gerarPDFcomIA = async function() {
  const titulo = document.getElementById('pdfTitulo').value.trim();
  const disc = document.getElementById('pdfDisciplina').value.trim();
  if (!titulo) return mostrarToast('Informe o título', 'erro');
  mostrarToast('Gerando com IA...');
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Você é um professor criando questões de avaliação em português. Crie questões de múltipla escolha bem estruturadas.' },
          { role: 'user', content: `Crie 5 questões de múltipla escolha (A,B,C,D) sobre "${titulo}" de ${disc||'matéria geral'}. Numere as questões e coloque as alternativas.` }
        ],
        max_tokens: 1024
      })
    });
    const data = await res.json();
    document.getElementById('pdfQuestoes').value = data.choices?.[0]?.message?.content || '';
    mostrarToast('Questões geradas!');
  } catch(e) { mostrarToast('Erro ao gerar com IA', 'erro'); }
}

window.previewPDF = function() {
  const titulo = document.getElementById('pdfTitulo').value || 'Avaliação';
  const disc = document.getElementById('pdfDisciplina').value || '';
  const prof = document.getElementById('pdfProfessor').value || '';
  const questoes = document.getElementById('pdfQuestoes').value || '';
  document.getElementById('pdfPreview').innerHTML = `
    <div class="pdf-preview">
      <div style="text-align:center;margin-bottom:16px;">
        <img src="https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png" style="width:40px;height:40px;border-radius:8px;" />
        <div style="font-size:10px;color:var(--texto-muted);">Sexta-Feira Studies</div>
      </div>
      <h2>${titulo}</h2>
      <div class="pdf-meta">${disc} | ${prof} | Data: ___/___/______</div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:16px;">
        <span style="font-size:12px;">Aluno: _____________________</span>
        <span style="font-size:12px;">Nota: _____</span>
      </div>
      <div style="font-size:13px;white-space:pre-wrap;line-height:1.7;">${questoes}</div>
      <div class="pdf-rodape">Feito com ❤️ por Sexta-Feira Studies</div>
    </div>
  `;
}

window.downloadPDF = function() {
  previewPDF();
  setTimeout(() => window.print(), 500);
}

// ===== UTILS =====
window.irParaPainel = function() {
  window.open('painel.html', '_blank');
}

function extrairYtId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

async function uploadImgBB(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
  const data = await res.json();
  return data.data?.url || '';
}

function formatarData(str) {
  if (!str) return '';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function formatarDataHora(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function corTipoEvento(tipo) {
  switch(tipo) {
    case 'prova': return 'vermelho';
    case 'trabalho': return 'amarelo';
    case 'aula': return 'verde';
    default: return 'azul';
  }
}

// ===== TOAST =====
window.mostrarToast = function(msg, tipo) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo||''}`;
  const icon = tipo === 'erro' ? '❌' : tipo === 'aviso' ? '⚠️' : '✅';
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== DROPDOWN =====
window.toggleDropdown = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('aberto');
}

window.fecharDropdowns = function() {
  document.querySelectorAll('.dropdown-menu.aberto').forEach(d => d.classList.remove('aberto'));
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) fecharDropdowns();
});

// ===== ESC para fechar video =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharVideo();
});
