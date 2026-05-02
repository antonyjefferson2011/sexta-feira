// ============================================
// SEXTA-FEIRA STUDIES - LÓGICA PRINCIPAL
// ============================================

// ===== CONFIGURAÇÕES =====
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
        authDomain: "sexta-feira-studies.firebaseapp.com",
        databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
        projectId: "sexta-feira-studies",
        storageBucket: "sexta-feira-studies.firebasestorage.app",
        messagingSenderId: "673251857052",
        appId: "1:673251857052:web:0ef6929ea93123f7a91359"
    },
    apis: {
        groq: "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",
        gemini: "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY",
        imgbb: "86427cccd2a94fb42a0754ffd7f19e79"
    },
    imagens: {
        logo: "https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png",
        jarvis: "https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png",
        seloAdmin: "https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png",
        seloProfessor: "https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png"
    }
};

// ===== INICIALIZAÇÃO FIREBASE =====
firebase.initializeApp(CONFIG.firebase);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let dadosUsuario = null;
let paginaAtual = 'home';
let quizAtual = null;
let timerQuiz = null;
let respostasQuiz = [];

// ===== FUNÇÕES DE AUTENTICAÇÃO =====

// Fazer login com @usuario e senha
async function fazerLogin() {
    mostrarLoading(true);
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value;

    if (!usuario || !senha) {
        mostrarToast('Preencha todos os campos!', 'erro');
        mostrarLoading(false);
        return;
    }

    try {
        // Buscar email pelo @usuario
        const snapshot = await db.collection('usuarios')
            .where('username', '==', usuario.replace('@', ''))
            .limit(1)
            .get();

        if (snapshot.empty) {
            mostrarToast('Usuário não encontrado!', 'erro');
            mostrarLoading(false);
            return;
        }

        const email = snapshot.docs[0].data().email;
        
        await auth.signInWithEmailAndPassword(email, senha);
        mostrarToast('Login realizado com sucesso!', 'sucesso');
    } catch (erro) {
        console.error('Erro login:', erro);
        let msg = 'Erro ao fazer login';
        if (erro.code === 'auth/wrong-password') msg = 'Senha incorreta';
        if (erro.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
        mostrarToast(msg, 'erro');
    }
    mostrarLoading(false);
}

// Login com Google
async function loginComGoogle() {
    mostrarLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const resultado = await auth.signInWithPopup(provider);
        const user = resultado.user;
        
        // Verificar se é primeiro login
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (!doc.exists) {
            await db.collection('usuarios').doc(user.uid).set({
                fullname: user.displayName || 'Usuário Google',
                username: user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || CONFIG.imagens.logo,
                bio: '',
                points: 0,
                plano: 'gratuito',
                adminLevel: 0,
                isProf: false,
                isQuizzer: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        mostrarToast('Login com Google realizado!', 'sucesso');
    } catch (erro) {
        console.error('Erro Google:', erro);
        mostrarToast('Erro ao fazer login com Google', 'erro');
    }
    mostrarLoading(false);
}

// Mostrar tela de cadastro
function mostrarCadastro() {
    document.getElementById('telaLogin').classList.remove('ativa');
    document.getElementById('telaCadastro').classList.add('ativa');
}

// Voltar para login
function voltarLogin() {
    document.getElementById('telaCadastro').classList.remove('ativa');
    document.getElementById('telaLogin').classList.add('ativa');
}

// Fazer cadastro
async function fazerCadastro() {
    mostrarLoading(true);
    const nome = document.getElementById('cadNome').value.trim();
    const usuario = document.getElementById('cadUsuario').value.trim().replace('@', '');
    const email = document.getElementById('cadEmail').value.trim();
    const senha = document.getElementById('cadSenha').value;

    if (!nome || !usuario || !email || !senha) {
        mostrarToast('Preencha todos os campos!', 'erro');
        mostrarLoading(false);
        return;
    }

    if (senha.length < 6) {
        mostrarToast('Senha deve ter no mínimo 6 caracteres', 'erro');
        mostrarLoading(false);
        return;
    }

    try {
        // Verificar se username já existe
        const snapUsuario = await db.collection('usuarios')
            .where('username', '==', usuario)
            .limit(1)
            .get();

        if (!snapUsuario.empty) {
            mostrarToast('@usuario já está em uso!', 'erro');
            mostrarLoading(false);
            return;
        }

        // Criar usuário no Authentication
        const userCred = await auth.createUserWithEmailAndPassword(email, senha);
        
        // Salvar dados no Firestore
        await db.collection('usuarios').doc(userCred.user.uid).set({
            fullname: nome,
            username: usuario,
            email: email,
            password: senha, // Em produção, NÃO salvar senha
            avatar: CONFIG.imagens.logo,
            bio: '',
            points: 0,
            plano: 'gratuito',
            adminLevel: 0,
            isProf: false,
            isQuizzer: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        mostrarToast('Cadastro realizado com sucesso!', 'sucesso');
        voltarLogin();
    } catch (erro) {
        console.error('Erro cadastro:', erro);
        let msg = 'Erro ao cadastrar';
        if (erro.code === 'auth/email-already-in-use') msg = 'Email já cadastrado';
        mostrarToast(msg, 'erro');
    }
    mostrarLoading(false);
}

// Recuperar senha
async function recuperarSenha() {
    const email = prompt('Digite seu email para recuperar a senha:');
    if (!email) return;

    try {
        await auth.sendPasswordResetEmail(email);
        mostrarToast('Email de recuperação enviado!', 'sucesso');
    } catch (erro) {
        mostrarToast('Erro ao enviar email de recuperação', 'erro');
    }
}

// Logout
async function logout() {
    await auth.signOut();
    usuarioAtual = null;
    dadosUsuario = null;
    document.getElementById('appPrincipal').classList.remove('ativa');
    document.getElementById('telaLogin').classList.add('ativa');
}

// ===== CARREGAR DADOS DO USUÁRIO =====
async function carregarDadosUsuario(uid) {
    try {
        const doc = await db.collection('usuarios').doc(uid).get();
        if (doc.exists) {
            dadosUsuario = doc.data();
            dadosUsuario.id = uid;
            usuarioAtual = { uid, ...dadosUsuario };
            
            // Atualizar interface
            document.getElementById('avatarTopbar').src = dadosUsuario.avatar || CONFIG.imagens.logo;
            document.getElementById('telaLogin').classList.remove('ativa');
            document.getElementById('appPrincipal').classList.add('ativa');
            
            // Carregar home
            irPara('home');
            carregarNotificacoes();
        }
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        mostrarToast('Erro ao carregar dados do usuário', 'erro');
    }
}

// ===== NAVEGAÇÃO =====
function irPara(pagina) {
    // Esconder todas as páginas
    document.querySelectorAll('.pagina').forEach(p => p.classList.remove('ativa'));
    
    // Mostrar página solicitada
    const ids = {
        home: 'paginaHome',
        disciplinas: 'paginaDisciplinas',
        quizzes: 'paginaQuizzes',
        ranking: 'paginaRanking',
        desafios: 'paginaDesafios',
        jarvis: 'paginaJarvis',
        feed: 'paginaFeed',
        perfil: 'paginaPerfil',
        agenda: 'paginaAgenda',
        anotacoes: 'paginaAnotacoes',
        chamada: 'paginaChamada',
        ficha: 'paginaFicha',
        pdf: 'paginaPDF',
        sobre: 'paginaSobre',
        updates: 'paginaUpdates'
    };

    const id = ids[pagina];
    if (id) {
        document.getElementById(id).classList.add('ativa');
        paginaAtual = pagina;
    }

    // Atualizar bottom nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
    const navMap = {
        home: 0, disciplinas: 1, quizzes: 2, jarvis: 3, perfil: 4
    };
    if (navMap[pagina] !== undefined) {
        document.querySelectorAll('.nav-item')[navMap[pagina]].classList.add('ativo');
    }

    // Carregar conteúdo
    switch(pagina) {
        case 'home': carregarHome(); break;
        case 'disciplinas': carregarDisciplinas(); break;
        case 'quizzes': carregarQuizzes(); break;
        case 'ranking': carregarRanking(); break;
        case 'desafios': carregarDesafios(); break;
        case 'perfil': carregarPerfil(); break;
        case 'agenda': carregarAgenda(); break;
        case 'anotacoes': carregarAnotacoes(); break;
        case 'chamada': carregarTurmas(); break;
        case 'sobre': carregarSobre(); break;
        case 'updates': carregarUpdates(); break;
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====
function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${tipo}`;
    toast.style.animation = 'none';
    toast.offsetHeight; // Trigger reflow
    toast.style.animation = 'slideIn 0.3s ease';
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.className = 'toast', 300);
    }, 3000);
}

function mostrarLoading(mostrar) {
    document.getElementById('loading').style.display = mostrar ? 'flex' : 'none';
}

function mostrarModal(conteudo) {
    document.getElementById('modalConteudo').innerHTML = conteudo;
    document.getElementById('modalOverlay').classList.add('ativa');
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('ativa');
}

function previewImagem(inputId, previewId) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            preview.src = e.target.result;
            document.getElementById(previewId + 'Container').style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
}

function removerPreview(inputId, containerId) {
    document.getElementById(inputId).value = '';
    document.getElementById(containerId).style.display = 'none';
}

async function uploadImagem(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.apis.imgbb}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Falha no upload');
        }
    } catch (erro) {
        console.error('Erro upload:', erro);
        mostrarToast('Erro ao fazer upload da imagem', 'erro');
        return null;
    }
}

// ===== CARREGAR HOME =====
async function carregarHome() {
    if (!usuarioAtual) return;
    
    // Saudação
    const hora = new Date().getHours();
    let saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    document.getElementById('saudacao').innerHTML = `
        <h2>${saudacao}, ${dadosUsuario.fullname.split(' ')[0]}!</h2>
        <p style="color: var(--texto-claro);">Continue estudando! 🚀</p>
    `;
    
    // Cards de estatísticas
    document.getElementById('xpTotal').textContent = dadosUsuario.points || 0;
    
    // Contar quizzes feitos
    const historico = await db.collection('historico')
        .where('userId', '==', usuarioAtual.uid)
        .get();
    document.getElementById('quizzesFeitos').textContent = historico.size;
    
    // Posição no ranking
    const ranking = await db.collection('usuarios')
        .orderBy('points', 'desc')
        .get();
    let posicao = 0;
    ranking.forEach((doc, i) => {
        if (doc.id === usuarioAtual.uid) posicao = i + 1;
    });
    document.getElementById('posicaoRanking').textContent = posicao ? `#${posicao}` : '-';
    
    // Total disciplinas
    const disciplinas = await db.collection('materias').get();
    document.getElementById('totalDisciplinas').textContent = disciplinas.size;
    
    // Barra de progresso
    const progresso = Math.min((dadosUsuario.points || 0) / 10, 100);
    document.getElementById('barraProgresso').style.width = progresso + '%';
    
    // Banner desafio do dia
    const desafios = await db.collection('desafios')
        .where('ativo', '==', true)
        .limit(1)
        .get();
    
    if (!desafios.empty) {
        const desafio = desafios.docs[0].data();
        document.getElementById('bannerDesafio').innerHTML = `
            <h3>🏆 Desafio do Dia</h3>
            <p>${desafio.titulo}</p>
            <small>Prêmio: ${desafio.premio} XP • Clique para participar!</small>
        `;
        document.getElementById('bannerDesafio').style.display = 'block';
    }
    
    // Carregar posts do feed
    carregarPosts('listaPosts');
    carregarAgendaHome();
}

// ===== CRIAR POST =====
async function criarPost() {
    if (!usuarioAtual) return;
    
    const texto = document.getElementById('postTexto').value.trim();
    const file = document.getElementById('postImagem').files[0];
    
    if (!texto && !file) {
        mostrarToast('Escreva algo ou adicione uma imagem', 'alerta');
        return;
    }
    
    mostrarLoading(true);
    let imagemUrl = '';
    
    if (file) {
        imagemUrl = await uploadImagem(file);
        if (!imagemUrl) {
            mostrarLoading(false);
            return;
        }
    }
    
    try {
        await db.collection('posts').add({
            texto: texto,
            imagem: imagemUrl,
            tipo: 'post',
            autorId: usuarioAtual.uid,
            autorNome: dadosUsuario.fullname,
            avatar: dadosUsuario.avatar || CONFIG.imagens.logo,
            isProf: dadosUsuario.isProf || false,
            likes: [],
            views: 0,
            comentarios: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Limpar formulário
        document.getElementById('postTexto').value = '';
        document.getElementById('postImagem').value = '';
        document.getElementById('postPreviewContainer').style.display = 'none';
        
        // Adicionar XP
        adicionarXP(5);
        
        mostrarToast('Post publicado!', 'sucesso');
        carregarPosts('listaPosts');
    } catch (erro) {
        mostrarToast('Erro ao publicar post', 'erro');
    }
    mostrarLoading(false);
}

// ===== CARREGAR POSTS =====
function carregarPosts(containerId) {
    if (!usuarioAtual) return;
    
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot((snapshot) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            if (snapshot.empty) {
                container.innerHTML = '<p class="text-center" style="padding: 30px; color: var(--texto-claro);">Nenhum post ainda</p>';
                return;
            }
            
            container.innerHTML = '';
            snapshot.forEach((doc) => {
                const post = doc.data();
                post.id = doc.id;
                container.appendChild(criarPostCard(post));
            });
        });
}

// Criar card de post
function criarPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    const tempo = post.createdAt ? formatarTempo(post.createdAt.toDate()) : 'Agora';
    const likes = post.likes || [];
    const curtido = likes.includes(usuarioAtual?.uid);
    
    card.innerHTML = `
        <div class="post-header">
            <img src="${post.avatar || CONFIG.imagens.logo}" class="post-avatar">
            <div>
                <div class="post-nome">
                    ${post.autorNome}
                    ${post.isProf ? `<img src="${CONFIG.imagens.seloProfessor}" style="width:20px;vertical-align:middle;" title="Professor">` : ''}
                </div>
                <div class="post-tempo">${tempo}</div>
            </div>
        </div>
        ${post.texto ? `<div class="post-texto">${post.texto}</div>` : ''}
        ${post.imagem ? `<img src="${post.imagem}" class="post-imagem" loading="lazy">` : ''}
        <div class="post-acoes-btns">
            <button class="post-btn ${curtido ? 'curtido' : ''}" onclick="curtirPost('${post.id}')">
                <i class="fas fa-heart"></i> ${likes.length}
            </button>
            <button class="post-btn" onclick="mostrarComentarios('${post.id}')">
                <i class="fas fa-comment"></i> ${(post.comentarios || []).length}
            </button>
            <button class="post-btn">
                <i class="fas fa-eye"></i> ${post.views || 0}
            </button>
            ${(post.autorId === usuarioAtual?.uid || dadosUsuario?.adminLevel >= 1) ? 
                `<button class="post-btn" onclick="excluirPost('${post.id}')" style="color: var(--perigo);">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
        </div>
    `;
    
    return card;
}

// Curtir post
async function curtirPost(postId) {
    if (!usuarioAtual) return;
    
    const postRef = db.collection('posts').doc(postId);
    const doc = await postRef.get();
    const likes = doc.data().likes || [];
    
    if (likes.includes(usuarioAtual.uid)) {
        await postRef.update({
            likes: firebase.firestore.FieldValue.arrayRemove(usuarioAtual.uid)
        });
    } else {
        await postRef.update({
            likes: firebase.firestore.FieldValue.arrayUnion(usuarioAtual.uid)
        });
        adicionarXP(1);
    }
}

// Mostrar comentários em modal
async function mostrarComentarios(postId) {
    const doc = await db.collection('posts').doc(postId).get();
    const post = doc.data();
    const comentarios = post.comentarios || [];
    
    let html = `
        <h3>Comentários</h3>
        <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
    `;
    
    if (comentarios.length === 0) {
        html += '<p style="color: var(--texto-claro);">Nenhum comentário ainda</p>';
    } else {
        comentarios.forEach(c => {
            html += `
                <div style="background: var(--fundo); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>${c.autorNome}</strong>
                    <p>${c.texto}</p>
                </div>
            `;
        });
    }
    
    html += `
        </div>
        <div style="display:flex;gap:10px;">
            <input type="text" id="comentarioTexto" placeholder="Escreva um comentário..." class="input-campo">
            <button onclick="adicionarComentario('${postId}')" class="btn-primario">Enviar</button>
        </div>
    `;
    
    mostrarModal(html);
}

// Adicionar comentário
async function adicionarComentario(postId) {
    const texto = document.getElementById('comentarioTexto').value.trim();
    if (!texto) return;
    
    await db.collection('posts').doc(postId).update({
        comentarios: firebase.firestore.FieldValue.arrayUnion({
            autorId: usuarioAtual.uid,
            autorNome: dadosUsuario.fullname,
            texto: texto,
            createdAt: new Date().toISOString()
        })
    });
    
    adicionarXP(2);
    fecharModal();
    mostrarToast('Comentário adicionado!', 'sucesso');
}

// Excluir post
async function excluirPost(postId) {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    await db.collection('posts').doc(postId).delete();
    mostrarToast('Post excluído!', 'sucesso');
}

// ===== ADICIONAR XP =====
async function adicionarXP(pontos) {
    if (!usuarioAtual) return;
    
    const novoXP = (dadosUsuario.points || 0) + pontos;
    await db.collection('usuarios').doc(usuarioAtual.uid).update({
        points: novoXP
    });
    dadosUsuario.points = novoXP;
}

// ===== DISCIPLINAS =====
async function carregarDisciplinas() {
    const grid = document.getElementById('gridDisciplinas');
    
    db.collection('materias').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            grid.innerHTML = '<p class="text-center" style="padding:30px;">Nenhuma disciplina ainda</p>';
            return;
        }
        
        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const materia = doc.data();
            const card = document.createElement('div');
            card.className = 'card-disciplina';
            card.innerHTML = `
                <i class="${materia.icone || 'fas fa-book'}"></i>
                <h3>${materia.nome}</h3>
            `;
            card.onclick = () => abrirDisciplina(doc.id, materia);
            grid.appendChild(card);
        });
    });
}

function mostrarModalCriarDisciplina() {
    const html = `
        <h3>Nova Disciplina</h3>
        <input type="text" id="discNome" placeholder="Nome da disciplina" class="input-campo">
        <input type="text" id="discDesc" placeholder="Descrição" class="input-campo">
        <select id="discIcone" class="input-campo">
            <option value="fas fa-book">📚 Livro</option>
            <option value="fas fa-calculator">🔢 Matemática</option>
            <option value="fas fa-flask">🧪 Ciências</option>
            <option value="fas fa-globe">🌍 Geografia</option>
            <option value="fas fa-landmark">📜 História</option>
            <option value="fas fa-language">🌎 Idiomas</option>
        </select>
        <button onclick="criarDisciplina()" class="btn-primario mt-2">Criar</button>
    `;
    mostrarModal(html);
}

async function criarDisciplina() {
    const nome = document.getElementById('discNome').value.trim();
    const descricao = document.getElementById('discDesc').value.trim();
    const icone = document.getElementById('discIcone').value;
    
    if (!nome) {
        mostrarToast('Digite o nome da disciplina', 'alerta');
        return;
    }
    
    await db.collection('materias').add({
        nome, descricao, icone,
        autorId: usuarioAtual.uid,
        autorNome: dadosUsuario.fullname,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    fecharModal();
    mostrarToast('Disciplina criada!', 'sucesso');
}

function abrirDisciplina(id, materia) {
    document.getElementById('gridDisciplinas').style.display = 'none';
    document.getElementById('aulasDisciplina').style.display = 'block';
    document.getElementById('nomeDisciplinaAtual').textContent = materia.nome;
    
    // Carregar aulas
    db.collection('aulas').doc(id).collection('itens').onSnapshot((snapshot) => {
        const lista = document.getElementById('listaAulas');
        lista.innerHTML = '';
        
        snapshot.forEach(doc => {
            const aula = doc.data();
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <h4>${aula.titulo}</h4>
                <p style="color:var(--texto-claro);">${aula.conteudo?.substring(0,100) || ''}...</p>
                <small>👁 ${aula.views || 0} visualizações</small>
            `;
            card.onclick = () => verAula(id, doc.id, aula);
            lista.appendChild(card);
        });
    });
}

// ===== QUIZZES =====
async function carregarQuizzes() {
    const lista = document.getElementById('listaQuizzes');
    
    db.collection('quizzes').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            lista.innerHTML = '<p class="text-center" style="padding:30px;">Nenhum quiz ainda</p>';
            return;
        }
        
        lista.innerHTML = '';
        snapshot.forEach(doc => {
            const quiz = doc.data();
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <h4>${quiz.nome}</h4>
                <p>${quiz.questoes?.length || 0} questões • ${quiz.tempo || 30}s</p>
                <button onclick="iniciarQuiz('${doc.id}')" class="btn-primario">Jogar</button>
            `;
            lista.appendChild(card);
        });
    });
}

function mostrarModalCriarQuiz() {
    let html = `
        <h3>Criar Quiz</h3>
        <input type="text" id="quizNome" placeholder="Nome do quiz" class="input-campo">
        <input type="number" id="quizTempo" placeholder="Tempo (segundos)" value="30" class="input-campo">
        <div id="quizQuestoesContainer">
            <h4>Questões</h4>
        </div>
        <button onclick="adicionarQuestaoQuiz()" class="btn-secundario mt-1">+ Adicionar Questão</button>
        <button onclick="salvarQuiz()" class="btn-primario mt-2">Salvar Quiz</button>
    `;
    mostrarModal(html);
    adicionarQuestaoQuiz();
}

let contadorQuestoes = 0;
function adicionarQuestaoQuiz() {
    const container = document.getElementById('quizQuestoesContainer');
    const i = contadorQuestoes++;
    
    container.innerHTML += `
        <div style="border:1px solid var(--borda);padding:10px;border-radius:8px;margin:10px 0;">
            <input type="text" id="qPergunta${i}" placeholder="Pergunta" class="input-campo">
            ${[0,1,2,3].map(j => `
                <input type="text" id="qAlt${i}_${j}" placeholder="Alternativa ${String.fromCharCode(65+j)}" class="input-campo">
            `).join('')}
            <select id="qCorreta${i}" class="input-campo">
                <option value="0">Resposta: A</option>
                <option value="1">Resposta: B</option>
                <option value="2">Resposta: C</option>
                <option value="3">Resposta: D</option>
            </select>
        </div>
    `;
}

async function salvarQuiz() {
    const nome = document.getElementById('quizNome').value.trim();
    const tempo = parseInt(document.getElementById('quizTempo').value) || 30;
    
    if (!nome) {
        mostrarToast('Digite o nome do quiz', 'alerta');
        return;
    }
    
    const questoes = [];
    for (let i = 0; i < contadorQuestoes; i++) {
        const pergunta = document.getElementById(`qPergunta${i}`)?.value;
        if (!pergunta) continue;
        
        questoes.push({
            pergunta,
            alternativas: [
                document.getElementById(`qAlt${i}_0`)?.value || '',
                document.getElementById(`qAlt${i}_1`)?.value || '',
                document.getElementById(`qAlt${i}_2`)?.value || '',
                document.getElementById(`qAlt${i}_3`)?.value || ''
            ],
            correta: parseInt(document.getElementById(`qCorreta${i}`)?.value || 0)
        });
    }
    
    await db.collection('quizzes').add({
        nome, tempo, questoes,
        autorId: usuarioAtual.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    fecharModal();
    mostrarToast('Quiz criado!', 'sucesso');
}

async function iniciarQuiz(quizId) {
    const doc = await db.collection('quizzes').doc(quizId).get();
    const quiz = doc.data();
    quizAtual = { id: quizId, ...quiz };
    respostasQuiz = [];
    
    document.getElementById('listaQuizzes').style.display = 'none';
    document.getElementById('jogarQuiz').style.display = 'block';
    
    let tempoRestante = quiz.tempo || 30;
    document.getElementById('quizTimer').textContent = `${tempoRestante}s`;
    
    mostrarQuestaoQuiz(0);
    
    timerQuiz = setInterval(() => {
        tempoRestante--;
        document.getElementById('quizTimer').textContent = `${tempoRestante}s`;
        
        if (tempoRestante <= 0) {
            clearInterval(timerQuiz);
            finalizarQuiz();
        }
    }, 1000);
}

function mostrarQuestaoQuiz(index) {
    if (index >= quizAtual.questoes.length) {
        clearInterval(timerQuiz);
        finalizarQuiz();
        return;
    }
    
    const q = quizAtual.questoes[index];
    document.getElementById('quizPergunta').textContent = `Questão ${index + 1}: ${q.pergunta}`;
    
    const alternativas = document.getElementById('quizAlternativas');
    alternativas.innerHTML = '';
    
    q.alternativas.forEach((alt, i) => {
        const div = document.createElement('div');
        div.className = 'quiz-alternativa';
        div.textContent = `${String.fromCharCode(65 + i)}) ${alt}`;
        div.onclick = () => responderQuiz(index, i);
        alternativas.appendChild(div);
    });
}

function responderQuiz(questaoIndex, respostaIndex) {
    respostasQuiz[questaoIndex] = respostaIndex;
    
    const correta = quizAtual.questoes[questaoIndex].correta;
    const alternativas = document.querySelectorAll('.quiz-alternativa');
    
    alternativas.forEach((alt, i) => {
        alt.style.pointerEvents = 'none';
        if (i === correta) alt.classList.add('correta');
        if (i === respostaIndex && i !== correta) alt.classList.add('errada');
    });
    
    setTimeout(() => mostrarQuestaoQuiz(questaoIndex + 1), 1000);
}

async function finalizarQuiz() {
    clearInterval(timerQuiz);
    
    let acertos = 0;
    quizAtual.questoes.forEach((q, i) => {
        if (respostasQuiz[i] === q.correta) acertos++;
    });
    
    const total = quizAtual.questoes.length;
    const pct = Math.round((acertos / total) * 100);
    const score = acertos * 10;
    
    // Salvar histórico
    await db.collection('historico').add({
        userId: usuarioAtual.uid,
        quizNome: quizAtual.nome,
        acertos, total, pct, score,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    adicionarXP(score);
    
    document.getElementById('jogarQuiz').innerHTML = `
        <div class="text-center" style="padding:40px;">
            <h2>Quiz Finalizado!</h2>
            <p style="font-size:3em;color:var(--primaria);">${pct}%</p>
            <p>${acertos} de ${total} questões</p>
            <p>+${score} XP</p>
            <button onclick="irPara('quizzes')" class="btn-primario mt-2">Voltar</button>
        </div>
    `;
    
    mostrarToast(`Você ganhou ${score} XP!`, 'sucesso');
}

// ===== JARVIS IA =====
async function enviarMensagem() {
    const input = document.getElementById('chatInput');
    const mensagem = input.value.trim();
    const file = document.getElementById('chatImagem').files[0];
    
    if (!mensagem && !file) return;
    
    // Se tiver imagem, fazer upload primeiro
    let imagemUrl = '';
    if (file) {
        mostrarLoading(true);
        imagemUrl = await uploadImagem(file);
        document.getElementById('chatImagem').value = '';
        document.getElementById('chatPreviewContainer').style.display = 'none';
        mostrarLoading(false);
    }
    
    // Adicionar mensagem do usuário
    if (mensagem || imagemUrl) {
        adicionarMensagemChat(mensagem || '📷 Analise esta imagem', 'usuario', imagemUrl);
    }
    
    input.value = '';
    
    // Mostrar indicador de digitação
    const typingId = 'typing-' + Date.now();
    adicionarMensagemChat('Digitando...', 'jarvis', '', typingId);
    
    try {
        let resposta = '';
        
        if (imagemUrl) {
            // Usar Gemini para análise de imagem
            resposta = await analisarImagemGemini(imagemUrl, mensagem);
        } else {
            // Usar Groq para texto
            resposta = await consultarGroq(mensagem);
        }
        
        // Remover indicador de digitação
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        // Adicionar resposta
        adicionarMensagemChat(resposta, 'jarvis');
        adicionarXP(3);
        
    } catch (erro) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        adicionarMensagemChat('Desculpe, ocorreu um erro. Tente novamente!', 'jarvis');
    }
}

function adicionarMensagemChat(texto, tipo, imagem = '', id = '') {
    const container = document.getElementById('chatMensagens');
    const div = document.createElement('div');
    div.className = `msg-bolha ${tipo}`;
    if (id) div.id = id;
    
    let conteudo = texto;
    if (imagem) {
        conteudo += `<br><img src="${imagem}" style="max-width:200px;border-radius:8px;margin-top:8px;">`;
    }
    
    div.innerHTML = `
        ${tipo === 'jarvis' ? `<img src="${CONFIG.imagens.jarvis}" class="msg-avatar">` : ''}
        <div class="msg-texto">${conteudo}</div>
        ${tipo === 'usuario' ? `<img src="${dadosUsuario.avatar || CONFIG.imagens.logo}" class="msg-avatar">` : ''}
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function consultarGroq(pergunta) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.apis.groq}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'Você é o Jarvis, assistente educacional do Sexta-Feira Studies. Seja amigável, use emojis, explique de forma didática e incentive os estudos. Mantenha respostas concisas e úteis.'
                },
                { role: 'user', content: pergunta }
            ],
            temperature: 0.7,
            max_tokens: 800
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}

