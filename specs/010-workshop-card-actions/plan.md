# Plan: Workshop card actions

Status: Implemented; live integration pending
[Spec](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Existing Material/CDK 21.1.0, RxJS, document-contracts 0.0.33
**Storage**: Unchanged service-document
**Project Type**: Host-mounted authoring remote

## Design and verification

FR-001/003: WorkshopListComponent owns the existing MatDialog delete open. Wrap
card content in a semantic router anchor, leaving edit link/delete button as
sibling controls in an absolute top-right action group. Preserve card dimensions,
animation, artwork and text. Remove sidebar action markup/imports/method/style.
FR-002: Follow section-card :hover/:focus-within/no-hover reveal pattern;
label/title each action and retain standard keyboard behavior.
FR-004: Test real delete confirmation data/cancel/success/catalog refresh, route
independence, card/editor hrefs, sidebar absence and focus reveal with mocked HTTP.
Run workshop authoring regressions and production compilation outside watched dist.

## Constitution Check and contracts

Semantic links, Material buttons/dialog focus, typed WorkshopDto orchestration,
no HTTP in the card component. Existing edit route uses Mongo ID, editor uses slug/
page ID, delete submits _id. Backend admin enforcement remains unchanged. No
producer/consumer release ordering or external code change. Pointer-hover/physical
touch and live persistence remain separately reported integration acceptance.
