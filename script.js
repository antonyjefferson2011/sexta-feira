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
    images: {
        logo: "https://i.ibb.co/TqNkvPMT/Gemini-Generated-Image-vetlw0vetlw0vetl.png",
        favicon: "https://i.ibb.co/4nVtZpr2/Gemini-Generated-Image-vrc8thvrc8thvrc8.png",
        jarvis: "https://i.ibb.co/WQpBG05/Gemini-Generated-Image-xwcu3fxwcu3fxwcu.png",
        seloAdmin: "https://i.ibb.co/v42HP4Q4/Gemini-Generated-Image-w47123w47123w471.png",
        seloProfessor: "https://i.ibb.co/7xBb9jQg/Gemini-Generated-Image-m0np5jm0np5jm0np.png",
        seloPremium: "https://i.ibb.co/21pxMCWt/Gemini-Generated-Image-ipjg3xipjg3xipjg.png",
        seloQuizzer: "https://i.ibb.co/zHNssTm0/Gemini-Generated-Image-3mtg9a3mtg9a3mtg.png",
        seloVerificado: "https://i.ibb.co/nXKFP0C/Gemini-Generated-Image-175dza175dza175d.png"
    }
};

// ===== INICIALIZAÇÃO FIREBASE =====
firebase.initializeApp(CONFIG.firebase);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// ===== VARIÁVEIS GLOBAIS =====
let currentUser = null;
let currentUserData = null;
let currentSection = 'feed';
let challengeTimer = null;
let challengeTimeLeft = 0;

// ===== SISTEMA DE AUTENTICAÇÃO =====
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.getElementById('userType').value;
    
    if (!email || !password) {
        showToast('Preencha todos os campos!', 'error');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            loadUserData(currentUser.uid);
            showToast('Login realizado com sucesso!', 'success');
        })
        .catch((error) => {
            showToast('Erro: ' + error.message, 'error');
        });
}

function register() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.getElementById('userType').value;
    
    if (!email || !password) {
        showToast('Preencha todos os campos!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            
            // Criar perfil do usuário
            db.collection('users').doc(currentUser.uid).set({
                email: email,
                type: userType,
                name: email.split('@')[0],
                points: 0,
                level: 1,
                badges: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Privilégios por tipo
                permissions: getUserPermissions(userType)
            });
            
            showToast('Cadastro realizado!', 'success');
            loadUserData(currentUser.uid);
        })
        .catch((error) => {
            showToast('Erro: ' + error.message, 'error');
        });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            currentUser = result.user;
            
            // Verificar se é primeiro login
            db.collection('users').doc(currentUser.uid).get()
                .then((doc) => {
                    if (!doc.exists) {
                        db.collection('users').doc(currentUser.uid).set({
                            email: currentUser.email,
                            type: 'student',
                            name: currentUser.displayName || currentUser.email.split('@')[0],
                            points: 0,
                            level: 1,
                            badges: [],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            permissions: getUserPermissions('student')
                        });
                    }
                    loadUserData(currentUser.uid);
                });
        })
        .catch((error) => {
            showToast('Erro Google: ' + error.message, 'error');
        });
}

function logout() {
    auth.signOut();
    currentUser = null;
    currentUserData = null;
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('mainScreen').classList.remove('active');
}

// ===== SISTEMA DE PERMISSÕES =====
function getUserPermissions(type) {
    const permissions = {
        student: {
            canPost: true,
            canComment: true,
            canDeleteOwnPosts: true,
            canAccessJarvis: true,
            canParticipateChallenges: true,
            adminLevel: 0
        },
        teacher: {
            canPost: true,
            canComment: true,
            canDeleteAnyPost: false,
            canAccessJarvis: true,
            canCreateActivities: true,
            canValidateAnswers: true,
            adminLevel: 0,
            specialBadge: CONFIG.images.seloProfessor
        },
        quizzer: {
            canPost: true,
            canComment: true,
            canCreateChallenges: true,
            canAccessJarvis: true,
            adminLevel: 0,
            specialBadge: CONFIG.images.seloQuizzer
        },
        admin: {
            canPost: true,
            canComment: true,
            canDeleteAnyPost: true,
            canManageUsers: true,
            canCreateChallenges: true,
            canAccessJarvis: true,
            adminLevel: 4, // Nível máximo
            specialBadge: CONFIG.images.seloAdmin
        }
    };
    
    return permissions[type] || permissions.student;
}

