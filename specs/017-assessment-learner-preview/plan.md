# Plan
Status: Implemented and locally verified

AssessmentTestsApiService reads GET /api/assessment-test/:resourceId with credentials.
Workshop detail passes resourceId and workshop label to AssessmentTestPreviewComponent.
Input lifecycle + switchMap cancels stale reads; subscription uses injected DestroyRef
and signal state, compatible with the live shell federation. Answers/results are local.
Use exact choice-value equality, matching service grading, with no official pass claim.

The current start-test contract accepts only subject, not definition ID. Therefore
this admin learner preview must not use it to silently start a different assessment.
Recorded attempts for exact workshop links require service-owned contract/API work.
No contract/package/backend/deployment changes in this scope.

Constitution check: typed DTOs, MVVM HTTP/view split, inline BEM/Material, labelled
question groups, retry and pending states. Preserve all prior uncommitted work.
Verification: component/routed regressions, full tests/build/type checks and live
linked page start/answer/finish/restart with no persistence.
