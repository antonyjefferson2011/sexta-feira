/* ═══════════════════════════════════════════════════════════
   SEXTA-FEIRA STUDIES - SCRIPT.JS
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════ FIREBASE CONFIG ═══════════════
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

// ═══════════════ API KEYS ═══════════════
const GROQ_KEY = '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';
const GEMINI_KEY = 'AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY';
const IMGBB_KEY = '86427cccd2a94fb42a0754ffd7f19e79';

// ═══════════════ IMAGENS ═══════════════
const IMG = {
  logo: 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png',
  jarvis: 'https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png',
  seloAdmin: 'https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png',
  seloProf: 'https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png'
};

// ═══════════════ STATE ═══════════════
let currentUser = null;
let currentUserData = null;
let currentMateriaId = null;
let currentAulaId = null;
let currentPostId = null;
let currentModalUserId = null;
let quizData = null;
let quizIndex = 0;
let quizScore = 0;
let quizTimer = null;
let quizTimeLeft = 30;
let quizQuestoesForm = [];
let jarvisImageBase64 = null;
let jarvisImageMime = null;
let desafioAtual = null;
let respostasDesafio = [];

// ═══════════════ HELPERS ═══════════════
function $(id) { return document.getElementById(id); }

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return Math.floor(diff/60)+'min';
  if (diff < 86400) return Math.floor(diff/3600)+'h';
  if (diff < 604800) return Math.floor(diff/86400)+'d';
  return new Date(ts).toLocaleDateString('pt-BR');
}

function toast(msg, type) {
  const c = $('toast-container');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'toast ' + (type || 'success');
  d.innerHTML = msg;
  c.appendChild(d);
  setTimeout(function() { d.style.opacity = '0'; d.style.transition = '0.3s'; setTimeout(function(){ d.remove(); }, 300); }, 3000);
}

function showLoading() {
  return '<div class="loading"><div class="spinner"></div></div>';
}

// ═══════════════ NAVEGAÇÃO ═══════════════
function navigate(page) {
  // Atualizar bottom nav
  document.querySelectorAll('.bnav-item').forEach(function(b) {
    b.classList.remove('active');
  });
  const navMap = {home:0, materias:1, desafios:2, ranking:3, jarvis:4};
  if (navMap[page] !== undefined) {
    document.querySelectorAll('.bnav-item')[navMap[page]].classList.add('active');
  }
  
  // Esconder todas as telas
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  
  // Mostrar tela certa
  const tela = $('screen-' + page);
  if (tela) {
    tela.classList.add('active');
  }
  
  window.scrollTo(0, 0);
  
  // Carregar conteúdo
  if (page === 'home') loadHome();
  else if (page === 'materias') loadMaterias();
  else if (page === 'ranking') loadRanking();
  else if (page === 'desafios') loadDesafios();
  else if (page === 'perfil') loadPerfil();
  else if (page === 'notificacoes') loadNotificacoes();
  else if (page === 'sobre') loadSobre();
  else if (page === 'updates') loadUpdates();
  else if (page === 'criador-pdf') {}
}

function openModal(id) {
  const m = $(id);
  if (m) m.classList.add('show');
}

function closeModal(id) {
  const m = $(id);
  if (m) m.classList.remove('show');
}

// Fechar modal clicando fora
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
    e.target.classList.remove('show');
  }
});

// ═══════════════ AUTH ═══════════════
auth.onAuthStateChanged(async function(user) {
  if (user) {
    currentUser = user;
    const snap = await db.ref('usuarios/' + user.uid).once('value');
    currentUserData = snap.val() || {};
    
    if (!currentUserData.username) {
      // Primeiro acesso com Google
      currentUserData = {
        uid: user.uid,
        fullname: user.displayName || 'Usuário',
        username: (user.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        email: user.email,
        avatar: user.photoURL || '',
        bio: '',
        points: 0,
        plano: 'gratis',
        adminLevel: 0,
        isProf: false,
        isQuizzer: false,
        createdAt: Date.now()
      };
      await db.ref('usuarios/' + user.uid).set(currentUserData);
    }
    
    $('login-screen').style.display = 'none';
    $('app').style.display = '';
    $('site-footer').style.display = '';
    updateUI();
    navigate('home');
    listenNotificacoes();
  } else {
    currentUser = null;
    currentUserData = null;
    $('app').style.display = 'none';
    $('site-footer').style.display = 'none';
    $('login-screen').style.display = '';
  }
});

function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(function(t, i) {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'cadastro'));
  });
  $('form-login').style.display = tab === 'login' ? '' : 'none';
  $('form-cadastro').style.display = tab === 'cadastro' ? '' : 'none';
}

async function doLogin() {
  const u = $('login-user').value.trim().replace('@','');
  const p = $('login-pass').value;
  if (!u || !p) return toast('Preencha todos os campos', 'error');
  
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
    const users = snap.val();
    if (!users) return toast('@' + u + ' não encontrado', 'error');
    const uid = Object.keys(users)[0];
    await auth.signInWithEmailAndPassword(users[uid].email, p);
  } catch(e) {
    toast('Senha incorreta', 'error');
  }
}

async function doRegister() {
  const name = $('reg-name').value.trim();
  const user = $('reg-user').value.trim().toLowerCase().replace('@','');
  const email = $('reg-email').value.trim();
  const pass = $('reg-pass').value;
  
  if (!name || !user || !email || !pass) return toast('Preencha todos', 'error');
  if (user.length < 3) return toast('@usuario mínimo 3 caracteres', 'error');
  if (pass.length < 6) return toast('Senha mínimo 6 caracteres', 'error');
  
  try {
    const snap = await db.ref('usuarios').orderByChild('username').equalTo(user).once('value');
    if (snap.val()) return toast('@' + user + ' já existe', 'error');
    
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.ref('usuarios/' + cred.user.uid).set({
      uid: cred.user.uid, fullname: name, username: user, email: email, password: pass,
      avatar: '', bio: '', points: 0, plano: 'gratis', adminLevel: 0, isProf: false,
      isQuizzer: false, createdAt: Date.now()
    });
    toast('Conta criada! 🎉', 'success');
  } catch(e) {
    toast('Erro: ' + e.message, 'error');
  }
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(e) {
    toast('Erro Google: ' + e.message, 'error');
  });
}

function doLogout() {
  auth.signOut();
}

// ═══════════════ UI ═══════════════
function updateUI() {
  if (!currentUserData) return;
  
  $('perfil-nome').textContent = currentUserData.fullname || currentUserData.username;
  $('perfil-user').textContent = '@' + currentUserData.username;
  $('perfil-pts').textContent = fmt(currentUserData.points || 0);
  $('perfil-quizzes').textContent = currentUserData.quizzesPlayed || 0;
  $('perfil-bio').textContent = currentUserData.bio || '';
  
  $('home-greeting').textContent = 'Olá, ' + (currentUserData.fullname || '').split(' ')[0] + '! 👋';
  $('home-points').textContent = fmt(currentUserData.points || 0);
  $('home-quizzes').textContent = currentUserData.quizzesPlayed || 0;
  
  // Selos
  if (currentUserData.adminLevel > 0) {
    $('selo-admin').style.display = '';
  }
  if (currentUserData.isProf) {
    $('selo-prof').style.display = '';
  }
  
  // Avatar
  const av = currentUserData.avatar;
  const avatarEls = ['nav-avatar', 'perfil-avatar-img'];
  avatarEls.forEach(function(id) {
    const el = $(id);
    if (!el) return;
    if (av && av.startsWith('http')) {
      el.innerHTML = id === 'nav-avatar' ? '<img src="' + av + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : '';
      el.src = id === 'perfil-avatar-img' ? av : '';
    } else {
      el.innerHTML = id === 'nav-avatar' ? (currentUserData.fullname || '?')[0].toUpperCase() : '?';
    }
  });
  
  // Progresso
  const pts = currentUserData.points || 0;
  const levels = [0, 100, 500, 1000, 5000, 10000, 50000, 100000];
  let lvl = 0;
  for (let i = 0; i < levels.length; i++) { if (pts >= levels[i]) lvl = i; }
  const nxt = levels[Math.min(lvl+1, levels.length-1)];
  const pct = nxt > levels[lvl] ? Math.min(((pts-levels[lvl])/(nxt-levels[lvl]))*100, 100) : 100;
  $('progress-text').textContent = fmt(pts) + '/' + fmt(nxt) + ' pts';
  const pf = $('progress-fill');
  if (pf) pf.style.width = pct + '%';
}

// ═══════════════ HOME ═══════════════
async function loadHome() {
  updateUI();
  
  // Load feed
  const snap = await db.ref('posts').orderByChild('createdAt').limitToLast(20).once('value');
  const posts = snap.val();
  const c = $('feed-list');
  if (!c) return;
  
  if (!posts) {
    c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Nenhum post ainda</div><div class="empty-state-subtext">Seja o primeiro a postar!</div></div>';
    return;
  }
  
  const arr = Object.entries(posts).map(function(e) { return {id: e[0], ...e[1]}; }).reverse();
  c.innerHTML = arr.map(function(p) { return renderPostCard(p); }).join('');
  
  // Carregar desafio do dia
  loadDesafioDia();
}

function renderPostCard(p) {
  const likes = p.likes ? Object.keys(p.likes).length : 0;
  const liked = p.likes && currentUser && p.likes[currentUser.uid];
  const views = p.views ? Object.keys(p.views).length : 0;
  const imgHTML = p.imagem ? '<img src="' + esc(p.imagem) + '" class="post-image" alt="Imagem do post" />' : '';
  const isOwner = p.autorId === (currentUser ? currentUser.uid : '');
  const canDelete = isOwner || (currentUserData && currentUserData.adminLevel >= 1);
  
  return `
    <div class="post-card">
      <div class="post-header">
        <div class="post-avatar" onclick="viewUserPerfil('${p.autorId}')">
          ${p.avatar && p.avatar.startsWith('http') ? '<img src="' + esc(p.avatar) + '" style="width:100%;height:100%;object-fit:cover" />' : (p.autorNome || '?')[0].toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div class="post-author" onclick="viewUserPerfil('${p.autorId}')">${esc(p.autorNome || 'Anônimo')}</div>
          <div class="post-time">${timeAgo(p.createdAt)} · 👁 ${views}</div>
        </div>
        ${canDelete ? '<button class="btn btn-ghost btn-sm" onclick="deletePost(\'' + p.id + '\')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>' : ''}
      </div>
      ${p.texto ? '<div class="post-body"><p>' + esc(p.texto) + '</p></div>' : ''}
      ${imgHTML}
      <div class="post-actions">
        <button class="post-action ${liked ? 'liked' : ''}" onclick="toggleLike('${p.id}')">
          <i class="fas fa-heart"></i> ${likes}
        </button>
        <button class="post-action" onclick="abrirComentarios('${p.id}')">
          <i class="fas fa-comment"></i> Comentários
        </button>
      </div>
    </div>
  `;
}

async function loadDesafioDia() {
  const c = $('home-desafio');
  if (!c) return;
  
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  if (!desafios) { c.innerHTML = ''; return; }
  
  const now = Date.now();
  const ativos = Object.entries(desafios).filter(function(e) {
    return now >= e[1].inicio && now <= e[1].fim;
  });
  
  if (ativos.length === 0) { c.innerHTML = ''; return; }
  
  const d = ativos[0][1];
  c.innerHTML = `
    <div class="card card-highlight" style="cursor:pointer;" onclick="navigate('desafios')">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:30px;">⚔️</span>
        <div>
          <strong>${esc(d.titulo)}</strong>
          <div style="font-size:11px;color:var(--text2);margin-top:2px;">🏆 +${d.premio} pts · Clique para participar</div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════ POSTS ═══════════════
async function criarPost() {
  const texto = $('post-texto').value.trim();
  const fileInput = $('post-img-input');
  const file = fileInput && fileInput.files[0];
  
  if (!texto && !file) return toast('Escreva algo ou adicione imagem', 'error');
  
  const salvar = async function(imgUrl) {
    const ref = await db.ref('posts').push();
    await ref.set({
      texto: texto, imagem: imgUrl || '', tipo: 'post',
      autorId: currentUser.uid, autorNome: currentUserData.fullname,
      avatar: currentUserData.avatar || '',
      isProf: currentUserData.isProf || false,
      likes: {}, views: {}, createdAt: Date.now()
    });
    closeModal('modal-post');
    $('post-texto').value = '';
    if (fileInput) fileInput.value = '';
    $('post-img-preview-container').style.display = 'none';
    toast('Post publicado! 📢', 'success');
    loadHome();
    addPoints(5);
  };
  
  if (file) {
    toast('⏳ Enviando imagem...', 'success');
    await uploadImgBB(file, salvar);
  } else {
    await salvar('');
  }
}

async function toggleLike(postId) {
  if (!currentUser) return;
  const ref = db.ref('posts/' + postId + '/likes/' + currentUser.uid);
  const snap = await ref.once('value');
  if (snap.val()) {
    await ref.remove();
  } else {
    await ref.set(true);
    addPoints(1);
    // Notificar dono do post
    const postSnap = await db.ref('posts/' + postId).once('value');
    const post = postSnap.val();
    if (post && post.autorId !== currentUser.uid) {
      enviarNotif(post.autorId, currentUserData.fullname + ' curtiu seu post ❤️', 'like');
    }
  }
  loadHome();
}

async function deletePost(id) {
  if (!confirm('Excluir este post?')) return;
  await db.ref('posts/' + id).remove();
  toast('Post excluído', 'success');
  loadHome();
}

function abrirComentarios(postId) {
  currentPostId = postId;
  openModal('modal-comentarios');
  loadComentariosPost(postId);
}

async function loadComentariosPost(postId) {
  const body = $('modal-comentarios-body');
  if (!body) return;
  
  const snap = await db.ref('posts/' + postId + '/comentarios').once('value');
  const coms = snap.val();
  
  if (!coms) {
    body.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px;">Nenhum comentário ainda</p>';
    return;
  }
  
  body.innerHTML = Object.entries(coms).map(function(e) {
    const c = e[1];
    return `
      <div style="display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div class="post-avatar" style="width:32px;height:32px;font-size:12px;">${(c.autorNome || '?')[0].toUpperCase()}</div>
        <div>
          <strong style="font-size:13px;">${esc(c.autorNome)}</strong>
          <p style="font-size:13px;color:var(--text2);margin-top:2px;">${esc(c.texto)}</p>
          <span style="font-size:10px;color:var(--text3);">${timeAgo(c.createdAt)}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function enviarComentario() {
  const txt = $('comentario-input').value.trim();
  if (!txt) return;
  
  const ref = await db.ref('posts/' + currentPostId + '/comentarios').push();
  await ref.set({
    texto: txt, autorId: currentUser.uid, autorNome: currentUserData.fullname, createdAt: Date.now()
  });
  
  $('comentario-input').value = '';
  loadComentariosPost(currentPostId);
  addPoints(2);
  
  // Notificar
  const postSnap = await db.ref('posts/' + currentPostId).once('value');
  const post = postSnap.val();
  if (post && post.autorId !== currentUser.uid) {
    enviarNotif(post.autorId, currentUserData.fullname + ' comentou no seu post 💬', 'comment');
  }
}

// ═══════════════ DISCIPLINAS ═══════════════
function loadMaterias() {
  db.ref('materias').on('value', function(snap) {
    const mat = snap.val();
    const c = $('materias-list');
    if (!c) return;
    
    if (!mat) {
      c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">Nenhuma disciplina</div><div class="empty-state-subtext">Crie a primeira!</div></div>';
      return;
    }
    
    c.innerHTML = Object.entries(mat).map(function(e) {
      const m = e[1];
      return `
        <div class="card card-clickable" onclick="openMateria('${e[0]}')">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:30px;">${esc(m.icone || '📚')}</span>
            <div>
              <strong>${esc(m.nome)}</strong>
              <div style="font-size:11px;color:var(--text2);margin-top:2px;">${esc(m.descricao || 'Sem descrição')}</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px;">Por @${esc(m.autorNome || '?')}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

async function criarMateria() {
  const icon = $('disc-icon').value.trim() || '📚';
  const nome = $('disc-nome').value.trim();
  const desc = $('disc-desc').value.trim();
  
  if (!nome) return toast('Nome obrigatório', 'error');
  
  await db.ref('materias').push({
    nome: nome, descricao: desc, icone: icon,
    autorId: currentUser.uid, autorNome: currentUserData.username,
    isProf: currentUserData.isProf || false,
    aulasCount: 0, createdAt: Date.now()
  });
  
  closeModal('modal-materia');
  $('disc-nome').value = '';
  $('disc-desc').value = '';
  toast('Disciplina criada! 📚', 'success');
  addPoints(10);
}

async function openMateria(id) {
  currentMateriaId = id;
  const snap = await db.ref('materias/' + id).once('value');
  const m = snap.val();
  if (!m) return;
  
  $('mat-icone').textContent = m.icone || '📚';
  $('mat-nome').textContent = m.nome;
  $('mat-desc').textContent = m.descricao || '';
  
  navigate('materia-detalhe');
  
  // Aulas
  db.ref('aulas/' + id).on('value', function(snap) {
    const aulas = snap.val();
    const c = $('aulas-list');
    if (!c) return;
    if (!aulas) { c.innerHTML = '<p style="color:var(--text3);text-align:center;padding:10px;">Nenhuma aula ainda</p>'; return; }
    c.innerHTML = Object.entries(aulas).map(function(e) {
      return `
        <div class="card card-clickable" onclick="openAula('${id}','${e[0]}')">
          <strong>📝 ${esc(e[1].titulo)}</strong>
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">Por @${esc(e[1].autorNome || '?')} · ${timeAgo(e[1].createdAt)}</div>
        </div>
      `;
    }).join('');
  });
  
  // Quizzes
  db.ref('quizzes/' + id).on('value', function(snap) {
    const quizzes = snap.val();
    const c = $('quizzes-list');
    if (!c) return;
    if (!quizzes) { c.innerHTML = '<p style="color:var(--text3);text-align:center;padding:10px;">Nenhum quiz ainda</p>'; return; }
    c.innerHTML = Object.entries(quizzes).map(function(e) {
      return `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>🎮 ${esc(e[1].nome)}</strong>
            <div style="font-size:11px;color:var(--text3);">${(e[1].questoes || []).length} questões</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="startQuiz('${id}','${e[0]}')">▶ Jogar</button>
        </div>
      `;
    }).join('');
  });
  
  // Vídeos
  db.ref('videos/' + id).on('value', function(snap) {
    const videos = snap.val();
    const c = $('videos-list');
    if (!c) return;
    if (!videos) { c.innerHTML = '<p style="color:var(--text3);text-align:center;padding:10px;">Nenhum vídeo ainda</p>'; return; }
    c.innerHTML = Object.entries(videos).map(function(e) {
      const v = e[1];
      const ytId = v.url.includes('youtube.com/embed/') ? v.url.split('/embed/')[1] : v.url.split('v=')[1]?.split('&')[0];
      const thumb = ytId ? 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg' : '';
      return `
        <div class="card card-clickable" onclick="window.open('${esc(v.url)}','_blank')">
          ${thumb ? '<img src="' + thumb + '" style="width:100%;border-radius:8px;margin-bottom:8px;" />' : ''}
          <strong>🎬 ${esc(v.titulo)}</strong>
          <div style="font-size:11px;color:var(--text3);">Por @${esc(v.autorNome || '?')}</div>
        </div>
      `;
    }).join('');
  });
}

// ═══════════════ AULAS ═══════════════
async function criarAula() {
  const titulo = $('aula-titulo-input').value.trim();
  const conteudo = $('aula-conteudo-input').value.trim();
  
  if (!titulo || !conteudo) return toast('Preencha tudo', 'error');
  if (!currentMateriaId) return toast('Selecione uma disciplina', 'error');
  
  await db.ref('aulas/' + currentMateriaId).push({
    titulo: titulo, conteudo: conteudo,
    autorId: currentUser.uid, autorNome: currentUserData.username,
    isProf: currentUserData.isProf || false,
    verificado: false, views: {}, createdAt: Date.now()
  });
  
  closeModal('modal-aula');
  $('aula-titulo-input').value = '';
  $('aula-conteudo-input').value = '';
  toast('Aula criada! 📝', 'success');
  addPoints(15);
}

async function openAula(mid, aid) {
  currentMateriaId = mid;
  currentAulaId = aid;
  
  const snap = await db.ref('aulas/' + mid + '/' + aid).once('value');
  const a = snap.val();
  if (!a) return toast('Aula não encontrada', 'error');
  
  // Registrar view
  db.ref('aulas/' + mid + '/' + aid + '/views/' + currentUser.uid).set(true);
  
  $('aula-titulo').textContent = a.titulo;
  $('aula-meta').innerHTML = 'Por <strong>@' + esc(a.autorNome || '?') + '</strong> · ' + timeAgo(a.createdAt) +
    (a.verificado ? ' <span style="color:var(--primary);">✅ Verificado</span>' : '');
  $('aula-conteudo').textContent = a.conteudo;
  
  navigate('aula');
  
  // Comentários
  db.ref('comentarios/' + mid + '/' + aid).on('value', function(snap) {
    const coms = snap.val();
    const c = $('aula-comentarios');
    if (!c) return;
    if (!coms) { c.innerHTML = '<p style="color:var(--text3);padding:10px;">Nenhum comentário</p>'; return; }
    c.innerHTML = Object.entries(coms).map(function(e) {
      const cm = e[1];
      return `
        <div style="display:flex;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
          <div class="post-avatar" style="width:28px;height:28px;font-size:11px;">${(cm.autorNome || '?')[0].toUpperCase()}</div>
          <div>
            <strong style="font-size:12px;">${esc(cm.autorNome)}</strong>
            <p style="font-size:13px;color:var(--text2);">${esc(cm.texto)}</p>
          </div>
        </div>
      `;
    }).join('');
  });
}

async function enviarComentarioAula() {
  const txt = $('aula-comment-input').value.trim();
  if (!txt || !currentMateriaId || !currentAulaId) return;
  
  await db.ref('comentarios/' + currentMateriaId + '/' + currentAulaId).push({
    texto: txt, autorId: currentUser.uid, autorNome: currentUserData.username,
    createdAt: Date.now()
  });
  
  $('aula-comment-input').value = '';
  addPoints(3);
}

function voltarMateria() { navigate('materia-detalhe'); }

// ═══════════════ VÍDEOS ═══════════════
async function adicionarVideo() {
  const titulo = $('video-titulo').value.trim();
  let url = $('video-url').value.trim();
  
  if (!titulo || !url) return toast('Preencha tudo', 'error');
  
  // Converter YouTube
  if (url.includes('youtube.com/watch?v=')) {
    const vid = url.split('v=')[1]?.split('&')[0];
    url = 'https://www.youtube.com/embed/' + vid;
  } else if (url.includes('youtu.be/')) {
    const vid = url.split('youtu.be/')[1]?.split('?')[0];
    url = 'https://www.youtube.com/embed/' + vid;
  }
  
  await db.ref('videos/' + currentMateriaId).push({
    titulo: titulo, url: url,
    autorId: currentUser.uid, autorNome: currentUserData.username,
    createdAt: Date.now()
  });
  
  closeModal('modal-video');
  $('video-titulo').value = '';
  $('video-url').value = '';
  toast('Vídeo adicionado! 🎬', 'success');
  addPoints(10);
}

// ═══════════════ QUIZ ═══════════════
function addQuestaoQuiz() {
  quizQuestoesForm.push({ pergunta: '', alternativas: ['', '', '', ''], correta: 0 });
  renderQuizQuestoesForm();
}

function removerQuestaoQuiz(idx) {
  quizQuestoesForm.splice(idx, 1);
  renderQuizQuestoesForm();
}

function renderQuizQuestoesForm() {
  const wrap = $('quiz-questoes-wrap');
  if (!wrap) return;
  
  wrap.innerHTML = quizQuestoesForm.map(function(q, qi) {
    return `
      <div style="background:var(--bg);border-radius:8px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong>Questão ${qi+1}</strong>
          ${quizQuestoesForm.length > 1 ? '<button class="btn btn-danger btn-sm" onclick="removerQuestaoQuiz('+qi+')"><i class="fas fa-trash"></i></button>' : ''}
        </div>
        <input class="input-field" placeholder="Pergunta" value="${esc(q.pergunta)}" oninput="quizQuestoesForm[${qi}].pergunta=this.value" />
        ${['A','B','C','D'].map(function(l, ai) {
          return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <input type="radio" name="qc-${qi}" ${q.correta===ai?'checked':''} onchange="quizQuestoesForm[${qi}].correta=${ai}" />
              <span style="font-weight:700;width:20px;">${l}</span>
              <input class="input-field" placeholder="Alternativa ${l}" value="${esc(q.alternativas[ai]||'')}" oninput="quizQuestoesForm[${qi}].alternativas[${ai}]=this.value" style="flex:1;margin:0;" />
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
}

async function criarQuiz() {
  const nome = $('quiz-nome').value.trim();
  const tempo = parseInt($('quiz-tempo').value) || 30;
  
  if (!nome) return toast('Nome obrigatório', 'error');
  if (!quizQuestoesForm.length) return toast('Adicione questões', 'error');
  
  const validas = quizQuestoesForm.filter(function(q) {
    return q.pergunta.trim() && q.alternativas.filter(function(a) { return a.trim(); }).length >= 2;
  });
  
  if (!validas.length) return toast('Preencha as questões', 'error');
  
  await db.ref('quizzes/' + currentMateriaId).push({
    nome: nome, tempo: tempo, questoes: validas,
    autorId: currentUser.uid, autorNome: currentUserData.username,
    isProf: currentUserData.isProf || false,
    oficial: currentUserData.isQuizzer || currentUserData.adminLevel >= 3,
    views: {}, createdAt: Date.now()
  });
  
  closeModal('modal-quiz');
  quizQuestoesForm = [];
  $('quiz-nome').value = '';
  toast('Quiz criado! 🎮', 'success');
  addPoints(20);
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/' + mId + '/' + qId).once('value');
  quizData = snap.val();
  if (!quizData || !quizData.questoes || !quizData.questoes.length) return toast('Quiz vazio', 'error');
  
  // Embaralhar
  quizData.questoes = quizData.questoes.sort(function() { return Math.random() - 0.5; });
  
  quizIndex = 0;
  quizScore = 0;
  quizTimeLeft = quizData.tempo || 30;
  
  $('quiz-result').style.display = 'none';
  $('quiz-question').parentElement.style.display = '';
  $('quiz-options').style.display = '';
  
  navigate('quiz');
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizData.questoes.length) {
    finishQuiz();
    return;
  }
  
  const q = quizData.questoes[quizIndex];
  const total = quizData.questoes.length;
  
  $('quiz-counter').textContent = 'Questão ' + (quizIndex+1) + '/' + total;
  $('quiz-question').textContent = q.pergunta;
  $('quiz-timer').textContent = quizTimeLeft + 's';
  $('quiz-timer').classList.remove('urgent');
  
  $('quiz-options').innerHTML = q.alternativas.map(function(a, i) {
    return `
      <button class="quiz-option" onclick="answerQuiz(${i})">
        <span class="quiz-option-letter">${'ABCD'[i]}</span>
        <span>${esc(a)}</span>
      </button>
    `;
  }).join('');
  
  clearInterval(quizTimer);
  quizTimer = setInterval(function() {
    quizTimeLeft--;
    $('quiz-timer').textContent = quizTimeLeft + 's';
    if (quizTimeLeft <= 5) $('quiz-timer').classList.add('urgent');
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimer);
      answerQuiz(-1);
    }
  }, 1000);
}

function answerQuiz(chosen) {
  clearInterval(quizTimer);
  const q = quizData.questoes[quizIndex];
  const correta = q.correta;
  const ok = chosen === correta;
  
  const btns = document.querySelectorAll('#quiz-options .quiz-option');
  btns.forEach(function(b, i) {
    b.style.pointerEvents = 'none';
    if (i === correta) b.classList.add('correct');
    if (i === chosen && !ok) b.classList.add('wrong');
  });
  
  if (ok) {
    quizScore++;
    addPoints(10 + Math.floor(quizTimeLeft / 2));
  }
  
  setTimeout(function() {
    quizIndex++;
    quizTimeLeft = quizData.tempo || 30;
    renderQuizQuestion();
  }, 1500);
}

async function finishQuiz() {
  clearInterval(quizTimer);
  
  const total = quizData.questoes.length;
  const pct = Math.round(quizScore / total * 100);
  const ptsGanhos = quizScore * 10 + (pct >= 90 ? 50 : pct >= 70 ? 30 : 0);
  
  $('quiz-question').parentElement.style.display = 'none';
  $('quiz-options').style.display = 'none';
  $('quiz-result').style.display = '';
  
  if (pct >= 90) {
    $('result-icon').textContent = '🏆';
    $('result-title').textContent = 'Excelente!';
  } else if (pct >= 70) {
    $('result-icon').textContent = '🎉';
    $('result-title').textContent = 'Muito bom!';
  } else if (pct >= 50) {
    $('result-icon').textContent = '👍';
    $('result-title').textContent = 'Bom trabalho!';
  } else {
    $('result-icon').textContent = '📚';
    $('result-title').textContent = 'Continue estudando!';
  }
  
  $('result-text').textContent = 'Você acertou ' + quizScore + ' de ' + total + ' questões (' + pct + '%)';
  $('result-points').textContent = '+' + ptsGanhos + ' XP';
  
  // Salvar
  const curSnap = await db.ref('usuarios/' + currentUser.uid + '/points').once('value');
  await db.ref('usuarios/' + currentUser.uid).update({
    points: (curSnap.val() || 0) + ptsGanhos,
    quizzesPlayed: (currentUserData.quizzesPlayed || 0) + 1
  });
  currentUserData.points = (currentUserData.points || 0) + ptsGanhos;
  currentUserData.quizzesPlayed = (currentUserData.quizzesPlayed || 0) + 1;
  updateUI();
}

function sairQuiz() {
  clearInterval(quizTimer);
  navigate('materia-detalhe');
}

// ═══════════════ RANKING ═══════════════
async function loadRanking() {
  const list = $('ranking-list');
  const podium = $('podium');
  if (!list) return;
  
  list.innerHTML = showLoading();
  
  const snap = await db.ref('usuarios').orderByChild('points').limitToLast(50).once('value');
  const users = [];
  snap.forEach(function(c) { users.push(c.val()); });
  users.sort(function(a, b) { return (b.points || 0) - (a.points || 0); });
  
  // Pódio
  if (podium && users.length >= 3) {
    podium.style.display = '';
    podium.innerHTML = `
      <div class="podium-item">
        <div class="podium-bar silver">
          <strong>${esc(users[1]?.username || '?')}</strong>
          <span style="font-size:10px;">${fmt(users[1]?.points || 0)}</span>
        </div>
        <span style="margin-top:5px;">🥈 2°</span>
      </div>
      <div class="podium-item">
        <div class="podium-bar gold">
          <strong>${esc(users[0]?.username || '?')}</strong>
          <span style="font-size:10px;">${fmt(users[0]?.points || 0)}</span>
        </div>
        <span style="margin-top:5px;">👑 1°</span>
      </div>
      <div class="podium-item">
        <div class="podium-bar bronze">
          <strong>${esc(users[2]?.username || '?')}</strong>
          <span style="font-size:10px;">${fmt(users[2]?.points || 0)}</span>
        </div>
        <span style="margin-top:5px;">🥉 3°</span>
      </div>
    `;
  }
  
  // Lista
  list.innerHTML = users.map(function(u, i) {
    const isMe = u.uid === (currentUser ? currentUser.uid : '');
    const pos = i + 1;
    const medals = {1: '🥇', 2: '🥈', 3: '🥉'};
    return `
      <div class="rank-item ${pos <= 3 ? 'top-' + pos : ''}" ${isMe ? 'style="border:2px solid var(--primary);"' : ''}>
        <span class="rank-position">${medals[pos] || pos}</span>
        <div class="rank-avatar" style="display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">
          ${(u.fullname || '?')[0].toUpperCase()}
        </div>
        <div class="rank-info">
          <div class="rank-name">
            ${esc(u.fullname || u.username || '?')}
            ${isMe ? '<span style="color:var(--primary);font-size:10px;">(você)</span>' : ''}
          </div>
          <div class="rank-username">@${esc(u.username || '?')}</div>
        </div>
        <span class="rank-points">${fmt(u.points || 0)} pts</span>
      </div>
    `;
  }).join('');
}

// ═══════════════ DESAFIOS ═══════════════
async function loadDesafios() {
  const list = $('desafios-list');
  if (!list) return;
  
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  const now = Date.now();
  
  if (!desafios) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚔️</div><div class="empty-state-text">Nenhum desafio</div><div class="empty-state-subtext">Fique ligado!</div></div>';
    return;
  }
  
  list.innerHTML = Object.entries(desafios).reverse().map(function(e) {
    const d = e[1];
    const ativo = now >= d.inicio && now <= d.fim;
    const status = ativo ? 'ativo' : (now > d.fim ? 'encerrado' : 'agendado');
    const statusText = ativo ? 'Ativo' : (now > d.fim ? 'Encerrado' : 'Agendado');
    
    return `
      <div class="desafio-card">
        ${d.banner ? '<img src="' + esc(d.banner) + '" class="desafio-banner" alt="Banner" />' : ''}
        <div class="desafio-body">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <h3 style="font-size:16px;">⚔️ ${esc(d.titulo)}</h3>
            <span class="desafio-status ${status}">${statusText}</span>
          </div>
          <p style="font-size:13px;color:var(--text2);margin:8px 0;">${esc(d.descricao || '')}</p>
          <div style="font-size:12px;color:var(--text3);margin-bottom:10px;">
            🏆 <strong style="color:var(--primary);">+${d.premio} pts</strong> · 
            📅 ${new Date(d.inicio).toLocaleDateString('pt-BR')} até ${new Date(d.fim).toLocaleDateString('pt-BR')}
          </div>
          ${ativo ? '<button class="btn btn-primary btn-sm" onclick="participarDesafio(\'' + e[0] + '\')">▶ Participar</button>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function participarDesafio(id) {
  const snap = await db.ref('desafios/' + id).once('value');
  desafioAtual = snap.val();
  desafioAtual.id = id;
  respostasDesafio = [];
  
  if (!desafioAtual || !desafioAtual.questoes) return toast('Desafio sem questões', 'error');
  
  // Parse das questões
  const questoes = desafioAtual.questoes.split('\n\n').filter(function(b) { return b.trim(); }).map(function(b) {
    const l = b.trim().split('\n');
    const resp = l.find(function(x) { return x.toUpperCase().startsWith('RESPOSTA:'); });
    const respLetra = resp ? resp.replace(/RESPOSTA:/i, '').trim().toUpperCase() : '';
    const alts = l.filter(function(x) { return /^[a-dA-D]\)/.test(x.trim()); }).map(function(x) { return x.replace(/^[a-dA-D]\)\s*/, ''); });
    return { pergunta: l[0].replace(/^\d+[\.\)\-]\s*/, ''), alternativas: alts, resposta: respLetra };
  });
  
  let score = 0;
  for (let i = 0; i < questoes.length; i++) {
    const q = questoes[i];
    const altText = q.alternativas.map(function(a, j) { return 'ABCD'[j] + ') ' + a; }).join('\n');
    const answer = prompt('Questão ' + (i+1) + '/' + questoes.length + ':\n\n' + q.pergunta + '\n\n' + altText + '\n\nResposta (A/B/C/D):');
    if (answer && answer.trim().toUpperCase() === q.resposta) {
      score++;
    }
  }
  
  const pct = Math.round(score / questoes.length * 100);
  const ganhou = pct >= 70 ? desafioAtual.premio : Math.round(desafioAtual.premio * (pct / 100));
  
  // Salvar participação
  await db.ref('desafios/' + id + '/participantes/' + currentUser.uid).set({
    nome: currentUserData.username, acertos: score, total: questoes.length, pct: pct, pontosGanhos: ganhou, data: Date.now()
  });
  
  if (ganhou > 0) {
    await addPoints(ganhou);
  }
  
  alert('🏆 Desafio concluído!\n\nAcertos: ' + score + '/' + questoes.length + ' (' + pct + '%)\nPontos ganhos: +' + ganhou);
  loadDesafios();
}

