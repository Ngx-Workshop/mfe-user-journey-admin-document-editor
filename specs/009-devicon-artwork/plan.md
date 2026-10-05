# Plan: Devicon or image artwork

Status: Implemented; live integration pending
[Spec](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Existing Material, RxJS, shell-owned Devicon font/CSS
**Storage**: Existing string metadata fields in service-document
**Project Type**: Host-mounted Angular remote

## Design and mapping

FR-001/002: Reuse IsDeviconPipe and MenuDeviconComponent for exclusive conditional
previews in create-section/workshop. Normalize surrounding whitespace, recognize
CSS-class strings rather than similarly named image files, and correct both
section preview bindings. Add field hints with an example.
FR-003: Branch section-list/workshop-list/context-header artwork with the same pipe.
Keep existing img attributes, Cloudinary optimization and empty fallbacks.
Decorative catalog/header icons remain hidden from accessibility; previews are
labelled. Use a CSS size variable for larger catalog/header glyphs while preserving
the component's default sizes and Material-icon fallback.
FR-004: Preserve manual text, picker results, trim-on-submit and existing requests.

## Contracts and delivery

menuSvgPath/headerSvgPath/thumbnail remain string fields, now interpreted locally as
Devicon classes or image paths. No schema/version/federation change. User chose the
existing admin-shell Devicon styling. Release owner must verify its stylesheet/font;
other readers must support the class convention before receiving icon-valued
records. Backend image-path acceptance/defaults remain separately unverified.

## Verification and Constitution Check

Test pipe classification, user component's class/Material behavior, each form on
create/edit, field independence, image/icon switching, exact save values and saved
catalog/header rendering. Run focused authoring/dialog/environment/component
checks and production build outside watched dist. No dependency installation.
Keep strict types, shared helpers, accessibility and HTTP ownership. Preserve
routes/identifiers/blocks and unrelated work. Hosted glyph appearance is not
established by local DOM tests; record it separately.
