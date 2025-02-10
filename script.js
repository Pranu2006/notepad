// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTGAPwqAAL9hAGMDcsBU_BSjw0ZFY0c_k",
    authDomain: "note-book-57811.firebaseapp.com",
    projectId: "note-book-57811",
    storageBucket: "note-book-57811.firebaseapp.com",
    messagingSenderId: "974143588920",
    appId: "1:974143588920:web:19285c565b16b023f574cd",
    measurementId: "G-1V6NS1HY5M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const authContainer = document.getElementById('auth-container');
const notesContainer = document.getElementById('notes-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const signupLink = document.getElementById('signup-link');
const loginLink = document.getElementById('login-link');
const logoutBtn = document.getElementById('logout-btn');
const noteInput = document.getElementById('note-input');
const saveNoteBtn = document.getElementById('save-note');
const clearNoteBtn = document.getElementById('clear-note');
const notesList = document.getElementById('notes-list');

// Toggle between Login and Signup
signupLink.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

loginLink.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Signup Handler
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection('users').doc(user.uid).set({
                name: name,
                email: email
            });
        })
        .then(() => {
            console('Account created successfully!');
            signupForm.reset();
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        })
        .catch((error) => {
            console(error.message);
        });
});

// Login Handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            authContainer.classList.add('hidden');
            notesContainer.classList.remove('hidden');
            loadNotes();
        })
        .catch((error) => {
            console(error.message);
        });
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            notesContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
});

// Save Note Handler
saveNoteBtn.addEventListener('click', () => {
    const noteContent = noteInput.value.trim();
    if (!noteContent) {
        console('Please write something in your note');
        return;
    }

    const user = auth.currentUser;
    db.collection('notes').add({
        userId: user.uid,
        content: noteContent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        noteInput.value = '';
        loadNotes();
    })
    .catch((error) => {
        console.error('Error saving note:', error);
    });
});

// Clear Note Handler
clearNoteBtn.addEventListener('click', () => {
    noteInput.value = '';
});

// Load Notes
function loadNotes() {
    const user = auth.currentUser;
    notesList.innerHTML = '';

    db.collection('notes')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const noteData = doc.data();
                const noteCard = document.createElement('div');
                noteCard.className = 'note-card';
                noteCard.innerHTML = `
                    <p>${noteData.content}</p>
                    <div class="note-card-actions">
                        <button onclick="copyNote('${doc.id}')">Copy</button>
                        <button onclick="deleteNote('${doc.id}')">Delete</button>
                    </div>
                `;
                notesList.appendChild(noteCard);
            });
        })
        .catch((error) => {
            console.error('Error loading notes:', error);
        });
}

// Copy Note
function copyNote(noteId) {
    db.collection('notes').doc(noteId).get()
        .then((doc) => {
            const noteContent = doc.data().content;
            navigator.clipboard.writeText(noteContent)
                .then(() => {
                    console('Note copied to clipboard!');
                })
                .catch((error) => {
                    console.error('Copy error:', error);
                });
        });
}

// Delete Note
function deleteNote(noteId) {
    db.collection('notes').doc(noteId).delete()
        .then(() => {
            loadNotes();
        })
        .catch((error) => {
            console.error('Error deleting note:', error);
        });
}

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.classList.add('hidden');
        notesContainer.classList.remove('hidden');
        loadNotes();
    } else {
        notesContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    }
});