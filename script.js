/* ============================================================
   Sexta-Feira Studies — script.js
   COMPLETO, FUNCIONAL, SEM SPLASH
   ============================================================ */
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
function isHidden(id){ const e=$(id); return !e || e.style.display==='none'; }

function toast(msg, type){
  const c = $('toast-container'); if(!c) return;
  const icons = {success:'✅', error:'❌', info:'ℹ️'};
  const d = document.createElement('div');
  d.style.cssText = 'background:white; padding:12px 18px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.15); font-weight:600; font-size:14px; animation:slideIn 0.3s ease;';
  d.innerHTML = (icons[type]||'') + ' ' + esc(msg);
  c.appendChild(d);
  setTimeout(()=>{ d.style.animation='slideOut 0.3s ease forwards'; setTimeout(()=>d.remove(),300); },3000);
}

// ========== AUTH ==========
function switchTab(t){
  document.querySelectorAll('.auth-tab-btn').forEach(b=>{
    b.style.background = 'transparent';
    b.style.color = '#888';
  });
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
  if(!u||!p){ show('login-error'); $('login-error').textContent='Preencha todos os campos'; return; }
  
  const snap = await db.ref('usuarios').orderByChild('username').equalTo(u).once('value');
  const users = snap.val();
  if(!users){ show('login-error'); $('login-error').textContent='Usuário não encontrado'; return; }
  
  const uid = Object.keys(users)[0];
  const data = users[uid];
  if(data.password !== p){ show('login-error'); $('login-error').textContent='Senha incorreta'; return; }
  
  try {
    await auth.signInWithEmailAndPassword(data.email, p);
  } catch(e){
    try { await auth.createUserWithEmailAndPassword(data.email, p); } catch(e2){}
  }
}

async function handleRegister(){
  const uname = $('reg-username')?.value?.trim();
  const email = $('reg-email')?.value?.trim();
  const pw = $('reg-password')?.value;
  const cf = $('reg-confirm')?.value;
  
  if(!uname||!email||!pw||!cf){ show('reg-error'); $('reg-error').textContent='Preencha todos os campos'; return; }
  if(uname.length<3){ show('reg-error'); $('reg-error').textContent='Nome muito curto (mín. 3)'; return; }
  if(pw.length<6){ show('reg-error'); $('reg-error').textContent='Senha muito curta (mín. 6)'; return; }
  if(pw!==cf){ show('reg-error'); $('reg-error').textContent='Senhas não coincidem'; return; }
  
  const s1 = await db.ref('usuarios').orderByChild('username').equalTo(uname).once('value');
  if(s1.val()){ show('reg-error'); $('reg-error').textContent='Nome de usuário já está em uso!'; return; }
  
  const s2 = await db.ref('usuarios').orderByChild('email').equalTo(email).once('value');
  if(s2.val()){ show('reg-error'); $('reg-error').textContent='E-mail já cadastrado!'; return; }
  
  let cred;
  try { cred = await auth.createUserWithEmailAndPassword(email, pw); }
  catch(e){ show('reg-error'); $('reg-error').textContent='Erro: '+e.message; return; }
  
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
  }
});

// ========== UI ==========
function updateUI(){
  const u = STATE.userData; if(!u) return;
  txt('sidebar-name', u.username); txt('sidebar-pts', fmt(u.points));
  txt('sidebar-avatar', u.avatar); txt('topbar-avatar', u.avatar);
  txt('pc-avatar', u.avatar); txt('perfil-avatar', u.avatar);
  txt('perfil-name', u.username); txt('perfil-email', u.email);
  txt('home-greeting', 'Olá, '+(u.username||'Estudante').split(' ')[0]+'! 👋');
}