// ═══════════════ JARVIS IA ═══════════════
function addJarvisMsg(role, text) {
  const div = $('jarvis-messages');
  if (!div) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'jarvis-message ' + role;
  
  if (role === 'bot') {
    msgDiv.innerHTML = '<img src="' + IMG.jarvis + '" style="width:28px;height:28px;border-radius:50%;margin-right:8px;" /><div class="jarvis-bubble">' + text + '</div>';
  } else {
    msgDiv.innerHTML = '<div class="jarvis-bubble">' + text + '</div>';
  }
  
  div.appendChild(msgDiv);
  div.scrollTop = div.scrollHeight;
}

function jarvisImageSelected(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    jarvisImageBase64 = e.target.result.split(',')[1];
    jarvisImageMime = file.type;
    
    $('jarvis-image-preview').style.display = '';
    $('jarvis-preview-img').src = e.target.result;
    toast('📷 Imagem carregada! Envie sua pergunta.');
  };
  reader.readAsDataURL(file);
}

function removerImagemJarvis() {
  jarvisImageBase64 = null;
  jarvisImageMime = null;
  $('jarvis-image-preview').style.display = 'none';
  $('jarvis-img-input').value = '';
}

async function sendJarvis() {
  const txt = $('jarvis-input').value.trim();
  if (!txt && !jarvisImageBase64) return;
  $('jarvis-input').value = '';
  
  if (txt) addJarvisMsg('user', esc(txt));
  if (jarvisImageBase64) {
    addJarvisMsg('user', '📷 <img src="' + $('jarvis-preview-img').src + '" style="max-width:150px;border-radius:8px;" />');
  }
  
  // Typing indicator
  const typingId = 'typing-' + Date.now();
  const typingDiv = document.createElement('div');
  typingDiv.id = typingId;
  typingDiv.className = 'jarvis-message bot';
  typingDiv.innerHTML = '<div class="jarvis-bubble"><div class="jarvis-typing"><span></span><span></span><span></span></div></div>';
  $('jarvis-messages').appendChild(typingDiv);
  $('jarvis-messages').scrollTop = $('jarvis-messages').scrollHeight;
  
  try {
    let reply = '';
    
    if (jarvisImageBase64) {
      // Gemini para imagem
      const promptText = txt || 'Descreva esta imagem e ajude-me a estudar com ela.';
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: promptText },
            { inline_data: { mime_type: jarvisImageMime, data: jarvisImageBase64 } }
          ]}]
        })
      });
      const d = await r.json();
      reply = d.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui analisar a imagem 😅';
      
      // Limpar imagem
      removerImagemJarvis();
    } else {
      // Groq para texto
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Você é o Jarvis, assistente de estudos da plataforma Sexta-Feira Studies. Responda em português de forma clara, educativa e motivadora. Use emojis.' },
            { role: 'user', content: txt }
          ],
          max_tokens: 800
        })
      });
      const d = await r.json();
      reply = d.choices?.[0]?.message?.content || 'Desculpe, não entendi 😅';
    }
    
    document.getElementById(typingId)?.remove();
    addJarvisMsg('bot', esc(reply));
  } catch(e) {
    document.getElementById(typingId)?.remove();
    addJarvisMsg('bot', '❌ Erro de conexão. Tente novamente!');
    console.error('Jarvis error:', e);
  }
}

