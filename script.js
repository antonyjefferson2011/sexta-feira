/* ═══════════════════════════════════════════════════
   SEXTA-FEIRA STUDIES — app.js
   Lógica completa: matérias, tópicos, quizzes, perfil
═══════════════════════════════════════════════════ */

// ── ESTADO GLOBAL ──────────────────────────────────
let state = {
  currentSubjectId: null,
  currentQuiz: null,
  quizAnswers: [],
  quizCurrent: 0,
  editingTopicId: null,
  editingSubjectId: null,
  selectedEmoji: '📚',
  selectedColor: '#5b7fff',
  questionCount: 0,
};

// ── DADOS PADRÃO ────────────────────────────────────
const DEFAULT_SUBJECTS = [
  {
    id: 'hist',
    name: 'História',
    desc: 'Linha do tempo, civilizações e eventos históricos',
    emoji: '🏛️',
    color: '#ff9f43',
    isDefault: true,
    topics: [
      {
        id: 'h1', title: 'Introdução à História',
        content: '<b>O que é História?</b><br>História é a ciência que estuda o passado da humanidade. Ela nos ajuda a entender como chegamos ao presente e como podemos construir o futuro.<br><br><b>Fontes históricas:</b><br><ul><li>Documentos escritos</li><li>Monumentos e artefatos</li><li>Tradições orais</li><li>Fotografias e vídeos</li></ul>'
      }
    ],
    quizzes: []
  },
  {
    id: 'mat',
    name: 'Matemática',
    desc: 'Números, geometria, álgebra e muito mais',
    emoji: '📐',
    color: '#5b7fff',
    isDefault: true,
    topics: [
      {
        id: 'm1', title: 'Equações do 1º Grau',
        content: '<b>Forma geral:</b> ax + b = 0<br><br>Para resolver, isole o x:<br>ax = -b → x = -b/a<br><br><b>Exemplo:</b><br>2x + 6 = 0<br>2x = -6<br>x = -3'
      }
    ],
    quizzes: []
  },
  {
    id: 'port',
    name: 'Português',
    desc: 'Gramática, literatura e interpretação de texto',
    emoji: '📖',
    color: '#3ecf8e',
    isDefault: true,
    topics: [
      {
        id: 'p1', title: 'Classes de Palavras',
        content: '<b>As 10 classes gramaticais:</b><br><br>1. Substantivo – nomeia seres<br>2. Adjetivo – qualifica substantivos<br>3. Verbo – indica ação, estado ou fenômeno<br>4. Advérbio – modifica verbo, adjetivo ou advérbio<br>5. Pronome – substitui o substantivo<br>6. Artigo – acompanha o substantivo<br>7. Numeral – indica quantidade<br>8. Preposição – liga palavras<br>9. Conjunção – liga orações<br>10. Interjeição – expressa emoção'
      }
    ],
    quizzes: []
  },
  {
    id: 'cien',
    name: 'Ciências',
    desc: 'Biologia, física, química e ciências naturais',
    emoji: '🔬',
    color: '#ff5b7c',
    isDefault: true,
    topics: [
      {
        id: 'c1', title: 'Células',
        content: '<b>O que é célula?</b><br>A célula é a unidade básica da vida. Todos os seres vivos são formados por células.<br><br><b>Tipos:</b><br>• <b>Procariótica</b> – sem núcleo definido (bactérias)<br>• <b>Eucariótica</b> – com núcleo definido (animais, plantas, fungos)<br><br><b>Organelas principais:</b><br>• Núcleo – controla a célula<br>• Mitocôndria – produz energia<br>• Ribossomo – sintetiza proteínas<br>• Membrana plasmática – controla entrada/saída'
      }
    ],
    quizzes: []
  }
];

const EMOJIS = ['📚','📖','✏️','🔬','📐','🏛️','🌍','💡','🧪','🎨','🎵','⚽','🧮','📝','🗺️','🌿','🔭','📊','💻','🏆'];

const COLORS = [
  '#5b7fff','#7c5bff','#3ecf8e','#ff5b7c','#ff9f43',
  '#f7c59f','#00d2d3','#ff6b6b','#54a0ff','#5f27cd',
  '#48dbfb','#ffd32a','#0be881','#f53b57','#3c40c4'
];

