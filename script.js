// ==================== CONFIGURAÇÃO FIREBASE ====================
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
const storage = firebase.storage();

// ==================== API KEYS ====================
const GROQ_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY";
const IMGBB_API_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

// ==================== ESTADO GLOBAL ====================
let currentUser = null;
let currentPage = 'home';
let chatHistory = [];
let modoFoco = false;
let pomodoroInterval = null;
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroMode = 'focus'; // focus, shortBreak, longBreak

// ==================== DOM HELPERS ====================
function $(id) { return document.getElementById(id); }
function $$(selector) { return document.querySelectorAll(selector); }

// ==================== AUTH OBSERVER ====================
auth.onAuthStateChanged(function(user) {
    if (user) {
        carregarUsuario(user.uid);
    } else {
        mostrarTela('login-screen');
    }
});

// ==================== CARREGAR USUÁRIO ====================
function carregarUsuario(uid) {
    try {
        db.ref('usuarios/' + uid).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
                currentUser = snapshot.val();
                currentUser.uid = uid;
                
                // Atualizar lastLogin
                db.ref('usuarios/' + uid + '/lastLogin').set(Date.now());
                
                mostrarTela('main-app');
                navegar('home');
                verificarNotificacoes();
                verificarConquistas();
            } else {
                // Usuário Google sem cadastro
                const googleUser = auth.currentUser;
                if (googleUser) {
                    const userData = {
                        fullname: googleUser.displayName || 'Usuário',
                        username: '@' + (googleUser.email ? googleUser.email.split('@')[0] : 'user_' + Date.now().toString(36)),
                        email: googleUser.email || '',
                        password: '',
                        avatar: googleUser.photoURL || '',
                        bio: '',
                        points: 0,
                        plano: 'gratis',
                        adminLevel: 0,
                        isProf: false,
                        isQuizzer: false,
                        seguidores: {},
                        seguindo: {},
                        conquistas: [],
                        configuracoes: { temaCor: '#3B82F6' },
                        createdAt: Date.now(),
                        lastLogin: Date.now()
                    };
                    db.ref('usuarios/' + uid).set(userData);
                    currentUser = userData;
                    currentUser.uid = uid;
                    mostrarTela('main-app');
                    navegar('home');
                }
            }
        });
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
}

// ==================== TELAS ====================
function mostrarTela(screenId) {
    $$('.screen').forEach(function(s) { s.classList.remove('active'); });
    const screen = $(screenId);
    if (screen) screen.classList.add('active');
}

function navegar(page) {
    currentPage = page;
    
    // Esconder todas as páginas
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    
    // Ativar página
    const pageEl = $('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    
    // Atualizar nav
    $$('.nav-menu li').forEach(function(li) { li.classList.remove('active'); });
    const navItem = document.querySelector(`.nav-menu li[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    
    $$('#bottom-nav button').forEach(function(btn) { btn.classList.remove('active'); });
    const bottomBtn = document.querySelector(`#bottom-nav button[data-page="${page}"]`);
    if (bottomBtn) bottomBtn.classList.add('active');
    
    // Título
    const title = $('page-title');
    if (title) {
        const titles = {
            home: 'Home', materias: 'Disciplinas', ranking: 'Ranking', desafios: 'Desafios',
            jarvis: 'Jarvis IA', feed: 'Feed', chat: 'Chat', grupos: 'Grupos',
            flashcards: 'Flashcards', pomodoro: 'Pomodoro', perfil: 'Perfil',
            sobre: 'Sobre Nós', updates: 'Updates', calendario: 'Calendário',
            notificacoes: 'Notificações'
        };
        title.textContent = titles[page] || page;
    }
    
    // Carregar conteúdo
    const loaders = {
        home: carregarHome, materias: carregarMaterias, ranking: carregarRanking,
        desafios: carregarDesafios, jarvis: carregarJarvis, feed: carregarFeed,
        chat: carregarChat, grupos: carregarGrupos, flashcards: carregarFlashcards,
        pomodoro: carregarPomodoro, perfil: carregarPerfil, sobre: carregarSobre,
        updates: carregarUpdates, calendario: carregarCalendario,
        notificacoes: carregarNotificacoes
    };
    
    if (loaders[page]) loaders[page]();
    
    // Fechar sidebar no mobile
    const sidebar = $('sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
    }
}

function toggleSidebar() {
    const sidebar = $('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// ==================== AUTH FUNCTIONS ====================
function fazerLogin() {
    const username = $('login-username');
    const password = $('login-password');
    if (!username || !password) return;
    
    const userVal = username.value.trim();
    const passVal = password.value;
    
    if (!userVal || !passVal) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        db.ref('usuarios').orderByChild('username').equalTo(userVal).once('value')
        .then(function(snapshot) {
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
                    auth.signInWithEmailAndPassword(foundUser.email, passVal)
                    .then(function() {
                        currentUser = foundUser;
                        currentUser.uid = foundUid;
                        mostrarTela('main-app');
                        navegar('home');
                        verificarNotificacoes();
                        toast('Bem-vindo(a), ' + foundUser.username + '!', 'success');
                    }).catch(function() {
                        // Fallback: login local
                        currentUser = foundUser;
                        currentUser.uid = foundUid;
                        mostrarTela('main-app');
                        navegar('home');
                        verificarNotificacoes();
                        toast('Bem-vindo(a), ' + foundUser.username + '!', 'success');
                    });
                } else {
                    toast('Senha incorreta', 'error');
                }
            } else {
                toast('Usuário não encontrado', 'error');
            }
        });
    } catch(e) {
        console.error('Erro login:', e);
        toast('Erro ao fazer login', 'error');
    }
}

function loginComGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function(result) {
        toast('Login com Google realizado!', 'success');
    }).catch(function(error) {
        console.error('Erro Google:', error);
        toast('Erro ao logar com Google', 'error');
    });
}

function mostrarRegistro() {
    const loginForm = $('login-form');
    const registroForm = $('registro-form');
    if (loginForm) loginForm.style.display = 'none';
    if (registroForm) registroForm.style.display = 'block';
}

function mostrarLogin() {
    const loginForm = $('login-form');
    const registroForm = $('registro-form');
    if (registroForm) registroForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
}

function registrar() {
    const fullname = $('reg-fullname');
    const username = $('reg-username');
    const email = $('reg-email');
    const password = $('reg-password');
    
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
    
    if (!data.username.startsWith('@')) data.username = '@' + data.username;
    
    try {
        db.ref('usuarios').orderByChild('username').equalTo(data.username).once('value')
        .then(function(snapshot) {
            if (snapshot.exists()) {
                toast('Nome de usuário já existe', 'error');
                return;
            }
            
            auth.createUserWithEmailAndPassword(data.email, data.password)
            .then(function(result) {
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
                    seguidores: {},
                    seguindo: {},
                    conquistas: [],
                    configuracoes: { temaCor: '#3B82F6' },
                    createdAt: Date.now(),
                    lastLogin: Date.now()
                };
                
                db.ref('usuarios/' + result.user.uid).set(userData)
                .then(function() {
                    currentUser = userData;
                    currentUser.uid = result.user.uid;
                    mostrarTela('main-app');
                    navegar('home');
                    toast('Conta criada com sucesso!', 'success');
                });
            }).catch(function(error) {
                if (error.code === 'auth/email-already-in-use') {
                    toast('Email já está em uso', 'error');
                } else {
                    toast('Erro: ' + error.message, 'error');
                }
            });
        });
    } catch(e) {
        console.error('Erro registro:', e);
        toast('Erro ao registrar', 'error');
    }
}

function recuperarSenha() {
    const email = prompt('Digite seu email para recuperar a senha:');
    if (email) {
        auth.sendPasswordResetEmail(email).then(function() {
            toast('Email de recuperação enviado!', 'success');
        }).catch(function(error) {
            toast('Erro: ' + error.message, 'error');
        });
    }
}

function logout() {
    auth.signOut().then(function() {
        currentUser = null;
        chatHistory = [];
        clearInterval(pomodoroInterval);
        mostrarTela('login-screen');
        toast('Até logo!', 'info');
    });
}

