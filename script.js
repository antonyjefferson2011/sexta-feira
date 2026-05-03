/* ═══════════════════════════════════════════════════════════
   SEXTA-FEIRA STUDIES - SCRIPT.JS COMPLETO
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════ FIREBASE ═══════════════
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

// ═══════════════ APIs ═══════════════
const GROQ_KEY = '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';
const IMGBB_KEY = '86427cccd2a94fb42a0754ffd7f19e79';

// ═══════════════ STATE ═══════════════
let U = null, UD = null;
let MID = null, AID = null;
let quizData = null, quizIdx = 0, quizScore = 0, quizTimer = null, quizTime = 30;
let quizForm = [];

// ═══════════════ HELPERS ═══════════════
function $(id) { return document.getElementById(id); }
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
function fmt(n) { if (!n) return '0'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
function timeAgo(ts) { if (!ts) return ''; const d = (Date.now()-ts)/1000; if (d<60) return 'agora'; if (d<3600) return Math.floor(d/60)+'min'; if (d<86400) return Math.floor(d/3600)+'h'; if (d<604800) return Math.floor(d/86400)+'d'; return new Date(ts).toLocaleDateString('pt-BR'); }
function toast(msg, type) { const c = $('toast-container'); if (!c) return; const d = document.createElement('div'); d.className = 'toast '+(type||''); d.innerHTML = msg; c.appendChild(d); setTimeout(() => { d.style.opacity='0'; setTimeout(()=>d.remove(),300); }, 3000); }
function showLoading() { return '<div class="loading"><div class="spinner"></div></div>'; }
function shortName(n) { return (n||'?').split(' ')[0]; }

// ═══════════════ NAVEGAÇÃO ═══════════════
function navigate(page) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-'+page); if (t) t.classList.add('active');
  document.querySelectorAll('.bnav-item').forEach((b,i) => b.classList.toggle('active', ['home','materias','ranking','desafios','jarvis'][i]===page));
  window.scrollTo(0,0);
  if (page==='home') loadHome();
  else if (page==='materias') loadMaterias();
  else if (page==='ranking') loadRanking();
  else if (page==='desafios') loadDesafios();
  else if (page==='perfil') loadPerfil();
  else if (page==='notificacoes') loadNotificacoes();
  else if (page==='sobre') loadSobre();
  else if (page==='updates') loadUpdates();
  else if (page==='agenda') loadAgenda();
  else if (page==='tarefas') loadTarefas();
  else if (page==='busca') {}
}

function openModal(id) { const m = $(id); if (m) m.classList.add('show'); }
function closeModal(id) { const m = $(id); if (m) { m.classList.remove('show'); if (id==='modal-quiz-form') quizForm=[]; } }

// ═══════════════ AUTH ═══════════════
auth.onAuthStateChanged(async user => {
  if (user) {
    U = user;
    const snap = await db.ref('usuarios/'+user.uid).once('value');
    UD = snap.val() || {};
    if (!UD.username) {
      UD = { uid: user.uid, fullname: user.displayName||'Usuário', username: (user.email||'').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,''), email: user.email, avatar: user.photoURL||'', bio: '', points: 0, plano:'gratis', adminLevel:0, isProf:false, isQuizzer:false, createdAt:Date.now() };
      await db.ref('usuarios/'+user.uid).set(UD);
    }
    $('screen-login').style.display='none';
    $('app').style.display='';
    $('site-footer').style.display='';
    updateUI();
    navigate('home');
    listenNotifs();
  } else {
    U = null; UD = null;
    $('app').style.display='none';
    $('site-footer').style.display='none';
    $('screen-login').style.display='';
  }
});

function switchAuthTab(tab) {
  document.querySelectorAll('.login-tab').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  $('form-login').style.display = tab==='login'?'':'none';
  $('form-register').style.display = tab==='register'?'':'none';
}

async function doLogin() {
  const u = $('login-user').value.trim().replace('@',''), p = $('login-pass').value;
  if (!u||!p) return toast('Preencha todos', 'error');
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  const users = snap.val(); if (!users) return toast('@'+u+' não encontrado', 'error');
  const uid = Object.keys(users)[0];
  try { await auth.signInWithEmailAndPassword(users[uid].email, p); }
  catch(e) { toast('Senha incorreta', 'error'); }
}

async function doRegister() {
  const n = $('reg-name').value.trim(), u = $('reg-user').value.trim().toLowerCase().replace('@',''), e = $('reg-email').value.trim(), p = $('reg-pass').value;
  if (!n||!u||!e||!p) return toast('Preencha todos', 'error');
  if (u.length<3) return toast('@usuario mínimo 3', 'error');
  if (p.length<6) return toast('Senha mínimo 6', 'error');
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  if (snap.val()) return toast('@'+u+' já existe', 'error');
  try {
    const cred = await auth.createUserWithEmailAndPassword(e, p);
    await db.ref('usuarios/'+cred.user.uid).set({ uid:cred.user.uid, fullname:n, username:u, email:e, password:p, avatar:'', bio:'', points:0, plano:'gratis', adminLevel:0, isProf:false, isQuizzer:false, createdAt:Date.now() });
    toast('Conta criada! 🎉');
  } catch(ex) { toast('Erro: '+ex.message, 'error'); }
}

function loginGoogle() { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => toast('Erro Google', 'error')); }
function doLogout() { auth.signOut(); }

// ═══════════════ UI ═══════════════
function updateUI() {
  if (!UD) return;
  $('perfil-nome').textContent = UD.fullname||UD.username;
  $('perfil-user').textContent = UD.username;
  $('perfil-pts').textContent = fmt(UD.points||0);
  $('home-greeting').textContent = 'Olá, '+shortName(UD.fullname)+'! 👋';
  $('home-points').textContent = fmt(UD.points||0);
  $('home-quizzes').textContent = UD.quizzesPlayed||0;
  if (UD.adminLevel>0) $('selo-admin').style.display='';
  if (UD.isProf) $('selo-prof').style.display='';
  const av = UD.avatar;
  $('nav-avatar').innerHTML = av&&av.startsWith('http') ? '<img src="'+av+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : (UD.fullname||'?')[0].toUpperCase();
  $('perfil-avatar').innerHTML = av&&av.startsWith('http') ? '<img src="'+av+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />' : (UD.fullname||'?')[0].toUpperCase();
  // Progresso
  const pts = UD.points||0;
  const levels = [0,100,500,1000,5000,10000,50000,100000];
  let lvl=0; for (let i=0;i<levels.length;i++) if(pts>=levels[i]) lvl=i;
  const nxt = levels[Math.min(lvl+1,levels.length-1)];
  const pct = nxt>levels[lvl] ? Math.min(((pts-levels[lvl])/(nxt-levels[lvl]))*100,100) : 100;
  $('progress-text').textContent = fmt(pts)+'/'+fmt(nxt)+' pts';
  $('progress-fill').style.width = pct+'%';
}

// ═══════════════ HOME ═══════════════
async function loadHome() {
  updateUI();
  const snap = await db.ref('posts').orderByChild('createdAt').limitToLast(20).once('value');
  const posts = snap.val();
  const c = $('feed-list'); if (!c) return;
  if (!posts) { c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Nenhum post</div></div>'; return; }
  c.innerHTML = Object.entries(posts).reverse().map(([id,p]) => renderPost(id,p)).join('');
  // Desafio do dia
  const ds = await db.ref('desafios').once('value');
  const desafios = ds.val();
  const now = Date.now();
  if (desafios) {
    const ativos = Object.entries(desafios).filter(([id,d]) => now>=d.inicio && now<=d.fim);
    if (ativos.length) {
      const d = ativos[0][1];
      $('home-desafio').innerHTML = '<div class="card card-clickable" onclick="navigate(\'desafios\')"><strong>⚔️ '+esc(d.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">🏆 +'+d.premio+' pts · Participe!</span></div>';
    }
  }
  // Ranking pos
  const us = await db.ref('usuarios').orderByChild('points').once('value');
  const arr = []; us.forEach(c => arr.push(c.val())); arr.sort((a,b)=>(b.points||0)-(a.points||0));
  const pos = arr.findIndex(u => u.uid===(U?U.uid:''))+1;
  $('home-rank').textContent = pos>0 ? '#'+pos : '--';
  const ms = await db.ref('materias').once('value');
  $('home-materias').textContent = ms.val() ? Object.keys(ms.val()).length : 0;
}

function renderPost(id, p) {
  const likes = typeof p.likes==='object' ? Object.keys(p.likes).length : (p.likes||0);
  const liked = p.likes && U && p.likes[U.uid];
  const views = p.views ? (typeof p.views==='object'?Object.keys(p.views).length:p.views) : 0;
  const img = p.imagem ? '<img src="'+esc(p.imagem)+'" class="post-image" />' : '';
  return '<div class="post-card"><div class="post-header"><div class="post-avatar">'+(p.avatar&&p.avatar.startsWith('http')?'<img src="'+esc(p.avatar)+'" />':(p.autorNome||'?')[0].toUpperCase())+'</div><div style="flex:1;"><strong>'+esc(p.autorNome||'?')+'</strong><br><span style="font-size:10px;color:var(--text3);">'+timeAgo(p.createdAt)+' · 👁 '+views+'</span></div></div>'+(p.texto?'<div class="post-body"><p>'+esc(p.texto)+'</p></div>':'')+img+'<div class="post-actions"><button class="post-action'+(liked?' liked':'')+'" onclick="toggleLike(\''+id+'\')"><i class="fas fa-heart"></i> '+likes+'</button></div></div>';
}

// ═══════════════ POSTS ═══════════════
async function criarPost() {
  const texto = $('post-texto').value.trim();
  const file = $('post-img-input').files[0];
  if (!texto && !file) return toast('Escreva ou adicione imagem', 'error');
  const salvar = async (imgUrl) => {
    await db.ref('posts').push({ texto, imagem:imgUrl||'', tipo:'post', autorId:U.uid, autorNome:UD.fullname, avatar:UD.avatar||'', isProf:!!UD.isProf, likes:{}, views:{}, createdAt:Date.now() });
    closeModal('modal-post'); $('post-texto').value=''; $('post-img-input').value=''; $('post-img-preview-wrap').style.display='none';
    toast('Post publicado! 📢'); loadHome(); addPoints(5);
  };
  if (file) { toast('⏳ Enviando...'); uploadImgBB(file, salvar); }
  else salvar('');
}

async function toggleLike(postId) {
  if (!U) return;
  const ref = db.ref('posts/'+postId+'/likes/'+U.uid);
  const snap = await ref.once('value');
  if (snap.val()) await ref.remove();
  else await ref.set(true);
  loadHome();
}

function previewPostImg() {
  const file = $('post-img-input').files[0]; if (!file) return;
  const r = new FileReader(); r.onload = e => { $('post-img-preview').src=e.target.result; $('post-img-preview-wrap').style.display=''; }; r.readAsDataURL(file);
}
function removePostImg() { $('post-img-input').value=''; $('post-img-preview-wrap').style.display='none'; }

// ═══════════════ DISCIPLINAS ═══════════════
function loadMaterias() {
  db.ref('materias').on('value', snap => {
    const mat = snap.val(); const c = $('materias-list');
    if (!mat) { c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">Nenhuma disciplina</div></div>'; return; }
    c.innerHTML = Object.entries(mat).map(([id,m]) => '<div class="card card-clickable" onclick="openMateria(\''+id+'\')"><span style="font-size:28px;">'+(m.icone||'📚')+'</span> <strong>'+esc(m.nome)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+esc(m.descricao||'')+'</span></div>').join('');
  });
}

async function criarMateria() {
  const n = $('disc-nome').value.trim(), d = $('disc-desc').value.trim();
  if (!n) return toast('Nome obrigatório', 'error');
  await db.ref('materias').push({ nome:n, descricao:d, icone:'📚', autorId:U.uid, autorNome:UD.username, isProf:!!UD.isProf, createdAt:Date.now() });
  closeModal('modal-materia'); toast('Disciplina criada! 📚'); addPoints(10);
}

async function openMateria(id) {
  MID = id;
  const snap = await db.ref('materias/'+id).once('value');
  const m = snap.val(); if (!m) return;
  $('mat-icone').textContent = m.icone||'📚'; $('mat-nome').textContent = m.nome; $('mat-desc').textContent = m.descricao||'';
  navigate('materia-detalhe');
  // Aulas
  db.ref('aulas/'+id).on('value', snap => {
    const a = snap.val(); const c = $('aulas-list');
    c.innerHTML = a ? Object.entries(a).map(([aid,au]) => '<div class="card card-clickable" onclick="openAula(\''+id+'\',\''+aid+'\')"><strong>📝 '+esc(au.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+esc(au.autorNome||'')+'</span></div>').join('') : '<p style="color:var(--text3);">Nenhuma aula</p>';
  });
  // Quizzes
  db.ref('quizzes/'+id).on('value', snap => {
    const q = snap.val(); const c = $('quizzes-list');
    c.innerHTML = q ? Object.entries(q).map(([qid,qu]) => '<div class="card" style="display:flex;justify-content:space-between;align-items:center;"><div><strong>🎮 '+esc(qu.nome)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+(qu.questoes?qu.questoes.length:0)+' questões</span></div><button class="btn btn-primary btn-sm" onclick="startQuiz(\''+id+'\',\''+qid+'\')">▶ Jogar</button></div>').join('') : '<p style="color:var(--text3);">Nenhum quiz</p>';
  });
  // Vídeos
  db.ref('videos/'+id).on('value', snap => {
    const v = snap.val(); const c = $('videos-list');
    c.innerHTML = v ? Object.entries(v).map(([vid,vi]) => '<div class="card card-clickable" onclick="window.open(\''+esc(vi.url)+'\',\'_blank\')"><strong>🎬 '+esc(vi.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+esc(vi.autorNome||'')+'</span></div>').join('') : '<p style="color:var(--text3);">Nenhum vídeo</p>';
  });
}

function voltarMateria() { navigate('materia-detalhe'); }

// ═══════════════ AULAS ═══════════════
async function criarAula() {
  const t = $('aula-titulo-input').value.trim(), c = $('aula-conteudo-input').value.trim();
  if (!t||!c) return toast('Preencha tudo', 'error');
  await db.ref('aulas/'+MID).push({ titulo:t, conteudo:c, autorId:U.uid, autorNome:UD.username, isProf:!!UD.isProf, verificado:false, views:{}, createdAt:Date.now() });
  closeModal('modal-aula'); toast('Aula criada! 📝'); addPoints(15);
}

async function openAula(mid, aid) {
  MID = mid; AID = aid;
  const snap = await db.ref('aulas/'+mid+'/'+aid).once('value');
  const a = snap.val(); if (!a) return;
  db.ref('aulas/'+mid+'/'+aid+'/views/'+U.uid).set(true);
  $('aula-titulo').textContent = a.titulo;
  $('aula-meta').innerHTML = 'Por <strong>@'+esc(a.autorNome||'')+'</strong> · '+timeAgo(a.createdAt)+(a.verificado?' <span style="color:var(--primary);">✅</span>':'');
  $('aula-conteudo').textContent = a.conteudo;
  navigate('aula');
  // Comentários
  db.ref('comentarios/'+mid+'/'+aid).on('value', snap => {
    const coms = snap.val(); const c = $('aula-comentarios');
    c.innerHTML = coms ? Object.entries(coms).map(([id,cm]) => '<div style="display:flex;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border);"><strong>'+esc(cm.autorNome||'')+':</strong> '+esc(cm.texto)+'</div>').join('') : '<p style="color:var(--text3);">Nenhum comentário</p>';
  });
}

async function addComment() {
  const t = $('comment-input').value.trim(); if (!t) return;
  await db.ref('comentarios/'+MID+'/'+AID).push({ texto:t, autorId:U.uid, autorNome:UD.username, createdAt:Date.now() });
  $('comment-input').value=''; addPoints(3);
}

// ═══════════════ VÍDEOS ═══════════════
async function adicionarVideo() {
  const t = $('video-titulo').value.trim(); let url = $('video-url').value.trim();
  if (!t||!url) return toast('Preencha tudo', 'error');
  if (url.includes('watch?v=')) { const vid = url.split('v=')[1]?.split('&')[0]; url = 'https://www.youtube.com/embed/'+vid; }
  else if (url.includes('youtu.be/')) { const vid = url.split('youtu.be/')[1]?.split('?')[0]; url = 'https://www.youtube.com/embed/'+vid; }
  await db.ref('videos/'+MID).push({ titulo:t, url, autorId:U.uid, autorNome:UD.username, createdAt:Date.now() });
  closeModal('modal-video'); toast('Vídeo adicionado! 🎬'); addPoints(10);
}

// ═══════════════ QUIZ ═══════════════
function addQuizQuestao() {
  quizForm.push({ pergunta:'', alternativas:['','','',''], correta:0 });
  renderQuizForm();
}
function renderQuizForm() {
  const c = $('quiz-form-questoes');
  c.innerHTML = quizForm.map((q,i) => '<div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>Q'+(i+1)+'</strong>'+(quizForm.length>1?'<button class="btn btn-danger btn-sm" onclick="quizForm.splice('+i+',1);renderQuizForm()" style="padding:2px 6px;">✕</button>':'')+'</div><input class="input-field" placeholder="Pergunta" value="'+esc(q.pergunta)+'" oninput="quizForm['+i+'].pergunta=this.value" />'+['A','B','C','D'].map((l,j) => '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><input type="radio" name="qc'+i+'" '+(q.correta===j?'checked':'')+' onchange="quizForm['+i+'].correta='+j+'" /><span style="font-weight:700;">'+l+'</span><input class="input-field" placeholder="Alternativa '+l+'" value="'+esc(q.alternativas[j]||'')+'" oninput="quizForm['+i+'].alternativas['+j+']=this.value" style="flex:1;margin:0;" /></div>').join('')+'</div>').join('');
}

async function criarQuiz() {
  const nome = $('quiz-nome-input').value.trim();
  const tempo = parseInt($('quiz-tempo-input').value)||30;
  if (!nome) return toast('Nome obrigatório', 'error');
  const validas = quizForm.filter(q => q.pergunta.trim());
  if (!validas.length) return toast('Adicione questões', 'error');
  await db.ref('quizzes/'+MID).push({ nome, tempo, questoes:validas, autorId:U.uid, createdAt:Date.now() });
  closeModal('modal-quiz-form'); toast('Quiz criado! 🎮'); addPoints(20);
}

async function startQuiz(mId, qId) {
  const snap = await db.ref('quizzes/'+mId+'/'+qId).once('value');
  quizData = snap.val(); if (!quizData?.questoes?.length) return toast('Quiz vazio', 'error');
  quizData.questoes = quizData.questoes.sort(()=>Math.random()-0.5);
  quizIdx = 0; quizScore = 0; quizTime = quizData.tempo||30;
  $('quiz-result').style.display='none';
  $('quiz-question').parentElement.style.display='';
  $('quiz-options').style.display='';
  navigate('quiz');
  renderQuizQ();
}

function renderQuizQ() {
  if (quizIdx >= quizData.questoes.length) { finishQuiz(); return; }
  const q = quizData.questoes[quizIdx];
  $('quiz-counter').textContent = 'Questão '+(quizIdx+1)+'/'+quizData.questoes.length;
  $('quiz-progress').style.width = ((quizIdx+1)/quizData.questoes.length*100)+'%';
  $('quiz-timer').textContent = quizTime+'s';
  $('quiz-timer').style.color = quizTime<=5 ? 'var(--danger)' : 'var(--primary)';
  $('quiz-question').textContent = q.pergunta;
  $('quiz-options').innerHTML = q.alternativas.map((a,i) => '<button class="quiz-option" onclick="answerQuiz('+i+')"><span class="quiz-option-letter">'+'ABCD'[i]+'</span> '+esc(a)+'</button>').join('');
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    quizTime--;
    $('quiz-timer').textContent = quizTime+'s';
    $('quiz-timer').style.color = quizTime<=5 ? 'var(--danger)' : 'var(--primary)';
    if (quizTime<=0) { clearInterval(quizTimer); answerQuiz(-1); }
  }, 1000);
}

function answerQuiz(chosen) {
  clearInterval(quizTimer);
  const q = quizData.questoes[quizIdx], correta = q.correta, ok = chosen===correta;
  const btns = document.querySelectorAll('#quiz-options .quiz-option');
  btns.forEach((b,i) => { b.style.pointerEvents='none'; if(i===correta) b.classList.add('correct'); if(i===chosen&&!ok) b.classList.add('wrong'); });
  if (ok) { quizScore++; addPoints(10); }
  setTimeout(() => { quizIdx++; quizTime = quizData.tempo||30; renderQuizQ(); }, 1500);
}

async function finishQuiz() {
  clearInterval(quizTimer);
  const total = quizData.questoes.length, pct = Math.round(quizScore/total*100);
  const pts = quizScore*10 + (pct>=90?50:pct>=70?30:0);
  const cur = (await db.ref('usuarios/'+U.uid+'/points').once('value')).val()||0;
  await db.ref('usuarios/'+U.uid).update({ points:cur+pts, quizzesPlayed:(UD.quizzesPlayed||0)+1 });
  UD.points = cur+pts; UD.quizzesPlayed = (UD.quizzesPlayed||0)+1;
  $('quiz-question').parentElement.style.display='none';
  $('quiz-options').style.display='none';
  $('quiz-result').style.display='';
  $('result-icon').textContent = pct>=90?'🏆':pct>=70?'🎉':pct>=50?'👍':'📚';
  $('result-title').textContent = pct>=90?'Excelente!':pct>=70?'Muito bom!':pct>=50?'Bom!':'Continue!';
  $('result-text').textContent = quizScore+'/'+total+' ('+pct+'%)';
  $('result-points').textContent = '+'+pts+' XP';
  updateUI();
}

function sairQuiz() { clearInterval(quizTimer); navigate('materia-detalhe'); }

// ═══════════════ RANKING ═══════════════
async function loadRanking() {
  const snap = await db.ref('usuarios').orderByChild('points').once('value');
  const arr = []; snap.forEach(c => arr.push(c.val()));
  arr.sort((a,b)=>(b.points||0)-(a.points||0));
  $('ranking-list').innerHTML = arr.slice(0,50).map((u,i) => {
    const medals = {0:'🥇',1:'🥈',2:'🥉'};
    return '<div class="rank-item'+(i<3?' '+(i===0?'gold':i===1?'silver':'bronze'):'')+'"><span class="rank-pos">'+(medals[i]||(i+1))+'</span><span class="rank-name">@'+esc(u.username||'?')+'</span><span class="rank-pts">'+fmt(u.points||0)+' pts</span></div>';
  }).join('');
}

// ═══════════════ DESAFIOS ═══════════════
async function loadDesafios() {
  const snap = await db.ref('desafios').once('value');
  const d = snap.val(); const now = Date.now();
  $('desafios-list').innerHTML = d ? Object.entries(d).reverse().map(([id,x]) => {
    const ativo = now>=x.inicio && now<=x.fim;
    return '<div class="card"><strong>⚔️ '+esc(x.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">🏆 +'+x.premio+' pts</span> '+(ativo?'<button class="btn btn-primary btn-sm" onclick="participarDesafio(\''+id+'\')">▶ Participar</button>':'<span class="badge badge-red">Encerrado</span>')+'</div>';
  }).join('') : '<div class="empty-state"><div class="empty-state-icon">⚔️</div><div class="empty-state-text">Nenhum desafio</div></div>';
}

async function participarDesafio(id) {
  const snap = await db.ref('desafios/'+id).once('value');
  const d = snap.val(); if (!d?.questoes) return;
  const qs = d.questoes.split('\n\n').filter(b=>b.trim()).map(b=>{ const l=b.trim().split('\n'); const r=l.find(x=>x.toUpperCase().startsWith('RESPOSTA:'))?.replace(/RESPOSTA:/i,'').trim()||''; const a=l.filter(x=>/^[a-dA-D]\)/.test(x)).map(x=>x.replace(/^[a-dA-D]\)\s*/,'')); return {p:l[0].replace(/^\d+[\.\)\-]\s*/,''),a,r}; });
  let s=0;
  for(let i=0;i<qs.length;i++) {
    const q=qs[i];
    const ans=prompt(q.p+'\n\n'+q.a.map((x,j)=>'ABCD'[j]+') '+x).join('\n')+'\n\nResposta (A/B/C/D):');
    if(ans&&ans.trim().toUpperCase()===q.r.toUpperCase()) s++;
  }
  const pct=Math.round(s/qs.length*100);
  const g=pct>=70?d.premio:Math.round(d.premio*(pct/100));
  if(g>0) { const cur=(await db.ref('usuarios/'+U.uid+'/points').once('value')).val()||0; await db.ref('usuarios/'+U.uid).update({points:cur+g}); UD.points=cur+g; }
  alert('🏆 Desafio concluído!\nAcertos: '+s+'/'+qs.length+' ('+pct+'%)\nPontos: +'+g);
  loadDesafios();
}

