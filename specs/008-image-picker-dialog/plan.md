# Plan: Image picker dialog

Status: Implemented; live integration pending
[Spec](spec.md)
Updated: 2026-10-05

## Technical Context

**Language/Version**: TypeScript ~5.9.3 / Angular 21.1.0
**Primary Dependencies**: Material 21.1.0, ngx-asset-manager 21.1.0, RxJS 7.8.2
**Storage**: Existing document/uploader services
**Project Type**: Host-mounted Angular remote

## Design

- Shared DocumentImagePickerDialogComponent owns folder lookup/retry and URL
  validation. Gallery selection/upload closes a typed MatDialogRef with the URL.
- Shared DocumentImagePickerButtonComponent is a matSuffix action with label,
  disabled input and imageSelected output. It owns a single dialog, subscribes to
  afterClosed and emits only a defined result while still enabled. Disable or
  destruction closes without a result; Material restores focus.
- Pages replace inline galleries with suffix components and targeted form updates/
  markAsDirty. Existing header/thumbnail previews are retained, including the
  user's section preview addition. Route loading disables edit actions.
- Gallery stays full/image-only, documents-folder scoped with browseFolders=false;
  no adapter is re-provided and no eager folder reads remain.

## Contracts and verification

No producer/consumer or delivery-order change. Shell still supplies ASSET_DATA_SOURCE
and shared asset-manager 21.1.0. Dialog returns string | undefined, not an Asset DTO.
No document metadata mutation occurs on picker closure until normal form submission.

Test real Material dialogs with mocked shell HTTP: deferred loading, select/upload
close result, cancel/Escape/backdrop, focus restore, duplicate prevention, disabled/
destroy cleanup, missing/denied folder retry and unusable URL recovery. Update page
router/component tests for all three fields and run existing CRUD/environment tests.
Run production build outside watched dist; report integration limits separately.

## Constitution Check and risks

Typed standalone components, shared logic, semantic buttons and Material focus
management satisfy local principles. No changes to routes, IDs, block formats,
backend auth, package versions or federation. Pending upload cancellation stops
the local picker subscription but cannot guarantee server-side rollback; do not
claim it deletes assets. Host accessibility/image delivery remain live checks.
