# Tasks: Image picker dialog

[Spec](spec.md) | [Plan](plan.md)
Updated: 2026-10-05

- [x] T001: Add shared dialog and image-field suffix action; replace inline picker
  state in section/workshop pages. FR-001 through FR-004. Depends on: none.
- [x] T002: Cover actual dialog close/focus/error/upload behavior and field-specific
  page result mapping; retain CRUD/environment regressions. AC-001 through AC-005.
  Depends on: T001. Verify: focused Karma tests and production compilation.
- [x] T003: Update architecture, development, contract map, index and
  [handoff](handoff.md) with actual verification. Depends on: T002.
- [ ] X001: Release owner: verify dialogs/focus/narrow layout and real picker image
  delivery/upload in hosted shell. Depends on: T001; no external change required.

## Constitution Check

Typed results, Material accessibility, shared service-owned HTTP and preserved
document/federation contracts. Mock/build evidence is not live integration evidence.

## Evidence

T001/T002: 57 focused ChromeHeadless tests pass, including real dialog close
results/cancellation/focus and both create/edit pages. Production compilation
passes with the unchanged section-list style warning.
T003: Context docs/index and [handoff](handoff.md) updated with exact checks.
X001: Not run; hosted persistence/image delivery/upload and physical-device checks
remain pending. No external changes, package publication or deployment performed.
