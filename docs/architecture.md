# Document editor architecture

Source baseline: 1e7a26d · Reviewed 2026-10-01.

## Responsibility and stack

Angular 21.1.0 administrator authoring remote for workshop metadata and ordered
pages. Uses Material/CDK 21.1.0, RxJS 7.8.2, TypeScript ~5.9.3, editor-js2 ^21.0.9
and document-contracts 0.0.33. Federation/build-plus are version 20; compatibility
with Angular 21 must be checked, not inferred from the package versions.

The host owns navigation composition and auth context. The root App remains empty;
the shell mounts the authenticated exported Routes. The remote exposes App
(default export) through ./Component and named Routes through ./Routes; webpack
uses the inherited name ngx-seed-mfe and remoteEntry.js. Strict shared singletons
include Angular, RxJS, metadata, headers and editor dependencies. Production webpack
reuses the same configuration.

## Source map

| Area             | Local source                                             | Responsibility                                                          |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Bootstrap        | src/main.ts, src/bootstrap.ts, src/app/app.config.ts     | Standalone app, zoneless detection, HTTP DI interceptors and animations |
| Host entry       | src/app/app.ts, src/app/app.routes.ts, webpack.config.js | Empty root App and host-mounted route tree                              |
| Resolution       | src/app/resolvers/                                       | Sections, workshop slug selection and page lookup                       |
| HTTP access | src/app/services/document-api.service.ts | Stateless typed endpoint requests; no selection, forms or editor events |
| Navigation state | src/app/services/navigation.service.ts | Singleton observable selection state, timestamped replay cache, confirmed merges |
| Commands | src/app/services/workshops.service.ts | Singleton mutation orchestration, response reconciliation and cache invalidation |
| Editor state | src/app/services/editor-state.service.ts | Ordered save queue, latest-failure retry and save notices |
| Catalog/editor   | src/app/components/workshops-pages/{sections,workshops,documents}/| Persisted section catalog, workshop cards and editor/paginator          |
| Workshop authoring | src/app/components/workshops-pages/workshops/create-workshop.component.ts | Routed create/edit metadata and documents-folder thumbnail picker |
| Image selection | src/app/components/document-image-picker/ | Shared image-field action and typed asset-picker dialog |
| Artwork classification | src/app/components/devicon.component.ts | Shared Devicon class detection/rendering; font/CSS supplied by admin shell |
| Context header   | src/app/components/workshops.component.ts                | Section header and nested router outlet                                 |
| Controls/dialogs | src/app/components/workshops-sidepanel/                  | Drag ordering, metadata forms, typed-name delete confirmation           |
| Validation       | src/app/form-validators/match-string.validator.ts        | Name confirmation validator                                             |

## Routes and data flow

Routes are relative to the shell mount point:

- Empty path: userAuthenticatedGuard, fetchSections resolver and section landing.
- create-section: dedicated section authoring page, matched before :section.
- edit-section/:sectionId: the same authoring page, loading via GET and saving
  through PATCH /navigation/section/{id}; matched before :section.
- :section/create-workshop and :section/edit-workshop/:workshopId: dedicated
  workshop authoring pages, matched before :section. Here workshopId is the Mongo
  mutation ID, not the slug used by the existing document editor route.
- :section: resolve section and workshops, then mount WorkshopsComponent.
- :section/workshop-list: catalog; :section alone redirects here.
- :section/:workshopId/:documentId: select workshop by slug and read page by ID.
- :section/:workshopId also resolves a document although no documentId is supplied;
  this is a known gap, not a working default-page redirect.

Section links use persisted IDs; catalog artwork comes from each section's
`headerSvgPath`, with a generic folder icon when no path is configured.
NavigationService exposes the fetched section catalog and merges confirmed
creations/updates by ID, also refreshing the selected section when applicable.
Catalog cards have sibling edit/delete actions revealed on hover/focus or shown on touch.
SectionListComponent opens a section-specific typed-name confirmation dialog.
DocumentApiService sends the bodyless DELETE through WorkshopEditorService; the server rejects nonempty
sections with 409 rather than cascading. Only confirmed single-record deletion
is reconciled by WorkshopEditorService through NavigationService, removing the keyed section and cache.
Selected state belonging to that section is cleared; unrelated state is preserved.
Pending requests block duplicate submissions and dialog dismissal; failures retain
confirmation text and offer retry/cancel. See [011 handoff](../specs/011-delete-sections/handoff.md).
CreateSectionComponent uses a routed typed Material form for create/edit, fresh
section reads, a multiline sectionDescription input, and pending/error signals.
Catalog cards display sectionDescription; the legacy numeric summary is preserved
in response state but not shown or submitted.
WorkshopEditorService coordinates the POST through DocumentApiService. New sections use generic artwork and open an
empty workshop catalog. NavigationService caches workshop requests and selects the
current workshop from that list. Its five-minute timestamped TTL starts on the HTTP response. Concurrent readers
share a request; expired entries refetch and failed entries are removed. Confirmed
mutations merge authoritative responses and invalidate the affected cache. Stale reads
cannot overwrite newer selection or confirmed mutations.

