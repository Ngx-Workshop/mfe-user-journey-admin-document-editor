# 012 Document editor MVVM refactor

## Outcome
Refactor the entire remote into stateless HTTP access, singleton domain state,
route/dialog orchestration and focused presentation with inline HTML/SCSS.

- FR-001: Only data access services issue HTTP requests; they own no editor/navigation state.
- FR-002: Singleton state coordinates confirmed mutations, cache invalidation and selection refresh.
- FR-003: Components consume observable view models/signals; subscriptions have explicit lifetimes.
- FR-004: Large views split at meaningful presentation boundaries. Aim for ~230 lines/component.
- FR-005: Inline all component templates/styles and use BEM for application-owned classes.
- FR-006: Preserve routes, federation, dependency versions, IDs, DTO payloads and editor block serialization.
- FR-007: Reorders do not mutate shared input; pending actions block duplicates and failures allow retry.
- FR-009: Keep the route tree in app.routes.ts, group page components by feature and
  keep specs in a separate testing/app tree mirroring src/app.
- FR-008: Editor saves execute in order and errors do not terminate future saves.

## Acceptance
AC-001: Existing section/workshop authoring, artwork and deletion tests still pass.
AC-002: HTTP/cache tests verify expiration, confirmed mutation synchronization and failure behavior.
AC-003: Save tests verify delayed request order and recovery after a failed request.
AC-004: Production compilation and hosted local browser smoke checks pass; report actual limits.
AC-005: No external component templates/styles or component HTTP imports remain.

## Constitution check
Strict typing, Material UI, zoneless-compatible signals, accessible actions and contract
compatibility retained. The user's inline-file requirement overrides the constitution's
optional external-template allowance. No service or shell changes are required.
