# CodeCrafters Learning Platform v1.0 Enterprise

Production-ready **MERN SaaS LMS** through Prompt 015: full academic + finance + communication stack with security hardening, performance optimization, testing scaffolding, DevOps packaging, and SaaS readiness.

## Stack

| Layer | Tech |
|-------|------|
| Client | React 19, Vite, JavaScript/JSX, Tailwind, React Router, TanStack Query, RHF, Zod, Framer Motion |
| Server | Node.js, Express, MongoDB, Mongoose, JWT, Helmet, rate limiting, Swagger (gated) |
| Ops | Docker Compose, Nginx, GitHub Actions CI/CD placeholders, backup scripts |

## Quick start

```bash
npm run setup
docker compose up mongo -d
npm run seed --prefix server
npm run seed:courses --prefix server
npm run seed:curriculum --prefix server
npm run seed:communication --prefix server
npm run dev
```

- App: http://localhost:5173
- Health: http://localhost:5000/api/v1/health
- Ready: http://localhost:5000/api/v1/ready

## Docker full stack

```bash
docker compose up --build
```

Web on http://localhost:8080

## Quality gates

```bash
npm run lint
npm test
npm run build
```

## Demo auth

`admin@codecrafters.dev` / `Password1` (after seed)

## Documentation

- [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- [DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [SECURITY.md](docs/SECURITY.md)
- [TESTING.md](docs/TESTING.md)
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- [SAAS.md](docs/SAAS.md)
- [BACKUP.md](docs/BACKUP.md)
- [RELEASE_NOTES_v1.0.md](docs/RELEASE_NOTES_v1.0.md)
- Role guides: Admin / Teacher / Student
- Domain docs: Communication, Finance, Certificates, Live Classes, etc.

## Included (v1.0)

Auth/RBAC · Courses/Curriculum · Practice · Assignments · Quizzes · Enrollments · Live Classes · Certificates/Gamification · Finance ERP · Communication Hub/CRM/Career · Production hardening

## Intentionally deferred

- Payment gateway billing / marketplace
- External job APIs
- AI career coach / AI code review
- Real-time video calling
- Full Playwright suite (architecture prepared)

**END OF IMPLEMENTATION — CodeCrafters Learning Platform v1.0 Enterprise**