Workshop detail parses document.html only when resolved document data changes.
Sidebar metadata/order changes preserve the block input identity. EditorStateService
snapshots and queues formChanged payloads with concatMap, retains the latest failed
revision for retry and emits notices. The queue survives route destruction but is
in memory: browser reload/closure and cross-client revision conflicts remain open.
The Published chip is static UI, not a publication state.

Workshop creation includes a default page on the server. CreateWorkshopComponent
loads fresh workshops for the route's section and uses a typed Material form for
create/edit name, summary and thumbnail. Confirmed mutations merge by Mongo ID,
invalidate the affected section cache and return to the refreshed catalog.
Pending saves block departure and duplicate submissions; failures expose retry
without discarding edits. Catalog create and workshop-card edit links replace the old
workshop dialogs. Thumbnail URLs outside Cloudinary image delivery are preserved,
and absent thumbnails use a generic image icon.
Dialogs still delete workshops and create/edit/delete pages; the editor supports
PAGE/EXAM values without a distinct exam execution UI. Sort controls clone input arrays/records and commit confirmed response state.
Labelled up/down buttons provide a keyboard equivalent to drag ordering.

## External boundaries

See the local [HTTP contract map](api-contracts.md) for every call, payload, return
shape and discrepancy. The service owns MongoDB, validation and admin authorization.
The remote's guard checks authentication; it does not establish admin rights.
Production uses same-origin gateway paths; development replaces the environment
with localhost:3007. A watched static bundle on 4201 is loaded through the hosted
shell’s remote-entry override. Upload routing is unresolved.

See [readiness](document-readiness.md) for observed gaps and proposed verification.

## Shared asset picker — 2026-10-04

The section and workshop authoring pages consume @tmdjr/ngx-asset-manager 21.1.0. The admin shell owns ASSET_DATA_SOURCE via provideAssetManager({ apiUrl: '/api/uploader' }); the remote's app.config and Routes do not register the adapter or replace host HTTP. Both federation entries share the package as a strict 21.1.0 singleton to preserve token identity.

DocumentAssetsService resolves the existing documents folder by name through the shell data source, and the shared image dialog supplies its Mongo ID to both gallery and upload. Missing/failed folder reads show retry without falling back to root. The picker shows and uploads images only. The frontend sends sectionTitle, sectionDescription, menuSvgPath and headerSvgPath. Published 0.0.33 declares descriptions for creation and updates; CreateSectionDto still does not declare image paths, so creation artwork acceptance needs separate confirmation. The uploader gateway is hosted even when documents use localhost:3007. See [003 handoff](../specs/003-shared-asset-picker/handoff.md) for historical picker verification, [004 handoff](../specs/004-section-creation-page/handoff.md) for creation, [005 handoff](../specs/005-edit-sections/handoff.md) for editing, and [006 handoff](../specs/006-section-description/handoff.md) for current description behavior and contracts.

Workshop pages use the same full image gallery and upload scope. Choosing a selected
or uploaded image returns its usable URL to thumbnail; manual URL entry remains
available. The legacy document image-upload endpoint is no longer used by workshop
authoring. See [007 handoff](../specs/007-workshop-authoring-pages/handoff.md).

## Image picker dialog - 2026-10-05

Section menu/header and workshop thumbnail fields now have labelled Material suffix
buttons opening DocumentImagePickerDialogComponent, not inline galleries.
DocumentImagePickerButtonComponent owns the dialog lifecycle and emits a typed URL
only from afterClosed. Gallery selection or a usable uploaded image closes with its
URL; the originating form control updates and becomes dirty. Cancel, Escape and
backdrop return no value, preserving manual text. Folder lookup happens only on
open. The dialog retains full image-only gallery/upload mode and fixes browsing to
the documents folder. Missing folders and unusable URLs expose retry/reselection
inside the dialog.

