# Tasks: Workshop authoring pages

[Spec](spec.md) | [Plan](plan.md)
Updated: 2026-10-05

## Local implementation

- [x] T001: Add routed workshop authoring page and documents-folder asset picker;
  wire catalog/sidebar and remove obsolete dialogs. FR-001/002/003/004.
  Depends on: none. Verify: router/component/HTTP checks.
- [x] T002: Merge confirmed workshops/invalidate affected cache and preserve
  non-Cloudinary thumbnail URLs. FR-005/006. Depends on: none.
  Verify: exact state/cache and URL regression tests.
- [x] T003: Add focused authoring tests, run section/environment regressions and
  production compilation. AC-001 through AC-006. Depends on: T001, T002.
- [x] T004: Update architecture, development, contract map/index and
  [handoff](handoff.md) with actual evidence. Depends on: T003.

## External acceptance

- [ ] X001: Release owner with admin shell, service-document and uploader:
  verify create/edit/persistence/authorization with real asset selection/upload
  and keyboard/narrow-screen navigation. Depends on local implementation;
  no external code change currently required.

## Constitution Check

Preserve typed forms, semantic controls, service-owned HTTP/auth and all existing
page/block/federation contracts. Tests are isolated; integration evidence must be
labelled separately. No unrelated readiness fixes or dependency upgrades.

## Progress and evidence

T001/T002: 20 workshop router/component/HTTP and thumbnail tests pass.
T003: All 44 focused tests including section/environment regressions pass;
production build passes with the unchanged section-list stylesheet warning.
T004: Architecture, development, API contract map and feature index updated;
[handoff](handoff.md) records exact commands and integration limits.
X001: Not run; real host/service/uploader acceptance remains pending.
