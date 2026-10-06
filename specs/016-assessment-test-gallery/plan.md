# Plan: Assessment test gallery
Status: Implemented and locally verified
Spec: [spec.md](spec.md)
Updated: 2026-10-06

## Technical Context
**Language/Version**: TypeScript ~5.9.3 / Angular 21.1
**Primary Dependencies**: Material, RxJS, assessment-test-contracts 0.0.18
**Storage**: Component catalog/selection; document service owns placement
**Project Type**: Federated admin remote

Stateless AssessmentTestsApiService GETs configured /api/assessment-test with
credentials. Existing API returns AssessmentTestDto[] without query pagination;
picker filters/searches locally and reveals slices of 24 without extra requests.
Separate picker state and presentation gallery, mirroring coding gallery boundaries.
Page form embeds picker; route view model maps selection to resourceId and suggested
name, preserves user labels and clears selections on type change. Assessment cards
show only metadata, never answers from the admin catalog payload.

## Constitution Check
Strict published types, MVVM, inline templates/SCSS/BEM, Material semantic labelled
buttons/selects and focus styles; tests in testing/app. Preserve pending flows,
federation entrypoints, service agnosticism and blocks. Prior uncommitted work retained.

## Verification
HTTP/card/filter/error/pending tests, routed reference/name/reset regression, complete
suite and production build in separate /tmp folder. Inspect real hosted catalog in
signed-in shell without assessment/workshop mutations. Local documents stay local;
both environments use hosted assessment catalog. No backend changes or releases.
