# VectorShift Assignment – Cleaned Project

This repository contains a React (Create React App) frontend and a FastAPI backend.

## Structure

- `frontend/` – React app for building and submitting node/edge pipelines
- `backend/` – FastAPI service exposing `/pipelines/parse`

## Quick start

### Backend

1. Create a virtual environment (optional but recommended) and install dependencies:
   - Requirements are in `backend/requirements.txt`.
2. Start the server (default port 8000):
   - Example: `uvicorn backend.main:app --reload --port 8000`

The API supports:
- `GET /` health check: `{ "Ping": "Pong" }`
- `GET|POST /pipelines/parse` which accepts a pipeline and returns `{ num_nodes, num_edges, is_dag }`

### Frontend

- Install dependencies and start the dev server (default port 3000).
- The Submit button will attempt to reach the backend at `http://localhost:8000` when running on port 3000.

Useful scripts:
- `npm run format` – format source files with Prettier
- `npm run format:check` – verify formatting

## Notes

- Build outputs (e.g., `frontend/build`) are ignored from formatting and version control.
- Editor settings are standardized via `.editorconfig` and Prettier.

## License

For assignment/testing purposes.