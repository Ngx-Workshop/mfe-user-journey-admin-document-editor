# Document editor development

## Local document workflow (2026-10-03)

This mirrors the assessment repositories, using document-specific ports and data.
Prerequisite: MongoDB listening on 127.0.0.1:27017. After npm ci in each repository,
run these commands in separate terminals:

```bash
# service-document
npm run start:local
```

```bash
# mfe-user-journey-admin-document-editor
npm run dev:bundle
```

Open the MFE Orchestrator at https://admin.ngx-workshop.io/list-mfe-remotes. For the
document editor, open the code-icon Dev Mode Options, enable Dev Mode, and set
Remote Entry Point to http://localhost:4201/remoteEntry.js. Then open
https://admin.ngx-workshop.io/document-editor and reload after changes. The override
applies only to your browser; the global registry is unchanged. The document API is http://localhost:3007; data is stored
only in mongodb://127.0.0.1:27017/document_local. Port 4201 avoids the assessment
remote on 4201. This database starts empty; use Create Section, then Create New
Workshop. No production records are copied or required.

The local service sets DOCUMENT_LOCAL_DEV=true and NODE_ENV=development, overrides
MONGODB_URI/PORT, binds only to loopback and supplies local-document-admin. It rejects
other database URIs, non-loopback peers and unapproved origins. CORS allows
https://admin.ngx-workshop.io, http://localhost:4201 and http://127.0.0.1:4201.
Production mode and normal start:dev retain the platform authentication guard and
public-route metadata. Do not tunnel or reverse-proxy local auth mode.

The signed-in hosted shell owns routing and authentication. The root App remains
empty and the exported Routes retain userAuthenticatedGuard. Development bundles
use environment.development.ts for localhost:3007; production bundles use
/api/documents. Port 4201 serves assets, not a standalone editor.
Build production into a separate folder while the bundle watcher runs:
npm run build -- --output-path /tmp/document-editor-production-check.

Navigation, content and document mutations use the environment API base.
Section/workshop image selection and uploads use the shell's hosted uploader
adapter, not the local document service. Manual image URL entry also works.
The document service has no uploader endpoint.

Verified: 29 service tests, 8 browser unit/component tests, production builds,
production API URL isolation and live browser/HTTP checks against local MongoDB.
See [local setup handoff](../specs/002-local-development/handoff.md) for scope and limits.

## Local setup and host integration

Use the repository's package-lock.json with npm ci. CI uses Node 22; use a Node 22
release compatible with the pinned Angular toolchain. Packages must be available
from the configured registry; do not embed registry credentials in source.

| Command                                               | Purpose / prerequisites                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| npm ci                                                | Install locked dependencies                                                         |
| npm start                                             | Stock Angular server; not the hosted-shell development workflow                     |
| npm run build                                         | Production bundle into dist/mfe-user-journey-admin-document-editor                  |
| npm run watch                                         | Development watch build                                                             |
| npm run serve:bundle                                  | Static bundle server on 4201; requires existing output                              |
| npm run dev:bundle                                    | Watch + static bundle server for the hosted-shell override                          |
| npm test -- --watch=false --browsers=ChromeHeadless   | Configured Karma runner; requires Chrome and real specs                             |
| ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json | TypeScript source check; does not validate Angular templates or runtime integration |

The shell mounts the exported Routes and supplies authentication context.
No frontend authentication bypass or local API proxy is needed.

## Verification by change

For UI/behavior changes run the production build, relevant unit/component checks
and host-mounted acceptance scenarios. Cover catalog/deep links, CRUD, sorting,
block round-trip, request failure/retry, permission denial, keyboard/focus and narrow
viewports where affected. Use HTTP test doubles for local failures and report their
limits. Section creation now has six browser component/HTTP checks in
src/app/components/workshops-pages/section-creation.spec.ts; unrelated journeys
still need coverage. There is no package lint script.

## Migration checks — 2026-10-01

- PASS: TypeScript command above using the installed dependencies.
- PASS: source/configuration/legacy workflow review; no frontend unit spec files found.
- PASS: 38 local documentation links resolve; all four feature templates exist,
  constitution gates are present and plan metadata fields match the legacy parser.
- PASS: bash syntax checks for all five retained helper scripts. Feature-changing
  helper commands were not executed.
