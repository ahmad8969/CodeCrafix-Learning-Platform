# Platform Architecture Recommendations (Pre–Prompt 007)

Mandatory foundation for all future prompts. Full product features (Judge0, Stripe, AI providers, etc.) are **architected and stubbed** — not fully productized yet.

## Recommendation map

| # | Topic | Status | Location |
|---|--------|--------|----------|
| 1 | Workspace Types | **Active** | `constants/workspace-types.js`, Lesson.`workspaceType`, lesson UI |
| 2 | Language Configuration | **Active** | `config/languages/registry.js` |
| 3 | Dynamic File Templates | **Active** | `config/languages/templates.js`, Lesson.`starterFiles` / `starterTemplateId` |
| 4 | Auto Evaluation | **Architecture** | `config/evaluation-engine.js`, Lesson.`evaluation`, `POST /platform/evaluate` |
| 5 | Workspace History | **Active** | `CodeWorkspaceVersion`, version APIs + UI panel |
| 6 | AI Ready | **Architecture** | `config/ai-providers.js`, `ai.service.js`, console AI actions |
| 7 | Progress Tracking | **Architecture** | `ProgressEvent`, `POST /platform/progress` |
| 8 | Gamification | **Architecture** | `models/Gamification.js`, course settings flags |
| 9 | Offline Support | **Architecture** | `OfflineSyncOp`, `POST /platform/offline/sync` |
| 10 | Security / Sandbox | **Architecture** | `execution-engines.js`, `sandbox.service.js` — **never** eval on API |
| 11 | Multi-Tenant | **Architecture** | `Institute`, User/Course.`institute` |
| 12 | Plugins | **Architecture** | `plugins.registry.js`, `GET /platform/plugins` |
| 13 | Audit Logs | **Active** | `AuditLog`, login/logout/workspace saves, `GET /platform/audit-logs` |
| 14 | Notifications | **Architecture** | `Notification` + templates, `notification.service.js` |
| 15 | Feature Flags | **Active** | `feature-flags.defaults.js`, institute overrides, Admin PATCH |
| 16 | Session Recording | **Architecture** | `CodingSession` model |
| 17 | Discussion | **Architecture** | `Discussion` model + lesson placeholder UI |
| 18 | Certificates | **Architecture** | `Certificate` / `CertificateTemplate` |
| 19 | Analytics | **Architecture** | `AnalyticsEvent`, progress hooks |
| 20 | Enterprise Standards | **Mandatory** | Validation, errors, folders, a11y, docs — all future prompts |

## Workspace Types (UI contract)

Each lesson has `workspaceType`. Client uses `workspaceTypeMeta` (from API or `client/src/config/workspace-types.js`) to show/hide:

- Editor / Preview / Console / Tests
- Quiz / Assignment / Video surfaces
- Discussion / Resources / AI

Coding types auto-enable live coding when `enableLiveCoding` is not explicitly toggled on save.

## Language registry

Add a language by editing `server/src/config/languages/registry.js` only:

- `monacoLanguage`, `executionEngine`, `starterTemplateId`, `extensions`, `fileStructure`, `enabled`

Templates live in `config/languages/templates.js`. Lessons may override with custom `starterFiles`.

## Execution security

```text
Student code ──► Client browser iframe (Phase 1)
             ──► Docker / Judge0 / WebContainer / Sandpack (future adapters)

API process MUST NOT eval / Function / child_process user code.
```

`POST /platform/execute` returns deferred/planned responses via interchangeable adapters.

## Version history flow

1. Save (manual / auto / upload / reset / restore)  
2. Persist workspace files  
3. Append `CodeWorkspaceVersion` (auto skips unchanged fingerprint)  
4. Student can list / compare / restore from lab History panel  

## Platform API (`/api/v1/platform`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/architecture` | Full registry dump for admin/client bootstrap |
| GET | `/languages` | Languages + templates |
| GET/PATCH | `/feature-flags` | Read / admin update |
| GET | `/plugins` | Plugin catalog + enabled |
| GET | `/audit-logs` | Admin audit trail |
| GET | `/notifications` | In-app feed |
| POST | `/progress` | Progress events |
| GET | `/ai/catalog` | AI actions/providers |
| POST | `/ai/actions` | Placeholder AI facade |
| POST | `/offline/sync` | Offline op batch |
| POST | `/evaluate` | Evaluation engine stub |
| POST | `/execute` | Sandbox adapter stub |

## Workspace version APIs

| Method | Path |
|--------|------|
| GET | `/workspaces/lessons/:id/versions` |
| GET | `/workspaces/lessons/:id/versions/:version` |
| GET | `/workspaces/lessons/:id/versions/compare?a=&b=` |
| POST | `/workspaces/lessons/:id/versions/:version/restore` |

## Folder additions

```text
server/src/constants/workspace-types.js
server/src/config/languages/
server/src/config/execution-engines.js
server/src/config/evaluation-engine.js
server/src/config/feature-flags.defaults.js
server/src/config/plugins.registry.js
server/src/config/ai-providers.js
server/src/models/Institute.js, CodeWorkspaceVersion.js, AuditLog.js,
  Notification.js, ProgressEvent.js, Gamification.js, CodingSession.js,
  Discussion.js, Certificate.js, AnalyticsEvent.js, OfflineSyncOp.js
server/src/services/{audit,notification,feature-flag,progress,ai,
  offline-sync,sandbox,platform}.service.js
server/src/routes/v1/platform.routes.js

client/src/config/workspace-types.js
client/src/config/languages.js
client/src/services/platform.service.js
client/src/components/workspace/version-history-panel.jsx
```

## Enterprise standards (mandatory)

Every future module must ship with:

1. Unit-ready service boundaries  
2. Express-validator (or equivalent) on mutating APIs  
3. Central `ApiError` + error middleware  
4. Reusable UI components  
5. Clean domain folders  
6. Performance (lazy load heavy editors, avoid useless re-renders)  
7. Accessibility basics  
8. Mobile responsiveness  
9. Documentation under `docs/`  
10. Production-safe defaults (no secrets in repo, no in-process code exec)

## Out of scope until later prompts

Full quiz/assignment engines, real AI providers, Docker/Judge0 runners, payment plugins, PDF certificates, offline IndexedDB client, admin plugin UI screens — architecture is in place; product UIs follow Prompt 007+.
