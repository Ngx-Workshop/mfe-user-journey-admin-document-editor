# Document editor architecture

Source baseline: 1e7a26d · Reviewed 2026-10-01.

## Responsibility and stack

Angular 21.1.0 administrator authoring remote for workshop metadata and ordered
pages. Uses Material/CDK 21.1.0, RxJS 7.8.2, TypeScript ~5.9.3, editor-js2 ^21.0.9
and document-contracts 0.0.34. Federation/build-plus are version 20; compatibility
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
| Resolution       | src/app/features/document-editor/resolvers/                                       | Sections, workshop slug selection and page lookup                       |
| HTTP access | src/app/features/document-editor/api/document-api.service.ts | Stateless typed endpoint requests; no selection, forms or editor events |
| Navigation state | src/app/features/document-editor/state/navigation.service.ts | Singleton observable selection state, timestamped replay cache, confirmed merges |
| Commands | src/app/features/document-editor/state/workshops.service.ts | Singleton mutation orchestration, response reconciliation and cache invalidation |
| Editor state | src/app/features/document-editor/state/editor-state.service.ts | Ordered save queue, latest-failure retry and save notices |
| Catalog/editor   | src/app/features/document-editor/pages/{sections,workshops,documents}/| Persisted section catalog, workshop cards and editor/paginator          |
| Workshop authoring | src/app/features/document-editor/pages/workshops/create-workshop.component.ts | Routed create/edit metadata and documents-folder thumbnail picker |
| Page authoring | src/app/features/document-editor/pages/documents/create-page.component.ts | Routed creation/renaming view model with shared PageFormComponent |
| Image selection | src/app/features/document-editor/components/document-image-picker/ | Shared image-field action and typed asset-picker dialog |
| Artwork classification | src/app/features/document-editor/components/devicon.component.ts | Shared Devicon class detection/rendering; font/CSS supplied by admin shell |
| Context header   | src/app/features/document-editor/pages/workshops/workshops.component.ts                | Section header and nested router outlet                                 |
| Controls/dialogs | src/app/features/document-editor/components/workshops-sidepanel/                  | Drag ordering, metadata forms, typed-name delete confirmation           |
| Validation       | src/app/features/document-editor/forms/match-string.validator.ts        | Name confirmation validator                                             |

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
- :section/:workshopId/create-page and :section/:workshopId/edit-page/:documentId:
  dedicated page metadata forms, matched before the generic document ID child.
  The workshop URL uses its slug; mutation bodies use its Mongo ID.
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
Dialogs still delete workshops and pages; page creation/renaming use routed forms.
The editor supports
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
Pure document projection/ordering helpers live in src/app/features/document-editor/utils.

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
`src/app/features/document-editor/pages/sections`, `workshops` and `documents`.
Section/workshop folders contain their catalog, authoring and presentation components;
`documents` contains the detail orchestrator and editor presentation.

Specs live in repository-root `testing/app`, mirroring the application folder tree.
Karma explicitly discovers `../testing/**/*.spec.ts` relative to `src`, and the
spec TypeScript config includes the testing tree. Production source contains no specs.
See [test layout and commands](../testing/README.md).

## Page authoring pages - 2026-10-06

The document toolbar links to Create New Page and Edit Page for the active document;
sidebar page editing is removed while navigation, ordering and deletion remain.
CreatePageComponent loads fresh workshop references by section/slug, validates the
edited page belongs to that workshop, and orchestrates the existing create/rename
commands through WorkshopEditorService. PageFormComponent renders the typed name
form and creation-only type radios (extended by 014). Renaming never changes content or type.

Pending saves disable fields, duplicate submissions and route departure. Failed
reads/mutations expose recoverable errors; failed navigation after confirmed save
retains saved state and prevents duplicate writes. Creation opens the newly returned
page reference; editing returns to the same page. Cancel uses a validated returnPage
query/current edit ID, then the first ordered page or the catalog for empty workshops.
Missing workshop/page links cannot submit against stale singleton selection.
Existing document routes, IDs, block data, endpoints and federation exports remain
unchanged. See [013 handoff](../specs/013-page-authoring-pages/handoff.md).

## Mixed page types — 2026-10-06

