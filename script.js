'use strict';

// Firebase Config
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
const STATE = {
  user: null,
  userData: null,
  currentMateriaId: null,
  currentTopicoId: null,
  currentRoom: null,
  materiaFilter: 'all',
  feedFilter: 'all',
  postType: 'post',
  admTab: 'materias',
  quiz: { questions:[], index:0, score:0, correct:0, timer:null, timeLeft:30, start:0, answers:[] }
};

// ========== HELPERS ==========
function esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function fmt(n) { if(!n)return'0'; if(n>=1000)return (n/1000).toFixed(1)+'K'; return String(n); }
function ago(t) { if(!t)return'agora'; const d=(Date.now()-t)/1000; if(d<60)return'agora'; if(d<3600)return Math.floor(d/60)+'min'; if(d<86400)return Math.floor(d/3600)+'h'; return Math.floor(d/86400)+'d'; }
function $(id){ return document.getElementById(id); }
function txt(id,v){ const e=$(id); if(e)e.textContent=v; }
function show(id){ const e=$(id); if(e)e.style.display=''; }
function hide(id){ const e=$(id); if(e)e.style.display='none'; }

function toast(msg, type){
  const c = $('toast-container'); if(!c) return;
  const icons = {success:'✅', error:'❌', info:'ℹ️'};
  const d = document.createElement('div');
  d.style.cssText = 'background:white; padding:12px 18px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.15); font-weight:600; font-size:14px; animation:slideIn 0.3s ease;';
  d.innerHTML = (icons[type]||'') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transition='0.3s'; setTimeout(()=>d.remove(),300); },3000);
}

// ========== AUTH ==========
function switchTab(t){
  document.querySelectorAll('.auth-tab-btn').forEach(b=>{ b.style.background='transparent'; b.style.color='#888'; });
  if(t==='login'){
    show('login-form'); hide('register-form');
    document.querySelectorAll('.auth-tab-btn')[0].style.background='white';
    document.querySelectorAll('.auth-tab-btn')[0].style.color='#6C5CE7';
  } else {
    hide('login-form'); show('register-form');
    document.querySelectorAll('.auth-tab-btn')[1].style.background='white';
    document.querySelectorAll('.auth-tab-btn')[1].style.color='#6C5CE7';
  }
  hide('login-error'); hide('reg-error');
}

function togglePass(id, btn){
  const i = $(id); if(!i) return;
  i.type = i.type==='password'?'text':'password';
  btn.textContent = i.type==='password'?'👁':'🙈';
}

async function handleLogin(){
  const u = $('login-username')?.value?.trim();
  const p = $('login-password')?.value;
  if(!u||!p){ const e=$('login-error'); if(e){e.style.display=''; e.textContent='Preencha todos os campos';} return; }
  
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  const users = snap.val();
  if(!users){ const e=$('login-error'); if(e){e.style.display=''; e.textContent='Usuário não encontrado';} return; }
  
  const uid = Object.keys(users)[0];
  const data = users[uid];
  if(data.password !== p){ const e=$('login-error'); if(e){e.style.display=''; e.textContent='Senha incorreta';} return; }
  
  try { await auth.signInWithEmailAndPassword(data.email, p); }
  catch(ex){ try { await auth.createUserWithEmailAndPassword(data.email, p); } catch(ex2){} }
}

async function handleRegister(){
  const uname = $('reg-username')?.value?.trim();
  const email = $('reg-email')?.value?.trim();
  const pw = $('reg-password')?.value;
  const cf = $('reg-confirm')?.value;
  const err = $('reg-error');
  
  if(!uname||!email||!pw||!cf){ if(err){err.style.display=''; err.textContent='Preencha todos os campos';} return; }
  if(uname.length<3){ if(err){err.style.display=''; err.textContent='Nome muito curto (mín. 3)';} return; }
  if(pw.length<6){ if(err){err.style.display=''; err.textContent='Senha muito curta (mín. 6)';} return; }
  if(pw!==cf){ if(err){err.style.display=''; err.textContent='Senhas não coincidem';} return; }
  
  const s1 = await db.ref('usuarios').orderByChild('username').equalTo(uname).once('value');
  if(s1.val()){ if(err){err.style.display=''; err.textContent='Nome de usuário já está em uso!';} return; }
  
  const s2 = await db.ref('usuarios').orderByChild('email').equalTo(email).once('value');
  if(s2.val()){ if(err){err.style.display=''; err.textContent='E-mail já cadastrado!';} return; }
  
  let cred;
  try { cred = await auth.createUserWithEmailAndPassword(email, pw); }
  catch(e){ if(err){err.style.display=''; err.textContent='Erro: '+e.message;} return; }
  
  await db.ref('usuarios/'+cred.user.uid).set({
    uid: cred.user.uid, username: uname, email, password: pw,
    avatar:'🎓', bio:'', points:0, quizzesPlayed:0, materiasCreated:0, seguidores:0, isAdmin:false, createdAt:Date.now()
  });
  
  await db.ref('notificacoes/'+cred.user.uid).push({
    mensagem:'🎉 Bem-vindo ao Sexta-Feira Studies!', tipo:'system', lida:false, createdAt:Date.now()
  });
  
  toast('Conta criada! 🎉','success');
}

async function handleLogout(){
  if(!confirm('Sair?')) return;
  await auth.signOut();
  STATE.user=null; STATE.userData=null;
}

// ========== AUTH LISTENER ==========
auth.onAuthStateChanged(async (user)=>{
  if(user){
    STATE.user = user;
    const snap = await db.ref('usuarios/'+user.uid).once('value');
    STATE.userData = snap.val();
    if(!STATE.userData){
      STATE.userData = { uid:user.uid, username:user.email?.split('@')[0]||'user', email:user.email||'', avatar:'🎓', bio:'', points:0, quizzesPlayed:0, materiasCreated:0, seguidores:0, isAdmin:false, createdAt:Date.now() };
      await db.ref('usuarios/'+user.uid).set(STATE.userData);
    }
    hide('auth-screen'); show('app');
    updateUI(); showScreen('home');
    if(STATE.userData.isAdmin) show('nav-adm');
    listenNotifs();
  } else {
    STATE.user=null; STATE.userData=null;
    hide('app'); show('auth-screen');
    switchTab('login');
  }
});