// ═══════════════ PERFIL ═══════════════
async function loadPerfil() {
  if (!currentUserData) return;
  updateUI();
  
  // Histórico
  const snap = await db.ref('historico/' + currentUser.uid).once('value');
  const hist = snap.val();
  const c = $('perfil-historico');
  if (!c) return;
  
  if (!hist) {
    c.innerHTML = '<p style="color:var(--text3);text-align:center;padding:10px;">Nenhuma atividade</p>';
    return;
  }
  
  const arr = Object.entries(hist).map(function(e) { return e[1]; }).sort(function(a, b) { return b.createdAt - a.createdAt; }).slice(0, 10);
  c.innerHTML = arr.map(function(h) {
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>🎮 ${esc(h.quizNome || 'Quiz')}</strong>
          <div style="font-size:11px;color:var(--text3);">${h.acertos}/${h.total} · ${h.pct}%</div>
        </div>
        <span style="color:var(--primary);font-weight:700;">+${h.score}</span>
      </div>
    `;
  }).join('');
}

function fillEditarPerfil() {
  $('ep-nome').value = currentUserData.fullname || '';
  $('ep-bio').value = currentUserData.bio || '';
}

async function salvarPerfil() {
  const nome = $('ep-nome').value.trim();
  const bio = $('ep-bio').value.trim();
  const fileInput = $('ep-avatar-input');
  const file = fileInput && fileInput.files[0];
  
  const salvar = async function(avatarUrl) {
    const updates = { fullname: nome, bio: bio };
    if (avatarUrl) updates.avatar = avatarUrl;
    
    await db.ref('usuarios/' + currentUser.uid).update(updates);
    Object.assign(currentUserData, updates);
    
    closeModal('modal-editar-perfil');
    updateUI();
    toast('Perfil atualizado! ✅', 'success');
  };
  
  if (file) {
    toast('⏳ Enviando foto...', 'success');
    await uploadImgBB(file, salvar);
  } else {
    await salvar('');
  }
}

async function viewUserPerfil(uid) {
  if (!uid || uid === (currentUser ? currentUser.uid : '')) { navigate('perfil'); return; }
  currentModalUserId = uid;
  
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;
  
  $('mup-avatar').src = u.avatar || '';
  $('mup-info').innerHTML = `
    <h3 style="font-size:18px;">${esc(u.fullname || u.username || '?')}</h3>
    <p style="color:var(--text2);font-size:13px;">@${esc(u.username || '?')}</p>
    <p style="color:var(--text2);font-size:13px;margin-top:4px;">⭐ ${fmt(u.points || 0)} pts</p>
    ${u.bio ? '<p style="color:var(--text2);font-size:12px;margin-top:4px;">' + esc(u.bio) + '</p>' : ''}
  `;
  
  // Verificar se já segue
  const segSnap = await db.ref('seguidores/' + uid + '/' + currentUser.uid).once('value');
  const seguindo = !!segSnap.val();
  const btn = $('mup-follow-btn');
  btn.textContent = seguindo ? 'Deixar de Seguir' : 'Seguir';
  btn.className = 'btn ' + (seguindo ? 'btn-outline' : 'btn-primary');
  
  openModal('modal-user-perfil');
}

async function toggleFollow(uid) {
  if (!uid) return;
  const ref = db.ref('seguidores/' + uid + '/' + currentUser.uid);
  const snap = await ref.once('value');
  
  if (snap.val()) {
    await ref.remove();
  } else {
    await ref.set(true);
    await db.ref('seguindo/' + currentUser.uid + '/' + uid).set(true);
    enviarNotif(uid, currentUserData.fullname + ' começou a te seguir! 👥', 'follow');
  }
  
  // Atualizar botão
  const segSnap = await db.ref('seguidores/' + uid + '/' + currentUser.uid).once('value');
  const btn = $('mup-follow-btn');
  if (btn) {
    btn.textContent = segSnap.val() ? 'Deixar de Seguir' : 'Seguir';
    btn.className = 'btn ' + (segSnap.val() ? 'btn-outline' : 'btn-primary');
  }
}

function toggleFollowModal() {
  toggleFollow(currentModalUserId);
  closeModal('modal-user-perfil');
}

// ═══════════════ NOTIFICAÇÕES ═══════════════
function listenNotificacoes() {
  if (!currentUser) return;
  db.ref('notificacoes/' + currentUser.uid).on('value', function(snap) {
    let total = 0;
    if (snap.exists()) {
      snap.forEach(function(c) { if (!c.val().lida) total++; });
    }
    const badge = $('notif-badge');
    if (badge) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.style.display = total > 0 ? '' : 'none';
    }
  });
}

async function loadNotificacoes() {
  const list = $('notificacoes-list');
  if (!list) return;
  
  const snap = await db.ref('notificacoes/' + currentUser.uid).orderByChild('createdAt').limitToLast(50).once('value');
  const notifs = snap.val();
  
  if (!notifs) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-text">Nenhuma notificação</div></div>';
    return;
  }
  
  list.innerHTML = Object.entries(notifs).reverse().map(function(e) {
    const n = e[1];
    return `
      <div style="padding:14px;border-bottom:1px solid var(--border);${n.lida ? '' : 'background:var(--primary-light);'}cursor:pointer;" onclick="marcarLida('${e[0]}')">
        <p style="font-size:13px;">${esc(n.mensagem)}</p>
        <span style="font-size:11px;color:var(--text3);">${timeAgo(n.createdAt)}</span>
      </div>
    `;
  }).join('');
}

async function marcarLida(id) {
  await db.ref('notificacoes/' + currentUser.uid + '/' + id).update({ lida: true });
  loadNotificacoes();
}

async function marcarTodasLidas() {
  const snap = await db.ref('notificacoes/' + currentUser.uid).once('value');
  if (!snap.exists()) return;
  const updates = {};
  snap.forEach(function(c) { updates[c.key + '/lida'] = true; });
  await db.ref('notificacoes/' + currentUser.uid).update(updates);
  loadNotificacoes();
}

function enviarNotif(uid, mensagem, tipo) {
  db.ref('notificacoes/' + uid).push({
    mensagem: mensagem, tipo: tipo || 'geral', lida: false, createdAt: Date.now()
  });
}

// ═══════════════ BUSCA ═══════════════
function doBusca(q) {
  const el = $('busca-results');
  if (!el) return;
  if (!q || q.trim().length < 1) { el.innerHTML = ''; return; }
  
  el.innerHTML = showLoading();
  const ql = q.toLowerCase();
  const results = [];
  
  db.ref('usuarios').once('value').then(function(snap) {
    snap.forEach(function(c) {
      const u = c.val();
      if ((u.fullname || '').toLowerCase().includes(ql) || (u.username || '').toLowerCase().includes(ql)) {
        results.push({ type: 'usuario', data: u });
      }
    });
    return db.ref('materias').once('value');
  }).then(function(snap) {
    snap.forEach(function(c) {
      const m = c.val();
      if ((m.nome || '').toLowerCase().includes(ql)) {
        results.push({ type: 'materia', data: m, id: c.key });
      }
    });
    
    if (!results.length) {
      el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px;">Nenhum resultado encontrado</p>';
      return;
    }
    
    el.innerHTML = results.map(function(r) {
      if (r.type === 'usuario') {
        const u = r.data;
        return `
          <div class="search-result" onclick="viewUserPerfil('${u.uid}')">
            <div class="rank-avatar" style="width:40px;height:40px;">${(u.fullname || '?')[0].toUpperCase()}</div>
            <div style="flex:1;">
              <strong>${esc(u.fullname || '?')}</strong>
              <div style="font-size:11px;color:var(--text2);">@${esc(u.username || '?')} · ${fmt(u.points || 0)} pts</div>
            </div>
            <span class="badge badge-primary">Usuário</span>
          </div>
        `;
      } else {
        const m = r.data;
        return `
          <div class="search-result" onclick="openMateria('${r.id}')">
            <span style="font-size:28px;">${esc(m.icone || '📚')}</span>
            <div style="flex:1;">
              <strong>${esc(m.nome)}</strong>
              <div style="font-size:11px;color:var(--text2);">${esc(m.descricao || 'Sem descrição')}</div>
            </div>
            <span class="badge badge-accent">Disciplina</span>
          </div>
        `;
      }
    }).join('');
  });
}

// ═══════════════ SOBRE / UPDATES ═══════════════
async function loadSobre() {
  const c = $('sobre-content');
  if (!c) return;
  
  const snap = await db.ref('config/sobre').once('value');
  const data = snap.val();
  
  if (data && data.texto) {
    c.innerHTML = '<div style="line-height:1.8;white-space:pre-wrap;">' + esc(data.texto) + '</div>';
  } else {
    c.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <p style="font-size:18px;font-weight:700;color:var(--primary);">📚 Sexta-Feira Studies</p>
        <p style="color:var(--text2);margin-top:10px;">Uma plataforma de estudos gamificada feita para estudantes e professores.</p>
        <p style="color:var(--text3);font-size:12px;margin-top:15px;">Versão 4.0 - 2025</p>
      </div>
    `;
  }
}

async function loadUpdates() {
  const c = $('updates-list');
  if (!c) return;
  
  const snap = await db.ref('config/updates').once('value');
  const updates = snap.val();
  
  if (!updates) {
    c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhum update</div></div>';
    return;
  }
  
  c.innerHTML = Object.entries(updates).reverse().map(function(e) {
    const u = e[1];
    return `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span class="badge badge-primary">v${esc(u.versao || '1.0')}</span>
          <strong>📋 ${esc(u.titulo)}</strong>
        </div>
        <p style="font-size:13px;color:var(--text2);white-space:pre-wrap;">${esc(u.descricao || '')}</p>
        <div style="font-size:11px;color:var(--text3);margin-top:8px;">📅 ${new Date(u.data).toLocaleDateString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

// ═══════════════ CRIADOR DE PDF ═══════════════
async function gerarQuestoesPDF() {
  const disciplina = $('pdf-disciplina').value.trim();
  const titulo = $('pdf-titulo').value.trim();
  
  if (!disciplina && !titulo) return toast('Preencha ao menos o título ou disciplina', 'error');
  
  const tema = titulo || disciplina;
  toast('🤖 Gerando questões com IA...', 'success');
  
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Crie 10 questões sobre "' + tema + '" para uma lista de exercícios. Formato: uma questão por linha, sem numeração. Apenas as questões, sem introdução.' }],
        max_tokens: 1500
      })
    });
    const d = await r.json();
    const questoes = d.choices?.[0]?.message?.content || '';
    $('pdf-questoes').value = questoes;
    toast('✅ Questões geradas! Visualize e baixe.', 'success');
  } catch(e) {
    toast('❌ Erro ao gerar questões', 'error');
  }
}

function previewPDF() {
  const titulo = $('pdf-titulo').value.trim() || 'Lista de Exercícios';
  const disciplina = $('pdf-disciplina').value.trim();
  const professor = $('pdf-professor').value.trim() || (currentUserData ? currentUserData.fullname : '');
  const questoesRaw = $('pdf-questoes').value.trim();
  
  if (!questoesRaw) return toast('Digite ou gere as questões primeiro!', 'error');
  
  const questoes = questoesRaw.split('\n').filter(function(q) { return q.trim().length > 3; });
  
  const html = `
    <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #10B981;padding-bottom:15px;">
      <h2 style="color:#10B981;margin:0;">📚 Sexta-Feira Studies</h2>
      <h3 style="margin:10px 0 5px;">${esc(titulo)}</h3>
      ${disciplina ? '<p style="color:#666;margin:2px 0;"><strong>Disciplina:</strong> ' + esc(disciplina) + '</p>' : ''}
      ${professor ? '<p style="color:#666;margin:2px 0;"><strong>Professor(a):</strong> ' + esc(professor) + '</p>' : ''}
      <p style="color:#999;font-size:11px;margin:2px 0;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      <div style="margin-top:10px;font-size:11px;color:#666;">
        👤 Aluno: ___________________ &nbsp;&nbsp; 📅 Data: ____/____/____ &nbsp;&nbsp; ⭐ Nota: _____
      </div>
    </div>
    <div style="line-height:2.2;font-size:13px;">
      ${questoes.map(function(q, i) {
        return '<div style="margin-bottom:15px;"><strong>' + (i+1) + '.</strong> ' + esc(q) + '<div style="margin-top:3px;color:#ccc;border-bottom:1px dotted #ddd;">R: _____________________________________________</div></div>';
      }).join('')}
    </div>
    <div style="text-align:center;margin-top:30px;font-size:10px;color:#ccc;">
      Feito com ❤️ por Sexta-Feira Studies
    </div>
  `;
  
  $('pdf-preview-card').style.display = '';
  $('pdf-preview-content').innerHTML = html;
  $('pdf-preview-card').scrollIntoView({ behavior: 'smooth' });
  toast('✅ Visualização pronta! Clique em Baixar PDF', 'success');
}

function baixarPDF() {
  const conteudo = $('pdf-preview-content').innerHTML;
  if (!conteudo) return;
  
  const titulo = $('pdf-titulo').value.trim() || 'Tarefa';
  
  const htmlCompleto = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + titulo + '</title><style>@media print{@page{margin:1.5cm;size:A4;}body{margin:0;}}body{font-family:Arial,sans-serif;padding:25px;line-height:1.8;font-size:13px;color:#000;}</style></head><body>' + conteudo + '</body></html>';
  
  const blob = new Blob([htmlCompleto], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = titulo.replace(/[^a-zA-Z0-9]/g, '_') + '.html';
  a.click();
  URL.revokeObjectURL(url);
  
  toast('📥 Arquivo baixado! Abra e pressione Ctrl+P para salvar como PDF', 'success');
}

// ═══════════════ ADMIN (acessível pelo site) ═══════════════
let admAuthed = false;
let admCurrentTab = 'dashboard';

function admLogin() {
  const senha = document.getElementById('adm-senha');
  if (senha && senha.value === 'admin123') {
    admAuthed = true;
    document.getElementById('adm-login-wrap').style.display = 'none';
    document.getElementById('adm-painel').style.display = 'flex';
    admTab('dashboard');
  } else {
    alert('Senha incorreta!');
  }
}

function admTab(tab) {
  admCurrentTab = tab;
  document.querySelectorAll('#screen-adm .tab').forEach(function(t) {
    t.classList.toggle('active', t.textContent.toLowerCase().includes(tab.substring(0,4)));
  });
  
  const el = document.getElementById('adm-content');
  if (!el) return;
  
  if (tab === 'dashboard') admDashboard(el);
  else if (tab === 'usuarios') admUsuarios(el);
  else if (tab === 'disciplinas') admDisciplinas(el);
  else if (tab === 'quizzes') admQuizzesAdm(el);
  else if (tab === 'aulas') admAulasAdm(el);
  else if (tab === 'posts') admPosts(el);
  else if (tab === 'desafios') admDesafios(el);
  else if (tab === 'sobre') admSobre(el);
  else if (tab === 'updates') admUpdates(el);
}

async function admDashboard(el) {
  const [uSnap, mSnap, pSnap, dSnap] = await Promise.all([
    db.ref('usuarios').once('value'),
    db.ref('materias').once('value'),
    db.ref('posts').once('value'),
    db.ref('desafios').once('value')
  ]);
  
  el.innerHTML = `
    <h3 style="margin-bottom:16px;">📊 Dashboard</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card" style="text-align:center;">
        <div style="font-size:32px;font-weight:800;color:var(--primary);">${uSnap.exists() ? Object.keys(uSnap.val()).length : 0}</div>
        <div style="font-size:12px;color:var(--text2);">Usuários</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:32px;font-weight:800;color:var(--accent);">${mSnap.exists() ? Object.keys(mSnap.val()).length : 0}</div>
        <div style="font-size:12px;color:var(--text2);">Disciplinas</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:32px;font-weight:800;color:var(--purple);">${pSnap.exists() ? Object.keys(pSnap.val()).length : 0}</div>
        <div style="font-size:12px;color:var(--text2);">Posts</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:32px;font-weight:800;color:var(--warning);">${dSnap.exists() ? Object.keys(dSnap.val()).length : 0}</div>
        <div style="font-size:12px;color:var(--text2);">Desafios</div>
      </div>
    </div>
  `;
}

async function admUsuarios(el) {
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val() || {};
  
  let html = '<h3 style="margin-bottom:12px;">👥 Usuários</h3><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:var(--bg);"><th style="padding:10px;text-align:left;">Nome</th><th>@</th><th>Pontos</th><th>Plano</th><th>Admin</th><th>Prof</th><th>Ações</th></tr></thead><tbody>';
  
  Object.entries(users).forEach(function(e) {
    const u = e[1];
    html += `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;">${esc(u.fullname || '?')}</td>
        <td>@${esc(u.username || '?')}</td>
        <td><input type="number" id="pts-${e[0]}" value="${u.points||0}" style="width:70px;padding:4px;border:1px solid var(--border);border-radius:4px;" /></td>
        <td>
          <select id="plano-${e[0]}" style="padding:4px;border:1px solid var(--border);border-radius:4px;">
            <option value="gratis" ${u.plano=='gratis'?'selected':''}>Grátis</option>
            <option value="premium" ${u.plano=='premium'?'selected':''}>Premium</option>
            <option value="pro" ${u.plano=='pro'?'selected':''}>PRO</option>
          </select>
        </td>
        <td><input type="checkbox" id="adm-${e[0]}" ${u.adminLevel>0?'checked':''} /></td>
        <td><input type="checkbox" id="prof-${e[0]}" ${u.isProf?'checked':''} /></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="admSalvarUser('${e[0]}')">💾</button>
          <button class="btn btn-danger btn-sm" onclick="admExcluirUser('${e[0]}')">🗑</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

async function admSalvarUser(uid) {
  const pts = parseInt($('pts-' + uid).value) || 0;
  const plano = $('plano-' + uid).value;
  const isAdm = $('adm-' + uid).checked;
  const isProf = $('prof-' + uid).checked;
  
  await db.ref('usuarios/' + uid).update({
    points: pts, plano: plano, adminLevel: isAdm ? 1 : 0, isProf: isProf
  });
  toast('✅ Usuário atualizado!', 'success');
}

async function admExcluirUser(uid) {
  if (!confirm('Excluir este usuário permanentemente?')) return;
  await db.ref('usuarios/' + uid).remove();
  toast('🗑 Usuário excluído!', 'success');
  admTab('usuarios');
}

async function admDisciplinas(el) {
  const snap = await db.ref('materias').once('value');
  const mats = snap.val() || {};
  
  el.innerHTML = '<h3 style="margin-bottom:12px;">📚 Disciplinas</h3>' + Object.entries(mats).map(function(e) {
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <strong>${esc(e[1].icone || '📚')} ${esc(e[1].nome)}</strong>
          <div style="font-size:11px;color:var(--text2);">@${esc(e[1].autorNome || '?')}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="admExcluirItem('materias','${e[0]}')">🗑</button>
      </div>
    `;
  }).join('') || '<p style="color:var(--text2);">Nenhuma disciplina</p>';
}

async function admQuizzesAdm(el) {
  let html = '<h3 style="margin-bottom:12px;">🎮 Quizzes</h3>';
  const mSnap = await db.ref('materias').once('value');
  const mats = mSnap.val() || {};
  
  for (const [mid, m] of Object.entries(mats)) {
    const qSnap = await db.ref('quizzes/' + mid).once('value');
    const quizzes = qSnap.val() || {};
    for (const [qid, q] of Object.entries(quizzes)) {
      html += `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <strong>${esc(q.nome)}</strong>
            <div style="font-size:11px;color:var(--text2);">${m.nome} · ${q.questoes?.length || 0} questões</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="admExcluirItem('quizzes/${mid}','${qid}')">🗑</button>
        </div>
      `;
    }
  }
  el.innerHTML = html || '<p style="color:var(--text2);">Nenhum quiz</p>';
}

async function admAulasAdm(el) {
  let html = '<h3 style="margin-bottom:12px;">📝 Aulas</h3>';
  const mSnap = await db.ref('materias').once('value');
  const mats = mSnap.val() || {};
  
  for (const [mid, m] of Object.entries(mats)) {
    const aSnap = await db.ref('aulas/' + mid).once('value');
    const aulas = aSnap.val() || {};
    for (const [aid, a] of Object.entries(aulas)) {
      html += `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <strong>${esc(a.titulo)}</strong>
            <div style="font-size:11px;color:var(--text2);">${m.nome} · @${esc(a.autorNome || '?')}</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="admExcluirItem('aulas/${mid}','${aid}')">🗑</button>
        </div>
      `;
    }
  }
  el.innerHTML = html || '<p style="color:var(--text2);">Nenhuma aula</p>';
}

async function admPosts(el) {
  const snap = await db.ref('posts').once('value');
  const posts = snap.val() || {};
  
  el.innerHTML = '<h3 style="margin-bottom:12px;">💬 Posts</h3>' + Object.entries(posts).reverse().map(function(e) {
    const p = e[1];
    const views = p.views ? Object.keys(p.views).length : 0;
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <strong>@${esc(p.autorNome || '?')}</strong>
          <div style="font-size:12px;color:var(--text2);">${esc((p.texto || '').substring(0, 60))}</div>
          <div style="font-size:10px;color:var(--text3);">👁 ${views} · ${timeAgo(p.createdAt)}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="admExcluirItem('posts','${e[0]}')">🗑</button>
      </div>
    `;
  }).join('') || '<p style="color:var(--text2);">Nenhum post</p>';
}

async function admDesafios(el) {
  el.innerHTML = `
    <h3 style="margin-bottom:16px;">⚔️ Criar Novo Desafio</h3>
    <div class="card" style="margin-bottom:20px;">
      <input type="text" class="input-field" id="ad-titulo" placeholder="Título do desafio" />
      <textarea class="input-field" id="ad-desc" rows="2" placeholder="Descrição"></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label style="font-size:11px;">📅 Início</label><input type="datetime-local" class="input-field" id="ad-inicio" /></div>
        <div><label style="font-size:11px;">📅 Término</label><input type="datetime-local" class="input-field" id="ad-fim" /></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <input type="number" class="input-field" id="ad-premio" placeholder="🏆 Prêmio em pontos" />
        <input type="text" class="input-field" id="ad-materia" placeholder="📚 Matéria" />
      </div>
      <input type="text" class="input-field" id="ad-banner" placeholder="🖼️ URL do Banner" />
      <label style="font-size:11px;margin-top:10px;display:block;">📝 Questões:</label>
      <textarea class="input-field" id="ad-questoes" rows="6" placeholder="Pergunta?&#10;a) A&#10;b) B&#10;c) C&#10;d) D&#10;RESPOSTA: c&#10;&#10;Separe com linha em branco"></textarea>
      <button class="btn btn-accent btn-sm" onclick="admGerarQuestoes()" style="margin-bottom:8px;">🤖 Gerar com IA</button>
      <button class="btn btn-primary btn-full" onclick="admCriarDesafio()">🏆 Criar Desafio</button>
    </div>
    <h3>📋 Desafios Existentes</h3>
    <div id="adm-desafios-list"></div>
  `;
  
  admLoadDesafios();
}

async function admGerarQuestoes() {
  const materia = $('ad-materia').value.trim();
  const titulo = $('ad-titulo').value.trim();
  if (!materia && !titulo) return toast('Preencha título ou matéria!', 'error');
  
  const tema = titulo || materia;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Crie 10 questões de múltipla escolha sobre "' + tema + '". Formato:\n1. Pergunta?\na) A\nb) B\nc) C\nd) D\nRESPOSTA: c\n\nSepare com linha em branco.' }], max_tokens: 2000 })
    });
    const d = await r.json();
    $('ad-questoes').value = d.choices?.[0]?.message?.content || '';
    toast('✅ Questões geradas!', 'success');
  } catch(e) { toast('❌ Erro', 'error'); }
}

