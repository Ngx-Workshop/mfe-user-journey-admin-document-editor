# Assessment test gallery handoff
Status: Implemented and locally verified · 2026-10-06

## Delivered

Assessment Test creation embeds a responsive selectable gallery using the installed
assessment-test-contracts 0.0.18. Cards show name, subject, level, question count and
updated date. Stateless HTTP service, picker state and presentation cards follow the
coding gallery boundaries. Search and subject filters operate locally; Load More
reveals 24 additional results. Loading, empty, access-denied and retry states are explicit.
Selection remains visible across filtering and suggests a page name while preserving
custom labels. Type changes clear both resource selections. Pending/saved guards
prevent changes and duplicate submissions; failed saves retain the selected test.

## API and ownership

GET /api/assessment-test with credentials returns AssessmentTestDto[] without
server search or pagination. Both environments use the hosted catalog; development
document persistence remains localhost:3007. Only test metadata appears in cards;
question text and answers in the admin response are not rendered. Selection supplies
test._id as resourceId in the existing ASSESSMENT_TEST add-reference request. No
assessment mutation, attempt, scoring, backend change, publication or deployment.
External page execution remains the existing Hello world placeholder.

## Verification

137 ChromeHeadless tests pass, including catalog credentials, cards/selection,
local filtering/reveal, denied/error/retry/empty states, disabled guards, exact routed
reference payload, name suggestions/custom labels, save recovery and type reset.
App/spec TypeScript checks and production build pass; output is isolated under
/tmp/document-editor-assessment-gallery-build. Whitespace checks pass.

Live signed-in hosted shell with local remote loaded nine real tests. Selecting
My 1st RxJS Quiz highlighted its card, suggested the name and enabled Create.
RxJS filtering and Expert search returned the expected cards; selection persisted.
No console errors. Form left selected and unsubmitted; no workshop/test records
changed. Screenshot: /tmp/document-editor-assessment-test-gallery.png.
Load More and failure states use HTTP doubles because the live catalog has nine tests.
