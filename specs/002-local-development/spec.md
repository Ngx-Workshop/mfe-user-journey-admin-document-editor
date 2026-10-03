# Feature: Local document development
Status: Complete (local scope) · Updated: 2026-10-03

## Scope and acceptance
Mirror the assessment pair's environment replacement and isolated local service
pattern while preserving document section work, production auth and API paths.
- FR-001 / AC-001: Development watch bundles call localhost:3007; production
  bundles retain /api/documents. The signed-in admin shell loads
  http://localhost:4202/remoteEntry.js through its per-browser Dev Mode override.
- FR-002 / AC-002: npm run start:local uses document_local on loopback MongoDB:27017,
  a synthetic admin and HTTP loopback binding. Unknown origins/remote clients and
  different DB URIs are rejected; production and normal mode use platform auth.
- FR-003 / AC-003: Local section/workshop/page CRUD reaches real isolated MongoDB;
  unrelated servers and production records are untouched.
- FR-004 / AC-004: Document local commands, ports and limitations; keep upload
  ownership external (image URL entry works, uploader is absent in this service).

## Constitution Check
Local mode is explicit and database-scoped. Production API/roles and federation
exports remain compatible. Verify auth restrictions, builds, tests and local HTTP.
