# Authentication & RBAC (Prompt 002)

## Authentication flow

```text
Login form
  → POST /api/v1/auth/login { email, password, rememberMe }
  → Access token (localStorage) + Refresh token (httpOnly cookie)
  → Redirect to role home (/student | /teacher | /admin | /super-admin)

Protected page
  → Axios attaches Bearer access token
  → 401 → POST /api/v1/auth/refresh-token (cookie)
  → Retry original request once
  → If refresh fails → clear session → /login

Logout
  → POST /api/v1/auth/logout (clears DB refresh hash + cookie)
```

## JWT flow

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access | `localStorage` (`codecrafters-access-token`) | ~15m | API Authorization header |
| Refresh | httpOnly cookie `codecrafters_refresh` | 7d / 30d (remember me) | Rotate access token |

Refresh tokens are stored as SHA-256 hashes on the user document. On refresh, a new refresh token is issued (rotation). Mismatched hashes invalidate the session (reuse detection architecture).

## Roles

- `super_admin`
- `admin`
- `teacher`
- `student`

Menus are driven by `client/src/constants/navigation.js`.

## Demo users (after seed)

Password for all: `Password1`

| Email | Role |
|-------|------|
| superadmin@codecrafters.dev | Super Admin |
| admin@codecrafters.dev | Admin |
| teacher@codecrafters.dev | Teacher |
| student@codecrafters.dev | Student |

```bash
cd server && npm run seed
```

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/logout` | Access |
| POST | `/api/v1/auth/refresh-token` | Refresh cookie |
| POST | `/api/v1/auth/forgot-password` | Public |
| POST | `/api/v1/auth/reset-password` | Public |
| POST | `/api/v1/auth/change-password` | Access |
| GET | `/api/v1/auth/me` | Access |

In development, forgot-password also returns `resetToken` / `resetUrl` for testing without SMTP.

## Security notes

- Passwords hashed with bcrypt (cost 12)
- Strong password rules enforced (length + upper/lower/digit)
- Refresh cookie: httpOnly, SameSite=lax, Secure in production
- Access tokens short-lived
- Email verification fields/helpers are architecture-ready (not required for login yet)
- No social login

## Folder changes

### Server

- `models/User.js`
- `services/auth.service.js`, `services/email.service.js`
- `controllers/auth.controller.js`
- `validators/auth.validator.js`
- `middlewares/auth.middleware.js`, `validate.middleware.js`
- `routes/v1/auth.routes.js`
- `utils/cookies.js`, updated `utils/jwt.js`, `utils/seed.js`

### Client

- Full auth context, axios refresh interceptor
- Pages: login, forgot/reset/change password
- Components: PasswordInput, LoginCard, UserAvatar, ProfileDropdown, LogoutDialog
- Role layouts + super-admin shell
- `constants/navigation.js` role menus
