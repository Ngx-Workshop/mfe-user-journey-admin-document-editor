# Tasks: Create sections
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

- [x] T001 Add validated admin endpoint, persistence defaults and tests (FR-001–003).
- [x] T002 Wire create dialog, services and dynamic catalog (FR-001,002,004).
- [x] T003 Verify builds, generated contracts, UI/HTTP regression tests.
- [x] T004 Update architecture/contracts and handoff with evidence and release order.

## Constitution Check
Keep runtime boundaries, preserve unrelated user edits and test failure recovery.

## Evidence
T001: 15 service HTTP tests pass with real validation, schema defaults and role
guard; persistence and remote identity lookup are doubles.
T002: 6 ChromeHeadless component/HTTP tests pass, including user submission, retry,
cancel, permission errors, reload/legacy cards and ID-based navigation.
T003: Both production builds and generated contract build pass. OpenAPI updated.
T004: Local architecture/development/contracts and this handoff updated.

- [ ] X001 Release owner: deploy the service before the editor, then smoke-test
  creation/reload/workshop creation through the real gateway and auth service.