- NOT RUN: npm ci, production build, Karma/browser journey, gateway/auth/upload
  integration or deployment. This was a documentation migration, not runtime work.

## Known limitations

See [readiness](document-readiness.md) for route/default-page, cache, save ordering,
loading/error recovery, accessibility and static publication-label findings.
[Contracts](api-contracts.md) records response typing, section-key and upload gaps.
Angular 21 with federation/build tooling 20 is an existing compatibility constraint;
this migration does not upgrade dependencies or claim a host build was verified.

## Section creation verification — 2026-10-03

Both production builds, service OpenAPI/contract generation and contract compilation
pass. Service tests: 15 passing; editor ChromeHeadless tests: 6 passing. Service tests
mock persistence and remote identity while exercising real validation/schema defaults
and role enforcement. Editor tests mock HTTP. No live database, auth or gateway test
was performed. See [feature handoff](../specs/001-create-sections/handoff.md).
Earlier migration results above are historical; generated-contract compilation now
passes, while the direct TypeScript deleteOutDir configuration issue remains separate
from the successful Nest production build.

## Shared asset picker setup — 2026-10-04

Current description behavior (2026-10-05): with the user's installed
document-contracts 0.0.33, create/edit pages now use a multiline sectionDescription
instead of numeric summary. Catalogs display descriptions and requests omit
summary while preserving its response values. All 24 focused ChromeHeadless tests
and the production build pass. The existing section-list stylesheet warning
remains 139 bytes over the 4.00 kB warning threshold. No dependency installation
was needed. Live persistence/defaults for existing records remain unverified; see
the [description handoff](../specs/006-section-description/handoff.md).

Current section editing: catalog cards expose a labelled edit icon on hover or
keyboard focus, and always on no-hover devices. `edit-section/:sectionId` loads
fresh section metadata and saves through the published GET/PATCH endpoints in
document-contracts 0.0.32. The same form/picker handles create and edit, retaining
the user's full gallery view. See the
[editing handoff](../specs/005-edit-sections/handoff.md).

Verified locally: 22 focused ChromeHeadless router/component/HTTP and API
environment tests pass. Production compilation passes to a separate temporary
output path, leaving the watched bundle intact. Section-list styles exceed the
4.00 kB warning threshold by 139 bytes (4.14 kB); no build failure or budget
increase. Hosted editing and real persistence remain unverified.

Current authoring UI: section creation is now a dedicated `create-section` route,
not a modal. The form includes sectionDescription text and menu/header image paths.
The shell adapter and folder lookup below are unchanged. Expanded document-service
creation support must be delivered before releasing this frontend; see the
[section creation page handoff](../specs/004-section-creation-page/handoff.md).

Local verification on 2026-10-05: 15 ChromeHeadless router/component/HTTP and API
environment tests pass using the two relevant `--include` selectors. The production
build passes with output in `/tmp/document-editor-section-page-0242db42`, leaving the
watched bundle untouched; that temporary output was removed after verification.
Tests simulate the host mount and mock HTTP; live persistence of the expanded
request and hosted route acceptance remain pending.

Deploy or serve the changed mfe-shell-admin before using the shared picker: the host supplies provideAssetManager({ apiUrl: '/api/uploader' }) in its root app.config. A local document remote cannot apply a provider from its standalone app.config to the hosted shell. Both host and remote require the same singleton @tmdjr/ngx-asset-manager 21.1.0. Restart the remote watcher after federation configuration changes, then reload the browser.

Only the document API uses the local service-document on port 3007. Asset requests intentionally use the authenticated hosted /api/uploader gateway; service-document has no uploader endpoint. The existing documents folder is resolved to its ID before showing the image-only gallery/upload control. Do not pass the folder name as folderId or uploadFolderId. Legacy WorkshopEditorService.uploadImage still targets the separate unresolved endpoint; workshop authoring no longer calls it.

Verified: remote ChromeHeadless 11 passing tests; shell ChromeHeadless 3 passing tests; both production builds to separate /tmp output paths. Mock tests cover token mapping, folder IDs, credentials, image upload restriction, missing-folder/403 recovery and section creation. Live folder lookup and picker rendering are verified in deployed shell d314574 with the localhost:4201 remote: Destination: documents, image gallery, and no console errors. The earlier missing ASSET_DATA_SOURCE error did not reproduce. Reload the admin shell after a host deployment and restart the remote watcher after federation configuration changes. Real production uploads were not attempted; no production mutation was performed.

