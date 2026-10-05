# Plan: Edit sections

Updated: 2026-10-05
[Spec](spec.md)

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Angular Material/Router, RxJS, document-contracts 0.0.32,
ngx-asset-manager 21.1.0
**Storage**: service-document persistence; local form/catalog signals and subjects
**Project Type**: Host-mounted Angular document editor remote

## Design and requirement mapping

- FR-001: `section-list.component.ts` wraps each existing workshop anchor in an
  article with a sibling Material icon link. Relative links preserve shell mounts.
  CSS reveals the edit action on hover/focus-within and for hover:none devices.
- FR-002: `app.routes.ts` lazy-loads the existing `CreateSectionComponent` for
  `edit-section/:sectionId` before the dynamic section route. Reactive param/read
  orchestration cancels obsolete requests, resets stale form state, and supports
  retry with explicit errors. No workshop fetch is needed to edit metadata.
- FR-003: `WorkshopEditorService` adds typed GET and PATCH methods with encoded
  IDs and UpdateSectionDto. The shared page selects creation or update based on
  its route. Existing pending/validation/picker behavior is retained.
- FR-004: Reuse `NavigationService.addSection`'s keyed merge; also update the
  selected section when IDs match. Navigate relative to the parent route, not
  by assuming a one-segment child URL. Successful saves block repeated mutations
  while a failed navigation is recoverable.

## Constitution Check

Preserve source edits, host auth/providers, federation exports and versions, section
IDs, workshop/page contracts and editor blocks. Material links/forms and explicit
failure states meet UX/accessibility requirements. Isolated browser tests exercise
actual child routes and mocked HTTP, not production services.

## Contracts and delivery

Upgrade the locally pinned package and lock to 0.0.32. Published contracts expose
GET/PATCH `/navigation/section/{id}`; PATCH accepts optional mutable fields and
returns SectionDto. The form supplies all four mutable fields. No `_id` or
categoriesLastUpdated is sent in the update body. Backend owns authorization and
ID preservation. Confirm the supporting service version is deployed before
releasing the frontend, then smoke-test edit/reload and legacy keys. No backend
source, publishing, or deployment is performed.

## Verification plan

Extend existing section-authoring router/component/HTTP tests for edit link
semantics and focus visibility, direct fresh load, precise PATCH and unchanged ID,
pending departure, failed reads/retry, failed updates, denied/deleted sections,
route-ID changes, and navigation failure after save. Extend environment tests for
GET/PATCH and encoded keys. Run the smallest combined ChromeHeadless selectors and
production template/federation compilation into a separate temporary output path.
Live hover/touch and backend reload checks remain external acceptance.
