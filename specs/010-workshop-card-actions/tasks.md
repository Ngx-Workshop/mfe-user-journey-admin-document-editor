# Tasks: Workshop card actions

[Spec](spec.md) | [Plan](plan.md)
Updated: 2026-10-05

- [x] T001: Move actions/orchestration from sidebar to semantic workshop cards;
  add hover/focus/touch reveal. FR-001 through FR-004. Depends on: none.
- [x] T002: Verify card/edit/delete route isolation, confirmation/cancel/success,
  sidebar navigation and artwork/authoring regressions; run production build.
  AC-001 through AC-004. Depends on: T001.
- [x] T003: Update context/index and [handoff](handoff.md) with actual results.
  Depends on: T002.
- [ ] X001: Release owner: verify pointer-hover and physical touch/keyboard use,
  hosted edit/delete/persistence. Depends on: T001; no external code change.

## Constitution Check

Accessible independent actions, existing dialog/service ownership and preserved
routes/IDs/block contracts. Do not claim mocks/build prove live integration.

## Evidence

T001/T002: 26 workshop router/component/HTTP tests pass. Production build passes
with the unchanged section-list stylesheet warning.
T003: Architecture/development/index and handoff updated; 007 placement marked
historical. API contract map unchanged because no HTTP contract changed.
X001: Pointer-hover/physical touch and hosted persistence/auth remain unverified.
