# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional, for MongoDB)

## First-time setup

```bash
npm run setup
cp client/.env.example client/.env
cp server/.env.example server/.env
docker compose up mongo -d
```

## Daily development

```bash
npm run dev
```

Runs Express (`:5000`) and Vite (`:5173`) together.

Windows: double-click `start.bat`.

## Useful URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Landing + app shells |
| http://localhost:5000/api/v1/health | Health check |
| http://localhost:5000/api/docs | Swagger UI |

## Scripts

| Command | Where | Purpose |
|---------|-------|---------|
| `npm run dev` | root | Client + server |
| `npm run build` | root / client | Production client build |
| `npm run lint` | client / server | Lint (when configured) |

## Conventions

- JavaScript only (`.js` / `.jsx`) — no TypeScript.
- Absolute imports via `@/` in the client.
- Do not add business modules until the corresponding prompt.
- Keep API responses shaped as `{ success, message, data }`.

## Next prompt

**Prompt 002 — Authentication** will implement real login/register, JWT cookies/headers, and enforce `ProtectedRoute`.
