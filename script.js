// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
    authDomain: "sexta-feira-studies.firebaseapp.com",
    databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
    projectId: "sexta-feira-studies",
    storageBucket: "sexta-feira-studies.firebasestorage.app",
    messagingSenderId: "673251857052",
    appId: "1:673251857052:web:0ef6929ea93123f7a91359"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// API Keys
const GROQ_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY";
const IMGBB_API_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

// State
let currentUser = null;
let currentPage = 'home';
let chatHistory = [];

// Auth State Observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        carregarUsuario(user.uid);
    } else {
        mostrarTela('login-screen');
    }
});

function carregarUsuario(uid) {
    try {
        db.ref('usuarios/' + uid).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
                currentUser = snapshot.val();
                currentUser.uid = uid;
                mostrarTela('main-app');
                navegar('home');
                carregarFooter();
            }
        }).catch(function(error) {
            console.error('Erro ao carregar usuário:', error);
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function mostrarTela(screenId) {
    if (document.querySelectorAll('.screen')) {
        document.querySelectorAll('.screen').forEach(function(s) {
            s.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }
}

function navegar(page) {
    currentPage = page;
    if (document.querySelectorAll('.page')) {
        document.querySelectorAll('.page').forEach(function(p) {
            p.classList.remove('active');
        });
    }
    
    // Update nav active states
    if (document.querySelectorAll('.nav-menu li')) {
        document.querySelectorAll('.nav-menu li').forEach(function(li) {
            li.classList.remove('active');
        });
        const navItem = document.querySelector(`.nav-menu li[data-page="${page}"]`);
        if (navItem) navItem.classList.add('active');
    }
    
    if (document.querySelectorAll('#bottom-nav button')) {
        document.querySelectorAll('#bottom-nav button').forEach(function(btn) {
            btn.classList.remove('active');
        });
        const bottomBtn = document.querySelector(`#bottom-nav button[data-page="${page}"]`);
        if (bottomBtn) bottomBtn.classList.add('active');
    }
    
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    
    // Load page content
    switch(page) {
        case 'home': carregarHome(); break;
        case 'materias': carregarMaterias(); break;
        case 'ranking': carregarRanking(); break;
        case 'desafios': carregarDesafios(); break;
        case 'jarvis': carregarJarvis(); break;
        case 'feed': carregarFeed(); break;
        case 'perfil': carregarPerfil(); break;
        case 'sobre': carregarSobre(); break;
        case 'updates': carregarUpdates(); break;
    }
}

// ===== AUTH FUNCTIONS =====
function fazerLogin() {
    const username = document.getElementById('login-username');
    const password = document.getElementById('login-password');
    
    if (!username || !password) return;
    
    const userVal = username.value.trim();
    const passVal = password.value;
    
    if (!userVal || !passVal) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        db.ref('usuarios').orderByChild('username').equalTo(userVal).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
                let foundUser = null;
                let foundUid = null;
                snapshot.forEach(function(child) {
                    if (child.val().password === passVal) {
                        foundUser = child.val();
                        foundUid = child.key;
                    }
                });
                
                if (foundUser) {
                    auth.signInWithEmailAndPassword(foundUser.email, passVal).then(function() {
                        currentUser = foundUser;
                        currentUser.uid = foundUid;
                        mostrarTela('main-app');
                        navegar('home');
                        carregarFooter();
                        toast('Bem-vindo(a), @' + foundUser.username + '!', 'success');
                    }).catch(function(error) {
                        // Se falhar, autentica anonimamente e atualiza
                        auth.signInAnonymously().then(function(result) {
                            const uid = foundUid;
                            currentUser = foundUser;
                            currentUser.uid = uid;
                            mostrarTela('main-app');
                            navegar('home');
                            carregarFooter();
                            toast('Bem-vindo(a), @' + foundUser.username + '!', 'success');
                        });
                    });
                } else {
                    toast('Senha incorreta', 'error');
                }
            } else {
                toast('Usuário não encontrado', 'error');
            }
        });
    } catch(e) {
        console.error('Erro no login:', e);
        toast('Erro ao fazer login', 'error');
    }
}

function loginComGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function(result) {
        const user = result.user;
        db.ref('usuarios/' + user.uid).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                const userData = {
                    fullname: user.displayName || 'Usuário Google',
                    username: (user.email ? user.email.split('@')[0] : 'user_' + Date.now().toString(36)),
                    email: user.email || '',
                    password: '',
                    avatar: user.photoURL || '',
                    bio: '',
                    points: 0,
                    plano: 'gratis',
                    adminLevel: 0,
                    isProf: false,
                    isQuizzer: false,
                    createdAt: Date.now()
                };
                db.ref('usuarios/' + user.uid).set(userData);
                currentUser = userData;
                currentUser.uid = user.uid;
            } else {
                currentUser = snapshot.val();
                currentUser.uid = user.uid;
            }
            mostrarTela('main-app');
            navegar('home');
            carregarFooter();
            toast('Bem-vindo(a)!', 'success');
        });
    }).catch(function(error) {
        console.error('Erro Google login:', error);
        toast('Erro ao logar com Google', 'error');
    });
}

function mostrarRegistro() {
    if (document.getElementById('login-form')) document.getElementById('login-form').style.display = 'none';
    if (document.getElementById('registro-form')) document.getElementById('registro-form').style.display = 'block';
}

function mostrarLogin() {
    if (document.getElementById('registro-form')) document.getElementById('registro-form').style.display = 'none';
    if (document.getElementById('login-form')) document.getElementById('login-form').style.display = 'block';
}

function registrar() {
    const fullname = document.getElementById('reg-fullname');
    const username = document.getElementById('reg-username');
    const email = document.getElementById('reg-email');
    const password = document.getElementById('reg-password');
    
    if (!fullname || !username || !email || !password) return;
    
    const data = {
        fullname: fullname.value.trim(),
        username: username.value.trim(),
        email: email.value.trim(),
        password: password.value
    };
    
    if (!data.fullname || !data.username || !data.email || !data.password) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    
    if (!data.username.startsWith('@')) {
        data.username = '@' + data.username;
    }
    
    try {
        db.ref('usuarios').orderByChild('username').equalTo(data.username).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
                toast('Nome de usuário já existe', 'error');
                return;
            }
            
            auth.createUserWithEmailAndPassword(data.email, data.password).then(function(result) {
                const userData = {
                    fullname: data.fullname,
                    username: data.username,
                    email: data.email,
                    password: data.password,
                    avatar: '',
                    bio: '',
                    points: 0,
                    plano: 'gratis',
                    adminLevel: 0,
                    isProf: false,
                    isQuizzer: false,
                    createdAt: Date.now()
                };
                
                db.ref('usuarios/' + result.user.uid).set(userData).then(function() {
                    currentUser = userData;
                    currentUser.uid = result.user.uid;
                    mostrarTela('main-app');
                    navegar('home');
                    carregarFooter();
                    toast('Conta criada com sucesso!', 'success');
                });
            }).catch(function(error) {
                if (error.code === 'auth/email-already-in-use') {
                    toast('Email já está em uso', 'error');
                } else {
                    toast('Erro ao criar conta: ' + error.message, 'error');
                }
            });
        });
    } catch(e) {
        console.error('Erro no registro:', e);
        toast('Erro ao registrar', 'error');
    }
}