// ========== UI ==========
function updateUI(){
  const u = STATE.userData; if(!u) return;
  txt('sidebar-name', u.username||'?'); txt('sidebar-pts', fmt(u.points));
  const av = u.avatar||'🎓';
  
  // Verificar se é URL de imagem
  if (av.startsWith('http')) {
    document.getElementById('sidebar-avatar').innerHTML = `<img src="${av}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    document.getElementById('topbar-avatar').innerHTML = `<img src="${av}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    document.getElementById('pc-avatar').innerHTML = `<img src="${av}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    document.getElementById('perfil-avatar').innerHTML = `<img src="${av}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
  } else {
    txt('sidebar-avatar', av); txt('topbar-avatar', av);
    txt('pc-avatar', av); txt('perfil-avatar', av);
  }
  
  txt('perfil-name', u.username||'--'); txt('perfil-email', u.email||'--');
  txt('home-greeting', 'Olá, '+(u.username||'Estudante').split(' ')[0]+'! 👋');
}
// ========== NAVEGAÇÃO ==========
function showScreen(name){
  document.querySelectorAll('#main-content > div').forEach(d=>d.style.display='none');
  const t = $('screen-'+name); if(t) t.style.display='';
  
  const sidebar = $('sidebar');
  if(sidebar) sidebar.style.transform='translateX(-100%)';
  hide('sidebar-overlay');
  
  if(name==='home') loadHome();
  if(name==='materias') loadMaterias();
  if(name==='descobrir') loadFeed();
  if(name==='ranking') loadRanking();
  if(name==='chat') loadChat();
  if(name==='perfil') loadPerfil();
  if(name==='notificacoes') loadNotifs();
  if(name==='adm') loadAdm();
}

function toggleSidebar(){
  const s = $('sidebar'); const o = $('sidebar-overlay');
  if(!s) return;
  if(s.style.transform==='translateX(0%)'){
    s.style.transform='translateX(-100%)'; hide('sidebar-overlay');
  } else {
    s.style.transform='translateX(0%)'; show('sidebar-overlay');
  }
}

function showModal(id){ const m=$(id); if(m)m.style.display='flex'; }
function closeModal(id){ const m=$(id); if(m)m.style.display='none'; }

// ========== HOME ==========
async function loadHome(){
  if(!STATE.userData) return;
  const s = await db.ref('usuarios/'+STATE.user.uid).once('value');
  if(s.val()) STATE.userData = s.val();
  updateUI();
  
  const pts = STATE.userData.points||0;
  const levels = [0,100,250,500,1000,2000,3500,5500,8000,12000,20000];
  const names = ['Iniciante','Aprendiz','Estudante','Dedicado','Scholar','Mestre','Especialista','Professor','Guru','Sábio','Lenda'];
  let lvl=0; for(let i=0;i<levels.length;i++){ if(pts>=levels[i]) lvl=i; }
  const nxt = levels[Math.min(lvl+1,levels.length-1)];
  const cur = levels[lvl];
  const pct = Math.min(((pts-cur)/(nxt-cur))*100, 100);
  
  txt('level-badge','📈 Nível '+(lvl+1)+' - '+names[lvl]);
  txt('stat-pontos', fmt(pts));
  txt('stat-quizzes', STATE.userData.quizzesPlayed||0);
  txt('progress-text', fmt(pts)+' / '+fmt(nxt)+' pts');
  const f=$('progress-fill'); if(f)f.style.width=pct+'%';
  
  const ms = await db.ref('materias').once('value');
  const mat = ms.val(); let cnt=0;
  if(mat) cnt = Object.values(mat).filter(m=>m.autorId===STATE.user.uid).length;
  txt('stat-materias', cnt);
  
  const us = await db.ref('usuarios').once('value');
  if(us.val()){
    const arr = Object.values(us.val()).sort((a,b)=>(b.points||0)-(a.points||0));
    const pos = arr.findIndex(u=>u.uid===STATE.user.uid);
    txt('stat-rank', pos>=0?'#'+(pos+1):'#--');
  }
  
  db.ref('posts').orderByChild('createdAt').limitToLast(5).on('value',(snap)=>{
    const posts = snap.val();
    const c = $('home-feed'); if(!c) return;
    if(!posts){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">📭 Nenhum post</div>'; return; }
    const arr = Object.entries(posts).map(([id,p])=>({id,...p})).reverse();
    c.innerHTML = arr.map(p=>feedHTML(p,true)).join('');
  });
}

function feedHTML(p, compact){
  const imagemHTML = p.imagem ? 
    `<img src="${p.imagem}" style="width:100%; max-height:300px; object-fit:cover; border-radius:10px; margin-top:8px;" loading="lazy" />` : '';
  
  return `
    <div style="background:white; border-radius:15px; padding:15px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${esc(p.avatar||p.autorAvatar||'?')}</div>
        <div style="flex:1;"><span style="font-weight:700;">${esc(p.autorNome||'?')}</span> <span style="color:#888;font-size:12px;">${ago(p.createdAt)}</span></div>
      </div>
      ${p.texto ? `<div>${esc(p.texto)}</div>` : ''}
      ${imagemHTML}
      ${!compact?`<div style="margin-top:10px; display:flex; gap:12px;">
        <button onclick="likePost('${p.id}')" style="border:none;background:none;cursor:pointer;font-weight:600;color:#888;">❤️ ${p.likes?Object.keys(p.likes).length:0}</button>
        ${p.autorId===STATE.user?.uid?`<button onclick="deletePost('${p.id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-weight:600;">🗑</button>`:''}
      </div>`:''}
    </div>`;
}
// ========== MATÉRIAS ==========
function loadMaterias(){
  db.ref('materias').on('value',(snap)=>{
    const mat = snap.val();
    const c = $('materias-grid'); if(!c) return;
    if(!mat){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">📚 Nenhuma matéria</div>'; return; }
    let arr = Object.entries(mat).map(([id,m])=>({id,...m}));
    if(STATE.materiaFilter==='mine') arr = arr.filter(m=>m.autorId===STATE.user?.uid);
    const s = ($('search-materias')?.value||'').toLowerCase();
    if(s) arr = arr.filter(m=>(m.nome||'').toLowerCase().includes(s));
    arr.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    if(!arr.length){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">🔍 Nenhuma</div>'; return; }
    c.innerHTML = arr.map(m=>`
      <div onclick="openMateria('${m.id}')" style="background:white; border-radius:15px; padding:15px; margin-bottom:10px; cursor:pointer; display:flex; gap:12px; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <span style="font-size:35px;">${m.icone||'📚'}</span>
        <div style="flex:1;"><div style="font-weight:700;">${esc(m.nome)}</div><div style="font-size:12px;color:#888;">${esc(m.descricao||'')}</div><div style="font-size:11px;color:#888;margin-top:5px;">👤 ${esc(m.autorNome||'?')} · ${m.topicosCount||0} tópicos</div></div>
      </div>
    `).join('');
  });
}

function setMateriaFilter(f, btn){
  STATE.materiaFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>{b.style.background='white'; b.style.color='#555';});
  if(btn){ btn.style.background='#6C5CE7'; btn.style.color='white'; }
  loadMaterias();
}

function filterMaterias(){ loadMaterias(); }

async function criarMateria(){
  const n = $('nm-nome')?.value?.trim();
  const d = $('nm-desc')?.value?.trim();
  if(!n){ toast('Nome obrigatório','error'); return; }
  if(!STATE.user){ toast('Faça login','error'); return; }
  
  await db.ref('materias').push({ nome:n, descricao:d, icone:'📚', visibilidade:'public', autorId:STATE.user.uid, autorNome:STATE.userData.username, topicosCount:0, createdAt:Date.now() });
  closeModal('modal-materia');
  $('nm-nome').value=''; $('nm-desc').value='';
  await db.ref('usuarios/'+STATE.user.uid).update({materiasCreated:(STATE.userData.materiasCreated||0)+1});
  addPts(20);
  toast('Matéria criada!','success');
}

async function openMateria(id){
  STATE.currentMateriaId=id;
  const s = await db.ref('materias/'+id).once('value');
  const m = s.val(); if(!m) return toast('Não encontrada','error');
  txt('materia-hero-icon', m.icone||'📚');
  txt('materia-hero-nome', m.nome);
  txt('materia-hero-desc', m.descricao||'');
  txt('materia-hero-autor','Por: '+(m.autorNome||'?'));
  showScreen('materia-detalhe');
  
  db.ref('topicos/'+id).on('value',(snap)=>{
    const t = snap.val();
    const c = $('topicos-list'); if(!c) return;
    if(!t){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">Nenhum tópico</div>'; return; }
    c.innerHTML = Object.entries(t).map(([tid,top])=>`
      <div onclick="openTopico('${tid}')" style="background:white; border-radius:12px; padding:12px; margin-bottom:8px; cursor:pointer; display:flex; align-items:center; gap:10px;">
        <span>📄</span><div style="flex:1;"><div style="font-weight:600;">${esc(top.titulo)}</div><div style="font-size:11px;color:#888;">${esc(top.autorNome||'?')} · ${ago(top.createdAt)}</div></div><span>→</span>
      </div>
    `).join('');
  });
  
  db.ref('quizzes/'+id).on('value',(snap)=>{
    const q = snap.val();
    const c = $('quizzes-materia'); if(!c) return;
    if(!q){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">Nenhum quiz</div>'; return; }
    c.innerHTML = Object.entries(q).map(([qid,quiz])=>`
      <div style="background:white; border-radius:12px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div><strong>🎮 ${esc(quiz.nome)}</strong><br><span style="font-size:12px;color:#888;">${quiz.questoes?.length||0} questões</span></div>
        <button onclick="startQuiz('${id}','${qid}')" style="background:#6C5CE7; color:white; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">▶ Jogar</button>
      </div>
    `).join('');
  });
}

// ========== TÓPICOS ==========
async function criarTopico(){
  const t = $('nt-titulo')?.value?.trim();
  const c = $('nt-conteudo')?.value?.trim();
  if(!t||!c){ toast('Preencha tudo','error'); return; }
  if(!STATE.currentMateriaId){ toast('Selecione uma matéria','error'); return; }
  
  await db.ref('topicos/'+STATE.currentMateriaId).push({ titulo:t, conteudo:c, autorId:STATE.user.uid, autorNome:STATE.userData.username, createdAt:Date.now() });
  const ms = await db.ref('materias/'+STATE.currentMateriaId).once('value');
  const m = ms.val();
  if(m) await db.ref('materias/'+STATE.currentMateriaId).update({topicosCount:(m.topicosCount||0)+1});
  closeModal('modal-topico');
  $('nt-titulo').value=''; $('nt-conteudo').value='';
  addPts(15);
  toast('Tópico criado!','success');
}

async function openTopico(id){
  STATE.currentTopicoId=id;
  const s = await db.ref('topicos/'+STATE.currentMateriaId+'/'+id).once('value');
  const t = s.val(); if(!t) return;
  txt('topico-title', t.titulo);
  txt('topico-meta','Por '+esc(t.autorNome||'?')+' · '+ago(t.createdAt));
  txt('topico-body', t.conteudo);
  showScreen('topico-detalhe');
  
  db.ref('comentarios/'+STATE.currentMateriaId+'/'+id).on('value',(snap)=>{
    const com = snap.val();
    const c = $('topico-comentarios'); if(!c) return;
    if(!com){ c.innerHTML='<div style="color:#888;padding:10px;">Sem comentários</div>'; return; }
    c.innerHTML = Object.entries(com).sort((a,b)=>(a[1].createdAt||0)-(b[1].createdAt||0)).map(([cid,co])=>`
      <div style="background:#f9f9f9; border-radius:10px; padding:10px; margin-bottom:6px;"><strong>${esc(co.autorNome||'?')}</strong> <span style="font-size:11px;color:#888;">${ago(co.createdAt)}</span><div>${esc(co.texto)}</div></div>
    `).join('');
  });
}

async function addComment(){
  const t = $('new-comment')?.value?.trim();
  if(!t) return;
  if(!STATE.currentMateriaId||!STATE.currentTopicoId) return;
  await db.ref('comentarios/'+STATE.currentMateriaId+'/'+STATE.currentTopicoId).push({
    texto:t, autorId:STATE.user.uid, autorNome:STATE.userData.username, createdAt:Date.now()
  });
  $('new-comment').value='';
  addPts(3);
}

// ========== QUIZ ==========
async function processarCmd(){
  const input = $('cmd-input')?.value;
  if(!input?.trim()){ toast('Digite os comandos','error'); return; }
  if(!STATE.currentMateriaId){ toast('Acesse uma matéria primeiro!','error'); return; }
  
  const lines = input.split('\n').map(l=>l.trim()).filter(l=>l);
  let nome='', questoes=[], curQ=null, alts=[], corr=-1, tempo=30;
  
  for(const l of lines){
    if(l.startsWith('/n ')) nome=l.substring(3).trim();
    else if(l.startsWith('/t ')) tempo=parseInt(l.substring(3))||30;
    else if(l.startsWith('/q ')){
      if(curQ&&alts.length>=2&&corr>=0){ curQ.alternativas=alts; curQ.correta=corr; questoes.push(curQ); }
      curQ={pergunta:l.substring(3).trim()}; alts=[]; corr=-1;
    }
    else if(l.startsWith('/a ')) alts.push(l.substring(3).trim());
    else if(l.startsWith('/c ')){ const map={A:0,B:1,C:2,D:3}; corr = map[l.substring(3).trim().toUpperCase()] ?? -1; }
    else if(l==='/f'){ if(curQ&&alts.length>=2&&corr>=0){ curQ.alternativas=alts; curQ.correta=corr; questoes.push(curQ); curQ=null; alts=[]; corr=-1; } }
  }
  if(curQ&&alts.length>=2&&corr>=0){ curQ.alternativas=alts; curQ.correta=corr; questoes.push(curQ); }
  
  if(!nome){ toast('Use /n para o nome','error'); return; }
  if(!questoes.length){ toast('Adicione questões','error'); return; }
  
  await db.ref('quizzes/'+STATE.currentMateriaId).push({ nome, tempo, questoes, autorId:STATE.user.uid, autorNome:STATE.userData.username, totalPlays:0, createdAt:Date.now() });
  closeModal('modal-quiz-cmd');
  $('cmd-input').value='';
  addPts(30);
  toast('Quiz "'+nome+'" criado!','success');
}

async function startQuiz(mId, qId){
  const s = await db.ref('quizzes/'+mId+'/'+qId).once('value');
  const q = s.val(); if(!q?.questoes?.length) return toast('Quiz inválido','error');
  
  STATE.quiz = { questions: shuffle([...q.questoes]), index:0, score:0, correct:0, timer:null, timeLeft:q.tempo||30, start:Date.now(), answers:[], nome:q.nome, mId, qId };
  showScreen('quiz-game');
  renderQ();
  await db.ref('quizzes/'+mId+'/'+qId).update({totalPlays:(q.totalPlays||0)+1});
}

function renderQ(){
  const g = STATE.quiz;
  if(g.index >= g.questions.length){ finishQ(); return; }
  const q = g.questions[g.index], total = g.questions.length;
  txt('quiz-q-counter', (g.index+1)+'/'+total);
  txt('quiz-q-num', 'Questão '+(g.index+1));
  txt('quiz-question', q.pergunta);
  const f = $('quiz-progress-fill'); if(f) f.style.width = ((g.index)/total*100)+'%';
  
  const c = $('quiz-options');
  const letters = ['A','B','C','D'];
  c.innerHTML = q.alternativas.map((a,i)=>`
    <button onclick="selectA(${i})" id="opt-${i}" style="display:block; width:100%; padding:14px; margin-bottom:8px; border:2px solid #eee; border-radius:12px; background:#f9f9f9; text-align:left; font-size:15px; cursor:pointer; font-weight:500;">
      <span style="display:inline-block; width:24px; height:24px; border-radius:50%; background:#ddd; text-align:center; line-height:24px; font-weight:700; font-size:13px; margin-right:10px;">${letters[i]}</span>${esc(a)}
    </button>
  `).join('');
  
  clearInterval(g.timer);
  g.timeLeft = STATE.quiz.timeLeft || 30;
  updateT();
  g.timer = setInterval(()=>{ g.timeLeft--; updateT(); if(g.timeLeft<=0){ clearInterval(g.timer); selectA(-1); } },1000);
}

function updateT(){ const e=$('quiz-timer'); if(e){ e.textContent='⏱ '+STATE.quiz.timeLeft+'s'; e.style.color=STATE.quiz.timeLeft<=5?'#ef4444':'#856404'; } }

function selectA(chosen){
  clearInterval(STATE.quiz.timer);
  const g = STATE.quiz, q = g.questions[g.index], correct = q.correta, isCorrect = chosen===correct;
  document.querySelectorAll('#quiz-options button').forEach((b,i)=>{
    b.disabled=true;
    if(i===correct) b.style.cssText='background:#d1fae5; border-color:#10b981; color:#065f46;';
    if(i===chosen&&!isCorrect) b.style.cssText='background:#fee2e2; border-color:#ef4444; color:#991b1b;';
  });
  if(isCorrect){ const pts = Math.max(10, Math.round(10+(g.timeLeft/30)*10)); g.score+=pts; g.correct++; g.answers.push({pergunta:q.pergunta, chosen, correct, isCorrect:true, pts}); }
  else { g.answers.push({pergunta:q.pergunta, chosen, correct, isCorrect:false, pts:0}); }
  txt('quiz-score-live', g.score);
  setTimeout(()=>{ g.index++; renderQ(); },1500);
}

async function finishQ(){
  clearInterval(STATE.quiz.timer);
  const g = STATE.quiz, total = g.questions.length, elapsed = Math.round((Date.now()-g.start)/1000), pct = Math.round((g.correct/total)*100);
  const bonus = pct>=90?50:pct>=70?30:pct>=50?15:0, totalPts = g.score+bonus;
  
  await db.ref('historico/'+STATE.user.uid).push({ quizNome:g.nome, score:totalPts, acertos:g.correct, total, pct, tempo:elapsed, createdAt:Date.now() });
  await addPts(totalPts);
  await db.ref('usuarios/'+STATE.user.uid).update({quizzesPlayed:(STATE.userData.quizzesPlayed||0)+1});
  await db.ref('posts').push({ tipo:'atividade', texto:'completou o quiz "'+g.nome+'" com '+pct+'%!', autorId:STATE.user.uid, autorNome:STATE.userData.username, avatar:STATE.userData.avatar, createdAt:Date.now() });
  
  showScreen('resultado');
  txt('resultado-emoji', pct>=80?'🎉':pct>=60?'👍':pct>=40?'😅':'💪');
  txt('resultado-titulo', pct>=80?'Excelente!':pct>=60?'Bom trabalho!':'Continue!');
  txt('resultado-subtitulo', g.nome);
  txt('res-acertos', g.correct); txt('res-total', total); txt('res-pontos','+'+totalPts); txt('res-tempo', elapsed+'s'); txt('resultado-pct', pct+'%');
  const f=$('resultado-barra-fill'); if(f) f.style.width=pct+'%';
  const r=$('resultado-review'); if(r) r.innerHTML = g.answers.map(a=>`<div style="padding:10px; border-radius:8px; margin-bottom:5px; background:${a.isCorrect?'#d1fae5':'#fee2e2'}; border-left:3px solid ${a.isCorrect?'#10b981':'#ef4444'};">${a.isCorrect?'✅':'❌'} ${esc(a.pergunta)} ${a.isCorrect?'<span style="float:right;font-weight:700;">+'+a.pts+'</span>':''}</div>`).join('');
}

function exitQuiz(){ if(!confirm('Sair do quiz?')) return; clearInterval(STATE.quiz.timer); showScreen('materia-detalhe'); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// ========== FEED ==========
function loadFeed(){
  db.ref('posts').orderByChild('createdAt').limitToLast(50).on('value',(snap)=>{
    const posts = snap.val();
    const c = $('descobrir-feed'); if(!c) return;
    if(!posts){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">📭 Nenhum post</div>'; return; }
    let arr = Object.entries(posts).map(([id,p])=>({id,...p})).reverse();
    if(STATE.feedFilter!=='all') arr = arr.filter(p=>p.tipo===STATE.feedFilter);
    c.innerHTML = arr.length ? arr.map(p=>feedHTML(p)).join('') : '<div style="text-align:center;color:#888;padding:20px;">📭 Nenhum post</div>';
  });
}

function setPostType(t, btn){
  STATE.postType=t;
  document.querySelectorAll('.ptype-btn').forEach(b=>{b.style.background='white'; b.style.color='#555'; b.style.borderColor='#eee';});
  if(btn){ btn.style.background='#6C5CE7'; btn.style.color='white'; btn.style.borderColor='#6C5CE7'; }
}

function setFeedFilter(f, btn){
  STATE.feedFilter=f;
  document.querySelectorAll('.feed-filter-btn').forEach(b=>{b.style.background='white'; b.style.color='#555';});
  if(btn){ btn.style.background='#6C5CE7'; btn.style.color='white'; }
  if(f==='usuarios'){ show('search-users-bar'); loadAllUsers(); }
  else { hide('search-users-bar'); loadFeed(); }
}

async function loadAllUsers(){
  const c = $('descobrir-feed'); if(!c) return;
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if(!users){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">Nenhum usuário</div>'; return; }
  renderUserList(users);
}

async function searchUsers(){
  const term = ($('search-users-input')?.value||'').toLowerCase().trim();
  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if(!users) return;
  if(!term){ renderUserList(users); return; }
  const filtered = {};
  Object.entries(users).forEach(([uid,u])=>{
    if((u.username||'').toLowerCase().includes(term)||(u.email||'').toLowerCase().includes(term)||(u.bio||'').toLowerCase().includes(term)) filtered[uid]=u;
  });
  renderUserList(filtered);
}

function renderUserList(users){
  const c = $('descobrir-feed'); if(!c) return;
  const arr = Object.entries(users).map(([uid,u])=>({uid,...u})).sort((a,b)=>(b.points||0)-(a.points||0));
  if(!arr.length){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">🔍 Nenhum encontrado</div>'; return; }
  c.innerHTML = arr.map(u=>{
    const isMe = u.uid===STATE.user?.uid;
    const level = getLevelName(u.points||0);
    return `
      <div onclick="${isMe?"showScreen('perfil')":"verPerfil('"+u.uid+"')"}" style="background:white; border-radius:15px; padding:15px; margin-bottom:10px; cursor:pointer; display:flex; align-items:center; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#a855f7);color:white;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${u.avatar||'🎓'}${u.isAdmin?'<span style="font-size:14px;">⚙️</span>':''}</div>
        <div style="flex:1;">
          <div style="font-weight:700;">${esc(u.username||'?')} ${isMe?'<span style="background:#6C5CE7;color:white;padding:2px 8px;border-radius:10px;font-size:10px;">Você</span>':''}</div>
          <div style="font-size:12px;color:#888;">${esc(u.bio||'Sem bio')}</div>
          <div style="font-size:11px;color:#888;">⭐ ${fmt(u.points||0)} · ${level} · 👥 ${u.seguidores||0} seguidores</div>
        </div>
        ${!isMe?`<button onclick="event.stopPropagation();toggleFollowUser('${u.uid}', this)" style="background:#6C5CE7;color:white;border:none;padding:8px 16px;border-radius:20px;font-weight:700;cursor:pointer;font-size:13px;">👥 Seguir</button>`:''}
      </div>
    `;
  }).join('');
  updateFollowButtons();
}

async function updateFollowButtons(){
  if(!STATE.user) return;
  const btns = document.querySelectorAll('#descobrir-feed button');
  for(const btn of btns){
    const onclick = btn.getAttribute('onclick')||'';
    const match = onclick.match(/'([^']+)'/);
    if(!match) continue;
    const uid = match[1];
    const snap = await db.ref('seguidores/'+STATE.user.uid+'/'+uid).once('value');
    if(snap.val()){ btn.textContent='✅ Seguindo'; btn.style.background='#10b981'; }
  }
}

async function toggleFollowUser(uid, btn){
  if(!STATE.user) return;
  const ref = db.ref('seguidores/'+STATE.user.uid+'/'+uid);
  const snap = await ref.once('value');
  if(snap.val()){
    await ref.remove();
    await db.ref('seguindo/'+uid+'/'+STATE.user.uid).remove();
    const uSnap = await db.ref('usuarios/'+uid).once('value');
    const u = uSnap.val();
    if(u) await db.ref('usuarios/'+uid).update({seguidores:Math.max((u.seguidores||1)-1,0)});
    if(btn){ btn.textContent='👥 Seguir'; btn.style.background='#6C5CE7'; }
  } else {
    await ref.set(true);
    await db.ref('seguindo/'+uid+'/'+STATE.user.uid).set(true);
    const uSnap = await db.ref('usuarios/'+uid).once('value');
    const u = uSnap.val();
    if(u) await db.ref('usuarios/'+uid).update({seguidores:(u.seguidores||0)+1});
    await db.ref('notificacoes/'+uid).push({ mensagem:'👥 '+STATE.userData.username+' começou a te seguir!', tipo:'follow', lida:false, createdAt:Date.now() });
    if(btn){ btn.textContent='✅ Seguindo'; btn.style.background='#10b981'; }
  }
}

function getLevelName(pts){
  const levels=[0,100,250,500,1000,2000,3500,5500,8000,12000,20000];
  const names=['🌱 Iniciante','📚 Aprendiz','📖 Estudante','🎓 Dedicado','🏅 Scholar','⭐ Mestre','🌟 Especialista','👨‍🏫 Professor','🧙 Guru','💎 Sábio','👑 Lenda'];
  let l=0; for(let i=0;i<levels.length;i++){ if(pts>=levels[i]) l=i; } return names[l];
}

async function createPost(){
  const t = $('new-post-text')?.value?.trim();
  if(!t){ toast('Escreva algo','error'); return; }
  await db.ref('posts').push({ texto:t, tipo:STATE.postType, autorId:STATE.user.uid, autorNome:STATE.userData.username, avatar:STATE.userData.avatar, createdAt:Date.now() });
  $('new-post-text').value='';
  addPts(5);
  toast('Publicado!','success');
}

async function criarPostModal(){
  const t = document.getElementById('post-texto-modal')?.value?.trim();
  const tp = document.getElementById('post-tipo-modal')?.value || 'post';
  const imagemInput = document.getElementById('post-imagem');
  
  if(!t && !imagemInput?.files[0]){ 
    showToast('Escreva algo ou adicione uma imagem', 'error'); 
    return; 
  }
  
  let imagemUrl = null;
  
  if (imagemInput && imagemInput.files[0]) {
    showToast('⏳ Enviando imagem...', 'info');
    const result = await uploadImage(imagemInput.files[0]);
    if (result) {
      imagemUrl = result.url;
    } else {
      showToast('Erro ao enviar imagem', 'error');
      return;
    }
  }
  
  await db.ref('posts').push({ 
    texto: t || '', 
    tipo: tp, 
    imagem: imagemUrl,
    autorId: STATE.user.uid, 
    autorNome: STATE.userData.username, 
    avatar: STATE.userData.avatar, 
    createdAt: Date.now() 
  });
  
  closeModal('modal-post');
  document.getElementById('post-texto-modal').value = '';
  if (imagemInput) imagemInput.value = '';
  document.getElementById('post-image-preview').innerHTML = '';
  addPts(5);
  showToast('Publicado!', 'success');
}

async function likePost(id){
  if(!STATE.user) return;
  const ref = db.ref('posts/'+id+'/likes/'+STATE.user.uid);
  const s = await ref.once('value');
  if(s.val()){ await ref.remove(); }
  else { await ref.set(true); }
}

async function deletePost(id){ if(!confirm('Excluir?')) return; await db.ref('posts/'+id).remove(); toast('Excluído','info'); }

// ============================================================
// CHAT - VERSÃO COMPLETA COM SALAS E PV
// ============================================================
let pvChatUser = null;
let pvChatListener = null;
let roomListener = null;

// Carregar salas e PVs
function loadChat() {
  // Carregar salas
  db.ref('chat_rooms').on('value', (snap) => {
    const rooms = snap.val();
    const container = document.getElementById('rooms-list');
    if (!container) return;
    
    if (!rooms) {
      container.innerHTML = '<div style="padding:12px; color:var(--text3); font-size:12px; text-align:center;">Nenhuma sala</div>';
      return;
    }
    
    const arr = Object.entries(rooms).map(([id, r]) => ({ id, ...r }));
    container.innerHTML = arr.map(r => `
      <div onclick="joinRoom('${r.id}')" 
           style="padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:0.2s;
                  background:${STATE.currentRoom === r.id ? 'var(--hover)' : 'transparent'};"
           onmouseover="this.style.background='var(--hover)'" 
           onmouseout="this.style.background='${STATE.currentRoom === r.id ? 'var(--hover)' : 'transparent'}'">
        <div style="font-weight:600; font-size:13px; color:var(--text);"># ${esc(r.nome)}</div>
        <div style="font-size:11px; color:var(--text3);">${esc(r.descricao || '')}</div>
      </div>
    `).join('');
  });

  // Carregar PVs recentes
  loadPVList();
}

async function loadPVList() {
  const container = document.getElementById('pv-list');
  if (!container || !STATE.user) return;
  
  // Buscar todas as conversas privadas do usuário
  const snap = await db.ref('private_chats').once('value');
  const chats = snap.val();
  
  if (!chats) {
    container.innerHTML = '<div style="padding:12px; color:var(--text3); font-size:12px; text-align:center;">Nenhuma conversa</div>';
    return;
  }
  
  // Filtrar chats que incluem o usuário atual
  const userChats = Object.entries(chats).filter(([chatId]) => {
    const parts = chatId.split('_');
    return parts.includes(STATE.user.uid);
  });
  
  if (!userChats.length) {
    container.innerHTML = '<div style="padding:12px; color:var(--text3); font-size:12px; text-align:center;">Nenhuma conversa</div>';
    return;
  }
  
  // Pegar informações dos outros usuários
  let html = '';
  for (const [chatId, msgs] of userChats) {
    const parts = chatId.split('_');
    const otherUid = parts.find(p => p !== STATE.user.uid);
    if (!otherUid) continue;
    
    const userSnap = await db.ref('usuarios/' + otherUid).once('value');
    const u = userSnap.val();
    if (!u) continue;
    
    // Última mensagem
    const msgsArr = Object.values(msgs || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const lastMsg = msgsArr[0];
    
    html += `
      <div onclick="openPVinChat('${otherUid}')" 
           style="padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:0.2s;"
           onmouseover="this.style.background='var(--hover)'" 
           onmouseout="this.style.background='transparent'">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:30px; height:30px; border-radius:50%; background:#6C5CE7; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0;">${u.avatar || '?'}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:12px; color:var(--text);">${esc(u.username || '?')}</div>
            <div style="font-size:10px; color:var(--text3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(lastMsg?.texto || 'Nova conversa')}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html || '<div style="padding:12px; color:var(--text3); font-size:12px; text-align:center;">Nenhuma conversa</div>';
}

// Entrar em sala
function joinRoom(id) {
  // Limpar PV se estiver aberto
  closePrivateChatInRoom(false);
  
  STATE.currentRoom = id;
  
  db.ref('chat_rooms/' + id).once('value').then(s => {
    const r = s.val();
    if (r) document.getElementById('chat-room-name').textContent = '# ' + r.nome;
  });
  
  document.getElementById('chat-no-room').style.display = 'none';
  document.getElementById('chat-room-view').style.display = 'flex';
  document.getElementById('pv-chat-view').style.display = 'none';
  
  // Remover listener antigo
  if (roomListener) { try { roomListener(); } catch(e) {} }
  
  // Ouvir mensagens da sala
  roomListener = db.ref('chat_messages/' + id).on('value', (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (!msgs) {
      container.innerHTML = '<div style="text-align:center; color:var(--text3); padding:30px;">💬 Nenhuma mensagem ainda. Diga olá!</div>';
      return;
    }
    
    const arr = Object.entries(msgs).map(([mid, m]) => ({ id: mid, ...m }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    
    container.innerHTML = arr.map(m => {
      const isMine = m.autorId === STATE.user?.uid;
      return `
        <div style="display:flex; flex-direction:${isMine ? 'row-reverse' : 'row'}; gap:8px; align-items:flex-end;">
          <div style="width:28px; height:28px; border-radius:50%; background:#6C5CE7; color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0;"
               onclick="${!isMine ? "openPVinChat('" + m.autorId + "')" : ''}" 
               title="${!isMine ? 'Enviar mensagem privada' : ''}">
            ${esc(m.avatar || '?')}
          </div>
          <div style="max-width:70%;">
            ${!isMine ? `<div style="font-size:10px; color:var(--text3); margin-bottom:2px;">${esc(m.autorNome || '?')}</div>` : ''}
            <div style="padding:10px 14px; border-radius:18px; font-size:14px; 
                        background:${isMine ? '#6C5CE7' : 'var(--input-bg)'}; 
                        color:${isMine ? 'white' : 'var(--text)'}; 
                        border-radius:${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};">
              ${esc(m.texto)}
            </div>
            <div style="font-size:9px; color:var(--text3); margin-top:2px; text-align:${isMine ? 'right' : 'left'};">${ago(m.createdAt)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
  });
}

// Sair da sala
function leaveRoom() {
  if (roomListener) { try { roomListener(); } catch(e) {} }
  STATE.currentRoom = null;
  
  document.getElementById('chat-no-room').style.display = 'flex';
  document.getElementById('chat-room-view').style.display = 'none';
}

// Abrir PV dentro do chat
function openPVinChat(uid) {
  if (uid === STATE.user?.uid) return;
  
  pvChatUser = uid;
  
  db.ref('usuarios/' + uid).once('value').then(snap => {
    const u = snap.val();
    if (u) {
      document.getElementById('pv-chat-avatar').textContent = u.avatar || '?';
      document.getElementById('pv-chat-name').textContent = u.username || 'Usuário';
    }
  });
  
  document.getElementById('chat-room-view').style.display = 'none';
  document.getElementById('chat-no-room').style.display = 'none';
  document.getElementById('pv-chat-view').style.display = 'flex';
  
  const chatId = [STATE.user.uid, uid].sort().join('_');
  
  if (pvChatListener) { try { pvChatListener(); } catch(e) {} }
  
  pvChatListener = db.ref('private_chats/' + chatId).on('value', (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('pv-chat-messages');
    if (!container) return;
    
    if (!msgs) {
      container.innerHTML = '<div style="text-align:center; color:var(--text3); padding:30px;">💬 Envie a primeira mensagem!</div>';
      return;
    }
    
    const arr = Object.entries(msgs).map(([mid, m]) => ({ id: mid, ...m }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    
    container.innerHTML = arr.map(m => {
      const isMine = m.autorId === STATE.user?.uid;
      return `
        <div style="display:flex; flex-direction:${isMine ? 'row-reverse' : 'row'}; gap:8px; align-items:flex-end;">
          <div style="width:24px; height:24px; border-radius:50%; background:#6C5CE7; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0;">
            ${esc(m.avatar || '?')}
          </div>
          <div style="max-width:75%; padding:10px 14px; border-radius:18px; font-size:14px;
                      background:${isMine ? '#6C5CE7' : 'var(--input-bg)'}; 
                      color:${isMine ? 'white' : 'var(--text)'}; 
                      border-radius:${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};">
            ${esc(m.texto)}
          </div>
        </div>
      `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
  });
  
  document.getElementById('pv-chat-input').value = '';
  setTimeout(() => document.getElementById('pv-chat-input')?.focus(), 300);
}

// Fechar PV
function closePrivateChatInRoom(showRoom = true) {
  if (pvChatListener) { try { pvChatListener(); } catch(e) {} }
  pvChatListener = null;
  pvChatUser = null;
  
  document.getElementById('pv-chat-view').style.display = 'none';
  
  if (showRoom && STATE.currentRoom) {
    document.getElementById('chat-room-view').style.display = 'flex';
  } else if (showRoom) {
    document.getElementById('chat-no-room').style.display = 'flex';
  }
}

// Enviar mensagem na sala
async function sendChatMsg() {
  const texto = document.getElementById('chat-msg-input')?.value?.trim();
  if (!texto || !STATE.currentRoom) return;
  
  await db.ref('chat_messages/' + STATE.currentRoom).push({
    texto,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '?',
    createdAt: Date.now()
  });
  
  await db.ref('chat_rooms/' + STATE.currentRoom).update({
    lastMessage: texto.substring(0, 50),
    lastMessageAt: Date.now()
  });
  
  document.getElementById('chat-msg-input').value = '';
}

// Enviar mensagem PV
async function sendPvChatMsg() {
  const texto = document.getElementById('pv-chat-input')?.value?.trim();
  if (!texto || !pvChatUser) return;
  
  const chatId = [STATE.user.uid, pvChatUser].sort().join('_');
  
  await db.ref('private_chats/' + chatId).push({
    texto,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '?',
    createdAt: Date.now()
  });
  
  // Notificar
  await db.ref('notificacoes/' + pvChatUser).push({
    mensagem: '💬 ' + STATE.userData.username + ' te enviou uma mensagem privada!',
    tipo: 'message',
    lida: false,
    chatId: chatId,
    fromUid: STATE.user.uid,
    createdAt: Date.now()
  });
  
  document.getElementById('pv-chat-input').value = '';
}

// Criar sala
async function criarSala() {
  const nome = document.getElementById('ns-nome')?.value?.trim();
  const desc = document.getElementById('ns-desc')?.value?.trim();
  if (!nome) { showToast('Nome obrigatório', 'error'); return; }
  
  const ref = await db.ref('chat_rooms').push({
    nome, descricao: desc,
    criadorId: STATE.user.uid,
    createdAt: Date.now()
  });
  
  closeModal('modal-sala');
  document.getElementById('ns-nome').value = '';
  document.getElementById('ns-desc').value = '';
  joinRoom(ref.key);
  showToast('Sala criada! 💬', 'success');
}
// ========== RANKING ==========
function loadRanking(){
  db.ref('usuarios').on('value',(snap)=>{
    const u=snap.val(); if(!u) return;
    const arr=Object.values(u).sort((a,b)=>(b.points||0)-(a.points||0));
    const setP=(n,u)=>{ if(!u)return; txt('podio'+n+'-av',u.avatar||'?'); txt('podio'+n+'-name',(u.username||'').split(' ')[0]); txt('podio'+n+'-pts',fmt(u.points)); };
    setP(1,arr[0]); setP(2,arr[1]); setP(3,arr[2]);
    const pos=arr.findIndex(u=>u.uid===STATE.user?.uid);
    txt('my-rank-num',pos>=0?'#'+(pos+1):'#--'); txt('my-rank-pts',fmt(arr[pos]?.points||0));
    const c=$('ranking-list'); if(!c) return;
    c.innerHTML=arr.slice(0,50).map((u,i)=>`
      <div onclick="verPerfil('${u.uid}')" style="background:white; border-radius:10px; padding:12px; margin-bottom:6px; display:flex; align-items:center; gap:10px; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.04); ${u.uid===STATE.user?.uid?'background:#ede9fe;':''}">
        <span style="font-weight:800; color:#888; width:24px;">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>
        <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${esc(u.avatar||'?')}</div>
        <div style="flex:1;"><strong>${esc(u.username||'?')}</strong> ${u.uid===STATE.user?.uid?'(Você)':''}</div>
        <span style="font-weight:700;color:#6C5CE7;">${fmt(u.points)} pts</span>
      </div>
    `).join('');
  });
}

// ========== PERFIL ==========
let viewingUserId=null;

async function verPerfil(uid){
  if(uid===STATE.user?.uid){ showScreen('perfil'); return; }
  viewingUserId=uid;
  const snap=await db.ref('usuarios/'+uid).once('value');
  const u=snap.val(); if(!u) return;
  const c=$('user-profile-content'); if(!c) return;
  c.innerHTML=`
    <div style="text-align:center;">
      <div style="font-size:60px;">${u.avatar||'🎓'}</div>
      <h3>${esc(u.username||'?')}</h3>
      <p style="color:#888;">${esc(u.bio||'Sem bio')}</p>
      <div style="margin:10px 0;"><span style="background:#f0f0f0;padding:5px 12px;border-radius:15px;">⭐ ${fmt(u.points)}</span> <span style="background:#f0f0f0;padding:5px 12px;border-radius:15px;">👥 ${u.seguidores||0}</span></div>
      <button id="btn-follow-modal" onclick="toggleFollowUser('${uid}', this)" style="background:#6C5CE7;color:white;border:none;padding:10px 25px;border-radius:25px;cursor:pointer;font-weight:700;">Carregando...</button>
    </div>`;
  showModal('modal-user-profile');
  const fSnap=await db.ref('seguidores/'+STATE.user.uid+'/'+uid).once('value');
  const btn=$('btn-follow-modal');
  if(btn){ btn.textContent=fSnap.val()?'✅ Seguindo':'👥 Seguir'; btn.style.background=fSnap.val()?'#10b981':'#6C5CE7'; }
}

async function showFollowers(){
  const uid=viewingUserId||STATE.user?.uid; if(!uid) return;
  const snap=await db.ref('seguindo/'+uid).once('value');
  const data=snap.val();
  const c=$('seguidores-list'); if(!c) return;
  if(!data){ c.innerHTML='<div style="color:#888;padding:20px;">Nenhum seguidor</div>'; }
  else {
    let html='';
    for(const sid of Object.keys(data)){
      const uSnap=await db.ref('usuarios/'+sid).once('value');
      const u=uSnap.val();
      if(u) html+=`<div onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #eee;cursor:pointer;"><div style="width:35px;height:35px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;">${u.avatar||'?'}</div><div><strong>${esc(u.username||'?')}</strong></div></div>`;
    }
    c.innerHTML=html||'<div style="color:#888;padding:20px;">Nenhum</div>';
  }
  showModal('modal-seguidores');
}

async function showFollowing(){
  const uid=viewingUserId||STATE.user?.uid; if(!uid) return;
  const snap=await db.ref('seguidores/'+uid).once('value');
  const data=snap.val();
  const c=$('seguindo-list'); if(!c) return;
  if(!data){ c.innerHTML='<div style="color:#888;padding:20px;">Não segue ninguém</div>'; }
  else {
    let html='';
    for(const fid of Object.keys(data)){
      const uSnap=await db.ref('usuarios/'+fid).once('value');
      const u=uSnap.val();
      if(u) html+=`<div onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #eee;cursor:pointer;"><div style="width:35px;height:35px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;">${u.avatar||'?'}</div><div><strong>${esc(u.username||'?')}</strong></div></div>`;
    }
    c.innerHTML=html||'<div style="color:#888;padding:20px;">Nenhum</div>';
  }
  showModal('modal-seguindo');
}

async function loadPerfil(){
  if(!STATE.userData) return;
  const s=await db.ref('usuarios/'+STATE.user.uid).once('value');
  if(s.val()) STATE.userData=s.val();
  updateUI();
  viewingUserId=null; hide('follow-section');
  const u=STATE.userData;
  txt('pstat-pts',fmt(u.points)); txt('pstat-quizzes',u.quizzesPlayed||0);
  txt('pstat-materias',u.materiasCreated||0); txt('pstat-seguidores',u.seguidores||0);
  
  const segSnap=await db.ref('seguindo/'+STATE.user.uid).once('value');
  const segData=segSnap.val(); const segCount=segData?Object.keys(segData).length:0;
  const seguSnap=await db.ref('seguidores/'+STATE.user.uid).once('value');
  const seguData=seguSnap.val(); const seguCount=seguData?Object.keys(seguData).length:0;
  txt('count-seguidores',segCount); txt('count-seguindo',seguCount);
  
  const badges=[];
  if((u.points||0)>=1000) badges.push('<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">⭐ 1K</span>');
  if((u.quizzesPlayed||0)>=10) badges.push('<span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">🎮 Gamer</span>');
  if(u.isAdmin) badges.push('<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">⚙️ Admin</span>');
  if(!badges.length) badges.push('<span style="background:#f0f0f0;color:#666;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">🌱 Novato</span>');
  $('perfil-badges').innerHTML=badges.join('');
  
  const hs=await db.ref('historico/'+STATE.user.uid).once('value');
  const h=hs.val();
  const pc=$('perfil-historico');
  if(pc){
    if(!h){ pc.innerHTML='<div style="color:#888;padding:10px;">Nenhum quiz</div>'; return; }
    const arr=Object.entries(h).map(([id,x])=>({id,...x})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    pc.innerHTML=arr.map(x=>`
      <div style="background:white; border-radius:10px; padding:12px; margin-bottom:6px; display:flex; align-items:center; gap:10px;">
        <span>🎮</span><div style="flex:1;"><strong>${esc(x.quizNome||'Quiz')}</strong><br><span style="font-size:12px;color:#888;">${x.acertos}/${x.total} · ${x.pct}% · ${ago(x.createdAt)}</span></div>
        <span style="font-weight:800;color:#10b981;">+${fmt(x.score)}</span></div>
    `).join('');
  }
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs(){
  if(!STATE.user) return;
  db.ref('notificacoes/'+STATE.user.uid).on('value',(snap)=>{
    const n=snap.val();
    const badge=$('notif-badge');
    if(!badge) return;
    if(n){ const unread=Object.values(n).filter(x=>!x.lida).length;
      if(unread>0){ badge.textContent=unread>9?'9+':unread; badge.style.display='flex'; }
      else{badge.style.display='none';}
    }else{badge.style.display='none';}
  });
}

async function loadNotifs(){
  if(!STATE.user) return;
  const s=await db.ref('notificacoes/'+STATE.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n=s.val(); const c=$('notificacoes-list'); if(!c) return;
  if(!n){ c.innerHTML='<div style="color:#888;padding:20px;text-align:center;">🔔 Nenhuma notificação</div>'; return; }
  const arr=Object.entries(n).map(([id,x])=>({id,...x})).reverse();
  c.innerHTML=arr.map(x=>`
    <div style="background:white; border-radius:12px; padding:15px; margin-bottom:8px; ${!x.lida?'border-left:3px solid #6C5CE7;':''}">
      <div style="font-weight:600;">${esc(x.mensagem)}</div><div style="font-size:12px;color:#888;">${ago(x.createdAt)}</div></div>
  `).join('');
  const updates={}; arr.forEach(x=>{ if(!x.lida) updates[x.id+'/lida']=true; });
  if(Object.keys(updates).length) await db.ref('notificacoes/'+STATE.user.uid).update(updates);
}

async function marcarLidas(){
  if(!STATE.user) return;
  const s=await db.ref('notificacoes/'+STATE.user.uid).once('value');
  const n=s.val(); if(!n) return;
  const u={}; Object.keys(n).forEach(id=>{ u[id+'/lida']=true; });
  await db.ref('notificacoes/'+STATE.user.uid).update(u);
  toast('Todas lidas ✓','info');
}

// ========== PONTOS ==========
async function addPts(pts){
  if(!STATE.user) return;
  const s=await db.ref('usuarios/'+STATE.user.uid+'/points').once('value');
  const cur=s.val()||0, nw=cur+pts;
  await db.ref('usuarios/'+STATE.user.uid).update({points:nw});
  STATE.userData.points=nw; updateUI();
}

// ========== ADM ==========
async function loadAdm(){
  if(!STATE.userData?.isAdmin){ toast('Acesso negado','error'); return; }
  const us=await db.ref('usuarios').once('value'); const u=us.val(); txt('adm-users',u?Object.keys(u).length:0);
  const ps=await db.ref('posts').once('value'); const p=ps.val(); txt('adm-posts',p?Object.keys(p).length:0);
  admLoad('materias');
}

async function admLoad(tab, btn){
  STATE.admTab=tab;
  document.querySelectorAll('.adm-tab-btn').forEach(b=>{b.style.background='white'; b.style.color='#555';});
  if(btn){ btn.style.background='#6C5CE7'; btn.style.color='white'; }
  const c=$('adm-content-list'); if(!c) return;
  c.innerHTML='<div style="color:#888;padding:15px;">⏳ Carregando...</div>';
  
  if(tab==='materias'){
    const s=await db.ref('materias').once('value'); const data=s.val();
    if(data) c.innerHTML=Object.entries(data).map(([id,m])=>`
      <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:12px;border-radius:10px;margin-bottom:6px;">
        <div><strong>${m.icone||'📚'} ${esc(m.nome)}</strong></div>
        <button onclick="admDel('materias','${id}')" style="background:#fee2e2;color:#dc2626;border:none;padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;">🗑</button></div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhuma</div>';
  } else if(tab==='posts'){
    const s=await db.ref('posts').once('value'); const data=s.val();
    if(data) c.innerHTML=Object.entries(data).map(([id,p])=>`
      <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:12px;border-radius:10px;margin-bottom:6px;">
        <div><strong>${esc(p.autorNome||'?')}</strong>: ${esc((p.texto||'').substring(0,50))}</div>
        <button onclick="admDel('posts','${id}')" style="background:#fee2e2;color:#dc2626;border:none;padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;">🗑</button></div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhum</div>';
  } else if(tab==='usuarios'){
    const s=await db.ref('usuarios').once('value'); const data=s.val();
    if(data) c.innerHTML=Object.values(data).map(u=>`
      <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:12px;border-radius:10px;margin-bottom:6px;">
        <div><strong>${u.avatar||'?'} ${esc(u.username||'?')}</strong> · ${fmt(u.points)} pts</div>
        ${!u.isAdmin&&u.uid!==STATE.user?.uid?`<button onclick="admDelUser('${u.uid}')" style="background:#fee2e2;color:#dc2626;border:none;padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;">🗑</button>`:''}</div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhum</div>';
  } else { c.innerHTML='<div style="color:#888;padding:15px;">Use matérias/posts/usuários</div>'; }
}

async function admDel(path, id){ if(!confirm('Excluir?')) return; await db.ref(path+'/'+id).remove(); toast('Excluído','info'); admLoad(STATE.admTab); }
async function admDelUser(uid){ if(!confirm('Excluir permanentemente?')) return; await db.ref('usuarios/'+uid).remove(); await db.ref('historico/'+uid).remove(); await db.ref('notificacoes/'+uid).remove(); toast('Excluído','info'); admLoad('usuarios'); }
async function admAddPts(){ const pts=parseInt($('adm-add-pts')?.value); if(!pts||pts<=0){ toast('Valor inválido','error'); return; } await addPts(pts); $('adm-add-pts').value=''; toast('+'+fmt(pts)+' pontos!','success'); }

// ========== CLOSE MODALS ==========
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ document.querySelectorAll('[id^="modal-"]').forEach(m=>{ if(m.style.display==='flex') m.style.display='none'; }); } });
// ============================================================
// QUIZ NORMAL (Formulário tradicional)
// ============================================================
let questoesNormais = [];
let questaoCount = 0;

function addQuestaoNormal() {
  questaoCount++;
  const idx = questoesNormais.length;
  
  questoesNormais.push({
    pergunta: '',
    alternativas: ['', '', '', ''],
    correta: 0
  });

  const container = document.getElementById('qn-questoes-container');
  if (!container) return;

  const div = document.createElement('div');
  div.id = 'qn-questao-' + idx;
  div.style.cssText = 'background:var(--input-bg); border-radius:12px; padding:15px; margin-bottom:12px; border:2px solid var(--border);';
  
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <strong style="color:var(--text);">Questão ${idx + 1}</strong>
      ${idx > 0 ? `<button onclick="removerQuestaoNormal(${idx})" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 10px; border-radius:8px; cursor:pointer; font-weight:600; font-size:12px;">🗑 Remover</button>` : ''}
    </div>
    
    <div style="margin-bottom:10px;">
      <label style="font-size:11px; font-weight:600; color:var(--text3);">PERGUNTA</label>
      <input type="text" placeholder="Digite a pergunta..." oninput="questoesNormais[${idx}].pergunta = this.value" 
             style="width:100%; padding:8px; border:2px solid var(--border); background:var(--card); color:var(--text); border-radius:8px; outline:none; margin-top:4px;" />
    </div>

    <div style="margin-bottom:8px;">
      <label style="font-size:11px; font-weight:600; color:var(--text3);">ALTERNATIVAS (marque a correta)</label>
      ${['A', 'B', 'C', 'D'].map((letra, i) => `
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="radio" name="qn-correta-${idx}" value="${i}" ${i === 0 ? 'checked' : ''} 
                 onchange="questoesNormais[${idx}].correta = ${i}" style="width:18px; height:18px; cursor:pointer;" />
          <span style="font-weight:700; font-size:13px; color:var(--text); width:20px;">${letra})</span>
          <input type="text" placeholder="Alternativa ${letra}" oninput="questoesNormais[${idx}].alternativas[${i}] = this.value"
                 style="flex:1; padding:8px; border:2px solid var(--border); background:var(--card); color:var(--text); border-radius:8px; outline:none;" />
        </div>
      `).join('')}
    </div>
  `;

  container.appendChild(div);
}

function removerQuestaoNormal(idx) {
  if (questoesNormais.length <= 1) {
    showToast('Mínimo 1 questão!', 'info');
    return;
  }
  questoesNormais.splice(idx, 1);
  questaoCount--;
  
  const container = document.getElementById('qn-questoes-container');
  if (!container) return;
  
  // Reconstruir visual
  const todasQuestoes = [...questoesNormais];
  container.innerHTML = '';
  questoesNormais = [];
  questaoCount = 0;
  
  todasQuestoes.forEach(q => {
    const i = questoesNormais.length;
    questoesNormais.push(q);
    questaoCount++;
    
    const div = document.createElement('div');
    div.id = 'qn-questao-' + i;
    div.style.cssText = 'background:var(--input-bg); border-radius:12px; padding:15px; margin-bottom:12px; border:2px solid var(--border);';
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <strong style="color:var(--text);">Questão ${i + 1}</strong>
        ${i > 0 ? `<button onclick="removerQuestaoNormal(${i})" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 10px; border-radius:8px; cursor:pointer; font-weight:600; font-size:12px;">🗑 Remover</button>` : ''}
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px; font-weight:600; color:var(--text3);">PERGUNTA</label>
        <input type="text" value="${esc(q.pergunta)}" oninput="questoesNormais[${i}].pergunta = this.value" 
               style="width:100%; padding:8px; border:2px solid var(--border); background:var(--card); color:var(--text); border-radius:8px; outline:none; margin-top:4px;" />
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px; font-weight:600; color:var(--text3);">ALTERNATIVAS (marque a correta)</label>
        ${['A', 'B', 'C', 'D'].map((letra, j) => `
          <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <input type="radio" name="qn-correta-${i}" value="${j}" ${q.correta === j ? 'checked' : ''} 
                   onchange="questoesNormais[${i}].correta = ${j}" style="width:18px; height:18px; cursor:pointer;" />
            <span style="font-weight:700; font-size:13px; color:var(--text); width:20px;">${letra})</span>
            <input type="text" value="${esc(q.alternativas[j] || '')}" oninput="questoesNormais[${i}].alternativas[${j}] = this.value"
                   style="flex:1; padding:8px; border:2px solid var(--border); background:var(--card); color:var(--text); border-radius:8px; outline:none;" />
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });
}

function salvarQuizNormal() {
  const nome = document.getElementById('qn-nome')?.value?.trim();
  const tempo = parseInt(document.getElementById('qn-tempo')?.value) || 30;

  if (!nome) { showToast('Nome do quiz é obrigatório', 'error'); return; }
  if (!STATE.currentMateriaId) { showToast('Acesse uma matéria primeiro!', 'error'); return; }

  const validas = questoesNormais.filter(q => 
    q.pergunta.trim() && 
    q.alternativas.filter(a => a.trim()).length >= 2
  );

  if (validas.length === 0) {
    showToast('Adicione pelo menos 1 questão completa!', 'error');
    return;
  }

  const quiz = {
    nome,
    tempo,
    materiaId: STATE.currentMateriaId,
    questoes: validas,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    totalPlays: 0,
    createdAt: Date.now()
  };

  db.ref('quizzes/' + STATE.currentMateriaId).push(quiz).then(() => {
    closeModal('modal-quiz-normal');
    
    document.getElementById('qn-nome').value = '';
    document.getElementById('qn-tempo').value = '30';
    document.getElementById('qn-questoes-container').innerHTML = '';
    questoesNormais = [];
    questaoCount = 0;
    
    addPts(30);
    showToast('Quiz "' + nome + '" criado com ' + validas.length + ' questões! 🎮', 'success');
    
    // Recarregar quizzes
    if (STATE.currentMateriaId) {
      db.ref('quizzes/' + STATE.currentMateriaId).once('value').then(snap => {
        const q = snap.val();
        const c = document.getElementById('quizzes-materia');
        if (c && q) {
          c.innerHTML = Object.entries(q).map(([qid, quiz]) => `
            <div style="background:var(--card); border-radius:12px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
              <div>
                <strong style="color:var(--text);">🎮 ${esc(quiz.nome)}</strong>
                <br><span style="font-size:12px;color:var(--text3);">${quiz.questoes?.length || 0} questões · ${quiz.tempo || 30}s</span>
              </div>
              <button onclick="startQuiz('${STATE.currentMateriaId}','${qid}')" 
                      style="background:#6C5CE7; color:white; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">▶ Jogar</button>
            </div>
          `).join('');
        }
      });
    }
  }).catch(err => {
    showToast('Erro ao salvar quiz', 'error');
    console.error(err);
  });
}

// ============================================================
// SOBRESCREVER showModal PARA INICIAR QUIZ NORMAL
// ============================================================
const originalShowModal = showModal;
showModal = function(id) {
  originalShowModal(id);
  
  if (id === 'modal-quiz-normal') {
    questoesNormais = [];
    questaoCount = 0;
    const container = document.getElementById('qn-questoes-container');
    if (container) container.innerHTML = '';
    const nomeEl = document.getElementById('qn-nome');
    const tempoEl = document.getElementById('qn-tempo');
    if (nomeEl) nomeEl.value = '';
    if (tempoEl) tempoEl.value = '30';
    addQuestaoNormal();
  }
};

// ============================================================
// SOBRESCREVER closeModal PARA LIMPAR PV
// ============================================================
const originalCloseModal = closeModal;
closeModal = function(id) {
  if (id === 'modal-private-chat') {
    if (privateChatListener) {
      try { privateChatListener(); } catch(e) {}
      privateChatListener = null;
    }
    privateChatUser = null;
  }
  originalCloseModal(id);
};

// ============================================================
// CHAT PRIVADO (PV) - MODAL
// ============================================================
let privateChatUser = null;
let privateChatListener = null;

async function openPrivateChatModal(uid) {
  if (uid === STATE.user?.uid) {
    showToast('Não pode enviar mensagem para si mesmo', 'info');
    return;
  }

  privateChatUser = uid;
  
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;

  document.getElementById('pv-avatar').textContent = u.avatar || '?';
  document.getElementById('pv-name').textContent = u.username || 'Usuário';
  
  const chatId = [STATE.user.uid, uid].sort().join('_');
  
  if (privateChatListener) {
    try { privateChatListener(); } catch(e) {}
  }

  privateChatListener = db.ref('private_chats/' + chatId).on('value', (snap) => {
    const msgs = snap.val();
    const container = document.getElementById('pv-messages');
    if (!container) return;

    if (!msgs) {
      container.innerHTML = '<div style="text-align:center; color:var(--text3); padding:20px;">💬 Diga olá!</div>';
      return;
    }

    const arr = Object.entries(msgs).map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    container.innerHTML = arr.map(m => `
      <div style="display:flex; flex-direction:${m.autorId === STATE.user?.uid ? 'row-reverse' : 'row'}; gap:8px; margin-bottom:8px; align-items:flex-end;">
        <div style="width:28px; height:28px; border-radius:50%; background:#6C5CE7; color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0;">
          ${esc(m.avatar || '?')}
        </div>
        <div style="max-width:75%; padding:10px 14px; border-radius:18px; font-size:14px; 
                    background:${m.autorId === STATE.user?.uid ? '#6C5CE7' : 'var(--input-bg)'}; 
                    color:${m.autorId === STATE.user?.uid ? 'white' : 'var(--text)'}; 
                    border-radius:${m.autorId === STATE.user?.uid ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};">
          ${esc(m.texto)}
          <div style="font-size:9px; opacity:0.7; margin-top:3px; text-align:${m.autorId === STATE.user?.uid ? 'right' : 'left'};">${ago(m.createdAt)}</div>
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  });

  document.getElementById('pv-input').value = '';
  document.getElementById('pv-messages').innerHTML = '<div style="text-align:center; color:var(--text3); padding:20px;">⏳ Carregando...</div>';
  
  showModal('modal-private-chat');
  setTimeout(() => document.getElementById('pv-input')?.focus(), 300);
}

async function sendPrivateMsg() {
  const texto = document.getElementById('pv-input')?.value?.trim();
  if (!texto || !privateChatUser) return;

  const chatId = [STATE.user.uid, privateChatUser].sort().join('_');

  await db.ref('private_chats/' + chatId).push({
    texto,
    autorId: STATE.user.uid,
    autorNome: STATE.userData.username,
    avatar: STATE.userData.avatar || '?',
    createdAt: Date.now()
  });

  await db.ref('notificacoes/' + privateChatUser).push({
    mensagem: '💬 ' + STATE.userData.username + ' te enviou uma mensagem!',
    tipo: 'message',
    lida: false,
    chatId: chatId,
    fromUid: STATE.user.uid,
    createdAt: Date.now()
  });

  document.getElementById('pv-input').value = '';
}

// ============================================================
// CONVIDAR USUÁRIOS
// ============================================================
let selectedInviteUsers = [];

async function showInviteModal() {
  if (!STATE.currentRoom) {
    showToast('Entre em uma sala primeiro!', 'info');
    return;
  }
  
  selectedInviteUsers = [];
  document.getElementById('invite-search').value = '';
  updateInviteSelected();
  await loadUsersToInvite();
  showModal('modal-invite');
}

async function loadUsersToInvite(filter = '') {
  const container = document.getElementById('invite-users-list');
  if (!container) return;

  const snap = await db.ref('usuarios').once('value');
  const users = snap.val();
  if (!users) {
    container.innerHTML = '<div style="color:var(--text3); padding:15px;">Nenhum usuário</div>';
    return;
  }

  let arr = Object.entries(users).map(([uid, u]) => ({ uid, ...u }))
    .filter(u => u.uid !== STATE.user?.uid);

  if (filter) {
    const term = filter.toLowerCase();
    arr = arr.filter(u => (u.username || '').toLowerCase().includes(term));
  }

  if (!arr.length) {
    container.innerHTML = '<div style="color:var(--text3); padding:15px;">Nenhum encontrado</div>';
    return;
  }

  container.innerHTML = arr.map(u => `
    <div onclick="toggleInviteUser('${u.uid}', this)" 
         style="display:flex; align-items:center; gap:10px; padding:10px; cursor:pointer; border-radius:10px; margin-bottom:4px;
                background:${selectedInviteUsers.includes(u.uid) ? 'var(--hover)' : 'transparent'};">
      <div style="width:35px; height:35px; border-radius:50%; background:#6C5CE7; color:white; display:flex; align-items:center; justify-content:center; font-weight:700;">${u.avatar || '?'}</div>
      <div style="flex:1; color:var(--text);">
        <strong>${esc(u.username || '?')}</strong>
        <div style="font-size:11px; color:var(--text3);">⭐ ${fmt(u.points || 0)} pts</div>
      </div>
      <span style="font-size:20px; color:${selectedInviteUsers.includes(u.uid) ? '#10b981' : 'var(--text3)'};">
        ${selectedInviteUsers.includes(u.uid) ? '✅' : '○'}
      </span>
    </div>
  `).join('');
}

function toggleInviteUser(uid, element) {
  const index = selectedInviteUsers.indexOf(uid);
  if (index > -1) {
    selectedInviteUsers.splice(index, 1);
    element.style.background = 'transparent';
    const check = element.querySelector('span:last-child');
    if (check) { check.textContent = '○'; check.style.color = 'var(--text3)'; }
  } else {
    selectedInviteUsers.push(uid);
    element.style.background = 'var(--hover)';
    const check = element.querySelector('span:last-child');
    if (check) { check.textContent = '✅'; check.style.color = '#10b981'; }
  }
  updateInviteSelected();
}

function updateInviteSelected() {
  const el = document.getElementById('invite-selected');
  if (el) {
    el.innerHTML = selectedInviteUsers.length > 0
      ? `<span style="font-size:13px; color:var(--text);">✅ ${selectedInviteUsers.length} usuário(s)</span>`
      : '<span style="font-size:12px; color:var(--text3);">Selecionados: 0</span>';
  }
}

function searchUsersToInvite() {
  const term = document.getElementById('invite-search')?.value || '';
  loadUsersToInvite(term);
}

async function sendInvites() {
  if (!selectedInviteUsers.length) {
    showToast('Selecione pelo menos 1 usuário', 'info');
    return;
  }
  if (!STATE.currentRoom) {
    showToast('Entre em uma sala primeiro!', 'error');
    return;
  }

  const roomSnap = await db.ref('chat_rooms/' + STATE.currentRoom).once('value');
  const room = roomSnap.val();
  const roomName = room?.nome || 'Sala';

  for (const uid of selectedInviteUsers) {
    await db.ref('notificacoes/' + uid).push({
      mensagem: '👥 ' + STATE.userData.username + ' te convidou para: ' + roomName + '!',
      tipo: 'invite',
      lida: false,
      roomId: STATE.currentRoom,
      roomName: roomName,
      createdAt: Date.now()
    });
  }

  showToast('Convites enviados! 📨', 'success');
  closeModal('modal-invite');
  selectedInviteUsers = [];
}

// ============================================================
// VER PERFIL (COM BOTÃO DE CHAT)
// ============================================================
async function verPerfil(uid) {
  if (uid === STATE.user?.uid) {
    showScreen('perfil');
    return;
  }
  
  viewingUserId = uid;
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return;
  
  const content = document.getElementById('user-profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:60px;">${u.avatar || '🎓'}</div>
      <h3 style="color:var(--text); margin:10px 0;">${esc(u.username || '?')}</h3>
      <p style="color:var(--text3); font-size:14px;">${esc(u.bio || 'Sem bio')}</p>
      <div style="margin:10px 0;">
        <span style="background:var(--hover); color:var(--text); padding:5px 12px; border-radius:15px; font-weight:600; font-size:13px;">⭐ ${fmt(u.points || 0)} pts</span>
        <span style="background:var(--hover); color:var(--text); padding:5px 12px; border-radius:15px; font-weight:600; font-size:13px; margin-left:5px;">👥 ${u.seguidores || 0} seguidores</span>
      </div>
      <button id="btn-follow-modal" onclick="toggleFollowUser('${uid}', this)" 
              style="width:100%; padding:12px; background:#6C5CE7; color:white; border:none; border-radius:25px; cursor:pointer; font-weight:700; font-size:14px; margin-top:5px;">
        Carregando...
      </button>
      <button onclick="closeModal('modal-user-profile'); openPrivateChatModal('${uid}')" 
              style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:25px; cursor:pointer; font-weight:700; font-size:14px; margin-top:8px;">
        💬 Enviar Mensagem
      </button>
    </div>
  `;
  
  showModal('modal-user-profile');
  
  const fSnap = await db.ref('seguidores/' + STATE.user.uid + '/' + uid).once('value');
  const btn = document.getElementById('btn-follow-modal');
  if (btn) {
    if (fSnap.val()) {
      btn.textContent = '✅ Seguindo';
      btn.style.background = '#10b981';
    } else {
      btn.textContent = '👥 Seguir';
      btn.style.background = '#6C5CE7';
    }
  }
}

// ============================================================
// NOTIFICAÇÕES - DATA ATTRIBUTES
// ============================================================
const _originalLoadNotifs = loadNotifs;
loadNotifs = async function() {
  if (!STATE.user) return;
  const s = await db.ref('notificacoes/' + STATE.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = s.val(); 
  const c = document.getElementById('notificacoes-list'); 
  if (!c) return;
  
  if (!n) { 
    c.innerHTML = '<div style="color:var(--text3); padding:20px; text-align:center;">🔔 Nenhuma notificação</div>'; 
    return; 
  }
  
  const arr = Object.entries(n).map(([id, x]) => ({ id, ...x })).reverse();
  c.innerHTML = arr.map(x => `
    <div data-room="${x.roomId || ''}" data-chat="${x.chatId || ''}" 
         style="background:var(--card); border-radius:12px; padding:15px; margin-bottom:8px; cursor:${(x.roomId || x.chatId) ? 'pointer' : 'default'}; 
                ${!x.lida ? 'border-left:3px solid #6C5CE7;' : ''} ${(x.roomId || x.chatId) ? 'background:var(--hover);' : ''}"
         onclick="${x.roomId ? "showScreen('chat'); setTimeout(()=>joinRoom('"+x.roomId+"'), 500);" : ''}${x.chatId ? "openPrivateChatModal('"+x.fromUid+"');" : ''}">
      <div style="font-weight:600; font-size:14px; color:var(--text);">${esc(x.mensagem)}</div>
      <div style="font-size:12px; color:var(--text3);">${ago(x.createdAt)}</div>
    </div>
  `).join('');
  
  const updates = {}; 
  arr.forEach(x => { if (!x.lida) updates[x.id + '/lida'] = true; });
  if (Object.keys(updates).length) await db.ref('notificacoes/' + STATE.user.uid).update(updates);
};
// ============================================================
// UPLOAD DE IMAGENS (ImgBB)
// ============================================================
const IMGBB_API_KEY = '86427cccd2a94fb42a0754ffd7f19e79'; // Substitua pela sua key

async function uploadImage(file) {
  // Converte o arquivo para Base64
  const base64 = await fileToBase64(file);
  
  // Prepara o formulário
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64.split(',')[1]); // Remove o prefixo "data:image/..."
  
  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        url: data.data.url,           // URL direta da imagem
        display_url: data.data.display_url, // URL da página
        delete_url: data.data.delete_url    // URL para deletar
      };
    } else {
      console.error('Erro no upload:', data);
      return null;
    }
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

// Converte arquivo para Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadAvatar(input) {
  if (!input.files[0]) return;
  showToast('⏳ Enviando foto...', 'info');
  const result = await uploadImage(input.files[0]);
  if (result) {
    await db.ref('usuarios/' + STATE.user.uid).update({ avatar: result.url });
    STATE.userData.avatar = result.url;
    updateUI();
    showToast('Foto atualizada! 📷', 'success');
  } else {
    showToast('Erro ao enviar foto', 'error');
  }
}
document.addEventListener('change', function(e) {
  if (e.target.id === 'post-imagem' && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      const preview = document.getElementById('post-image-preview');
      if (preview) {
        preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%; max-height:200px; border-radius:10px; margin-top:5px;" />`;
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});
console.log('✅ Sexta-Feira Studies PRONTO!');