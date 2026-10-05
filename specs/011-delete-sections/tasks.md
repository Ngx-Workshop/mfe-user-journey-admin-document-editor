# Tasks: Delete sections

[Spec](spec.md) | [Plan](plan.md)
Updated: 2026-10-05

- [x] T001: Add section-specific typed confirmation dialog and encoded service
  DELETE; wire user's action. FR-001/002/004/005. Depends on: none.
- [x] T002: Add confirmed section removal/cache/selected-state cleanup.
  FR-003. Depends on: none.
- [x] T003: Test real dialogs/routes/HTTP/state and section/environment regressions;
  run production compilation. AC-001 through AC-005. Depends on: T001, T002.
  Final focused run: 48 passed. Expanded run: 66 passed, 6 existing section-preview
  test failures; see handoff for exact scope and limitations.
- [x] T004: Update API map/context/index and [handoff](handoff.md).
  Depends on: T003.
- [ ] X001: service-document/gateway/release owner: verify live empty/nonempty
  deletion, auth and persistence. Supporting endpoint before frontend rollout.
  Depends on: T001; no external code change assumed from installed contract alone.

## Constitution Check

Typed Material UX, exact name confirmation, service-owned HTTP/server authorization,
confirmed-state mutations, preserved IDs/routes/blocks. Separate mocks from live
verification; no unrelated workshop-dialog fixes or dependency changes.
