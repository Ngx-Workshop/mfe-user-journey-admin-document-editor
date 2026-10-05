# Handoff: Image picker dialog

Status: Implemented; live integration pending
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)
Updated: 2026-10-05

## Delivered

Section menu/header and workshop thumbnail inputs on create/edit pages expose
labelled image-picker suffix buttons. The shared Material dialog hosts the full
ngx-asset-manager image gallery/upload interface; folder requests start on open,
not page load. Picking a gallery image or completing an upload with a usable URL
closes the dialog with that URL. The shared suffix action emits only from
afterClosed; the originating control updates and becomes dirty.

Cancel explicitly returns undefined (not Material's default empty-string directive
value), as do Escape/backdrop. Existing manual text/dirty state is preserved.
Unusable image URLs and missing/denied folders show errors/retry in the dialog.
Browsing/upload stay fixed to the documents folder; no root fallback. Pending,
saved and unloaded forms disable the action; duplicate dialogs are prevented,
disable/destruction closes the dialog, and Material restores trigger focus.
Reused section/workshop edit-route loading also closes the old picker.

Removed inline galleries, page-owned asset state and Use for menu/header/thumbnail
buttons. Preserved manual inputs, section header/workshop thumbnail previews,
validation, exact mutation payloads and routes. No provider/package/federation
changes; user-added section preview retained.

## Verification

| Check | Result | Evidence/limits |
| --- | --- | --- |
| AC-001/002 | PASS locally | Real field actions/dialogs: deferred requests, one dialog, gallery selection returns URL only after close, cancellation/Escape/backdrop preserve text, focus returns; each section field/workshop thumbnail tested on create and edit. |
| AC-003 | PASS locally | Real picker with mocked shell HTTP: documents folder ID/credentials, full image gallery, image-only upload and returned URL; missing/403 folder retry and unusable URL reselection. |
| AC-004 | PASS locally | Disabled opening/result rejection, disable/destroy cleanup including pending HTTP cancellation, loading/pending/saved actions and both reused edit-route changes. |
| AC-005 | PASS locally | Section/workshop CRUD, mutation failures, exact field mapping, preview rendering, URL delivery, environment and route regressions. |
| Production build | PASS | Strict Angular source/templates/federation compilation; existing section-list style warning unchanged, 4.14 kB vs 4.00 kB (139 bytes over). |
| Live host/uploader/service | NOT RUN | Real persistence, authorization, image delivery, uploads and physical-device accessibility/layout remain pending. |

Actual command: 57 SUCCESS.

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/document-image-picker/document-image-picker.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Tests mount real exported child routes under a simulated host and mock HTTP/root
auth/initial section resolution. Synthetic image URLs produce harmless test-server
404 warnings, not proof of live image delivery. Initial cancellation regressions
caught Material's default empty-string result; explicitly binding undefined fixed
the behavior. aria-modal is explicitly enabled and checked.

`npm run build -- --output-path /tmp/document-editor-image-dialog-6d08b5df`
passes. Temporary output removed; watched dist untouched. `git diff --check`
passes. Existing npm config warning remains unrelated. No dependencies installed.

## Contract and external handoff

No external change or delivery-order requirement. mfe-shell-admin still owns
ASSET_DATA_SOURCE through provideAssetManager and shares ngx-asset-manager 21.1.0.
service-uploader/gateway retain folders/gallery/upload and credentials contracts;
service-document retains existing metadata endpoints and admin authorization.
Dialog returns string | undefined, not an asset object/ID. No document-service
mutation happens until ordinary form submission.

Release owner (X001): open each field dialog in hosted admin shell; select/upload,
verify close/input/preview, cancel/Escape/backdrop and focus; save/reload to confirm
persistence and real image delivery. Check narrow viewports and keyboard use.
Cancellation during upload cannot guarantee server rollback or remove an asset
already created by uploader. No production uploads/deployment were performed.

## Context maintenance

Architecture, development, HTTP contract map and feature index updated.
007 handoff identifies its old inline interaction as superseded. Constitution,
backend schemas, document/page/block identifiers and federation exports unchanged.
No local implementation tasks remain; X001 is pending live acceptance.
