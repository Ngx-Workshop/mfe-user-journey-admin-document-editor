# Feature: Section descriptions

Status: Implemented; live integration pending
Updated: 2026-10-05

## Requirements and acceptance

- FR-001 / AC-001: Create/edit forms use an optional multiline
  `sectionDescription` text control instead of numeric summary. Remove numeric
  validation/hints and leave existing name/artwork validation and picker behavior.
- FR-002 / AC-002: Load the published SectionDto description into the edit form.
  POST/PATCH send trimmed description text, preserving internal newlines. Sending
  an empty string clears the description. Never send numeric summary from the form.
- FR-003 / AC-003: Catalog cards display sectionDescription, never numeric summary
  or a summary-based fallback. Empty descriptions render empty.
- FR-004 / AC-004: Preserve the legacy summary field in server responses/local
  section state without editing or resetting it. Preserve IDs, routes, pending
  mutation protection, retry, cancellation, and selected-section updates.

## Contract and Constitution Check

The user upgraded document-contracts to 0.0.33 and it is already installed.
SectionDto now requires sectionDescription; CreateSectionDto and UpdateSectionDto
accept optional description strings and specify that empty clears the field.
Summary remains numeric in response/update contracts but is suppressed by this UI,
not removed from persisted data. Existing artwork creation compatibility remains
separate. Use strict typed forms and services, labelled Material text input, and
router/HTTP regression tests. No authorization, federation or block-format changes.
