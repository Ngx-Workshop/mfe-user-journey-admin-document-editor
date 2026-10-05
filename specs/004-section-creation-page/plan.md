# Plan: Section creation page

Spec: [spec.md](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Angular Material, Router, RxJS, document-contracts 0.0.22,
ngx-asset-manager 21.1.0, Module Federation
**Storage**: Browser form/navigation state; persistence owned by service-document
**Project Type**: Host-mounted Angular document authoring remote

## Design

- FR-001: Lazy-load `CreateSectionComponent` from `app.routes.ts` before `:section`.
  Keep the existing authenticated parent and sections resolver. The catalog uses a
  relative RouterLink, and cancel/success navigates to the parent route.
- FR-002: Move `create-section-modal.component.ts` to `create-section.component.ts`,
  remove dialog dependencies, and extend the typed form and the service request
  Pick of SectionDto. Numeric input uses a nullable control to model blank input
  honestly, with required/finite validation and a narrowed number in the request.
- FR-003: Preserve HTTP errors and pending state. A canDeactivate check blocks
  departure only during submission. A separate created state prevents repeat
  creation if catalog navigation fails.
- FR-004: Retain folder lookup and shell provider ownership. Reuse the library's
  `assetPreviewUrl` helper for explicit menu/header assignments, rather than
  guessing URL properties or persisting asset IDs.

## Constitution Check

Strict types, focused components, Material form labels, observable tests, and
explicit error recovery satisfy applicable principles. No federation, provider,
authorization, identifier, workshop/page, ordering, or block-format changes.

## Verification

Use RouterTestingHarness with the actual exported child routes mounted under
`document-editor`; omit only the host auth/resolver boundary in the test fixture.
Mock HTTP covers payload shape, numeric validation, pending departure, retry,
permission failure, cancellation, post-create navigation failure, and picker
behavior. Run ChromeHeadless tests and production template/federation compilation
to a separate temporary output directory. These checks do not establish real
service persistence, auth, uploader writes, or hosted-shell behavior.

## Producer/consumer compatibility

service-document must extend the title-only creation DTO/validation/mapping to
accept and persist summary and both image paths, preserving SectionDto responses,
IDs, and title-only caller defaults. Update Swagger/generated contracts and verify
round-trip reads before releasing the frontend. No storage migration is required
for existing section fields. Backend acceptance is external and pending.