## Workshop authoring pages - 2026-10-05

Create New Workshop now opens `:section/create-workshop`; the sidebar's labelled
edit link opens `:section/edit-workshop/:workshopId` using the workshop Mongo ID.
Both pages use fresh section workshop reads and the full documents-folder image
picker. Use the image field's Choose thumbnail image action, or enter a URL.
The picker now opens in a modal as described below; selection closes it and returns
the URL to the field.
Creating without an image remains allowed; editing keeps the existing required
thumbnail validation. Success refreshes the section catalog; pending saves block
departure and duplicate submission. Read/save/folder failures are recoverable.

PASS: 44 focused ChromeHeadless tests (20 workshop tests plus 24 existing section
and environment regressions):

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

PASS: production compilation using `npm run build -- --output-path
/tmp/document-editor-workshop-pages-6d08b5df`; temporary output removed, watched
bundle untouched. Existing section-list stylesheet warning remains 139 bytes over
4.00 kB. Tests use simulated host routing and mocked HTTP; synthetic thumbnail
paths cause harmless test-server image 404 warnings. No dependencies were changed.
The editor test-discovery tool found no tests, so the actual configured Angular
Karma runner above was used. Live backend persistence/auth, hosted navigation and
real uploader writes were not run. See [007 handoff](../specs/007-workshop-authoring-pages/handoff.md).

## Image picker dialog - 2026-10-05

All section menu/header and workshop thumbnail fields on create/edit pages use
labelled image-field buttons to open a shared full asset-manager modal. No uploader
reads occur until opening. Selecting a usable gallery image or uploading an image
closes the modal; afterClosed returns the URL to only the originating field and
marks it dirty. Cancel/Escape/backdrop preserve manual values. The inline gallery
and Use for actions are removed. Existing previews, payloads and host providers
are unchanged; picker errors/retry remain inside the modal.

PASS: 57 focused ChromeHeadless tests:

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/document-image-picker/document-image-picker.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Checks use real Material dialogs/picker components with mocked HTTP, including
close-result timing, cancel/Escape/backdrop, focus return, folder scope, uploads,
failure recovery, disabled/destroy cleanup and reused edit-route changes. Existing
CRUD/environment regressions pass. Synthetic image paths still cause harmless
test-server 404 warnings.

PASS: production build to `/tmp/document-editor-image-dialog-6d08b5df`, removed
after verification; watched dist unchanged. The existing section-list style warning
remains 139 bytes over 4.00 kB. No dependency or federation changes.
Live host, real uploader writes/image delivery and physical narrow-screen/keyboard
acceptance remain unverified. See [008 handoff](../specs/008-image-picker-dialog/handoff.md).

## Devicon or image artwork - 2026-10-05

Section menu/header and workshop thumbnail fields can contain a URL/path or a
Devicon class string, e.g. `devicon-angular-plain colored`. Each preview renders
only the appropriate image or icon. Saved section/workshop catalog artwork and
the section header use the same detection. Menu/header preview bindings are
independent; modal image selection still replaces only its originating field.

The admin shell supplies the existing Devicon font/CSS, as confirmed by the user.
No font/dependency/CDN was added. This checkout's standalone page/tests do not
provide Devicon glyph styles; DOM tests verify class routing, not font appearance.
A hosted-browser check redirected to auth sign-in, so glyph rendering could not
be verified. Existing auth-page federation component-ID warnings were observed,
not changed as part of this feature.

PASS: 66 focused ChromeHeadless component/router/HTTP tests:

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/devicon.component.spec.ts' \
  --include='src/app/components/document-image-picker/document-image-picker.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Includes class/path classification, Material fallback, exclusive icon/image
previews on create/edit, section field independence, trimmed POST/PATCH values,
saved catalogs/context header and mocked reload, plus all dialog/CRUD regressions.
Synthetic image URL 404 warnings remain harmless test fixtures.
PASS: production build using `/tmp/document-editor-devicon-6d08b5df`, removed
after validation; watched dist untouched. Existing section-list style warning is
unchanged (139 bytes over 4.00 kB).
Live glyph/font, persistence/authorization, image delivery and other-consumer
compatibility remain pending. See [009 handoff](../specs/009-devicon-artwork/handoff.md).