// Níveis de Admin
const ADMIN_LEVELS = {
    1: "Moderador Básico - Apenas deleta posts",
    2: "Moderador Avançado - Deleta posts e comentários",
    3: "Super Moderador - Moderação + Gerenciar usuários",
    4: "Administrador Master - Acesso total"
};

// ===== CARREGAR DADOS DO USUÁRIO =====
function loadUserData(uid) {
    db.collection('users').doc(uid).onSnapshot((doc) => {
        if (doc.exists) {
            currentUserData = doc.data();
            currentUserData.id = uid;
            
            // Atualizar interface
            document.getElementById('userNameDisplay').textContent = currentUserData.name;
            document.getElementById('userPoints').textContent = `⭐ ${currentUserData.points || 0}`;
            
            // Carregar badges
            loadUserBadges();
            
            // Mostrar portal principal
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('mainScreen').classList.add('active');
            
            // Carregar seção inicial
            showSection('feed');
            loadPosts();
            
            // Verificar privilégios especiais
            checkSpecialPermissions();
        }
    });
}

function loadUserBadges() {
    const badgesContainer = document.getElementById('userBadges');
    badgesContainer.innerHTML = '';
    
    if (currentUserData.badges) {
        currentUserData.badges.forEach(badge => {
            const img = document.createElement('img');
            img.src = badge;
            img.className = 'badge';
            img.title = 'Conquista';
            badgesContainer.appendChild(img);
        });
    }
    
    // Badge especial por tipo
    if (currentUserData.permissions?.specialBadge) {
        const img = document.createElement('img');
        img.src = currentUserData.permissions.specialBadge;
        img.className = 'badge';
        img.title = currentUserData.type.toUpperCase();
        badgesContainer.appendChild(img);
    }
}

function checkSpecialPermissions() {
    if (currentUserData.type === 'admin') {
        const adminBtn = document.createElement('button');
        adminBtn.className = 'nav-btn';
        adminBtn.textContent = '👑 Admin';
        adminBtn.onclick = () => window.open('painel.html', '_blank');
        document.querySelector('.main-nav').appendChild(adminBtn);
    }
}

// ===== NAVEGAÇÃO =====
function showSection(section) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Mostrar seção selecionada
    const sectionMap = {
        'feed': 'feedSection',
        'jarvis': 'jarvisSection',
        'challenges': 'challengesSection',
        'studies': 'studiesSection',
        'agenda': 'agendaSection',
        'leaderboard': 'leaderboardSection'
    };
    
    if (sectionMap[section]) {
        document.getElementById(sectionMap[section]).style.display = 'block';
        currentSection = section;
    }
    
    // Atualizar botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event?.target?.classList.add('active');
    
    // Carregar conteúdo da seção
    switch(section) {
        case 'feed': loadPosts(); break;
        case 'challenges': loadChallenge(); break;
        case 'leaderboard': loadLeaderboard(); break;
        case 'agenda': loadAgenda(); break;
        case 'studies': loadStudies(); break;
    }
}

// ===== SISTEMA DE POSTS =====
function previewPostImage() {
    const file = document.getElementById('postImage').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.apis.imgbb}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        return data.data.url;
    } catch (error) {
        console.error('Erro upload:', error);
        return null;
    }
}

async function createPost() {
    if (!currentUser || !currentUserData.permissions.canPost) {
        showToast('Você não tem permissão para postar!', 'error');
        return;
    }
    
    const content = document.getElementById('postContent').value;
    const subject = document.getElementById('postSubject').value;
    const imageFile = document.getElementById('postImage').files[0];
    
    if (!content && !imageFile) {
        showToast('Escreva algo ou adicione uma imagem!', 'warning');
        return;
    }
    
    let imageUrl = '';
    if (imageFile) {
        showToast('Enviando imagem...', 'warning');
        imageUrl = await uploadImage(imageFile);
    }
    
    const post = {
        content: content,
        imageUrl: imageUrl,
        subject: subject,
        authorId: currentUser.uid,
        authorName: currentUserData.name,
        authorType: currentUserData.type,
        likes: [],
        comments: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        verified: currentUserData.type === 'teacher' || currentUserData.type === 'admin'
    };
    
    await db.collection('posts').add(post);
    
    // Limpar formulário
    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    
    // Adicionar pontos
    addPoints(5);
    
    showToast('Post publicado!', 'success');
    loadPosts();
}