// ═══════════════ JARVIS ═══════════════
async function sendJarvis() {
  const msg = $('jarvis-input').value.trim(); if (!msg) return;
  $('jarvis-input').value = '';
  const div = $('jarvis-messages');
  div.innerHTML += '<div class="jarvis-msg user">'+esc(msg)+'</div>';
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY}, body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'system',content:'Você é o Jarvis, assistente de estudos. Responda em português de forma clara e educativa.'},{role:'user',content:msg}], max_tokens:500 }) });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || 'Não entendi 😅';
    div.innerHTML += '<div class="jarvis-msg bot">'+esc(reply)+'</div>';
  } catch(e) { div.innerHTML += '<div class="jarvis-msg bot">Erro técnico 😢</div>'; }
  div.scrollTop = div.scrollHeight;
}

// ═══════════════ PERFIL ═══════════════
async function loadPerfil() { updateUI();
  const snap = await db.ref('historico/'+U.uid).once('value');
  const h = snap.val(); const c = $('perfil-historico');
  c.innerHTML = h ? Object.entries(h).reverse().slice(0,10).map(([id,x]) => '<div class="card" style="display:flex;justify-content:space-between;"><span>🎮 '+esc(x.quizNome||'Quiz')+'</span><span style="color:var(--primary);font-weight:700;">+'+x.score+'</span></div>').join('') : '<p style="color:var(--text3);">Nenhuma atividade</p>';
}
function previewEpAvatar() {
  const file = $('ep-avatar-input').files[0]; if (!file) return;
  const r = new FileReader(); r.onload = e => { $('ep-avatar-preview').src=e.target.result; $('ep-avatar-preview-wrap').style.display=''; }; r.readAsDataURL(file);
}
async function salvarPerfil() {
  const n = $('ep-nome').value.trim(), b = $('ep-bio').value.trim();
  const file = $('ep-avatar-input').files[0];
  const upd = {}; if (n) upd.fullname = n; if (b) upd.bio = b;
  const salvar = async (url) => { if (url) upd.avatar = url; await db.ref('usuarios/'+U.uid).update(upd); Object.assign(UD, upd); closeModal('modal-editar-perfil'); updateUI(); toast('Perfil atualizado! ✅'); };
  if (file) { toast('⏳ Enviando foto...'); uploadImgBB(file, salvar); }
  else if (Object.keys(upd).length) salvar('');
  else closeModal('modal-editar-perfil');
}

