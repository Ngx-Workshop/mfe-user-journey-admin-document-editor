# Feature: Document editor design system

Status: Complete
Feature ID: 020-design-system
Created: 2026-11-04
Updated: 2026-11-04
Request/source: Migrate the running document authoring remote to the installed design system.

## Scope and acceptance

- FR-001 / AC-001: Replace large section/workshop headers and spacious cards with shared action bars, compact catalogue rows and bounded scroll panels. Preserve artwork, identifiers, links, independent edit/delete intents and empty states.
- FR-002 / AC-002: Section/workshop/page metadata forms use shared panels/buttons/theme and retain validation, pending/error/retry, picker lifecycle and create/edit payloads.
- FR-003 / AC-003: Document content and page outline occupy separate panels with viewport-owned scrolling. Preserve EditorJS block identity/save queue/retry, mixed page types, page navigation and immutable ordering. Ordering supports labelled keyboard buttons without nested interactive elements.
- FR-004 / AC-004: Themed galleries, dialogs and learner previews; static JSON/code uses design-system code blocks. Preserve text/sanitization boundaries, redaction and preview-local state.
- FR-005 / AC-005: Responsive panel switches and useful focus/labels; App/Routes/federation, singleton services, API/DTOs and serialized editor blocks remain compatible.

## Constitution check

Maintain MVVM, strict types, inline BEM and focused OnPush presentation. Data and permissions remain service-owned. No publication lifecycle, backend, package publication or deployment. Existing static Published copy is not a new lifecycle claim.

## Verification

Run full ChromeHeadless suite, app/spec checks, layout and isolated production build with license extraction. Hosted shell reads against localhost:3007 verify catalogue/forms/page editor/outline and narrow screens. Mutations/save/order tested with doubles; no existing records are modified merely to verify visuals.
