# Testing Guide

## Stack

| Layer | Tool |
|-------|------|
| Server unit/integration | Vitest + Supertest |
| Client unit | Vitest + React Testing Library |
| E2E architecture | Playwright (recommended next) |

## Commands

```bash
npm test --prefix server
npm test --prefix client
npm test                 # root aggregator
```

## Current scaffolding

- `server/tests/security.unit.test.js`
- `server/tests/health.integration.test.js`
- `client/src/components/common/*.test.jsx`

## E2E architecture (Playwright)

Suggested flows:

1. Login → student dashboard
2. Open helpdesk ticket
3. Verify certificate public page
4. Admin finance dashboard smoke

Install later:

```bash
npm init playwright@latest
```