function addPoints(points) {
    if (currentUserData) {
        const newPoints = (currentUserData.points || 0) + points;
        db.collection('users').doc(currentUser.uid).update({
            points: newPoints
        });
    }
}

function loadPosts() {
    if (!currentUser) return;
    
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const postsContainer = document.getElementById('postsContainer');
            postsContainer.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const post = doc.data();
                post.id = doc.id;
                
                const postCard = createPostCard(post);
                postsContainer.appendChild(postCard);
            });
        });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    const time = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Agora';
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${post.authorName[0].toUpperCase()}</div>
            <div>
                <strong>${post.authorName}</strong>
                ${post.authorType === 'teacher' ? `<img src="${CONFIG.images.seloVerificado}" style="width: 20px; vertical-align: middle;" title="Professor Verificado">` : ''}
                ${post.authorType === 'admin' ? `<img src="${CONFIG.images.seloAdmin}" style="width: 20px; vertical-align: middle;" title="Admin">` : ''}
                <br><small style="color: #888;">${time} ${post.subject ? '• ' + post.subject : ''} ${post.verified ? '✓ Verificado' : ''}</small>
            </div>
        </div>
        
        ${post.content ? `<p style="margin: 15px 0;">${post.content}</p>` : ''}
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" alt="Post image">` : ''}
        
        <div class="post-actions">
            <button onclick="likePost('${post.id}')" class="action-btn">
                ❤️ ${post.likes ? post.likes.length : 0}
            </button>
            <button onclick="commentPost('${post.id}')" class="action-btn">
                💬 ${post.comments ? post.comments.length : 0}
            </button>
            ${currentUserData.permissions.canDeleteAnyPost || post.authorId === currentUser.uid ? 
                `<button onclick="deletePost('${post.id}')" class="action-btn btn-danger">🗑️ Deletar</button>` : ''}
        </div>
        
        <div id="comments-${post.id}" style="margin-top: 15px;">
            ${post.comments ? post.comments.slice(0, 3).map(comment => 
                `<div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 5px 0;">
                    <strong>${comment.authorName}:</strong> ${comment.text}
                </div>`
            ).join('') : ''}
        </div>
    `;
    
    return card;
}

async function likePost(postId) {
    if (!currentUser) return;
    
    const postRef = db.collection('posts').doc(postId);
    const post = await postRef.get();
    const likes = post.data().likes || [];
    
    if (likes.includes(currentUser.uid)) {
        await postRef.update({
            likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        });
    } else {
        await postRef.update({
            likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
    }
}

async function commentPost(postId) {
    if (!currentUser) return;
    
    const comment = prompt('Digite seu comentário:');
    if (!comment) return;
    
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion({
            authorId: currentUser.uid,
            authorName: currentUserData.name,
            text: comment,
            createdAt: new Date().toISOString()
        })
    });
    
    addPoints(2);
    showToast('Comentário adicionado!', 'success');
}

async function deletePost(postId) {
    if (!currentUser) return;
    
    const post = await db.collection('posts').doc(postId).get();
    const postData = post.data();
    
    // Verificar permissão
    if (currentUserData.permissions.canDeleteAnyPost || postData.authorId === currentUser.uid) {
        if (confirm('Tem certeza que deseja deletar este post?')) {
            await db.collection('posts').doc(postId).delete();
            showToast('Post deletado!', 'success');
        }
    } else {
        showToast('Você não tem permissão!', 'error');
    }
}

// ===== JARVIS IA =====
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addChatMessage(message, 'user');
    input.value = '';
    
    // Mostrar typing
    const typingDiv = addChatMessage('Jarvis está pensando...', 'jarvis typing');
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.apis.groq}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é o Jarvis, assistente educacional do Sexta-feira Studies. Seja amigável, didático e incentive os estudos. Use emojis e formatação para deixar as respostas mais atrativas.'
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        
        // Remover typing
        typingDiv.remove();
        
        // Adicionar resposta
        if (data.choices && data.choices[0]) {
            addChatMessage(data.choices[0].message.content, 'jarvis');
            addPoints(3); // Pontos por usar o Jarvis
        }
    } catch (error) {
        typingDiv.remove();
        addChatMessage('Desculpe, ocorreu um erro. Tente novamente!', 'jarvis error');
    }
}

async function sendImageToJarvis() {
    const file = document.getElementById('chatImageInput').files[0];
    if (!file) return;
    
    const imageUrl = await uploadImage(file);
    if (!imageUrl) return;
    
    addChatMessage('Analisando imagem...', 'user');
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${CONFIG.apis.gemini}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analise esta imagem em contexto educacional. O que você vê? Pode explicar o conteúdo?" },
                        { inline_data: { mime_type: "image/jpeg", data: imageUrl } }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            addChatMessage(data.candidates[0].content.parts[0].text, 'jarvis');
        }
    } catch (error) {
        addChatMessage('Erro ao analisar imagem.', 'jarvis error');
    }
}

function askJarvis(question) {
    document.getElementById('chatInput').value = question;
    showSection('jarvis');
    sendMessage();
}

function addChatMessage(text, type) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${type === 'jarvis' ? '🤖 ' : ''}${text}
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageDiv;
}

// ===== SISTEMA DE DESAFIOS =====
function loadChallenge() {
    const challengesRef = db.collection('challenges')
        .where('active', '==', true)
        .limit(1);
    
    challengesRef.onSnapshot((snapshot) => {
        if (snapshot.empty) {
            document.getElementById('activeChallenge').innerHTML = 
                '<h3>📭 Nenhum desafio ativo no momento</h3><p>Volte mais tarde!</p>';
            return;
        }
        
        const challenge = snapshot.docs[0].data();
        challenge.id = snapshot.docs[0].id;
        
        displayChallenge(challenge);
    });
}

function displayChallenge(challenge) {
    const container = document.getElementById('challengeInfo');
    container.innerHTML = `
        <h2>${challenge.title}</h2>
        <p>${challenge.description}</p>
        <p><strong>Matéria:</strong> ${challenge.subject}</p>
        <p><strong>Prêmio:</strong> 🥇 ${challenge.rewards?.first || 100} pontos | 🥈 ${challenge.rewards?.second || 50} pontos | 🥉 ${challenge.rewards?.third || 25} pontos</p>
    `;
    
    // Carregar questões
    const questionsDiv = document.getElementById('challengeQuestions');
    questionsDiv.innerHTML = '';
    
    if (challenge.questions) {
        challenge.questions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.innerHTML = `
                <h3>Questão ${index + 1}</h3>
                <p>${q.question}</p>
                <div class="options">
                    ${q.options.map((opt, i) => `
                        <div class="option" onclick="selectOption(${index}, ${i})">
                            ${String.fromCharCode(65 + i)}) ${opt}
                        </div>
                    `).join('')}
                </div>
            `;
            questionsDiv.appendChild(questionCard);
        });
    }
    
    // Iniciar timer
    startChallengeTimer(challenge.duration || 300);
}

function startChallengeTimer(duration) {
    challengeTimeLeft = duration;
    updateTimerDisplay();
    
    if (challengeTimer) clearInterval(challengeTimer);
    
    challengeTimer = setInterval(() => {
        challengeTimeLeft--;
        updateTimerDisplay();
        
        if (challengeTimeLeft <= 0) {
            clearInterval(challengeTimer);
            submitChallenge();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(challengeTimeLeft / 60);
    const seconds = challengeTimeLeft % 60;
    document.getElementById('challengeTimer').textContent = 
        `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

