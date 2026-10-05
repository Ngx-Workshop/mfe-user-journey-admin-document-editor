# Feature: Delete sections

Status: Implemented; live integration pending
Created: 2026-10-05
Request: Finish the user's section-card delete action with a section-specific
confirmation dialog and actual request.

## Source observations and scope

Before this change, SectionListComponent opened the workshop delete dialog with SectionDto,
whose fields do not match WorkshopDto. The installed document-contracts 0.0.33
declares DELETE /navigation/section/{id}, no body, DeleteResultDto response and
400/404/409 errors. 409 means the section contains workshops; no cascading deletion.

## Requirements and acceptance

- FR-001 / AC-001: A section-specific labelled dialog shows the selected title,
  warns that only empty sections may be deleted and requires exact title entry.
  Cancellation makes no mutation and restores focus to the user's card action.
- FR-002 / AC-002: Submit sends one DELETE with encoded section ID and no body,
  using the configured document API base. Pending requests disable input/actions
  and Escape/backdrop closure; duplicate submissions are prevented.
- FR-003 / AC-003: Only acknowledged=true/deletedCount=1 confirms deletion. Remove
  that section from catalog/navigation state, invalidate its workshop cache and
  clear selected state belonging to it. Preserve unrelated sections/selections.
  Close the dialog after confirmed success without navigating into workshops.
- FR-004 / AC-004: Failed/denied/conflicting/unconfirmed deletes retain title entry
  and catalog state, show explicit errors and allow retry/cancel. Explain 409
  without deleting workshops. Support Mongo IDs and legacy section keys.
- FR-005 / AC-005: Preserve the user's action group, edit link, artwork/catalog
  routes and existing create/edit behavior.

## Constitution Check and boundaries

Use typed standalone Material/reactive forms, existing name validator, service-owned
HTTP, server-owned authorization/nonempty checks, and confirmed-state updates.
No workshop/page/block deletion, schema/package/federation changes or deployment.
Backend endpoint/authorization availability and persistence are live acceptance,
not proven by mocked HTTP/builds.
