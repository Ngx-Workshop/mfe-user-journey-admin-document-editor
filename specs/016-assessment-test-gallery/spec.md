# Assessment test gallery
Status: Implemented and locally verified · 2026-10-06

FR-001: Assessment Test creation shows an existing-test gallery backed by installed
assessment-test-contracts 0.0.18, replacing manual resource ID input.
FR-002: Cards show name, subject, level, question count and available updated date;
keyboard buttons highlight selection and a selected summary stays visible.
FR-003: Selection supplies resourceId and suggests the test name while preserving
custom labels. Type changes clear both gallery selections; pending/saved blocks changes.
FR-004: Search and subject filtering operate on the full catalog response. Reveal
24 results at a time via Load More. Loading, empty, denied access and retry are explicit.
FR-005: Only add-reference mutates workshop data. No assessment mutation, attempt,
scoring or answers UI; existing coding/PAGE flows and placeholders remain intact.

AC-001 Catalog metadata/filters/loadmore/selection/retry/disabled behavior.
AC-002 Exact assessment reference payload and custom labels/type switching.
AC-003 Live hosted catalog selection without saving a new placement.