Document contracts 0.0.34 drive WorkshopJourneyItem in models/workshop-journey.ts.
PAGE, ASSESSMENT_TEST and CODING_LAB flow through sidebar/paginator, immutable sorting,
delete dialog and command/API boundaries. CreatePageComponent uses a typed kind
choice and conditional resourceId input. It maps PAGE to create-page and external
kinds to add-reference. No foreign service adapters are needed for placeholders.
Installed coding-labs 0.0.6 and assessment-test 0.0.18 contracts remain available for
future resource selection/rendering.

NavigationService resolves a placement from current workshop metadata. Only PAGE
fetches document HTML. The detail view consumes a resolved-entry view model and
renders ExternalPagePlaceholderComponent for either external kind; block saves are
guarded to PAGE. Renaming external entries changes the workshop label only.
Service-document defaults existing untyped references to PAGE, correcting local
pages previously mislabelled CODING_LAB without resourceId. See 014 handoff.

## Coding lab gallery — 2026-10-06

For creation with CODING_LAB, PageFormComponent embeds CodingLabPickerComponent
instead of a manual ID field. Stateless CodingLabsApiService reads the hosted
/api/coding-labs/labs in both environments (document mutations still use local
localhost:3007 in development). Contract metadata is HandsOnLabMongo from 0.0.6.
Picker owns search/page/loading/error state; CodingLabGalleryComponent renders
responsive, keyboard-accessible selection cards and status/difficulty/tags/duration.
Archived labs are excluded; draft/published labs retain explicit status badges.

The route view model stores selected metadata and resourceId, suggests the lab title
for pristine/blank names and preserves custom names. Type changes clear selection;
pending/saved state blocks changes. Search, load more and retry preserve selected
summary. Only existing add-reference persists the placement; no lab mutations occur.
Assessment test IDs remain manual; external execution remains Hello world.

## Assessment test gallery — 2026-10-06

AssessmentTestPickerComponent now replaces the manual assessment ID field, completing
the resource selectors introduced in 015. AssessmentTestsApiService reads the hosted
/api/assessment-test in both environments with published AssessmentTestDto types.
The picker owns catalog/loading/error/retry and local name/subject/level search,
subject filtering and 24-card reveal. AssessmentTestGalleryComponent presents
keyboard-accessible metadata cards; questions and answers are never rendered.

CreatePageComponent stores selection, fills resourceId and suggests the test name
for pristine/blank labels. Custom labels survive reselection; type changes clear both
catalog selections. Pending/saved guards apply to both selectors. Document service
receives only the existing placement reference; external detail remains Hello world.

## Assessment learner preview — 2026-10-06

WorkshopDetailComponent selects AssessmentTestPreviewComponent for ASSESSMENT_TEST,
passing resourceId and the workshop label. The view owns local answers/start/result
state; stateless AssessmentTestsApiService reads the exact definition. Input lifecycle
and switchMap cancel stale reads; signals update through takeUntilDestroyed with an
explicit DestroyRef, avoiding the live host's rxjs-interop injection-context mismatch.
Question groups use Material radio choices; complete valid answers gate local review.
No document content editor or attempt mutation is invoked. Coding lab remains the
existing placeholder. This replaces 014/016 assessment placeholder behavior only.

## Coding lab learner preview — 2026-10-06

WorkshopDetailComponent renders CodingLabPreviewComponent for CODING_LAB and the
assessment preview for ASSESSMENT_TEST. ExternalPagePlaceholderComponent is removed.
Stateless CodingLabsApiService reads published learner content. The preview owns
loading/error state and local code FormControl, cancelling stale reads/resetting code
when resourceId changes. LabInstructionsComponent presents safe text-only Markdown
blocks without innerHTML. Hints use native details/summary; samples show published
input/output. Responsive instruction/editor columns stack below 1200px. Code edits
stay local; no execution/submission or editor-block persistence.

## Uniform admin source layout — 2026-10-07

Follow [the shared source convention](source-organization.md). Feature code lives
under `src/app/features/document-editor`; page-only views/models stay beside their
page, reusable views live under `components`, stateless adapters under `api`, and
singleton orchestration under `state`. Tests mirror the responsibility folders.
The app entry files and external integration contracts are preserved.
