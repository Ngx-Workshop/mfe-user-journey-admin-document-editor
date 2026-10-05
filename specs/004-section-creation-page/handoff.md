# Handoff: Section creation page

Status: Implemented; backend integration pending
Updated: 2026-10-05
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)

## Delivered

The catalog links to the lazy `create-section` route under the existing authenticated
remote mount. The page replaces the modal with inputs for section title, numeric
summary, menu image path, and header image path. The picker remains scoped to the
documents folder through the shell adapter and can apply a selected asset URL to
either artwork field. Inputs survive HTTP failure; successful creation merges the
response and returns to the catalog. Pending navigation and duplicate POSTs are
blocked, including when navigation fails after confirmed creation.

## Verification

- PASS: `npm test -- --watch=false --browsers=ChromeHeadless
  --include='src/app/components/workshops-pages/section-creation.spec.ts'
  --include='src/app/services/document-api-environment.spec.ts'`: 15 tests.
  Real exported child routes are exercised beneath a simulated host mount;
  auth and the parent's initial catalog resolver are excluded, HTTP is mocked.
  Tests cover catalog CTA, direct route, four-field payload, numeric validation,
  pending departure, failure retry, permissions, cancellation, navigation failure,
  artwork fallback, folder recovery, selected URL assignment, and image uploads.
- PASS: `npm run build -- --output-path
  /tmp/document-editor-section-page-0242db42`: production Angular templates and
  federation compilation; the watched development output was not overwritten.
- PASS: `git diff --check`. Temporary production output removed after verification.
- The IDE test runner did not discover Karma specs; the documented CLI runner
  provided the passing results above.
- No live backend, hosted route, or production uploader-write acceptance is
  claimed. No dependencies were installed.

## Exact external-owner handoff

`Ngx-Workshop/service-document`: Extend POST
`/navigation/section/create-section` to accept
`{ sectionTitle: string, summary: number, menuSvgPath: string, headerSvgPath: string }`.
Validate a trimmed 1-120-character title and finite numeric summary, and persist
both trimmed image paths including empty strings. Preserve admin authorization,
generated IDs, existing SectionDto response shape, and defaults for older
title-only callers. Update DTO/Swagger/generated contracts and add creation/read
round-trip tests. Do not change summary to text without a separate contract decision.

Deploy that backward-compatible producer first, then release this consumer.
Through the shell/gateway, create with non-default metadata, reload, and verify
GET sections returns all four inputs and the header/catalog display configured
artwork. The frontend's Pick of published SectionDto keeps local typing strict
but does not demonstrate that the existing creation DTO accepts these fields.

No package publication, deployment, commit, or sibling-repository modification.