async function admCriarDesafio() {
  const titulo = $('ad-titulo').value.trim();
  const desc = $('ad-desc').value.trim();
  const inicio = new Date($('ad-inicio').value).getTime();
  const fim = new Date($('ad-fim').value).getTime();
  const premio = parseInt($('ad-premio').value) || 100;
  const materia = $('ad-materia').value.trim();
  const banner = $('ad-banner').value.trim();
  const questoes = $('ad-questoes').value.trim();
  
  if (!titulo || !inicio || !fim || !questoes) return toast('Preencha todos os campos!', 'error');
  
  await db.ref('desafios').push({ titulo, descricao: desc, materia, banner, questoes, premio, inicio, fim, criadoPor: 'Admin', createdAt: Date.now() });
  
  ['ad-titulo','ad-desc','ad-inicio','ad-fim','ad-premio','ad-materia','ad-banner','ad-questoes'].forEach(function(id) {
    const el = $(id); if (el) el.value = '';
  });
  
  admLoadDesafios();
  toast('✅ Desafio criado!', 'success');
}

async function admLoadDesafios() {
  const el = $('adm-desafios-list');
  if (!el) return;
  
  const snap = await db.ref('desafios').once('value');
  const desafios = snap.val();
  const now = Date.now();
  
  el.innerHTML = desafios ? Object.entries(desafios).reverse().map(function(e) {
    const d = e[1];
    const status = now < d.inicio ? '⏳ Agendado' : now > d.fim ? '❌ Encerrado' : '🟢 Ativo';
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <strong>⚔️ ${esc(d.titulo)}</strong> <span class="badge">${status}</span>
          <div style="font-size:11px;color:var(--text2);">🏆 +${d.premio} pts · ${new Date(d.inicio).toLocaleDateString('pt-BR')}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="admExcluirItem('desafios','${e[0]}')">🗑</button>
      </div>
    `;
  }).join('') : '<p style="color:var(--text2);">Nenhum desafio</p>';
}

async function admSobre(el) {
  const snap = await db.ref('config/sobre').once('value');
  const data = snap.val();
  
  el.innerHTML = `
    <h3 style="margin-bottom:16px;">ℹ️ Editar Sobre Nós</h3>
    <textarea class="input-field" id="adm-sobre-txt" rows="10" placeholder="Conteúdo da página Sobre Nós...">${esc(data?.texto || '')}</textarea>
    <button class="btn btn-primary" onclick="admSalvarSobre()" style="margin-top:10px;">💾 Salvar</button>
  `;
}

async function admSalvarSobre() {
  const texto = $('adm-sobre-txt').value;
  await db.ref('config/sobre').set({ texto: texto, atualizadoEm: Date.now() });
  toast('✅ Página Sobre Nós atualizada!', 'success');
}

async function admUpdates(el) {
  el.innerHTML = `
    <h3 style="margin-bottom:16px;">📋 Novo Update</h3>
    <div class="card" style="margin-bottom:20px;">
      <input type="text" class="input-field" id="adm-up-titulo" placeholder="Título" />
      <input type="text" class="input-field" id="adm-up-versao" placeholder="Versão (ex: 4.0)" />
      <textarea class="input-field" id="adm-up-desc" rows="5" placeholder="Descrição das mudanças..."></textarea>
      <button class="btn btn-primary" onclick="admCriarUpdate()">📢 Publicar</button>
    </div>
    <h3>📜 Histórico</h3>
    <div id="adm-updates-list"></div>
  `;
  
  admLoadUpdates();
}

async function admCriarUpdate() {
  const titulo = $('adm-up-titulo').value.trim();
  const versao = $('adm-up-versao').value.trim();
  const desc = $('adm-up-desc').value.trim();
  
  if (!titulo || !versao || !desc) return toast('Preencha todos!', 'error');
  
  await db.ref('config/updates').push({ titulo, versao, descricao: desc, data: Date.now() });
  ['adm-up-titulo','adm-up-versao','adm-up-desc'].forEach(function(id) { const el = $(id); if (el) el.value = ''; });
  admLoadUpdates();
  toast('✅ Update publicado!', 'success');
}

async function admLoadUpdates() {
  const el = $('adm-updates-list');
  if (!el) return;
  
  const snap = await db.ref('config/updates').once('value');
  const updates = snap.val();
  
  el.innerHTML = updates ? Object.entries(updates).reverse().map(function(e) {
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <span class="badge badge-primary">v${esc(e[1].versao)}</span>
          <strong>${esc(e[1].titulo)}</strong>
          <div style="font-size:11px;color:var(--text2);">📅 ${new Date(e[1].data).toLocaleDateString('pt-BR')}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="admExcluirItem('config/updates','${e[0]}')">🗑</button>
      </div>
    `;
  }).join('') : '<p style="color:var(--text2);">Nenhum update</p>';
}

