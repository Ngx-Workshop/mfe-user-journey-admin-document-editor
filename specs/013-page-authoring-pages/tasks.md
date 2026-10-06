# Tasks: Page authoring pages

Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Updated: 2026-10-06

## Implementation and verification

- [x] T001 — Add reserved guarded routes in `src/app/app.routes.ts` and shared
  form/view model in `src/app/components/workshops-pages/documents`.
  Covers FR-002 through FR-006. Depends on: none.
- [x] T002 — Replace detail toolbar modal with links; move edit from sidebar to
  toolbar and remove unused create/edit modals. Covers FR-001. Depends on: T001.
- [x] T003 — Add routed authoring HTTP/component tests, retain ordering tests;
  run focused tests and production build. Covers AC-001 through AC-006.
  Depends on: T001, T002.
- [x] T004 — Update architecture/development/index and verification handoff.
  Depends on: T003.
- [ ] X001 — Owners: mfe-shell-admin, service-document and gateway. Verify mounted
  deep links, keyboard/narrow layout, real create/rename/cancel, persistence and
  permission denial. No contract change; integration acceptance pending.

## Constitution Check

Typed standalone MVVM, Material/BEM inline UI, labelled controls, meaningful
failure recovery tests and preserved IDs/contracts/exports. No deviation planned.
Evidence for completed validation will be recorded in [handoff.md](handoff.md).

## Progress and evidence

T001/T002: production Angular/template compilation passes; toolbar and guarded
route behavior verified in component/router tests.
T003: all 27 focused Karma ChromeHeadless tests pass, including state/projection
and immutable ordering regressions. HTTP mocked; block editor presentation stubbed.
T004: context/index and handoff updated. X001 remains pending: hosted browser
redirects to sign-in, so real writes and physical UX checks were not attempted.
