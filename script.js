// CONFIGURAÇÕES FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC9Lcx3mYGYXavUi_b9c_tRbS3Otm9JQNk",
    authDomain: "sexta-feira-studies.firebaseapp.com",
    databaseURL: "https://sexta-feira-studies-default-rtdb.firebaseio.com",
    projectId: "sexta-feira-studies",
    storageBucket: "sexta-feira-studies.firebasestorage.app",
    messagingSenderId: "673251857052",
    appId: "1:673251857052:web:0ef6929ea93123f7a91359"
};

// APIs
const GROQ_KEY = "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";
const GEMINI_KEY = "AIzaSyAXrp3JQp0gEzm8S17pQtZrasMvZ4SadWY";
const IMGBB_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// State Global
let currentUser = null;
let currentChatFile = null;

// --- INICIALIZAÇÃO ---
window.onload = function() {
    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserData(user.uid);
        } else {
            showScreen('auth');
        }
        hideLoading();
    });
};

function showLoading() { document.getElementById('loading-screen').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-screen').classList.add('hidden'); }

function showScreen(screen) {
    if (screen === 'auth') {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    } else {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        showSection('home');
    }
}

// --- AUTENTICAÇÃO ---
async function handleLogin() {
    const userOrEmail = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    
    if (!userOrEmail || !pass) return toast("Preencha todos os campos");
    
    showLoading();
    try {
        // Se for email, loga direto. Se for @username, busca o email no firestore
        let email = userOrEmail;
        if (!userOrEmail.includes('@')) {
            const snap = await db.collection('usuarios').where('username', '==', userOrEmail.replace('@', '')).get();
            if (snap.empty) throw new Error("Usuário não encontrado");
            email = snap.docs[0].data().email;
        }
        await auth.signInWithEmailAndPassword(email, pass);
        toast("Bem-vindo de volta!");
    } catch (e) {
        toast("Erro ao entrar: " + e.message);
    }
    hideLoading();
}

async function handleSignup() {
    const name = document.getElementById('signup-fullname').value;
    const user = document.getElementById('signup-username').value.replace('@', '');
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;

    if (!name || !user || !email || !pass) return toast("Preencha tudo");

    showLoading();
    try {
        const res = await auth.createUserWithEmailAndPassword(email, pass);
        const uid = res.user.uid;
        
        const userData = {
            uid,
            fullname: name,
            username: user,
            email: email,
            avatar: "https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png",
            bio: "Novo estudante no Sexta-Feira Studies!",
            points: 0,
            plano: "free",
            adminLevel: 0,
            isProf: false,
            isQuizzer: false,
            seguidores: 0,
            seguindo: 0,
            conquistas: [],
            streak: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('usuarios').doc(uid).set(userData);
        toast("Conta criada com sucesso!");
    } catch (e) {
        toast("Erro ao cadastrar: " + e.message);
    }
    hideLoading();
}

function switchAuth(type) {
    document.getElementById('login-form').classList.toggle('hidden', type !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', type !== 'signup');
}

// --- CORE ---
async function loadUserData(uid) {
    db.collection('usuarios').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            currentUser = doc.data();
            document.getElementById('header-avatar').src = currentUser.avatar;
            document.getElementById('header-name').innerText = currentUser.fullname.split(' ')[0];
            showScreen('app');
        }
    });
}

function showSection(section) {
    const area = document.getElementById('content-area');
    area.innerHTML = '<div class="spinner"></div>';
    
    // Update Nav
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.innerText.toLowerCase().includes(section) || b.querySelector('span')?.innerText.toLowerCase() === section);
    if(activeBtn) activeBtn.classList.add('active');

    switch(section) {
        case 'home': renderHome(); break;
        case 'disciplinas': renderDisciplinas(); break;
        case 'feed': renderFeed(); break;
        case 'ranking': renderRanking(); break;
        case 'jarvis': renderJarvis(); break;
        case 'profile': renderProfile(currentUser.uid); break;
    }
}

// --- RENDERIZADORES ---

