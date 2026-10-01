# Document workflow migration

Date: 2026-10-01 · Source baseline: 1e7a26d

Adopted the repository-local Markdown workflow and four feature templates from
`seed-mfe-remote`, following the organization used by the assessment repositories.
Source repositories are provenance only; this checkout contains all required context.

- Added AGENTS.md, workflow guide, architecture, development and readiness docs,
  plus a feature index and spec/plan/tasks/handoff templates.
- Updated the existing constitution from 1.0.0 to 1.1.0 with document-specific constraints; retained its quality, testing, UX, accessibility and simplicity principles. Retained the older helpers and checklist/agent templates, with local context instructions.
- Reviewed application source, configuration, dependency manifests, deployment
  workflows and legacy Spec Kit assets.
- Replaced misleading README guidance with repository-specific entry points.
- Product source, package versions, generated contracts and deployment behavior
  are unchanged. No feature implementation history was invented.

## Verification and handoff

See [development](development.md) for checks performed and
[readiness](document-readiness.md) for source-backed follow-ups and acceptance checks.
The documentation migration is complete; runtime integration is not certified.
Next: select a scoped readiness finding and create its feature artifacts locally.
