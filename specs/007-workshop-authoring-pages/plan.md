# Implementation plan: Workshop authoring pages

Status: Implemented; live integration pending
Spec: [spec.md](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Material/CDK 21.1.0, RxJS 7.8.2, document-contracts 0.0.33, ngx-asset-manager 21.1.0
**Storage**: Browser state; persistence owned by service-document/uploader
**Project Type**: Host-mounted Angular document authoring remote

## Design and requirement mapping

| Requirement | Approach |
| --- | --- |
| FR-001/002/004 | Shared CreateWorkshopComponent at :section/create-workshop and :section/edit-workshop/:workshopId, matched before :section. Page-owned fresh list loading with retry, typed signals/form, pending canDeactivate guard. |
| FR-003 | Reuse DocumentAssetsService and published asset URL/error helpers; same full gallery configuration and explicit apply action as sections. |
| FR-005 | Merge confirmed WorkshopDto by ID, update selected workshop when applicable, invalidate only the affected section cache. Return relative to the host mount; do not retry a confirmed mutation. |
| FR-006 | Guard the existing optimization pipe by Cloudinary image-delivery URL shape. |

Replace dialog entry points with router links; remove obsolete create/edit dialog
files. Sidebar edit/delete controls become semantic siblings of the editor link.
Delete and sort behavior remain unchanged. Existing section authoring stays intact.

## Data, compatibility and delivery order

Create POST body: sectionId, sortId, name, summary, thumbnail (no generated ID).
Edit POST body: _id, name, summary, thumbnail; preserve server-owned slug/pages/order.
Existing WorkshopEditorService mutation methods and Result wrapper are retained.
Existing published CreateWorkshopDto requires _id despite server generation, so
retain the existing UpdateWorkshopDto service signature; no cast or fake ID.
No producer change or rollout sequencing is needed for the existing endpoints.
The admin shell must already supply ASSET_DATA_SOURCE and share asset-manager
21.1.0; uploader contracts 0.0.13 are unchanged. No remote adapter registration.

## Verification plan and Constitution Check

Router harness tests mount the real exported children under document-editor,
mocking HTTP/host auth. Cover entry links, direct edit, exact payloads, pending
departure, permissions, load retry/missing records, asset folder scope, uploaded
URL application, cache invalidation and navigation failure. Test Cloudinary and
non-Cloudinary URLs. Run focused Karma specs plus existing section/environment
regressions and production build outside the watched dist folder.

Quality, tests, Material UX, accessibility and simple ownership follow local
principles. Section/page identifiers, block serialization, default App, named
Routes, federation sharing and HTTP ownership are preserved. Existing zero-page
editor links and unrelated sorting/save issues are not redesigned.

## External acceptance

Release owner: in admin shell create/edit with real documents-folder images,
reload persistence and verify access denial, keyboard links and narrow layout.
service-document owns authorization/DTO runtime acceptance; shell/uploader owners
own auth forwarding and image URLs. No packages are published or services deployed.
