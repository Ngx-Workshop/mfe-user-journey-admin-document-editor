# Implementation plan: Shared section asset picker

Status: Implemented; host deployment pending
Spec: [spec.md](spec.md)
Updated: 2026-10-04

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: @tmdjr/ngx-asset-manager 21.1.0, Material, RxJS, document-contracts, Module Federation
**Storage**: Asset persistence in service-uploader; section data in service-document
**Project Type**: Host-mounted document authoring remote

## Design and requirement mapping

FR-001: Register provideAssetManager in mfe-shell-admin app.config; align both package manifests/lock metadata and federation entries to singleton 21.1.0. The host owns HTTP/auth.
FR-002/003: Add a document asset service that resolves the documents folder through ASSET_DATA_SOURCE. Render the picker only after successful lookup. Retain retry and title-only creation.
FR-004: Keep the existing selected signal and sectionTitle request unchanged. Update component tests with real HTTP adapter under a simulated host injector.

## Constitution Check

Keep HTTP in the supplied adapter/service. Preserve existing exports, routes, section identifiers and serialized blocks. Add integration-oriented component tests and provider HTTP checks; report real browser checks separately from mock checks.

## External dependencies and delivery order

Build/serve the new shell before testing the remote; its provider must be in the root injector. The live hosted shell cannot gain providers from a remote app.config. Document service needs no change. Hosted /api/uploader remains the asset endpoint in development as only service-document is running locally.

## Verification plan

Cleanly compile both production builds to temporary output, preserving the local remote watcher. Run relevant Karma/ChromeHeadless checks: root provider/authenticated HTTP, folder IDs, no root fallback, retry, image restriction, and existing section creation. Inspect the running host without changing production data; note any deployment dependency.