// ========== NAVEGAÇÃO ==========
function showScreen(name){
  document.querySelectorAll('#main-content > div').forEach(d=>d.style.display='none');
  const t = $('screen-'+name); if(t) t.style.display='';
  
  document.querySelectorAll('.nav-link').forEach(a=>a.style.color='#555');
  document.querySelectorAll('.bnav-item').forEach(a=>a.style.color='#888');
  
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
  const mat = ms.val();
  let cnt=0;
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
  const tipo = {post:'💬',dica:'💡',duvida:'❓',atividade:'⚡'}[p.tipo]||'💬';
  return `
    <div style="background:white; border-radius:15px; padding:15px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${esc(p.avatar||p.autorAvatar||'?')}</div>
        <div style="flex:1;"><span style="font-weight:700;">${esc(p.autorNome||'?')}</span> <span style="color:#888;font-size:12px;">${ago(p.createdAt)}</span></div>
        <span style="font-size:11px;">${tipo}</span>
      </div>
      <div>${esc(p.texto)}</div>
      ${!compact?`<div style="margin-top:10px; display:flex; gap:12px;">
        <button onclick="likePost('${p.id}')" style="border:none;background:none;cursor:pointer;font-weight:600;color:${p.likes&&p.likes[STATE.user?.uid]?'#ef4444':'#888'};">❤️ ${p.likes?Object.keys(p.likes).length:0}</button>
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
    if(!arr.length){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">🔍 Nenhuma encontrada</div>'; return; }
    c.innerHTML = arr.map(m=>`
      <div onclick="openMateria('${m.id}')" style="background:white; border-radius:15px; padding:15px; margin-bottom:10px; cursor:pointer; display:flex; gap:12px; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <span style="font-size:35px;">${m.icone||'📚'}</span>
        <div style="flex:1;">
          <div style="font-weight:700;">${esc(m.nome)}</div>
          <div style="font-size:12px;color:#888;">${esc(m.descricao||'')}</div>
          <div style="font-size:11px;color:#888;margin-top:5px;">👤 ${esc(m.autorNome||'?')} · ${m.topicosCount||0} tópicos</div>
        </div>
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
      <div onclick="openTopico('${tid}')" style="background:white; border-radius:12px; padding:12px; margin-bottom:8px; cursor:pointer; display:flex; align-items:center; gap:10px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <span>📄</span>
        <div style="flex:1;"><div style="font-weight:600;">${esc(top.titulo)}</div><div style="font-size:11px;color:#888;">${esc(top.autorNome||'?')} · ${ago(top.createdAt)}</div></div>
        <span>→</span>
      </div>
    `).join('');
  });
  
  db.ref('quizzes/'+id).on('value',(snap)=>{
    const q = snap.val();
    const c = $('quizzes-materia'); if(!c) return;
    if(!q){ c.innerHTML='<div style="text-align:center;color:#888;padding:20px;">Nenhum quiz</div>'; return; }
    c.innerHTML = Object.entries(q).map(([qid,quiz])=>`
      <div style="background:white; border-radius:12px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
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
      <div style="background:#f9f9f9; border-radius:10px; padding:10px; margin-bottom:6px;">
        <strong>${esc(co.autorNome||'?')}</strong> <span style="font-size:11px;color:#888;">${ago(co.createdAt)}</span>
        <div>${esc(co.texto)}</div>
      </div>
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
    else if(l.startsWith('/c ')){
      const map={A:0,B:1,C:2,D:3};
      corr = map[l.substring(3).trim().toUpperCase()] ?? -1;
    }
    else if(l==='/f'){
      if(curQ&&alts.length>=2&&corr>=0){ curQ.alternativas=alts; curQ.correta=corr; questoes.push(curQ); curQ=null; alts=[]; corr=-1; }
    }
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
  
  STATE.quiz = {
    questions: shuffle([...q.questoes]), index:0, score:0, correct:0,
    timer:null, timeLeft:q.tempo||30, start:Date.now(), answers:[],
    nome:q.nome, mId, qId
  };
  showScreen('quiz-game');
  renderQ();
  await db.ref('quizzes/'+mId+'/'+qId).update({totalPlays:(q.totalPlays||0)+1});
}

function renderQ(){
  const g = STATE.quiz;
  if(g.index >= g.questions.length){ finishQ(); return; }
  const q = g.questions[g.index];
  const total = g.questions.length;
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
  g.timer = setInterval(()=>{
    g.timeLeft--;
    updateT();
    if(g.timeLeft<=0){ clearInterval(g.timer); selectA(-1); }
  },1000);
}

function updateT(){
  const e = $('quiz-timer');
  if(e){ e.textContent='⏱ '+STATE.quiz.timeLeft+'s'; e.style.color=STATE.quiz.timeLeft<=5?'#ef4444':'#856404'; }
}

function selectA(chosen){
  clearInterval(STATE.quiz.timer);
  const g = STATE.quiz;
  const q = g.questions[g.index];
  const correct = q.correta;
  const isCorrect = chosen===correct;
  
  document.querySelectorAll('#quiz-options button').forEach((b,i)=>{
    b.disabled=true;
    if(i===correct) b.style.cssText='background:#d1fae5; border-color:#10b981; color:#065f46;';
    if(i===chosen&&!isCorrect) b.style.cssText='background:#fee2e2; border-color:#ef4444; color:#991b1b;';
  });
  
  if(isCorrect){
    const pts = Math.max(10, Math.round(10+(g.timeLeft/30)*10));
    g.score+=pts; g.correct++;
    g.answers.push({pergunta:q.pergunta, chosen, correct, isCorrect:true, pts});
  } else {
    g.answers.push({pergunta:q.pergunta, chosen, correct, isCorrect:false, pts:0});
  }
  txt('quiz-score-live', g.score);
  
  setTimeout(()=>{ g.index++; renderQ(); },1500);
}

async function finishQ(){
  clearInterval(STATE.quiz.timer);
  const g = STATE.quiz;
  const total = g.questions.length;
  const elapsed = Math.round((Date.now()-g.start)/1000);
  const pct = Math.round((g.correct/total)*100);
  const bonus = pct>=90?50:pct>=70?30:pct>=50?15:0;
  const totalPts = g.score+bonus;
  
  await db.ref('historico/'+STATE.user.uid).push({
    quizNome:g.nome, score:totalPts, acertos:g.correct, total, pct, tempo:elapsed, createdAt:Date.now()
  });
  
  await addPts(totalPts);
  await db.ref('usuarios/'+STATE.user.uid).update({quizzesPlayed:(STATE.userData.quizzesPlayed||0)+1});
  
  await db.ref('posts').push({
    tipo:'atividade', texto:'completou o quiz "'+g.nome+'" com '+pct+'%!',
    autorId:STATE.user.uid, autorNome:STATE.userData.username, avatar:STATE.userData.avatar, createdAt:Date.now()
  });
  
  showScreen('resultado');
  const emoji = pct>=80?'🎉':pct>=60?'👍':pct>=40?'😅':'💪';
  const tit = pct>=80?'Excelente!':pct>=60?'Bom trabalho!':'Continue!';
  txt('resultado-emoji',emoji); txt('resultado-titulo',tit);
  txt('resultado-subtitulo', g.nome);
  txt('res-acertos', g.correct); txt('res-total', total);
  txt('res-pontos','+'+totalPts); txt('res-tempo', elapsed+'s');
  txt('resultado-pct', pct+'%');
  const f = $('resultado-barra-fill'); if(f) f.style.width=pct+'%';
  
  const r = $('resultado-review');
  if(r) r.innerHTML = g.answers.map(a=>`
    <div style="padding:10px; border-radius:8px; margin-bottom:5px; background:${a.isCorrect?'#d1fae5':'#fee2e2'}; border-left:3px solid ${a.isCorrect?'#10b981':'#ef4444'};">
      ${a.isCorrect?'✅':'❌'} ${esc(a.pergunta)} ${a.isCorrect?'<span style="float:right;font-weight:700;">+'+a.pts+'</span>':''}
    </div>
  `).join('');
}

function exitQuiz(){
  if(!confirm('Sair do quiz?')) return;
  clearInterval(STATE.quiz.timer);
  showScreen('materia-detalhe');
}

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
  loadFeed();
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
  const t = $('post-texto-modal')?.value?.trim();
  const tp = $('post-tipo-modal')?.value||'post';
  if(!t){ toast('Escreva algo','error'); return; }
  await db.ref('posts').push({ texto:t, tipo:tp, autorId:STATE.user.uid, autorNome:STATE.userData.username, avatar:STATE.userData.avatar, createdAt:Date.now() });
  closeModal('modal-post');
  $('post-texto-modal').value='';
  addPts(5);
  toast('Publicado!','success');
}

async function likePost(id){
  if(!STATE.user) return;
  const ref = db.ref('posts/'+id+'/likes/'+STATE.user.uid);
  const s = await ref.once('value');
  if(s.val()){ await ref.remove(); }
  else {
    await ref.set(true);
    const ps = await db.ref('posts/'+id).once('value');
    const p = ps.val();
    if(p&&p.autorId!==STATE.user.uid){
      await db.ref('notificacoes/'+p.autorId).push({
        mensagem:'❤️ '+STATE.userData.username+' curtiu seu post!', tipo:'like', lida:false, createdAt:Date.now()
      });
    }
  }
}

async function deletePost(id){
  if(!confirm('Excluir?')) return;
  await db.ref('posts/'+id).remove();
  toast('Excluído','info');
}

// ========== CHAT ==========
function loadChat(){
  db.ref('chat_rooms').on('value',(snap)=>{
    const rooms = snap.val();
    const c = $('rooms-list'); if(!c) return;
    if(!rooms){ c.innerHTML='<div style="padding:12px;color:#888;">Nenhuma sala</div>'; return; }
    c.innerHTML = Object.entries(rooms).map(([id,r])=>`
      <div onclick="joinRoom('${id}')" style="padding:12px; cursor:pointer; border-bottom:1px solid #eee; font-weight:600; ${STATE.currentRoom===id?'background:#ede9fe;':''}"># ${esc(r.nome)}</div>
    `).join('');
  });
}

function joinRoom(id){
  STATE.currentRoom=id;
  db.ref('chat_rooms/'+id).once('value').then(s=>{
    const r = s.val(); if(r) txt('chat-room-name','# '+r.nome);
  });
  hide('chat-no-room'); show('chat-room-view');
  db.ref('chat_messages/'+id).on('value',(snap)=>{
    const msgs = snap.val();
    const c = $('chat-messages'); if(!c) return;
    if(!msgs){ c.innerHTML='<div style="color:#888;padding:15px;">Sem mensagens</div>'; return; }
    const arr = Object.entries(msgs).map(([id,m])=>({id,...m})).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    c.innerHTML = arr.map(m=>`
      <div style="margin-bottom:8px; display:flex; flex-direction:${m.autorId===STATE.user?.uid?'row-reverse':'row'}; gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${esc(m.avatar||'?')}</div>
        <div style="max-width:70%; background:${m.autorId===STATE.user?.uid?'#6C5CE7':'#f0f0f0'}; color:${m.autorId===STATE.user?.uid?'white':'#333'}; padding:10px 14px; border-radius:15px; font-size:14px;">
          ${esc(m.texto)}
        </div>
      </div>
    `).join('');
    c.scrollTop=c.scrollHeight;
  });
}

async function sendChatMsg(){
  const t = $('chat-msg-input')?.value?.trim();
  if(!t||!STATE.currentRoom) return;
  await db.ref('chat_messages/'+STATE.currentRoom).push({
    texto:t, autorId:STATE.user.uid, autorNome:STATE.userData.username, avatar:STATE.userData.avatar, createdAt:Date.now()
  });
  await db.ref('chat_rooms/'+STATE.currentRoom).update({lastMessage:t.substring(0,50), lastMessageAt:Date.now()});
  $('chat-msg-input').value='';
}

async function criarSala(){
  const n = $('ns-nome')?.value?.trim();
  if(!n){ toast('Nome obrigatório','error'); return; }
  const d = $('ns-desc')?.value?.trim();
  const ref = await db.ref('chat_rooms').push({ nome:n, descricao:d, criadorId:STATE.user.uid, createdAt:Date.now() });
  closeModal('modal-sala');
  $('ns-nome').value=''; $('ns-desc').value='';
  joinRoom(ref.key);
}

// ========== RANKING ==========
function loadRanking(){
  db.ref('usuarios').on('value',(snap)=>{
    const u = snap.val(); if(!u) return;
    const arr = Object.values(u).sort((a,b)=>(b.points||0)-(a.points||0));
    const setP=(n,u)=>{ if(!u)return; txt('podio'+n+'-av', u.avatar||'?'); txt('podio'+n+'-name',(u.username||'').split(' ')[0]); txt('podio'+n+'-pts', fmt(u.points)); };
    setP(1,arr[0]); setP(2,arr[1]); setP(3,arr[2]);
    const pos = arr.findIndex(u=>u.uid===STATE.user?.uid);
    txt('my-rank-num', pos>=0?'#'+(pos+1):'#--');
    txt('my-rank-pts', fmt(arr[pos]?.points||0));
    const c = $('ranking-list'); if(!c) return;
    c.innerHTML = arr.slice(0,50).map((u,i)=>`
      <div style="background:white; border-radius:10px; padding:12px; margin-bottom:6px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 4px rgba(0,0,0,0.04); ${u.uid===STATE.user?.uid?'background:#ede9fe;':''}">
        <span style="font-weight:800; color:#888; width:24px;">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>
        <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${esc(u.avatar||'?')}</div>
        <div style="flex:1;"><strong>${esc(u.username||'?')}</strong> ${u.uid===STATE.user?.uid?'(Você)':''}</div>
        <span style="font-weight:700;color:#6C5CE7;">${fmt(u.points)} pts</span>
      </div>
    `).join('');
  });
}

// ========== PERFIL ==========
async function loadPerfil(){
  if(!STATE.userData) return;
  const s = await db.ref('usuarios/'+STATE.user.uid).once('value');
  if(s.val()) STATE.userData = s.val();
  updateUI();
  const u = STATE.userData;
  txt('pstat-pts', fmt(u.points)); txt('pstat-quizzes', u.quizzesPlayed||0);
  txt('pstat-materias', u.materiasCreated||0); txt('pstat-seguidores', u.seguidores||0);
  
  const badges = [];
  if((u.points||0)>=1000) badges.push('<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">⭐ 1K</span>');
  if((u.quizzesPlayed||0)>=10) badges.push('<span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">🎮 Gamer</span>');
  if(u.isAdmin) badges.push('<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">⚙️ Admin</span>');
  if(!badges.length) badges.push('<span style="background:#f0f0f0;color:#666;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">🌱 Novato</span>');
  $('perfil-badges').innerHTML = badges.join('');
  
  const hs = await db.ref('historico/'+STATE.user.uid).once('value');
  const h = hs.val();
  const c = $('perfil-historico');
  if(c){
    if(!h){ c.innerHTML='<div style="color:#888;padding:10px;">Nenhum quiz</div>'; return; }
    const arr = Object.entries(h).map(([id,x])=>({id,...x})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    c.innerHTML = arr.map(x=>`
      <div style="background:white; border-radius:10px; padding:12px; margin-bottom:6px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <span>🎮</span>
        <div style="flex:1;"><strong>${esc(x.quizNome||'Quiz')}</strong><br><span style="font-size:12px;color:#888;">${x.acertos}/${x.total} · ${x.pct}% · ${ago(x.createdAt)}</span></div>
        <span style="font-weight:800;color:#10b981;">+${fmt(x.score)}</span>
      </div>
    `).join('');
  }
}

// ========== NOTIFICAÇÕES ==========
function listenNotifs(){
  if(!STATE.user) return;
  db.ref('notificacoes/'+STATE.user.uid).on('value',(snap)=>{
    const n = snap.val();
    const badge = $('notif-badge');
    if(!badge) return;
    if(n){
      const unread = Object.values(n).filter(x=>!x.lida).length;
      if(unread>0){ badge.textContent=unread>9?'9+':unread; badge.style.display='flex'; }
      else { badge.style.display='none'; }
    } else { badge.style.display='none'; }
  });
}

async function loadNotifs(){
  if(!STATE.user) return;
  const s = await db.ref('notificacoes/'+STATE.user.uid).orderByChild('createdAt').limitToLast(30).once('value');
  const n = s.val();
  const c = $('notificacoes-list'); if(!c) return;
  if(!n){ c.innerHTML='<div style="color:#888;padding:20px;text-align:center;">🔔 Nenhuma notificação</div>'; return; }
  const arr = Object.entries(n).map(([id,x])=>({id,...x})).reverse();
  c.innerHTML = arr.map(x=>`
    <div style="background:white; border-radius:12px; padding:15px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.04); ${!x.lida?'border-left:3px solid #6C5CE7;':''}">
      <div style="font-weight:600; font-size:14px;">${esc(x.mensagem)}</div>
      <div style="font-size:12px;color:#888;">${ago(x.createdAt)}</div>
    </div>
  `).join('');
  
  const updates = {};
  arr.forEach(x=>{ if(!x.lida) updates[x.id+'/lida']=true; });
  if(Object.keys(updates).length) await db.ref('notificacoes/'+STATE.user.uid).update(updates);
}

async function marcarLidas(){
  if(!STATE.user) return;
  const s = await db.ref('notificacoes/'+STATE.user.uid).once('value');
  const n = s.val(); if(!n) return;
  const u = {};
  Object.keys(n).forEach(id=>{ u[id+'/lida']=true; });
  await db.ref('notificacoes/'+STATE.user.uid).update(u);
  toast('Todas lidas ✓','info');
}

// ========== PONTOS ==========
async function addPts(pts){
  if(!STATE.user) return;
  const s = await db.ref('usuarios/'+STATE.user.uid+'/points').once('value');
  const cur = s.val()||0;
  const nw = cur+pts;
  await db.ref('usuarios/'+STATE.user.uid).update({points:nw});
  STATE.userData.points=nw;
  updateUI();
}

// ========== ADM ==========
async function loadAdm(){
  if(!STATE.userData?.isAdmin){ toast('Acesso negado','error'); return; }
  const us = await db.ref('usuarios').once('value');
  const u = us.val(); txt('adm-users', u?Object.keys(u).length:0);
  const ps = await db.ref('posts').once('value');
  const p = ps.val(); txt('adm-posts', p?Object.keys(p).length:0);
  admLoad('materias');
}

async function admLoad(tab, btn){
  STATE.admTab=tab;
  document.querySelectorAll('.adm-tab-btn').forEach(b=>{b.style.background='white'; b.style.color='#555';});
  if(btn){ btn.style.background='#6C5CE7'; btn.style.color='white'; }
  const c = $('adm-content-list'); if(!c) return;
  c.innerHTML='<div style="color:#888;padding:15px;">⏳ Carregando...</div>';
  
  let data;
  if(tab==='materias'){
    const s = await db.ref('materias').once('value'); data=s.val();
    if(data) c.innerHTML = Object.entries(data).map(([id,m])=>`
      <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; margin-bottom:6px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div><strong>${m.icone||'📚'} ${esc(m.nome)}</strong><br><span style="font-size:11px;color:#888;">${esc(m.autorNome||'?')} · ${ago(m.createdAt)}</span></div>
        <button onclick="admDel('materias','${id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 12px; border-radius:8px; font-weight:700; cursor:pointer;">🗑</button>
      </div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhuma</div>';
  } else if(tab==='posts'){
    const s = await db.ref('posts').once('value'); data=s.val();
    if(data) c.innerHTML = Object.entries(data).map(([id,p])=>`
      <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; margin-bottom:6px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div><strong>${esc(p.autorNome||'?')}</strong>: ${esc((p.texto||'').substring(0,50))}<br><span style="font-size:11px;color:#888;">${ago(p.createdAt)}</span></div>
        <button onclick="admDel('posts','${id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 12px; border-radius:8px; font-weight:700; cursor:pointer;">🗑</button>
      </div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhum</div>';
  } else if(tab==='usuarios'){
    const s = await db.ref('usuarios').once('value'); data=s.val();
    if(data) c.innerHTML = Object.values(data).map(u=>`
      <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; margin-bottom:6px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div><strong>${u.avatar||'?'} ${esc(u.username||'?')}</strong> · ${fmt(u.points)} pts ${u.isAdmin?'⚙️':''}</div>
        ${!u.isAdmin&&u.uid!==STATE.user?.uid?`<button onclick="admDelUser('${u.uid}')" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 12px; border-radius:8px; font-weight:700; cursor:pointer;">🗑</button>`:''}
      </div>
    `).join('');
    else c.innerHTML='<div style="color:#888;padding:15px;">Nenhum</div>';
  } else {
    // quizzes, topicos
    c.innerHTML = '<div style="color:#888;padding:15px;">Use matérias/posts/usuários</div>';
  }
}

async function admDel(path, id){
  if(!confirm('Excluir?')) return;
  await db.ref(path+'/'+id).remove();
  toast('Excluído','info');
  admLoad(STATE.admTab);
}

async function admDelUser(uid){
  if(!confirm('Excluir usuário permanentemente?')) return;
  await db.ref('usuarios/'+uid).remove();
  await db.ref('historico/'+uid).remove();
  await db.ref('notificacoes/'+uid).remove();
  toast('Usuário excluído','info');
  admLoad('usuarios');
}

async function admAddPts(){
  const pts = parseInt($('adm-add-pts')?.value);
  if(!pts||pts<=0){ toast('Valor inválido','error'); return; }
  if(pts>1000000){ toast('Máximo 1M','warning'); return; }
  await addPts(pts);
  $('adm-add-pts').value='';
  toast('+'+fmt(pts)+' pontos!','success');
}

// ========== CLOSE MODALS ==========
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){
    document.querySelectorAll('[id^="modal-"]').forEach(m=>{ if(m.style.display==='flex') m.style.display='none'; });
  }
});
// ============================================================
// SISTEMA DE AMIZADE / SEGUIDORES
// ============================================================

// Variável para guardar o perfil que está sendo visto (outro usuário)
let viewingUserId = null;

// Quando clicar no nome de alguém no ranking ou feed, ver perfil
async function verPerfil(uid) {
  if (uid === STATE.user?.uid) {
    showScreen('perfil');
    return;
  }
  
  viewingUserId = uid;
  const snap = await db.ref('usuarios/' + uid).once('value');
  const u = snap.val();
  if (!u) return toast('Usuário não encontrado', 'error');
  
  const content = $('user-profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:60px;">${u.avatar || '🎓'}</div>
      <h3 style="margin:10px 0;">${esc(u.username || '?')}</h3>
      <p style="color:#888; font-size:14px;">${esc(u.bio || 'Sem bio')}</p>
      <div style="margin:10px 0;">
        <span style="background:#f0f0f0; padding:5px 12px; border-radius:15px; font-weight:600; font-size:13px;">⭐ ${fmt(u.points || 0)} pts</span>
        <span style="background:#f0f0f0; padding:5px 12px; border-radius:15px; font-weight:600; font-size:13px; margin-left:5px;">👥 ${u.seguidores || 0} seguidores</span>
      </div>
      <button id="btn-follow-modal" onclick="toggleFollowUser('${uid}')" style="background:#6C5CE7; color:white; border:none; padding:10px 25px; border-radius:25px; font-weight:700; cursor:pointer; font-size:15px; margin-top:10px;">
        Carregando...
      </button>
    </div>
  `;
  
  showModal('modal-user-profile');
  
  // Verificar se já segue
  const fSnap = await db.ref('seguidores/' + STATE.user.uid + '/' + uid).once('value');
  const btn = $('btn-follow-modal');
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

// Seguir/Desseguir do modal
async function toggleFollowUser(uid) {
  if (!STATE.user) return toast('Faça login', 'error');
  if (uid === STATE.user.uid) return;
  
  const ref = db.ref('seguidores/' + STATE.user.uid + '/' + uid);
  const snap = await ref.once('value');
  
  if (snap.val()) {
    // Deixar de seguir
    await ref.remove();
    await db.ref('seguindo/' + uid + '/' + STATE.user.uid).remove();
    
    // Atualizar contagem
    const uSnap = await db.ref('usuarios/' + uid).once('value');
    const u = uSnap.val();
    if (u) await db.ref('usuarios/' + uid).update({ seguidores: Math.max((u.seguidores || 1) - 1, 0) });
    
    const btn = $('btn-follow-modal');
    if (btn) { btn.textContent = '👥 Seguir'; btn.style.background = '#6C5CE7'; }
    toast('Deixou de seguir', 'info');
  } else {
    // Seguir
    await ref.set(true);
    await db.ref('seguindo/' + uid + '/' + STATE.user.uid).set(true);
    
    // Atualizar contagem
    const uSnap = await db.ref('usuarios/' + uid).once('value');
    const u = uSnap.val();
    if (u) await db.ref('usuarios/' + uid).update({ seguidores: (u.seguidores || 0) + 1 });
    
    // Notificar
    await db.ref('notificacoes/' + uid).push({
      mensagem: '👥 ' + STATE.userData.username + ' começou a te seguir!',
      tipo: 'follow',
      lida: false,
      createdAt: Date.now()
    });
    
    const btn = $('btn-follow-modal');
    if (btn) { btn.textContent = '✅ Seguindo'; btn.style.background = '#10b981'; }
    toast('Seguindo! 👥', 'success');
  }
}

// Mostrar lista de seguidores
async function showFollowers() {
  const uid = viewingUserId || STATE.user?.uid;
  if (!uid) return;
  
  const snap = await db.ref('seguindo/' + uid).once('value');
  const data = snap.val();
  const container = $('seguidores-list');
  if (!container) return;
  
  if (!data) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Nenhum seguidor ainda</div>';
  } else {
    const seguidores = Object.keys(data);
    let html = '';
    for (const sid of seguidores) {
      const uSnap = await db.ref('usuarios/' + sid).once('value');
      const u = uSnap.val();
      if (u) {
        html += `
          <div onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #eee;cursor:pointer;">
            <div style="width:35px;height:35px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${u.avatar || '?'}</div>
            <div style="flex:1;"><strong>${esc(u.username || '?')}</strong><br><span style="font-size:11px;color:#888;">${fmt(u.points || 0)} pts</span></div>
            <span style="color:#888;">→</span>
          </div>
        `;
      }
    }
    container.innerHTML = html || '<div style="text-align:center;color:#888;padding:20px;">Nenhum seguidor</div>';
  }
  
  showModal('modal-seguidores');
}

// Mostrar lista de quem está seguindo
async function showFollowing() {
  const uid = viewingUserId || STATE.user?.uid;
  if (!uid) return;
  
  const snap = await db.ref('seguidores/' + uid).once('value');
  const data = snap.val();
  const container = $('seguindo-list');
  if (!container) return;
  
  if (!data) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Não segue ninguém</div>';
  } else {
    const seguindo = Object.keys(data);
    let html = '';
    for (const fid of seguindo) {
      const uSnap = await db.ref('usuarios/' + fid).once('value');
      const u = uSnap.val();
      if (u) {
        html += `
          <div onclick="verPerfil('${u.uid}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #eee;cursor:pointer;">
            <div style="width:35px;height:35px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${u.avatar || '?'}</div>
            <div style="flex:1;"><strong>${esc(u.username || '?')}</strong><br><span style="font-size:11px;color:#888;">${fmt(u.points || 0)} pts</span></div>
            <span style="color:#888;">→</span>
          </div>
        `;
      }
    }
    container.innerHTML = html || '<div style="text-align:center;color:#888;padding:20px;">Não segue ninguém</div>';
  }
  
  showModal('modal-seguindo');
}

// Atualizar contagem de seguidores no perfil
async function updateFollowCounts() {
  if (!STATE.userData) return;
  
  const segSnap = await db.ref('seguindo/' + STATE.user.uid).once('value');
  const segData = segSnap.val();
  const segCount = segData ? Object.keys(segData).length : 0;
  
  const seguSnap = await db.ref('seguidores/' + STATE.user.uid).once('value');
  const seguData = seguSnap.val();
  const seguCount = seguData ? Object.keys(seguData).length : 0;
  
  txt('count-seguidores', segCount);
  txt('count-seguindo', seguCount);
  txt('pstat-seguidores', segCount);
  
  // Atualizar no banco
  await db.ref('usuarios/' + STATE.user.uid).update({ seguidores: segCount });
}

// Modificar loadPerfil para carregar contagens
const originalLoadPerfil = loadPerfil;
loadPerfil = async function() {
  await originalLoadPerfil();
  viewingUserId = null;
  hide('follow-section');
  await updateFollowCounts();
};

// Adicionar clique nos nomes do ranking
const originalLoadRanking = loadRanking;
loadRanking = async function() {
  await originalLoadRanking();
  // Adicionar onclick nos itens do ranking
  setTimeout(() => {
    document.querySelectorAll('#ranking-list > div').forEach(el => {
      if (!el.onclick) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function() {
          const uid = this.getAttribute('data-uid');
          if (uid) verPerfil(uid);
        });
      }
    });
  }, 500);
};

