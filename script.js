// ═══════════════════════════════════════════════════════════
//  SEXTA-FEIRA STUDIES — script.js
// ═══════════════════════════════════════════════════════════

// ── FIREBASE CONFIG ─────────────────────────────────────────
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

// ── KEYS ─────────────────────────────────────────────────────
const GROQ_KEY = "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";
const GEMINI_KEY = "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY";
const IMGBB_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

// ── STATE ─────────────────────────────────────────────────────
var currentUser = null;
var currentUserData = null;
var currentScreen = 'home';
var currentMateriaId = null;
var currentAulaId = null;
var currentPostId = null;
var currentModalUserId = null;
var quizQuestoes = [];
var quizCurrentQ = 0;
var quizScore = 0;
var quizTimer = null;
var quizData = null;
var jarvisHistory = [];
var jarvisImageBase64 = null;
var jarvisImageMime = null;
var desafioPlayId = null;
var desafioQIdx = 0;
var desafioScore = 0;

// ═══════════════════════ INIT ════════════════════════════════
auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    db.ref('usuarios/' + user.uid).once('value').then(function(snap) {
      if (snap.exists()) {
        currentUserData = snap.val();
        initApp();
      } else {
        // Google login: save user
        var ud = {
          uid: user.uid,
          fullname: user.displayName || 'Usuário',
          username: user.email.split('@')[0],
          email: user.email,
          avatar: user.photoURL || '',
          bio: '',
          points: 0,
          plano: 'free',
          adminLevel: 0,
          isProf: false,
          isQuizzer: false,
          createdAt: Date.now()
        };
        db.ref('usuarios/' + user.uid).set(ud).then(function() {
          currentUserData = ud;
          initApp();
        });
      }
    });
  } else {
    currentUser = null;
    currentUserData = null;
    showScreen('login');
  }
});

function initApp() {
  updateNavAvatar();
  showScreen('app');
  navigate('home');
  listenNotificacoes();
}

// ═══════════════════════ SCREENS ═════════════════════════════
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('screen-' + name).classList.add('active');
}

function goAdm() { showScreen('adm'); }

// ═══════════════════════ NAV ═════════════════════════════════
function navigate(page) {
  currentScreen = page;
  // hide all content panes
  document.querySelectorAll('[id^="content-"]').forEach(function(el){ el.style.display = 'none'; });
  // hide jarvis pane
  var jv = document.getElementById('content-jarvis');
  if (jv) jv.style.display = 'none';
  // update bottom nav
  document.querySelectorAll('.bnav-item').forEach(function(b){ b.classList.remove('active'); });
  var bnMap = {home:'bn-home',disciplinas:'bn-disciplinas',desafios:'bn-desafios',ranking:'bn-ranking',jarvis:'bn-jarvis'};
  if (bnMap[page]) document.getElementById(bnMap[page]).classList.add('active');

  if (page === 'jarvis') {
    document.getElementById('content-jarvis').style.display = 'flex';
    if (jarvisHistory.length === 0) addJarvisMsg('bot', '👋 Oi! Sou o Jarvis, seu assistente de estudos. Como posso te ajudar hoje?');
    return;
  }
  var el = document.getElementById('content-' + page);
  if (!el) return;
  el.style.display = 'block';
  // render
  var fn = {
    home: renderHome,
    disciplinas: renderDisciplinas,
    ranking: renderRanking,
    desafios: renderDesafios,
    busca: renderBusca,
    notificacoes: renderNotificacoes,
    perfil: function(){ renderPerfil(currentUser.uid); },
    sobre: renderSobre,
    updates: renderUpdates
  };
  if (fn[page]) fn[page]();
}

// ═══════════════════════ LOGIN ═══════════════════════════════
function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(function(t, i) {
    t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='cadastro'));
  });
  document.getElementById('form-login').style.display = tab==='login' ? 'block' : 'none';
  document.getElementById('form-cadastro').style.display = tab==='cadastro' ? 'block' : 'none';
}

function doLogin() {
  var username = document.getElementById('l-username').value.trim().replace('@','');
  var password = document.getElementById('l-password').value;
  if (!username || !password) return showToast('Preencha todos os campos');
  // busca email pelo username
  db.ref('usuarios').orderByChild('username').equalTo(username).once('value').then(function(snap) {
    if (!snap.exists()) return showToast('Usuário não encontrado');
    var ud = Object.values(snap.val())[0];
    auth.signInWithEmailAndPassword(ud.email, password).catch(function(e) {
      showToast('Senha incorreta');
    });
  });
}

function doCadastro() {
  var name = document.getElementById('c-name').value.trim();
  var username = document.getElementById('c-username').value.trim().replace('@','').toLowerCase();
  var email = document.getElementById('c-email').value.trim();
  var password = document.getElementById('c-password').value;
  if (!name || !username || !email || !password) return showToast('Preencha todos os campos');
  if (password.length < 6) return showToast('Senha deve ter no mínimo 6 caracteres');
  // verifica username unico
  db.ref('usuarios').orderByChild('username').equalTo(username).once('value').then(function(snap) {
    if (snap.exists()) return showToast('@' + username + ' já está em uso');
    auth.createUserWithEmailAndPassword(email, password).then(function(cred) {
      var ud = {
        uid: cred.user.uid, fullname: name, username: username, email: email,
        password: password, avatar: '', bio: '', points: 0, plano: 'free',
        adminLevel: 0, isProf: false, isQuizzer: false, createdAt: Date.now()
      };
      return db.ref('usuarios/' + cred.user.uid).set(ud);
    }).catch(function(e){ showToast(e.message); });
  });
}

function loginGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(e){ showToast(e.message); });
}

function doLogout() {
  auth.signOut();
}

// ═══════════════════════ HOME ════════════════════════════════
function renderHome() {
  var el = document.getElementById('content-home');
  var hora = new Date().getHours();
  var sauda = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  el.innerHTML = '<h2 style="margin-bottom:16px;font-size:20px;">' + sauda + ', ' + (currentUserData.fullname.split(' ')[0]) + '! 👋</h2>' +
    '<div class="stat-row">' +
    '<div class="stat-card"><div class="stat-val" id="home-pts">' + (currentUserData.points||0) + '</div><div class="stat-label">Pontos</div></div>' +
    '<div class="stat-card"><div class="stat-val" id="home-rank">—</div><div class="stat-label">Ranking</div></div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
    '<h3>Feed</h3><button class="btn btn-primary btn-sm" onclick="openModal(\'modal-post\')"><i class="fas fa-plus"></i> Post</button></div>' +
    '<div id="home-feed"><div class="loading"><div class="spinner"></div></div></div>' +
    '<footer style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Feito com ❤️ por Sexta-Feira Studies</footer>';
  // calc ranking
  db.ref('usuarios').orderByChild('points').once('value').then(function(snap) {
    var list = [];
    snap.forEach(function(c){ list.push(c.val()); });
    list.sort(function(a,b){ return (b.points||0)-(a.points||0); });
    var pos = list.findIndex(function(u){ return u.uid === currentUser.uid; }) + 1;
    document.getElementById('home-rank') && (document.getElementById('home-rank').textContent = '#'+pos);
  });
  loadFeed();
}