// ═══════════════ AGENDA ═══════════════
async function loadAgenda() {
  const snap = await db.ref('agenda/'+U.uid).once('value');
  const a = snap.val(); const c = $('agenda-list');
  c.innerHTML = a ? Object.entries(a).reverse().map(([id,x]) => '<div class="evento-item"><div style="flex:1;"><strong>'+esc(x.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+x.data+' '+x.hora+' · '+x.disciplina+'</span></div><span class="badge badge-blue">'+x.tipo+'</span></div>').join('') : '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">Nenhum evento</div></div>';
}
async function adicionarEvento() {
  const t = $('ev-titulo').value.trim(), d = $('ev-data').value, h = $('ev-hora').value, tp = $('ev-tipo').value, disc = $('ev-disciplina').value.trim();
  if (!t||!d) return toast('Preencha título e data', 'error');
  await db.ref('agenda/'+U.uid).push({ titulo:t, data:d, hora:h, tipo:tp, disciplina:disc, concluido:false, createdAt:Date.now() });
  closeModal('modal-evento'); toast('Evento adicionado! 📅'); loadAgenda();
}

// ═══════════════ TAREFAS ═══════════════
async function loadTarefas() {
  const snap = await db.ref('tarefas/'+U.uid).once('value');
  const t = snap.val(); const c = $('tarefas-list');
  c.innerHTML = t ? Object.entries(t).reverse().map(([id,x]) => '<div class="tarefa-item" style="'+(x.concluido?'opacity:0.6;':'')+'"><input type="checkbox" '+(x.concluido?'checked':'')+' onchange="toggleTarefa(\''+id+'\',this.checked)" /><div style="flex:1;"><strong>'+esc(x.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+x.dataEntrega+' · '+x.prioridade+'</span></div></div>').join('') : '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhuma tarefa</div></div>';
}
async function adicionarTarefa() {
  const t = $('tar-titulo').value.trim(), p = $('tar-prioridade').value, d = $('tar-data').value;
  if (!t) return toast('Título obrigatório', 'error');
  await db.ref('tarefas/'+U.uid).push({ titulo:t, prioridade:p, dataEntrega:d, concluido:false, createdAt:Date.now() });
  closeModal('modal-tarefa'); toast('Tarefa adicionada! 📋'); loadTarefas();
}
async function toggleTarefa(id, checked) { await db.ref('tarefas/'+U.uid+'/'+id).update({ concluido:checked }); loadTarefas(); }

// ═══════════════ NOTIFICAÇÕES ═══════════════
function listenNotifs() {
  if (!U) return;
  db.ref('notificacoes/'+U.uid).on('value', snap => {
    let t=0; if (snap.exists()) snap.forEach(c => { if (!c.val().lida) t++; });
    const b = $('notif-badge'); if (b) { b.textContent = t>9?'9+':t; b.style.display = t>0?'flex':'none'; }
  });
}
async function loadNotificacoes() {
  const snap = await db.ref('notificacoes/'+U.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = snap.val(); const c = $('notificacoes-list');
  c.innerHTML = n ? Object.entries(n).reverse().map(([id,x]) => '<div class="card" style="cursor:pointer;'+(x.lida?'':'background:var(--primary-light);')+'" onclick="marcarLida(\''+id+'\')"><p>'+esc(x.mensagem)+'</p><span style="font-size:10px;color:var(--text3);">'+timeAgo(x.createdAt)+'</span></div>').join('') : '<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-text">Nenhuma notificação</div></div>';
}
async function marcarLida(id) { await db.ref('notificacoes/'+U.uid+'/'+id).update({lida:true}); loadNotificacoes(); }

// ═══════════════ BUSCA ═══════════════
async function doBusca(q) {
  const c = $('busca-results'); if (!c) return;
  if (!q||q.trim().length<2) { c.innerHTML=''; return; }
  const ql = q.toLowerCase();
  const [uSnap, mSnap] = await Promise.all([db.ref('usuarios').once('value'), db.ref('materias').once('value')]);
  const r = [];
  uSnap.forEach(x => { const u=x.val(); if ((u.username||'').toLowerCase().includes(ql)||(u.fullname||'').toLowerCase().includes(ql)) r.push({t:'user',d:u}); });
  mSnap.forEach(x => { const m=x.val(); if ((m.nome||'').toLowerCase().includes(ql)) r.push({t:'mat',d:m,id:x.key}); });
  c.innerHTML = r.length ? r.map(x => x.t==='user'?'<div class="card card-clickable" onclick="viewUser(\''+x.d.uid+'\')"><strong>@'+esc(x.d.username)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+fmt(x.d.points||0)+' pts</span></div>':'<div class="card card-clickable" onclick="openMateria(\''+x.id+'\')"><strong>📚 '+esc(x.d.nome)+'</strong></div>').join('') : '<p style="color:var(--text3);">Nenhum resultado</p>';
}
function viewUser(uid) { if (uid===U.uid) navigate('perfil'); else toast('Perfil: @'+uid); }

// ═══════════════ PDF ═══════════════
async function gerarQuestoesPDF() {
  const disc = $('pdf-disciplina').value.trim(), tit = $('pdf-titulo').value.trim();
  if (!disc&&!tit) return toast('Preencha título ou disciplina', 'error');
  const tema = tit||disc;
  toast('🤖 Gerando...');
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY}, body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:'Crie 10 questões sobre "'+tema+'" para uma lista de exercícios. Apenas as questões, uma por linha, sem numeração.'}], max_tokens:1500 }) });
    const d = await r.json();
    $('pdf-questoes').value = d.choices?.[0]?.message?.content || '';
    toast('✅ Questões geradas!');
  } catch(e) { toast('❌ Erro', 'error'); }
}
function previewPDF() {
  const tit = $('pdf-titulo').value.trim()||'Lista de Exercícios', disc = $('pdf-disciplina').value.trim(), prof = $('pdf-professor').value.trim()||(UD?UD.fullname:'');
  const qs = $('pdf-questoes').value.trim(); if (!qs) return toast('Digite ou gere questões', 'error');
  const arr = qs.split('\n').filter(q => q.trim().length>3);
  const html = '<div style="text-align:center;border-bottom:2px solid #10B981;padding-bottom:12px;margin-bottom:16px;"><h2 style="color:#10B981;">📚 Sexta-Feira Studies</h2><h3>'+esc(tit)+'</h3>'+(disc?'<p><strong>Disciplina:</strong> '+esc(disc)+'</p>':'')+(prof?'<p><strong>Professor:</strong> '+esc(prof)+'</p>':'')+'<p style="font-size:11px;color:#999;">'+new Date().toLocaleDateString('pt-BR')+'</p><p style="font-size:10px;">Aluno: ________________ | Data: ____/____/____ | Nota: _____</p></div>'+arr.map((q,i) => '<div style="margin-bottom:12px;"><strong>'+(i+1)+'.</strong> '+esc(q)+'<div style="border-bottom:1px dotted #ddd;margin-top:4px;">R: _____________________________________________</div></div>').join('')+'<div style="text-align:center;margin-top:20px;font-size:10px;color:#ccc;">Feito com ❤️ por Sexta-Feira Studies</div>';
  $('pdf-preview-card').style.display=''; $('pdf-preview-content').innerHTML = html;
  $('pdf-preview-card').scrollIntoView({behavior:'smooth'});
}
function baixarPDF() {
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{margin:1.5cm;size:A4;}body{font-family:Arial;padding:20px;line-height:1.8;font-size:13px;}</style></head><body>'+$('pdf-preview-content').innerHTML+'</body></html>';
  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tarefa.html'; a.click();
  toast('📥 Baixado! Abra e pressione Ctrl+P para salvar como PDF');
}

