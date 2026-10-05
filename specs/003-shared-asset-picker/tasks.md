# Tasks: Shared section asset picker

Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Updated: 2026-10-04

- [x] T001: Host adapter registration and compatible singleton package sharing (FR-001).
- [x] T002: Resolve documents folder, image-only picker and retry states (FR-002/003/004).
- [x] T003: Host HTTP and document component regression checks (AC-001–004).
- [x] T004: Architecture/development/contract documentation and verification handoff.
- [x] X001: Verify live folder lookup and picker rendering in the deployed shell with localhost:4201 remote; preserve existing auth and /api/uploader gateway.

## Constitution Check

Preserve user edits and federation contracts; no document-service payload changes, production writes or deployment for validation.

## Verification evidence

Shell: 3 ChromeHeadless tests pass using the actual appConfig with startup initializers disabled and HTTP test backend. Tests verify root token identity, credentialed folder/asset reads and multipart uploads. Document remote: 11 ChromeHeadless tests pass, including existing authoring tests, folder resolution, missing/403 recovery and image-only multipart upload. Both production builds pass to separate /tmp outputs; the shell emits existing CommonJS/unused-file warnings. No running watcher output was overwritten.

The authenticated deployed asset-management UI lists a documents folder. After shell deployment d314574, the deployed host with localhost:4201 remote opens Create Section, resolves the folder, displays Destination: documents and renders the image gallery without console errors. Shell /2046.js supplies the shared library; the observed local remote scripts are /181.js and /140.js, with no remote library fallback observed. No live uploads or document mutations were performed. The reported NG0201 did not reproduce; no provider was added to the remote.
