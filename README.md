# CodeCrafters Learning Platform

Production-ready **MERN LMS** through Prompt 005: foundation, auth/RBAC, courses, curriculum builder, and premium lesson viewer.

## Stack

| Layer | Tech |
|-------|------|
| Client | React 19, Vite, JavaScript, Tailwind, React Router, TanStack Query, RHF, Zod, Framer Motion, shadcn-style UI, Lucide, React Hot Toast |
| Server | Node.js, Express, MongoDB, Mongoose, JWT, Swagger, Morgan, Helmet, CORS, Dotenv, Cookie Parser, Compression |

## Quick start

```bash
# 1) Install (once)
npm run setup

# 2) MongoDB (required for full health DB status)
docker compose up mongo -d

# 3) Seed demo users + sample courses + curriculum
npm run seed --prefix server
npm run seed:courses --prefix server
npm run seed:curriculum --prefix server

# 4) Run API + UI together
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

## Included so far

- Scalable `client/` + `server/` folder architecture  
- Design system (dark default + light theme)  
- Landing + auth (JWT access/refresh, RBAC)  
- **Course management:** categories, courses, batches, settings, soft delete/restore, publish/archive  
- **Curriculum builder:** modules → weeks → topics → lessons → resources, nested DnD, lesson editor/viewer  
- **Premium lesson viewer:** 3-column learning UX, code blocks, bookmarks, notes, reading progress  
- Premium course tables/cards, multi-step course form, admin dashboard stats  
- Docs in `docs/`  

## Demo auth

```bash
cd server && npm run seed && npm run seed:courses && npm run seed:curriculum
```

Sign in at `/login` with e.g. `admin@codecrafters.dev` / `Password1`.

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md), [docs/COURSE_MANAGEMENT.md](docs/COURSE_MANAGEMENT.md), [docs/CURRICULUM_BUILDER.md](docs/CURRICULUM_BUILDER.md), and [docs/LESSON_VIEWER.md](docs/LESSON_VIEWER.md).

## What is NOT included (later prompts)

- Enrollments  
- Live code editor, practice engine, assignment submission, quiz engine  
- Student progress logic  

## Docs

See [`docs/`](docs/) for architecture, auth, course management, curriculum builder, folder structure, and development guide.