// ── LOCAL STORAGE ───────────────────────────────────
function getSubjects() {
  const saved = localStorage.getItem('sfs_subjects');
  if (!saved) {
    localStorage.setItem('sfs_subjects', JSON.stringify(DEFAULT_SUBJECTS));
    return JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
  }
  return JSON.parse(saved);
}

function saveSubjects(subjects) {
  localStorage.setItem('sfs_subjects', JSON.stringify(subjects));
}

function getProfile() {
  return JSON.parse(localStorage.getItem('sfs_profile') || '{}');
}

function saveProfileData(data) {
  localStorage.setItem('sfs_profile', JSON.stringify(data));
}

function getHistory() {
  return JSON.parse(localStorage.getItem('sfs_history') || '[]');
}

function addHistory(entry) {
  const h = getHistory();
  h.unshift({ ...entry, date: new Date().toISOString() });
  if (h.length > 50) h.pop();
  localStorage.setItem('sfs_history', JSON.stringify(h));
}

function getTheme() {
  return localStorage.getItem('sfs_theme') || 'dark';
}

// ── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Tema
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';

  // Perfil
  const profile = getProfile();
  if (profile.name) {
    updateNavProfile(profile.name);
    closeModal('profileModal');
    showPage('home');
  } else {
    document.getElementById('profileModal').classList.add('active');
    document.getElementById('profileNameInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') saveProfile();
    });
  }

  // Preencher pickers
  buildEmojiPicker();
  buildColorPicker();

  updateStats();
  renderQuickGrid();
});

// ── PERFIL ───────────────────────────────────────────
function saveProfile() {
  const name = document.getElementById('profileNameInput').value.trim();
  if (!name) { showToast('Digite seu nome!'); return; }
  saveProfileData({ name });
  updateNavProfile(name);
  closeModal('profileModal');
  showPage('home');
}

function updateNavProfile(name) {
  document.getElementById('navName').textContent = name;
  document.getElementById('navAvatar').textContent = name[0].toUpperCase();
}

function openProfileEdit() {
  const profile = getProfile();
  document.getElementById('profileNameInput').value = profile.name || '';
  document.getElementById('profileModal').classList.add('active');
}

// ── TEMA ─────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sfs_theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── NAVEGAÇÃO ────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');

  // Atualizar nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-nav'));

  if (id === 'home')      { updateStats(); renderQuickGrid(); }
  if (id === 'subjects')  renderSubjects();
  if (id === 'myStudies') renderMyStudies();
}

// ── STATS HERO ───────────────────────────────────────
function updateStats() {
  const subs = getSubjects();
  let topics = 0, quizzes = 0;
  subs.forEach(s => { topics += s.topics.length; quizzes += s.quizzes.length; });
  document.getElementById('statSubjects').textContent = subs.length;
  document.getElementById('statTopics').textContent = topics;
  document.getElementById('statQuizzes').textContent = quizzes;
}

// ── QUICK GRID (home) ────────────────────────────────
function renderQuickGrid() {
  const grid = document.getElementById('quickGrid');
  const subs = getSubjects();
  if (!subs.length) {
    grid.innerHTML = '<p style="color:var(--text2);font-size:14px">Nenhuma matéria ainda. Crie a primeira!</p>';
    return;
  }
  grid.innerHTML = subs.map(s => `
    <div class="quick-card" onclick="openSubjectDetail('${s.id}')">
      <div class="card-emoji">${s.emoji}</div>
      <div>
        <h4>${esc(s.name)}</h4>
        <p>${s.topics.length} tópico${s.topics.length !== 1 ? 's' : ''} · ${s.quizzes.length} quiz${s.quizzes.length !== 1 ? 'zes' : ''}</p>
      </div>
    </div>
  `).join('');
}

