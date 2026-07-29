# Architecture Overview

## High-level

```text
Browser (Vite React SPA)
    │  Axios → VITE_API_URL
    ▼
Express API (/api/v1)
    │  + platform registries (languages, flags, plugins, AI, engines)
    ▼
MongoDB (Mongoose) — multi-tenant ready (Institute scope)
```

## Principles

1. **Separation** — `client/` and `server/` are independent apps.
2. **Versioned API** — all HTTP APIs live under `/api/v1`.
3. **Foundation first** — routing, layouts, theme, and infra before business domains.
4. **Registry-driven** — languages, workspace types, engines, plugins, feature flags are config — not hardcoded UI lists.
5. **Never execute student code on the API process** — isolated engines only.
6. **Design system** — shared tokens in `client/src/styles/globals.css` (Prompt 000 identity).

## Platform architecture

See **[PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)** for recommendations 1–20 (workspace types, evaluation, versions, AI, tenant, plugins, audit, flags, etc.).

## Request flow (foundation)

1. Client calls `GET /api/v1/health` via Axios instance.
2. Express health controller returns `{ success, message, data }`.
3. Global error + 404 middlewares catch unknown routes and thrown `ApiError`s.

## Role shells

| Path | Layout | Purpose |
|------|--------|---------|
| `/` | Public | Landing |
| `/student/*` | StudentLayout | Student portal shell |
| `/teacher/*` | TeacherLayout | Teacher portal shell |
| `/admin/*` | AdminLayout | Admin portal shell |

Each layout shares sidebar + sticky navbar + command palette placeholder.