The suffix action prevents duplicate dialogs, closes on disable/destruction and
uses Material focus restoration. Loading/pending/saved forms disable the action.
The former Use for menu/header/thumbnail buttons and page-owned asset state are
removed. Existing section header and workshop thumbnail previews remain.
See [008 handoff](../specs/008-image-picker-dialog/handoff.md).

## Devicon or image artwork - 2026-10-05

Section menu/header and workshop thumbnail fields accept image URLs/paths or Devicon
class strings, for example `devicon-angular-plain colored`. IsDeviconPipe recognizes
trimmed CSS-class strings starting with devicon-; similarly named image files such
as devicon-angular.svg remain images. Authoring previews, section/workshop catalog
cards and the context header branch exclusively between MenuDeviconComponent and
the existing image rendering. Menu/header previews use their own field values;
blank previews remain absent and catalog defaults are preserved.

MenuDeviconComponent retains its Material-icon fallback for other callers and
uses --devicon-size for catalog/header sizing. Preview icons are labelled;
catalog/header icons are decorative. The user confirmed that the admin shell
provides existing Devicon font/CSS; the remote does not add a font package or CDN.
The picker continues returning image URLs only. DTO shapes stay unchanged:
menuSvgPath/headerSvgPath/thumbnail now carry either convention locally.
Other consumers must recognize Devicon strings before such records are shared.
See [009 handoff](../specs/009-devicon-artwork/handoff.md).

## Workshop card actions - 2026-10-05

Workshop cards have top-right edit/delete Material actions revealed on hover or
focus within the card, and always visible on no-hover devices. The card's content
is a semantic workshop slug/page link; the Mongo-ID edit link and delete button
are siblings rather than nested links. Clicking them cannot trigger the editor
route. Card content scrolls independently so actions stay anchored for long text.

WorkshopListComponent opens the existing typed-name DeleteWorkshopModalComponent
with the selected WorkshopDto; its confirmation/mutation/refresh behavior is
unchanged. Sidebar controls now contain only workshop navigation and drag ordering.
No endpoint, DTO, authorization, route or federation changes.
See [010 handoff](../specs/010-workshop-card-actions/handoff.md).

## MVVM structure — 2026-10-05

Only DocumentApiService imports HttpClient. DocumentAssetsService is a stateless
adapter to the shell's ASSET_DATA_SOURCE; shared asset UI handles gallery/upload.
NavigationService, WorkshopEditorService and EditorStateService are root singleton
state/command boundaries. Components never call the HTTP adapter directly.

CreateSectionComponent/CreateWorkshopComponent are routed local view models with
typed forms, loading/error/pending signals and cancellable load streams. SectionFormComponent
and WorkshopFormComponent render input form/state and emit actions. SectionCardComponent,
WorkshopCardComponent and DocumentEditorComponent are presentation-only. Catalogs,
context header, detail, sidebars and dialogs orchestrate streams, routes and user actions.
Smaller orchestrators render directly without requiring another presentation component.
Pure document projection/ordering helpers live in src/app/view-models.

All 22 components inline their HTML/SCSS and use BEM for application-owned classes;
the largest file is 227 lines. Dialogs now use stable typed forms and one finite
mutation pipeline, disable forms/dismissal while pending, and retain edits on error.
Page create/edit/sort responses reconcile current workshop state without redundant
refreshes. Confirmed deletions reconcile first; background section refresh never
changes route selection. See [012 handoff](../specs/012-mvvm-refactor/handoff.md).

## Route and source organization — 2026-10-05

The document detail route definitions now live directly in `src/app/app.routes.ts`
under the existing `:workshopId` parent. `workshop-detail.routing.ts` was removed;
empty/document-ID children, resolver order, fallback and lazy component loading are
preserved. The host still consumes the same named `Routes` federation export.

Workshop-page components are grouped by feature under
`src/app/components/workshops-pages/sections`, `workshops` and `documents`.
Section/workshop folders contain their catalog, authoring and presentation components;
`documents` contains the detail orchestrator and editor presentation.

Specs live in repository-root `testing/app`, mirroring the application folder tree.
Karma explicitly discovers `../testing/**/*.spec.ts` relative to `src`, and the
spec TypeScript config includes the testing tree. Production source contains no specs.
See [test layout and commands](../testing/README.md).