function loadFeed() {
  var el = document.getElementById('home-feed');
  if (!el) return;
  db.ref('posts').orderByChild('createdAt').limitToLast(20).once('value').then(function(snap) {
    var posts = [];
    snap.forEach(function(c){ var p = c.val(); p.id = c.key; posts.push(p); });
    posts.reverse();
    if (!posts.length) { el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px;">Nenhum post ainda. Seja o primeiro!</p>'; return; }
    el.innerHTML = posts.map(renderPostCard).join('');
    // register views
    posts.forEach(function(p){
      if (!p.views || !p.views[currentUser.uid]) {
        db.ref('posts/' + p.id + '/views/' + currentUser.uid).set(true);
      }
    });
  });
}

function renderPostCard(p) {
  var liked = p.likes && p.likes[currentUser.uid];
  var likes = p.likes ? Object.keys(p.likes).length : 0;
  var views = p.views ? Object.keys(p.views).length : 0;
  var img = p.imagem ? '<img src="'+p.imagem+'" class="post-img"/>' : '';
  var time = timeAgo(p.createdAt);
  return '<div class="post-card">' +
    '<div class="post-header">' +
    '<img class="post-avatar" src="' + (p.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(p.autorNome||'U')+'&background=10B981&color=fff') + '" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>' +
    '<div class="post-meta"><div class="post-author" style="cursor:pointer" onclick="viewUserPerfil(\''+p.autorId+'\')">'+htmlEsc(p.autorNome||'Anônimo')+'</div><div class="post-time">'+time+'</div></div></div>' +
    (p.texto ? '<div class="post-body"><p>'+htmlEsc(p.texto)+'</p></div>' : '') +
    img +
    '<div class="post-actions">' +
    '<button class="post-action-btn '+(liked?'liked':'')+'" onclick="toggleLike(\''+p.id+'\')">' +
    '<i class="fas fa-heart"></i> '+likes+'</button>' +
    '<button class="post-action-btn" onclick="abrirComentarios(\''+p.id+'\')"><i class="fas fa-comment"></i></button>' +
    '<span style="margin-left:auto;color:var(--muted);font-size:12px;"><i class="fas fa-eye"></i> '+views+'</span>' +
    '</div></div>';
}

// ═══════════════════════ DISCIPLINAS ═════════════════════════
function renderDisciplinas() {
  var el = document.getElementById('content-disciplinas');
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
    '<h2>Disciplinas</h2><button class="btn btn-primary btn-sm" onclick="openModal(\'modal-disciplina\')"><i class="fas fa-plus"></i> Nova</button></div>' +
    '<div class="materia-grid" id="materias-list"><div class="loading"><div class="spinner"></div></div></div>';
  db.ref('materias').once('value').then(function(snap) {
    var list = el.querySelector('#materias-list');
    if (!snap.exists()) { list.innerHTML = '<p style="color:var(--muted);padding:20px;">Nenhuma disciplina ainda.</p>'; return; }
    var html = '';
    snap.forEach(function(c) {
      var m = c.val(); m.id = c.key;
      html += '<div class="materia-card" onclick="abrirMateria(\''+m.id+'\')">' +
        '<div class="materia-icon">'+(m.icone||'📚')+'</div>' +
        '<div class="materia-name">'+htmlEsc(m.nome)+'</div>' +
        '<div class="materia-desc">'+htmlEsc(m.descricao||'')+'</div>' +
        '<div style="margin-top:8px;font-size:12px;color:var(--muted)">por '+htmlEsc(m.autorNome||'')+'</div></div>';
    });
    list.innerHTML = html;
  });
}

function criarDisciplina() {
  var icone = document.getElementById('disc-icon').value.trim() || '📚';
  var nome = document.getElementById('disc-nome').value.trim();
  var desc = document.getElementById('disc-desc').value.trim();
  if (!nome) return showToast('Informe o nome');
  var ref = db.ref('materias').push();
  ref.set({ id: ref.key, nome: nome, descricao: desc, icone: icone, autorId: currentUser.uid, autorNome: currentUserData.fullname, createdAt: Date.now() })
    .then(function() { closeModal('modal-disciplina'); showToast('Disciplina criada!'); renderDisciplinas(); addPoints(10); });
}

// ═══════════════════════ MATERIA (detalhe) ════════════════════
function abrirMateria(id) {
  currentMateriaId = id;
  navigate('materia');
  var el = document.getElementById('content-materia');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  db.ref('materias/' + id).once('value').then(function(snap) {
    var m = snap.val();
    el.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
      '<button onclick="navigate(\'disciplinas\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;"><i class="fas fa-arrow-left"></i></button>' +
      '<span style="font-size:24px;">'+(m.icone||'📚')+'</span>' +
      '<h2 style="font-size:18px;">'+htmlEsc(m.nome)+'</h2></div>' +
      '<p style="color:var(--muted);margin-bottom:20px;">'+htmlEsc(m.descricao||'')+'</p>' +
      '<div class="tabs" id="materia-tabs">' +
      '<div class="tab active" onclick="materiaTab(\'aulas\')">Aulas</div>' +
      '<div class="tab" onclick="materiaTab(\'quizzes\')">Quizzes</div></div>' +
      '<div id="materia-tab-content"></div>';
    materiaTab('aulas');
  });
}

function materiaTab(tab) {
  document.querySelectorAll('#materia-tabs .tab').forEach(function(t,i){
    t.classList.toggle('active',(tab==='aulas'&&i===0)||(tab==='quizzes'&&i===1));
  });
  var el = document.getElementById('materia-tab-content');
  if (tab === 'aulas') {
    el.innerHTML = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
      '<button class="btn btn-primary btn-sm" onclick="openModal(\'modal-aula\')"><i class="fas fa-plus"></i> Aula</button></div>' +
      '<div id="aulas-list"><div class="loading"><div class="spinner"></div></div></div>';
    db.ref('aulas/' + currentMateriaId).once('value').then(function(snap) {
      var list = document.getElementById('aulas-list');
      if (!snap.exists()) { list.innerHTML = '<p style="color:var(--muted);">Nenhuma aula ainda.</p>'; return; }
      var html = '';
      snap.forEach(function(c) {
        var a = c.val(); a.id = c.key;
        html += '<div class="aula-card" onclick="abrirAula(\''+a.id+'\')">' +
          '<div style="font-weight:700;margin-bottom:4px;">'+htmlEsc(a.titulo)+'</div>' +
          '<div style="font-size:12px;color:var(--muted)">por '+htmlEsc(a.autorNome||'')+' • '+timeAgo(a.createdAt)+'</div>' +
          (a.verificado ? '<span style="color:var(--green);font-size:12px;"><i class="fas fa-check-circle"></i> Verificado</span>' : '') +
          '</div>';
      });
      list.innerHTML = html;
    });
  } else {
    el.innerHTML = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
      '<button class="btn btn-primary btn-sm" onclick="openModal(\'modal-quiz\');initQuizForm()"><i class="fas fa-plus"></i> Quiz</button></div>' +
      '<div id="quizzes-list"><div class="loading"><div class="spinner"></div></div></div>';
    db.ref('quizzes/' + currentMateriaId).once('value').then(function(snap) {
      var list = document.getElementById('quizzes-list');
      if (!snap.exists()) { list.innerHTML = '<p style="color:var(--muted);">Nenhum quiz ainda.</p>'; return; }
      var html = '';
      snap.forEach(function(c) {
        var q = c.val(); q.id = c.key;
        html += '<div class="quiz-card"><div style="font-weight:700;margin-bottom:4px;">'+htmlEsc(q.nome)+'</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">'+(q.questoes?q.questoes.length:0)+' questões • '+q.tempo+'s por pergunta</div>' +
          '<button class="btn btn-primary btn-sm" onclick="iniciarQuiz(\''+q.id+'\')"><i class="fas fa-play"></i> Jogar</button></div>';
      });
      list.innerHTML = html;
    });
  }
}

function criarAula() {
  var titulo = document.getElementById('aula-titulo').value.trim();
  var conteudo = document.getElementById('aula-conteudo').value.trim();
  if (!titulo || !conteudo) return showToast('Preencha todos os campos');
  var ref = db.ref('aulas/' + currentMateriaId).push();
  ref.set({ id: ref.key, titulo: titulo, conteudo: conteudo, autorId: currentUser.uid, autorNome: currentUserData.fullname, verificado: false, createdAt: Date.now() })
    .then(function() { closeModal('modal-aula'); showToast('Aula criada!'); addPoints(15); materiaTab('aulas'); });
}

function abrirAula(id) {
  currentAulaId = id;
  navigate('aula');
  var el = document.getElementById('content-aula');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  db.ref('aulas/' + currentMateriaId + '/' + id).once('value').then(function(snap) {
    var a = snap.val();
    el.innerHTML = '<button onclick="navigate(\'materia\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;margin-bottom:16px;"><i class="fas fa-arrow-left"></i> Voltar</button>' +
      '<h2 style="margin-bottom:8px;">'+htmlEsc(a.titulo)+'</h2>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:20px;">por '+htmlEsc(a.autorNome||'')+' • '+timeAgo(a.createdAt)+'</div>' +
      '<div style="line-height:1.7;white-space:pre-wrap;margin-bottom:24px;">'+htmlEsc(a.conteudo)+'</div>' +
      '<h3 style="margin-bottom:12px;">Comentários</h3><div id="aula-comentarios"><div class="loading"><div class="spinner"></div></div></div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<textarea class="input" id="aula-comment-input" rows="2" placeholder="Seu comentário..." style="flex:1;"></textarea>' +
      '<button class="btn btn-primary" onclick="enviarComentarioAula()"><i class="fas fa-paper-plane"></i></button></div>';
    carregarComentariosAula(id);
    addPoints(5);
  });
}

function carregarComentariosAula(id) {
  db.ref('aulas/' + currentMateriaId + '/' + id + '/comentarios').once('value').then(function(snap) {
    var el = document.getElementById('aula-comentarios');
    if (!el) return;
    if (!snap.exists()) { el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Sem comentários ainda.</p>'; return; }
    var html = '';
    snap.forEach(function(c) {
      var cm = c.val();
      html += '<div class="comment-item">' +
        '<img class="comment-avatar" src="'+(cm.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(cm.autorNome||'U'))+'" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>' +
        '<div class="comment-bubble"><div class="comment-author">'+htmlEsc(cm.autorNome||'')+'</div><div class="comment-text">'+htmlEsc(cm.texto)+'</div></div></div>';
    });
    el.innerHTML = html;
  });
}

function enviarComentarioAula() {
  var txt = document.getElementById('aula-comment-input').value.trim();
  if (!txt) return;
  var ref = db.ref('aulas/' + currentMateriaId + '/' + currentAulaId + '/comentarios').push();
  ref.set({ autorId: currentUser.uid, autorNome: currentUserData.fullname, avatar: currentUserData.avatar||'', texto: txt, createdAt: Date.now() })
    .then(function() { document.getElementById('aula-comment-input').value=''; carregarComentariosAula(currentAulaId); addPoints(2); });
}

// ═══════════════════════ QUIZ ════════════════════════════════
function initQuizForm() {
  quizQuestoes = [];
  document.getElementById('quiz-questoes-wrap').innerHTML = '';
  document.getElementById('quiz-nome').value = '';
  document.getElementById('quiz-tempo').value = '30';
  addQuestaoQuiz();
}

function addQuestaoQuiz() {
  quizQuestoes.push({pergunta:'',alternativas:['','','',''],correta:0});
  renderQuizQuestoes();
}

function renderQuizQuestoes() {
  var wrap = document.getElementById('quiz-questoes-wrap');
  var html = '';
  quizQuestoes.forEach(function(q, qi) {
    html += '<div style="background:var(--card2);border-radius:8px;padding:12px;margin-bottom:10px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<strong style="font-size:13px;">Questão '+(qi+1)+'</strong>' +
      (quizQuestoes.length>1?'<button class="btn btn-danger btn-sm" onclick="removeQuestao('+qi+')"><i class="fas fa-trash"></i></button>':'') +
      '</div>' +
      '<input class="input" style="margin-bottom:8px;" placeholder="Pergunta" value="'+htmlEsc(q.pergunta)+'" oninput="quizQuestoes['+qi+'].pergunta=this.value"/>';
    ['A','B','C','D'].forEach(function(letra, ai) {
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<input type="radio" name="correta-'+qi+'" '+(q.correta===ai?'checked':'')+' onchange="quizQuestoes['+qi+'].correta='+ai+'" style="accent-color:var(--green);"/>' +
        '<input class="input" placeholder="'+letra+')" value="'+htmlEsc(q.alternativas[ai]||'')+'" oninput="quizQuestoes['+qi+'].alternativas['+ai+']=this.value" style="flex:1;"/></div>';
    });
    html += '</div>';
  });
  wrap.innerHTML = html;
}

function removeQuestao(idx) {
  quizQuestoes.splice(idx,1);
  renderQuizQuestoes();
}

function criarQuiz() {
  var nome = document.getElementById('quiz-nome').value.trim();
  var tempo = parseInt(document.getElementById('quiz-tempo').value)||30;
  if (!nome) return showToast('Informe o nome do quiz');
  if (!quizQuestoes.length) return showToast('Adicione pelo menos 1 questão');
  for (var q of quizQuestoes) {
    if (!q.pergunta) return showToast('Preencha todas as perguntas');
    if (q.alternativas.some(function(a){return !a;})) return showToast('Preencha todas as alternativas');
  }
  var ref = db.ref('quizzes/' + currentMateriaId).push();
  ref.set({ id: ref.key, nome: nome, tempo: tempo, questoes: quizQuestoes, autorId: currentUser.uid, createdAt: Date.now() })
    .then(function(){ closeModal('modal-quiz'); showToast('Quiz criado!'); addPoints(20); materiaTab('quizzes'); });
}

function iniciarQuiz(id) {
  db.ref('quizzes/' + currentMateriaId + '/' + id).once('value').then(function(snap) {
    quizData = snap.val();
    quizCurrentQ = 0;
    quizScore = 0;
    navigate('quiz-play');
    renderQuizQuestion();
  });
}

function renderQuizQuestion() {
  var el = document.getElementById('content-quiz-play');
  if (quizCurrentQ >= quizData.questoes.length) {
    // resultado
    var pts = quizScore * 10;
    el.innerHTML = '<div style="text-align:center;padding:40px 16px;">' +
      '<div style="font-size:64px;margin-bottom:16px;">'+(quizScore===quizData.questoes.length?'🏆':quizScore>quizData.questoes.length/2?'😊':'😞')+'</div>' +
      '<h2 style="margin-bottom:8px;">Quiz Finalizado!</h2>' +
      '<p style="color:var(--muted);margin-bottom:16px;">Você acertou '+quizScore+' de '+quizData.questoes.length+' questões</p>' +
      '<div style="font-size:24px;font-weight:800;color:var(--green);margin-bottom:24px;">+'+pts+' pontos</div>' +
      '<button class="btn btn-primary" onclick="navigate(\'materia\')">Voltar</button></div>';
    addPoints(pts);
    return;
  }
  var q = quizData.questoes[quizCurrentQ];
  var tempo = quizData.tempo || 30;
  var timeLeft = tempo;
  el.innerHTML = '<div style="padding:0 0 80px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
    '<span style="color:var(--muted);font-size:13px;">Questão '+(quizCurrentQ+1)+'/'+quizData.questoes.length+'</span>' +
    '<span id="quiz-timer-text" style="font-weight:700;color:var(--green);">'+tempo+'s</span></div>' +
    '<div class="timer-bar"><div class="timer-fill" id="quiz-timer-fill" style="width:100%"></div></div>' +
    '<h3 style="margin-bottom:20px;line-height:1.5;">'+htmlEsc(q.pergunta)+'</h3>' +
    '<div id="quiz-options">' +
    q.alternativas.map(function(alt,i){
      return '<button class="quiz-option" onclick="responderQuiz('+i+','+q.correta+')" id="qopt-'+i+'">'+['A','B','C','D'][i]+') '+htmlEsc(alt)+'</button>';
    }).join('') + '</div></div>';
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(function() {
    timeLeft--;
    var pct = (timeLeft/tempo)*100;
    var fill = document.getElementById('quiz-timer-fill');
    var txt = document.getElementById('quiz-timer-text');
    if (fill) fill.style.width = pct+'%';
    if (txt) txt.textContent = timeLeft+'s';
    if (fill) fill.style.background = timeLeft<=10?'var(--red)':'var(--green)';
    if (timeLeft<=0) {
      clearInterval(quizTimer);
      responderQuiz(-1, q.correta);
    }
  }, 1000);
}

function responderQuiz(selected, correta) {
  if (quizTimer) clearInterval(quizTimer);
  document.querySelectorAll('.quiz-option').forEach(function(b){ b.onclick=null; });
  var corrBtn = document.getElementById('qopt-'+correta);
  if (corrBtn) corrBtn.classList.add('correct');
  if (selected !== correta && selected !== -1) {
    var wrongBtn = document.getElementById('qopt-'+selected);
    if (wrongBtn) wrongBtn.classList.add('wrong');
  }
  if (selected === correta) quizScore++;
  setTimeout(function(){ quizCurrentQ++; renderQuizQuestion(); }, 1200);
}

// ═══════════════════════ RANKING ════════════════════════════
function renderRanking() {
  var el = document.getElementById('content-ranking');
  el.innerHTML = '<h2 style="margin-bottom:16px;">🏆 Ranking</h2><div id="ranking-list"><div class="loading"><div class="spinner"></div></div></div>';
  db.ref('usuarios').orderByChild('points').limitToLast(50).once('value').then(function(snap) {
    var list = [];
    snap.forEach(function(c){ list.push(c.val()); });
    list.sort(function(a,b){ return (b.points||0)-(a.points||0); });
    var html = '';
    list.forEach(function(u, i) {
      var medals = ['🥇','🥈','🥉'];
      var pos = medals[i] || (i+1);
      var isSelf = u.uid === currentUser.uid;
      html += '<div class="rank-item" style="'+(isSelf?'border-color:var(--green);':'')+'">' +
        '<div class="rank-pos">'+pos+'</div>' +
        '<img class="rank-avatar" src="'+(u.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(u.fullname||'U'))+'" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>' +
        '<div class="rank-info"><div class="rank-name">'+htmlEsc(u.fullname||'')+(isSelf?' <span style="color:var(--green);font-size:11px;">(você)</span>':'')+'</div>' +
        '<div style="font-size:12px;color:var(--muted)">@'+htmlEsc(u.username||'')+'</div></div>' +
        '<div class="rank-pts">'+((u.points||0).toLocaleString())+' pts</div></div>';
    });
    document.getElementById('ranking-list').innerHTML = html || '<p style="color:var(--muted);">Sem dados.</p>';
  });
}

// ═══════════════════════ DESAFIOS ════════════════════════════
function renderDesafios() {
  var el = document.getElementById('content-desafios');
  el.innerHTML = '<h2 style="margin-bottom:16px;">⚔️ Desafios</h2><div id="desafios-list"><div class="loading"><div class="spinner"></div></div></div>';
  db.ref('desafios').once('value').then(function(snap) {
    var list = document.getElementById('desafios-list');
    if (!snap.exists()) { list.innerHTML = '<p style="color:var(--muted);">Nenhum desafio ativo.</p>'; return; }
    var html = '';
    var now = Date.now();
    snap.forEach(function(c) {
      var d = c.val(); d.id = c.key;
      var ativo = d.inicio <= now && d.fim >= now;
      html += '<div class="desafio-card">' +
        (d.banner ? '<img src="'+d.banner+'" class="desafio-banner" onerror="this.style.display=\'none\'"/>' : '') +
        '<div class="desafio-body">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<h3 style="font-size:15px;margin-bottom:4px;">'+htmlEsc(d.titulo)+'</h3>' +
        '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:'+(ativo?'var(--green)':'var(--border)')+';color:#fff;">'+(ativo?'Ativo':'Encerrado')+'</span></div>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:8px;">'+htmlEsc(d.descricao||'')+'</p>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">🏆 Prêmio: <strong>'+d.premio+' pts</strong> • Questões: '+(d.questoes?d.questoes.length:0)+'</div>' +
        (ativo ? '<button class="btn btn-primary btn-sm" onclick="participarDesafio(\''+d.id+'\')">Participar</button>' : '') +
        '</div></div>';
    });
    list.innerHTML = html;
  });
}

function participarDesafio(id) {
  db.ref('desafios/' + id).once('value').then(function(snap) {
    var d = snap.val(); d.id = snap.key;
    desafioPlayId = id;
    desafioQIdx = 0;
    desafioScore = 0;
    document.getElementById('desafio-play-titulo').textContent = d.titulo;
    openModal('modal-desafio-play');
    renderDesafioQ(d);
  });
}

function renderDesafioQ(d) {
  var body = document.getElementById('desafio-play-body');
  if (desafioQIdx >= d.questoes.length) {
    var pts = desafioScore * Math.floor(d.premio/d.questoes.length);
    body.innerHTML = '<div style="text-align:center;padding:24px;">' +
      '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
      '<h3>Desafio Concluído!</h3>' +
      '<p style="color:var(--muted);margin:8px 0;">Acertou '+desafioScore+'/'+d.questoes.length+'</p>' +
      '<div style="font-size:22px;font-weight:800;color:var(--green);margin-bottom:16px;">+'+pts+' pontos</div>' +
      '<button class="btn btn-primary" onclick="closeModal(\'modal-desafio-play\')">Fechar</button></div>';
    addPoints(pts);
    // notif
    enviarNotif(currentUser.uid, 'Você completou o desafio "'+d.titulo+'" e ganhou '+pts+' pts!', 'desafio');
    return;
  }
  var q = d.questoes[desafioQIdx];
  body.innerHTML = '<p style="color:var(--muted);font-size:12px;margin-bottom:12px;">Questão '+(desafioQIdx+1)+'/'+d.questoes.length+'</p>' +
    '<h4 style="margin-bottom:16px;line-height:1.5;">'+htmlEsc(q.pergunta)+'</h4>' +
    q.alternativas.map(function(alt,i){
      return '<button class="quiz-option" onclick="responderDesafioQ('+i+','+q.correta+','+JSON.stringify(d).split('"').join('\\"').length+');" data-d="'+desafioPlayId+'">'+['A','B','C','D'][i]+') '+htmlEsc(alt)+'</button>';
    }).join('');
  // override onclick correctly
  document.querySelectorAll('#desafio-play-body .quiz-option').forEach(function(btn, i) {
    btn.onclick = function() { responderDesafioQ(i, q.correta, d); };
  });
}

function responderDesafioQ(sel, correta, d) {
  document.querySelectorAll('#desafio-play-body .quiz-option').forEach(function(b){ b.onclick=null; });
  if (sel===correta) { desafioScore++; document.querySelectorAll('#desafio-play-body .quiz-option')[sel].classList.add('correct'); }
  else {
    if (document.querySelectorAll('#desafio-play-body .quiz-option')[sel]) document.querySelectorAll('#desafio-play-body .quiz-option')[sel].classList.add('wrong');
    if (document.querySelectorAll('#desafio-play-body .quiz-option')[correta]) document.querySelectorAll('#desafio-play-body .quiz-option')[correta].classList.add('correct');
  }
  setTimeout(function(){ desafioQIdx++; renderDesafioQ(d); }, 1000);
}

// ═══════════════════════ FEED / POSTS ═══════════════════════
function criarPost() {
  var texto = document.getElementById('post-texto').value.trim();
  var file = document.getElementById('post-img-input').files[0];
  if (!texto && !file) return showToast('Escreva algo ou adicione uma imagem');
  var doSave = function(imgUrl) {
    var ref = db.ref('posts').push();
    ref.set({
      id: ref.key, texto: texto, tipo: 'normal', autorId: currentUser.uid,
      autorNome: currentUserData.fullname, avatar: currentUserData.avatar||'',
      imagem: imgUrl||'', likes:{}, views:{}, createdAt: Date.now()
    }).then(function(){
      closeModal('modal-post');
      document.getElementById('post-texto').value='';
      document.getElementById('post-img-input').value='';
      document.getElementById('post-img-preview').style.display='none';
      showToast('Post publicado!'); addPoints(5); loadFeed();
    });
  };
  if (file) { uploadImgBB(file, doSave); } else { doSave(''); }
}

function toggleLike(postId) {
  var ref = db.ref('posts/' + postId + '/likes/' + currentUser.uid);
  ref.once('value').then(function(snap) {
    if (snap.exists()) { ref.remove(); } else { ref.set(true); addPoints(1); }
    loadFeed();
  });
}

function abrirComentarios(postId) {
  currentPostId = postId;
  openModal('modal-comentarios');
  carregarComentariosPost(postId);
}

function carregarComentariosPost(postId) {
  var body = document.getElementById('modal-comentarios-body');
  body.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  db.ref('posts/' + postId + '/comentarios').once('value').then(function(snap) {
    if (!snap.exists()) { body.innerHTML = '<p style="color:var(--muted);padding:16px;text-align:center;">Nenhum comentário ainda.</p>'; return; }
    var html = '';
    snap.forEach(function(c) {
      var cm = c.val();
      html += '<div class="comment-item" style="padding:12px 0;border-bottom:1px solid var(--border);">' +
        '<img class="comment-avatar" src="'+(cm.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(cm.autorNome||'U'))+'" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>' +
        '<div class="comment-bubble"><div class="comment-author">'+htmlEsc(cm.autorNome||'')+'</div><div class="comment-text">'+htmlEsc(cm.texto)+'</div></div></div>';
    });
    body.innerHTML = html;
  });
}

function enviarComentario() {
  var txt = document.getElementById('comentario-input').value.trim();
  if (!txt) return;
  var ref = db.ref('posts/' + currentPostId + '/comentarios').push();
  ref.set({ autorId: currentUser.uid, autorNome: currentUserData.fullname, avatar: currentUserData.avatar||'', texto: txt, createdAt: Date.now() })
    .then(function(){ document.getElementById('comentario-input').value=''; carregarComentariosPost(currentPostId); addPoints(2); });
}

// ═══════════════════════ JARVIS IA ═══════════════════════════
function addJarvisMsg(role, text) {
  var el = document.getElementById('jarvis-messages');
  var div = document.createElement('div');
  div.className = 'msg-bubble msg-' + (role==='user'?'user':'bot');
  div.textContent = text;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function jarvisImageSelected(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var b64 = e.target.result.split(',')[1];
    jarvisImageBase64 = b64;
    jarvisImageMime = file.type;
    showToast('Imagem carregada! Envie sua pergunta.');
  };
  reader.readAsDataURL(file);
}

function sendJarvis() {
  var inp = document.getElementById('jarvis-input');
  var txt = inp.value.trim();
  if (!txt && !jarvisImageBase64) return;
  inp.value = '';
  addJarvisMsg('user', txt || '(imagem enviada)');
  // typing indicator
  var el = document.getElementById('jarvis-messages');
  var typing = document.createElement('div');
  typing.className = 'msg-bubble msg-bot';
  typing.id = 'jarvis-typing';
  typing.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Pensando...';
  el.appendChild(typing);
  el.scrollTop = el.scrollHeight;

  if (jarvisImageBase64) {
    // Gemini vision
    var imgB64 = jarvisImageBase64;
    var imgMime = jarvisImageMime;
    jarvisImageBase64 = null; jarvisImageMime = null;
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='+GEMINI_KEY, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[
        {inline_data:{mime_type:imgMime,data:imgB64}},
        {text: txt||'Descreva esta imagem e ajude-me a estudar com ela.'}
      ]}]})
    }).then(function(r){return r.json();}).then(function(d){
      var text = d.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui analisar a imagem.';
      document.getElementById('jarvis-typing')?.remove();
      addJarvisMsg('bot', text);
    }).catch(function(){ document.getElementById('jarvis-typing')?.remove(); addJarvisMsg('bot','Erro ao processar imagem.'); });
  } else {
    // Groq
    jarvisHistory.push({role:'user',content:txt});
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
      body: JSON.stringify({
        model:'llama-3.1-8b-instant',
        messages:[{role:'system',content:'Você é o Jarvis, assistente de estudos da plataforma Sexta-Feira Studies. Responda em português de forma clara, educativa e motivadora.'},...jarvisHistory],
        max_tokens:1024
      })
    }).then(function(r){return r.json();}).then(function(d){
      var text = d.choices?.[0]?.message?.content || 'Não obtive resposta.';
      jarvisHistory.push({role:'assistant',content:text});
      document.getElementById('jarvis-typing')?.remove();
      addJarvisMsg('bot', text);
    }).catch(function(){ document.getElementById('jarvis-typing')?.remove(); addJarvisMsg('bot','Erro na comunicação com a IA.'); });
  }
}