// ═══════════════ SOBRE / UPDATES ═══════════════
async function loadSobre() { const s = await db.ref('config/sobre').once('value'); $('sobre-content').innerHTML = s.val()?.texto || '<p style="text-align:center;">📚 Sexta-Feira Studies - Plataforma de estudos gamificada.</p>'; }
async function loadUpdates() {
  const s = await db.ref('config/updates').once('value'); const u = s.val();
  $('updates-list').innerHTML = u ? Object.entries(u).reverse().map(([id,x]) => '<div class="card"><span class="badge badge-green">v'+esc(x.versao)+'</span> <strong>'+esc(x.titulo)+'</strong><br><span style="font-size:11px;color:var(--text2);">'+esc(x.descricao||'')+'</span></div>').join('') : '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhum update</div></div>';
}

// ═══════════════ UTILS ═══════════════
async function addPoints(pts) { if (!U||pts<=0) return; const cur = (await db.ref('usuarios/'+U.uid+'/points').once('value')).val()||0; await db.ref('usuarios/'+U.uid).update({points:cur+pts}); UD.points = cur+pts; updateUI(); }
function uploadImgBB(file, cb) { const r = new FileReader(); r.onload = async e => { const fd = new FormData(); fd.append('key',IMGBB_KEY); fd.append('image',e.target.result.split(',')[1]); try { const res = await fetch('https://api.imgbb.com/1/upload',{method:'POST',body:fd}); const d = await res.json(); cb(d.data?d.data.url:''); } catch(ex) { cb(''); } }; r.readAsDataURL(file); }

// ═══════════════ HISTÓRICO DE NAVEGAÇÃO ═══════════════
let navHistory = [];

// Sobrescreve a função navigate para salvar histórico
const originalNavigate = navigate;
navigate = function(page) {
  if (navHistory.length === 0 || navHistory[navHistory.length - 1] !== page) {
    navHistory.push(page);
  }
  if (navHistory.length > 20) navHistory.shift();
  history.pushState({ page: page }, '', '#' + page);
  originalNavigate(page);
};

// Botão voltar do navegador
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    originalNavigate(e.state.page);
  } else {
    originalNavigate('home');
  }
});

// Inicia com a URL atual
if (window.location.hash) {
  const page = window.location.hash.substring(1);
  setTimeout(function() { originalNavigate(page); }, 500);
}

console.log('✅ Sexta-Feira Studies PRONTO!');
console.log('📚 Disciplinas | 🎮 Quizzes | 🏆 Ranking | ⚔️ Desafios | 🤖 Jarvis IA');
