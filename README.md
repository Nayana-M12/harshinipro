
A simple notes app with an Express REST API and vanilla JS frontend. Data is stored in a local SQLite file (`notes.db`) using `sql.js` — no external database needed.

## Setup

```bash
npm install
npm start        # production
npm run dev      # development with auto-reload
```

Runs at `http://localhost:3000`.

## API

| Method | Endpoint   | Description     |
|--------|------------|-----------------|
| GET    | /notes     | Get all notes   |
| GET    | /notes/:id | Get one note    |
| POST   | /notes     | Create a note   |
| PUT    | /notes/:id | Update a note   |
| DELETE | /notes/:id | Delete a note   |

**POST / PUT body:**
```json
{ "title": "...", "content": "..." }
```
`content` is required on creation.

## Features

- Search notes by title or content
- Auto-save after 2s of inactivity, or manually with Save / `Ctrl+S`
- Notes sorted by last updated
- Confirm before delete
