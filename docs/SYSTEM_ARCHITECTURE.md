# System Architecture — CodeCrafters Learning Platform v1.0 Enterprise

## Overview

MERN SaaS LMS with modular domain services:

- Auth & RBAC
- Courses / Curriculum / Learning
- Practice, Assignments, Quizzes
- Enrollments & Live Classes
- Certificates & Gamification
- Finance ERP
- Communication Hub / CRM / Career
- Platform flags, audit, notifications

## Runtime topology

```text
Browser (React/Vite)
  → Nginx (prod) / Vite dev proxy
    → Express API (/api/v1)
      → MongoDB
      → Uploads volume (auth-gated)
      → In-memory job queue (Redis-ready)
```

## Backend layers

```text
routes → validators → controllers → services → repositories/models
                     ↘ middlewares (auth, RBAC, tenant, rate limit, sanitize)
```

## Cross-cutting

| Concern | Implementation |
|---------|----------------|
| Auth | JWT access + httpOnly refresh cookie rotation |
| AuthZ | Role permissions + object-level checks |
| Tenancy | `institute` fields + `MULTI_TENANT` middleware |
| Feature flags | Institute overrides + requireFlag middleware |
| Observability | Request IDs, structured JSON logs, audit logs |
| Jobs | `server/src/jobs/queue.js` queue-ready skeleton |
| Cache | In-memory TTL cache (Redis-ready) |

## Future integrations

OpenTelemetry / Prometheus / ELK, BullMQ/Redis, object storage, SMTP, SSO.
