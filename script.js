// script.js
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        loadUserData(user);
    } else {
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
});

function loadUserData(user) {
    db.collection('users').doc(user.uid).get().then(doc => {
        const data = doc.data();
        document.getElementById('userName').innerText = data.name;
        document.getElementById('userClass').innerText = data.class;
    });
}

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const classRoom = document.getElementById('class').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).set({
                name,
                email,
                class: classRoom,
                points: 0
            });
        })
        .catch(error => alert(error.message));
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => alert(error.message));
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        db.collection('users').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            class: 'N/A',
            points: 0
        }, { merge: true });
    }).catch(error => alert(error.message));
}

function logout() {
    auth.signOut();
}

function navigateTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screen).classList.remove('hidden');
}

function createSubject() {
    const title = document.getElementById('subjectTitle').value;
    const description = document.getElementById('subjectDescription').value;

    db.collection('subjects').add({
        title,
        description
    }).then(() => {
        loadSubjects();
    });
}

function loadSubjects() {
    db.collection('subjects').get().then(snapshot => {
        const subjectList = document.getElementById('subjectList');
        subjectList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p>`;
            subjectList.appendChild(div);
        });
    });
}

function createQuiz() {
    const title = document.getElementById('quizTitle').value;
    const questions = []; // Collect questions from the UI

    db.collection('quizzes').add({
        title,
        questions
    });
}
