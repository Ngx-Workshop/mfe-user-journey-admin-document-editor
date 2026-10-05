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
| Navigation       | src/app/services/navigation.service.ts                   | HTTP reads, BehaviorSubject state, per-section replay cache             |
| Mutations        | src/app/services/workshops.service.ts                    | Workshop/page CRUD, ordering, save and image upload calls               |
| Catalog/editor   | src/app/components/workshops-pages/                      | Persisted section catalog, workshop cards and editor/paginator          |
| Context header   | src/app/components/workshops.component.ts                | Section header and nested router outlet                                 |
| Controls/dialogs | src/app/components/workshops-sidepanel/                  | Drag ordering, metadata forms, typed-name delete confirmation           |
| Validation       | src/app/form-validators/match-string.validator.ts        | Name confirmation validator                                             |

## Routes and data flow

Routes are relative to the shell mount point:

- Empty path: userAuthenticatedGuard, fetchSections resolver and section landing.
- create-section: dedicated section authoring page, matched before :section.
- edit-section/:sectionId: the same authoring page, loading via GET and saving
  through PATCH /navigation/section/{id}; matched before :section.
- :section: resolve section and workshops, then mount WorkshopsComponent.
- :section/workshop-list: catalog; :section alone redirects here.
- :section/:workshopId/:documentId: select workshop by slug and read page by ID.
- :section/:workshopId also resolves a document although no documentId is supplied;
  this is a known gap, not a working default-page redirect.

Section links use persisted IDs; catalog artwork comes from each section's
`headerSvgPath`, with a generic folder icon when no path is configured.
NavigationService exposes the fetched section catalog and merges confirmed
creations/updates by ID, also refreshing the selected section when applicable.
Catalog cards have a sibling edit icon revealed on hover/focus or shown on touch.
CreateSectionComponent uses a routed typed Material form for create/edit, fresh
section reads, a multiline sectionDescription input, and pending/error signals.
Catalog cards display sectionDescription; the legacy numeric summary is preserved
in response state but not shown or submitted.
WorkshopEditorService owns the POST. New sections use generic artwork and open an
empty workshop catalog. NavigationService caches workshop requests and selects the
current workshop from that list. Its nominal five-minute TTL uses takeUntil + shareReplay; it does not
remove completed HTTP cache entries. Mutations generally force a section refresh.

Workshop detail parses document.html into editor blocks; formChanged serializes
and posts a save, showing a success/failure snackbar. Each event starts a separate
subscription; there is no revision, save queue or unsaved-navigation guard here.
The Published chip is static UI, not a publication state.

Workshop creation includes a default page on the server. Dialogs create/edit/delete
metadata and pages; the editor supports PAGE/EXAM values without a distinct exam
execution UI. Sort controls optimistically mutate input arrays and post ordering.

## External boundaries

See the local [HTTP contract map](api-contracts.md) for every call, payload, return
shape and discrepancy. The service owns MongoDB, validation and admin authorization.
The remote's guard checks authentication; it does not establish admin rights.
Production uses same-origin gateway paths; development replaces the environment
with localhost:3007. A watched static bundle on 4201 is loaded through the hosted
shell’s remote-entry override. Upload routing is unresolved.

See [readiness](document-readiness.md) for observed gaps and proposed verification.

## Shared asset picker — 2026-10-04

The Create Section page consumes @tmdjr/ngx-asset-manager 21.1.0. The admin shell owns ASSET_DATA_SOURCE via provideAssetManager({ apiUrl: '/api/uploader' }); the remote's app.config and Routes do not register the adapter or replace host HTTP. Both federation entries share the package as a strict 21.1.0 singleton to preserve token identity.

DocumentAssetsService resolves the existing documents folder by name through the shell data source, and the page supplies its Mongo ID to both gallery and upload. Missing/failed folder reads show retry without falling back to root. The picker shows and uploads images only. Users explicitly apply its image URL to the menu or header path. The frontend sends sectionTitle, sectionDescription, menuSvgPath and headerSvgPath. Published 0.0.33 declares descriptions for creation and updates; CreateSectionDto still does not declare image paths, so creation artwork acceptance needs separate confirmation. The uploader gateway is hosted even when documents use localhost:3007. See [003 handoff](../specs/003-shared-asset-picker/handoff.md) for historical picker verification, [004 handoff](../specs/004-section-creation-page/handoff.md) for creation, [005 handoff](../specs/005-edit-sections/handoff.md) for editing, and [006 handoff](../specs/006-section-description/handoff.md) for current description behavior and contracts.
