# Developer Guide

## Setup

```bash
npm run setup
docker compose up mongo -d
npm run seed --prefix server
npm run seed:courses --prefix server
npm run seed:curriculum --prefix server
npm run seed:communication --prefix server
npm run dev
```

## Conventions

- JavaScript/JSX only (no TypeScript)
- Feature folders under `client/src/pages` + `components`
- Server: constants → models → services → controllers → routes
- Prefer shared UI primitives over page-local duplication
- Use `QueryState` / `EmptyState` for async UX

## Production checklist before merge

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. No secrets committed
5. Object-level auth for any new ID route
