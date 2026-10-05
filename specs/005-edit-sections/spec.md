# Feature: Edit sections

Status: Implemented; live integration pending
Updated: 2026-10-05

## Outcome and scope

Administrators can edit a persisted section from its catalog card. Reuse the
existing section authoring page and image picker. Section deletion, workshop
editing, and changing section identifiers are outside scope.

- FR-001 / AC-001: Each card has a labelled Material edit icon, separate from its
  workshop link. Reveal it on hover and keyboard focus; show it persistently on
  devices without hover. Activation opens `edit-section/:sectionId` beneath the
  host mount and does not open the workshop list.
- FR-002 / AC-002: Direct edit navigation fetches the fresh SectionDto with GET
  `/navigation/section/{id}` and prefills title, numeric summary, menu path, and
  header path. Missing, denied, and failed reads show explicit errors and allow
  retry/cancel. No mutation is possible until a record loads. Switching route IDs
  resets the form and loads the selected section, cancelling an obsolete read.
- FR-003 / AC-003: Save PATCHes only mutable fields through the published
  UpdateSectionDto to `/navigation/section/{id}`, keeping the ID in the URL.
  Existing validation and trimming remain. Pending requests block duplicate
  mutations and route departure. Errors retain edits; cancellation sends no update.
- FR-004 / AC-004: On confirmed save, replace the matching catalog record and
  refresh current-section state if selected, then return to the mounted catalog.
  Do not insert a duplicate or change workshop links/IDs. Failed navigation
  after save reports success accurately and blocks a second PATCH.

## Decisions and contracts

User confirmed new endpoints in published document-contracts 0.0.32. Inspect and
consume its real GET/PATCH paths and UpdateSectionDto rather than inventing an
endpoint. The GET/PATCH return SectionDto; keys support Mongo IDs and legacy
strings. Keep default App, named Routes, auth, providers, singleton versions, and
serialized blocks unchanged. Existing creation behavior is preserved; its expanded
creation-payload dependency is not resolved by the title-only CreateSectionDto.

## Constitution Check

Use strict forms/types and service-owned HTTP. Use semantic sibling links rather
than nested interactive elements, useful labels, and keyboard/touch visibility.
Test observable router, payload, failure, state, and creation regressions. Distinguish
published contract evidence and mocked checks from live backend integration.