let selectedAnswers = {};

function selectOption(questionIndex, optionIndex) {
    selectedAnswers[questionIndex] = optionIndex;
    
    // Visual feedback
    const options = document.querySelectorAll(`.question-card:nth-child(${questionIndex + 1}) .option`);
    options.forEach((opt, i) => {
        opt.classList.toggle('selected', i === optionIndex);
    });
}

async function submitChallenge() {
    if (challengeTimer) clearInterval(challengeTimer);
    
    // Calcular pontuação (simulado - professor/quizzer valida depois)
    const score = Object.keys(selectedAnswers).length * 10;
    
    // Salvar resultado
    await db.collection('challengeResults').add({
        userId: currentUser.uid,
        userName: currentUserData.name,
        score: score,
        answers: selectedAnswers,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    addPoints(score);
    
    // Mostrar resultado
    document.getElementById('activeChallenge').style.display = 'none';
    document.getElementById('challengeResults').style.display = 'block';
    document.getElementById('resultScore').textContent = `${score} pontos`;
    document.getElementById('resultReward').innerHTML = '🏆 Resultado registrado! Aguardando validação.';
    
    showToast('Desafio concluído!', 'success');
}

// ===== ESTUDOS =====
async function generateActivity() {
    const topic = document.getElementById('activityTopic').value;
    const numQuestions = document.getElementById('activityQuestions').value;
    const type = document.getElementById('activityType').value;
    
    if (!topic) {
        showToast('Digite o assunto!', 'warning');
        return;
    }
    
    showToast('Gerando atividade com IA...', 'warning');
    
    const prompt = `Crie ${numQuestions} questões de ${topic} do tipo ${type}. 
    Formato JSON:
    {
        "questions": [
            {
                "question": "...",
                "options": ["...", "...", "...", "..."],
                "correctAnswer": 0,
                "explanation": "..."
            }
        ]
    }`;
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.apis.groq}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        });
        
        const data = await response.json();
        const activity = JSON.parse(data.choices[0].message.content);
        
        displayActivity(activity);
        showToast('Atividade gerada!', 'success');
    } catch (error) {
        showToast('Erro ao gerar atividade.', 'error');
    }
}