async function admExcluirItem(path, id) {
  if (!confirm('Excluir permanentemente?')) return;
  await db.ref(path + '/' + id).remove();
  toast('🗑 Excluído!', 'success');
  admTab(admCurrentTab);
}

// ═══════════════ UTILITÁRIOS ═══════════════
async function addPoints(pts) {
  if (!currentUser || pts <= 0) return;
  const snap = await db.ref('usuarios/' + currentUser.uid + '/points').once('value');
  const cur = snap.val() || 0;
  await db.ref('usuarios/' + currentUser.uid).update({ points: cur + pts });
  currentUserData.points = cur + pts;
  updateUI();
}

function previewImg(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = $(previewId);
    if (preview) {
      preview.src = e.target.result;
      $(previewId + '-container').style.display = '';
    }
  };
  reader.readAsDataURL(file);
}

function removerImagemPost() {
  $('post-img-input').value = '';
  $('post-img-preview-container').style.display = 'none';
}

async function uploadImgBB(file, callback) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    const formData = new FormData();
    formData.append('key', IMGBB_KEY);
    formData.append('image', base64);
    
    try {
      const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
      const d = await r.json();
      callback(d.data ? d.data.url : '');
    } catch(error) {
      callback('');
      toast('Erro no upload da imagem', 'error');
    }
  };
  reader.readAsDataURL(file);
}

// ═══════════════ INIT ═══════════════
console.log('✅ Sexta-Feira Studies v4.0 PRONTO!');
console.log('📚 Disciplinas | 🎮 Quizzes | 🏆 Ranking | ⚔️ Desafios | 🤖 Jarvis IA');