async function analisarImagemGemini(imagemUrl, pergunta = '') {
    try {
        // Buscar a imagem como base64
        const imgResponse = await fetch(imagemUrl);
        const blob = await imgResponse.blob();
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];
                
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.apis.gemini}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: pergunta || 'Analise esta imagem em contexto educacional. O que você vê? Explique detalhadamente.' },
                                    { inline_data: { mime_type: 'image/jpeg', data: base64 } }
                                ]
                            }]
                        })
                    }
                );
                
                const data = await response.json();
                resolve(data.candidates[0].content.parts[0].text);
            };
            reader.readAsDataURL(blob);
        });
    } catch (erro) {
        console.error('Erro Gemini:', erro);
        return 'Não consegui analisar a imagem. Tente novamente.';
    }
}

// ===== RANKING =====
async function carregarRanking() {
    mostrarLoading(true);
    
    try {
        const snapshot = await db.collection('usuarios')
            .orderBy('points', 'desc')
            .limit(50)
            .get();
        
        const usuarios = [];
        snapshot.forEach(doc => {
            usuarios.push({ id: doc.id, ...doc.data() });
        });
        
        // Pódio top 3
        const podio = document.getElementById('podioRanking');
        if (usuarios.length >= 3) {
            podio.innerHTML = `
                <div class="podio-item podio-2" style="order:1;">
                    <div style="font-size:2em;">🥈</div>
                    <div>${usuarios[1].fullname.split(' ')[0]}</div>
                    <small>⭐ ${usuarios[1].points}</small>
                </div>
                <div class="podio-item podio-1" style="order:0;">
                    <div style="font-size:2.5em;">🥇</div>
                    <div>${usuarios[0].fullname.split(' ')[0]}</div>
                    <small>⭐ ${usuarios[0].points}</small>
                </div>
                <div class="podio-item podio-3" style="order:2;">
                    <div style="font-size:1.8em;">🥉</div>
                    <div>${usuarios[2].fullname.split(' ')[0]}</div>
                    <small>⭐ ${usuarios[2].points}</small>
                </div>
            `;
        }
        
        // Lista completa
        const lista = document.getElementById('listaRanking');
        lista.innerHTML = '';
        
        usuarios.forEach((user, index) => {
            const posicao = index + 1;
            const isUsuario = user.id === usuarioAtual?.uid;
            
            const div = document.createElement('div');
            div.className = `ranking-item ${isUsuario ? 'destaque' : ''}`;
            div.innerHTML = `
                <div class="ranking-posicao">#${posicao}</div>
                <img src="${user.avatar || CONFIG.imagens.logo}" style="width:40px;height:40px;border-radius:50%;">
                <div style="flex:1;">
                    <strong>${user.fullname}</strong>
                    <br><small>@${user.username}</small>
                </div>
                <div style="font-weight:700;color:var(--primaria);">⭐ ${user.points}</div>
            `;
            lista.appendChild(div);
        });
        
    } catch (erro) {
        console.error('Erro ranking:', erro);
    }
    mostrarLoading(false);
}

