# Plan: Section descriptions

[Spec](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Material/Router, RxJS, document-contracts 0.0.33
**Storage**: Server section persistence; local form/catalog state
**Project Type**: Host-mounted document authoring remote

## Design

Replace the numeric form control with a non-nullable string and labelled textarea.
Reset/create with an empty string, edit with SectionDto.sectionDescription, and
trim outer whitespace when submitting. Remove summary from the form and request
mapping. Use published CreateSectionDto plus the existing artwork-path Pick for
creation; retain UpdateSectionDto for PATCH. Catalog interpolation switches to the
description. Do not change workshop summaries or local state merging.

## Constitution Check and compatibility

Preserve type safety, service-owned HTTP, labels, recoverable edits, IDs, routes,
auth/providers and federation. Deploy service-document support for 0.0.33 before
the consumer. Existing summary values stay untouched; do not coerce numbers to
text or infer a description for old records. Backend owns empty/default description
mapping for existing records. CreateSectionDto still does not declare image paths,
so the pre-existing creation artwork acceptance gap remains external.

## Verification

Update focused router/component/HTTP fixtures and payload expectations. Verify
multiline text, trimming, empty clearing, fresh reads, catalog output, numeric
summary omission/preservation, failure retention and existing picker/edit flows.
Run both relevant ChromeHeadless selectors, production compilation into a separate
temporary output directory, installed version and whitespace checks. No live
gateway/backend write or migration claim.