function logout() {
    auth.signOut().then(function() {
        currentUser = null;
        chatHistory = [];
        mostrarTela('login-screen');
        toast('Até logo!', 'info');
    });
}

// ===== HOME =====
function carregarHome() {
    const page = document.getElementById('page-home');
    if (!page || !currentUser) return;
    
    page.innerHTML = `
        <h2 style="margin-bottom:20px;">Olá, ${currentUser.fullname || currentUser.username}!</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">⭐ Pontos</div>
                <div class="stat-value" style="color:var(--gold);">${currentUser.points || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">📚 Disciplinas</div>
                <div class="stat-value" id="home-count-materias">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">✅ Quizzes</div>
                <div class="stat-value" id="home-count-quizzes">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">🗓️ Desafios</div>
                <div class="stat-value" id="home-count-desafios">0</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <span class="card-title">📝 Feed Recente</span>
            </div>
            <div id="home-feed"></div>
        </div>
    `;
    
    try {
        db.ref('materias').once('value').then(function(snap) {
            const count = snap.exists() ? snap.numChildren() : 0;
            const el = document.getElementById('home-count-materias');
            if (el) el.textContent = count;
        });
        
        db.ref('quizzes').once('value').then(function(snap) {
            let count = 0;
            if (snap.exists()) {
                snap.forEach(function(materiaSnap) {
                    count += materiaSnap.numChildren();
                });
            }
            const el = document.getElementById('home-count-quizzes');
            if (el) el.textContent = count;
        });
        
        db.ref('desafios').once('value').then(function(snap) {
            const count = snap.exists() ? snap.numChildren() : 0;
            const el = document.getElementById('home-count-desafios');
            if (el) el.textContent = count;
        });
        
        db.ref('posts').orderByChild('createdAt').limitToLast(5).once('value').then(function(snap) {
            const container = document.getElementById('home-feed');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '';
                const posts = [];
                snap.forEach(function(child) {
                    posts.unshift({id: child.key, ...child.val()});
                });
                
                posts.forEach(function(post) {
                    html += `
                        <div class="post-card" style="margin-bottom:10px;">
                            <div class="post-header">
                                <img src="${post.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="post-avatar">
                                <div>
                                    <span class="post-autor">${post.autorNome || 'Anônimo'}</span>
                                    <br><span class="post-data">${formatarData(post.createdAt)}</span>
                                </div>
                            </div>
                            <p>${post.texto || ''}</p>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhum post ainda</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro ao carregar home:', e);
    }
}

// ===== MATERIAS =====
function carregarMaterias() {
    const page = document.getElementById('page-materias');
    if (!page) return;
    
    page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2>📚 Disciplinas</h2>
            ${(currentUser && (currentUser.isProf || currentUser.adminLevel >= 1)) ? '<button class="btn-primary" onclick="mostrarCriarMateria()" style="width:auto;">+ Nova</button>' : ''}
        </div>
        <div id="materias-list"></div>
    `;
    
    try {
        db.ref('materias').once('value').then(function(snap) {
            const container = document.getElementById('materias-list');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const mat = child.val();
                    html += `
                        <div class="card" onclick="abrirMateria('${child.key}')" style="cursor:pointer;">
                            <div style="display:flex;align-items:center;gap:15px;">
                                <span style="font-size:40px;">${mat.icone || '📖'}</span>
                                <div style="flex:1;">
                                    <h3>${mat.nome || 'Sem nome'}</h3>
                                    <p style="color:#94A3B8;font-size:13px;">${mat.descricao || ''}</p>
                                    <span style="font-size:11px;color:#94A3B8;">Por: ${mat.autorNome || 'Anônimo'}</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color:#94A3B8;"></i>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Nenhuma disciplina</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro ao carregar matérias:', e);
    }
}

function mostrarCriarMateria() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Nova Disciplina</h3>
            <input type="text" id="mat-nome" placeholder="Nome da disciplina">
            <input type="text" id="mat-descricao" placeholder="Descrição">
            <input type="text" id="mat-icone" placeholder="Ícone (emoji, ex: 📐)">
            <div class="modal-buttons">
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="criarMateria()">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function criarMateria() {
    const nome = document.getElementById('mat-nome');
    const descricao = document.getElementById('mat-descricao');
    const icone = document.getElementById('mat-icone');
    
    if (!nome || !descricao || !icone) return;
    if (!nome.value.trim()) {
        toast('Nome é obrigatório', 'error');
        return;
    }
    
    const materiaRef = db.ref('materias').push();
    const materiaData = {
        nome: nome.value.trim(),
        descricao: descricao.value.trim(),
        icone: icone.value.trim() || '📖',
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        createdAt: Date.now()
    };
    
    materiaRef.set(materiaData).then(function() {
        toast('Disciplina criada!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarMaterias();
    }).catch(function(error) {
        toast('Erro ao criar disciplina', 'error');
    });
}

function abrirMateria(materiaId) {
    try {
        db.ref('materias/' + materiaId).once('value').then(function(snap) {
            if (!snap.exists()) return;
            const mat = snap.val();
            
            const page = document.getElementById('page-materia-detalhes');
            if (!page) return;
            
            document.querySelectorAll('.page').forEach(function(p) {
                p.classList.remove('active');
            });
            page.classList.add('active');
            
            page.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <button class="btn-primary" onclick="navegar('materias')" style="width:auto;">← Voltar</button>
                    <h2>${mat.icone || '📖'} ${mat.nome}</h2>
                </div>
                <p style="color:#94A3B8;margin-bottom:20px;">${mat.descricao || ''}</p>
                
                <div class="tabs">
                    <div class="tab active" onclick="carregarAulasMateria('${materiaId}')">Aulas</div>
                    <div class="tab" onclick="carregarQuizzesMateria('${materiaId}')">Quizzes</div>
                    <div class="tab" onclick="carregarVideosMateria('${materiaId}')">Vídeos</div>
                </div>
                
                <div id="materia-content"></div>
                
                ${(currentUser && (currentUser.isProf || currentUser.adminLevel >= 1)) ? `
                <div style="margin-top:20px;display:flex;gap:10px;">
                    <button class="btn-primary" onclick="mostrarCriarAula('${materiaId}')">+ Aula</button>
                    <button class="btn-green" onclick="mostrarCriarQuiz('${materiaId}')">+ Quiz</button>
                    <button class="btn-gold" onclick="mostrarAdicionarVideo('${materiaId}')">+ Vídeo</button>
                </div>` : ''}
            `;
            
            carregarAulasMateria(materiaId);
        });
    } catch(e) {
        console.error('Erro ao abrir matéria:', e);
    }
}

function carregarAulasMateria(materiaId) {
    const container = document.getElementById('materia-content');
    if (!container) return;
    
    try {
        db.ref('aulas/' + materiaId).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const aula = child.val();
                    const viewsCount = aula.views ? Object.keys(aula.views).length : 0;
                    html += `
                        <div class="card" onclick="abrirAula('${materiaId}', '${child.key}')" style="cursor:pointer;">
                            <h3>${aula.titulo || 'Sem título'}</h3>
                            <p style="color:#94A3B8;font-size:12px;">Por: ${aula.autorNome || 'Anônimo'} | 👁️ ${viewsCount} views</p>
                            ${aula.verificado ? '<span class="badge badge-verificado">✓ Verificado</span>' : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>Nenhuma aula</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function carregarQuizzesMateria(materiaId) {
    const container = document.getElementById('materia-content');
    if (!container) return;
    
    try {
        db.ref('quizzes/' + materiaId).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const quiz = child.val();
                    html += `
                        <div class="card" onclick="iniciarQuiz('${materiaId}', '${child.key}')" style="cursor:pointer;">
                            <h3>📝 ${quiz.nome || 'Quiz'}</h3>
                            <p style="color:#94A3B8;font-size:12px;">${quiz.questoes ? quiz.questoes.length : 0} questões</p>
                            ${quiz.oficial ? '<span class="badge badge-verificado">Oficial</span>' : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-question-circle"></i><p>Nenhum quiz</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function carregarVideosMateria(materiaId) {
    const container = document.getElementById('materia-content');
    if (!container) return;
    
    try {
        db.ref('videos/' + materiaId).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const video = child.val();
                    const videoId = extrairYouTubeID(video.url);
                    html += `
                        <div class="card">
                            <h3>${video.titulo || 'Vídeo'}</h3>
                            ${videoId ? `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>` : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-video"></i><p>Nenhum vídeo</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function extrairYouTubeID(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? match[1] : null;
}

function mostrarCriarAula(materiaId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Nova Aula</h3>
            <input type="text" id="aula-titulo" placeholder="Título da aula">
            <textarea id="aula-conteudo" placeholder="Conteúdo (ou gere com IA)"></textarea>
            <div class="modal-buttons">
                <button class="btn-gold" onclick="gerarAulaIA('${materiaId}')">Gerar com IA</button>
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="criarAula('${materiaId}')">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function gerarAulaIA(materiaId) {
    const titulo = document.getElementById('aula-titulo');
    if (!titulo || !titulo.value) {
        toast('Digite um título primeiro', 'error');
        return;
    }
    
    const conteudoEl = document.getElementById('aula-conteudo');
    if (conteudoEl) conteudoEl.value = 'Gerando com IA...';
    
    try {
        fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{
                    role: 'user',
                    content: `Crie uma aula detalhada sobre: ${titulo.value}. Formate com tópicos e explicações claras. Use linguagem educativa.`
                }],
                max_tokens: 2000
            })
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            if (conteudoEl && data.choices && data.choices[0]) {
                conteudoEl.value = data.choices[0].message.content;
                toast('Aula gerada!', 'success');
            }
        }).catch(function(error) {
            console.error('Erro IA:', error);
            if (conteudoEl) conteudoEl.value = 'Erro ao gerar. Tente novamente.';
            toast('Erro na IA', 'error');
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function criarAula(materiaId) {
    const titulo = document.getElementById('aula-titulo');
    const conteudo = document.getElementById('aula-conteudo');
    
    if (!titulo || !conteudo || !titulo.value.trim() || !conteudo.value.trim()) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    
    const aulaRef = db.ref('aulas/' + materiaId).push();
    aulaRef.set({
        titulo: titulo.value.trim(),
        conteudo: conteudo.value.trim(),
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        verificado: currentUser.adminLevel >= 1,
        views: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Aula criada!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarAulasMateria(materiaId);
    }).catch(function(error) {
        toast('Erro ao criar aula', 'error');
    });
}

function abrirAula(materiaId, aulaId) {
    try {
        db.ref('aulas/' + materiaId + '/' + aulaId).once('value').then(function(snap) {
            if (!snap.exists()) return;
            const aula = snap.val();
            
            if (currentUser && currentUser.uid) {
                db.ref('aulas/' + materiaId + '/' + aulaId + '/views/' + currentUser.uid).set(Date.now());
            }
            
            const page = document.getElementById('page-aula');
            if (!page) return;
            
            document.querySelectorAll('.page').forEach(function(p) {
                p.classList.remove('active');
            });
            page.classList.add('active');
            
            page.innerHTML = `
                <button class="btn-primary" onclick="abrirMateria('${materiaId}')" style="width:auto;margin-bottom:20px;">← Voltar</button>
                <h2>${aula.titulo || 'Aula'}</h2>
                <p style="color:#94A3B8;margin-bottom:20px;">Por: ${aula.autorNome}</p>
                <div class="card" style="white-space:pre-wrap;line-height:1.8;">${aula.conteudo || ''}</div>
                <div class="card" style="margin-top:20px;">
                    <h3>💬 Comentários</h3>
                    <div id="aula-comentarios"></div>
                    <div style="display:flex;gap:10px;margin-top:15px;">
                        <input type="text" id="comentario-texto" placeholder="Adicione um comentário..." style="flex:1;padding:10px;background:var(--bg);border:1px solid #334155;border-radius:10px;color:var(--text);">
                        <button class="btn-primary" onclick="enviarComentario('${materiaId}', '${aulaId}')" style="width:auto;">Enviar</button>
                    </div>
                </div>
            `;
            
            carregarComentarios(materiaId, aulaId);
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function carregarComentarios(materiaId, aulaId) {
    const container = document.getElementById('aula-comentarios');
    if (!container) return;
    
    try {
        db.ref('comentarios/' + materiaId + '/' + aulaId).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const c = child.val();
                    html += `
                        <div style="padding:10px;margin-bottom:10px;background:var(--bg);border-radius:10px;">
                            <strong>${c.autorNome || 'Anônimo'}</strong>
                            <span style="color:#94A3B8;font-size:11px;"> • ${formatarData(c.createdAt)}</span>
                            ${c.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                            <p style="margin-top:5px;">${c.texto || ''}</p>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p style="color:#94A3B8;">Nenhum comentário</p>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function enviarComentario(materiaId, aulaId) {
    const texto = document.getElementById('comentario-texto');
    if (!texto || !texto.value.trim()) return;
    
    const ref = db.ref('comentarios/' + materiaId + '/' + aulaId).push();
    ref.set({
        texto: texto.value.trim(),
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        createdAt: Date.now()
    }).then(function() {
        texto.value = '';
        carregarComentarios(materiaId, aulaId);
        toast('Comentário enviado!', 'success');
    });
}

function mostrarCriarQuiz(materiaId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Novo Quiz</h3>
            <input type="text" id="quiz-nome" placeholder="Nome do quiz">
            <input type="number" id="quiz-tempo" placeholder="Tempo por questão (segundos)" value="30">
            <div id="quiz-questoes"></div>
            <button class="btn-green" onclick="adicionarQuestaoQuiz()" style="width:auto;">+ Questão</button>
            <div class="modal-buttons">
                <button class="btn-gold" onclick="gerarQuizIA('${materiaId}')">Gerar com IA</button>
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="criarQuiz('${materiaId}')">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    adicionarQuestaoQuiz();
}

function adicionarQuestaoQuiz() {
    const container = document.getElementById('quiz-questoes');
    if (!container) return;
    
    const idx = container.children.length;
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;';
    div.innerHTML = `
        <strong>Questão ${idx + 1}</strong>
        <input type="text" class="q-pergunta" placeholder="Pergunta" style="width:100%;margin-top:10px;">
        <input type="text" class="q-alt1" placeholder="Alternativa A" style="width:100%;">
        <input type="text" class="q-alt2" placeholder="Alternativa B" style="width:100%;">
        <input type="text" class="q-alt3" placeholder="Alternativa C" style="width:100%;">
        <input type="text" class="q-alt4" placeholder="Alternativa D" style="width:100%;">
        <select class="q-correta" style="width:100%;">
            <option value="0">Alternativa correta: A</option>
            <option value="1">Alternativa correta: B</option>
            <option value="2">Alternativa correta: C</option>
            <option value="3">Alternativa correta: D</option>
        </select>
    `;
    container.appendChild(div);
}

function montarQuestoesDoForm() {
    const questoes = [];
    const containers = document.querySelectorAll('#quiz-questoes > div');
    containers.forEach(function(div) {
        const pergunta = div.querySelector('.q-pergunta')?.value;
        const alts = [
            div.querySelector('.q-alt1')?.value || '',
            div.querySelector('.q-alt2')?.value || '',
            div.querySelector('.q-alt3')?.value || '',
            div.querySelector('.q-alt4')?.value || ''
        ];
        const correta = parseInt(div.querySelector('.q-correta')?.value || '0');
        
        if (pergunta && alts[0] && alts[1]) {
            questoes.push({
                pergunta: pergunta,
                alternativas: alts,
                correta: correta
            });
        }
    });
    return questoes;
}

function criarQuiz(materiaId) {
    const nome = document.getElementById('quiz-nome');
    const tempo = document.getElementById('quiz-tempo');
    
    if (!nome || !tempo) return;
    const questoes = montarQuestoesDoForm();
    
    if (!nome.value.trim() || questoes.length === 0) {
        toast('Preencha nome e pelo menos 1 questão', 'error');
        return;
    }
    
    const ref = db.ref('quizzes/' + materiaId).push();
    ref.set({
        nome: nome.value.trim(),
        tempo: parseInt(tempo.value) || 30,
        questoes: questoes,
        oficial: currentUser.adminLevel >= 1,
        isProf: currentUser.isProf || false,
        views: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Quiz criado!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarQuizzesMateria(materiaId);
    });
}

function gerarQuizIA(materiaId) {
    const nome = document.getElementById('quiz-nome');
    if (!nome || !nome.value) {
        toast('Digite um nome para o quiz', 'error');
        return;
    }
    
    toast('Gerando quiz com IA...', 'info');
    
    fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_API_KEY
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{
                role: 'user',
                content: `Crie um quiz de 5 questões sobre "${nome.value}". Retorne APENAS um JSON válido neste formato: {"questoes":[{"pergunta":"...","alternativas":["A) ...","B) ...","C) ...","D) ..."],"correta":0}]} onde correta é o índice 0-3 da alternativa correta.`
            }],
            max_tokens: 1500
        })
    }).then(function(res) {
        return res.json();
    }).then(function(data) {
        if (data.choices && data.choices[0]) {
            try {
                const conteudo = data.choices[0].message.content;
                const jsonMatch = conteudo.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const quizData = JSON.parse(jsonMatch[0]);
                    const container = document.getElementById('quiz-questoes');
                    if (container && quizData.questoes) {
                        container.innerHTML = '';
                        quizData.questoes.forEach(function(q) {
                            const div = document.createElement('div');
                            div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;';
                            div.innerHTML = `
                                <input type="text" class="q-pergunta" value="${q.pergunta || ''}" style="width:100%;">
                                <input type="text" class="q-alt1" value="${q.alternativas[0] || ''}" style="width:100%;">
                                <input type="text" class="q-alt2" value="${q.alternativas[1] || ''}" style="width:100%;">
                                <input type="text" class="q-alt3" value="${q.alternativas[2] || ''}" style="width:100%;">
                                <input type="text" class="q-alt4" value="${q.alternativas[3] || ''}" style="width:100%;">
                                <select class="q-correta" style="width:100%;">
                                    <option value="0" ${q.correta === 0 ? 'selected' : ''}>A</option>
                                    <option value="1" ${q.correta === 1 ? 'selected' : ''}>B</option>
                                    <option value="2" ${q.correta === 2 ? 'selected' : ''}>C</option>
                                    <option value="3" ${q.correta === 3 ? 'selected' : ''}>D</option>
                                </select>
                            `;
                            container.appendChild(div);
                        });
                        toast('Quiz gerado! Edite se necessário.', 'success');
                    }
                }
            } catch(e) {
                console.error('Erro ao parsear quiz IA:', e);
                toast('Erro ao gerar quiz', 'error');
            }
        }
    }).catch(function(error) {
        console.error('Erro IA:', error);
        toast('Erro na IA', 'error');
    });
}

// ===== QUIZ GAME =====
let quizState = {
    materiaId: null,
    quizId: null,
    questoes: [],
    questaoAtual: 0,
    pontuacao: 0,
    timer: null,
    segundos: 0
};

function iniciarQuiz(materiaId, quizId) {
    try {
        db.ref('quizzes/' + materiaId + '/' + quizId).once('value').then(function(snap) {
            if (!snap.exists()) return;
            const quiz = snap.val();
            
            quizState = {
                materiaId: materiaId,
                quizId: quizId,
                questoes: quiz.questoes || [],
                questaoAtual: 0,
                pontuacao: 0,
                timer: null,
                segundos: quiz.tempo || 30
            };
            
            const page = document.getElementById('page-quiz');
            if (!page) return;
            
            document.querySelectorAll('.page').forEach(function(p) {
                p.classList.remove('active');
            });
            page.classList.add('active');
            
            renderizarQuestao();
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function renderizarQuestao() {
    const page = document.getElementById('page-quiz');
    if (!page) return;
    
    if (quizState.questaoAtual >= quizState.questoes.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = quizState.questoes[quizState.questaoAtual];
    quizState.segundos = 30;
    
    page.innerHTML = `
        <div class="quiz-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <span>Questão ${quizState.questaoAtual + 1}/${quizState.questoes.length}</span>
                <span style="color:var(--gold);">⭐ ${quizState.pontuacao}</span>
            </div>
            <div class="quiz-timer" id="quiz-timer">${quizState.segundos}s</div>
            <p class="question-text">${questao.pergunta}</p>
            <div class="alternativas-list" id="alternativas-list">
                ${questao.alternativas.map(function(alt, i) {
                    return `<button onclick="responderQuiz(${i})">${alt}</button>`;
                }).join('')}
            </div>
        </div>
    `;
    
    iniciarTimer();
}

function iniciarTimer() {
    clearInterval(quizState.timer);
    const timerEl = document.getElementById('quiz-timer');
    
    quizState.timer = setInterval(function() {
        quizState.segundos--;
        if (timerEl) {
            timerEl.textContent = quizState.segundos + 's';
            if (quizState.segundos <= 5) {
                timerEl.classList.add('warning');
            }
        }
        
        if (quizState.segundos <= 0) {
            clearInterval(quizState.timer);
            responderQuiz(-1);
        }
    }, 1000);
}

function responderQuiz(resposta) {
    clearInterval(quizState.timer);
    
    const questao = quizState.questoes[quizState.questaoAtual];
    const correta = questao.correta;
    const botoes = document.querySelectorAll('#alternativas-list button');
    
    if (botoes.length > 0) {
        botoes.forEach(function(btn, i) {
            btn.style.pointerEvents = 'none';
            if (i === correta) {
                btn.classList.add('correct');
            }
            if (i === resposta && i !== correta) {
                btn.classList.add('wrong');
            }
        });
    }
    
    if (resposta === correta) {
        quizState.pontuacao += 10;
    }
    
    setTimeout(function() {
        quizState.questaoAtual++;
        renderizarQuestao();
    }, 1500);
}

function finalizarQuiz() {
    clearInterval(quizState.timer);
    const page = document.getElementById('page-quiz');
    if (!page) return;
    
    const total = quizState.questoes.length;
    const acertos = Math.round(quizState.pontuacao / 10);
    const porcentagem = total > 0 ? Math.round((acertos / total) * 100) : 0;
    
    // Atualizar pontos
    if (currentUser && currentUser.uid) {
        const novosPontos = (currentUser.points || 0) + quizState.pontuacao;
        db.ref('usuarios/' + currentUser.uid + '/points').set(novosPontos);
        currentUser.points = novosPontos;
    }
    
    page.innerHTML = `
        <div class="quiz-container text-center">
            <h2>Quiz Finalizado!</h2>
            <div style="font-size:64px;margin:20px 0;">${porcentagem >= 70 ? '🎉' : porcentagem >= 40 ? '👍' : '💪'}</div>
            <div class="stat-card" style="margin:20px 0;">
                <div class="stat-value" style="color:var(--gold);">${quizState.pontuacao}</div>
                <div class="stat-label">Pontos ganhos</div>
            </div>
            <p>Acertos: ${acertos}/${total} (${porcentagem}%)</p>
            <button class="btn-primary" onclick="navegar('materias')" style="margin-top:20px;">Voltar às Disciplinas</button>
        </div>
    `;
}

// ===== RANKING =====
function carregarRanking() {
    const page = document.getElementById('page-ranking');
    if (!page) return;
    
    page.innerHTML = `
        <h2 style="margin-bottom:20px;">🏆 Ranking</h2>
        <div class="tabs">
            <div class="tab active" onclick="carregarRankingTipo('alunos')">Alunos</div>
            <div class="tab" onclick="carregarRankingTipo('professores')">Professores</div>
        </div>
        <div id="ranking-podio"></div>
        <div id="ranking-lista"></div>
    `;
    
    carregarRankingTipo('alunos');
}

function carregarRankingTipo(tipo) {
    try {
        let query = db.ref('usuarios').orderByChild('points');
        
        query.once('value').then(function(snap) {
            if (snap.exists()) {
                const usuarios = [];
                snap.forEach(function(child) {
                    const u = child.val();
                    if (tipo === 'professores' && u.isProf) {
                        usuarios.push({id: child.key, ...u});
                    } else if (tipo === 'alunos' && !u.isProf) {
                        usuarios.push({id: child.key, ...u});
                    }
                });
                
                usuarios.sort(function(a, b) {
                    return (b.points || 0) - (a.points || 0);
                });
                
                const top50 = usuarios.slice(0, 50);
                const top3 = top50.slice(0, 3);
                
                // Pódio
                const podio = document.getElementById('ranking-podio');
                if (podio) {
                    podio.innerHTML = `
                        <div class="podio-container">
                            ${top3[1] ? `
                            <div class="podio-item segundo">
                                <img src="${top3[1].avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="podio-avatar">
                                <div class="podio-username">${top3[1].username || '---'}</div>
                                <div class="podio-points">${top3[1].points || 0}</div>
                                <div>🥈 2° Lugar</div>
                            </div>` : ''}
                            ${top3[0] ? `
                            <div class="podio-item primeiro">
                                <img src="${top3[0].avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="podio-avatar">
                                <div class="podio-username">${top3[0].username || '---'}</div>
                                <div class="podio-points">${top3[0].points || 0}</div>
                                <div>👑 1° Lugar</div>
                            </div>` : ''}
                            ${top3[2] ? `
                            <div class="podio-item terceiro">
                                <img src="${top3[2].avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="podio-avatar">
                                <div class="podio-username">${top3[2].username || '---'}</div>
                                <div class="podio-points">${top3[2].points || 0}</div>
                                <div>🥉 3° Lugar</div>
                            </div>` : ''}
                        </div>
                    `;
                }
                
                // Lista
                const lista = document.getElementById('ranking-lista');
                if (lista) {
                    let html = '<h3 style="margin:20px 0;">Top 50</h3>';
                    top50.forEach(function(u, i) {
                        html += `
                            <div class="card" style="display:flex;align-items:center;gap:15px;">
                                <span style="font-weight:800;font-size:18px;width:30px;">#${i + 1}</span>
                                <img src="${u.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" style="width:40px;height:40px;border-radius:50%;">
                                <div style="flex:1;">
                                    <strong>${u.username || 'Anônimo'}</strong>
                                    ${u.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                                    ${u.adminLevel >= 1 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo-icon">' : ''}
                                    ${u.plano === 'premium' || u.plano === 'pro' ? '<img src="https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png" class="selo-icon">' : ''}
                                </div>
                                <span style="color:var(--gold);font-weight:700;">⭐ ${u.points || 0}</span>
                            </div>
                        `;
                    });
                    lista.innerHTML = html;
                }
            }
        });
    } catch(e) {
        console.error('Erro ranking:', e);
    }
}

// ===== DESAFIOS =====
function carregarDesafios() {
    const page = document.getElementById('page-desafios');
    if (!page) return;
    
    page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2>🗓️ Desafios</h2>
            ${(currentUser && currentUser.adminLevel >= 1) ? '<button class="btn-primary" onclick="mostrarCriarDesafio()" style="width:auto;">+ Novo</button>' : ''}
        </div>
        <div id="desafios-list"></div>
    `;
    
    try {
        db.ref('desafios').once('value').then(function(snap) {
            const container = document.getElementById('desafios-list');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const d = child.val();
                    const agora = Date.now();
                    const status = agora < d.inicio ? '⏳ Em breve' : agora > d.fim ? '🔒 Encerrado' : '🔥 Ativo';
                    
                    html += `
                        <div class="card">
                            ${d.banner ? `<img src="${d.banner}" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:15px;">` : ''}
                            <h3>${d.titulo || 'Desafio'}</h3>
                            <p style="color:#94A3B8;">${d.descricao || ''}</p>
                            <div style="display:flex;gap:20px;margin:10px 0;font-size:12px;">
                                <span>📅 ${new Date(d.inicio).toLocaleDateString()} - ${new Date(d.fim).toLocaleDateString()}</span>
                                <span>🏆 Prêmio: ${d.premio || 0} pontos</span>
                            </div>
                            <span class="badge ${status.includes('Ativo') ? 'badge-verificado' : ''}">${status}</span>
                            ${status.includes('Ativo') ? `<button class="btn-primary" onclick="participarDesafio('${child.key}')" style="margin-top:10px;">Participar</button>` : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><p>Nenhum desafio disponível</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function mostrarCriarDesafio() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Novo Desafio</h3>
            <input type="text" id="desafio-titulo" placeholder="Título">
            <textarea id="desafio-descricao" placeholder="Descrição"></textarea>
            <input type="text" id="desafio-materia" placeholder="Matéria (ex: Matemática)">
            <input type="text" id="desafio-banner" placeholder="URL do banner">
            <input type="datetime-local" id="desafio-inicio" placeholder="Início">
            <input type="datetime-local" id="desafio-fim" placeholder="Fim">
            <input type="number" id="desafio-premio" placeholder="Prêmio em pontos" value="100">
            <div id="desafio-questoes"></div>
            <button class="btn-green" onclick="adicionarQuestaoDesafio()" style="width:auto;">+ Questão</button>
            <div class="modal-buttons">
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="criarDesafio()">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    adicionarQuestaoDesafio();
}

function adicionarQuestaoDesafio() {
    const container = document.getElementById('desafio-questoes');
    if (!container) return;
    
    const idx = container.children.length;
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;';
    div.innerHTML = `
        <strong>Questão ${idx + 1}</strong>
        <input type="text" class="dq-pergunta" placeholder="Pergunta" style="width:100%;margin-top:10px;">
        <input type="text" class="dq-alt1" placeholder="Alternativa A" style="width:100%;">
        <input type="text" class="dq-alt2" placeholder="Alternativa B" style="width:100%;">
        <input type="text" class="dq-alt3" placeholder="Alternativa C" style="width:100%;">
        <input type="text" class="dq-alt4" placeholder="Alternativa D" style="width:100%;">
        <select class="dq-correta" style="width:100%;">
            <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
        </select>
    `;
    container.appendChild(div);
}

function criarDesafio() {
    const titulo = document.getElementById('desafio-titulo')?.value;
    const descricao = document.getElementById('desafio-descricao')?.value;
    const materia = document.getElementById('desafio-materia')?.value;
    const banner = document.getElementById('desafio-banner')?.value;
    const inicio = document.getElementById('desafio-inicio')?.value;
    const fim = document.getElementById('desafio-fim')?.value;
    const premio = parseInt(document.getElementById('desafio-premio')?.value || '100');
    
    if (!titulo || !inicio || !fim) {
        toast('Preencha título, início e fim', 'error');
        return;
    }
    
    const questoes = [];
    document.querySelectorAll('#desafio-questoes > div').forEach(function(div) {
        const pergunta = div.querySelector('.dq-pergunta')?.value;
        const alts = [
            div.querySelector('.dq-alt1')?.value || '',
            div.querySelector('.dq-alt2')?.value || '',
            div.querySelector('.dq-alt3')?.value || '',
            div.querySelector('.dq-alt4')?.value || ''
        ];
        const correta = parseInt(div.querySelector('.dq-correta')?.value || '0');
        if (pergunta && alts[0]) {
            questoes.push({pergunta, alternativas: alts, correta});
        }
    });
    
    db.ref('desafios').push().set({
        titulo, descricao: descricao || '', materia: materia || '',
        banner: banner || '', premio, questoes,
        inicio: new Date(inicio).getTime(),
        fim: new Date(fim).getTime(),
        criadoPor: currentUser.uid,
        participantes: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Desafio criado!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarDesafios();
    });
}

function participarDesafio(desafioId) {
    if (!currentUser) return;
    
    db.ref('desafios/' + desafioId).once('value').then(function(snap) {
        if (!snap.exists()) return;
        const desafio = snap.val();
        
        if (desafio.questoes && desafio.questoes.length > 0) {
            const questaoAleatoria = desafio.questoes[Math.floor(Math.random() * desafio.questoes.length)];
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <h3>Desafio: ${desafio.titulo}</h3>
                    <p>${questaoAleatoria.pergunta}</p>
                    ${questaoAleatoria.alternativas.map(function(alt, i) {
                        return `<button class="btn-primary" style="margin:5px;display:block;width:100%;text-align:left;" onclick="responderDesafio('${desafioId}', ${i}, ${questaoAleatoria.correta}, ${desafio.premio || 0}, this)">${alt}</button>`;
                    }).join('')}
                </div>
            `;
            document.body.appendChild(modal);
        }
    });
}

function responderDesafio(desafioId, resposta, correta, premio, btn) {
    if (resposta === correta) {
        const novosPontos = (currentUser.points || 0) + premio;
        db.ref('usuarios/' + currentUser.uid + '/points').set(novosPontos);
        currentUser.points = novosPontos;
        toast(`🎉 Correto! +${premio} pontos!`, 'success');
    } else {
        toast('Resposta incorreta!', 'error');
    }
    
    db.ref('desafios/' + desafioId + '/participantes/' + currentUser.uid).set(true);
    document.querySelector('.modal-overlay')?.remove();
}

// ===== JARVIS IA =====
function carregarJarvis() {
    const page = document.getElementById('page-jarvis');
    if (!page) return;
    
    page.innerHTML = `
        <h2 style="margin-bottom:20px;">🤖 Jarvis IA</h2>
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <div class="message ai">
                    <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" style="width:30px;height:30px;border-radius:50%;">
                    <div class="message-content">Olá! Sou o Jarvis, seu assistente de estudos. Como posso ajudar?</div>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="file" id="jarvis-image" accept="image/*" style="display:none;" onchange="analisarImagemJarvis()">
                <button onclick="document.getElementById('jarvis-image').click()" title="Enviar imagem"><i class="fas fa-image"></i></button>
                <input type="text" id="jarvis-input" placeholder="Digite sua mensagem...">
                <button onclick="enviarMensagemJarvis()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
}

function enviarMensagemJarvis() {
    const input = document.getElementById('jarvis-input');
    const messages = document.getElementById('chat-messages');
    if (!input || !messages) return;
    
    const texto = input.value.trim();
    if (!texto) return;
    
    // Adicionar mensagem do usuário
    messages.innerHTML += `
        <div class="message user">
            <div class="message-content">${texto}</div>
        </div>
    `;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    // Adicionar placeholder
    const placeholderId = 'msg-placeholder-' + Date.now();
    messages.innerHTML += `
        <div class="message ai" id="${placeholderId}">
            <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" style="width:30px;height:30px;border-radius:50%;">
            <div class="message-content">Pensando...</div>
        </div>
    `;
    
    chatHistory.push({role: 'user', content: texto});
    
    try {
        fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {role: 'system', content: 'Você é Jarvis, assistente de estudos da Sexta-Feira Studies. Seja prestativo e educativo.'},
                    ...chatHistory.slice(-10)
                ],
                max_tokens: 1000
            })
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            const placeholder = document.getElementById(placeholderId);
            if (placeholder && data.choices && data.choices[0]) {
                const resposta = data.choices[0].message.content;
                placeholder.querySelector('.message-content').textContent = resposta;
                chatHistory.push({role: 'assistant', content: resposta});
            } else if (placeholder) {
                placeholder.querySelector('.message-content').textContent = 'Desculpe, ocorreu um erro.';
            }
            messages.scrollTop = messages.scrollHeight;
        }).catch(function(error) {
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.querySelector('.message-content').textContent = 'Erro de conexão. Tente novamente.';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function analisarImagemJarvis() {
    const fileInput = document.getElementById('jarvis-image');
    if (!fileInput || !fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    const messages = document.getElementById('chat-messages');
    
    toast('Analisando imagem...', 'info');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST',
            body: formData
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            if (data.success) {
                const imageUrl = data.data.url;
                
                messages.innerHTML += `
                    <div class="message user">
                        <div class="message-content">
                            <img src="${imageUrl}" style="max-width:200px;border-radius:10px;">
                            <p>Analise esta imagem</p>
                        </div>
                    </div>
                `;
                
                // Análise com Gemini
                fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + GEMINI_API_KEY, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {text: 'Analise esta imagem em detalhes. O que você vê?'},
                                {inlineData: {mimeType: 'image/jpeg', data: ''}} // Simplificado
                            ]
                        }]
                    })
                }).then(function(res) {
                    return res.json();
                }).then(function(geminiData) {
                    const resposta = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Imagem enviada! Use o chat para perguntar sobre ela.';
                    messages.innerHTML += `
                        <div class="message ai">
                            <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" style="width:30px;height:30px;border-radius:50%;">
                            <div class="message-content">${resposta}</div>
                        </div>
                    `;
                    messages.scrollTop = messages.scrollHeight;
                }).catch(function() {
                    messages.innerHTML += `
                        <div class="message ai">
                            <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" style="width:30px;height:30px;border-radius:50%;">
                            <div class="message-content">Imagem recebida! Faça perguntas sobre ela no chat.</div>
                        </div>
                    `;
                });
            }
        });
    } catch(e) {
        console.error('Erro upload:', e);
    }
}

// ===== FEED =====
function carregarFeed() {
    const page = document.getElementById('page-feed');
    if (!page) return;
    
    page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2>📰 Feed</h2>
            <button class="btn-primary" onclick="mostrarCriarPost()" style="width:auto;">+ Post</button>
        </div>
        <div id="feed-list"></div>
    `;
    
    try {
        db.ref('posts').orderByChild('createdAt').once('value').then(function(snap) {
            const container = document.getElementById('feed-list');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '';
                const posts = [];
                snap.forEach(function(child) {
                    posts.unshift({id: child.key, ...child.val()});
                });
                
                posts.forEach(function(post) {
                    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
                    const isLiked = post.likes && currentUser && post.likes[currentUser.uid];
                    
                    html += `
                        <div class="post-card">
                            <div class="post-header">
                                <img src="${post.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="post-avatar">
                                <div>
                                    <span class="post-autor">${post.autorNome || 'Anônimo'}</span>
                                    ${post.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                                    <br><span class="post-data">${formatarData(post.createdAt)}</span>
                                </div>
                                <span class="badge" style="margin-left:auto;">${post.tipo === 'dica' ? '💡 Dica' : post.tipo === 'duvida' ? '❓ Dúvida' : '📝 Post'}</span>
                            </div>
                            <p class="post-texto">${post.texto || ''}</p>
                            ${post.imagem ? `<img src="${post.imagem}" class="post-imagem">` : ''}
                            <div class="post-actions">
                                <button class="${isLiked ? 'liked' : ''}" onclick="curtirPost('${post.id}')">
                                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${likesCount}
                                </button>
                                <button>
                                    <i class="far fa-eye"></i> ${post.views ? Object.keys(post.views).length : 0}
                                </button>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhum post no feed</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro feed:', e);
    }
}

function mostrarCriarPost() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Novo Post</h3>
            <select id="post-tipo">
                <option value="post">Post normal</option>
                <option value="dica">Dica</option>
                <option value="duvida">Dúvida</option>
            </select>
            <textarea id="post-texto" placeholder="O que você quer compartilhar?"></textarea>
            <input type="file" id="post-imagem" accept="image/*">
            <div class="modal-buttons">
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="criarPost()">Publicar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function criarPost() {
    const texto = document.getElementById('post-texto')?.value;
    const tipo = document.getElementById('post-tipo')?.value || 'post';
    const imagemFile = document.getElementById('post-imagem')?.files[0];
    
    if (!texto || !texto.trim()) {
        toast('Escreva algo', 'error');
        return;
    }
    
    const postData = {
        texto: texto.trim(),
        tipo: tipo,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        avatar: currentUser.avatar || '',
        isProf: currentUser.isProf || false,
        likes: {},
        views: {},
        createdAt: Date.now()
    };
    
    if (imagemFile) {
        const formData = new FormData();
        formData.append('image', imagemFile);
        
        fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST',
            body: formData
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            if (data.success) {
                postData.imagem = data.data.url;
            }
            salvarPost(postData);
        }).catch(function() {
            salvarPost(postData);
        });
    } else {
        salvarPost(postData);
    }
}

function salvarPost(postData) {
    db.ref('posts').push().set(postData).then(function() {
        toast('Post publicado!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarFeed();
    });
}

function curtirPost(postId) {
    if (!currentUser) return;
    
    const ref = db.ref('posts/' + postId + '/likes/' + currentUser.uid);
    ref.once('value').then(function(snap) {
        if (snap.exists()) {
            ref.remove();
        } else {
            ref.set(true);
        }
        carregarFeed();
    });
}

// ===== PERFIL =====
function carregarPerfil() {
    const page = document.getElementById('page-perfil');
    if (!page || !currentUser) return;
    
    page.innerHTML = `
        <div class="text-center" style="margin-bottom:20px;">
            <img src="${currentUser.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" style="width:100px;height:100px;border-radius:50%;margin-bottom:10px;">
            <h2>${currentUser.fullname || currentUser.username}</h2>
            <p style="color:#94A3B8;">${currentUser.username || ''}</p>
            <p>${currentUser.bio || 'Sem bio'}</p>
            <div style="margin:10px 0;">
                ${currentUser.adminLevel >= 1 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo-icon" title="Admin">' : ''}
                ${currentUser.isProf ? '<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" class="selo-icon" title="Professor">' : ''}
                ${currentUser.plano === 'premium' || currentUser.plano === 'pro' ? '<img src="https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png" class="selo-icon" title="Premium">' : ''}
                ${currentUser.isQuizzer ? '<img src="https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png" class="selo-icon" title="Quizzer">' : ''}
                <img src="https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png" class="selo-icon" title="Verificado">
            </div>
            <p style="color:var(--gold);font-size:24px;font-weight:800;">⭐ ${currentUser.points || 0}</p>
            <button class="btn-primary" onclick="mostrarEditarPerfil()" style="width:auto;">Editar Perfil</button>
            <button class="btn-danger" onclick="logout()" style="width:auto;margin-left:10px;">Sair</button>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="carregarPerfilAulas()">Aulas</div>
            <div class="tab" onclick="carregarPerfilPosts()">Posts</div>
            <div class="tab" onclick="carregarPerfilMaterias()">Disciplinas</div>
        </div>
        <div id="perfil-content"></div>
    `;
    
    carregarPerfilAulas();
}

function carregarPerfilAulas() {
    const container = document.getElementById('perfil-content');
    if (!container) return;
    container.innerHTML = '<p style="color:#94A3B8;">Carregando...</p>';
    // Implementação simplificada
    container.innerHTML = '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>Em breve</p></div>';
}

function carregarPerfilPosts() {
    const container = document.getElementById('perfil-content');
    if (!container) return;
    
    try {
        db.ref('posts').orderByChild('autorId').equalTo(currentUser.uid).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const post = child.val();
                    html += `<div class="post-card"><p>${post.texto || ''}</p><span class="post-data">${formatarData(post.createdAt)}</span></div>`;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhum post</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function carregarPerfilMaterias() {
    const container = document.getElementById('perfil-content');
    if (!container) return;
    
    try {
        db.ref('materias').orderByChild('autorId').equalTo(currentUser.uid).once('value').then(function(snap) {
            if (snap.exists()) {
                let html = '';
                snap.forEach(function(child) {
                    const mat = child.val();
                    html += `<div class="card"><strong>${mat.icone || ''} ${mat.nome || ''}</strong><p style="color:#94A3B8;">${mat.descricao || ''}</p></div>`;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Nenhuma disciplina</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

function mostrarEditarPerfil() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Editar Perfil</h3>
            <input type="text" id="edit-bio" placeholder="Bio" value="${currentUser.bio || ''}">
            <input type="file" id="edit-avatar" accept="image/*">
            ${currentUser.avatar ? `<img src="${currentUser.avatar}" style="width:50px;height:50px;border-radius:50%;margin:10px 0;">` : ''}
            <div class="modal-buttons">
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="salvarPerfil()">Salvar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function salvarPerfil() {
    const bio = document.getElementById('edit-bio')?.value || '';
    const avatarFile = document.getElementById('edit-avatar')?.files[0];
    
    if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        
        fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST',
            body: formData
        }).then(function(res) {
            return res.json();
        }).then(function(data) {
            if (data.success) {
                db.ref('usuarios/' + currentUser.uid).update({
                    bio: bio,
                    avatar: data.data.url
                }).then(function() {
                    currentUser.bio = bio;
                    currentUser.avatar = data.data.url;
                    toast('Perfil atualizado!', 'success');
                    document.querySelector('.modal-overlay')?.remove();
                    carregarPerfil();
                });
            }
        }).catch(function() {
            atualizarBio(bio);
        });
    } else {
        atualizarBio(bio);
    }
}

function atualizarBio(bio) {
    db.ref('usuarios/' + currentUser.uid).update({bio: bio}).then(function() {
        currentUser.bio = bio;
        toast('Bio atualizada!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarPerfil();
    });
}

// ===== SOBRE =====
function carregarSobre() {
    const page = document.getElementById('page-sobre');
    if (!page) return;
    
    try {
        db.ref('config/sobre').once('value').then(function(snap) {
            const texto = snap.exists() ? snap.val() : 'Sexta-Feira Studies - A rede social de estudos gamificada.';
            page.innerHTML = `
                <h2 style="margin-bottom:20px;">ℹ️ Sobre Nós</h2>
                <div class="card" style="white-space:pre-wrap;">${texto}</div>
                <div class="text-center" style="margin-top:20px;color:#94A3B8;">
                    <p>Feito com ❤️ por Sexta-Feira Studies</p>
                </div>
            `;
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

// ===== UPDATES =====
function carregarUpdates() {
    const page = document.getElementById('page-updates');
    if (!page) return;
    
    try {
        db.ref('config/updates').once('value').then(function(snap) {
            let html = '<h2 style="margin-bottom:20px;">📋 Update Log</h2>';
            
            if (snap.exists()) {
                const updates = [];
                snap.forEach(function(child) {
                    updates.unshift({id: child.key, ...child.val()});
                });
                
                updates.forEach(function(up) {
                    html += `
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">${up.titulo || 'Update'}</span>
                                <span class="badge badge-verificado">v${up.versao || '1.0'}</span>
                            </div>
                            <p style="white-space:pre-wrap;">${up.descricao || ''}</p>
                            <span style="font-size:11px;color:#94A3B8;">${up.data || ''}</span>
                        </div>
                    `;
                });
            } else {
                html += '<div class="empty-state"><i class="fas fa-sync-alt"></i><p>Nenhum update registrado</p></div>';
            }
            
            page.innerHTML = html;
        });
    } catch(e) {
        console.error('Erro:', e);
    }
}

// ===== UTILS =====
function toast(msg, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 3000);
}

function formatarData(timestamp) {
    if (!timestamp) return '';
    const data = new Date(timestamp);
    const agora = new Date();
    const diff = agora - data;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'min atrás';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h atrás';
    
    return data.toLocaleDateString('pt-BR');
}

function carregarFooter() {
    const footer = document.getElementById('sidebar-footer');
    if (footer) {
        footer.innerHTML = 'Feito com ❤️ por<br>Sexta-Feira Studies';
    }
}

// Mostrar vídeos do YouTube
function mostrarAdicionarVideo(materiaId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Adicionar Vídeo</h3>
            <input type="text" id="video-titulo" placeholder="Título do vídeo">
            <input type="text" id="video-url" placeholder="URL do YouTube">
            <div class="modal-buttons">
                <button class="btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="adicionarVideo('${materiaId}')">Adicionar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function adicionarVideo(materiaId) {
    const titulo = document.getElementById('video-titulo')?.value;
    const url = document.getElementById('video-url')?.value;
    
    if (!titulo || !url) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    
    db.ref('videos/' + materiaId).push().set({
        titulo: titulo,
        url: url,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        createdAt: Date.now()
    }).then(function() {
        toast('Vídeo adicionado!', 'success');
        document.querySelector('.modal-overlay')?.remove();
        carregarVideosMateria(materiaId);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já tem usuário autenticado
    if (auth.currentUser) {
        carregarUsuario(auth.currentUser.uid);
    } else {
        mostrarTela('login-screen');
    }
});