// ═══════════════════════ PERFIL ══════════════════════════════
function renderPerfil(uid) {
  var el = document.getElementById('content-perfil');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  db.ref('usuarios/' + uid).once('value').then(function(snap) {
    var u = snap.val();
    if (!u) { el.innerHTML = '<p style="color:var(--muted);">Usuário não encontrado.</p>'; return; }
    var isSelf = uid === currentUser.uid;
    db.ref('seguidores/' + uid).once('value').then(function(segSnap) {
      var seguidores = segSnap.exists() ? Object.keys(segSnap.val()).length : 0;
      var seguindo = segSnap.exists() && segSnap.val()[currentUser.uid];
      var seloAdmin = u.adminLevel > 0 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo" title="Admin"/>' : '';
      var seloProf = u.isProf ? '<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" class="selo" title="Professor"/>' : '';
      el.innerHTML =
        '<div class="profile-banner"><div class="profile-avatar-wrap">' +
        '<img class="profile-avatar" src="'+(u.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(u.fullname||'U'))+'" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>' +
        '</div></div>' +
        '<div class="profile-info">' +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:8px;">' +
        (isSelf ? '<button class="btn btn-secondary btn-sm" onclick="openModal(\'modal-editar-perfil\');fillEditarPerfil()">Editar</button>' +
          '<button class="btn btn-danger btn-sm" onclick="doLogout()">Sair</button>' :
          '<button class="btn '+(seguindo?'btn-secondary':'btn-primary')+' btn-sm" onclick="toggleFollow(\''+uid+'\')" id="follow-btn">'+(seguindo?'Deixar de seguir':'Seguir')+'</button>') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<div class="profile-name">'+htmlEsc(u.fullname||'')+'</div>' + seloAdmin + seloProf + '</div>' +
        '<div class="profile-username">@'+htmlEsc(u.username||'')+'</div>' +
        '<div class="profile-stats">' +
        '<div class="profile-stat"><div class="profile-stat-num">'+(u.points||0)+'</div><div class="profile-stat-label">Pontos</div></div>' +
        '<div class="profile-stat"><div class="profile-stat-num">'+seguidores+'</div><div class="profile-stat-label">Seguidores</div></div>' +
        '<div class="profile-stat"><div class="profile-stat-num">'+(u.plano||'free').toUpperCase()+'</div><div class="profile-stat-label">Plano</div></div>' +
        '</div>' +
        (u.bio?'<p style="color:var(--muted);font-size:14px;margin-bottom:16px;">'+htmlEsc(u.bio)+'</p>':'') +
        '</div>' +
        '<div style="padding:0 16px;"><h3 style="margin-bottom:12px;">Posts</h3><div id="perfil-posts"><div class="loading"><div class="spinner"></div></div></div></div>' +
        '<div style="text-align:center;margin-top:12px;padding:16px;">' +
        '<span style="font-size:12px;color:var(--muted);cursor:pointer;" onclick="navigate(\'sobre\')">Sobre Nós</span> • ' +
        '<span style="font-size:12px;color:var(--muted);cursor:pointer;" onclick="navigate(\'updates\')">Updates</span></div>';
      // preenche dados do editar-perfil
      if (isSelf) {
        currentUserData = u;
        updateNavAvatar();
      }
      // carrega posts do usuario
      db.ref('posts').orderByChild('autorId').equalTo(uid).once('value').then(function(ps) {
        var pp = document.getElementById('perfil-posts');
        if (!pp) return;
        if (!ps.exists()) { pp.innerHTML = '<p style="color:var(--muted);font-size:13px;">Nenhum post ainda.</p>'; return; }
        var posts = [];
        ps.forEach(function(c){ var p=c.val(); p.id=c.key; posts.push(p); });
        posts.sort(function(a,b){return b.createdAt-a.createdAt;});
        pp.innerHTML = posts.map(renderPostCard).join('');
      });
    });
  });
}