// ==================== HOME ====================
function carregarHome() {
    const page = $('page-home');
    if (!page || !currentUser) return;
    
    const points = currentUser.points || 0;
    const nivel = Math.floor(points / 100) + 1;
    const pontosParaProximoNivel = 100 - (points % 100);
    const progressoNivel = (points % 100);
    
    let html = `
        <h2 style="margin-bottom:10px;">Olá, ${currentUser.fullname || currentUser.username}!</h2>
        
        <div class="card" style="margin-bottom:20px;">
            <div class="progress-info">
                <span>Nível ${nivel}</span>
                <span>${progressoNivel}/100 → Nível ${nivel + 1}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${progressoNivel}%;"></div>
            </div>
            <p style="font-size:12px;color:#94A3B8;margin-top:5px;">Faltam ${pontosParaProximoNivel} pontos para o próximo nível</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${points}</div>
                <div class="stat-label">Pontos</div>
            </div>
            <div class="stat-card" id="home-card-materias">
                <div class="stat-icon">📚</div>
                <div class="stat-value">0</div>
                <div class="stat-label">Disciplinas</div>
            </div>
            <div class="stat-card" id="home-card-quizzes">
                <div class="stat-icon">📝</div>
                <div class="stat-value">0</div>
                <div class="stat-label">Quizzes</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${currentUser.seguidores ? Object.keys(currentUser.seguidores).length : 0}</div>
                <div class="stat-label">Seguidores</div>
            </div>
        </div>
        
        <div id="home-banner-desafio"></div>
        
        <div class="card">
            <div class="card-header">
                <span class="card-title">📰 Feed Recente</span>
                <button class="btn-icon" onclick="navegar('feed')">Ver todos →</button>
            </div>
            <div id="home-feed"></div>
        </div>
    `;
    
    page.innerHTML = html;
    
    // Carregar banner de desafio próximo
    carregarBannerDesafio();
    
    // Carregar contagens
    try {
        db.ref('materias').once('value').then(function(snap) {
            const el = document.querySelector('#home-card-materias .stat-value');
            if (el) el.textContent = snap.exists() ? snap.numChildren() : 0;
        });
        
        db.ref('quizzes').once('value').then(function(snap) {
            let count = 0;
            if (snap.exists()) {
                snap.forEach(function(m) { count += m.numChildren(); });
            }
            const el = document.querySelector('#home-card-quizzes .stat-value');
            if (el) el.textContent = count;
        });
        
        // Feed recente
        db.ref('posts').orderByChild('createdAt').limitToLast(5).once('value')
        .then(function(snap) {
            const container = $('home-feed');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '';
                const posts = [];
                snap.forEach(function(child) {
                    posts.unshift({id: child.key, ...child.val()});
                });
                
                posts.forEach(function(post) {
                    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
                    const viewsCount = post.views ? Object.keys(post.views).length : 0;
                    html += `
                        <div class="post-card" style="margin-bottom:10px;">
                            <div class="post-header">
                                <img src="${post.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="post-avatar">
                                <div>
                                    <span class="post-autor">${post.autorNome || 'Anônimo'}</span>
                                    ${post.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                                    <br><span class="post-data">${formatarData(post.createdAt)}</span>
                                </div>
                            </div>
                            <p class="post-texto">${(post.texto || '').substring(0, 200)}${post.texto && post.texto.length > 200 ? '...' : ''}</p>
                            <div class="post-actions">
                                <span><i class="far fa-heart"></i> ${likesCount}</span>
                                <span><i class="far fa-eye"></i> ${viewsCount}</span>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhum post ainda</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro home:', e);
    }
}

function carregarBannerDesafio() {
    const container = $('home-banner-desafio');
    if (!container) return;
    
    try {
        db.ref('desafios').once('value').then(function(snap) {
            if (snap.exists()) {
                let desafioProximo = null;
                const agora = Date.now();
                
                snap.forEach(function(child) {
                    const d = child.val();
                    if (d.inicio > agora && (!desafioProximo || d.inicio < desafioProximo.inicio)) {
                        desafioProximo = {id: child.key, ...d};
                    }
                });
                
                if (desafioProximo) {
                    const diasRestantes = Math.ceil((desafioProximo.inicio - agora) / (1000 * 60 * 60 * 24));
                    container.innerHTML = `
                        <div class="banner-desafio" onclick="navegar('desafios')" style="cursor:pointer;">
                            <h3>🏆 Próximo Desafio: ${desafioProximo.titulo || 'Desafio'}</h3>
                            <p>📅 ${new Date(desafioProximo.inicio).toLocaleDateString('pt-BR')} às ${new Date(desafioProximo.inicio).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</p>
                            <p>🏅 Prêmio: ${desafioProximo.premio || 0} pontos</p>
                            <p style="margin-top:8px;">📚 Estude ${desafioProximo.materia || 'a matéria'} para se preparar!</p>
                            <div class="timer-contagem">⏰ Faltam ${diasRestantes} dia(s)</div>
                        </div>
                    `;
                } else {
                    container.innerHTML = '';
                }
            }
        });
    } catch(e) {
        console.error('Erro banner:', e);
    }
}

// Continua... (devido ao tamanho, continuarei no próximo chunk)
// ==================== MATÉRIAS/DISCIPLINAS ====================
function carregarMaterias() {
    const page = $('page-materias');
    if (!page) return;
    
    page.innerHTML = `
        <div class="flex-between mb-20">
            <h2>📚 Disciplinas</h2>
            <div class="flex gap-10">
                <select id="filtro-materias" onchange="filtrarMaterias()" style="padding:8px 12px;background:var(--bg);border:1px solid #334155;border-radius:8px;color:var(--text);font-family:'Sora',sans-serif;">
                    <option value="todas">Todas</option>
                    <option value="minhas">Minhas</option>
                </select>
                ${(currentUser && (currentUser.isProf || currentUser.adminLevel >= 1)) ? 
                    '<button class="btn-primary btn-sm" onclick="mostrarCriarMateria()">+ Nova</button>' : ''}
            </div>
        </div>
        <div id="materias-list"></div>
    `;
    
    listarMaterias('todas');
}

function listarMaterias(filtro) {
    try {
        const ref = filtro === 'minhas' && currentUser ? 
            db.ref('materias').orderByChild('autorId').equalTo(currentUser.uid) :
            db.ref('materias');
        
        ref.once('value').then(function(snap) {
            const container = $('materias-list');
            if (!container) return;
            
            if (snap.exists()) {
                let html = '<div class="stats-grid">';
                snap.forEach(function(child) {
                    const mat = child.val();
                    html += `
                        <div class="stat-card" onclick="abrirMateria('${child.key}')" style="cursor:pointer;">
                            <div class="stat-icon">${mat.icone || '📖'}</div>
                            <h3 style="margin:8px 0;">${mat.nome || 'Sem nome'}</h3>
                            <p style="color:#94A3B8;font-size:12px;">${mat.descricao || ''}</p>
                            <p style="font-size:11px;color:#64748B;">Por: ${mat.autorNome || 'Anônimo'}</p>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Nenhuma disciplina encontrada</p></div>';
            }
        });
    } catch(e) {
        console.error('Erro matérias:', e);
    }
}

function filtrarMaterias() {
    const filtro = $('filtro-materias')?.value || 'todas';
    listarMaterias(filtro);
}

function mostrarCriarMateria() {
    const modal = criarModal('Nova Disciplina', `
        <input type="text" id="mat-nome" placeholder="Nome da disciplina">
        <input type="text" id="mat-descricao" placeholder="Descrição">
        <input type="text" id="mat-icone" placeholder="Ícone (emoji)" maxlength="2">
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarMateria()">Criar</button>
        </div>
    `);
}

function criarMateria() {
    const nome = $('mat-nome')?.value?.trim();
    const descricao = $('mat-descricao')?.value?.trim();
    const icone = $('mat-icone')?.value?.trim() || '📖';
    
    if (!nome) { toast('Nome é obrigatório', 'error'); return; }
    
    const ref = db.ref('materias').push();
    ref.set({
        nome, descricao: descricao || '', icone,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        aulasCount: 0,
        createdAt: Date.now()
    }).then(function() {
        toast('Disciplina criada!', 'success');
        fecharModal();
        listarMaterias('todas');
    });
}

function abrirMateria(materiaId) {
    db.ref('materias/' + materiaId).once('value').then(function(snap) {
        if (!snap.exists()) return;
        const mat = snap.val();
        
        const page = $('page-materia-detalhes');
        if (!page) return;
        
        $$('.page').forEach(function(p) { p.classList.remove('active'); });
        page.classList.add('active');
        
        page.innerHTML = `
            <button class="btn-primary btn-sm" onclick="navegar('materias')" style="margin-bottom:15px;">← Voltar</button>
            <h2>${mat.icone || '📖'} ${mat.nome}</h2>
            <p style="color:#94A3B8;margin-bottom:20px;">${mat.descricao || ''}</p>
            
            <div class="tabs">
                <div class="tab active" onclick="carregarAulasMateria('${materiaId}')">📖 Aulas</div>
                <div class="tab" onclick="carregarQuizzesMateria('${materiaId}')">📝 Quizzes</div>
                <div class="tab" onclick="carregarVideosMateria('${materiaId}')">🎬 Vídeos</div>
            </div>
            
            <div id="materia-content"></div>
            
            ${(currentUser && (currentUser.isProf || currentUser.adminLevel >= 1)) ? `
            <div class="flex gap-10 mt-20" style="flex-wrap:wrap;">
                <button class="btn-primary btn-sm" onclick="mostrarCriarAula('${materiaId}')">+ Aula</button>
                <button class="btn-green btn-sm" onclick="mostrarCriarQuiz('${materiaId}')">+ Quiz</button>
                <button class="btn-gold btn-sm" onclick="mostrarAdicionarVideo('${materiaId}')">+ Vídeo</button>
                <button class="btn-primary btn-sm" onclick="gerarQuizIAMateria('${materiaId}')">🤖 Quiz IA</button>
            </div>` : ''}
        `;
        
        carregarAulasMateria(materiaId);
    });
}

function carregarAulasMateria(materiaId) {
    const container = $('materia-content');
    if (!container) return;
    
    db.ref('aulas/' + materiaId).once('value').then(function(snap) {
        if (snap.exists()) {
            let html = '';
            snap.forEach(function(child) {
                const aula = child.val();
                const viewsCount = aula.views ? Object.keys(aula.views).length : 0;
                html += `
                    <div class="card" onclick="abrirAula('${materiaId}', '${child.key}')" style="cursor:pointer;">
                        <div class="flex-between">
                            <h3>${aula.titulo || 'Sem título'}</h3>
                            ${aula.verificado ? '<span class="badge badge-verificado">✓ Verificado</span>' : ''}
                        </div>
                        <p style="color:#94A3B8;font-size:12px;">Por: ${aula.autorNome || 'Anônimo'} | 👁️ ${viewsCount} views</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>Nenhuma aula ainda</p></div>';
        }
    });
}

function carregarQuizzesMateria(materiaId) {
    const container = $('materia-content');
    if (!container) return;
    
    db.ref('quizzes/' + materiaId).once('value').then(function(snap) {
        if (snap.exists()) {
            let html = '';
            snap.forEach(function(child) {
                const quiz = child.val();
                html += `
                    <div class="card" onclick="iniciarQuiz('${materiaId}', '${child.key}')" style="cursor:pointer;">
                        <h3>📝 ${quiz.nome || 'Quiz'}</h3>
                        <p style="color:#94A3B8;font-size:12px;">${quiz.questoes ? quiz.questoes.length : 0} questões | ⏱️ ${quiz.tempo || 30}s</p>
                        ${quiz.oficial ? '<span class="badge badge-verificado">Oficial</span>' : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-question-circle"></i><p>Nenhum quiz ainda</p></div>';
        }
    });
}

function carregarVideosMateria(materiaId) {
    const container = $('materia-content');
    if (!container) return;
    
    db.ref('videos/' + materiaId).once('value').then(function(snap) {
        if (snap.exists()) {
            let html = '';
            snap.forEach(function(child) {
                const video = child.val();
                const videoId = extrairYouTubeID(video.url);
                html += `
                    <div class="card">
                        <h3>${video.titulo || 'Vídeo'}</h3>
                        <p style="color:#94A3B8;font-size:11px;">Por: ${video.autorNome || 'Anônimo'}</p>
                        ${videoId ? `
                            <iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}" 
                                frameborder="0" allowfullscreen style="border-radius:12px;margin-top:10px;"></iframe>
                        ` : video.url ? `
                            <video controls style="width:100%;max-height:400px;border-radius:12px;margin-top:10px;">
                                <source src="${video.url}" type="video/mp4">
                                Seu navegador não suporta vídeo.
                            </video>
                        ` : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-video"></i><p>Nenhum vídeo ainda</p></div>';
        }
    });
}

function extrairYouTubeID(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? match[1] : null;
}

// ==================== AULAS ====================
function mostrarCriarAula(materiaId) {
    criarModal('Nova Aula', `
        <input type="text" id="aula-titulo" placeholder="Título da aula">
        <textarea id="aula-conteudo" placeholder="Conteúdo da aula (você pode usar IA para gerar)"></textarea>
        <div class="modal-buttons">
            <button class="btn-gold" onclick="gerarAulaIA('${materiaId}')">🤖 Gerar com IA</button>
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarAula('${materiaId}')">Criar Aula</button>
        </div>
    `);
}

function gerarAulaIA(materiaId) {
    const titulo = $('aula-titulo')?.value;
    if (!titulo) { toast('Digite um título primeiro', 'error'); return; }
    
    const conteudoEl = $('aula-conteudo');
    if (conteudoEl) conteudoEl.value = 'Gerando com IA...';
    
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
                content: `Crie uma aula completa e detalhada sobre: "${titulo}". Inclua introdução, tópicos principais, exemplos e conclusão. Formate com parágrafos claros.`
            }],
            max_tokens: 2000
        })
    }).then(function(r) { return r.json(); })
    .then(function(data) {
        if (conteudoEl && data.choices?.[0]) {
            conteudoEl.value = data.choices[0].message.content;
            toast('Aula gerada com IA!', 'success');
        }
    }).catch(function(e) {
        if (conteudoEl) conteudoEl.value = 'Erro ao gerar. Tente novamente.';
        console.error(e);
    });
}

function criarAula(materiaId) {
    const titulo = $('aula-titulo')?.value?.trim();
    const conteudo = $('aula-conteudo')?.value?.trim();
    
    if (!titulo || !conteudo) { toast('Preencha todos os campos', 'error'); return; }
    
    db.ref('aulas/' + materiaId).push().set({
        titulo, conteudo,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        verificado: currentUser.adminLevel >= 1,
        views: {},
        createdAt: Date.now()
    }).then(function() {
        db.ref('materias/' + materiaId + '/aulasCount').transaction(function(count) {
            return (count || 0) + 1;
        });
        toast('Aula criada!', 'success');
        fecharModal();
        carregarAulasMateria(materiaId);
    });
}

function abrirAula(materiaId, aulaId) {
    db.ref('aulas/' + materiaId + '/' + aulaId).once('value').then(function(snap) {
        if (!snap.exists()) return;
        const aula = snap.val();
        
        // Registrar view
        if (currentUser?.uid) {
            db.ref('aulas/' + materiaId + '/' + aulaId + '/views/' + currentUser.uid).set(Date.now());
        }
        
        const page = $('page-aula');
        if (!page) return;
        
        $$('.page').forEach(function(p) { p.classList.remove('active'); });
        page.classList.add('active');
        
        page.innerHTML = `
            <button class="btn-primary btn-sm" onclick="abrirMateria('${materiaId}')" style="margin-bottom:20px;">← Voltar</button>
            <h2>${aula.titulo || 'Aula'}</h2>
            <p style="color:#94A3B8;margin-bottom:15px;">
                Por: ${aula.autorNome || 'Anônimo'} 
                ${aula.isProf ? '<span class="badge badge-prof">Professor</span>' : ''}
                ${aula.verificado ? '<span class="badge badge-verificado">Verificado</span>' : ''}
            </p>
            <div class="card" style="white-space:pre-wrap;line-height:1.9;font-size:15px;">${aula.conteudo || ''}</div>
            
            <div class="card mt-20">
                <h3>💬 Comentários</h3>
                <div id="aula-comentarios"></div>
                <div class="flex gap-10 mt-15">
                    <input type="text" id="comentario-texto" placeholder="Adicione um comentário..." 
                        style="flex:1;padding:12px;background:var(--bg);border:1px solid #334155;border-radius:10px;color:var(--text);font-family:'Sora',sans-serif;">
                    <button class="btn-primary btn-sm" onclick="enviarComentarioAula('${materiaId}', '${aulaId}')">Enviar</button>
                </div>
            </div>
            
            ${(currentUser?.adminLevel >= 1 && !aula.verificado) ? 
                `<button class="btn-green mt-10" onclick="verificarAula('${materiaId}', '${aulaId}')">✓ Verificar Aula</button>` : ''}
        `;
        
        carregarComentariosAula(materiaId, aulaId);
    });
}

function carregarComentariosAula(materiaId, aulaId) {
    const container = $('aula-comentarios');
    if (!container) return;
    
    db.ref('comentarios/aulas/' + aulaId).once('value').then(function(snap) {
        if (snap.exists()) {
            let html = '';
            snap.forEach(function(child) {
                const c = child.val();
                html += `
                    <div style="padding:12px;margin-bottom:8px;background:var(--bg);border-radius:10px;">
                        <strong>${c.autorNome || 'Anônimo'}</strong>
                        ${c.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                        <span style="color:#64748B;font-size:10px;"> • ${formatarData(c.createdAt)}</span>
                        <p style="margin-top:5px;">${c.texto || ''}</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color:#94A3B8;">Nenhum comentário ainda</p>';
        }
    });
}

function enviarComentarioAula(materiaId, aulaId) {
    const texto = $('comentario-texto')?.value?.trim();
    if (!texto) return;
    
    db.ref('comentarios/aulas/' + aulaId).push().set({
        texto,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        isProf: currentUser.isProf || false,
        createdAt: Date.now()
    }).then(function() {
        if ($('comentario-texto')) $('comentario-texto').value = '';
        carregarComentariosAula(materiaId, aulaId);
        toast('Comentário enviado!', 'success');
    });
}

function verificarAula(materiaId, aulaId) {
    db.ref('aulas/' + materiaId + '/' + aulaId + '/verificado').set(true).then(function() {
        toast('Aula verificada!', 'success');
        abrirAula(materiaId, aulaId);
    });
}

// ==================== VÍDEOS ====================
function mostrarAdicionarVideo(materiaId) {
    criarModal('Adicionar Vídeo', `
        <input type="text" id="video-titulo" placeholder="Título do vídeo">
        <input type="text" id="video-url" placeholder="URL do YouTube ou link do vídeo">
        <select id="video-tipo">
            <option value="youtube">YouTube</option>
            <option value="upload">Upload Próprio</option>
        </select>
        <input type="file" id="video-file" accept="video/*" style="display:none;">
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="adicionarVideo('${materiaId}')">Adicionar</button>
        </div>
    `);
    
    $('video-tipo').addEventListener('change', function() {
        if (this.value === 'upload') {
            $('video-url').style.display = 'none';
            $('video-file').style.display = 'block';
        } else {
            $('video-url').style.display = 'block';
            $('video-file').style.display = 'none';
        }
    });
}

function adicionarVideo(materiaId) {
    const titulo = $('video-titulo')?.value?.trim();
    const tipo = $('video-tipo')?.value;
    const url = $('video-url')?.value?.trim();
    const file = $('video-file')?.files[0];
    
    if (!titulo) { toast('Digite um título', 'error'); return; }
    
    if (tipo === 'upload' && file) {
        const formData = new FormData();
        formData.append('video', file);
        
        // Upload para Firebase Storage
        const ref = storage.ref('videos/' + Date.now() + '_' + file.name);
        ref.put(file).then(function(snapshot) {
            return snapshot.ref.getDownloadURL();
        }).then(function(downloadURL) {
            salvarVideo(materiaId, titulo, downloadURL, 'upload');
        }).catch(function() {
            toast('Erro no upload. Use links do YouTube.', 'error');
        });
    } else if (url) {
        salvarVideo(materiaId, titulo, url, tipo);
    } else {
        toast('Forneça URL ou arquivo', 'error');
    }
}

function salvarVideo(materiaId, titulo, url, tipo) {
    db.ref('videos/' + materiaId).push().set({
        titulo, url, tipo,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        createdAt: Date.now()
    }).then(function() {
        toast('Vídeo adicionado!', 'success');
        fecharModal();
        carregarVideosMateria(materiaId);
    });
}

// ==================== QUIZZES ====================
let quizState = {
    materiaId: null, quizId: null, questoes: [],
    questaoAtual: 0, pontuacao: 0, timer: null, segundos: 30
};

function mostrarCriarQuiz(materiaId) {
    criarModal('Novo Quiz', `
        <input type="text" id="quiz-nome" placeholder="Nome do quiz">
        <input type="number" id="quiz-tempo" placeholder="Tempo por questão (segundos)" value="30">
        <div id="quiz-questoes"></div>
        <button class="btn-green btn-sm" onclick="adicionarQuestaoQuiz()">+ Adicionar Questão</button>
        <p style="font-size:11px;color:#94A3B8;margin-top:5px;">Use /cmd no título para comandos rápidos</p>
        <div class="modal-buttons">
            <button class="btn-gold" onclick="gerarQuizIA('${materiaId}')">🤖 Gerar com IA</button>
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarQuiz('${materiaId}')">Criar Quiz</button>
        </div>
    `);
    adicionarQuestaoQuiz();
}

function adicionarQuestaoQuiz() {
    const container = $('quiz-questoes');
    if (!container) return;
    
    const idx = container.children.length;
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;';
    div.innerHTML = `
        <strong style="color:var(--gold);">Questão ${idx + 1}</strong>
        <button class="btn-danger btn-sm" onclick="this.parentElement.remove()" style="float:right;font-size:10px;">X</button>
        <input type="text" class="q-pergunta" placeholder="Pergunta" style="width:100%;margin-top:10px;">
        <input type="text" class="q-alt1" placeholder="Alternativa A" style="width:100%;">
        <input type="text" class="q-alt2" placeholder="Alternativa B" style="width:100%;">
        <input type="text" class="q-alt3" placeholder="Alternativa C" style="width:100%;">
        <input type="text" class="q-alt4" placeholder="Alternativa D" style="width:100%;">
        <select class="q-correta" style="width:100%;">
            <option value="0">Correta: A</option>
            <option value="1">Correta: B</option>
            <option value="2">Correta: C</option>
            <option value="3">Correta: D</option>
        </select>
    `;
    container.appendChild(div);
}

function montarQuestoesDoForm() {
    const questoes = [];
    $$('#quiz-questoes > div').forEach(function(div) {
        const pergunta = div.querySelector('.q-pergunta')?.value?.trim();
        const alts = [
            div.querySelector('.q-alt1')?.value?.trim() || '',
            div.querySelector('.q-alt2')?.value?.trim() || '',
            div.querySelector('.q-alt3')?.value?.trim() || '',
            div.querySelector('.q-alt4')?.value?.trim() || ''
        ];
        const correta = parseInt(div.querySelector('.q-correta')?.value || '0');
        if (pergunta && alts[0] && alts[1]) {
            questoes.push({ pergunta, alternativas: alts, correta });
        }
    });
    return questoes;
}

function criarQuiz(materiaId) {
    const nome = $('quiz-nome')?.value?.trim();
    const tempo = parseInt($('quiz-tempo')?.value || '30');
    const questoes = montarQuestoesDoForm();
    
    if (!nome || questoes.length === 0) {
        toast('Nome e pelo menos 1 questão são obrigatórios', 'error');
        return;
    }
    
    db.ref('quizzes/' + materiaId).push().set({
        nome, tempo, questoes,
        oficial: currentUser.adminLevel >= 1,
        isProf: currentUser.isProf || false,
        views: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Quiz criado!', 'success');
        fecharModal();
        carregarQuizzesMateria(materiaId);
    });
}

function gerarQuizIA(materiaId) {
    const nome = $('quiz-nome')?.value?.trim();
    if (!nome) { toast('Digite um nome para o quiz', 'error'); return; }
    
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
                content: `Crie um quiz de 5 questões sobre "${nome}". Retorne APENAS JSON: {"questoes":[{"pergunta":"...","alternativas":["A) ...","B) ...","C) ...","D) ..."],"correta":0}]}`
            }],
            max_tokens: 1500
        })
    }).then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.choices?.[0]) {
            try {
                const match = data.choices[0].message.content.match(/\{[\s\S]*\}/);
                if (match) {
                    const quizData = JSON.parse(match[0]);
                    const container = $('quiz-questoes');
                    if (container && quizData.questoes) {
                        container.innerHTML = '';
                        quizData.questoes.forEach(function(q, i) {
                            const div = document.createElement('div');
                            div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;';
                            div.innerHTML = `
                                <strong style="color:var(--gold);">Questão ${i+1}</strong>
                                <input type="text" class="q-pergunta" value="${q.pergunta || ''}" style="width:100%;margin-top:10px;">
                                <input type="text" class="q-alt1" value="${q.alternativas[0] || ''}" style="width:100%;">
                                <input type="text" class="q-alt2" value="${q.alternativas[1] || ''}" style="width:100%;">
                                <input type="text" class="q-alt3" value="${q.alternativas[2] || ''}" style="width:100%;">
                                <input type="text" class="q-alt4" value="${q.alternativas[3] || ''}" style="width:100%;">
                                <select class="q-correta" style="width:100%;">
                                    <option value="0" ${q.correta===0?'selected':''}>A</option>
                                    <option value="1" ${q.correta===1?'selected':''}>B</option>
                                    <option value="2" ${q.correta===2?'selected':''}>C</option>
                                    <option value="3" ${q.correta===3?'selected':''}>D</option>
                                </select>
                            `;
                            container.appendChild(div);
                        });
                        toast('Quiz gerado! Edite se necessário.', 'success');
                    }
                }
            } catch(e) {
                console.error('Parse erro:', e);
                toast('Erro ao gerar quiz', 'error');
            }
        }
    }).catch(function(e) {
        console.error(e);
        toast('Erro na IA', 'error');
    });
}