function displayActivity(activity) {
    const container = document.getElementById('generatedActivity');
    container.innerHTML = '<h3>✨ Atividade Gerada</h3>';
    
    activity.questions.forEach((q, i) => {
        container.innerHTML += `
            <div class="question-card" style="margin: 15px 0;">
                <p><strong>${i + 1}. ${q.question}</strong></p>
                ${q.options.map((opt, j) => 
                    `<p style="margin-left: 20px;">${String.fromCharCode(97 + j)}) ${opt}</p>`
                ).join('')}
                <details style="margin-top: 10px;">
                    <summary style="color: #6C5CE7; cursor: pointer;">Ver resposta</summary>
                    <p style="background: #e8f5e9; padding: 10px; border-radius: 5px;">
                        ✅ Resposta: ${String.fromCharCode(97 + q.correctAnswer)}
                        <br>${q.explanation}
                    </p>
                </details>
            </div>
        `;
    });
}

// ===== AGENDA =====
function addAgendaEvent() {
    const date = document.getElementById('agendaDate').value;
    const event = document.getElementById('agendaEvent').value;
    
    if (!date || !event) {
        showToast('Preencha todos os campos!', 'warning');
        return;
    }
    
    db.collection('agenda').add({
        userId: currentUser.uid,
        date: date,
        event: event,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    document.getElementById('agendaEvent').value = '';
    showToast('Evento adicionado!', 'success');
    loadAgenda();
}

function loadAgenda() {
    if (!currentUser) return;
    
    db.collection('agenda')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'asc')
        .onSnapshot((snapshot) => {
            const list = document.getElementById('agendaList');
            list.innerHTML = '<h3>📅 Seus Eventos</h3>';
            
            snapshot.forEach(doc => {
                const event = doc.data();
                list.innerHTML += `
                    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #6C5CE7;">
                        <strong>${event.date}</strong>
                        <p>${event.event}</p>
                    </div>
                `;
            });
        });
}

// ===== LEADERBOARD =====
function loadLeaderboard() {
    db.collection('users')
        .orderBy('points', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            const list = document.getElementById('leaderboardList');
            list.innerHTML = '';
            
            snapshot.forEach((doc, index) => {
                const user = doc.data();
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                
                list.innerHTML += `
                    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2em;">${medal}</span>
                        <div>
                            <strong>${user.name}</strong>
                            <br><small>${user.type} • ⭐ ${user.points} pontos</small>
                        </div>
                    </div>
                `;
            });
        });
}

// ===== UTILITÁRIOS =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== INICIALIZAÇÃO =====
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserData(user.uid);
    } else {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('mainScreen').classList.remove('active');
    }
});