function fillEditarPerfil() {
  document.getElementById('ep-nome').value = currentUserData.fullname||'';
  document.getElementById('ep-bio').value = currentUserData.bio||'';
  document.getElementById('ep-avatar-preview').style.display='none';
}

function salvarPerfil() {
  var nome = document.getElementById('ep-nome').value.trim();
  var bio = document.getElementById('ep-bio').value.trim();
  var file = document.getElementById('ep-avatar-input').files[0];
  var doSave = function(avatarUrl) {
    var upd = { fullname: nome, bio: bio };
    if (avatarUrl) upd.avatar = avatarUrl;
    db.ref('usuarios/' + currentUser.uid).update(upd).then(function() {
      currentUserData = Object.assign(currentUserData, upd);
      closeModal('modal-editar-perfil');
      showToast('Perfil atualizado!');
      updateNavAvatar();
      renderPerfil(currentUser.uid);
    });
  };
  if (file) { uploadImgBB(file, doSave); } else { doSave(''); }
}

function toggleFollow(uid) {
  var ref = db.ref('seguidores/' + uid + '/' + currentUser.uid);
  ref.once('value').then(function(snap) {
    if (snap.exists()) {
      ref.remove().then(function(){ renderPerfil(uid); });
    } else {
      ref.set(true).then(function(){
        enviarNotif(uid, currentUserData.fullname + ' começou a te seguir!', 'seguidor');
        renderPerfil(uid);
      });
    }
  });
}