function gerarQuizIAMateria(materiaId) {
    db.ref('materias/' + materiaId).once('value').then(function(snap) {
        if (snap.exists()) {
            const nome = snap.val().nome;
            criarModal('Quiz IA - ' + nome, `
                <p style="margin-bottom:15px;">Gerando quiz sobre <strong>${nome}</strong>...</p>
                <div id="quiz-ia-questoes"></div>
                <div class="modal-buttons">
                    <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
                    <button class="btn-primary" onclick="salvarQuizIA('${materiaId}')">Salvar Quiz</button>
                </div>
            `);
            
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
                        content: `Crie um quiz de 5 questões sobre "${nome}". JSON: {"questoes":[{"pergunta":"...","alternativas":["A) ...","B) ...","C) ...","D) ..."],"correta":0}]}`
                    }],
                    max_tokens: 1500
                })
            }).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.choices?.[0]) {
                    const match = data.choices[0].message.content.match(/\{[\s\S]*\}/);
                    if (match) {
                        window._quizIAData = JSON.parse(match[0]);
                        const container = $('quiz-ia-questoes');
                        if (container) {
                            container.innerHTML = '<p style="color:var(--green);">Quiz gerado! Clique em Salvar.</p>' +
                                '<p style="color:#94A3B8;">Questões: ' + (window._quizIAData.questoes?.length || 0) + '</p>';
                        }
                    }
                }
            });
        }
    });
}

