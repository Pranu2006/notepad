// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCzah5yqXyfFPOj9Ed4FWlffCf4_7wqnQI",
    authDomain: "notes-a261e.firebaseapp.com",
    projectId: "notes-a261e",
    storageBucket: "notes-a261e.firebasestorage.app",
    messagingSenderId: "574472680574",
    appId: "1:574472680574:web:a9a6d1e7e90d643464d42f",
    measurementId: "G-L004CN7LWS"
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
            console.log('Account created successfully!');
            signupForm.reset();
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        })
        .catch((error) => {
            console.log(error.message);
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
            console.log(error.message);
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
        console.log('Please write something in your note');
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
            if (error.code === 'failed-precondition') {
                console.error('Error loading notes: The query requires an index. You can create it here:', error.message);
            } else {
                console.error('Error loading notes:', error);
            }
        });
}

// Copy Note
function copyNote(noteId) {
    db.collection('notes').doc(noteId).get()
        .then((doc) => {
            const noteContent = doc.data().content;
            navigator.clipboard.writeText(noteContent)
                .then(() => {
                    console.log('Note copied to clipboard!');
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