async function renderHome() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="home-hero">
            <h1>Olá, ${currentUser.fullname.split(' ')[0]}! 👋</h1>
            <p>Seu progresso diário está excelente.</p>
        </div>
        
        <div class="stat-grid">
            <div class="card stat-card glass">
                <h3>${currentUser.points}</h3>
                <p>Pontos XP</p>
            </div>
            <div class="card stat-card glass">
                <h3>${currentUser.streak}</h3>
                <p>Dias de Fogo</p>
            </div>
        </div>

        <div class="card glass" style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4>Atividades de Hoje</h4>
                <button class="btn-primary" style="padding: 4px 10px; font-size: 12px; border-radius: 8px;">Ver Agenda</button>
            </div>
            <div id="home-tasks" style="margin-top: 12px;">
                <p class="text-light" style="font-size: 13px;">Carregando tarefas...</p>
            </div>
        </div>

        <div id="desafio-banner-home"></div>
    `;
    loadHomeTasks();
}

async function renderDisciplinas() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>Minhas Disciplinas</h2>
            <button class="btn btn-primary" onclick="openModalCreateDisciplina()">
                <i class="fa fa-plus"></i> Nova
            </button>
        </div>
        <div class="disciplinas-grid" id="disciplinas-list"></div>
    `;
    
    const snap = await db.collection('materias').orderBy('createdAt', 'desc').get();
    const list = document.getElementById('disciplinas-list');
    if (snap.empty) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fa fa-folder-open" style="font-size: 40px; color: var(--text-light);"></i><p>Nenhuma disciplina ainda.</p></div>';
        return;
    }
    
    snap.forEach(doc => {
        const mat = doc.data();
        list.innerHTML += `
            <div class="materia-card" style="background: ${mat.color || 'var(--primary)'}" onclick="openDisciplina('${doc.id}')">
                <i class="fa ${mat.icone || 'fa-book'}"></i>
                <h4>${mat.nome}</h4>
                <p style="font-size: 10px; opacity: 0.8">${mat.autorNome}</p>
            </div>
        `;
    });
}

