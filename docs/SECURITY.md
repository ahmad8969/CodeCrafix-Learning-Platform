# Security Guide

## Controls implemented

- Helmet + HSTS (production)
- CORS allowlist + credentials
- Rate limiting (global, auth, public verify)
- Request sanitization against NoSQL operator injection
- JWT algorithms/issuer/audience verification
- Refresh token rotation + reuse detection
- Secure httpOnly cookies
- Authenticated upload serving
- RBAC + object ownership checks
- Internal helpdesk notes filtered for students
- Production error responses without stack/details
- Swagger gated in production

## Auth notes

- Access token short-lived
- Refresh cookie path scoped to `/api/v1/auth`
- Remember-me preserved across refresh rotation
- Email verification architecture-ready on User model
- Single active refresh hash (device-session baseline; multi-device policy expandable)

## Operational recommendations

1. Rotate secrets regularly
2. Terminate TLS at Nginx/CDN
3. Keep Mongo private
4. Enable backups and restore drills
5. Monitor auth rate-limit spikes
6. Prefer CSP on SPA hosting layer
