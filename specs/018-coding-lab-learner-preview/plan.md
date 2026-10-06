# Plan
Read GET /api/coding-labs/published-labs/:resourceId with credentials through
CodingLabsApiService. Use published learner projection (latest published version),
never draft/authoring objects. Input lifecycle/switchMap and explicit DestroyRef
mirror the assessment preview's verified host integration. Separate instruction
presentation from local editable-code state; support safe Markdown block formatting
(headings, paragraphs, lists, fenced code) through Angular text interpolation.
Learner code execution requires a service-owned endpoint; admin verify runs reference
solutions and must not be repurposed. No backend/contracts/packages/deployments.
Constitution check: MVVM HTTP/view split, typed DTOs, inline BEM, responsive controls.
Verify routed exact ID, cancellation/retry/empty/error, local editing/reset and safe
content rendering, full suite/build and live linked page with no persistence.
