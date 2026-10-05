# Feature: Image picker dialog

Status: Implemented; live integration pending
Created: 2026-10-05
Request: Replace inline section/workshop asset managers and apply buttons with an
image-field action opening a modal that returns the selected URL on close.

## Scope and source observations

Section menu/header and workshop thumbnail fields currently share an inline full
asset gallery pattern but duplicate folder loading/selection state. Replace that
pattern on create and edit pages, preserving manual entry, previews and payloads.
No backend, route, federation, provider or package changes.

## Requirements and acceptance

- FR-001 / AC-001: Each image field has a labelled, keyboard-accessible action.
  No asset manager or uploader request exists until that action opens the dialog.
- FR-002 / AC-002: Choosing a gallery image or completing an image upload with a
  usable URL closes the dialog with that URL. Only after close does the originating
  field update and become dirty. Remove the old Use for menu/header/thumbnail
  actions. Cancel/Escape/backdrop close returns no value and preserves the field.
- FR-003 / AC-003: The full picker browses/uploads images only in the resolved
  documents folder using the shell adapter. Loading, missing/denied folder and
  unusable URL errors remain visible/recoverable in the modal, without root fallback.
- FR-004 / AC-004: Disabled/pending/saved/unloaded forms cannot open or accept a
  picker result. Prevent duplicate dialogs; close on origin destruction/disable,
  restore focus to the action and prevent stale results reaching another record.
- FR-005 / AC-005: Existing create/edit validation, preview, exact HTTP payloads,
  mutation recovery and route behavior remain covered by regressions.

## Boundaries and Constitution Check

Reuse Material dialog focus/keyboard semantics and typed string close results.
Centralize picker behavior, keep HTTP in DocumentAssetsService/shell data source,
preserve document identifiers/blocks and server authorization. Responsive dialog
bounds must fit narrow viewports. Upload cancellation does not imply deleting an
already uploaded asset. Live host/upload acceptance is separate from mock tests.
