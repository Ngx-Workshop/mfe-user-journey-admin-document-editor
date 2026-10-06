# Feature: Page authoring pages

Status: Implemented; integration pending
Feature ID: 013-page-authoring-pages
Created: 2026-10-06
Updated: 2026-10-06
Request: Move page editing to the toolbar; replace create/edit modals with pages.

## Problem and scope

Administrators need dedicated page metadata forms rather than sidebar edit actions
and modal workflows. In scope: toolbar actions for the active page, routed creation
and renaming, truthful loading/saving/errors and return navigation.
Out of scope: deletion behavior, publication, assessment execution, block editing,
default-page/deletion routing and backend changes.

## Current evidence

The detail toolbar opens a create modal; each sidebar row opens a rename modal.
Both use existing page mutation commands returning updated workshops. The sidebar
has an existing uncommitted spacing change that must be preserved.

## Requirements and acceptance

- FR-001 / AC-001: The toolbar links to create and active-page edit forms. Sidebar
  rows retain navigation, ordering and deletion, not edit actions.
- FR-002 / AC-002: Creation requires a nonblank name and retains PAGE/EXAM selection.
  Send the Mongo workshop ID and next ordering index; success opens the new page.
- FR-003 / AC-003: Edit loads fresh workshop references, requires a nonblank name,
  updates only name metadata, and returns to the same page.
- FR-004 / AC-004: Pending mutations disable fields, duplicate submits and route
  departure. Failures retain values, explain denial/missing records and permit retry.
  Confirmed saves with failed navigation cannot be submitted again.
- FR-005 / AC-005: Direct links and reused edit routes load their own context.
  Missing workshops/pages and failed reads cannot mutate stale selection.
- FR-006 / AC-006: Cancel returns to the originating/existing page or the catalog
  for an empty workshop, without mutation.

## Quality and boundaries

Use labelled Material controls, responsive inline BEM styling, typed forms and
separate routed view model/presentation. Preserve existing editor URLs, IDs,
PAGE/EXAM meaning, DTOs, block serialization, default App/named Routes and federation.
Service-document remains responsible for authorization/persistence. Local router,
component and HTTP tests plus production compilation establish local acceptance;
hosted persistence/auth/browser checks remain separately pending.

## Decisions and Constitution Check

Editing means renaming the active page, matching existing functionality; changing
its page type is not part of this request. Delete confirmation remains a modal.
Create cancellation remembers the active page via a validated returnPage query.
All six constitutional principles apply; no intended deviation. Browser closure
and pending block-save behavior are inherited, not changed by metadata authoring.
