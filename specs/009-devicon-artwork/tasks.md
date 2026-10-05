# Tasks: Devicon or image artwork

[Spec](spec.md) | [Plan](plan.md)
Updated: 2026-10-05

- [x] T001: Classify class-string vs image artwork through the existing shared
  pipe/component; wire exclusive form previews, catalogs and context header.
  FR-001/002/003. Depends on: none.
- [x] T002: Test classification, create/edit inputs, exact payloads, saved readers
  and dialog/image regressions; run production build. AC-001 through AC-004.
  Depends on: T001.
- [x] T003: Update architecture, development, contract map/index and
  [handoff](handoff.md). Depends on: T002.
- [ ] X001: Release owner: verify hosted Devicon stylesheet/glyphs, persisted icon
  strings and other document consumers. Depends on: T001.

## Constitution Check

Shared typed rendering, accessible previews, preserved string payloads and
host-owned styles. No new font/package/provider or route/block changes.

## Evidence

T001/T002: 66 focused ChromeHeadless tests pass; production templates/federation
build passes with the unchanged section-list style warning.
T003: Context docs/index and [handoff](handoff.md) updated.
X001: Hosted browser redirected to auth sign-in; glyph/font and real persistence/
consumer checks remain pending. User confirmed use of shell styling.