// ===== DESAFIOS =====
async function carregarDesafios() {
    const lista = document.getElementById('listaDesafios');
    
    db.collection('desafios')
        .where('ativo', '==', true)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                lista.innerHTML = '<p class="text-center" style="padding:30px;">Nenhum desafio ativo</p>';
                return;
            }
            
            lista.innerHTML = '';
            snapshot.forEach(doc => {
                const desafio = doc.data();
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.style.border = '2px solid var(--primaria)';
                
                const inicio = desafio.inicio?.toDate() || new Date();
                const fim = desafio.fim?.toDate() || new Date();
                const agora = new Date();
                const podeParticipar = agora >= inicio && agora <= fim;
                
                card.innerHTML = `
                    <h3>🏆 ${desafio.titulo}</h3>
                    <p>${desafio.descricao || ''}</p>
                    ${desafio.banner ? `<img src="${desafio.banner}" style="width:100%;border-radius:8px;margin:10px 0;">` : ''}
                    <p><strong>Matéria:</strong> ${desafio.materia || 'Geral'}</p>
                    <p><strong>Prêmio:</strong> ${desafio.premio || 100} XP</p>
                    <p><strong>Início:</strong> ${formatarData(inicio)}</p>
                    <p><strong>Fim:</strong> ${formatarData(fim)}</p>
                    ${podeParticipar ? 
                        `<button onclick="participarDesafio('${doc.id}')" class="btn-primario w-full mt-2">Participar</button>` :
                        '<p style="color:var(--perigo);">Desafio não disponível no momento</p>'}
                `;
                lista.appendChild(card);
            });
        });
}

