# Coding lab learner preview handoff
Status: Implemented and locally verified · 2026-10-06

## Delivered

CodingLabPreviewComponent replaces the last external Hello world placeholder.
Workshop detail passes the opaque lab resourceId and workshop label. The view reads
PublishedLabDto, showing current published title/version/language/difficulty,
formatted instructions, expandable hints, sample examples and editable starter code.
Reset restores published starter code. Changes are in memory, with no lab, workshop
or learner-submission writes. Loading, missing reference, unpublished/not-found,
access-denied, empty content and retry states are explicit. Resource changes cancel
stale reads and clear previous code. The unused placeholder component was removed.

LabInstructionsComponent renders a limited text-only Markdown block subset:
headings, paragraphs, lists and fenced code. Angular escapes every text value; raw
HTML never executes. Inline Markdown, images and interactive links are not supported.
Code editing is a labelled accessible textarea, not a syntax-highlighting IDE.

## Ownership

GET /api/coding-labs/published-labs/:id (credentials, encoded lab ID) returns the
service's learner projection for the latest published version. No draft fallback:
draft/archived labs or labs with no published content display unavailable. Hidden
tests and reference solutions are not fetched. Existing environments use hosted
coding API and independent document API. The service has no learner code-run/submit
endpoint. Admin version verification executes reference solutions and is unsuitable
for learner code. Service-owned execution/submission and progress remain future work;
this preview explicitly states those controls are unavailable. No contract/backend,
package/deployment or shared-federation changes.

## Verification

149 ChromeHeadless tests pass, app/spec TypeScript checks, production build under
/tmp/document-editor-coding-preview-build and whitespace checks pass. Seven new cases
cover published authenticated read, safe instructions, local editing/reset, hint
expansion, sample metadata, stale cancellation, empty/missing/error/403/404/retry.
Routed creation/deep-link/rename cases verify encoded lab resource IDs and no document
content requests. Three inherited heading assertions were made whitespace-insensitive
after existing template formatting introduced surrounding whitespace; no related
section/workshop behavior changed.

Live hosted shell/local remote on placement 6ac48856fd20adc48126a13a loaded published
Sum an array — demo challenge, TypeScript Version 1, instructions, sample and hint.
Local code editing enables reset; reset restores starter code. Hint expansion works.
No console errors or writes. Page left open with published starter code and hint.
Screenshot: /tmp/document-editor-coding-lab-learner-preview.png.
