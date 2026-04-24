// ====== DADOS ======
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let userName = localStorage.getItem("userName") || "";

// ====== NAVEGAÇÃO ======
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");
}

// ====== TEMA ======
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// ====== NOME ======
function confirmName() {
  const input = document.getElementById("nameInput");
  if (!input.value.trim()) return;

  userName = input.value;
  localStorage.setItem("userName", userName);
  document.getElementById("modalName").classList.remove("open");
}

// ====== MODAIS ======
function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ====== MATÉRIAS ======
function openCreateSubject() {
  if (!userName) {
    document.getElementById("modalName").classList.add("open");
    return;
  }
  openModal("modalSubject");
}

function saveSubject() {
  const name = document.getElementById("subjectName").value;

  if (!name) return alert("Coloque um nome");

  const subject = {
    id: Date.now(),
    name,
    topics: [],
    quizzes: [],
    author: userName
  };

  subjects.push(subject);
  localStorage.setItem("subjects", JSON.stringify(subjects));

  closeModal("modalSubject");
  renderSubjects();
}

// ====== LISTAR MATÉRIAS ======
function renderSubjects() {
  const grid = document.getElementById("subjectsGrid");
  grid.innerHTML = "";

  subjects.forEach(sub => {
    const div = document.createElement("div");
    div.className = "subject-card";
    div.innerHTML = `
      <h3>${sub.name}</h3>
      <p>Criado por: ${sub.author}</p>
      <button onclick="openSubject(${sub.id})">Abrir</button>
    `;
    grid.appendChild(div);
  });
}

// ====== ABRIR MATÉRIA ======
let currentSubject = null;

function openSubject(id) {
  currentSubject = subjects.find(s => s.id === id);
  document.getElementById("detailName").innerText = currentSubject.name;
  showPage("subject-detail");
  renderTopics();
  renderQuizzes();
}

// ====== TÓPICOS ======
function openCreateTopic() {
  if (!userName) {
    document.getElementById("modalName").classList.add("open");
    return;
  }
  openModal("modalTopic");
}

function saveTopic() {
  const title = document.getElementById("topicTitle").value;
  const content = document.getElementById("topicContent").innerHTML;

  if (!title || !content) return alert("Preencha tudo");

  currentSubject.topics.push({
    title,
    content,
    author: userName
  });

  localStorage.setItem("subjects", JSON.stringify(subjects));
  closeModal("modalTopic");
  renderTopics();
}

function renderTopics() {
  const list = document.getElementById("topicsList");
  list.innerHTML = "";

  currentSubject.topics.forEach(t => {
    const div = document.createElement("div");
    div.className = "topic-card";
    div.innerHTML = `
      <h4>${t.title}</h4>
      <p>Criado por: ${t.author}</p>
      <button onclick="viewTopic('${t.title}')">Ver</button>
    `;
    list.appendChild(div);
  });
}

function viewTopic(title) {
  const t = currentSubject.topics.find(x => x.title === title);
  document.getElementById("viewTopicTitle").innerText = t.title;
  document.getElementById("viewTopicContent").innerHTML = t.content;
  document.getElementById("viewTopicAuthor").innerText = "Criado por: " + t.author;
  openModal("modalViewTopic");
}

// ====== QUIZ ======
let quizQuestions = [];

function openCreateQuiz() {
  if (!userName) {
    document.getElementById("modalName").classList.add("open");
    return;
  }
  quizQuestions = [];
  document.getElementById("quizQuestionsContainer").innerHTML = "";
  openModal("modalQuiz");
}

function addQuestion() {
  const container = document.getElementById("quizQuestionsContainer");

  const div = document.createElement("div");
  div.innerHTML = `
    <input placeholder="Pergunta"><br>
    <input placeholder="A"><br>
    <input placeholder="B"><br>
    <input placeholder="C"><br>
    <input placeholder="D"><br>
    <input placeholder="Resposta correta (0-3)">
    <hr>
  `;
  container.appendChild(div);
}

function saveQuiz() {
  const title = document.getElementById("quizTitle").value;

  currentSubject.quizzes.push({
    title,
    author: userName,
    questions: []
  });

  localStorage.setItem("subjects", JSON.stringify(subjects));
  closeModal("modalQuiz");
  renderQuizzes();
}

function renderQuizzes() {
  const list = document.getElementById("quizzesList");
  list.innerHTML = "";

  currentSubject.quizzes.forEach(q => {
    const div = document.createElement("div");
    div.className = "quiz-card";
    div.innerHTML = `
      <h3>${q.title}</h3>
      <p>Criado por: ${q.author}</p>
    `;
    list.appendChild(div);
  });
}

// ====== INICIALIZAÇÃO ======
window.onload = () => {
  renderSubjects();

  const theme = localStorage.getItem("theme");
  if (theme) document.documentElement.setAttribute("data-theme", theme);

  if (userName) {
    document.getElementById("navName").innerText = userName;
    document.getElementById("navAvatar").innerText = userName[0].toUpperCase();
  }
};
