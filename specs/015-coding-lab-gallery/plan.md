# Plan: Coding lab gallery
Status: Implemented and locally verified
Spec: [spec.md](spec.md)
Updated: 2026-10-06

## Technical Context
**Language/Version**: TypeScript ~5.9.3 / Angular 21.1
**Primary Dependencies**: Angular Material, RxJS, coding-labs-contracts 0.0.6
**Storage**: Component selection; document service persists reference
**Project Type**: Federated admin document editor

Stateless CodingLabsApiService GETs /labs with q/limit/skip and credentials through
configured gateway base. CodingLabPickerComponent owns request/loading/query state;
CodingLabGalleryComponent presents metadata/cards and emits selections. Page form
embeds picker for CODING_LAB only; route view model maps selection to resourceId and
suggests name. Existing add-reference command and placeholder rendering stay intact.
Limit 24, explicit Load More, search button/Enter, cancel stale reads with switchMap.
Fetch all statuses but exclude archived entries; next-page availability uses raw
page size. Keep selected summary while browsing searches/pages.

## Constitution Check
MVVM stateless HTTP, focused state/presentation components, strict contract types,
inline templates/SCSS, BEM, Material and keyboard buttons; no nested forms. Preserve
App/Routes/federation/shared versions/blocks. Existing uncommitted 014 work retained.

## Verification
Mock HTTP/component tests for selection, fields, filtering/search/paging/errors and
disabled state; routed form payload test; full tests and separate production build.
Read hosted gateway through live shell and inspect gallery/selection without creating
or modifying remote labs. Document references remain service-document-owned.
