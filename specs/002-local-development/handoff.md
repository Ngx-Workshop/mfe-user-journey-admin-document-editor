# Handoff: Local document development

Status: Complete (local scope) · Updated: 2026-10-03
[Spec](spec.md) · [Plan](plan.md) · [Tasks](tasks.md)

## Delivered

Assessment-style environment replacement and isolated service mode are in place.
Editor npm run dev:bundle serves the watched static bundle on 4201 for the signed-in
admin shell’s per-browser remote-entry override. Development calls localhost:3007; production
retains /api/documents. The original bootstrap and frontend authentication guard are preserved.
Service npm run start:local binds 127.0.0.1:3007 and uses only document_local on
127.0.0.1:27017 with local-document-admin. Roles remain enforced. Normal and
production authentication delegate to the original AuthenticationGuard, preserving
public route metadata. Local mode restricts origins and peer addresses.

## Evidence

- Editor: 8 ChromeHeadless tests pass, including production/development request
  mapping. Production build passes; its generated
  JS contains /api/documents and no http://localhost:3007 API URL.
- Service: 29 tests pass (15 section HTTP tests + 14 local guard cases).
- Nest build/OpenAPI generation passes with GENERATE_OPENAPI=true; normal serving
  rejects that generation-only mode.
- Real local MongoDB/HTTP: section creation from browser, persisted reload, workshop
  navigation, workshop/default page creation, page save/read and explicit guarded
  listing pass. Disallowed-origin requests return 403; hosted-origin preflight passes.
- Local smoke-test records were removed by their exact IDs from document_local.
  Existing application on 4201 remained running throughout verification.

## Usage and limits

Run MongoDB, then service npm run start:local and editor npm run dev:bundle in separate
terminals. Use the per-browser remote entry http://localhost:4201/remoteEntry.js
and open https://admin.ngx-workshop.io/document-editor. See docs/development.md. The local database begins empty; Create Section
starts the workflow. Uploads are not implemented by this service; use image URLs.
The hosted shell still requires sign-in. On 2026-10-03 the hosted document-editor
page loaded the watched local bundle, displayed the empty local section catalog,
and opened/cancelled Create Section successfully. No production
deployment/publication was performed for this change. Local services were left
running for the user; production release is outside this feature's scope.
