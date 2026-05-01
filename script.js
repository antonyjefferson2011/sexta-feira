// ================= FIREBASE =================
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

const GROQ_KEY = "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";
const IMGBB_KEY = "86427cccd2a94fb42a0754ffd7f19e79";

let currentUser = null;

// ================= UTIL =================
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function htmlEsc(str) {
  return str ? str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[m]) : "";
}

// ================= AUTH =================
async function doLogin() {
  const username = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-senha').value;

  if (!username || !password) return showToast('Preencha todos os campos');

  try {
    const snap = await db.ref('usuarios')
      .orderByChild('username')
      .equalTo(username)
      .get();

    if (!snap.exists()) return showToast('Usuário não encontrado');

    const user = Object.values(snap.val())[0];

    await auth.signInWithEmailAndPassword(user.email, password);

    showToast('Login realizado!');
  } catch (e) {
    showToast('Erro: ' + e.message);
  }
}

async function doCadastro() {
  const nome = document.getElementById("cadastro-nome").value.trim();
  const username = document.getElementById("cadastro-usuario").value.trim();
  const email = document.getElementById("cadastro-email").value.trim();
  const senha = document.getElementById("cadastro-senha").value;

  if (!nome || !username || !email || !senha) {
    return showToast("Preencha tudo");
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, senha);

    await db.ref("usuarios/" + cred.user.uid).set({
      uid: cred.user.uid,
      fullname: nome,
      username,
      email,
      password: senha,
      points: 0,
      avatar: "",
      bio: "",
      createdAt: Date.now()
    });

    showToast("Conta criada!");
  } catch (e) {
    showToast(e.message);
  }
}

// ================= NAV =================
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById("screen-" + name);
  if (el) el.classList.add("active");
}

function navigate(page) {
  document.querySelectorAll(".content").forEach(c => c.classList.remove("active"));
  const el = document.getElementById("content-" + page);
  if (el) el.classList.add("active");

  history.pushState({ page }, "", "#" + page);
}

window.onpopstate = function (e) {
  if (e.state && e.state.page) {
    navigate(e.state.page);
  } else {
    navigate("home");
  }
};

// ================= HOME =================
async function renderHome() {
  const el = document.getElementById("content-home");
  if (!el) return;

  el.innerHTML = "<p>Carregando...</p>";

  try {
    const snap = await db.ref("posts").limitToLast(20).get();

    if (!snap.exists()) {
      el.innerHTML = "<p>Nenhum post ainda</p>";
      return;
    }

    el.innerHTML = "";

    Object.entries(snap.val()).reverse().forEach(([id, p]) => {
      el.innerHTML += renderPostCard(id, p);
    });

  } catch {
    el.innerHTML = "Erro ao carregar";
  }
}

function renderPostCard(id, p) {
  return `
  <div class="post">
    <b>${htmlEsc(p.autorNome)}</b>
    <p>${htmlEsc(p.texto)}</p>
    <button onclick="toggleLike('${id}')">❤️ ${p.likes || 0}</button>
  </div>
  `;
}

// ================= POSTS =================
async function criarPost() {
  const txt = prompt("Digite seu post:");
  if (!txt) return;

  try {
    const ref = db.ref("posts").push();

    await ref.set({
      texto: txt,
      autorId: currentUser.uid,
      autorNome: currentUser.fullname,
      likes: 0,
      createdAt: Date.now()
    });

    showToast("Post criado!");
    renderHome();

  } catch {
    showToast("Erro ao postar");
  }
}

async function toggleLike(id) {
  const ref = db.ref("posts/" + id + "/likes");
  const snap = await ref.get();
  let val = snap.val() || 0;
  await ref.set(val + 1);
  renderHome();
}

// ================= DISCIPLINAS =================
async function renderDisciplinas() {
  const el = document.getElementById("content-disciplinas");
  if (!el) return;

  el.innerHTML = "Carregando...";

  const snap = await db.ref("materias").get();

  if (!snap.exists()) return el.innerHTML = "Sem matérias";

  el.innerHTML = "";

  Object.values(snap.val()).forEach(m => {
    el.innerHTML += `<div>${m.nome}</div>`;
  });
}

async function criarDisciplina() {
  const nome = prompt("Nome da disciplina");
  if (!nome) return;

  const ref = db.ref("materias").push();

  await ref.set({
    nome,
    descricao: "",
    autorId: currentUser.uid
  });

  showToast("Criada!");
  renderDisciplinas();
}

// ================= RANKING =================
async function renderRanking() {
  const el = document.getElementById("content-ranking");
  if (!el) return;

  const snap = await db.ref("usuarios").orderByChild("points").limitToLast(50).get();

  if (!snap.exists()) return el.innerHTML = "Sem ranking";

  const arr = Object.values(snap.val()).sort((a, b) => b.points - a.points);

  el.innerHTML = "";

  arr.forEach((u, i) => {
    el.innerHTML += `<p>#${i + 1} ${u.fullname} - ${u.points}</p>`;
  });
}

// ================= DESAFIOS =================
async function renderDesafios() {
  const el = document.getElementById("content-desafios");
  if (!el) return;

  const snap = await db.ref("desafios").get();

  if (!snap.exists()) return el.innerHTML = "Sem desafios";

  el.innerHTML = "";

  Object.values(snap.val()).forEach(d => {
    el.innerHTML += `<div>${d.titulo} - ${d.premio}</div>`;
  });
}

// ================= JARVIS =================
async function sendJarvis() {
  const input = document.getElementById("jarvis-texto");
  if (!input) return;

  const msg = input.value;
  if (!msg) return;

  addJarvisMsg("user", msg);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + GROQ_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: msg }]
      })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    addJarvisMsg("bot", reply);

  } catch {
    addJarvisMsg("bot", "Erro na IA");
  }
}

function addJarvisMsg(role, text) {
  const box = document.getElementById("jarvis-mensagens");
  if (!box) return;

  box.innerHTML += `<div class="${role}">${htmlEsc(text)}</div>`;
}

// ================= PERFIL =================
async function renderPerfil(uid) {
  const el = document.getElementById("content-perfil");
  if (!el) return;

  const snap = await db.ref("usuarios/" + uid).get();

  if (!snap.exists()) return el.innerHTML = "Usuário não encontrado";

  const u = snap.val();

  el.innerHTML = `
    <h2>${u.fullname}</h2>
    <p>@${u.username}</p>
    <p>${u.bio || ""}</p>
  `;
}

// ================= NOTIF =================
function listenNotificacoes() {
  if (!currentUser) return;

  db.ref("notificacoes/" + currentUser.uid)
    .on("value", snap => {
      const el = document.getElementById("notif-badge");
      if (!el) return;

      if (!snap.exists()) return el.innerText = "";

      el.innerText = Object.keys(snap.val()).length;
    });
}

// ================= ADMIN =================
function admLogin() {
  const senha = document.getElementById("adm-senha").value;

  if (senha === "admin123") {
    document.getElementById("adm-panel").classList.remove("hidden");
    showToast("Acesso liberado");
  } else {
    showToast("Senha errada");
  }
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(async user => {
  if (user) {
    const snap = await db.ref("usuarios/" + user.uid).get();
    currentUser = snap.val();

    showScreen("app");
    renderHome();
    listenNotificacoes();
  } else {
    showScreen("login");
  }
});
