# SaaS Readiness

Billing is **not** implemented. Architecture is ready for multi-tenant SaaS.

## Building blocks

- `Institute` model (branding, plugins, flags, storage prefix)
- `MULTI_TENANT` env + tenant middleware
- Feature flags with cache
- Subscription plan defaults in `server/src/config/saas.defaults.js`
- Usage limit placeholders (seats, storage, API)

## Modes

| Mode | Behavior |
|------|----------|
| Single-tenant (default) | Institute optional; global lists |
| Multi-tenant | JWT institute required; cross-tenant blocked |

## Future work

- Subdomain / custom domain resolution
- Plan-based feature entitlements
- Metered usage enforcement
- Per-tenant storage buckets
- Billing provider integration
