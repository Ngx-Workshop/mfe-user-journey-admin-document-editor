# Implementation plan: Page authoring pages

Status: Implemented; integration pending
Spec: [spec.md](spec.md)
Updated: 2026-10-06

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Angular Material/CDK, RxJS, document-contracts 0.0.33
**Storage**: Browser selection state; service-document persistence
**Project Type**: Host-mounted Angular document authoring remote

## Design and requirement mapping

| Requirements | Approach |
| --- | --- |
| FR-001 | Detail toolbar links; remove sidebar edit action and obsolete modals |
| FR-002/003 | Shared PageFormComponent; CreatePageComponent typed form/view model |
| FR-004 | Signals, disabled form, canDeactivate pending guard, saved-state navigation recovery |
| FR-005 | Reserved create-page and edit-page/:documentId routes before generic document ID; fresh section workshop read and slug lookup; reused route subscriptions |
| FR-006 | Validate return page against workshop references, otherwise first ordered page or catalog |

Files: `src/app/app.routes.ts`, document components under
`src/app/components/workshops-pages/documents`, sidebar page list,
`testing/app/components/workshops-pages/documents/page-authoring.spec.ts`.
The existing sidebar spacing change remains untouched.

## Contracts, delivery and migration

Read [contracts](../../docs/api-contracts.md) and
[readiness](../../docs/document-readiness.md). Workshop URL uses slug, commands use
Mongo ID, page routes use page ID. Existing POST create/rename endpoints return
WorkshopDto; reconcile through WorkshopEditorService. No HTTP logic is added to
components, no DTO/producer/consumer migration, dependency or federation changes.
New routes live below the existing section/workshop parent and are additive;
existing document links remain valid. Renaming never submits html/pageType.

No external code change or producer-first release is required. service-document
and gateway owners verify real auth/persistence; mfe-shell-admin verifies mounted
routes after the updated remote is served. Do not deploy for validation.

## Verification and Constitution Check

Router/component/HTTP tests cover AC-001 through AC-006, exact request shapes,
fresh context, empty/missing data, save/load retry, route departure gates,
navigation failure and confirmed-state synchronization. Retain ordering tests and
run state/projection regressions; compile the production bundle separately from
the watched development output. Physical browser/host/service checks are distinct.
Typed MVVM, Material UX/accessibility, inline BEM and unchanged contracts satisfy
the constitution. No intentional deviation; existing default-page/deletion and
browser-close limitations remain outside scope.
