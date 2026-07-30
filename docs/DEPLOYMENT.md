# Deployment Guide

## Targets

| Target | Notes |
|--------|-------|
| Docker Compose | Full stack: mongo + api + nginx web |
| Vercel | Frontend only (`client/dist`) with API proxy/env |
| Render / Railway / VPS | Backend API + Mongo |
| Nginx + Ubuntu | Reverse proxy, TLS, static SPA |

## Local Docker

```bash
cp .env.example .env
cp server/.env.example server/.env
# set strong JWT secrets before production mode
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:5000/api/v1/health
- Ready: http://localhost:5000/api/v1/ready

## Production compose

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Requirements:

- Distinct `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 chars)
- `CLIENT_URL` / `CORS_ORIGINS`
- `ENABLE_SWAGGER=false`
- Mongo not publicly exposed

## Vercel frontend

1. Root directory: `client`
2. Build: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_URL=https://api.example.com/api/v1`

## Nginx reverse proxy (VPS)

Proxy `/api` and `/uploads` to Node, serve SPA with `try_files`. See `client/nginx.conf`.

## Health checks

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/ready` (503 if Mongo unavailable)
