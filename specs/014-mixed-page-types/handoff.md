# Mixed page types handoff

Status: Implemented and locally verified · 2026-10-06

## Delivered

Document-contracts 0.0.34 union adopted across page creation, resolution, detail,
sidebar, sorting and deletion. Form offers Workshop Page, Assessment Test and
Coding Lab. External kinds require manually entered resourceId and use typed
AddWorkshopReferenceDto with workshop Mongo ID. Confirmed responses reconcile
selection/cache and open the newly created placement. Page sortId is server-assigned.

Only PAGE resolves document HTML and runs the block editor. Both external kinds
show Hello world and the navigation label/type. No test/lab API calls occur yet.
Installed foreign contracts remain unchanged for subsequent integration. Rename
changes only the workshop label; external delete copy explains unlink semantics.
Pending saves, conditional validation, failed-save recovery and federation exports
remain covered. Form enable/disable suppresses value events to keep conditional
validators from accidentally changing pending status.

## Verified

128 ChromeHeadless tests; TypeScript app/spec checks; production build to separate
/tmp output. Six new routed cases exercise both external kinds, exact payloads,
validation/recovery, deep links, metadata renaming and no document content requests.
Existing tests now use required PAGE discriminators; mixed order test preserves
kind and resourceId. Fixtures and test HTTP scheduling match the new cache invalidation.

Live signed-in hosted shell with local APIs/remote: original workshop document still
renders, form displays all types and labelled ID fields, temporary local workshop
creates assessment/lab references and shows Hello world, paginator switches between
kinds, assessment reload persists and console errors are absent. Dedicated fixture
workshop and its created document are deleted through localhost API after verification;
original workshop untouched. Two placeholder screenshots retained in /tmp.

Service-document correction: missing stored kind defaulted to PAGE rather than the
old CODING_LAB projection fallback. Unlink membership checks immutable entry ID.
126 service tests, focused lint and isolated MongoDB journey check pass. No migration
or new service contracts/package publication needed for this runtime correction.

## Next integration

Add resource selection through the owning services and replace placeholders with
assessment/lab views using their installed contracts. Keep placement _id distinct
from resourceId. The current UI validates only nonblank IDs and does not imply remote
existence. Real resource execution, production gateway/auth checks and releases were
not performed. No shell/federation/registry changes are needed for this phase.