async function participarDesafio(desafioId) {
    const doc = await db.collection('desafios').doc(desafioId).get();
    const desafio = doc.data();
    
    // Verificar se já participou
    const participantes = desafio.participantes || [];
    if (participantes.some(p => p.userId === usuarioAtual.uid)) {
        mostrarToast('Você já participou deste desafio!', 'alerta');
        return;
    }
    
    // Iniciar quiz do desafio
    quizAtual = {
        id: desafioId,
        nome: desafio.titulo,
        tempo: 300, // 5 minutos
        questoes: desafio.questoes || [],
        isDesafio: true
    };
    
    respostasQuiz = [];
    document.getElementById('listaDesafios').style.display = 'none';
    
    // Criar área do quiz
    const container = document.getElementById('paginaDesafios');
    container.innerHTML = `
        <div id="jogarDesafio">
            <div class="quiz-timer" id="desafioTimer">300s</div>
            <div id="desafioPergunta" class="quiz-pergunta"></div>
            <div id="desafioAlternativas" class="quiz-alternativas"></div>
        </div>
    `;
    
    let tempoRestante = 300;
    
    mostrarQuestaoDesafio(0);
    
    timerQuiz = setInterval(() => {
        tempoRestante--;
        document.getElementById('desafioTimer').textContent = `${tempoRestante}s`;
        
        if (tempoRestante <= 0) {
            clearInterval(timerQuiz);
            finalizarDesafio(desafioId);
        }
    }, 1000);
}

