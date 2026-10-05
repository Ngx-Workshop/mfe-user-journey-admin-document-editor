# Feature: Shared section asset picker

Status: Implemented; host deployment pending
Feature ID: 003-shared-asset-picker
Created: 2026-10-04
Updated: 2026-10-04
Request/source: Finish the asset manager integration; the admin shell owns ASSET_DATA_SOURCE.

## Problem and scope

The consumer imports AssetManagerComponent but the host has no data-source provider. Both federation configurations require 21.0.0 despite the installed 21.1.0 package. The dialog supplies `documents` as a folder ID, which the uploader rejects: folder IDs are Mongo IDs, not names.

## Functional requirements

- FR-001: The admin shell registers the real gateway adapter, sharing the same token identity with the document remote. The remote does not register a replacement HTTP client or adapter.
- FR-002: Resolve the existing documents folder by name, then use its returned ID for gallery and upload. Allow images only. Do not create folders or fall back to root.
- FR-003: Report loading, missing-folder and request errors with retry, without preventing title-only section creation.
- FR-004: Preserve selected asset state and existing section-creation payload; artwork persistence is not part of this setup.

## Acceptance

- AC-001: Shell-provided ASSET_DATA_SOURCE maps to AssetApiService using /api/uploader and existing HTTP interceptors.
- AC-002: With a documents folder, requests use its Mongo ID; invalid upload types are blocked before sending.
- AC-003: Missing/failed folder reads show an actionable error and support retry; no root gallery/upload renders.
- AC-004: Existing section creation tests and both production builds pass. Live host integration requires the changed shell provider and federation configuration to be served.

## Data and external boundaries

service-uploader owns authorization, folders, upload validation and storage. The same-origin admin gateway maps /api/uploader to /uploader. service-document only accepts sectionTitle for section creation; do not add asset fields or change local localhost:3007 document routing.

## Constitution Check

Typed contracts, standalone components, service-owned HTTP, recoverable errors and accessible controls are required. Preserve Routes/App exposures, document IDs and serialized blocks. Align only the new asset manager sharing entry. No deployments, published packages, folder CRUD or backend changes are needed.
