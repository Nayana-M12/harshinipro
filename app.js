let notes = JSON.parse(localStorage.getItem('notes')) || [];
let activeId = null;
let deleteTargetId = null;
let saveTimer = null;

const notesList = document.getElementById('notes-list');
const editorArea = document.getElementById('editor-area');
const noteCount = document.getElementById('note-count');
const searchInput = document.getElementById('search');
const newBtn = document.getElementById('new-btn');
const modalOverlay = document.getElementById('modal-overlay');
const cancelBtn = document.getElementById('cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

function save() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderList(filter = '') {
  const q = filter.toLowerCase();
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  );

  noteCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
  notesList.innerHTML = '';

  if (filtered.length === 0) {
    notesList.innerHTML = `<div class="empty-list">${filter ? 'No results found' : 'No notes yet'}</div>`;
    return;
  }

  filtered.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-item' + (note.id === activeId ? ' active' : '');
    item.dataset.id = note.id;
    item.innerHTML = `
      <div class="note-item-title">${escHtml(note.title) || 'Untitled'}</div>
      <div class="note-item-preview">${escHtml(note.body) || 'No content'}</div>
      <div class="note-item-date">${formatDate(note.updatedAt)}</div>
    `;
    item.addEventListener('click', () => openNote(note.id));
    notesList.appendChild(item);
  });
}

function openNote(id) {
  activeId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editorArea.innerHTML = `
    <div class="editor">
      <div class="editor-toprow">
        <span class="editor-meta">Last edited ${formatDate(note.updatedAt)}</span>
        <div class="editor-actions">
          <button class="save-note-btn" id="save-btn">
            <i class="ri-save-3-line"></i> Save
          </button>
          <button class="delete-note-btn" id="delete-btn">
            <i class="ri-delete-bin-6-line"></i> Delete
          </button>
        </div>
      </div>
      <input type="text" id="editor-title" placeholder="Note title..." value="${escHtml(note.title)}" />
      <textarea id="editor-body" placeholder="Start writing...">${escHtml(note.body)}</textarea>
      <div class="save-indicator" id="save-indicator"></div>
    </div>
  `;

  document.getElementById('editor-title').addEventListener('input', onEdit);
  document.getElementById('editor-body').addEventListener('input', onEdit);
  document.getElementById('save-btn').addEventListener('click', () => manualSave());
  document.getElementById('delete-btn').addEventListener('click', () => {
    deleteTargetId = id;
    modalOverlay.classList.add('active');
  });

  renderList(searchInput.value);
}

function onEdit() {
  const note = notes.find(n => n.id === activeId);
  if (!note) return;
  note.title = document.getElementById('editor-title').value;
  note.body = document.getElementById('editor-body').value;
  note.updatedAt = Date.now();

  const indicator = document.getElementById('save-indicator');
  indicator.textContent = 'Unsaved changes...';
  indicator.className = 'save-indicator unsaved';

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => manualSave(), 2000);
}

function manualSave() {
  const note = notes.find(n => n.id === activeId);
  if (!note) return;
  const titleEl = document.getElementById('editor-title');
  const bodyEl = document.getElementById('editor-body');
  if (titleEl) note.title = titleEl.value;
  if (bodyEl) note.body = bodyEl.value;
  note.updatedAt = Date.now();
  save();

  const indicator = document.getElementById('save-indicator');
  if (indicator) {
    indicator.textContent = '✓ Saved';
    indicator.className = 'save-indicator saved';
  }

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.classList.add('saved');
    saveBtn.innerHTML = '<i class="ri-check-line"></i> Saved';
    setTimeout(() => {
      saveBtn.classList.remove('saved');
      saveBtn.innerHTML = '<i class="ri-save-3-line"></i> Save';
    }, 1500);
  }

  renderList(searchInput.value);
}

newBtn.addEventListener('click', () => {
  const note = {
    id: Date.now(),
    title: '',
    body: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  notes.unshift(note);
  save();
  renderList(searchInput.value);
  openNote(note.id);
  setTimeout(() => document.getElementById('editor-title')?.focus(), 50);
});

searchInput.addEventListener('input', () => renderList(searchInput.value));

cancelBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});

confirmDeleteBtn.addEventListener('click', () => {
  notes = notes.filter(n => n.id !== deleteTargetId);
  save();
  if (activeId === deleteTargetId) {
    activeId = null;
    editorArea.innerHTML = `
      <div class="welcome">
        <i class="ri-quill-pen-line"></i>
        <p>Select a note or create a new one</p>
      </div>`;
  }
  modalOverlay.classList.remove('active');
  renderList(searchInput.value);
});

// Ctrl+S to save
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (activeId) manualSave();
  }
});

// Init
renderList();
