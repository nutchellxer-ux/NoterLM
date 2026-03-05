import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set, remove, query, orderByChild } from "firebase/database";

// Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyB212KWTAK8oDbgBSgXuW-StHAbCcSmdQU",
  authDomain: "cyruspolestico17-dd89c.firebaseapp.com",
  databaseURL: "https://cyruspolestico17-dd89c-default-rtdb.firebaseio.com",
  projectId: "cyruspolestico17-dd89c",
  storageBucket: "cyruspolestico17-dd89c.firebasestorage.app",
  messagingSenderId: "34125185117",
  appId: "1:34125185117:web:462e584efc845de3d30db4",
  measurementId: "G-7FW5WFR2VC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const notesRef = ref(db, 'notes');

// State
let allNotes = [];
let currentNoteId = null;

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const searchInput = document.getElementById('search-input');
const newNoteBtn = document.getElementById('new-note-btn');
const editorModal = document.getElementById('editor-modal');
const closeModalBtn = document.getElementById('close-modal');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');

// --- Functions ---

function openModal(note = null) {
  if (note) {
    currentNoteId = note.id;
    noteTitleInput.value = note.title || '';
    noteContentInput.value = note.content || '';
    deleteNoteBtn.classList.remove('hidden');
  } else {
    currentNoteId = null;
    noteTitleInput.value = '';
    noteContentInput.value = '';
    deleteNoteBtn.classList.add('hidden');
  }
  
  editorModal.classList.remove('opacity-0', 'pointer-events-none');
  editorModal.querySelector('div').classList.remove('scale-95');
  editorModal.querySelector('div').classList.add('scale-100');
}

function closeModal() {
  editorModal.classList.add('opacity-0', 'pointer-events-none');
  editorModal.querySelector('div').classList.add('scale-95');
  editorModal.querySelector('div').classList.remove('scale-100');
}

async function saveNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  
  if (!title && !content) {
    closeModal();
    return;
  }

  const noteData = {
    title,
    content,
    updatedAt: Date.now()
  };

  try {
    if (currentNoteId) {
      await set(ref(db, `notes/${currentNoteId}`), noteData);
    } else {
      await push(notesRef, {
        ...noteData,
        createdAt: Date.now()
      });
    }
    closeModal();
  } catch (error) {
    console.error("Error saving note:", error);
    alert("Failed to save note. Check console for details.");
  }
}

async function deleteNote() {
  if (!currentNoteId) return;
  if (!confirm("Are you sure you want to delete this note?")) return;

  try {
    await remove(ref(db, `notes/${currentNoteId}`));
    closeModal();
  } catch (error) {
    console.error("Error deleting note:", error);
  }
}

function renderNotes(notes) {
  notesGrid.innerHTML = '';
  
  if (notes.length === 0) {
    notesGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 text-black/40">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-20"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p class="text-lg font-medium">No notes found</p>
        <p class="text-sm opacity-60">Create your first note to get started</p>
      </div>
    `;
    return;
  }

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = "bg-white p-6 rounded-3xl border border-black/5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 duration-500";
    
    const date = new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });

    card.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors">${note.title || 'Untitled'}</h3>
          <span class="text-[10px] font-bold uppercase tracking-wider text-black/30">${date}</span>
        </div>
        <p class="text-black/60 text-sm line-clamp-4 leading-relaxed flex-1">${note.content || 'No content...'}</p>
        <div class="mt-4 pt-4 border-t border-black/5 flex items-center gap-2 text-black/20 group-hover:text-emerald-600/40 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="text-[10px] font-bold uppercase tracking-widest">View Note</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(note));
    notesGrid.appendChild(card);
  });
}

function handleSearch() {
  const term = searchInput.value.toLowerCase();
  const filtered = allNotes.filter(note => 
    (note.title && note.title.toLowerCase().includes(term)) || 
    (note.content && note.content.toLowerCase().includes(term))
  );
  renderNotes(filtered);
}

// --- Event Listeners ---

newNoteBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
saveNoteBtn.addEventListener('click', saveNote);
deleteNoteBtn.addEventListener('click', deleteNote);
searchInput.addEventListener('input', handleSearch);

// Close modal on outside click
editorModal.addEventListener('click', (e) => {
  if (e.target === editorModal) closeModal();
});

// Initial Load & Real-time Updates
onValue(notesRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    allNotes = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  } else {
    allNotes = [];
  }
  handleSearch(); // Render with current search term
});