function salvarQuizIA(materiaId) {
    if (!window._quizIAData?.questoes) {
        toast('Gere o quiz primeiro', 'error');
        return;
    }
    
    db.ref('quizzes/' + materiaId).push().set({
        nome: 'Quiz IA - ' + new Date().toLocaleDateString(),
        tempo: 30,
        questoes: window._quizIAData.questoes,
        oficial: true,
        isProf: true,
        views: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Quiz salvo!', 'success');
        fecharModal();
        carregarQuizzesMateria(materiaId);
    });
}

// ==================== JOGAR QUIZ ====================
function iniciarQuiz(materiaId, quizId) {
    db.ref('quizzes/' + materiaId + '/' + quizId).once('value').then(function(snap) {
        if (!snap.exists()) return;
        const quiz = snap.val();
        
        quizState = {
            materiaId, quizId,
            questoes: quiz.questoes || [],
            questaoAtual: 0,
            pontuacao: 0,
            timer: null,
            segundos: quiz.tempo || 30
        };
        
        const page = $('page-quiz');
        if (!page) return;
        
        $$('.page').forEach(function(p) { p.classList.remove('active'); });
        page.classList.add('active');
        
        renderizarQuestao();
    });
}

function renderizarQuestao() {
    const page = $('page-quiz');
    if (!page) return;
    
    if (quizState.questaoAtual >= quizState.questoes.length) {
        finalizarQuiz();
        return;
    }
    
    const questao = quizState.questoes[quizState.questaoAtual];
    quizState.segundos = 30;
    
    page.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header">
                <span class="quiz-progress">Questão ${quizState.questaoAtual + 1}/${quizState.questoes.length}</span>
                <span class="quiz-pontuacao">⭐ ${quizState.pontuacao}</span>
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
    
    iniciarTimerQuiz();
}

