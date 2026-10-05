# Handoff: Shared section asset picker

Status: Implemented; live picker verified
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)
Updated: 2026-10-04

The live modal checks below are historical evidence. The
[004 handoff](../004-section-creation-page/handoff.md) records migration to a page,
explicit picker-to-artwork assignment, local regression results, and the expanded
document creation contract's pending backend support.

## Delivered behavior

The shell app.config registers provideAssetManager({ apiUrl: '/api/uploader' }) with its existing authenticated HTTP client. Both package requirements and federation entries use 21.1.0; singleton sharing preserves ASSET_DATA_SOURCE identity across the host and remote. No provider or second HTTP client was added to the remote's app.config or Routes.

The document dialog resolves the existing documents folder by name via DocumentAssetsService and uses its returned Mongo ID for gallery scope and multipart upload destination. It shows images, accepts image/*, retains selected/uploaded asset state and displays retry after missing/failed folder reads. It does not create folders or silently use root. The section creation request still sends sectionTitle only; selected image persistence needs a separate document-service contract decision.

## Acceptance and verification evidence

| Check | Result | Evidence/limitation |
| --- | --- | --- |
| AC-001 root token, credentialed HTTP and multipart uploader calls | PASS | Shell ChromeHeadless: 3 tests, real appConfig, startup initializers disabled, mocked HTTP backend. |
| AC-002/003 folder ID, image restriction, missing folder and permission retry | PASS | Remote ChromeHeadless: 11 tests including existing section authoring and environment tests; mocked HTTP. |
| AC-004 production builds | PASS | Shell /tmp/admin-shell-asset-integration-production; remote /tmp/document-editor-asset-integration-production. Existing shell CommonJS/unused-file warnings. |
| Existing documents folder | PASS | Signed-in https://admin.ngx-workshop.io/admin-asset-manager lists documents. No production data changed. |
| New host/remote live picker | PASS | Deployed admin shell with localhost:4201 remote opens Create Section, resolves documents, and renders upload destination plus image gallery with zero console errors. Observed scripts load the library from shell /2046.js, with remote /181.js and /140.js; no remote library fallback was observed. Gallery reports 0 matching assets. |
| Real uploader write | NOT ATTEMPTED | Would create a production asset; multipart behavior is covered by the mocked HTTP tests above. |

## Contract and consumer handoff

Shell deployment d314574 is live and includes the provider. If NG0201 reappears in a browser session opened before deployment, reload the admin shell to obtain current provider registration. Document remote owner: restart its webpack watcher if a subsequent federation config change was not picked up; preserve the existing localhost:4201 override and localhost:3007 document service. Both consumers use @tmdjr/ngx-asset-manager 21.1.0 as a singleton. The shell's /api/uploader gateway handles asset reads and uploads, independently of the local document API. No backend changes or package publication required.

## Remaining work

X001 completed for live host/remote folder lookup and picker rendering. The reported NG0201 did not reproduce in the current deployed shell with the local remote. Importing ASSET_DATA_SOURCE in DocumentAssetsService is valid; no remote adapter provider was added. Earlier stale host code is a likely cause, not conclusively established. No real upload was attempted, as it would create a production asset. Existing uploads and stored image URLs remain subject to service permissions. Image selection currently belongs to dialog state and is not serialized by service-document's title-only section contract.

## Context maintenance

Updated architecture.md, development.md, api-contracts.md, feature index and the shell README. Preserved the user's existing package installation and dialog edits. No deployment was performed.
