# Plan: Local document development
[Spec](spec.md) · Status: Complete (local scope)

Use Angular file replacement for environment.ts, with documentsApiBaseUrl and
centralized API calls. Preserve the empty root App and authenticated exported Routes.
Use npm run dev:bundle and the shell’s per-browser remote-entry override; view the
editor at https://admin.ngx-workshop.io/document-editor.
Choose 4202 because another remote already occupies 4201.

Wrap the existing AuthenticationGuard so public-read metadata and production
behavior remain intact. In explicit non-production DOCUMENT_LOCAL_DEV mode require
the exact loopback document_local URI, loopback peer and allowed origins. Apply to
both document modules and explicit page-list guard. Keep RolesGuard unchanged.
Enable local-only CORS; reject serving in OpenAPI generation mode.

## Constitution Check and verification
No production bypass, DB migration, package dependency or publication needed.
Test the guard in normal/production/local modes and frontend API mappings. Run both
builds and regression suites, then exercise real local MongoDB through HTTP.
Use an isolated labeled fixture and remove only that fixture after verification.