function viewUserPerfil(uid) {
  if (uid === currentUser.uid) { navigate('perfil'); return; }
  currentModalUserId = uid;
  db.ref('usuarios/' + uid).once('value').then(function(snap) {
    var u = snap.val();
    if (!u) return;
    document.getElementById('mup-avatar').src = u.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(u.fullname||'U');
    db.ref('seguidores/' + uid).once('value').then(function(ss) {
      var seg = ss.exists() ? Object.keys(ss.val()).length : 0;
      var seguindo = ss.exists() && ss.val()[currentUser.uid];
      var seloAdmin = u.adminLevel>0 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo"/>' : '';
      var seloProf = u.isProf ? '<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" class="selo"/>' : '';
      document.getElementById('mup-info').innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<div class="profile-name">'+htmlEsc(u.fullname||'')+'</div>'+seloAdmin+seloProf+'</div>' +
        '<div class="profile-username">@'+htmlEsc(u.username||'')+'</div>' +
        '<div class="profile-stats">' +
        '<div class="profile-stat"><div class="profile-stat-num">'+(u.points||0)+'</div><div class="profile-stat-label">Pontos</div></div>' +
        '<div class="profile-stat"><div class="profile-stat-num">'+seg+'</div><div class="profile-stat-label">Seguidores</div></div></div>' +
        (u.bio?'<p style="color:var(--muted);font-size:13px;">'+htmlEsc(u.bio)+'</p>':'');
      var fbtn = document.getElementById('mup-follow-btn');
      fbtn.textContent = seguindo ? 'Deixar de seguir' : 'Seguir';
      fbtn.className = 'btn ' + (seguindo?'btn-secondary':'btn-primary');
    });
    openModal('modal-user-perfil');
  });
}

function toggleFollowModal() {
  toggleFollow(currentModalUserId);
  closeModal('modal-user-perfil');
}

// ═══════════════════════ NOTIFICAÇÕES ════════════════════════
function listenNotificacoes() {
  db.ref('notificacoes/' + currentUser.uid).on('value', function(snap) {
    var total = 0;
    if (snap.exists()) {
      snap.forEach(function(c){ if (!c.val().lida) total++; });
    }
    var badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = total; badge.style.display = total>0?'flex':'none'; }
  });
}

