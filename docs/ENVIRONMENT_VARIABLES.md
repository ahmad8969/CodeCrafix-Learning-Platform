# Environment Variables Guide

## Root / Compose

See `.env.example`.

## Server (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port |
| `MONGO_URI` | Mongo connection |
| `JWT_ACCESS_SECRET` | Access token secret (required in prod) |
| `JWT_REFRESH_SECRET` | Refresh token secret (required in prod) |
| `JWT_ACCESS_EXPIRES` | Access TTL |
| `JWT_REFRESH_EXPIRES` | Refresh TTL |
| `JWT_REFRESH_REMEMBER` | Remember-me TTL |
| `JWT_ISSUER` / `JWT_AUDIENCE` | JWT claims |
| `CLIENT_URL` | Frontend origin |
| `CORS_ORIGINS` | CSV allowlist |
| `TRUST_PROXY` | Express trust proxy hops |
| `ENABLE_SWAGGER` | Docs toggle |
| `MULTI_TENANT` | Tenant enforcement |
| `LOG_LEVEL` | `debug\|info\|warn\|error` |
| `RATE_LIMIT_*` | Global/auth/verify limits |
| `COOKIE_SAME_SITE` | Cookie policy |

## Client (`client/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL |
| `VITE_APP_NAME` | Display name |
| `VITE_DEFAULT_LOCALE` | i18n default |

Production fails fast if secrets are weak/missing.
