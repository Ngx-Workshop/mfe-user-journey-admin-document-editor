# Handoff: Workshop authoring pages

Status: Implemented; live integration pending
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)
Updated: 2026-10-05

The inline picker/Use for thumbnail interaction below is historical.
[008 Image picker dialog](../008-image-picker-dialog/handoff.md) supersedes it:
an image-field action opens the shared dialog and afterClosed populates thumbnail.

## Delivered behavior

Dedicated `:section/create-workshop` and
`:section/edit-workshop/:workshopId` pages replace workshop create/edit dialogs.
The shared typed form loads fresh section workshops, edits by Mongo ID, retains
manual URL entry and uses the shell's image-only full documents-folder gallery/
upload picker. Use for thumbnail explicitly applies the selected/uploaded URL.
Loading/error/retry states retain recoverable edits, pending saves block departure
and duplicate mutation, and confirmed mutations update navigation state, invalidate
the section cache and return to the refreshed catalog.

The sidebar edit link is labelled, keyboard-accessible and a sibling of the editor
link; delete remains a dialog. Existing workshop editor routes still use slugs.
Cloudinary image optimization is retained; other thumbnail URLs are no longer
rewritten. Missing thumbnails render an icon instead of an invalid ngSrc.
Section creation/editing, page metadata, block serialization and federation exports
are unchanged. No dependencies were installed or changed.

## Acceptance and verification evidence

| Check | Result | Evidence and limits |
| --- | --- | --- |
| AC-001/002 | PASS locally | Catalog create href, activated sidebar edit, direct fresh edit values, exact POST bodies, empty-section sortId zero, creation count, route-ID changes and cancel destination. |
| AC-003 | PASS locally | Real picker components with mocked uploader HTTP: documents folder ID, credentials, image-only restriction, upload event, explicit URL application, unusable URL and missing/denied folder retry/manual entry. |
| AC-004/005 | PASS locally | Required whitespace validation, edit thumbnail requirement, pending departure/duplicate prevention, failed reads/saves, missing workshop/section, state merge/current selection, forced catalog refresh after mutation, navigation failure after confirmed save. |
| AC-006 | PASS locally | URL pipe preserves relative/uploader/non-Cloudinary URLs, retains Cloudinary image optimization; catalog renders selected URL and empty-image fallback. |
| Section/environment regressions | PASS | 24 existing checks included in the 44-test run. |
| Production compilation | PASS | Strict source/templates/federation build, existing section-list stylesheet warning: 4.14 kB versus 4.00 kB (139 bytes over). |
| Host/service/uploader integration | NOT RUN | No live persistence, authorization, hosted navigation or real uploader writes. Physical touch/narrow-screen acceptance remains pending. |

Actual test command:

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Result: 44 SUCCESS (20 new workshop tests). Tests mount the real exported child
routes under a simulated document-editor host, excluding root authentication and
initial section resolver, and mock HTTP. Synthetic thumbnail paths produce
harmless image 404 warnings; this is not live image-delivery verification.
The editor test-discovery tool reported no tests; configured Karma ran successfully.
An initial test compilation failure from an optional Asset.storageUrl expectation
was corrected before the passing runs.

Production command: `npm run build -- --output-path
/tmp/document-editor-workshop-pages-6d08b5df`. Temporary output removed after
validation; watched development dist was not overwritten. `git diff --check`
passes. Existing npm config warning is unrelated.

## Contract and consumer handoff

| Owner | Action/interface | Ordering and acceptance |
| --- | --- | --- |
| service-document | Existing workshop create/edit POST endpoints and section workshops GET; accept thumbnail URL and enforce admin authorization | No new endpoint/schema required. Create, rename, reload and verify stable Mongo ID, server-generated slug/default page and unchanged section/page associations. |
| mfe-shell-admin | Existing ASSET_DATA_SOURCE from provideAssetManager with /api/uploader; strict shared ngx-asset-manager 21.1.0 | Keep host provider deployed before consuming picker. Open both new routes directly and from links; verify auth and keyboard/narrow layout. |
| service-uploader/gateway | Existing folders/gallery/upload endpoints through shell adapter, contracts 0.0.13 | Use the existing documents folder; verify real selected/uploaded URL delivery and persistence. Never redirect to folder root or document-service upload endpoint. |

New edit route workshopId denotes Mongo ID; the existing editor workshopId denotes
slug. Create body is sectionId/sortId/name/summary/thumbnail; edit body is
_id/name/summary/thumbnail. No fake create _id, timestamps, assets, pages or
client-generated slugs are sent. CreateWorkshopDto's existing required _id does
not change the established UpdateWorkshopDto service signature. No external code
change, package publication, database migration or deployment was performed.

## Remaining work and context maintenance

X001 remains: run both pages in the hosted admin shell with the supporting document
service and real documents-folder assets. Verify persistence after reload,
authorization denial, image delivery, keyboard navigation and narrow-screen use.
No additional local implementation tasks remain.

Updated architecture, development, API contract map and feature index. Constitution
unchanged. Unrelated zero-page navigation, cache TTL and sort/save readiness gaps
remain outside this feature.
