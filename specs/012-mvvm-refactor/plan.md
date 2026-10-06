# Implementation plan

## Source findings
NavigationService mixes HTTP, selection state and an ineffective completed-stream TTL.
WorkshopEditorService mixes HTTP with an editor event Subject and form validation.
Dialogs duplicate mutation → section refresh → workshop reselection with nested subscriptions.
Sort components mutate their input arrays. Editor saves run independently. Four large
components contain layout, styles and orchestration. Six legacy components use external files.

## Design and order
1. Extract DocumentApiService (cold, typed HTTP only). Keep NavigationService as the
   singleton selection/cache store and WorkshopEditorService as the singleton command
   facade coordinating API responses with the store. Keep familiar public names to
   limit churn; components never import the HTTP service.
2. Replace TTL with timestamped cache entries. Refresh selected workshop when lists
   change; prevent stale section requests from replacing another section's state.
3. Centralize confirmed section/workshop/page merges and cache invalidation in the command facade.
   Move validation to forms and the ordered save queue to singleton editor state.
4. Extract section/workshop authoring views and catalog cards. Retain routed components
   as local view models for forms, pending/error state and navigation. Smaller dialogs
   and nested sidebar orchestrators can render inline without another presentation layer.
5. Rewrite dialogs and reorder controls using typed forms, single pipelines, pending
   gates and destruction cleanup. Queue editor saves in singleton state with concatMap.
6. Inline legacy HTML/SCSS, rename owned classes to BEM, add responsive layouts and
   accessible page edit/delete and keyboard ordering controls.
7. Run existing and targeted new tests, production build outside the watched output,
   and browser smoke checks against the supplied hosted-shell/local remote.

## Compatibility and validation
No endpoint, schema, storage, route, federation or version migration. Static Published
label remains existing UI. HTTP tests cover payloads; state tests cover TTL, transitions,
mutation failure and save ordering. Existing component tests cover forms/artwork/actions.
Browser checks are read-only journeys unless disposable local test data is established.

## Constitution check
Matches FR-001–008 and AC-001–005; no external-owner rollout required.

## Implementation refinement
Authoritative page mutation responses already contain updated WorkshopDto records;
merge them directly instead of issuing a redundant read. Deletion reconciles confirmed
state before optional refresh. Protect refreshes from changing route selection.
Parse editor blocks only on document-data changes so metadata/order updates cannot
replace in-progress editor content. Verification and remaining boundaries are in handoff.md.

## Follow-up source organization
Merge the existing document route array into app.routes.ts without changing its route
hierarchy/resolvers. Move page components into sections/workshops/documents feature
folders and rewrite relative/dynamic imports. Move all 11 spec files into repository-root
testing/app with the same feature folders. Explicitly configure Karma discovery outside
src, update TypeScript test/application includes/excludes, and verify all 108 tests still
run plus a production build. Preserve the user's intervening sidebar dialog move.
