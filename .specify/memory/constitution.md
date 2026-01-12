<!--
Sync Impact Report

- Version change: unversioned template -> 1.0.0
- Modified principles: N/A (initial adoption)
- Added sections: Core Principles, Architecture & Constraints, Workflow & Quality Gates, Governance
- Removed sections: N/A
- Templates requiring updates:
	- UPDATED: .specify/templates/plan-template.md
	- UPDATED: .specify/templates/tasks-template.md
	- UNCHANGED: .specify/templates/spec-template.md
	- UNCHANGED: .specify/templates/checklist-template.md
	- UNCHANGED: .specify/templates/agent-file-template.md
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): Original adoption date is unknown.
-->

# mfe-user-journey-admin-document-editor Constitution

## Core Principles

### 1) Code Quality Is Non-Negotiable

We ship maintainable code that is idiomatic to Angular + TypeScript.

Non-negotiables:

- TypeScript stays strict; avoid `any` (use `unknown` + narrowing).
- Prefer clear, conventional Angular patterns over "clever" shortcuts.
- Keep components small, single-responsibility, and dependency-light.
- Prefer Angular-native control flow (`@if`, `@for`, `@switch`) over legacy
  structural directives.

Rationale: This repo is a micro-frontend remote; clarity and predictability reduce
integration risk.

### 2) Testing Is a Delivery Requirement

Every behavior change must be covered by tests appropriate to the risk:

Non-negotiables:

- New/changed logic must have unit tests.
- New/changed UI behavior must have component tests (or equivalent) that verify
  user-visible outcomes.
- Bugs must be fixed with a regression test.
- Tests must be deterministic and isolated; no reliance on execution order.

Rationale: A remote can break hosts silently; tests are the first integration
contract.

### 3) UX Consistency Over Local Optimizations

User experience must remain consistent across the NGX Workshop ecosystem.

Non-negotiables:

- Reuse established components and patterns before introducing new ones.
- Keep interactions predictable: loading, empty, and error states are explicit.
- Avoid ad-hoc visual divergence that makes the remote feel like a separate app.

Rationale: Micro frontends are perceived as one product by users.

### 4) Accessibility Is a First-Class Feature

Accessibility is part of “done”, not a follow-up.

Non-negotiables:

- All interactive elements are keyboard accessible.
- Use semantic HTML and correct labeling (e.g., form labels, button names).
- Manage focus when dialogs/modals open and close.
- Avoid ARIA when native semantics suffice; when ARIA is used, it must be correct.

Rationale: Accessibility improves usability and reduces product risk.

### 5) Prefer Simple, But Stay Idiomatic

We prefer simplicity over complexity, but we do not trade away idiomatic Angular
architecture for superficial “simplicity”.

Non-negotiables:

- Choose the simplest solution that remains idiomatic and scalable.
- Avoid premature abstractions; introduce patterns only when they solve a
  demonstrated problem.
- Prefer inline templates and inline styles by default; move to external files
  only when size/complexity makes inline usage harmful to readability.

Rationale: Idiomatic patterns reduce long-term cost; unnecessary complexity
increases it.

## Architecture & Constraints

This repository is a micro-frontend remote.

- The bootstrap/orchestration of the overall shell does not happen here.
  Do not introduce assumptions that require the host to change unexpectedly.
- Public exposure points (Module Federation exposes, route entry points, and any
  exported APIs) are treated as contracts.
- Prefer the orchestration/presentation split:
  - Orchestration (container) components coordinate data loading, routing,
    state, and composition.
  - Presentation components are UI-focused, accept inputs/outputs, and avoid
    direct service calls.
- Keep side effects and integration boundaries explicit (host integration,
  module federation wiring, remote entry).

## Workflow & Quality Gates

- PRs must demonstrate compliance with these principles.
- Code review must include: correctness, readability, tests, UX consistency, and
  accessibility.
- Breaking changes to remote contracts must be documented with a migration plan.
- Prefer small, incremental PRs; avoid mixing refactors with feature behavior
  changes unless required.

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution supersedes local conventions and individual preferences.

Amendment procedure:

- Proposed changes must be made as a PR with explicit rationale and examples.
- The PR must include updates to dependent templates under `.specify/templates/`.
- Versioning follows semantic versioning for governance changes:
  - MAJOR: Principle removals/redefinitions or backward-incompatible governance.
  - MINOR: New principle/section or materially expanded guidance.
  - PATCH: Clarifications/wording that do not change meaning.

Compliance expectations:

- Every plan/spec/tasks set must include a "Constitution Check" gate derived
  from these principles.
- Reviewers may block merges that violate non-negotiables.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown. | **Last Amended**: 2026-01-12
