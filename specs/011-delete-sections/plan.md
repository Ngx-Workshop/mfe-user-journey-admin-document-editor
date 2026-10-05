# Plan: Delete sections

Status: Implemented; live integration pending
[Spec](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Material 21.1.0, RxJS 7.8.2, document-contracts 0.0.33
**Storage**: Existing service-document and browser navigation state
**Project Type**: Host-mounted authoring remote

## Design and mapping

FR-001/002/004: Add DeleteSectionModalComponent under workshops-pages/modals,
typed SectionDto dialog data and nonnullable name form with MatchStringValidator.
Set saving/disableClose before the request; finalization restores retry/cancel.
Use explicit status-specific errors and check acknowledged/exact deleted count.
FR-002: Add WorkshopEditorService.deleteSection using raw typed HttpClient DELETE
like existing section GET/PATCH; encode section key and omit body.
FR-003: Add NavigationService.removeSection to update keyed catalog and affected
cache/selection only after confirmation; no success-critical extra catalog GET.
FR-005: Replace SectionListComponent's workshop dialog reference/data with the new
section dialog. Preserve user action-group styling/markup. Update stale edit-icon
test selectors to the actual action group rather than modifying user's markup.

## Verification and Constitution Check

Router/dialog/HTTP tests exercise selected title, exact matching, cancel, pending
departure/duplicate guard, typed result confirmation, encoded Mongo/legacy IDs,
401/403/404/409/500 failures/retry, state/cache isolation and UI action independence.
Run section authoring and environment regressions and production build outside
watched dist. Reuse existing validation/helpers, keep HTTP in services and backend
authorization. No route/ID/block/package/federation changes.

## Contracts, delivery and external checks

Installed 0.0.33 declares DELETE /navigation/section/{id} with no requestBody,
200 DeleteResultDto and nonempty 409. Backend must deliver/enforce that endpoint
before frontend rollout. service-document/gateway owners verify empty deletion,
nonempty rejection without relationship changes and administrator-only access.
No backend source change or package publication is performed in this checkout.
