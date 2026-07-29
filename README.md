# CodeCrafters Learning Platform

Production-ready **MERN LMS** through Prompt 011: live classes, attendance, academic calendar, announcements, plus enrollments, quizzes, and practice.

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
- **Live coding workspace:** Monaco HTML/CSS/JS lab, live preview, console, auto-save, ZIP download  
- **Practice engine:** coding + MCQ questions, run/submit evaluation, question bank, analytics  
- **Assignments:** multi-type submissions, coding lab, file uploads, teacher review, rubrics, notifications  
- **Quiz & Assessment Engine:** MCQ / T-F / fill-blank / coding quizzes, timer + auto-submit, analysis, leaderboards, teacher/admin dashboards  
- **Enrollment & Learning Path:** manual/bulk/code enrollments, batch roster & schedule, topic unlock rules, progress timeline, continue learning  
- **Live Classes & Attendance:** schedule/start/end classes, multi-provider meeting stubs, attendance + rules, academic calendar, announcements, recordings  
- Premium course tables/cards, multi-step course form, admin dashboard stats  
- Docs in `docs/`  

## Demo auth

```bash
cd server && npm run seed && npm run seed:courses && npm run seed:curriculum && npm run seed:practice && npm run seed:assignments && npm run seed:quiz && npm run seed:enrollment && npm run seed:live
```

Sign in at `/login` with e.g. `admin@codecrafters.dev` / `Password1`.

See docs including [ENROLLMENT_LEARNING_PATH.md](docs/ENROLLMENT_LEARNING_PATH.md) and [LIVE_CLASSES_ATTENDANCE.md](docs/LIVE_CLASSES_ATTENDANCE.md).

## What is NOT included (later prompts)

- Certificates, AI code review  
- Payments, marketplace  

## Docs

See [`docs/`](docs/) for architecture, live classes, enrollment, practice, assignments, quizzes, auth, and courses.