function iniciarTimerQuiz() {
    clearInterval(quizState.timer);
    const timerEl = $('quiz-timer');
    
    quizState.timer = setInterval(function() {
        quizState.segundos--;
        if (timerEl) {
            timerEl.textContent = quizState.segundos + 's';
            if (quizState.segundos <= 5) timerEl.classList.add('warning');
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
    const botoes = $$('#alternativas-list button');
    
    botoes.forEach(function(btn, i) {
        btn.disabled = true;
        if (i === correta) btn.classList.add('correct');
        if (i === resposta && i !== correta) btn.classList.add('wrong');
    });
    
    if (resposta === correta) quizState.pontuacao += 10;
    
    setTimeout(function() {
        quizState.questaoAtual++;
        renderizarQuestao();
    }, 1500);
}

function finalizarQuiz() {
    clearInterval(quizState.timer);
    const page = $('page-quiz');
    if (!page) return;
    
    const total = quizState.questoes.length;
    const acertos = Math.round(quizState.pontuacao / 10);
    const porcentagem = total > 0 ? Math.round((acertos / total) * 100) : 0;
    
    // Atualizar pontos
    if (currentUser?.uid) {
        const novosPontos = (currentUser.points || 0) + quizState.pontuacao;
        db.ref('usuarios/' + currentUser.uid + '/points').set(novosPontos);
        currentUser.points = novosPontos;
        
        // Salvar histórico
        db.ref('usuarios/' + currentUser.uid + '/historico_quizzes').push().set({
            quizId: quizState.quizId,
            materiaId: quizState.materiaId,
            pontuacao: quizState.pontuacao,
            acertos, total,
            data: Date.now()
        });
    }
    
    page.innerHTML = `
        <div class="quiz-container quiz-resultado">
            <h2>Quiz Finalizado!</h2>
            <div class="quiz-resultado-emoji">${porcentagem >= 80 ? '🏆' : porcentagem >= 50 ? '👍' : '💪'}</div>
            <div class="quiz-resultado-stats">
                <div class="quiz-resultado-stat">
                    <div class="valor" style="color:var(--gold);">${quizState.pontuacao}</div>
                    <div class="label">Pontos</div>
                </div>
                <div class="quiz-resultado-stat">
                    <div class="valor">${acertos}/${total}</div>
                    <div class="label">Acertos</div>
                </div>
                <div class="quiz-resultado-stat">
                    <div class="valor" style="color:${porcentagem >= 70 ? 'var(--green)' : 'var(--red)'};">${porcentagem}%</div>
                    <div class="label">Aproveitamento</div>
                </div>
            </div>
            <button class="btn-primary mt-20" onclick="navegar('materias')">Voltar às Disciplinas</button>
        </div>
    `;
    
    verificarConquistas();
}


// ==================== FEED ====================
function carregarFeed() {
    const page = $('page-feed');
    if (!page) return;
    
    page.innerHTML = `
        <div class="flex-between mb-20">
            <h2>📰 Feed</h2>
            <button class="btn-primary btn-sm" onclick="mostrarCriarPost()">+ Post</button>
        </div>
        <div id="feed-list"></div>
    `;
    
    carregarPosts();
}

function carregarPosts() {
    db.ref('posts').orderByChild('createdAt').once('value').then(function(snap) {
        const container = $('feed-list');
        if (!container) return;
        
        if (snap.exists()) {
            let html = '';
            const posts = [];
            snap.forEach(function(child) {
                posts.unshift({id: child.key, ...child.val()});
            });
            
            // Separar posts de professores
            const postsProf = posts.filter(function(p) { return p.isProf; });
            const postsNormais = posts.filter(function(p) { return !p.isProf; });
            const todosPosts = [...postsProf, ...postsNormais];
            
            todosPosts.forEach(function(post) {
                const likesCount = post.likes ? Object.keys(post.likes).length : 0;
                const viewsCount = post.views ? Object.keys(post.views).length : 0;
                const isLiked = post.likes && currentUser && post.likes[currentUser.uid];
                const comentariosCount = 0; // Simplificado
                
                html += `
                    <div class="post-card" id="post-${post.id}">
                        <div class="post-header">
                            <img src="${post.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="post-avatar">
                            <div style="flex:1;">
                                <span class="post-autor">${post.autorNome || 'Anônimo'}</span>
                                ${post.isProf ? '<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" class="selo-icon" title="Professor">' : ''}
                                <br><span class="post-data">${formatarData(post.createdAt)}</span>
                            </div>
                            <span class="badge" style="background:#334155;">${post.tipo === 'dica' ? '💡 Dica' : post.tipo === 'duvida' ? '❓ Dúvida' : '📝 Post'}</span>
                        </div>
                        <p class="post-texto">${post.texto || ''}</p>
                        ${post.imagem ? `<img src="${post.imagem}" class="post-imagem" onclick="window.open('${post.imagem}')">` : ''}
                        <div class="post-actions">
                            <button class="${isLiked ? 'liked' : ''}" onclick="curtirPost('${post.id}')">
                                <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${likesCount}
                            </button>
                            <button onclick="mostrarComentariosPost('${post.id}')">
                                <i class="far fa-comment"></i> ${comentariosCount}
                            </button>
                            <button>
                                <i class="far fa-eye"></i> ${viewsCount}
                            </button>
                            <button onclick="compartilharPost('${post.id}')">
                                <i class="fas fa-share"></i>
                            </button>
                            <button onclick="denunciarPost('${post.id}')" style="color:var(--red);">
                                <i class="fas fa-flag"></i>
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
}

function mostrarCriarPost() {
    criarModal('Novo Post', `
        <select id="post-tipo">
            <option value="post">📝 Post Normal</option>
            <option value="dica">💡 Dica</option>
            <option value="duvida">❓ Dúvida</option>
        </select>
        <textarea id="post-texto" placeholder="O que você quer compartilhar?"></textarea>
        <input type="file" id="post-imagem-input" accept="image/*" onchange="previewImagemPost()">
        <div id="post-imagem-preview" style="margin:10px 0;"></div>
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarPost()">Publicar</button>
        </div>
    `);
}

function previewImagemPost() {
    const file = $('post-imagem-input')?.files[0];
    const preview = $('post-imagem-preview');
    if (!file || !preview) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <div class="image-preview-container">
                <img src="${e.target.result}" alt="Preview">
                <span class="remove-image" onclick="removerPreviewImagem()">×</span>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removerPreviewImagem() {
    const preview = $('post-imagem-preview');
    const input = $('post-imagem-input');
    if (preview) preview.innerHTML = '';
    if (input) input.value = '';
    window._postImageFile = null;
}

function criarPost() {
    const texto = $('post-texto')?.value?.trim();
    const tipo = $('post-tipo')?.value || 'post';
    const file = $('post-imagem-input')?.files[0];
    
    if (!texto && !file) { toast('Escreva algo ou adicione imagem', 'error'); return; }
    
    const postData = {
        texto: texto || '',
        tipo,
        autorId: currentUser.uid,
        autorNome: currentUser.fullname || currentUser.username,
        avatar: currentUser.avatar || '',
        isProf: currentUser.isProf || false,
        likes: {},
        views: {},
        createdAt: Date.now()
    };
    
    if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST',
            body: formData
        }).then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) postData.imagem = data.data.url;
            salvarPostFinal(postData);
        }).catch(function() {
            salvarPostFinal(postData);
        });
    } else {
        salvarPostFinal(postData);
    }
}

function salvarPostFinal(postData) {
    db.ref('posts').push().set(postData).then(function() {
        toast('Post publicado!', 'success');
        fecharModal();
        carregarPosts();
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
            // Notificar autor
            db.ref('posts/' + postId).once('value').then(function(postSnap) {
                const post = postSnap.val();
                if (post && post.autorId !== currentUser.uid) {
                    enviarNotificacao(post.autorId, currentUser.username + ' curtiu seu post', 'like', 'feed');
                }
            });
        }
        carregarPosts();
    });
}

function compartilharPost(postId) {
    const url = window.location.origin + '?post=' + postId;
    navigator.clipboard.writeText(url).then(function() {
        toast('Link copiado!', 'success');
    });
}

function denunciarPost(postId) {
    const motivo = prompt('Motivo da denúncia:');
    if (motivo) {
        db.ref('config/denuncias').push().set({
            tipo: 'post',
            itemId: postId,
            motivo,
            denuncianteId: currentUser.uid,
            status: 'pendente',
            createdAt: Date.now()
        }).then(function() {
            toast('Denúncia enviada!', 'info');
        });
    }
}

function mostrarComentariosPost(postId) {
    // Implementação simplificada
    toast('Comentários em breve!', 'info');
}

// ==================== RANKING ====================
function carregarRanking() {
    const page = $('page-ranking');
    if (!page) return;
    
    page.innerHTML = `
        <h2 class="mb-20">🏆 Ranking</h2>
        <div class="tabs">
            <div class="tab active" onclick="carregarRankingTipo('alunos')">👨‍🎓 Alunos</div>
            <div class="tab" onclick="carregarRankingTipo('professores')">👨‍🏫 Professores</div>
        </div>
        <div id="ranking-podio"></div>
        <div id="ranking-lista"></div>
        <div id="ranking-minha-posicao" class="card mt-20"></div>
    `;
    
    carregarRankingTipo('alunos');
}

function carregarRankingTipo(tipo) {
    db.ref('usuarios').orderByChild('points').once('value').then(function(snap) {
        if (!snap.exists()) return;
        
        const usuarios = [];
        snap.forEach(function(child) {
            const u = child.val();
            if (tipo === 'professores' && u.isProf) usuarios.push({id: child.key, ...u});
            else if (tipo === 'alunos' && !u.isProf) usuarios.push({id: child.key, ...u});
        });
        
        usuarios.sort(function(a, b) { return (b.points || 0) - (a.points || 0); });
        const top50 = usuarios.slice(0, 50);
        const top3 = top50.slice(0, 3);
        
        // Pódio
        const podio = $('ranking-podio');
        if (podio) {
            podio.innerHTML = `<div class="podio-container">
                ${top3[1] ? criarPodioItem(top3[1], '🥈', 'segundo', '2° Lugar') : ''}
                ${top3[0] ? criarPodioItem(top3[0], '👑', 'primeiro', '1° Lugar') : ''}
                ${top3[2] ? criarPodioItem(top3[2], '🥉', 'terceiro', '3° Lugar') : ''}
            </div>`;
        }
        
        // Lista
        const lista = $('ranking-lista');
        if (lista) {
            let html = '<h3 style="margin:20px 0;">Top 50</h3>';
            top50.forEach(function(u, i) {
                html += `
                    <div class="card flex" style="align-items:center;gap:15px;">
                        <span style="font-weight:800;font-size:18px;width:35px;">#${i+1}</span>
                        <img src="${u.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" style="width:44px;height:44px;border-radius:50%;">
                        <div style="flex:1;">
                            <strong>${u.username || 'Anônimo'}</strong>
                            ${u.isProf ? '<span class="badge badge-prof">Prof</span>' : ''}
                            ${u.adminLevel >= 1 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo-icon">' : ''}
                        </div>
                        <span style="color:var(--gold);font-weight:700;">⭐ ${u.points || 0}</span>
                        <button class="btn-sm btn-primary" onclick="seguirUsuario('${u.id}')">${currentUser?.seguindo?.[u.id] ? 'Seguindo' : 'Seguir'}</button>
                    </div>
                `;
            });
            lista.innerHTML = html;
        }
        
        // Minha posição
        if (currentUser) {
            const minhaPos = usuarios.findIndex(function(u) { return u.id === currentUser.uid; });
            const posEl = $('ranking-minha-posicao');
            if (posEl) {
                posEl.innerHTML = `<strong>Sua posição:</strong> #${minhaPos >= 0 ? minhaPos + 1 : '---'} | ⭐ ${currentUser.points || 0} pontos`;
            }
        }
    });
}

function criarPodioItem(user, emoji, classe, lugar) {
    return `
        <div class="podio-item ${classe}">
            <div class="podio-medal">${emoji}</div>
            <img src="${user.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" class="podio-avatar">
            <div class="podio-username">${user.username || '---'}</div>
            <div class="podio-points">⭐ ${user.points || 0}</div>
            <div style="font-size:11px;">${lugar}</div>
        </div>
    `;
}

// ==================== DESAFIOS ====================
function carregarDesafios() {
    const page = $('page-desafios');
    if (!page) return;
    
    page.innerHTML = `
        <div class="flex-between mb-20">
            <h2>🗓️ Desafios</h2>
            ${currentUser?.adminLevel >= 1 ? '<button class="btn-primary btn-sm" onclick="mostrarCriarDesafio()">+ Novo</button>' : ''}
        </div>
        <div id="desafios-list"></div>
    `;
    
    carregarListaDesafios();
}

function carregarListaDesafios() {
    db.ref('desafios').once('value').then(function(snap) {
        const container = $('desafios-list');
        if (!container) return;
        
        if (snap.exists()) {
            let html = '';
            const agora = Date.now();
            snap.forEach(function(child) {
                const d = child.val();
                const ativo = agora >= d.inicio && agora <= d.fim;
                const status = agora < d.inicio ? '⏳ Em breve' : agora > d.fim ? '🔒 Encerrado' : '🔥 Ativo';
                const participantes = d.participantes ? Object.keys(d.participantes).length : 0;
                
                html += `
                    <div class="card">
                        ${d.banner ? `<img src="${d.banner}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:15px;">` : ''}
                        <h3>${d.titulo || 'Desafio'}</h3>
                        <p style="color:#94A3B8;">${d.descricao || ''}</p>
                        <div class="flex gap-15 mt-10" style="font-size:12px;color:#94A3B8;">
                            <span>📅 ${new Date(d.inicio).toLocaleDateString('pt-BR')} - ${new Date(d.fim).toLocaleDateString('pt-BR')}</span>
                            <span>🏆 ${d.premio || 0} pts</span>
                            <span>👥 ${participantes} participantes</span>
                        </div>
                        <span class="badge ${ativo ? 'badge-verificado' : ''}" style="margin-top:10px;">${status}</span>
                        ${ativo ? `<button class="btn-primary btn-sm mt-10" onclick="participarDesafio('${child.key}')">Participar</button>` : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><p>Nenhum desafio disponível</p></div>';
        }
    });
}

function mostrarCriarDesafio() {
    criarModal('Novo Desafio', `
        <input type="text" id="desafio-titulo" placeholder="Título">
        <textarea id="desafio-descricao" placeholder="Descrição"></textarea>
        <input type="text" id="desafio-materia" placeholder="Matéria">
        <input type="text" id="desafio-banner" placeholder="URL do banner">
        <label>Início:</label>
        <input type="datetime-local" id="desafio-inicio">
        <label>Fim:</label>
        <input type="datetime-local" id="desafio-fim">
        <input type="number" id="desafio-premio" placeholder="Prêmio (pontos)" value="100">
        <div id="desafio-questoes"></div>
        <button class="btn-green btn-sm" onclick="adicionarQuestaoDesafio()">+ Questão</button>
        <button class="btn-gold btn-sm" onclick="gerarQuestoesDesafioIA()">🤖 Gerar com IA</button>
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarDesafio()">Criar</button>
        </div>
    `);
    adicionarQuestaoDesafio();
}

function adicionarQuestaoDesafio() {
    const container = $('desafio-questoes');
    if (!container) return;
    
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg);padding:15px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;';
    div.innerHTML = `
        <input type="text" class="dq-pergunta" placeholder="Pergunta" style="width:100%;margin-bottom:5px;">
        <input type="text" class="dq-alt1" placeholder="Alternativa A" style="width:100%;">
        <input type="text" class="dq-alt2" placeholder="Alternativa B" style="width:100%;">
        <input type="text" class="dq-alt3" placeholder="Alternativa C" style="width:100%;">
        <input type="text" class="dq-alt4" placeholder="Alternativa D" style="width:100%;">
        <select class="dq-correta" style="width:100%;margin-top:5px;">
            <option value="0">Correta: A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
        </select>
        <button class="btn-danger btn-sm" onclick="this.parentElement.remove()">Remover</button>
    `;
    container.appendChild(div);
}

function criarDesafio() {
    const titulo = $('desafio-titulo')?.value?.trim();
    const inicio = $('desafio-inicio')?.value;
    const fim = $('desafio-fim')?.value;
    
    if (!titulo || !inicio || !fim) { toast('Preencha título, início e fim', 'error'); return; }
    
    const questoes = [];
    $$('#desafio-questoes > div').forEach(function(div) {
        const pergunta = div.querySelector('.dq-pergunta')?.value?.trim();
        const alts = [
            div.querySelector('.dq-alt1')?.value?.trim() || '',
            div.querySelector('.dq-alt2')?.value?.trim() || '',
            div.querySelector('.dq-alt3')?.value?.trim() || '',
            div.querySelector('.dq-alt4')?.value?.trim() || ''
        ];
        const correta = parseInt(div.querySelector('.dq-correta')?.value || '0');
        if (pergunta && alts[0]) questoes.push({pergunta, alternativas: alts, correta});
    });
    
    db.ref('desafios').push().set({
        titulo,
        descricao: $('desafio-descricao')?.value?.trim() || '',
        materia: $('desafio-materia')?.value?.trim() || '',
        banner: $('desafio-banner')?.value?.trim() || '',
        premio: parseInt($('desafio-premio')?.value || '100'),
        questoes,
        inicio: new Date(inicio).getTime(),
        fim: new Date(fim).getTime(),
        criadoPor: currentUser.uid,
        participantes: {},
        createdAt: Date.now()
    }).then(function() {
        toast('Desafio criado!', 'success');
        fecharModal();
        carregarListaDesafios();
    });
}

function participarDesafio(desafioId) {
    db.ref('desafios/' + desafioId).once('value').then(function(snap) {
        if (!snap.exists()) return;
        const desafio = snap.val();
        
        if (desafio.questoes?.length > 0) {
            const q = desafio.questoes[Math.floor(Math.random() * desafio.questoes.length)];
            
            criarModal('Desafio: ' + desafio.titulo, `
                <p><strong>${q.pergunta}</strong></p>
                ${q.alternativas.map(function(alt, i) {
                    return `<button class="btn-primary" style="display:block;width:100%;text-align:left;margin:5px 0;" 
                        onclick="responderDesafioQuestao('${desafioId}', ${i}, ${q.correta}, ${desafio.premio || 0})">${alt}</button>`;
                }).join('')}
            `);
        }
    });
}

function responderDesafioQuestao(desafioId, resposta, correta, premio) {
    if (resposta === correta) {
        const novosPontos = (currentUser.points || 0) + premio;
        db.ref('usuarios/' + currentUser.uid + '/points').set(novosPontos);
        currentUser.points = novosPontos;
        toast(`🎉 Correto! +${premio} pontos!`, 'success');
    } else {
        toast('❌ Incorreto! Continue estudando.', 'error');
    }
    
    db.ref('desafios/' + desafioId + '/participantes/' + currentUser.uid).set(true);
    fecharModal();
}

// ==================== JARVIS IA ====================
function carregarJarvis() {
    const page = $('page-jarvis');
    if (!page) return;
    
    page.innerHTML = `
        <h2 class="mb-20">🤖 Jarvis IA</h2>
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <div class="message ai">
                    <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" class="message-avatar">
                    <div class="message-content">Olá! Sou o Jarvis, seu assistente de estudos. Posso analisar imagens e responder dúvidas. Como posso ajudar?</div>
                </div>
            </div>
            <div class="chat-input-area">
                <div id="jarvis-image-preview" style="margin-right:10px;"></div>
                <input type="file" id="jarvis-image-input" accept="image/*" style="display:none;" onchange="previewImagemJarvis()">
                <button class="btn-icon" onclick="$('jarvis-image-input').click()" title="Enviar imagem"><i class="fas fa-image"></i></button>
                <input type="text" id="jarvis-input" placeholder="Digite sua mensagem..." onkeypress="if(event.key==='Enter')enviarMensagemJarvis()">
                <button class="btn-primary btn-sm" onclick="enviarMensagemJarvis()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    
    window._jarvisImageData = null;
}

function previewImagemJarvis() {
    const file = $('jarvis-image-input')?.files[0];
    const preview = $('jarvis-image-preview');
    if (!file || !preview) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <div class="image-preview-container" style="margin:0;">
                <img src="${e.target.result}" style="width:40px;height:40px;border-radius:8px;">
                <span class="remove-image" onclick="removerImagemJarvis()" style="width:20px;height:20px;font-size:10px;">×</span>
            </div>
        `;
        window._jarvisImageData = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removerImagemJarvis() {
    $('jarvis-image-preview').innerHTML = '';
    $('jarvis-image-input').value = '';
    window._jarvisImageData = null;
}

function enviarMensagemJarvis() {
    const input = $('jarvis-input');
    const messages = $('chat-messages');
    if (!input || !messages) return;
    
    const texto = input.value.trim();
    const imagemData = window._jarvisImageData;
    
    if (!texto && !imagemData) return;
    
    // Mensagem do usuário
    let userHTML = '';
    if (imagemData) {
        userHTML += `<img src="${imagemData}" style="max-width:180px;border-radius:10px;"><br>`;
    }
    userHTML += texto || 'Analise esta imagem';
    
    messages.innerHTML += `
        <div class="message user">
            <div class="message-content">${userHTML}</div>
        </div>
    `;
    input.value = '';
    removerImagemJarvis();
    messages.scrollTop = messages.scrollHeight;
    
    // Placeholder resposta
    const placeholderId = 'msg-' + Date.now();
    messages.innerHTML += `
        <div class="message ai" id="${placeholderId}">
            <img src="https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png" class="message-avatar">
            <div class="message-content">Pensando...</div>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;
    
    if (imagemData) {
        // Usar Gemini 1.5 Flash para visão
        analisarComGemini(texto || 'Descreva esta imagem', imagemData, placeholderId);
    } else {
        // Usar Groq para texto
        chatHistory.push({role: 'user', content: texto});
        
        fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {role: 'system', content: 'Você é Jarvis, assistente de estudos. Responda em português, de forma educativa e amigável.'},
                    ...chatHistory.slice(-10)
                ],
                max_tokens: 1000
            })
        }).then(function(r) { return r.json(); })
        .then(function(data) {
            atualizarRespostaJarvis(placeholderId, data.choices?.[0]?.message?.content || 'Erro na resposta');
        }).catch(function() {
            atualizarRespostaJarvis(placeholderId, 'Erro de conexão. Tente novamente.');
        });
    }
}

function analisarComGemini(texto, imagemData, placeholderId) {
    // Extrair base64
    const base64 = imagemData.split(',')[1];
    
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [{
                parts: [
                    {text: texto},
                    {inlineData: {mimeType: 'image/jpeg', data: base64}}
                ]
            }]
        })
    }).then(function(r) { return r.json(); })
    .then(function(data) {
        const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui analisar a imagem.';
        atualizarRespostaJarvis(placeholderId, resposta);
        chatHistory.push({role: 'assistant', content: resposta});
    }).catch(function() {
        atualizarRespostaJarvis(placeholderId, 'Erro ao analisar imagem. Tente novamente.');
    });
}

function atualizarRespostaJarvis(placeholderId, resposta) {
    const el = $(placeholderId);
    if (el) {
        el.querySelector('.message-content').textContent = resposta;
        const messages = $('chat-messages');
        if (messages) messages.scrollTop = messages.scrollHeight;
    }
}

// ==================== PERFIL ====================
function carregarPerfil() {
    const page = $('page-perfil');
    if (!page || !currentUser) return;
    
    const seguidoresCount = currentUser.seguidores ? Object.keys(currentUser.seguidores).length : 0;
    const seguindoCount = currentUser.seguindo ? Object.keys(currentUser.seguindo).length : 0;
    
    page.innerHTML = `
        <div class="text-center mb-20">
            <img src="${currentUser.avatar || 'https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png'}" 
                style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--blue);">
            <h2 style="margin-top:10px;">${currentUser.fullname || currentUser.username}</h2>
            <p style="color:#94A3B8;">${currentUser.username || ''}</p>
            <p style="margin:8px 0;">${currentUser.bio || 'Sem bio'}</p>
            <div style="margin:10px 0;">
                ${currentUser.adminLevel >= 1 ? '<img src="https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png" class="selo-icon">' : ''}
                ${currentUser.isProf ? '<img src="https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png" class="selo-icon">' : ''}
                ${currentUser.plano !== 'gratis' ? '<img src="https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png" class="selo-icon">' : ''}
                ${currentUser.isQuizzer ? '<img src="https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png" class="selo-icon">' : ''}
                <img src="https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png" class="selo-icon">
            </div>
            <div class="flex-center gap-15 mb-15">
                <span><strong>${seguidoresCount}</strong> Seguidores</span>
                <span><strong>${seguindoCount}</strong> Seguindo</span>
                <span style="color:var(--gold);font-size:20px;">⭐ ${currentUser.points || 0}</span>
            </div>
            <div class="flex-center gap-10">
                <button class="btn-primary btn-sm" onclick="mostrarEditarPerfil()">Editar Perfil</button>
                <button class="btn-danger btn-sm" onclick="logout()">Sair</button>
            </div>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="carregarPerfilTab('aulas')">📖 Aulas</div>
            <div class="tab" onclick="carregarPerfilTab('posts')">📰 Posts</div>
            <div class="tab" onclick="carregarPerfilTab('materias')">📚 Disciplinas</div>
            <div class="tab" onclick="carregarPerfilTab('conquistas')">🏅 Conquistas</div>
            <div class="tab" onclick="carregarPerfilTab('quizzes')">📝 Histórico</div>
        </div>
        <div id="perfil-content"></div>
    `;
    
    carregarPerfilTab('aulas');
}

function carregarPerfilTab(tab) {
    const container = $('perfil-content');
    if (!container) return;
    
    // Atualizar tabs ativas
    $$('#page-perfil .tab').forEach(function(t) { t.classList.remove('active'); });
    
    switch(tab) {
        case 'posts':
            db.ref('posts').orderByChild('autorId').equalTo(currentUser.uid).once('value')
            .then(function(snap) {
                if (snap.exists()) {
                    let html = '';
                    snap.forEach(function(child) {
                        const p = child.val();
                        html += `<div class="post-card"><p>${p.texto || ''}</p><span class="post-data">${formatarData(p.createdAt)}</span></div>`;
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhum post</p></div>';
                }
            });
            break;
        case 'materias':
            db.ref('materias').orderByChild('autorId').equalTo(currentUser.uid).once('value')
            .then(function(snap) {
                if (snap.exists()) {
                    let html = '';
                    snap.forEach(function(child) {
                        const m = child.val();
                        html += `<div class="card"><strong>${m.icone||''} ${m.nome||''}</strong><p style="color:#94A3B8;">${m.descricao||''}</p></div>`;
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Nenhuma disciplina</p></div>';
                }
            });
            break;
        case 'conquistas':
            carregarConquistasPerfil(container);
            break;
        case 'quizzes':
            db.ref('usuarios/' + currentUser.uid + '/historico_quizzes').once('value')
            .then(function(snap) {
                if (snap.exists()) {
                    let html = '';
                    snap.forEach(function(child) {
                        const h = child.val();
                        html += `<div class="card"><strong>Quiz</strong> | ⭐ ${h.pontuacao} pts | ${h.acertos}/${h.total} acertos | ${formatarData(h.data)}</div>`;
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>Nenhum quiz realizado</p></div>';
                }
            });
            break;
        default:
            container.innerHTML = '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>Em breve</p></div>';
    }
}

function carregarConquistasPerfil(container) {
    const conquistas = [
        {id: 'primeiro_quiz', nome: 'Primeiro Quiz', icone: '📝', desc: 'Completar seu primeiro quiz', cond: function(u) { return u.points >= 10; }},
        {id: '10_quizzes', nome: 'Quizzer', icone: '🏅', desc: 'Completar 10 quizzes', cond: function(u) { return u.points >= 100; }},
        {id: '1000_pontos', nome: 'Estudioso', icone: '⭐', desc: 'Alcançar 1000 pontos', cond: function(u) { return u.points >= 1000; }},
        {id: 'primeiro_post', nome: 'Social', icone: '📰', desc: 'Fazer primeiro post', cond: function() { return true; }},
        {id: 'seguidor_10', nome: 'Popular', icone: '👥', desc: 'Ter 10 seguidores', cond: function(u) { return (u.seguidores ? Object.keys(u.seguidores).length : 0) >= 10; }}
    ];
    
    let html = '';
    conquistas.forEach(function(c) {
        const desbloqueada = c.cond(currentUser);
        html += `
            <div class="conquista-card ${!desbloqueada ? 'conquista-bloqueada' : ''}">
                <div class="conquista-icone">${c.icone}</div>
                <div class="conquista-info">
                    <h4>${c.nome} ${desbloqueada ? '✅' : '🔒'}</h4>
                    <p>${c.desc}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function mostrarEditarPerfil() {
    criarModal('Editar Perfil', `
        <input type="text" id="edit-bio" placeholder="Bio" value="${currentUser.bio || ''}">
        <input type="file" id="edit-avatar" accept="image/*" onchange="previewAvatar()">
        <div id="avatar-preview" style="margin:10px 0;">
            ${currentUser.avatar ? `<img src="${currentUser.avatar}" style="width:60px;height:60px;border-radius:50%;">` : ''}
        </div>
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="salvarPerfil()">Salvar</button>
        </div>
    `);
}

function previewAvatar() {
    const file = $('edit-avatar')?.files[0];
    const preview = $('avatar-preview');
    if (!file || !preview) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" style="width:60px;height:60px;border-radius:50%;">`;
    };
    reader.readAsDataURL(file);
    window._avatarFile = file;
}

function salvarPerfil() {
    const bio = $('edit-bio')?.value?.trim() || '';
    
    if (window._avatarFile) {
        const formData = new FormData();
        formData.append('image', window._avatarFile);
        
        fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST', body: formData
        }).then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                db.ref('usuarios/' + currentUser.uid).update({bio, avatar: data.data.url})
                .then(atualizarPerfilLocal(bio, data.data.url));
            }
        });
    } else {
        db.ref('usuarios/' + currentUser.uid).update({bio}).then(atualizarPerfilLocal(bio, currentUser.avatar));
    }
}

function atualizarPerfilLocal(bio, avatar) {
    currentUser.bio = bio;
    currentUser.avatar = avatar;
    toast('Perfil atualizado!', 'success');
    fecharModal();
    carregarPerfil();
}

// ==================== SEGUIDORES ====================
function seguirUsuario(uid) {
    if (!currentUser || uid === currentUser.uid) return;
    
    const seguindoRef = db.ref('seguindo/' + currentUser.uid + '/' + uid);
    const seguidorRef = db.ref('seguidores/' + uid + '/' + currentUser.uid);
    
    seguindoRef.once('value').then(function(snap) {
        if (snap.exists()) {
            // Deixar de seguir
            seguindoRef.remove();
            seguidorRef.remove();
            toast('Deixou de seguir', 'info');
        } else {
            // Seguir
            seguindoRef.set(true);
            seguidorRef.set(true);
            toast('Seguindo!', 'success');
            enviarNotificacao(uid, currentUser.username + ' começou a seguir você', 'follow', 'perfil');
        }
    });
}

// ==================== NOTIFICAÇÕES ====================
function verificarNotificacoes() {
    if (!currentUser) return;
    
    db.ref('notificacoes/' + currentUser.uid).orderByChild('lida').equalTo(false).once('value')
    .then(function(snap) {
        const badge = $('notif-badge');
        const count = snap.exists() ? snap.numChildren() : 0;
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}

function enviarNotificacao(uid, mensagem, tipo, link) {
    db.ref('notificacoes/' + uid).push().set({
        mensagem, tipo, link, lida: false, createdAt: Date.now()
    });
}

function carregarNotificacoes() {
    const page = $('page-notificacoes');
    if (!page) return;
    
    page.innerHTML = '<h2 class="mb-20">🔔 Notificações</h2><div id="notif-lista"></div>';
    
    db.ref('notificacoes/' + currentUser.uid).once('value').then(function(snap) {
        const container = $('notif-lista');
        if (!container) return;
        
        if (snap.exists()) {
            let html = '';
            const notifs = [];
            snap.forEach(function(child) {
                notifs.unshift({id: child.key, ...child.val()});
            });
            
            notifs.forEach(function(n) {
                html += `
                    <div class="card" style="cursor:pointer;${n.lida ? 'opacity:0.6;' : ''}" onclick="marcarNotifLida('${n.id}')">
                        <p>${n.mensagem}</p>
                        <span style="font-size:10px;color:#64748B;">${formatarData(n.createdAt)}</span>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell"></i><p>Nenhuma notificação</p></div>';
        }
    });
}

function marcarNotifLida(notifId) {
    db.ref('notificacoes/' + currentUser.uid + '/' + notifId + '/lida').set(true);
    verificarNotificacoes();
}

// ==================== CHAT ====================
function carregarChat() {
    const page = $('page-chat');
    if (!page) return;
    
    page.innerHTML = `
        <h2 class="mb-20">💬 Chat</h2>
        <div id="chat-lista-contatos"></div>
        <div id="chat-area" style="display:none;"></div>
    `;
    
    carregarContatos();
}

function carregarContatos() {
    // Simplificado - listar conversas
    const container = $('chat-lista-contatos');
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Chat em desenvolvimento</p></div>';
}

// ==================== GRUPOS ====================
function carregarGrupos() {
    const page = $('page-grupos');
    if (!page) return;
    
    page.innerHTML = `
        <div class="flex-between mb-20">
            <h2>👥 Grupos de Estudo</h2>
            <button class="btn-primary btn-sm" onclick="mostrarCriarGrupo()">+ Grupo</button>
        </div>
        <div id="grupos-lista"></div>
    `;
    
    db.ref('grupos').once('value').then(function(snap) {
        const container = $('grupos-lista');
        if (!container) return;
        
        if (snap.exists()) {
            let html = '';
            snap.forEach(function(child) {
                const g = child.val();
                html += `
                    <div class="card">
                        <h3>${g.nome || 'Grupo'}</h3>
                        <p style="color:#94A3B8;">${g.descricao || ''}</p>
                        <button class="btn-primary btn-sm mt-10">Entrar</button>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum grupo</p></div>';
        }
    });
}

function mostrarCriarGrupo() {
    criarModal('Novo Grupo', `
        <input type="text" id="grupo-nome" placeholder="Nome do grupo">
        <textarea id="grupo-descricao" placeholder="Descrição"></textarea>
        <div class="modal-buttons">
            <button class="btn-danger" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="criarGrupo()">Criar</button>
        </div>
    `);
}

function criarGrupo() {
    const nome = $('grupo-nome')?.value?.trim();
    if (!nome) return;
    
    db.ref('grupos').push().set({
        nome,
        descricao: $('grupo-descricao')?.value?.trim() || '',
        criadorId: currentUser.uid,
        membros: {[currentUser.uid]: true},
        createdAt: Date.now()
    }).then(function() {
        toast('Grupo criado!', 'success');
        fecharModal();
        carregarGrupos();
    });
}

// ==================== FLASHCARDS ====================
function carregarFlashcards() {
    const page = $('page-flashcards');
    if (!page) return;
    
    page.innerHTML = `
        <h2 class="mb-20">🃏 Flashcards</h2>
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner">
                <div class="flashcard-front">Frente do Card<br><small style="color:#94A3B8;">Clique para virar</small></div>
                <div class="flashcard-back">Verso do Card</div>
            </div>
        </div>
        <div class="text-center mt-20">
            <button class="btn-primary btn-sm">Criar Baralho</button>
            <button class="btn-green btn-sm">Marcar Revisado</button>
        </div>
    `;
}

// ==================== POMODORO ====================
function carregarPomodoro() {
    const page = $('page-pomodoro');
    if (!page) return;
    
    pomodoroMode = 'focus';
    pomodoroSeconds = 25 * 60;
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    
    page.innerHTML = `
        <div class="pomodoro-container">
            <h2>🍅 Pomodoro</h2>
            <div class="pomodoro-mode mt-20">
                <button class="btn-sm ${pomodoroMode==='focus'?'btn-primary':'btn-icon'}" onclick="mudarModoPomodoro('focus')">Foco 25min</button>
                <button class="btn-sm ${pomodoroMode==='shortBreak'?'btn-primary':'btn-icon'}" onclick="mudarModoPomodoro('shortBreak')">Pausa 5min</button>
                <button class="btn-sm ${pomodoroMode==='longBreak'?'btn-primary':'btn-icon'}" onclick="mudarModoPomodoro('longBreak')">Pausa 15min</button>
            </div>
            <div class="pomodoro-timer" id="pomodoro-timer">${formatarTempo(pomodoroSeconds)}</div>
            <div class="pomodoro-controls">
                <button id="pomodoro-btn" class="btn-primary" onclick="togglePomodoro()">▶ Iniciar</button>
                <button class="btn-danger btn-sm" onclick="resetPomodoro()">↺ Reset</button>
            </div>
        </div>
    `;
}

function mudarModoPomodoro(mode) {
    pomodoroMode = mode;
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;
    
    switch(mode) {
        case 'focus': pomodoroSeconds = 25 * 60; break;
        case 'shortBreak': pomodoroSeconds = 5 * 60; break;
        case 'longBreak': pomodoroSeconds = 15 * 60; break;
    }
    
    atualizarDisplayPomodoro();
    const btn = $('pomodoro-btn');
    if (btn) btn.textContent = '▶ Iniciar';
    carregarPomodoro();
}

function togglePomodoro() {
    if (pomodoroRunning) {
        clearInterval(pomodoroInterval);
        pomodoroRunning = false;
        $('pomodoro-btn').textContent = '▶ Continuar';
    } else {
        pomodoroRunning = true;
        $('pomodoro-btn').textContent = '⏸ Pausar';
        pomodoroInterval = setInterval(function() {
            pomodoroSeconds--;
            atualizarDisplayPomodoro();
            if (pomodoroSeconds <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroRunning = false;
                toast('Pomodoro concluído! 🎉', 'success');
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Pomodoro concluído!');
                }
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;
    mudarModoPomodoro(pomodoroMode);
}

function atualizarDisplayPomodoro() {
    const el = $('pomodoro-timer');
    if (el) el.textContent = formatarTempo(pomodoroSeconds);
}

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

// ==================== MODO FOCO ====================
function toggleModoFoco() {
    modoFoco = !modoFoco;
    const btn = $('foco-btn');
    if (btn) {
        btn.innerHTML = modoFoco ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    toast(modoFoco ? 'Modo foco ativado! Notificações silenciadas.' : 'Modo foco desativado.', 'info');
}

// ==================== BUSCA GLOBAL ====================
function buscaGlobal() {
    const termo = $('global-search')?.value?.trim()?.toLowerCase();
    if (!termo || termo.length < 2) return;
    
    // Buscar em usuários, matérias, posts
    Promise.all([
        db.ref('usuarios').once('value'),
        db.ref('materias').once('value')
    ]).then(function([usersSnap, materiasSnap]) {
        const resultados = [];
        
        if (usersSnap.exists()) {
            usersSnap.forEach(function(child) {
                const u = child.val();
                if (u.username?.toLowerCase().includes(termo) || u.fullname?.toLowerCase().includes(termo)) {
                    resultados.push({tipo: 'user', nome: u.username, id: child.key});
                }
            });
        }
        
        if (materiasSnap.exists()) {
            materiasSnap.forEach(function(child) {
                const m = child.val();
                if (m.nome?.toLowerCase().includes(termo)) {
                    resultados.push({tipo: 'materia', nome: m.nome, id: child.key});
                }
            });
        }
        
        // Mostrar resultados (simplificado)
        if (resultados.length > 0) {
            console.log('Resultados:', resultados.slice(0, 10));
        }
    });
}

// ==================== VERIFICAR CONQUISTAS ====================
function verificarConquistas() {
    if (!currentUser) return;
    
    const conquistasDesbloqueadas = currentUser.conquistas || [];
    const novasConquistas = [];
    
    if (!conquistasDesbloqueadas.includes('primeiro_quiz') && currentUser.points >= 10) {
        novasConquistas.push('primeiro_quiz');
    }
    if (!conquistasDesbloqueadas.includes('1000_pontos') && currentUser.points >= 1000) {
        novasConquistas.push('1000_pontos');
    }
    
    if (novasConquistas.length > 0) {
        const todas = [...conquistasDesbloqueadas, ...novasConquistas];
        db.ref('usuarios/' + currentUser.uid + '/conquistas').set(todas);
        currentUser.conquistas = todas;
        toast('🏅 Nova conquista desbloqueada!', 'success');
    }
}

// ==================== SOBRE / UPDATES / CALENDÁRIO ====================
function carregarSobre() {
    const page = $('page-sobre');
    if (!page) return;
    
    db.ref('config/sobre').once('value').then(function(snap) {
        const texto = snap.exists() ? snap.val() : 'Sexta-Feira Studies - Rede social de estudos gamificada.';
        page.innerHTML = `
            <h2 class="mb-20">ℹ️ Sobre Nós</h2>
            <div class="card" style="white-space:pre-wrap;line-height:1.8;">${texto}</div>
            <div class="text-center mt-20" style="color:#94A3B8;">
                <p>Feito com ❤️ por Sexta-Feira Studies</p>
            </div>
        `;
    });
}

function carregarUpdates() {
    const page = $('page-updates');
    if (!page) return;
    
    db.ref('config/updates').once('value').then(function(snap) {
        let html = '<h2 class="mb-20">📋 Update Log</h2>';
        
        if (snap.exists()) {
            const updates = [];
            snap.forEach(function(child) {
                updates.unshift({id: child.key, ...child.val()});
            });
            
            updates.forEach(function(u) {
                html += `
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">${u.titulo || 'Update'}</span>
                            <span class="badge badge-verificado">v${u.versao || '1.0'}</span>
                        </div>
                        <p style="white-space:pre-wrap;">${u.descricao || ''}</p>
                        <span style="font-size:11px;color:#64748B;">${u.data || ''}</span>
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-state"><i class="fas fa-sync-alt"></i><p>Nenhum update</p></div>';
        }
        
        page.innerHTML = html;
    });
}

function carregarCalendario() {
    const page = $('page-calendario');
    if (!page) return;
    
    page.innerHTML = `
        <h2 class="mb-20">📅 Calendário</h2>
        <div class="card">
            <h3>Próximos Desafios</h3>
            <div id="calendario-desafios"></div>
        </div>
    `;
    
    db.ref('desafios').once('value').then(function(snap) {
        const container = $('calendario-desafios');
        if (!container) return;
        
        if (snap.exists()) {
            let html = '';
            const agora = Date.now();
            snap.forEach(function(child) {
                const d = child.val();
                if (d.inicio > agora) {
                    html += `
                        <div class="card">
                            <strong>${d.titulo}</strong>
                            <p>📅 ${new Date(d.inicio).toLocaleDateString('pt-BR')} às ${new Date(d.inicio).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                    `;
                }
            });
            container.innerHTML = html || '<p style="color:#94A3B8;">Nenhum desafio agendado</p>';
        } else {
            container.innerHTML = '<p style="color:#94A3B8;">Nenhum desafio</p>';
        }
    });
}

// ==================== UTILITÁRIOS ====================
function toast(msg, type) {
    const container = $('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

function formatarData(timestamp) {
    if (!timestamp) return '';
    const data = new Date(timestamp);
    const agora = new Date();
    const diff = agora - data;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
    
    return data.toLocaleDateString('pt-BR');
}

function criarModal(titulo, conteudo) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <h3>${titulo}</h3>
            ${conteudo}
        </div>
    `;
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) fecharModal();
    });
    document.body.appendChild(overlay);
}

function fecharModal() {
    const modal = $('modal-overlay');
    if (modal) modal.remove();
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Fechar sidebar ao clicar fora
    document.addEventListener('click', function(e) {
        const sidebar = $('sidebar');
        if (sidebar && sidebar.classList.contains('open') && window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && e.target.id !== 'menu-toggle') {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Verificar auth
    if (auth.currentUser) {
        carregarUsuario(auth.currentUser.uid);
    }
});
