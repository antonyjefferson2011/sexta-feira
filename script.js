// script.js
const firebaseConfig = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);

(() => {
  if (!firebaseConfig) {
    console.error('firebaseConfig não encontrado.');
    document.getElementById('loginHint')?.setAttribute('data-err', '1');
    return;
  }

  // Firebase init (evita duplicar init em caso de reload)
  const existingApps = (window.firebase && window.firebase.apps) ? window.firebase.apps : [];
  const firebaseApp = existingApps.length ? existingApps[0] : firebase.initializeApp(firebaseConfig);

  const auth = firebaseApp.auth();
  const db = firebaseApp.firestore();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // DOM
  const authScreen = document.getElementById('authScreen');
  const appScreen = document.getElementById('appScreen');

  const globalToast = document.getElementById('globalToast');

  const authTabs = Array.from(document.querySelectorAll('.tabBtn'));
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');

  const logoutBtn = document.getElementById('logoutBtn');

  const userSubtitle = document.getElementById('userSubtitle');
  const homeName = document.getElementById('homeName');
  const homeClass = document.getElementById('homeClass');
  const homePoints = document.getElementById('homePoints');

  const loginHint = document.getElementById('loginHint');
  const signupHint = document.getElementById('signupHint');

  const userViews = {
    home: document.getElementById('view-home'),
    subjects: document.getElementById('view-subjects'),
    ranking: document.getElementById('view-ranking'),
    history: document.getElementById('view-history')
  };

  const navItems = Array.from(document.querySelectorAll('.navItem'));

  // App State
  let currentUser = null;

  function toast(msg, isError = false) {
    if (!globalToast) return;
    globalToast.textContent = msg || '';
    globalToast.classList.remove('hidden');
    globalToast.classList.add('visible');
    globalToast.style.borderColor = isError ? 'rgba(239,68,68,.35)' : 'rgba(255,255,255,.12)';
    globalToast.style.background = isError ? 'rgba(239,68,68,.12)' : 'rgba(10,16,30,.88)';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      globalToast.classList.remove('visible');
      globalToast.classList.add('hidden');
    }, 2800);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function showApp(user) {
    // Obrigatório: não ficar na tela de login após login
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    if (user) {
      userSubtitle.textContent = `${user.name} • Sala ${user.class} • ${user.points} pts`;
      homeName.textContent = user.name;
      homeClass.textContent = user.class;
      homePoints.textContent = String(user.points ?? 0);
    }
  }

  function showAuth() {
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }

  async function getUserDoc(uid) {
    return db.collection('users').doc(uid);
  }

  async function ensureUserDoc(user) {
    const ref = await getUserDoc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const name = user.displayName || (user.email ? user.email.split('@')[0] : null) || 'Aluno';
      const email = user.email || '';
      // Sala obrigatória no schema, mas para Google não recebemos; salva como "—"
      const defaultClass = '—';

      await ref.set({
        name,
        email,
        class: defaultClass,
        points: 0
      });

      return { uid: user.uid, name, class: defaultClass, points: 0, email };
    }

    const data = snap.data() || {};
    return {
      uid: user.uid,
      name: data.name || 'Aluno',
      class: data.class || '—',
      points: typeof data.points === 'number' ? data.points : 0,
      email: data.email || user.email || ''
    };
  }

  // IMPORTANT: detectar usuário logado automaticamente
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        currentUser = await ensureUserDoc(user);
      } catch (e) {
        console.error(e);
        toast('Erro ao carregar seu perfil. Tente novamente.', true);
        currentUser = {
          uid: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Aluno'),
          class: '—',
          points: 0,
          email: user.email || ''
        };
      }
      showApp(currentUser);
      // carregar view inicial
      setView('home');
      return;
    }
    currentUser = null;
    showAuth();
  });

  // SPA navigation (placeholder views - keep consistent even if other code removed)
  function setView(name) {
    Object.values(userViews).forEach(el => el?.classList.add('hidden'));
    const target = userViews[name];
    if (target) target.classList.remove('hidden');
    navItems.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  }

  // Tabs (login/signup)
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.authTab;
      authTabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === target));
      loginForm.classList.toggle('active', target === 'login');
      signupForm.classList.toggle('active', target === 'signup');
    });
  });

  // Login email/senha
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginHint.textContent = 'Entrando...';
    try {
      await auth.signInWithEmailAndPassword(email, password);
      loginHint.textContent = '';
      // onAuthStateChanged vai cuidar da tela
    } catch (err) {
      console.error(err);
      loginHint.textContent = err?.message || 'Erro ao entrar.';
      toast(err?.message || 'Erro ao entrar.', true);
    }
  });

  // Cadastro email/senha
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const classValue = document.getElementById('signupClass').value.trim();

    signupHint.textContent = 'Criando conta...';
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        name,
        email,
        class: classValue,
        points: 0
      }, { merge: true });

      signupHint.textContent = '';
      // onAuthStateChanged vai cuidar da tela
    } catch (err) {
      console.error(err);
      signupHint.textContent = err?.message || 'Erro ao criar conta.';
      toast(err?.message || 'Erro ao criar conta.', true);
    }
  });

  // Login com Google (OBRIGATÓRIO)
  async function signInWithGoogle() {
    loginHint.textContent = 'Abrindo Google...';
    signupHint.textContent = 'Abrindo Google...';

    try {
      // Popup pode falhar se estiver bloqueado por navegador -> vamos mostrar erro
      await auth.signInWithPopup(googleProvider);
      loginHint.textContent = '';
      signupHint.textContent = '';
      // onAuthStateChanged vai cuidar da tela
    } catch (err) {
      console.error(err);
      const msg = err?.message || 'Erro no login Google.';
      toast(msg, true);
      loginHint.textContent = msg;
      signupHint.textContent = msg;
    }
  }

  googleLoginBtn.addEventListener('click', signInWithGoogle);
  googleSignupBtn.addEventListener('click', signInWithGoogle);

  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      toast('Você saiu com sucesso.');
      // onAuthStateChanged vai esconder app
    } catch (e) {
      console.error(e);
      toast('Erro ao sair.', true);
    }
  });

  // Estado inicial: espera auth.onAuthStateChanged
  // Não force mostrar app aqui.
})();
