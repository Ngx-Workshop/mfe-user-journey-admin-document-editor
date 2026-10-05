# Feature: Workshop authoring pages

Status: Implemented; live integration pending
Feature ID: 007-workshop-authoring-pages
Created: 2026-10-05
Updated: 2026-10-05
Request: Move workshop create/edit modals to dedicated pages, like sections, and
configure asset-manager image selection.

## Problem, scope and source observations

Administrators currently create workshops from the catalog dialog and edit from
sidebar dialogs. The forms use the legacy document upload endpoint rather than
the shell-owned uploader. The catalog unconditionally rewrites thumbnails as
Cloudinary URLs. Sections already use a full image gallery in the documents folder.

In scope: routed create/edit forms, all existing entry points, thumbnail URL entry
and asset selection/upload, truthful loading/errors/retry, catalog refresh, and
non-Cloudinary thumbnail compatibility.
Out of scope: backend changes, publication, section/page/block contracts, deletion
and ordering redesign, deployment, and unsaved-edit prompts.

## Functional requirements and acceptance

- FR-001 / AC-001: Create New Workshop opens a dedicated page under the selected
  section. Valid name/summary create with that section ID and the loaded workshop
  count as sortId; cancel/success return to that section's catalog.
- FR-002 / AC-002: The sidebar exposes a keyboard-accessible edit link using the
  workshop Mongo ID. Direct navigation loads fresh section workshops and prefills
  name, summary and thumbnail; only those fields and _id are sent on edit.
- FR-003 / AC-003: The full asset manager lists/uploads images only in the resolved
  documents folder. Explicit application stores a usable URL in thumbnail, never
  an asset ID. Manual URLs remain supported. Missing folders and unusable URLs
  show recoverable errors; no root-folder fallback or legacy upload request.
- FR-004 / AC-004: Invalid/whitespace-only required fields cannot submit. Pending
  saves prevent duplicate submission/departure. Read and mutation failures retain
  appropriate retry paths; authorization/not-found errors are explicit.
- FR-005 / AC-005: Confirmed mutations update navigation state, invalidate the
  section's cached workshops and return to a refreshed catalog. Failed navigation
  after a confirmed mutation cannot cause duplicate saves.
- FR-006 / AC-006: Catalog thumbnail URLs not using Cloudinary image delivery are
  preserved. Existing Cloudinary image optimization remains.

## Boundaries, quality and assumptions

Section IDs, workshop slugs, page IDs and serialized blocks remain unchanged.
The new edit route's workshopId is a Mongo ID, not the editor's existing slug.
Keep existing create optional-thumbnail/edit required-thumbnail validation.
Backend authorization remains server-owned; host auth/federation/providers are
unchanged. The existing section workshop-list GET supports edit loading; no new
endpoint is assumed. Initial sections still come from the host-mounted resolver.

## Success criteria and Constitution Check

Strict typed Material forms, semantic labelled controls, responsive form/gallery,
isolated router/component/HTTP tests and production compilation must pass.
Live host, uploader and persistence checks remain separately reported integration
acceptance; mocks/builds do not certify them. No schema/data migration, dependency
changes, publication or unrelated readiness-backlog work is authorized.
