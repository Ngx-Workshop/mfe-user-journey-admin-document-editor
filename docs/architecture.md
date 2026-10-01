# Document editor architecture

Source baseline: 1e7a26d · Reviewed 2026-10-01.

## Responsibility and stack

Angular 21.1.0 administrator authoring remote for workshop metadata and ordered
pages. Uses Material/CDK 21.1.0, RxJS 7.8.2, TypeScript ~5.9.3, editor-js2 ^21.0.9
and document-contracts 0.0.22. Federation/build-plus are version 20; compatibility
with Angular 21 must be checked, not inferred from the package versions.

The host owns navigation composition and auth context. The remote exposes App
(default export) through ./Component and named Routes through ./Routes; webpack
uses the inherited name ngx-seed-mfe and remoteEntry.js. Strict shared singletons
include Angular, RxJS, metadata, headers and editor dependencies. Production webpack
reuses the same configuration.

## Source map

| Area | Local source | Responsibility |
| --- | --- | --- |
| Bootstrap | src/main.ts, src/bootstrap.ts, src/app/app.config.ts | Standalone app, zoneless detection, HTTP DI interceptors and animations |
| Host entry | src/app/app.ts, src/app/app.routes.ts, webpack.config.js | Empty root component and host-mounted route tree |
| Resolution | src/app/resolvers/ | Sections, workshop slug selection and page lookup |
| Navigation | src/app/services/navigation.service.ts | HTTP reads, BehaviorSubject state, per-section replay cache |
| Mutations | src/app/services/workshops.service.ts | Workshop/page CRUD, ordering, save and image upload calls |
| Catalog/editor | src/app/components/workshops-pages/ | Static section landing, workshop cards and editor/paginator |
| Context header | src/app/components/workshops.component.ts | Section header and nested router outlet |
| Controls/dialogs | src/app/components/workshops-sidepanel/ | Drag ordering, metadata forms, typed-name delete confirmation |
| Validation | src/app/form-validators/match-string.validator.ts | Name confirmation validator |

## Routes and data flow

Routes are relative to the shell mount point:

- Empty path: userAuthenticatedGuard, fetchSections resolver and section landing.
- :section: resolve section and workshops, then mount WorkshopsComponent.
- :section/workshop-list: catalog; :section alone redirects here.
- :section/:workshopId/:documentId: select workshop by slug and read page by ID.
- :section/:workshopId also resolves a document although no documentId is supplied;
  this is a known gap, not a working default-page redirect.

Section links are static angular/nestjs/rxjs. NavigationService indexes fetched
sections by key, caches workshop requests and selects the current workshop from
that list. Its nominal five-minute TTL uses takeUntil + shareReplay; it does not
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
Same-origin API paths require host/gateway routing. Upload routing is unresolved.

See [readiness](document-readiness.md) for observed gaps and proposed verification.
