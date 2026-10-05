# Tasks: Section descriptions

[Spec](spec.md) | [Plan](plan.md) | [Handoff](handoff.md)

- [x] T001 Inspect installed 0.0.33 DTOs and preserve the user's dependency upgrade.
- [x] T002 Replace form/input/reset/payload mapping and catalog output (FR-001-004);
  depends on T001.
- [x] T003 Add text/clearing/legacy-summary regressions; depends on T002.
- [x] T004 Run focused tests, production build, installed-version and whitespace
  checks; depends on T002/T003.
- [x] T005 Update context and actual verification handoff; depends on T004.
- [ ] X001 Release owner: confirm service-description support; smoke-test
  create/edit/reload and existing-record descriptions beneath the real shell.

## Constitution Check

Do not mutate persisted legacy summary, unrelated workshops, routes, or auth.
Distinguish mocked checks from backend migration and live persistence.