function mostrarQuestaoDesafio(index) {
    if (index >= quizAtual.questoes.length) {
        clearInterval(timerQuiz);
        finalizarDesafio(quizAtual.id);
        return;
    }
    
    const q = quizAtual.questoes[index];
    document.getElementById('desafioPergunta').textContent = `Questão ${index + 1}/${quizAtual.questoes.length}: ${q.pergunta}`;
    
    const alternativas = document.getElementById('desafioAlternativas');
    alternativas.innerHTML = '';
    
    q.alternativas.forEach((alt, i) => {
        const div = document.createElement('div');
        div.className = 'quiz-alternativa';
        div.textContent = `${String.fromCharCode(65 + i)}) ${alt}`;
        div.onclick = () => {
            respostasQuiz[index] = i;
            div.style.background = '#D1FAE5';
            div.style.borderColor = 'var(--sucesso)';
            setTimeout(() => mostrarQuestaoDesafio(index + 1), 500);
        };
        alternativas.appendChild(div);
    });
}

async function finalizarDesafio(desafioId) {
    clearInterval(timerQuiz);
    
    let acertos = 0;
    quizAtual.questoes.forEach((q, i) => {
        if (respostasQuiz[i] === q.correta) acertos++;
    });
    
    const total = quizAtual.questoes.length;
    const score = acertos * 20;
    
    // Registrar participação
    await db.collection('desafios').doc(desafioId).update({
        participantes: firebase.firestore.FieldValue.arrayUnion({
            userId: usuarioAtual.uid,
            nome: dadosUsuario.fullname,
            acertos,
            total,
            score,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
    });
    
    adicionarXP(score);
    
    const container = document.getElementById('paginaDesafios');
    container.innerHTML = `
        <div class="text-center" style="padding:40px;">
            <h2>🏆 Desafio Concluído!</h2>
            <p style="font-size:3em;color:var(--primaria);">${acertos}/${total}</p>
            <p>+${score} XP</p>
            <p>Resultado registrado! O vencedor será anunciado ao final do desafio.</p>
            <button onclick="irPara('desafios')" class="btn-primario mt-2">Voltar</button>
        </div>
    `;
    
    mostrarToast(`Desafio concluído! +${score} XP`, 'sucesso');
}

// ===== NOTIFICAÇÕES =====
function carregarNotificacoes() {
    if (!usuarioAtual) return;
    
    db.collection('notificacoes').doc(usuarioAtual.uid)
        .collection('itens')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot((snapshot) => {
            const badge = document.getElementById('badgeNotificacoes');
            let naoLidas = 0;
            
            snapshot.forEach(doc => {
                if (!doc.data().lida) naoLidas++;
            });
            
            badge.textContent = naoLidas;
            badge.style.display = naoLidas > 0 ? 'inline' : 'none';
        });
}

function mostrarNotificacoes() {
    if (!usuarioAtual) return;
    
    db.collection('notificacoes').doc(usuarioAtual.uid)
        .collection('itens')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
        .then((snapshot) => {
            let html = '<h3>Notificações</h3>';
            
            if (snapshot.empty) {
                html += '<p style="color:var(--texto-claro);">Nenhuma notificação</p>';
            } else {
                snapshot.forEach(doc => {
                    const not = doc.data();
                    html += `
                        <div style="background:var(--fundo);padding:12px;border-radius:8px;margin:8px 0;${not.lida ? '' : 'border-left:3px solid var(--primaria);'}">
                            <p>${not.mensagem}</p>
                            <small style="color:var(--texto-claro);">${formatarTempo(not.createdAt?.toDate())}</small>
                        </div>
                    `;
                });
            }
            
            mostrarModal(html);
        });
}


// ===== PERFIL =====
async function carregarPerfil() {
    if (!usuarioAtual) return;
    
    document.getElementById('perfilNome').textContent = dadosUsuario.fullname;
    document.getElementById('perfilUsuario').textContent = '@' + dadosUsuario.username;
    document.getElementById('perfilBio').textContent = dadosUsuario.bio || 'Nenhuma bio ainda';
    document.getElementById('perfilAvatar').src = dadosUsuario.avatar || CONFIG.imagens.logo;
    document.getElementById('perfilXP').textContent = dadosUsuario.points || 0;
    
    // Selos
    const selosDiv = document.getElementById('perfilSelos');
    selosDiv.innerHTML = '';
    if (dadosUsuario.adminLevel >= 1) {
        selosDiv.innerHTML += `<img src="${CONFIG.imagens.seloAdmin}" class="selo" title="Admin Nível ${dadosUsuario.adminLevel}">`;
    }
    if (dadosUsuario.isProf) {
        selosDiv.innerHTML += `<img src="${CONFIG.imagens.seloProfessor}" class="selo" title="Professor">`;
    }
    
    // Quizzes feitos
    const historico = await db.collection('historico')
        .where('userId', '==', usuarioAtual.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    
    document.getElementById('perfilQuizzes').textContent = historico.size;
    
    // Seguidores/Seguindo
    const seguidores = await db.collection('seguidores')
        .where('seguidoId', '==', usuarioAtual.uid)
        .get();
    document.getElementById('perfilSeguidores').textContent = seguidores.size;
    
    const seguindo = await db.collection('seguidores')
        .where('seguidorId', '==', usuarioAtual.uid)
        .get();
    document.getElementById('perfilSeguindo').textContent = seguindo.size;
    
    // Histórico de quizzes
    const histDiv = document.getElementById('perfilHistorico');
    histDiv.innerHTML = '<h4>Histórico de Quizzes</h4>';
    
    if (historico.empty) {
        histDiv.innerHTML += '<p>Nenhum quiz realizado ainda</p>';
    } else {
        historico.forEach(doc => {
            const h = doc.data();
            histDiv.innerHTML += `
                <div style="background:var(--fundo);padding:10px;border-radius:8px;margin:5px 0;">
                    <strong>${h.quizNome}</strong>
                    <br>Acertos: ${h.acertos}/${h.total} (${h.pct}%)
                    <br>Score: ${h.score} XP
                </div>
            `;
        });
    }
}

// Upload de avatar
async function uploadAvatar() {
    const file = document.getElementById('avatarUpload').files[0];
    if (!file) return;
    
    mostrarLoading(true);
    const url = await uploadImagem(file);
    
    if (url) {
        await db.collection('usuarios').doc(usuarioAtual.uid).update({ avatar: url });
        dadosUsuario.avatar = url;
        document.getElementById('perfilAvatar').src = url;
        document.getElementById('avatarTopbar').src = url;
        mostrarToast('Avatar atualizado!', 'sucesso');
    }
    mostrarLoading(false);
}

// ===== AGENDA =====
async function carregarAgenda() {
    if (!usuarioAtual) return;
    
    const lista = document.getElementById('listaAgenda');
    
    db.collection('agenda').doc(usuarioAtual.uid)
        .collection('itens')
        .orderBy('data', 'asc')
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                lista.innerHTML = '<p class="text-center" style="padding:30px;">Nenhum evento na agenda</p>';
                return;
            }
            
            lista.innerHTML = '';
            snapshot.forEach(doc => {
                const evento = doc.data();
                const card = document.createElement('div');
                card.className = `evento-card ${evento.concluido ? 'evento-concluido' : ''}`;
                card.style.borderLeftColor = evento.cor || 'var(--primaria)';
                card.innerHTML = `
                    <div>
                        <strong>${evento.titulo}</strong>
                        <br><small>${formatarData(evento.data?.toDate())} às ${evento.hora || '--:--'}</small>
                        <br><span class="tag" style="background:${evento.cor || 'var(--primaria)'};color:white;padding:2px 8px;border-radius:10px;font-size:0.75em;">${evento.tipo || 'Evento'}</span>
                        ${evento.disciplina ? `<small> • ${evento.disciplina}</small>` : ''}
                    </div>
                    <div>
                        <button onclick="marcarEventoConcluido('${doc.id}')" class="post-btn">
                            ${evento.concluido ? '✅' : '⬜'}
                        </button>
                        <button onclick="excluirEvento('${doc.id}')" class="post-btn" style="color:var(--perigo);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                lista.appendChild(card);
            });
        });
}

async function carregarAgendaHome() {
    if (!usuarioAtual) return;
    
    const hoje = new Date();
    const snapshot = await db.collection('agenda').doc(usuarioAtual.uid)
        .collection('itens')
        .where('data', '>=', hoje)
        .orderBy('data', 'asc')
        .limit(3)
        .get();
    
    if (!snapshot.empty) {
        const container = document.getElementById('saudacao');
        container.innerHTML += '<div style="margin-top:15px;"><strong>📅 Próximos eventos:</strong></div>';
        
        snapshot.forEach(doc => {
            const ev = doc.data();
            container.innerHTML += `
                <div style="font-size:0.9em;margin:5px 0;">• ${formatarData(ev.data?.toDate())} - ${ev.titulo}</div>
            `;
        });
    }
}

function mostrarModalEvento() {
    const html = `
        <h3>Novo Evento</h3>
        <input type="text" id="eventoTitulo" placeholder="Título" class="input-campo">
        <input type="date" id="eventoData" class="input-campo">
        <input type="time" id="eventoHora" class="input-campo">
        <select id="eventoTipo" class="input-campo">
            <option value="Prova">📝 Prova</option>
            <option value="Trabalho">📄 Trabalho</option>
            <option value="Aula">📚 Aula</option>
            <option value="Outro">📌 Outro</option>
        </select>
        <input type="text" id="eventoDisciplina" placeholder="Disciplina" class="input-campo">
        <select id="eventoCor" class="input-campo">
            <option value="#10B981">Verde</option>
            <option value="#3B82F6">Azul</option>
            <option value="#EF4444">Vermelho</option>
            <option value="#F59E0B">Amarelo</option>
            <option value="#8B5CF6">Roxo</option>
        </select>
        <button onclick="criarEvento()" class="btn-primario mt-2">Salvar</button>
    `;
    mostrarModal(html);
}

async function criarEvento() {
    const titulo = document.getElementById('eventoTitulo').value.trim();
    const data = document.getElementById('eventoData').value;
    const hora = document.getElementById('eventoHora').value;
    const tipo = document.getElementById('eventoTipo').value;
    const disciplina = document.getElementById('eventoDisciplina').value.trim();
    const cor = document.getElementById('eventoCor').value;
    
    if (!titulo || !data) {
        mostrarToast('Preencha título e data!', 'alerta');
        return;
    }
    
    await db.collection('agenda').doc(usuarioAtual.uid)
        .collection('itens').add({
            titulo, data: new Date(data), hora, tipo, disciplina, cor,
            concluido: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    
    fecharModal();
    mostrarToast('Evento criado!', 'sucesso');
}

// ===== ANOTAÇÕES =====
async function carregarAnotacoes() {
    if (!usuarioAtual) return;
    
    const lista = document.getElementById('listaAnotacoes');
    
    db.collection('anotacoes').doc(usuarioAtual.uid)
        .collection('itens')
        .orderBy('atualizadoEm', 'desc')
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                lista.innerHTML = '<p class="text-center" style="padding:30px;">Nenhuma anotação</p>';
                return;
            }
            
            lista.innerHTML = '';
            snapshot.forEach(doc => {
                const nota = doc.data();
                const card = document.createElement('div');
                card.className = 'anotacao-card';
                card.innerHTML = `
                    <h4>${nota.titulo}</h4>
                    <p style="color:var(--texto-claro);">${nota.conteudo?.substring(0, 100)}...</p>
                    <small>${formatarData(nota.atualizadoEm?.toDate())}</small>
                `;
                card.onclick = () => editarAnotacao(doc.id, nota);
                lista.appendChild(card);
            });
        });
}

function mostrarModalAnotacao(id = '', nota = {}) {
    const html = `
        <h3>${id ? 'Editar' : 'Nova'} Anotação</h3>
        <input type="text" id="notaTitulo" value="${nota.titulo || ''}" placeholder="Título" class="input-campo">
        <textarea id="notaConteudo" class="input-campo" rows="6" placeholder="Conteúdo...">${nota.conteudo || ''}</textarea>
        <button onclick="salvarAnotacao('${id}')" class="btn-primario mt-2">Salvar</button>
        ${id ? `<button onclick="excluirAnotacao('${id}')" class="btn-secundario mt-2" style="color:var(--perigo);">Excluir</button>` : ''}
    `;
    mostrarModal(html);
}

async function salvarAnotacao(id = '') {
    const titulo = document.getElementById('notaTitulo').value.trim();
    const conteudo = document.getElementById('notaConteudo').value.trim();
    
    if (!titulo) {
        mostrarToast('Digite um título!', 'alerta');
        return;
    }
    
    const dados = {
        titulo, conteudo,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (id) {
        await db.collection('anotacoes').doc(usuarioAtual.uid)
            .collection('itens').doc(id).update(dados);
    } else {
        dados.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('anotacoes').doc(usuarioAtual.uid)
            .collection('itens').add(dados);
    }
    
    fecharModal();
    mostrarToast('Anotação salva!', 'sucesso');
}

// ===== CHAMADA / LISTA DE PRESENÇA =====
async function carregarTurmas() {
    if (!usuarioAtual || (!dadosUsuario.isProf && dadosUsuario.adminLevel < 1)) {
        document.getElementById('paginaChamada').innerHTML = 
            '<p class="text-center" style="padding:30px;">Acesso restrito a professores</p>';
        return;
    }
    
    const lista = document.getElementById('listaTurmas');
    
    db.collection('turmas').doc(usuarioAtual.uid)
        .collection('itens')
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                lista.innerHTML = '<p class="text-center" style="padding:30px;">Nenhuma turma criada</p>';
                return;
            }
            
            lista.innerHTML = '';
            snapshot.forEach(doc => {
                const turma = doc.data();
                const card = document.createElement('div');
                card.className = 'turma-card';
                card.innerHTML = `
                    <h4>${turma.nome}</h4>
                    <p>${turma.disciplina} • ${turma.alunos?.length || 0} alunos</p>
                    <button onclick="abrirChamada('${doc.id}')" class="btn-primario">Fazer Chamada</button>
                `;
                lista.appendChild(card);
            });
        });
}

function mostrarModalTurma() {
    const html = `
        <h3>Nova Turma</h3>
        <input type="text" id="turmaNome" placeholder="Nome da turma" class="input-campo">
        <input type="text" id="turmaDisciplina" placeholder="Disciplina" class="input-campo">
        <h4>Alunos</h4>
        <div id="listaAlunosTurma"></div>
        <button onclick="adicionarAlunoTurma()" class="btn-secundario mt-1">+ Adicionar Aluno</button>
        <button onclick="criarTurma()" class="btn-primario mt-2">Criar Turma</button>
    `;
    mostrarModal(html);
    adicionarAlunoTurma();
}

let alunosTurmaTemporario = [];
function adicionarAlunoTurma() {
    const i = alunosTurmaTemporario.length;
    alunosTurmaTemporario.push({ nome: '', numero: i + 1 });
    
    const container = document.getElementById('listaAlunosTurma');
    container.innerHTML += `
        <div style="display:flex;gap:10px;margin:5px 0;">
            <input type="text" id="alunoNome${i}" placeholder="Nome do aluno" class="input-campo" style="flex:2;">
            <input type="number" id="alunoNumero${i}" placeholder="Nº" class="input-campo" style="flex:1;" value="${i + 1}">
        </div>
    `;
}

async function criarTurma() {
    const nome = document.getElementById('turmaNome').value.trim();
    const disciplina = document.getElementById('turmaDisciplina').value.trim();
    
    if (!nome) {
        mostrarToast('Digite o nome da turma!', 'alerta');
        return;
    }
    
    const alunos = [];
    for (let i = 0; i < alunosTurmaTemporario.length; i++) {
        const nomeAluno = document.getElementById(`alunoNome${i}`)?.value?.trim();
        if (!nomeAluno) continue;
        alunos.push({
            nome: nomeAluno,
            numero: parseInt(document.getElementById(`alunoNumero${i}`)?.value) || i + 1,
            foto: ''
        });
    }
    
    await db.collection('turmas').doc(usuarioAtual.uid)
        .collection('itens').add({
            nome, disciplina, alunos,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    
    alunosTurmaTemporario = [];
    fecharModal();
    mostrarToast('Turma criada!', 'sucesso');
}

async function abrirChamada(turmaId) {
    const turmaDoc = await db.collection('turmas').doc(usuarioAtual.uid)
        .collection('itens').doc(turmaId).get();
    const turma = turmaDoc.data();
    
    const hoje = new Date().toISOString().split('T')[0];
    
    let html = `
        <h3>Chamada - ${turma.nome}</h3>
        <p>${turma.disciplina} • ${formatarData(new Date())}</p>
        <input type="date" id="chamadaData" class="input-campo" value="${hoje}">
        <div style="max-height:400px;overflow-y:auto;">
    `;
    
    turma.alunos.forEach((aluno, i) => {
        html += `
            <div class="aluno-chamada">
                <span><strong>${aluno.numero}.</strong> ${aluno.nome}</span>
                <div class="chamada-status">
                    <button class="chamada-btn presente ativo" id="status${i}_p" onclick="marcarChamada(${i}, 'presente')">✅</button>
                    <button class="chamada-btn falta" id="status${i}_f" onclick="marcarChamada(${i}, 'falta')">❌</button>
                    <button class="chamada-btn justificado" id="status${i}_j" onclick="marcarChamada(${i}, 'justificado')">⚠️</button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <button onclick="salvarChamada('${turmaId}')" class="btn-primario mt-2 w-full">Registrar Chamada</button>
    `;
    
    mostrarModal(html);
    
    // Inicializar registros
    window.registrosChamada = {};
    turma.alunos.forEach((_, i) => {
        window.registrosChamada[i] = 'presente';
    });
}

function marcarChamada(alunoIndex, status) {
    window.registrosChamada[alunoIndex] = status;
    
    // Atualizar visual
    ['presente', 'falta', 'justificado'].forEach(s => {
        const btn = document.getElementById(`status${alunoIndex}_${s[0]}`);
        if (btn) {
            btn.classList.toggle('ativo', s === status);
            if (s === 'presente') btn.classList.toggle('presente', s === status);
            if (s === 'falta') btn.classList.toggle('falta', s === status);
            if (s === 'justificado') btn.classList.toggle('justificado', s === status);
        }
    });
}

async function salvarChamada(turmaId) {
    const data = document.getElementById('chamadaData').value;
    
    if (!data) {
        mostrarToast('Selecione a data!', 'alerta');
        return;
    }
    
    const turmaDoc = await db.collection('turmas').doc(usuarioAtual.uid)
        .collection('itens').doc(turmaId).get();
    const turma = turmaDoc.data();
    
    const registros = turma.alunos.map((aluno, i) => ({
        alunoId: i,
        alunoNome: aluno.nome,
        status: window.registrosChamada[i] || 'falta'
    }));
    
    await db.collection('chamadas').doc(turmaId)
        .collection('itens').add({
            data: new Date(data),
            registros,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    
    fecharModal();
    mostrarToast('Chamada registrada!', 'sucesso');
    
    // Atualizar fichas dos alunos
    atualizarFichasAlunos(turma, registros);
}

async function atualizarFichasAlunos(turma, registros) {
    for (const registro of registros) {
        const alunoRef = db.collection('fichas').doc(`${turma.nome}_${registro.alunoNome}`);
        const fichaDoc = await alunoRef.get();
        
        if (fichaDoc.exists) {
            const ficha = fichaDoc.data();
            const faltas = ficha.faltas || 0;
            
            await alunoRef.update({
                faltas: registro.status === 'falta' ? faltas + 1 : faltas,
                'registrosChamada': firebase.firestore.FieldValue.arrayUnion({
                    data: new Date().toISOString(),
                    status: registro.status
                })
            });
        } else {
            await alunoRef.set({
                nome: registro.alunoNome,
                turma: turma.nome,
                disciplina: turma.disciplina,
                contato: '',
                observacoes: '',
                notas: {},
                faltas: registro.status === 'falta' ? 1 : 0,
                pontosFortes: [],
                pontosFracos: [],
                sugestoes: [],
                registrosChamada: [{
                    data: new Date().toISOString(),
                    status: registro.status
                }],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }
}

// ===== FICHA DO ALUNO =====
async function carregarFichaAluno(alunoNome) {
    if (!usuarioAtual || (!dadosUsuario.isProf && dadosUsuario.adminLevel < 1)) return;
    
    const snapshot = await db.collection('fichas')
        .where('nome', '==', alunoNome)
        .limit(1)
        .get();
    
    if (snapshot.empty) {
        document.getElementById('fichaAluno').innerHTML = '<p>Aluno não encontrado</p>';
        return;
    }
    
    const ficha = snapshot.docs[0].data();
    
    // Análise de desempenho com IA
    let analiseIA = '';
    try {
        const prompt = `Analise o desempenho do aluno "${ficha.nome}" da turma "${ficha.turma}":
        Notas: ${JSON.stringify(ficha.notas || {})}
        Pontos fortes: ${(ficha.pontosFortes || []).join(', ')}
        Pontos fracos: ${(ficha.pontosFracos || []).join(', ')}
        Faltas: ${ficha.faltas || 0}
        
        Dê um resumo do desempenho em 2-3 frases e sugira áreas de melhoria.`;
        
        analiseIA = await consultarGroq(prompt);
    } catch (e) {
        analiseIA = 'Análise não disponível no momento.';
    }
    
    document.getElementById('fichaAluno').innerHTML = `
        <h3>${ficha.nome}</h3>
        <p><strong>Turma:</strong> ${ficha.turma || 'N/A'}</p>
        <p><strong>Disciplina:</strong> ${ficha.disciplina || 'N/A'}</p>
        <p><strong>Contato:</strong> ${ficha.contato || 'Não informado'}</p>
        <p><strong>Observações:</strong> ${ficha.observacoes || 'Nenhuma'}</p>
        
        <div class="ficha-secao">
            <h4>📊 Notas</h4>
            ${Object.entries(ficha.notas || {}).map(([disc, nota]) => 
                `<p><strong>${disc}:</strong> ${nota}</p>`
            ).join('') || '<p>Nenhuma nota registrada</p>'}
        </div>
        
        <div class="ficha-secao">
            <h4>📋 Faltas</h4>
            <p>Total: <strong>${ficha.faltas || 0}</strong></p>
        </div>
        
        <div class="ficha-secao">
            <h4>✅ Pontos Fortes</h4>
            ${(ficha.pontosFortes || []).map(p => `<span class="tag" style="background:#D1FAE5;color:#065F46;margin:3px;">${p}</span>`).join(' ') || '<p>Não identificados</p>'}
        </div>
        
        <div class="ficha-secao">
            <h4>⚠️ Pontos Fracos</h4>
            ${(ficha.pontosFracos || []).map(p => `<span class="tag" style="background:#FEE2E2;color:#991B1B;margin:3px;">${p}</span>`).join(' ') || '<p>Não identificados</p>'}
        </div>
        
        <div class="ficha-secao">
            <h4>🤖 Análise da IA</h4>
            <p>${analiseIA}</p>
        </div>
        
        <div class="ficha-secao">
            <h4>💡 Sugestões de Estudo</h4>
            ${(ficha.sugestoes || []).map(s => `<p>• ${s}</p>`).join('') || '<p>Gerando sugestões...</p>'}
        </div>
    `;
}

// ===== UTILITÁRIOS =====
function formatarTempo(data) {
    if (!data) return 'Agora';
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000);
    
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function formatarData(data) {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function buscarGlobal() {
    const termo = document.getElementById('buscaGlobal').value.toLowerCase();
    // Implementar busca global
    console.log('Buscando:', termo);
}

function buscarAnotacoes() {
    const termo = document.getElementById('buscaAnotacoes').value.toLowerCase();
    const cards = document.querySelectorAll('.anotacao-card');
    
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        card.style.display = texto.includes(termo) ? 'block' : 'none';
    });
}

// ===== INICIALIZAÇÃO =====
auth.onAuthStateChanged((user) => {
    if (user) {
        carregarDadosUsuario(user.uid);
    } else {
        document.getElementById('appPrincipal').classList.remove('ativa');
        document.getElementById('telaLogin').classList.add('ativa');
    }
});

// Prevenir zoom em mobile
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());
