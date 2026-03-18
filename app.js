const API = 'http://localhost:3000';

let notes = [];
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

async function fetchNotes() {
  const res = await fetch(`${API}/notes`);
  notes = await res.json();
  renderList(searchInput.value);
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderList(filter = '') {
  const q = filter.toLowerCase();
  const filtered = notes.filter(n =>
    (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
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
      <div class="note-item-preview">${escHtml(note.content) || 'No content'}</div>
      <div class="note-item-date">${formatDate(note.updated_at)}</div>
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
        <span class="editor-meta">Last edited ${formatDate(note.updated_at)}</span>
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
      <textarea id="editor-body" placeholder="Start writing...">${escHtml(note.content)}</textarea>
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
  const indicator = document.getElementById('save-indicator');
  indicator.textContent = 'Unsaved changes...';
  indicator.className = 'save-indicator unsaved';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => manualSave(), 2000);
}

async function manualSave() {
  const titleEl = document.getElementById('editor-title');
  const bodyEl = document.getElementById('editor-body');
  if (!titleEl || !bodyEl) return;

  const title = titleEl.value;
  const content = bodyEl.value;

  if (activeId === 'new') {
    // create
    const res = await fetch(`${API}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: content || ' ' })
    });
    const created = await res.json();
    activeId = created.id;
    await fetchNotes();
    openNote(activeId);
    return;
  }

  await fetch(`${API}/notes/${activeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  // update local cache
  const note = notes.find(n => n.id === activeId);
  if (note) { note.title = title; note.content = content; note.updated_at = new Date().toISOString(); }

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

newBtn.addEventListener('click', async () => {
  // create a blank note immediately
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', content: ' ' })
  });
  const note = await res.json();
  notes.unshift(note);
  renderList(searchInput.value);
  openNote(note.id);
  setTimeout(() => document.getElementById('editor-title')?.focus(), 50);
});

searchInput.addEventListener('input', () => renderList(searchInput.value));

cancelBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});

confirmDeleteBtn.addEventListener('click', async () => {
  await fetch(`${API}/notes/${deleteTargetId}`, { method: 'DELETE' });
  notes = notes.filter(n => n.id !== deleteTargetId);
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

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (activeId) manualSave();
  }
});

// Init
fetchNotes();
