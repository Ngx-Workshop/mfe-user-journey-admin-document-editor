# Agent entry point — mfe-user-journey-admin-document-editor

This repository owns the Ngx-Workshop administrator workshop and page authoring remote.
All context below is local; sibling checkouts are not required.

## Read before implementation

1. [Constitution](.specify/memory/constitution.md): durable engineering rules.
2. [Architecture](docs/architecture.md): ownership, routes, source map and data.
3. [Development](docs/development.md): setup, checks and existing limitations.
4. [Workflow](.specify/README.md): specify → plan → tasks → implement → verify.
5. [Feature index](specs/README.md): select work from the user's request.
6. [Readiness review](docs/document-readiness.md) and [migration record](docs/seed-adoption.md).

## Working rules

- Inspect source and git status; preserve unrelated work.
- For nontrivial behavior changes maintain local spec, plan, tasks and handoff.
  Small documentation changes need only a concise change and verification record.
- Distinguish source observations, intended behavior and verified outcomes. The
  readiness review is a findings backlog, not authorization to implement it all.
- Preserve document routes, identifiers and serialized editor block compatibility.
  Record producer/consumer changes and delivery order before changing contracts.
- Preserve default App, named Routes, federation exposures and shared singleton versions. Keep API calls in services and backend authorization on the server.
- Resolve routine choices locally. Ask only for consequential missing decisions;
  continue independent work while they remain pending.
- Verify the changed scope; record actual passes, failures and unavailable integration
  checks separately. Builds and empty test suites do not establish working journeys.
- Update affected context docs and leave exact external-owner handoffs. Do not
  publish packages or deploy merely to validate documentation.

This is a repository-local Markdown workflow inspired by Spec Kit.
