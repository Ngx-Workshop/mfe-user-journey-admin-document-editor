# Handoff: Delete sections

Status: Implemented; live integration pending
Updated: 2026-10-05
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)

## Delivered behavior

- The user's section-card action opens DeleteSectionModalComponent with SectionDto,
  not the workshop delete dialog. Existing edit/navigation/action-group markup stays.
- Exact, case-sensitive section-title confirmation is required. Cancel, Escape and
  backdrop dismissal make no request and restore focus. While saving, confirmation
  and actions are disabled and dismissal/duplicate requests are blocked.
- WorkshopEditorService sends DELETE /navigation/section/{encodedId} without a body,
  using the configured document API base. Mongo IDs and legacy section keys remain
  supported. No workshops/pages are deleted; backend eligibility is authoritative.
- Only boolean acknowledged=true and deletedCount=1 confirm success. Invalid/null
  results retain state and show an error, as do HTTP 400/401/403/404/409/500 failures.
  Name entry is retained for retry or cancellation. 409 explains that the section
  contains workshops.
- NavigationService removes only the confirmed section from the keyed catalog,
  invalidates its workshop cache and clears selections belonging to it, including
  stale current-workshop state. Unrelated sections, caches and selections survive.
  Success closes with true; cancellation returns undefined. No additional
  success-critical catalog GET or workshop navigation is introduced.

## Actual verification

PASS: final focused Karma run, **48 tests**:

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/workshops-pages/section-deletion.spec.ts' \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Includes 20 new section-delete tests with real Material dialogs, mounted child
routes and mocked HTTP: exact confirmation, title/data, cancellation/focus,
pending guards, bodyless request, error recovery/retry, invalid response bodies,
legacy/final-section removal, selected-state clearing and cache isolation.
Environment tests cover production/localhost bases and encoded space/slash keys.
Existing workshop-card authoring/delete/picker/artwork checks also pass.

FAIL: initial expanded run (before adding two malformed-result cases) included
section-creation.spec.ts and finished with **66 passed, 6 failed**. The six failures
are existing create/edit section-preview assertions: synthetic image src values
now change through the current fallback, and earlier menu/header-specific icon
selectors do not match generic icon-preview markup. Those unrelated form changes
and assertions were left intact. The directly related action-group selector test
was updated to preserve the user's markup and passed.

PASS: production compilation:

```bash
npm run build -- --output-path /tmp/document-editor-section-delete-6d08b5df
```

The section-list stylesheet reports 4.22 kB, **218 bytes** over the existing
4.00 kB warning budget; compilation succeeds. The budget was not changed.
Synthetic image fixture 404s and npm's scripts-prepend-node-path warning remain.
Task-specific build output removed; watched dist preserved. No dependencies,
packages, commits or deployments were introduced.

## External-owner acceptance and delivery order

1. **service-document owner:** confirm the deployed published 0.0.33 endpoint
   supports Mongo and legacy keys, has administrator-only authorization, and
   returns acknowledged=true/deletedCount=1 only for an actual deletion. Verify
   nonempty sections return 409 with all workshops/pages/relationships unchanged.
   Verify 400/404 and permission-denial responses.
2. **Gateway owner:** confirm production /api/documents/navigation/section/{id}
   forwards DELETE and identity correctly. Development uses localhost:3007.
3. **Release/QA owner:** deliver/verify producer support before frontend rollout.
   In the signed-in shell, delete a disposable empty section, confirm immediate
   catalog removal and persistence after reload; reject a nonempty section,
   exercise permission failure/retry and keyboard/narrow-screen dialog behavior.
   Confirm selected-state cleanup in the hosted journey.

These live API/database/auth/host checks were not run. HTTP mocks, installed
contract declarations and production compilation do not establish deployed
authorization or persistence. No external source changes or publication are
assumed necessary solely from the installed declaration.
