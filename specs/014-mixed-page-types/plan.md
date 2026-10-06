# Plan: Mixed page types

Status: Implemented and locally verified
Spec: [spec.md](spec.md)
Updated: 2026-10-06

## Technical Context
**Language/Version**: TypeScript ~5.9.3 / Angular 21.1
**Primary Dependencies**: Angular Material/CDK, RxJS 7.8, document-contracts 0.0.34
**Storage**: service-document; frontend singleton selection/cache only
**Project Type**: Federated administrator remote

## Design
Derive WorkshopJourneyItem directly from WorkshopDto.workshopDocuments and use at
all identifier boundaries. Stateless DocumentApiService exposes add-reference;
WorkshopEditorService merges confirmed workshops. Typed form adds resourceId and
supported kind values with conditional validation and explicit request mapping.
NavigationService resolves placement from selected workshop: PAGE fetches HTML,
external kinds return metadata only. A resolved-entry view model parses only owned
page content. Detail switches between editor and a small external placeholder.
Do not add foreign API adapters for placeholder views or mutate other services.

## Constitution Check
Strict types/templates, existing MVVM, inline HTML/SCSS and BEM retained. Material
labelled controls and inherited pending/disabled/recovery flow preserved. Tests stay
in testing/app. Host App/Routes/exposures/shared versions retain their contracts.
Resource existence is not implied by Hello world. No serialized blocks change.

## Integration and verification
Service emits union, add-reference is 201 WorkshopDto; manual opaque IDs supplied by
frontend. Local evidence found old untyped references mislabelled CODING_LAB by
service projection. Correct service schema default/projection to PAGE without data
migration, and check membership by immutable placement ID for legacy deletion.
Service owns this corrective fix, recorded in 005 handoff. Test all frontend specs,
production build to a separate /tmp folder, service regression, and live hosted
shell with localhost remote/service. No releases or registry changes.
