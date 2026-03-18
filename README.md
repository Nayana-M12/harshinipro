
A notes REST API built with Node.js and Express. Notes are persisted to a local SQLite file (`notes.db`) using `sql.js` — no external database required.

## Setup

```bash
npm install
npm start        # production
npm run dev      # development with auto-reload (nodemon)
```

Runs at `http://localhost:3000`.

## API

| Method | Endpoint     | Description    |
|--------|--------------|----------------|
| GET    | /notes       | Get all notes  |
| GET    | /notes/:id   | Get one note   |
| POST   | /notes       | Create a note  |
| PUT    | /notes/:id   | Update a note  |
| DELETE | /notes/:id   | Delete a note  |

**POST / PUT body:**
```json
{ "title": "...", "content": "..." }
```
> `content` is required on creation.

## Stack

- Node.js / Express
- sql.js (SQLite, file-persisted)
- CORS enabled
