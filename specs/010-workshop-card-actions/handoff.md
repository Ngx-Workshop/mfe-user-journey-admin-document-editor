# Handoff: Workshop card actions

Status: Implemented; live integration pending
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)
Updated: 2026-10-05

## Delivered behavior

Edit/delete actions now appear at the top-right of workshop cards, not the sidebar.
Hover/focus within the card reveals them; no-hover devices show them continuously.
Both controls are labelled semantic Material actions. Card content is a separate
editor anchor, with sibling edit anchor/delete button; the outer article has no
routerLink. Edit uses the existing workshop Mongo-ID route, content uses slug/page
ID, and delete opens the existing name-confirmation dialog for that WorkshopDto.
Content scrolling retains anchored actions for long summaries.

Sidebar workshop navigation/CDK drag ordering remain. Existing artwork, card
dimensions/animation, create/edit pages and dialog confirmation/mutation/refresh
are retained. No HTTP call moved into the card component; WorkshopListComponent
only opens the existing dialog. No dependencies, routes, API/DTOs, backend auth or
federation changes.

## Verification

| Check | Result | Evidence/limits |
| --- | --- | --- |
| AC-001/002 | PASS locally | Card actions are siblings of the content link, labelled, absent from sidebar; real focus shows computed opacity/pointer events. Initial media-dependent visibility checked in ChromeHeadless. |
| AC-003 | PASS locally | Correct card/editor/edit hrefs, real edit navigation, selected-card delete dialog, unchanged router URL and no editor page request on actions. |
| AC-004 | PASS locally | Wrong name disables confirmation, cancel performs no mutation and restores focus; exact {_id} POST followed by section refresh removes card. Sidebar drag/navigation and existing artwork/authoring/picker regressions pass. |
| Long content | PASS locally | Content actually scrolls while the revealed action group's viewport position stays unchanged. Animation disabled only within this measurement test for determinism. |
| Production compilation | PASS | Strict templates/source/federation build; existing section-list warning: 4.14 kB vs 4.00 kB (139 bytes over). |
| Pointer-hover/touch/live host | NOT RUN | Focus CSS is tested; physical pointer/touch and actual backend authorization/persistence remain pending. |

Actual test command: 26 SUCCESS.

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts'
```

Real exported child routes run under a simulated host, excluding root auth/initial
section resolution; HTTP is mocked. Synthetic thumbnail paths produce harmless
404 warnings. A failing focus test caught an incorrectly nested reveal selector;
using &:is(:hover, :focus-within) fixed it before the passing run.
Only the changed workshop scope was run, not the full test suite.

Build: `npm run build -- --output-path
/tmp/document-editor-card-actions-6d08b5df`. Output removed after validation;
watched dist untouched. `git diff --check` passes. Existing npm config warning
unrelated. No dependencies installed or services deployed.

## External handoff and remaining work

No external code change or delivery sequencing required. service-document owns
existing edit/delete authorization and persistence; shell owns authentication and
route mounting. Release owner (X001): hover each card, tab through content/edit/
delete, check no-hover touch visibility, cancel/confirm deletion and verify the
catalog refresh with the real backend. Check long descriptions and hosted layout.

The delete dialog's inherited loading/error behavior and zero-page editor links
were not redesigned. Ordering/backend/page/block contracts remain unchanged.
Local implementation tasks are complete; live acceptance remains pending.

## Context maintenance

Updated architecture, development and feature index; 007 handoff marks its sidebar
placement superseded. API contract map/constitution unchanged because this is a
UI relocation with existing endpoints and principles.
