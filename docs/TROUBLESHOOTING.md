# Troubleshooting Guide

| Symptom | Check |
|---------|-------|
| API starts but routes fail | `GET /api/v1/ready` — Mongo connected? |
| Login rate limited | Wait for auth limiter window; check IP proxy/`TRUST_PROXY` |
| CORS errors | `CLIENT_URL` / `CORS_ORIGINS` match browser origin |
| Uploads 401 | Auth required for `/uploads` — send Bearer token |
| Swagger missing in prod | Expected unless `ENABLE_SWAGGER=true` |
| Production boot fails | Weak/missing JWT secrets |
| Client blank after deploy | Nginx SPA `try_files` / Vercel rewrites |
| Seed failures | Run base `seed` + `seed:courses` first |
