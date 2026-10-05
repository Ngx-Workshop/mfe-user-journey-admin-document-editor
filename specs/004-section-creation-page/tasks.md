# Tasks: Section creation page

[Spec](spec.md) | [Plan](plan.md) | [Handoff](handoff.md)

- [x] T001 Move creation to a lazy routed page and replace the catalog modal CTA
  (FR-001); preserve the authenticated parent and existing section routes.
- [x] T002 Extend typed form/service payload and explicit picker-to-path assignment
  (FR-002, FR-004); depends on T001.
- [x] T003 Preserve pending/error behavior and prevent duplicate creation after
  navigation failure (FR-003); depends on T001 and T002.
- [x] T004 Verify router/component/HTTP regressions and production build; depends
  on T001-T003. Record actual results in the handoff.
- [x] T005 Finish affected context documentation and handoff; depends on T004.
- [ ] X001 service-document owner: extend and test the creation endpoint, Swagger,
  generated contracts, and persistence; release producer before consumer.
- [ ] X002 Release owner: verify hosted direct routing, numeric/path creation,
  reload persistence, and catalog/header artwork after X001 and T004.

## Constitution Check

Preserve unrelated edits and host/service boundaries; test observable behaviors
and distinguish mocked checks from external integration evidence.
