# 012 MVVM refactor handoff

Implemented 2026-10-05 in the document-editor remote. No backend, shell,
dependency-version, federation exposure, endpoint or serialized-block migration.

## Result
- DocumentApiService is stateless HTTP access. It owns no selection, forms or events.
- NavigationService is singleton section/workshop selection and cache state.
  Completed entries expire after five minutes; failed reads retry; stale reads
  cannot overwrite newer selection or confirmed mutations.
- WorkshopEditorService is the singleton command facade. Confirmed responses merge
  into state and invalidate caches. Page creation/edit/sort use returned WorkshopDto;
  page deletion reconciles references only after acknowledged single-record deletion.
  Workshop deletion updates state before background refresh; a failed refresh does
  not invite repeating a confirmed deletion or move selection back to an old route.
- EditorStateService serializes saves with concatMap, retains the latest failed
  payload for retry, and continues draining after errors. Its queue survives routed
  component destruction. JSON parsing is isolated to document changes; sidebar
  mutations retain block input identity and do not reset edits.
- Route components own local form/view-model state and navigation. Form, card and
  editor presentation components take inputs and emit actions. Small dialog/sidebar
  orchestration components render directly. All 22 component files inline HTML/SCSS;
  largest is 227 lines. Application classes follow BEM; Material/Devicon classes
  supplied by dependencies retain their conventions.
- Dialogs block duplicate submissions before requests, release pending gates on
  failure, preserve form values, and use typed forms. Sorting clones arrays and
  records, commits confirmed state, and provides labelled keyboard alternatives.
- Corrected page-sort and workshop-delete response types; removed unused legacy
  uploader method/types and service-owned form validation. Artwork previews preserve
  their configured URL rather than changing it through inline DOM error handlers.

## Verification
- Existing 89 tests retained; only DOM class selectors changed for BEM extraction.
- 19 new regression tests: HTTP/state boundary, shared TTL cache, failed/stale reads,
  selected-workshop synchronization, confirmed/failed page mutations, route changes
  during deletion, save order/snapshots/retries, immutable ordering, dialog pending
  gates/failure recovery, invalid JSON and stable block identity.
- Full Karma ChromeHeadless suite: 108 tests passed.
- Production build passed to /tmp/document-editor-production-check, preserving
  the running development watch output. TypeScript source/spec checks passed.
- Live hosted-shell/local-remote read-only checks: sections, Angular workshop catalog,
  editor content, next-page pagination, page create dialog/cancel, workshop authoring form/cancel and return to catalog.
  Browser integration exposed NG0203 from implicit destruction-context lookup;
  explicit DestroyRef fixed it and subsequent editor navigation showed no errors.
- No live record creation, edits, deletions, reordering or upload submitted. Mutation
  and save behavior is verified with deterministic HTTP/component tests. Host logs
  still include pre-existing Material component collision/image-loader warnings.

## Remaining boundaries
The editor queue is in memory; closing/reloading the browser loses pending drafts.
There is no cross-client revision conflict protocol. Existing default/zero-page route
and active-page deletion navigation policy remain separate product work. The static
Published chip still is not publication state. The shell owns shared Material identity
and image preconnect/loader warnings; no versions were changed to address those.

No external-owner change is required to use this refactor. Live destructive/mutation
acceptance should use explicitly disposable local records. Working tree is left for
review; nothing was committed, published or deployed.

## Source-organization follow-up — 2026-10-05

- Merged detail routing into `src/app/app.routes.ts`, retaining the `:workshopId`
  parent, both existing document children, resolvers, fallback and lazy components.
  Removed the separate detail routing file.
- Grouped page components into `sections`, `workshops` and `documents` under
  `src/app/components/workshops-pages`. Updated static/dynamic imports and current docs.
- Moved all 11 spec files into repository-root `testing/app` in corresponding feature
  folders. No spec files remain under `src`. Existing test behavior/assertions remain.
- Configured Karma discovery and TypeScript test/production boundaries. This installed
  runner resolves dynamic include patterns relative to `src`, so its configured glob
  is `../testing/**/*.spec.ts`. The initial zero-test run was rejected as verification;
  discovery was corrected and all **108 tests passed** from the relocated files.
- Source/spec TypeScript checks, production build to the separate temporary output
  directory, and whitespace/import audits passed. The named Routes export is unchanged.
- A fresh live reload reached the hosted sign-in screen because the browser's session
  expired. No live route verification is claimed for this follow-up. The user can sign
  back in and open an existing document deep link to complete that integration check.
- Preserved the user's intervening sidebar delete-workshop-dialog move. Nothing was
  committed, published or deployed.