async function renderFeed() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="card glass" style="margin-bottom: 20px;">
            <div style="display: flex; gap: 12px;">
                <img src="${currentUser.avatar}" class="post-avatar">
                <textarea id="post-text" placeholder="Compartilhe uma dica ou dúvida..." style="flex:1; border:none; outline:none; resize:none; padding:10px; background:var(--bg); border-radius:12px;"></textarea>
            </div>
            <div id="post-preview" class="hidden" style="margin-top: 10px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                <div>
                    <label class="btn" style="background:var(--bg); padding: 8px 12px;"><i class="fa fa-image"></i><input type="file" hidden onchange="previewPostImage(this)"></label>
                    <select id="post-type" style="background:var(--bg); border:none; padding:8px; border-radius:8px; font-size:12px;">
                        <option value="post">Normal</option>
                        <option value="dica">💡 Dica</option>
                        <option value="duvida">❓ Dúvida</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="handleCreatePost()">Publicar</button>
            </div>
        </div>
        <div id="feed-list"></div>
    `;
    loadFeed();
}

async function renderJarvis() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="jarvis-container">
            <div class="card glass" style="margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
                <i class="fa fa-robot" style="font-size: 24px; color: var(--primary);"></i>
                <div>
                    <h4>Jarvis IA</h4>
                    <p style="font-size: 10px; color: var(--text-light);">Especialista em estudos</p>
                </div>
            </div>
            <div id="chat-messages" class="chat-messages">
                <div class="bubble bubble-jarvis">Olá! Sou o Jarvis. Em que posso ajudar nos seus estudos hoje? Posso até analisar imagens de exercícios!</div>
            </div>
            <div class="chat-input-area">
                <div id="jarvis-img-preview" class="preview-container"></div>
                <div class="chat-input-row">
                    <label style="cursor:pointer"><i class="fa fa-image"></i><input type="file" hidden onchange="previewJarvisImg(this)"></label>
                    <input type="text" id="jarvis-input" placeholder="Pergunte qualquer coisa..." onkeypress="if(event.key === 'Enter') sendJarvisMessage()">
                    <button class="btn btn-primary" onclick="sendJarvisMessage()" style="padding: 10px;"><i class="fa fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;
}

// --- IA LOGIC (GROQ & GEMINI) ---
async function sendJarvisMessage() {
    const input = document.getElementById('jarvis-input');
    const msg = input.value.trim();
    if (!msg && !currentChatFile) return;

    const chat = document.getElementById('chat-messages');
    
    // Mensagem do Usuário
    const userDiv = document.createElement('div');
    userDiv.className = 'bubble bubble-user';
    userDiv.innerText = msg;
    chat.appendChild(userDiv);
    
    input.value = '';
    const tempImg = currentChatFile;
    currentChatFile = null;
    document.getElementById('jarvis-img-preview').innerHTML = '';

    // Typing...
    const typing = document.createElement('div');
    typing.className = 'bubble bubble-jarvis';
    typing.innerText = 'Pensando...';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
        let responseText = "";
        
        if (tempImg) {
            // Gemini para Visão
            responseText = await callGeminiVision(msg || "O que tem nesta imagem?", tempImg);
        } else {
            // Groq para Texto
            responseText = await callGroq(msg);
        }

        typing.innerText = responseText;
    } catch (e) {
        typing.innerText = "Desculpe, tive um erro ao processar sua pergunta. 🤖";
        console.error(e);
    }
    chat.scrollTop = chat.scrollHeight;
}

async function callGroq(prompt) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "system", content: "Você é o Jarvis, assistente do site Sexta-Feira Studies. Seja educativo, motivador e responda em português." }, { role: "user", content: prompt }]
        })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

async function callGeminiVision(prompt, file) {
    // Para simplificar, convertemos o arquivo para base64
    const base64 = await toBase64(file);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: file.type, data: base64.split(',')[1] } }
                ]
            }]
        })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
}

// --- UTILS ---
function toast(msg) {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerText = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: formData });
    const data = await res.json();
    return data.data.url;
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function previewJarvisImg(input) {
    if (input.files && input.files[0]) {
        currentChatFile = input.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('jarvis-img-preview').innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}">
                    <button class="btn-remove-img" onclick="currentChatFile=null; this.parentElement.remove()"><i class="fa fa-times"></i></button>
                </div>
            `;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- MODALS & CREATE ---
function openModalCreateDisciplina() {
    const modal = document.getElementById('modal-container');
    document.getElementById('modal-title').innerText = "Criar Disciplina";
    document.getElementById('modal-content').innerHTML = `
        <div class="input-group"><input type="text" id="new-mat-name" placeholder="Nome da Matéria"></div>
        <div class="input-group"><input type="text" id="new-mat-desc" placeholder="Descrição Curta"></div>
        <div class="input-group">
            <select id="new-mat-icon" class="w-full" style="padding:10px; border-radius:12px; border:1px solid var(--border)">
                <option value="fa-book">📚 Livro</option>
                <option value="fa-flask">🧪 Ciência</option>
                <option value="fa-calculator">🧮 Matemática</option>
                <option value="fa-language">🌍 Idiomas</option>
                <option value="fa-palette">🎨 Artes</option>
            </select>
        </div>
        <div class="input-group"><input type="color" id="new-mat-color" value="#10B981" style="height:50px"></div>
        <button class="btn btn-primary w-full" onclick="saveDisciplina()">Salvar</button>
    `;
    modal.classList.remove('hidden');
}

async function saveDisciplina() {
    const nome = document.getElementById('new-mat-name').value;
    const desc = document.getElementById('new-mat-desc').value;
    const icone = document.getElementById('new-mat-icon').value;
    const color = document.getElementById('new-mat-color').value;

    if(!nome) return toast("Dê um nome à disciplina");

    showLoading();
    try {
        await db.collection('materias').add({
            nome, descricao: desc, icone, color,
            autorId: currentUser.uid,
            autorNome: currentUser.fullname,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast("Disciplina criada!");
        closeModal();
        renderDisciplinas();
    } catch(e) { toast(e.message); }
    hideLoading();
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

// Finalização Básica
function logout() {
    auth.signOut();
}
