# Folder Structure (v1.0 Enterprise)

```text
client/
  public/                 # robots.txt, sitemap.xml, icons
  src/
    components/           # UI + domain widgets + common (DocumentHead, EmptyState, ErrorBoundary)
    contexts/             # auth, theme, sidebar, providers
    i18n/                 # locale + RTL architecture
    layouts/              # public + portal shells
    pages/                # feature pages (lazy-loaded)
    routes/               # AppRouter + lazy-pages
    services/             # API clients
    test/                 # Vitest setup

server/
  src/
    config/               # env, swagger, feature flags, saas defaults
    constants/
    controllers/
    jobs/                 # queue-ready workers
    middlewares/          # auth, RBAC, rate-limit, sanitize, tenant, feature-flag
    models/
    repositories/
    routes/v1/
    services/
    utils/                # logger, cache, jwt, query
    validators/
  tests/                  # Vitest unit/integration
  uploads/                # auth-gated static files

docs/                     # architecture, security, deploy, role guides, release notes
scripts/                  # backup/restore
.github/workflows/        # CI/CD
docker-compose*.yml
```
