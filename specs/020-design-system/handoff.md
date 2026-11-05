# Handoff: Document editor design system

Status: Complete
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)
Updated: 2026-11-04

## Delivered behavior

Sections/workshops now use shared action bars, compact catalogue rows and bounded scroll panels. Artwork and sibling hover/focus edit/delete controls remain. Workshop context is a compact heading rather than a hero. Metadata forms use shared panels/buttons with the same typed forms, validators, pending/error states and image picker intents.

Page outline and document content scroll independently within the visible workspace. Narrow screens switch between Content and Pages; choosing a page returns to Content. Page navigation, level/static Published labels and metadata/create controls stay available in a compact toolbar. Ordering rows use native containers, labelled up/down controls and existing immutable commands, with no nested interactive buttons. EditorJS block identity, serialization, save ordering and retry are preserved. Content reading width/typography are locally compacted without rewriting blocks.

Dialogs, galleries and previews inherit the new theme. Static lab JSON/code and instruction code use NgxCodeBlock; editable content and learner draft code retain existing controls. No runner, persistence or publication semantics were introduced.

## Verification

| Check | Actual evidence |
| --- | --- |
| ChromeHeadless suite | PASS: 152 tests. Existing behavioral regressions plus native keyboard-order/pending/failure regression; six old-header/style assertions adapted to shared toolbar/route/artwork outcomes. `/tmp/document-design-tests.log` |
| Strict source / spec types | PASS: tsc app with noUnusedLocals/noUnusedParameters; tsc spec |
| Source layout / whitespace | PASS: npm run check:layout and git diff --check |
| Production | PASS: Node 22 normal production build to `/tmp/document-editor-design-production`, no compiler/budget warnings; `3rdpartylicenses.txt` nonempty (41,296 bytes). `/tmp/document-design-build.log` |
| Development bundle | PASS: rebuilt configured development output for the existing static server (no document watcher was active), `/tmp/document-design-development.log` |
| Hosted catalogue/content | PASS: five real local sections, Angular's seven workshops, nine-page mixed journey, normal EditorJS pages and outline navigation. Real Devicon/image classification renders. |
| Hosted previews | PASS: linked published coding lab instructions/sample JSON/code blocks and local learner textarea; linked ten-question assessment preview starts and renders question/answer controls. No learner submission or server execution invoked. |
| Hosted page setup | PASS: create-page route, name/type controls, disabled Create on empty form, coding-lab gallery loads real metadata and scrolls within the form panel. Left unsubmitted. |
| Mobile | PASS: 390×844 and 375×568. At 375×568 normal content body is 147px high with ~3494px content; End reaches scrollTop 3347. Page is exactly 375×568 and body scrollWidth/clientWidth both 323px. Metadata/gallery body both widths 323px, 270px viewport over 2262px gallery content. Viewport reset after checks. |

Browser verification used the signed-in hosted shell, existing local document service and existing hosted learner-resource endpoints. CRUD/order/save failures and retries use HTTP doubles. No create/delete/reorder/upload/save action was intentionally run against persisted records. No live uploader write, backend deployment, attempt submission or execution was required for this presentation scope.

## Contracts and handoff

App/Routes, route identifiers, resolver ordering, API/DTO/block formats, singleton services, auth, dependencies/locks/Webpack and environment endpoints unchanged. Only presentation components, local layout helpers and relevant tests/docs changed; three inert baseline unused bindings were removed. Root App intentionally remains the existing empty host integration entry.

No outstanding migration tasks or external-owner changes. The active local development dist contains the migration; normal future development can resume the repository's existing watcher command. Screenshot artifacts are in the current Codex visualization directory.

## Context maintenance

Architecture/development and feature index updated. Constitution/workflow remain applicable and unchanged. Existing default/zero-page route, browser-closure/conflict and static publication-label limitations remain outside this migration.