// ── RENDER MATÉRIAS ──────────────────────────────────
function renderSubjects() {
  const grid = document.getElementById('subjectsGrid');
  const subs = getSubjects();

  if (!subs.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📭</div>
      <h3>Nenhuma matéria</h3>
      <p>Crie sua primeira matéria para começar!</p>
      <button class="btn-primary" onclick="openCreateSubject()">+ Criar matéria</button>
    </div>`;
    return;
  }

  grid.innerHTML = subs.map(s => {
    const colorStyle = `linear-gradient(90deg,${s.color},${s.color}88)`;
    return `
    <div class="subject-card" style="--card-color:${colorStyle}" onclick="openSubjectDetail('${s.id}')">
      <div class="card-header">
        <div class="card-emoji">${s.emoji}</div>
        <div class="card-meta">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.desc || 'Sem descrição')}</p>
        </div>
      </div>
      <div class="card-stats">
        <div class="card-stat"><strong>${s.topics.length}</strong> tópico${s.topics.length !== 1 ? 's' : ''}</div>
        <div class="card-stat"><strong>${s.quizzes.length}</strong> quiz${s.quizzes.length !== 1 ? 'zes' : ''}</div>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn-ghost" onclick="openEditSubject('${s.id}')">✏️ Editar</button>
        ${!s.isDefault ? `<button class="btn-danger" onclick="deleteSubject('${s.id}')">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── DETALHE DA MATÉRIA ───────────────────────────────
function openSubjectDetail(id) {
  state.currentSubjectId = id;
  const subs = getSubjects();
  const sub = subs.find(s => s.id === id);
  if (!sub) return;

  document.getElementById('detailSubjectName').textContent = sub.emoji + ' ' + sub.name;
  document.getElementById('detailSubjectDesc').textContent = sub.desc || 'Sem descrição';

  switchTab('topics');
  renderTopics(sub);
  renderQuizzes(sub);

  showPage('subject-detail');
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById('tab-' + tab)?.classList.add('active');
}

// ── TÓPICOS ──────────────────────────────────────────
function renderTopics(sub) {
  const list = document.getElementById('topicsList');
  if (!sub.topics.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>Nenhum tópico</h3>
      <p>Adicione seu primeiro resumo ou anotação!</p>
      <button class="btn-primary" onclick="openCreateTopic()">+ Adicionar tópico</button>
    </div>`;
    return;
  }

  list.innerHTML = sub.topics.map(t => {
    const preview = t.content.replace(/<[^>]+>/g, '').slice(0, 80) + '...';
    return `
    <div class="topic-item pop-in" onclick="viewTopic('${t.id}')">
      <div class="topic-icon">📝</div>
      <div class="topic-body">
        <h4>${esc(t.title)}</h4>
        <p>${esc(preview)}</p>
      </div>
      <div class="topic-actions" onclick="event.stopPropagation()">
        <button class="btn-ghost" style="padding:6px 10px" onclick="openEditTopic('${t.id}')">✏️</button>
        <button class="btn-danger" onclick="deleteTopic('${t.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openCreateTopic() {
  state.editingTopicId = null;
  document.getElementById('modalTopicTitle').textContent = 'Novo Tópico';
  document.getElementById('topicTitle').value = '';
  document.getElementById('topicContent').innerHTML = '';
  openModal('modalTopic');
}

function openEditTopic(tid) {
  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  const topic = sub?.topics.find(t => t.id === tid);
  if (!topic) return;

  state.editingTopicId = tid;
  document.getElementById('modalTopicTitle').textContent = 'Editar Tópico';
  document.getElementById('topicTitle').value = topic.title;
  document.getElementById('topicContent').innerHTML = topic.content;
  openModal('modalTopic');
}

function saveTopic() {
  const title   = document.getElementById('topicTitle').value.trim();
  const content = document.getElementById('topicContent').innerHTML.trim();
  if (!title)   { showToast('Digite o título do tópico!'); return; }
  if (!content) { showToast('Digite o conteúdo!'); return; }

  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  if (!sub) return;

  if (state.editingTopicId) {
    const t = sub.topics.find(t => t.id === state.editingTopicId);
    if (t) { t.title = title; t.content = content; }
  } else {
    sub.topics.push({ id: uid(), title, content });
  }

  saveSubjects(subs);
  closeModal('modalTopic');
  renderTopics(sub);
  updateStats();
  renderQuickGrid();
  showToast('Tópico salvo! ✅');
}

function deleteTopic(tid) {
  if (!confirm('Excluir este tópico?')) return;
  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  sub.topics = sub.topics.filter(t => t.id !== tid);
  saveSubjects(subs);
  renderTopics(sub);
  updateStats();
  showToast('Tópico excluído');
}

function viewTopic(tid) {
  const subs  = getSubjects();
  const sub   = subs.find(s => s.id === state.currentSubjectId);
  const topic = sub?.topics.find(t => t.id === tid);
  if (!topic) return;

  state.editingTopicId = tid;
  document.getElementById('viewTopicTitle').textContent = topic.title;
  document.getElementById('viewTopicContent').innerHTML = topic.content;
  openModal('modalViewTopic');
}

function editCurrentTopic() {
  closeModal('modalViewTopic');
  openEditTopic(state.editingTopicId);
}

function formatText(cmd) {
  document.execCommand(cmd, false, null);
  document.getElementById('topicContent').focus();
}

function insertList() {
  document.execCommand('insertUnorderedList', false, null);
  document.getElementById('topicContent').focus();
}

// ── MATÉRIAS ─────────────────────────────────────────
function openCreateSubject() {
  state.editingSubjectId = null;
  state.selectedEmoji = '📚';
  state.selectedColor = '#5b7fff';
  document.getElementById('modalSubjectTitle').textContent = 'Nova Matéria';
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectDesc').value = '';
  refreshEmojiPicker();
  refreshColorPicker();
  openModal('modalSubject');
}

function openEditSubject(id) {
  const subs = getSubjects();
  const sub  = subs.find(s => s.id === id);
  if (!sub) return;

  state.editingSubjectId = id;
  state.selectedEmoji = sub.emoji;
  state.selectedColor = sub.color;
  document.getElementById('modalSubjectTitle').textContent = 'Editar Matéria';
  document.getElementById('subjectName').value = sub.name;
  document.getElementById('subjectDesc').value = sub.desc || '';
  refreshEmojiPicker();
  refreshColorPicker();
  openModal('modalSubject');
}

function saveSubject() {
  const name = document.getElementById('subjectName').value.trim();
  const desc = document.getElementById('subjectDesc').value.trim();
  if (!name) { showToast('Digite o nome da matéria!'); return; }

  const subs = getSubjects();

  if (state.editingSubjectId) {
    const sub = subs.find(s => s.id === state.editingSubjectId);
    if (sub) {
      sub.name = name; sub.desc = desc;
      sub.emoji = state.selectedEmoji; sub.color = state.selectedColor;
    }
  } else {
    subs.push({
      id: uid(), name, desc,
      emoji: state.selectedEmoji,
      color: state.selectedColor,
      isDefault: false,
      topics: [], quizzes: []
    });
  }

  saveSubjects(subs);
  closeModal('modalSubject');
  renderSubjects();
  renderQuickGrid();
  updateStats();
  showToast(state.editingSubjectId ? 'Matéria atualizada! ✅' : 'Matéria criada! 🎉');
}

function deleteSubject(id) {
  if (!confirm('Excluir esta matéria e todo o conteúdo?')) return;
  const subs = getSubjects().filter(s => s.id !== id);
  saveSubjects(subs);
  renderSubjects();
  updateStats();
  renderQuickGrid();
  showToast('Matéria excluída');
}

// ── PICKERS ──────────────────────────────────────────
function buildEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = EMOJIS.map(e => `
    <div class="emoji-opt ${e === state.selectedEmoji ? 'selected' : ''}"
         onclick="selectEmoji('${e}')">${e}</div>
  `).join('');
}

function refreshEmojiPicker() {
  document.querySelectorAll('.emoji-opt').forEach(el => {
    el.classList.toggle('selected', el.textContent === state.selectedEmoji);
  });
}

function selectEmoji(e) {
  state.selectedEmoji = e;
  refreshEmojiPicker();
}

function buildColorPicker() {
  const picker = document.getElementById('colorPicker');
  picker.innerHTML = COLORS.map(c => `
    <div class="color-opt ${c === state.selectedColor ? 'selected' : ''}"
         style="background:${c}" onclick="selectColor('${c}')"></div>
  `).join('');
}

function refreshColorPicker() {
  document.querySelectorAll('.color-opt').forEach(el => {
    el.classList.toggle('selected', el.style.background === state.selectedColor || el.dataset?.color === state.selectedColor);
  });
  buildColorPicker();
}

function selectColor(c) {
  state.selectedColor = c;
  buildColorPicker();
}

// ── QUIZZES ──────────────────────────────────────────
function renderQuizzes(sub) {
  const list = document.getElementById('quizzesList');
  if (!sub.quizzes.length) {
    list.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🧠</div>
      <h3>Nenhum quiz ainda</h3>
      <p>Crie um quiz para testar seus conhecimentos!</p>
      <button class="btn-primary" onclick="openCreateQuiz()">+ Criar quiz</button>
    </div>`;
    return;
  }

  list.innerHTML = sub.quizzes.map(q => `
    <div class="quiz-card pop-in">
      <div class="quiz-icon">🧠</div>
      <div class="quiz-info">
        <h3>${esc(q.title)}</h3>
        <p>${q.questions.length} pergunta${q.questions.length !== 1 ? 's' : ''}</p>
      </div>
      <div class="quiz-card-actions">
        <button class="btn-primary" onclick="startQuiz('${q.id}')">▶ Iniciar</button>
        <button class="btn-danger" onclick="deleteQuiz('${q.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ── CRIAR QUIZ ───────────────────────────────────────
function openCreateQuiz() {
  state.questionCount = 0;
  document.getElementById('quizTitle').value = '';
  document.getElementById('quizQuestionsContainer').innerHTML = '';
  addQuestion();
  openModal('modalQuiz');
}

function addQuestion() {
  state.questionCount++;
  const n = state.questionCount;
  const container = document.getElementById('quizQuestionsContainer');
  const block = document.createElement('div');
  block.className = 'question-block';
  block.id = 'qblock-' + n;
  block.innerHTML = `
    <div class="question-block-head">
      <span>Pergunta ${n}</span>
      ${n > 1 ? `<button class="btn-danger" style="padding:4px 8px;font-size:12px" onclick="removeQuestion(${n})">Remover</button>` : ''}
    </div>
    <input type="text" id="qtext-${n}" placeholder="Digite a pergunta..." />
    <div class="options-creator">
      ${['A','B','C','D'].map((l, i) => `
        <div class="option-row">
          <div class="option-row-label">${l}</div>
          <input type="text" id="qopt-${n}-${i}" placeholder="Alternativa ${l}..." />
          <button class="option-correct-btn" id="qcorrect-${n}-${i}"
                  onclick="setCorrect(${n},${i})" title="Marcar como correta">✓</button>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(block);
  // Scroll to new question
  block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeQuestion(n) {
  document.getElementById('qblock-' + n)?.remove();
}

function setCorrect(qn, optIdx) {
  for (let i = 0; i < 4; i++) {
    document.getElementById(`qcorrect-${qn}-${i}`)?.classList.remove('active');
  }
  document.getElementById(`qcorrect-${qn}-${optIdx}`)?.classList.add('active');
}

function saveQuiz() {
  const title = document.getElementById('quizTitle').value.trim();
  if (!title) { showToast('Digite o título do quiz!'); return; }

  const blocks = document.querySelectorAll('.question-block');
  const questions = [];

  for (const block of blocks) {
    const n = block.id.replace('qblock-', '');
    const text = document.getElementById('qtext-' + n)?.value.trim();
    if (!text) { showToast('Preencha todas as perguntas!'); return; }

    const options = [];
    for (let i = 0; i < 4; i++) {
      const v = document.getElementById(`qopt-${n}-${i}`)?.value.trim();
      if (!v) { showToast('Preencha todas as alternativas!'); return; }
      options.push(v);
    }

    let correct = -1;
    for (let i = 0; i < 4; i++) {
      if (document.getElementById(`qcorrect-${n}-${i}`)?.classList.contains('active')) {
        correct = i; break;
      }
    }
    if (correct === -1) { showToast('Marque a alternativa correta em todas as perguntas!'); return; }

    questions.push({ text, options, correct });
  }

  if (!questions.length) { showToast('Adicione ao menos uma pergunta!'); return; }

  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  sub.quizzes.push({ id: uid(), title, questions });

  saveSubjects(subs);
  closeModal('modalQuiz');
  renderQuizzes(sub);
  updateStats();
  renderQuickGrid();
  showToast('Quiz criado! 🎉');
}

function deleteQuiz(qid) {
  if (!confirm('Excluir este quiz?')) return;
  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  sub.quizzes = sub.quizzes.filter(q => q.id !== qid);
  saveSubjects(subs);
  renderQuizzes(sub);
  updateStats();
  showToast('Quiz excluído');
}

// ── JOGAR QUIZ ───────────────────────────────────────
function startQuiz(qid) {
  const subs = getSubjects();
  const sub  = subs.find(s => s.id === state.currentSubjectId);
  const quiz = sub?.quizzes.find(q => q.id === qid);
  if (!quiz) return;

  state.currentQuiz   = quiz;
  state.quizAnswers   = new Array(quiz.questions.length).fill(-1);
  state.quizCurrent   = 0;

  renderQuizPlay();
  showPage('quiz-play');
}

function renderQuizPlay() {
  const quiz = state.currentQuiz;
  const i    = state.quizCurrent;
  const q    = quiz.questions[i];
  const total = quiz.questions.length;

  const pct = Math.round((i / total) * 100);

  document.getElementById('quizPlayContent').innerHTML = `
    <div class="quiz-play-wrap">
      <div class="quiz-play-header">
        <button class="btn-back" onclick="showPage('subject-detail')">← Sair</button>
        <div>
          <h2>🧠 ${esc(quiz.title)}</h2>
        </div>
      </div>

      <div class="quiz-progress">
        <div class="progress-label">
          <span>Pergunta ${i+1} de ${total}</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-num">Pergunta ${i+1}</div>
        <div class="question-text">${esc(q.text)}</div>
        <div class="options-grid" id="optionsGrid">
          ${q.options.map((opt, oi) => `
            <button class="option-btn" id="opt-${oi}" onclick="selectAnswer(${oi})">
              <div class="option-label">${'ABCD'[oi]}</div>
              <span>${esc(opt)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="quiz-nav">
        <button class="btn-primary" id="nextBtn" onclick="nextQuestion()" disabled>
          ${i === total - 1 ? 'Ver resultado →' : 'Próxima →'}
        </button>
      </div>
    </div>
  `;

  // Se já respondeu (ao voltar)
  if (state.quizAnswers[i] !== -1) {
    selectAnswer(state.quizAnswers[i], true);
  }
}

function selectAnswer(idx, restore = false) {
  if (!restore && state.quizAnswers[state.quizCurrent] !== -1) return; // já respondeu

  state.quizAnswers[state.quizCurrent] = idx;
  document.getElementById('nextBtn').disabled = false;

  // Marcar selecionado
  document.querySelectorAll('.option-btn').forEach((b, i) => {
    b.classList.toggle('selected', i === idx);
  });
}

function nextQuestion() {
  const i     = state.quizCurrent;
  const total = state.currentQuiz.questions.length;

  // Mostrar feedback
  const q        = state.currentQuiz.questions[i];
  const selected = state.quizAnswers[i];
  const correct  = q.correct;

  document.querySelectorAll('.option-btn').forEach((b, oi) => {
    b.disabled = true;
    if (oi === correct) b.classList.add('correct');
    else if (oi === selected && selected !== correct) b.classList.add('wrong');
  });

  // Esperar um momento antes de avançar
  setTimeout(() => {
    if (i + 1 >= total) {
      showQuizResult();
    } else {
      state.quizCurrent++;
      renderQuizPlay();
    }
  }, 900);
}

// ── RESULTADO ────────────────────────────────────────
function showQuizResult() {
  const quiz   = state.currentQuiz;
  const answers = state.quizAnswers;
  let score = 0;

  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
  });

  const total = quiz.questions.length;
  const pct   = Math.round((score / total) * 100);

  const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '📚' : '😅';
  const msg   = pct === 100 ? 'Nota 10! Perfeito!' : pct >= 70 ? 'Muito bem! Continue assim!' : pct >= 40 ? 'Bom começo! Revise os tópicos.' : 'Não desista! Revise e tente de novo.';

  // Salvar no histórico
  addHistory({
    type: 'quiz',
    quizId: quiz.id,
    quizTitle: quiz.title,
    subjectId: state.currentSubjectId,
    score, total, pct
  });

  const answersHTML = quiz.questions.map((q, i) => {
    const ok = answers[i] === q.correct;
    const yourAns = answers[i] >= 0 ? q.options[answers[i]] : 'Sem resposta';
    const corrAns = q.options[q.correct];
    return `
    <div class="result-answer">
      <div class="answer-icon">${ok ? '✅' : '❌'}</div>
      <div class="answer-body">
        <strong>${esc(q.text)}</strong>
        <div class="answer-your">Sua resposta: ${esc(yourAns)}</div>
        ${!ok ? `<div class="answer-correct">Correta: ${esc(corrAns)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  document.getElementById('quizResultContent').innerHTML = `
    <div class="result-wrap">
      <div class="result-hero">
        <span class="result-emoji">${emoji}</span>
        <div class="result-title">${msg}</div>
        <div class="result-score">${score}<span class="result-total">/${total}</span></div>
        <div class="result-msg">${pct}% de acerto</div>
      </div>

      <div class="result-breakdown">
        <div class="breakdown-box correct">
          <span>${score}</span>
          <label>Acertos</label>
        </div>
        <div class="breakdown-box wrong">
          <span>${total - score}</span>
          <label>Erros</label>
        </div>
      </div>

      <div class="result-answers">${answersHTML}</div>

      <div class="result-actions">
        <button class="btn-secondary" onclick="showPage('subject-detail')">← Voltar</button>
        <button class="btn-primary" onclick="restartQuiz()">🔄 Refazer quiz</button>
      </div>
    </div>
  `;

  showPage('quiz-result');
}

function restartQuiz() {
  state.quizAnswers = new Array(state.currentQuiz.questions.length).fill(-1);
  state.quizCurrent = 0;
  renderQuizPlay();
  showPage('quiz-play');
}

// ── MEUS ESTUDOS ─────────────────────────────────────
function renderMyStudies() {
  const container = document.getElementById('myStudiesContent');
  const subs    = getSubjects();
  const history = getHistory();
  const profile = getProfile();

  let html = '';

  // Boas-vindas
  html += `
    <div style="padding:24px;max-width:1100px;margin:0 auto">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:28px;display:flex;align-items:center;gap:20px;margin-bottom:28px">
        <div class="avatar" style="width:56px;height:56px;font-size:22px">${(profile.name||'A')[0]}</div>
        <div>
          <div style="font-family:var(--font-head);font-size:20px;color:var(--text)">Olá, ${esc(profile.name || 'Aluno')}! 👋</div>
          <div style="color:var(--text2);font-size:14px;margin-top:4px">Continue seus estudos de onde parou.</div>
        </div>
      </div>
    </div>
  `;

  // Resumo geral
  let totalTopics = 0, totalQuizzes = 0, totalScore = 0, scoredQuizzes = 0;
  subs.forEach(s => { totalTopics += s.topics.length; totalQuizzes += s.quizzes.length; });
  history.filter(h => h.type === 'quiz').forEach(h => { totalScore += h.pct; scoredQuizzes++; });
  const avgScore = scoredQuizzes ? Math.round(totalScore / scoredQuizzes) : 0;

  html += `
    <div style="padding:0 24px 28px;max-width:1100px;margin:0 auto">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">
        ${miniStat('📚', subs.length, 'Matérias')}
        ${miniStat('📝', totalTopics, 'Tópicos criados')}
        ${miniStat('🧠', totalQuizzes, 'Quizzes criados')}
        ${miniStat('🎯', avgScore + '%', 'Média nos quizzes')}
      </div>
    </div>
  `;

  // Histórico
  if (history.length) {
    html += `<div class="studies-section-title">📋 Histórico de quizzes</div>`;
    html += `<div style="padding:0 24px 48px;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:10px">`;

    history.filter(h => h.type === 'quiz').slice(0, 20).forEach(h => {
      const sub = subs.find(s => s.id === h.subjectId);
      const color = h.pct >= 70 ? 'var(--green)' : h.pct >= 40 ? 'var(--yellow)' : 'var(--red)';
      html += `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;display:flex;align-items:center;gap:16px">
          <div style="font-size:24px">${sub?.emoji || '🧠'}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px;color:var(--text)">${esc(h.quizTitle)}</div>
            <div style="font-size:12px;color:var(--text2)">${sub?.name || 'Matéria'} · ${formatDate(h.date)}</div>
          </div>
          <div style="font-family:var(--font-head);font-size:18px;font-weight:800;color:${color}">${h.score}/${h.total}</div>
        </div>
      `;
    });

    html += `</div>`;
  } else {
    html += `
      <div class="empty-state">
        <div class="empty-icon">🚀</div>
        <h3>Nenhuma atividade ainda</h3>
        <p>Faça seu primeiro quiz para ver seu progresso aqui!</p>
        <button class="btn-primary" onclick="showPage('subjects')">Ver matérias</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

function miniStat(icon, val, label) {
  return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;text-align:center">
      <div style="font-size:24px;margin-bottom:8px">${icon}</div>
      <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:var(--accent)">${val}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">${label}</div>
    </div>
  `;
}

// ── MODAIS ───────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// Fechar modal clicando fora (exceto profileModal)
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay') && !e.target.id.includes('profile')) {
    e.target.classList.remove('active');
  }
});

// ── TOAST ────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── HELPERS ──────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return 'agora';
  if (diff < 3600) return Math.floor(diff/60) + ' min atrás';
  if (diff < 86400)return Math.floor(diff/3600) + ' h atrás';
  return d.toLocaleDateString('pt-BR');
}