// Adicionar data-uid nos itens do ranking
const originalRenderRanking = loadRanking;
loadRanking = async function() {
  db.ref('usuarios').on('value', async (snap) => {
    const u = snap.val(); if (!u) return;
    const arr = Object.values(u).sort((a,b)=>(b.points||0)-(a.points||0));
    
    // Pódio (mantém igual)
    const setP = (n, u) => {
      if (!u) return;
      txt('podio'+n+'-av', u.avatar||'?');
      txt('podio'+n+'-name', (u.username||'').split(' ')[0]);
      txt('podio'+n+'-pts', fmt(u.points));
    };
    setP(1,arr[0]); setP(2,arr[1]); setP(3,arr[2]);
    
    const pos = arr.findIndex(u=>u.uid===STATE.user?.uid);
    txt('my-rank-num', pos>=0?'#'+(pos+1):'#--');
    txt('my-rank-pts', fmt(arr[pos]?.points||0));
    
    const c = $('ranking-list'); if (!c) return;
    c.innerHTML = arr.slice(0,50).map((u,i) => `
      <div data-uid="${u.uid}" onclick="verPerfil('${u.uid}')" style="background:white; border-radius:10px; padding:12px; margin-bottom:6px; display:flex; align-items:center; gap:10px; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.04); ${u.uid===STATE.user?.uid?'background:#ede9fe;':''}">
        <span style="font-weight:800; color:#888; width:24px;">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>
        <div style="width:30px;height:30px;border-radius:50%;background:#6C5CE7;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${esc(u.avatar||'?')}</div>
        <div style="flex:1;"><strong>${esc(u.username||'?')}</strong> ${u.uid===STATE.user?.uid?'(Você)':''}</div>
        <span style="font-weight:700;color:#6C5CE7;">${fmt(u.points)} pts</span>
      </div>
    `).join('');
  });
};

console.log('✅ Sistema de amizade adicionado!');
console.log('✅ Sexta-Feira Studies PRONTO!');