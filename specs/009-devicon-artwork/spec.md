# Feature: Devicon or image artwork

Status: Implemented; live integration pending
Created: 2026-10-05
Request: Show Devicons or images from the section/workshop artwork input fields.

## Requirements and acceptance

- FR-001 / AC-001: Section menu/header and workshop thumbnail inputs accept a
  Devicon class string (for example devicon-angular-plain colored) or existing image
  URL/path. Each preview renders exactly one appropriate representation.
- FR-002 / AC-002: Menu and header previews use their own values/visibility.
  Blank values have no authoring preview; existing catalog blank fallbacks remain.
- FR-003 / AC-003: Saved artwork renders consistently in section/workshop catalogs
  and the section context header. Devicon values never become image src/ngSrc.
- FR-004 / AC-004: Preserve picker modal behavior, create/edit validation and exact
  payload shapes. Stored strings are trimmed normally; no DTO/schema change.

## Source observations and decision

The user's new MenuDeviconComponent recognizes devicon- prefixes and otherwise
renders Material icon names. Forms currently render both img and that component;
section previews also have mismatched field bindings/visibility.
Existing catalog/header readers treat all artwork as image paths.

User confirmed the admin shell supplies existing Devicon styling. Do not install
font/CSS dependencies or add a CDN. The host must support saved class values; other
document consumers must branch similarly before such records are used there.

## Constitution Check and limits

Reuse the user's component/pipe, typed Angular templates and semantic preview
labels. Preserve Material fallback behavior in the component and existing image
optimization/folder picker/routes/IDs/blocks. Mock component/HTTP tests and
production compilation are local acceptance; hosted glyph/font and persistence
checks remain external. No publication/deployment or unrelated changes.