function renderNotificacoes() {
  var el = document.getElementById('content-notificacoes');
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
    '<h2>Notificações</h2><button class="btn btn-secondary btn-sm" onclick="marcarTodasLidas()">Marcar todas</button></div>' +
    '<div id="notif-list"><div class="loading"><div class="spinner"></div></div></div>';
  db.ref('notificacoes/' + currentUser.uid).orderByChild('createdAt').limitToLast(30).once('value').then(function(snap) {
    var list = document.getElementById('notif-list');
    if (!snap.exists()) { list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px;">Nenhuma notificação.</p>'; return; }
    var items = [];
    snap.forEach(function(c){ var n=c.val(); n.id=c.key; items.push(n); });
    items.reverse();
    list.innerHTML = items.map(function(n){
      return '<div class="notif-item '+(n.lida?'':'unread')+'" onclick="marcarLida(\''+n.id+'\')">' +
        (!n.lida?'<div class="notif-dot"></div>':'<div style="width:8px;"></div>') +
        '<div><p style="font-size:14px;">'+htmlEsc(n.mensagem)+'</p>' +
        '<p style="font-size:12px;color:var(--muted);margin-top:4px;">'+timeAgo(n.createdAt)+'</p></div></div>';
    }).join('');
  });
}

function marcarLida(id) {
  db.ref('notificacoes/' + currentUser.uid + '/' + id).update({lida:true}).then(renderNotificacoes);
}

function marcarTodasLidas() {
  db.ref('notificacoes/' + currentUser.uid).once('value').then(function(snap) {
    var updates = {};
    snap.forEach(function(c){ updates[c.key+'/lida'] = true; });
    db.ref('notificacoes/' + currentUser.uid).update(updates).then(renderNotificacoes);
  });
}

function enviarNotif(uid, mensagem, tipo) {
  var ref = db.ref('notificacoes/' + uid).push();
  ref.set({ mensagem: mensagem, tipo: tipo||'geral', lida: false, createdAt: Date.now() });
}

// ═══════════════════════ BUSCA ═══════════════════════════════
function renderBusca() {
  var el = document.getElementById('content-busca');
  el.innerHTML = '<h2 style="margin-bottom:16px;">🔍 Busca</h2>' +
    '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
    '<input class="input" id="busca-input" placeholder="Buscar usuários, disciplinas..." oninput="doBusca(this.value)" style="flex:1;"/></div>' +
    '<div id="busca-results"></div>';
}

function doBusca(q) {
  var el = document.getElementById('busca-results');
  if (!q.trim()) { el.innerHTML=''; return; }
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  var ql = q.toLowerCase();
  var results = [];
  // usuarios
  db.ref('usuarios').once('value').then(function(snap) {
    snap.forEach(function(c){
      var u=c.val();
      if ((u.fullname||'').toLowerCase().includes(ql)||(u.username||'').toLowerCase().includes(ql)) {
        results.push({type:'usuario',data:u});
      }
    });
    return db.ref('materias').once('value');
  }).then(function(snap) {
    snap.forEach(function(c){
      var m=c.val(); m.id=c.key;
      if ((m.nome||'').toLowerCase().includes(ql)) results.push({type:'materia',data:m});
    });
    if (!results.length) { el.innerHTML='<p style="color:var(--muted);padding:16px;">Nenhum resultado.</p>'; return; }
    el.innerHTML = results.map(function(r){
      if (r.type==='usuario') {
        var u=r.data;
        return '<div class="search-result" onclick="viewUserPerfil(\''+u.uid+'\')">'+
          '<img style="width:40px;height:40px;border-radius:50%;object-fit:cover;" src="'+(u.avatar||'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(u.fullname||'U'))+'" onerror="this.src=\'https://ui-avatars.com/api/?background=10B981&color=fff&name=U\'"/>'+
          '<div><div style="font-weight:700;">'+htmlEsc(u.fullname||'')+'</div><div style="font-size:12px;color:var(--muted);">@'+htmlEsc(u.username||'')+'</div></div>'+
          '<span style="margin-left:auto;font-size:11px;background:var(--blue);color:#fff;padding:2px 8px;border-radius:99px;">Usuário</span></div>';
      } else {
        var m=r.data;
        return '<div class="search-result" onclick="abrirMateria(\''+m.id+'\')">'+
          '<div style="font-size:28px;">'+htmlEsc(m.icone||'📚')+'</div>'+
          '<div><div style="font-weight:700;">'+htmlEsc(m.nome)+'</div><div style="font-size:12px;color:var(--muted);">'+htmlEsc(m.descricao||'')+'</div></div>'+
          '<span style="margin-left:auto;font-size:11px;background:var(--purple);color:#fff;padding:2px 8px;border-radius:99px;">Disciplina</span></div>';
      }
    }).join('');
  });
}

// ═══════════════════════ SOBRE / UPDATES ═════════════════════
function renderSobre() {
  var el = document.getElementById('content-sobre');
  el.innerHTML = '<h2 style="margin-bottom:16px;">Sobre Nós</h2><div class="loading"><div class="spinner"></div></div>';
  db.ref('config/sobre').once('value').then(function(snap) {
    el.innerHTML = '<button onclick="navigate(\'home\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;margin-bottom:16px;"><i class="fas fa-arrow-left"></i></button>' +
      '<h2 style="margin-bottom:16px;">Sobre Nós</h2>' +
      '<div class="card" style="line-height:1.7;white-space:pre-wrap;">'+(snap.exists()?htmlEsc(snap.val()):'Bem-vindo ao Sexta-Feira Studies! Uma plataforma gamificada de estudos.')+'</div>' +
      '<footer style="text-align:center;margin-top:24px;padding:16px;color:var(--muted);font-size:12px;">Feito com ❤️ por Sexta-Feira Studies</footer>';
  });
}

function renderUpdates() {
  var el = document.getElementById('content-updates');
  el.innerHTML = '<button onclick="navigate(\'home\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;margin-bottom:16px;"><i class="fas fa-arrow-left"></i></button>' +
    '<h2 style="margin-bottom:16px;">📋 Update Log</h2><div id="updates-list"><div class="loading"><div class="spinner"></div></div></div>';
  db.ref('config/updates').orderByChild('data').once('value').then(function(snap) {
    var list = document.getElementById('updates-list');
    if (!snap.exists()) { list.innerHTML='<p style="color:var(--muted);">Nenhum update ainda.</p>'; return; }
    var items = [];
    snap.forEach(function(c){ var u=c.val(); u.id=c.key; items.push(u); });
    items.reverse();
    list.innerHTML = items.map(function(u){
      return '<div class="update-card">' +
        '<span class="version-badge">v'+htmlEsc(u.versao||'1.0')+'</span>' +
        '<h3 style="margin-bottom:6px;">'+htmlEsc(u.titulo)+'</h3>' +
        '<p style="font-size:13px;color:var(--muted);white-space:pre-wrap;">'+htmlEsc(u.descricao||'')+'</p>' +
        '<p style="font-size:11px;color:var(--muted);margin-top:8px;">'+new Date(u.data).toLocaleDateString('pt-BR')+'</p></div>';
    }).join('');
  });
}

// ═══════════════════════ ADMIN PAINEL ════════════════════════
var admAuthed = false;
var admCurrentTab = 'dashboard';

function admLogin() {
  var senha = document.getElementById('adm-senha').value;
  if (senha !== 'admin123') return showToast('Senha incorreta');
  admAuthed = true;
  document.getElementById('adm-login-wrap').style.display = 'none';
  document.getElementById('adm-painel').style.display = 'flex';
  admTab('dashboard');
}

function admTab(tab) {
  admCurrentTab = tab;
  document.querySelectorAll('#screen-adm .tab').forEach(function(t) {
    t.classList.toggle('active', t.textContent.toLowerCase().includes(tab)||
      (tab==='dashboard'&&t.textContent==='Dashboard')||
      (tab==='usuarios'&&t.textContent==='Usuários')||
      (tab==='disciplinas'&&t.textContent==='Disciplinas')||
      (tab==='quizzes'&&t.textContent==='Quizzes')||
      (tab==='aulas'&&t.textContent==='Aulas')||
      (tab==='posts'&&t.textContent==='Posts')||
      (tab==='desafios'&&t.textContent==='Desafios')||
      (tab==='sobre'&&t.textContent==='Sobre')||
      (tab==='updates'&&t.textContent==='Updates')
    );
  });
  var el = document.getElementById('adm-content');
  if (tab==='dashboard') admDashboard(el);
  else if (tab==='usuarios') admUsuarios(el);
  else if (tab==='disciplinas') admDisciplinas(el);
  else if (tab==='quizzes') admQuizzesAdm(el);
  else if (tab==='aulas') admAulasAdm(el);
  else if (tab==='posts') admPosts(el);
  else if (tab==='desafios') admDesafios(el);
  else if (tab==='sobre') admSobre(el);
  else if (tab==='updates') admUpdates(el);
}

function admDashboard(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Dashboard</h3><div class="loading"><div class="spinner"></div></div>';
  Promise.all([
    db.ref('usuarios').once('value'),
    db.ref('materias').once('value'),
    db.ref('posts').once('value'),
    db.ref('desafios').once('value')
  ]).then(function(snaps) {
    el.innerHTML = '<h3 style="margin-bottom:16px;">Dashboard</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="card"><div style="font-size:28px;font-weight:800;color:var(--green)">'+(snaps[0].exists()?Object.keys(snaps[0].val()).length:0)+'</div><div style="font-size:13px;color:var(--muted);">Usuários</div></div>' +
      '<div class="card"><div style="font-size:28px;font-weight:800;color:var(--blue)">'+(snaps[1].exists()?Object.keys(snaps[1].val()).length:0)+'</div><div style="font-size:13px;color:var(--muted);">Disciplinas</div></div>' +
      '<div class="card"><div style="font-size:28px;font-weight:800;color:var(--purple)">'+(snaps[2].exists()?Object.keys(snaps[2].val()).length:0)+'</div><div style="font-size:13px;color:var(--muted);">Posts</div></div>' +
      '<div class="card"><div style="font-size:28px;font-weight:800;color:var(--yellow)">'+(snaps[3].exists()?Object.keys(snaps[3].val()).length:0)+'</div><div style="font-size:13px;color:var(--muted);">Desafios</div></div>' +
      '</div>';
  });
}

function admUsuarios(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Usuários</h3><div class="loading"><div class="spinner"></div></div>';
  db.ref('usuarios').once('value').then(function(snap) {
    if (!snap.exists()) { el.innerHTML='<p style="color:var(--muted);">Nenhum usuário.</p>'; return; }
    var users = [];
    snap.forEach(function(c){ users.push(c.val()); });
    var html = '<h3 style="margin-bottom:12px;">Usuários ('+users.length+')</h3><div style="overflow-x:auto;"><table class="adm-table"><thead><tr><th>Nome</th><th>@</th><th>Pontos</th><th>Plano</th><th>Admin</th><th>Prof</th><th>Ações</th></tr></thead><tbody>';
    users.forEach(function(u) {
      html += '<tr>' +
        '<td>'+htmlEsc(u.fullname||'')+'</td>' +
        '<td>@'+htmlEsc(u.username||'')+'</td>' +
        '<td><input style="width:70px;background:var(--card2);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px;font-family:Sora,sans-serif;" type="number" value="'+(u.points||0)+'" id="pts-'+u.uid+'"/></td>' +
        '<td><select id="plano-'+u.uid+'" style="background:var(--card2);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px;font-family:Sora,sans-serif;">' +
        ['free','pro','premium'].map(function(p){return '<option value="'+p+'" '+(u.plano===p?'selected':'')+'>'+p+'</option>';}).join('')+'</select></td>' +
        '<td><input type="checkbox" '+(u.adminLevel>0?'checked':'')+' id="adm-'+u.uid+'"/></td>' +
        '<td><input type="checkbox" '+(u.isProf?'checked':'')+' id="prof-'+u.uid+'"/></td>' +
        '<td style="display:flex;gap:4px;">' +
        '<button class="btn btn-primary btn-sm" onclick="admSalvarUser(\''+u.uid+'\')">Salvar</button>' +
        '<button class="btn btn-danger btn-sm" onclick="admExcluirUser(\''+u.uid+'\')"><i class="fas fa-trash"></i></button>' +
        '</td></tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  });
}

function admSalvarUser(uid) {
  var pts = parseInt(document.getElementById('pts-'+uid).value)||0;
  var plano = document.getElementById('plano-'+uid).value;
  var isAdm = document.getElementById('adm-'+uid).checked;
  var isProf = document.getElementById('prof-'+uid).checked;
  db.ref('usuarios/'+uid).update({points:pts,plano:plano,adminLevel:isAdm?1:0,isProf:isProf}).then(function(){ showToast('Usuário atualizado!'); });
}

function admExcluirUser(uid) {
  if (!confirm('Excluir usuário?')) return;
  db.ref('usuarios/'+uid).remove().then(function(){ showToast('Usuário excluído!'); admTab('usuarios'); });
}

function admDisciplinas(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Disciplinas</h3><div class="loading"><div class="spinner"></div></div>';
  db.ref('materias').once('value').then(function(snap) {
    if (!snap.exists()) { el.innerHTML='<h3 style="margin-bottom:12px;">Disciplinas</h3><p style="color:var(--muted);">Nenhuma.</p>'; return; }
    var html = '<h3 style="margin-bottom:12px;">Disciplinas</h3><div style="overflow-x:auto;"><table class="adm-table"><thead><tr><th>Ícone</th><th>Nome</th><th>Autor</th><th>Ação</th></tr></thead><tbody>';
    snap.forEach(function(c) {
      var m=c.val(); m.id=c.key;
      html += '<tr><td>'+htmlEsc(m.icone||'📚')+'</td><td>'+htmlEsc(m.nome)+'</td><td>'+htmlEsc(m.autorNome||'')+'</td>' +
        '<td><button class="btn btn-danger btn-sm" onclick="admExcluirMateria(\''+m.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  });
}

function admExcluirMateria(id) {
  if (!confirm('Excluir disciplina e todo seu conteúdo?')) return;
  db.ref('materias/'+id).remove();
  db.ref('aulas/'+id).remove();
  db.ref('quizzes/'+id).remove();
  showToast('Disciplina excluída!'); admTab('disciplinas');
}

function admQuizzesAdm(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Quizzes</h3><div class="loading"><div class="spinner"></div></div>';
  db.ref('quizzes').once('value').then(function(snap) {
    if (!snap.exists()) { el.innerHTML='<h3>Quizzes</h3><p style="color:var(--muted);">Nenhum.</p>'; return; }
    var html='<h3 style="margin-bottom:12px;">Quizzes</h3><div style="overflow-x:auto;"><table class="adm-table"><thead><tr><th>Nome</th><th>Questões</th><th>Ação</th></tr></thead><tbody>';
    snap.forEach(function(mId) {
      mId.forEach(function(c) {
        var q=c.val(); q.id=c.key; q.matId=mId.key;
        html+='<tr><td>'+htmlEsc(q.nome)+'</td><td>'+(q.questoes?q.questoes.length:0)+'</td>' +
          '<td><button class="btn btn-danger btn-sm" onclick="db.ref(\'quizzes/'+q.matId+'/'+q.id+'\').remove().then(function(){admTab(\'quizzes\');})"><i class="fas fa-trash"></i></button></td></tr>';
      });
    });
    html+='</tbody></table></div>';
    el.innerHTML=html;
  });
}

function admAulasAdm(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Aulas</h3><div class="loading"><div class="spinner"></div></div>';
  db.ref('aulas').once('value').then(function(snap) {
    if (!snap.exists()) { el.innerHTML='<h3>Aulas</h3><p style="color:var(--muted);">Nenhuma.</p>'; return; }
    var html='<h3 style="margin-bottom:12px;">Aulas</h3><div style="overflow-x:auto;"><table class="adm-table"><thead><tr><th>Título</th><th>Autor</th><th>Verificado</th><th>Ação</th></tr></thead><tbody>';
    snap.forEach(function(mId) {
      mId.forEach(function(c) {
        var a=c.val(); a.id=c.key; a.matId=mId.key;
        html+='<tr><td>'+htmlEsc(a.titulo)+'</td><td>'+htmlEsc(a.autorNome||'')+'</td>' +
          '<td><input type="checkbox" '+(a.verificado?'checked':'')+' onchange="db.ref(\'aulas/'+a.matId+'/'+a.id+'\').update({verificado:this.checked})"/></td>' +
          '<td><button class="btn btn-danger btn-sm" onclick="db.ref(\'aulas/'+a.matId+'/'+a.id+'\').remove().then(function(){admTab(\'aulas\');})"><i class="fas fa-trash"></i></button></td></tr>';
      });
    });
    html+='</tbody></table></div>';
    el.innerHTML=html;
  });
}

function admPosts(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Posts</h3><div class="loading"><div class="spinner"></div></div>';
  db.ref('posts').once('value').then(function(snap) {
    if (!snap.exists()) { el.innerHTML='<h3>Posts</h3><p style="color:var(--muted);">Nenhum.</p>'; return; }
    var html='<h3 style="margin-bottom:12px;">Posts</h3>';
    snap.forEach(function(c) {
      var p=c.val(); p.id=c.key;
      html+='<div class="card" style="margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<div><strong>'+htmlEsc(p.autorNome||'')+'</strong> • <span style="color:var(--muted);font-size:12px;">'+timeAgo(p.createdAt)+'</span>' +
        '<p style="font-size:13px;margin-top:6px;">'+htmlEsc((p.texto||'').substring(0,100))+'</p></div>' +
        '<button class="btn btn-danger btn-sm" onclick="admExcluirPost(\''+p.id+'\')"><i class="fas fa-trash"></i></button></div></div>';
    });
    el.innerHTML=html;
  });
}

function admExcluirPost(id) {
  if (!confirm('Excluir post?')) return;
  db.ref('posts/'+id).remove().then(function(){ showToast('Post excluído!'); admTab('posts'); });
}

function admDesafios(el) {
  el.innerHTML = '<h3 style="margin-bottom:12px;">Desafios</h3>' +
    '<div class="card" style="margin-bottom:16px;">' +
    '<h4 style="margin-bottom:12px;">Criar Desafio</h4>' +
    '<div class="form-group"><label>Título</label><input class="input" id="ad-titulo" placeholder="Título"/></div>' +
    '<div class="form-group"><label>Descrição</label><textarea class="input" id="ad-desc" rows="2" placeholder="Descrição..."></textarea></div>' +
    '<div class="form-group"><label>Prêmio (pts)</label><input class="input" id="ad-premio" type="number" value="100"/></div>' +
    '<div class="form-group"><label>Banner URL</label><input class="input" id="ad-banner" placeholder="URL da imagem"/></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div class="form-group"><label>Início</label><input class="input" id="ad-inicio" type="datetime-local"/></div>' +
    '<div class="form-group"><label>Fim</label><input class="input" id="ad-fim" type="datetime-local"/></div></div>' +
    '<div id="ad-questoes-wrap"></div>' +
    '<button class="btn btn-secondary btn-sm" onclick="addDesafioQ()" style="margin-bottom:12px;"><i class="fas fa-plus"></i> Questão</button>' +
    '<div><button class="btn btn-primary btn-full" onclick="admCriarDesafio()">Criar Desafio</button></div></div>' +
    '<h4 style="margin-bottom:12px;">Desafios existentes</h4><div id="desafios-adm-list"><div class="loading"><div class="spinner"></div></div></div>';
  admLoadDesafios();
  addDesafioQ();
}

var desafioAdmQuestoes = [];
function addDesafioQ() {
  desafioAdmQuestoes.push({pergunta:'',alternativas:['','','',''],correta:0});
  renderDesafioAdmQ();
}

function renderDesafioAdmQ() {
  var wrap = document.getElementById('ad-questoes-wrap');
  if (!wrap) return;
  var html = '';
  desafioAdmQuestoes.forEach(function(q,qi){
    html+='<div style="background:var(--card2);border-radius:8px;padding:10px;margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong style="font-size:13px;">Q'+(qi+1)+'</strong>' +
      '<button class="btn btn-danger btn-sm" onclick="desafioAdmQuestoes.splice('+qi+',1);renderDesafioAdmQ()"><i class="fas fa-times"></i></button></div>' +
      '<input class="input" style="margin-bottom:6px;" placeholder="Pergunta" value="'+htmlEsc(q.pergunta)+'" oninput="desafioAdmQuestoes['+qi+'].pergunta=this.value"/>';
    ['A','B','C','D'].forEach(function(l,ai){
      html+='<div style="display:flex;gap:6px;margin-bottom:4px;">' +
        '<input type="radio" name="dc-'+qi+'" '+(q.correta===ai?'checked':'')+' onchange="desafioAdmQuestoes['+qi+'].correta='+ai+'" style="accent-color:var(--green);"/>' +
        '<input class="input" placeholder="'+l+')" value="'+htmlEsc(q.alternativas[ai]||'')+'" oninput="desafioAdmQuestoes['+qi+'].alternativas['+ai+']=this.value" style="flex:1;"/></div>';
    });
    html+='</div>';
  });
  wrap.innerHTML = html;
}

function admCriarDesafio() {
  var titulo = document.getElementById('ad-titulo').value.trim();
  var desc = document.getElementById('ad-desc').value.trim();
  var premio = parseInt(document.getElementById('ad-premio').value)||100;
  var banner = document.getElementById('ad-banner').value.trim();
  var inicio = new Date(document.getElementById('ad-inicio').value).getTime();
  var fim = new Date(document.getElementById('ad-fim').value).getTime();
  if (!titulo||!inicio||!fim) return showToast('Preencha título, início e fim');
  if (!desafioAdmQuestoes.length) return showToast('Adicione questões');
  var ref = db.ref('desafios').push();
  ref.set({id:ref.key,titulo:titulo,descricao:desc,questoes:desafioAdmQuestoes,premio:premio,banner:banner,inicio:inicio,fim:fim,createdAt:Date.now()})
    .then(function(){ showToast('Desafio criado!'); desafioAdmQuestoes=[]; admLoadDesafios(); });
}

function admLoadDesafios() {
  db.ref('desafios').once('value').then(function(snap) {
    var el = document.getElementById('desafios-adm-list');
    if (!el) return;
    if (!snap.exists()) { el.innerHTML='<p style="color:var(--muted);">Nenhum desafio.</p>'; return; }
    var html='';
    snap.forEach(function(c){
      var d=c.val(); d.id=c.key;
      html+='<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div><strong>'+htmlEsc(d.titulo)+'</strong><div style="font-size:12px;color:var(--muted);">'+new Date(d.inicio).toLocaleString('pt-BR')+' → '+new Date(d.fim).toLocaleString('pt-BR')+'</div></div>' +
        '<button class="btn btn-danger btn-sm" onclick="db.ref(\'desafios/'+d.id+'\').remove().then(function(){admLoadDesafios();})"><i class="fas fa-trash"></i></button></div>';
    });
    el.innerHTML=html;
  });
}

function admSobre(el) {
  db.ref('config/sobre').once('value').then(function(snap) {
    el.innerHTML = '<h3 style="margin-bottom:16px;">Sobre Nós</h3>' +
      '<textarea class="input" id="adm-sobre-txt" rows="8" style="margin-bottom:12px;">'+htmlEsc(snap.val()||'')+'</textarea>' +
      '<button class="btn btn-primary" onclick="admSalvarSobre()">Salvar</button>';
  });
}

function admSalvarSobre() {
  var txt = document.getElementById('adm-sobre-txt').value;
  db.ref('config/sobre').set(txt).then(function(){ showToast('Salvo!'); });
}

function admUpdates(el) {
  el.innerHTML = '<h3 style="margin-bottom:16px;">Updates</h3>' +
    '<div class="card" style="margin-bottom:16px;">' +
    '<h4 style="margin-bottom:12px;">Novo Update</h4>' +
    '<div class="form-group"><label>Título</label><input class="input" id="upd-titulo" placeholder="Título do update"/></div>' +
    '<div class="form-group"><label>Versão</label><input class="input" id="upd-versao" placeholder="1.0.0"/></div>' +
    '<div class="form-group"><label>Descrição</label><textarea class="input" id="upd-desc" rows="4" placeholder="O que mudou?"></textarea></div>' +
    '<button class="btn btn-primary" onclick="admCriarUpdate()">Publicar</button></div>' +
    '<h4 style="margin-bottom:12px;">Histórico</h4><div id="updates-adm-list"><div class="loading"><div class="spinner"></div></div></div>';
  admLoadUpdates();
}

function admCriarUpdate() {
  var titulo = document.getElementById('upd-titulo').value.trim();
  var versao = document.getElementById('upd-versao').value.trim();
  var desc = document.getElementById('upd-desc').value.trim();
  if (!titulo||!versao) return showToast('Preencha título e versão');
  var ref = db.ref('config/updates').push();
  ref.set({titulo:titulo,versao:versao,descricao:desc,data:Date.now()}).then(function(){ showToast('Update publicado!'); admLoadUpdates(); });
}

function admLoadUpdates() {
  db.ref('config/updates').once('value').then(function(snap) {
    var el = document.getElementById('updates-adm-list');
    if (!el) return;
    if (!snap.exists()) { el.innerHTML='<p style="color:var(--muted);">Nenhum update.</p>'; return; }
    var html='';
    snap.forEach(function(c){
      var u=c.val(); u.id=c.key;
      html+='<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<div><span class="version-badge">v'+htmlEsc(u.versao)+'</span><strong style="display:block;margin-top:4px;">'+htmlEsc(u.titulo)+'</strong>' +
        '<p style="font-size:12px;color:var(--muted);">'+new Date(u.data).toLocaleDateString('pt-BR')+'</p></div>' +
        '<button class="btn btn-danger btn-sm" onclick="db.ref(\'config/updates/'+u.id+'\').remove().then(admLoadUpdates)"><i class="fas fa-trash"></i></button></div>';
    });
    el.innerHTML=html;
  });
}

// ═══════════════════════ UTILS ═══════════════════════════════
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2800);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function htmlEsc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  if (!ts) return '';
  var diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return Math.floor(diff/60)+'min';
  if (diff < 86400) return Math.floor(diff/3600)+'h';
  if (diff < 604800) return Math.floor(diff/86400)+'d';
  return new Date(ts).toLocaleDateString('pt-BR');
}

function addPoints(pts) {
  if (!currentUser || pts <= 0) return;
  db.ref('usuarios/' + currentUser.uid + '/points').transaction(function(curr) {
    return (curr||0) + pts;
  }).then(function(res) {
    if (res.committed) {
      currentUserData.points = res.snapshot.val();
      var el = document.getElementById('home-pts');
      if (el) { el.textContent = currentUserData.points; el.classList.add('pts-anim'); setTimeout(function(){ el.classList.remove('pts-anim'); }, 400); }
    }
  });
}

function updateNavAvatar() {
  if (!currentUserData) return;
  var img = document.getElementById('nav-avatar');
  if (img) img.src = currentUserData.avatar || 'https://ui-avatars.com/api/?background=10B981&color=fff&name='+encodeURIComponent(currentUserData.fullname||'U');
}

function previewImg(input, previewId) {
  var file = input.files[0];
  var preview = document.getElementById(previewId);
  if (!file || !preview) return;
  var reader = new FileReader();
  reader.onload = function(e) { preview.src = e.target.result; preview.style.display='block'; };
  reader.readAsDataURL(file);
}

function uploadImgBB(file, callback) {
  showToast('Enviando imagem...');
  var reader = new FileReader();
  reader.onload = function(e) {
    var b64 = e.target.result.split(',')[1];
    var fd = new FormData();
    fd.append('image', b64);
    fetch('https://api.imgbb.com/1/upload?key='+IMGBB_KEY, { method:'POST', body: fd })
      .then(function(r){return r.json();})
      .then(function(d){ callback(d.data && d.data.url ? d.data.url : ''); })
      .catch(function(){ callback(''); showToast('Erro no upload da imagem'); });
  };
  reader.readAsDataURL(file);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// init quiz form on open
document.getElementById('modal-quiz').addEventListener('click', function(){}, false);
