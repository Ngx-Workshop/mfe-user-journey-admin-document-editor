# Handoff: Page authoring pages

Status: Implemented; integration pending
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)
Updated: 2026-10-06

## Delivered behavior

Active-page editing moved from sidebar rows to the document toolbar. Create/edit
actions navigate to guarded dedicated forms, not modals. The routed view model
loads fresh section/workshop references and validates page ownership; the shared
presentation renders a required name and creation-only PAGE/EXAM selection.
Existing create/rename commands reconcile confirmed workshop responses.

Pending writes block duplicate submission, editing and route departure; failed
reads/writes retain useful state with explicit recovery/authorization messages.
Success opens the new/edited page; cancel returns to the originating/existing
page or an empty-workshop catalog. Confirmed writes with failed return navigation
or missing new-page references cannot be resubmitted. Delete dialogs, ordering,
block serialization and the user's existing sidebar margin are preserved.

## Acceptance and verification evidence

| Scenario/check | Method | Result | Limitation |
| --- | --- | --- | --- |
| AC-001 | Toolbar href/click, sidebar actions and no-dialog assertions | PASS | Router/component doubles |
| AC-002/003 | Exact create EXAM/name-only rename bodies, confirmed selection and editor return | PASS | Mocked HTTP; block presentation stubbed |
| AC-004 | Denied/server failure retry, pending guard, duplicate gates, navigation failure | PASS | Mocked HTTP/router failure |
| AC-005 | Fresh-read retry, missing workshop/page, reused edit route | PASS | Mocked HTTP |
| AC-006 | Cancel to origin and empty-workshop catalog | PASS | Simulated host |
| Focused regressions | Karma ChromeHeadless command in development guide | PASS | 27 tests, including ordering/state/projection |
| Production compilation | npm run build -- --output-path /tmp/document-editor-page-authoring-041aeac6 | PASS | Separate temporary bundle, removed; watched output untouched |
| IDE test discovery | runTests with focused absolute paths | UNAVAILABLE | Tool found no tests; Karma ran them successfully |
| Local availability | HEAD localhost:4201/remoteEntry.js and localhost:3007/navigation/sections | PASS | HTTP 200 is availability, not journey verification |
| Hosted acceptance | Open admin document editor | BLOCKED | Redirected to auth sign-in |

No dependencies were installed or changed, no live writes or deployment were
attempted. Existing npm user-config and host Material collision warnings were
observed, not changed.

## Contracts and external-owner handoff

| Owner | Required action | Ordering and acceptance |
| --- | --- | --- |
| mfe-shell-admin | Mount additive create/edit child routes beneath existing document remote | Serve updated remote, then verify toolbar/direct links, focus and narrow layout in an authenticated session |
| service-document / gateway owner | Verify existing page-create and name-update POSTs, authorization and persistence | No DTO/API producer release required; verify new reference/name survive reload and permission denial preserves edits |

URL workshopId remains the workshop slug; request workshopId remains Mongo ID.
Page IDs, editor URLs, default App/named Routes, federation and dependencies remain
compatible. No producer/consumer contract migration or data delivery order change.

## Remaining work and context maintenance

Only X001 live integration acceptance remains. Restore an authenticated hosted
session using the existing localhost remote override, open a document, exercise
both forms/cancel, then verify authorized local create/rename and reload persistence.
Do not infer integration from mocks or endpoint availability.
Architecture, development guide and feature index are updated. Constitution
unchanged; implementation follows the existing typed MVVM/inline BEM rules.

## Toolbar styling follow-up - 2026-10-06

Create/edit forms now place their toolbar outside the constrained main content,
matching the editor's full-width primary background, on-primary filled back
button, 56px sticky offset/minimum height, stacking order and 12px button spacing.
Controls wrap on narrow screens; the form body remains centered at 720px.

PASS: all 16 page-authoring ChromeHeadless tests, including computed-style and
full-width layout checks on both create and edit routes.
Command: `npm test -- --watch=false --browsers=ChromeHeadless
--include='../testing/app/components/workshops-pages/documents/page-authoring.spec.ts'`.
PASS: production build to `/tmp/document-editor-page-toolbar-041aeac6`, removed
after validation; watched output untouched. Hosted acceptance remains pending
authentication as recorded above. No routes, form behavior or contracts changed.
