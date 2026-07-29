# CodeCrafters Learning Platform

Production-ready **MERN LMS foundation** (Prompt 001). Business modules are intentionally not implemented yet.

## Stack

| Layer | Tech |
|-------|------|
| Client | React 19, Vite, JavaScript, Tailwind, React Router, TanStack Query, RHF, Zod, Framer Motion, shadcn-style UI, Lucide, React Hot Toast |
| Server | Node.js, Express, MongoDB, Mongoose, JWT (setup), Swagger, Morgan, Helmet, CORS, Dotenv, Cookie Parser, Compression |

## Quick start

```bash
# 1) Install (once)
npm run setup

# 2) MongoDB (required for full health DB status)
docker compose up mongo -d

# 3) Run API + UI together
npm run dev
# or double-click start.bat on Windows
```

- App: http://localhost:5173  
- Health: http://localhost:5000/api/v1/health  
- Swagger: http://localhost:5000/api/docs  

## Environment

Copy examples if needed:

- `client/.env.example` → `VITE_API_URL`
- `server/.env.example` → `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`

## What this prompt includes

- Scalable `client/` + `server/` folder architecture  
- Design system (dark default + light theme)  
- Landing hero, auth route placeholders, role layouts (student / teacher / admin)  
- Global shell: sidebar, navbar, footer, breadcrumb, theme toggle, search, notifications, command palette placeholder  
- Error pages: 404, 500, unauthorized, offline  
- Loaders: skeleton, spinner, page loader, button loader  
- Central Axios instance + interceptors  
- Express `/api/v1` + health only  
- JWT utility setup (no auth flows yet)  
- ESLint / Prettier configs  

## What is NOT included (later prompts)

- Authentication implementation (Prompt 002)  
- Course / student / assignment / practice modules  
- Business dashboards  

## Docs

See [`docs/`](docs/) for architecture, folder structure, and development guide.
