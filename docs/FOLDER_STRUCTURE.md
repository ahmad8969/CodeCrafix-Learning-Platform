# Folder Structure

## Repository

```text
CodeCrafters-Learning-Platform/
├── client/                 # Vite React SPA
├── server/                 # Express API
├── docs/                   # Project documentation
├── docker-compose.yml
├── package.json            # Root scripts (concurrently)
├── start.bat               # Windows one-click start
└── README.md
```

## Client (`client/src`)

```text
assets/
components/
  ui/           # Primitives (button, card, dialog, …)
  common/       # Breadcrumb, footer, command palette
  forms/
  tables/
  cards/
  charts/
  editor/
  sidebar/
  navbar/
  buttons/
  modals/
  loaders/
layouts/        # Public + Student/Teacher/Admin portals
pages/          # Route screens (placeholders only)
hooks/
contexts/       # Theme, Auth (stub), Sidebar, providers
services/       # Axios API + health service
store/          # Future client stores
routes/         # App router + protected route stub
utils/
constants/
styles/         # globals.css (design tokens)
config/
lib/            # cn(), helpers
```

## Server (`server/src`)

```text
config/         # env, db, swagger
controllers/    # health only (Prompt 001)
routes/v1/      # /api/v1/*
middlewares/    # error, auth stub
models/         # empty (later)
services/       # empty (later)
repositories/   # empty (later)
validators/     # empty (later)
utils/          # jwt setup, helpers
constants/
docs/           # swagger tags
logs/
uploads/        # (repo root sibling)
```
