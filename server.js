const express = require('express');
const cors = require('cors');
const { getDb, save } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Get all notes
app.get('/notes', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM notes ORDER BY updated_at DESC');
  const notes = result[0] ? result[0].values.map(row => toObj(result[0].columns, row)) : [];
  res.json(notes);
});

// Get single note
app.get('/notes/:id', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM notes WHERE id = ${Number(req.params.id)}`);
  if (!result[0]) return res.status(404).json({ error: 'Note not found' });
  res.json(toObj(result[0].columns, result[0].values[0]));
});

// Create note
app.post('/notes', async (req, res) => {
  const { title = '', content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  const db = await getDb();
  db.run('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content]);
  save();
  const result = db.exec('SELECT * FROM notes ORDER BY id DESC LIMIT 1');
  res.status(201).json(toObj(result[0].columns, result[0].values[0]));
});

// Update note
app.put('/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  const db = await getDb();
  const existing = db.exec(`SELECT * FROM notes WHERE id = ${Number(req.params.id)}`);
  if (!existing[0]) return res.status(404).json({ error: 'Note not found' });
  const note = toObj(existing[0].columns, existing[0].values[0]);
  db.run(
    'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title ?? note.title, content ?? note.content, Number(req.params.id)]
  );
  save();
  const updated = db.exec(`SELECT * FROM notes WHERE id = ${Number(req.params.id)}`);
  res.json(toObj(updated[0].columns, updated[0].values[0]));
});

// Delete note
app.delete('/notes/:id', async (req, res) => {
  const db = await getDb();
  const existing = db.exec(`SELECT * FROM notes WHERE id = ${Number(req.params.id)}`);
  if (!existing[0]) return res.status(404).json({ error: 'Note not found' });
  db.run(`DELETE FROM notes WHERE id = ${Number(req.params.id)}`);
  save();
  res.status(204).send();
});

function toObj(columns, row) {
  return columns.reduce((obj, col, i) => ({ ...obj, [col]: row[i] }), {});
}

app.listen(PORT, () => console.log(`Notes API running on http://localhost:${PORT}`));
