# Tasks: Edit sections

[Spec](spec.md) | [Plan](plan.md) | [Handoff](handoff.md)

- [x] T001 Install published document-contracts 0.0.32 and inspect GET/PATCH DTOs.
- [x] T002 Add semantic hover/focus/touch edit links and the lazy route (FR-001).
- [x] T003 Reuse the form for fresh load, explicit errors/retry, and typed PATCH
  (FR-002/003); depends on T001/T002.
- [x] T004 Merge only successful responses into catalog/current-section state,
  return to the mounted catalog, and prevent duplicate save (FR-004);
  depends on T003.
- [x] T005 Run focused router/HTTP tests and production build; depends on T002-T004.
- [x] T006 Record actual results and update contracts/context; depends on T005.
- [ ] X001 Release owner: confirm supporting service deployment; verify live
  edit/save/reload and hover/touch behavior under the hosted mount.

## Constitution Check

Preserve IDs, authorization ownership, unrelated source changes and serialized
blocks. Verify observable behavior; do not equate mocked HTTP with persistence.
