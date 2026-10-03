# Document editor readiness review

Reviewed 2026-10-01 at 1e7a26d. Findings below are source observations and proposed
acceptance checks, not implemented fixes or a scheduled feature backlog.

| ID | Evidence and current gap | Owner / proposed acceptance |
| --- | --- | --- |
| UI-01 | app.ts is empty; app.config.ts provides no router. Exported Routes are intended for a host. | Remote + admin shell: mount ./Routes with auth/providers and open a deep editor link; standalone blank App is not a working editor demo. |
| UI-02 | section-list.component.ts hardcodes angular/nestjs/rxjs; navigation.service.ts indexes the server's section-ID map. | Remote + service: agree section keys and verify all three catalog links against representative stored records. |
| UI-03 | workshop-detail.routing.ts resolves documentId on the empty child path; workshop-list.component.ts indexes workshopDocuments[0]._id unconditionally. | Remote: specify missing/zero-page navigation, including after deleting the active or final page, and verify it avoids undefined requests. |
| UI-04 | navigation.service.ts retains completed shareReplay streams in its cache despite nominal TTL. | Remote: verify freshness after TTL and mutations; define cache invalidation. |
| UI-05 | workshop-detail.component.ts launches an independent save for each formChanged event; no concurrency control or leave guard. JSON parse errors terminate its view model. | Remote + service: define save ordering/conflict behavior; test delayed responses, failed save, invalid blocks and navigation with pending edits. |
| UI-06 | Mutation dialogs set loading in response tap, after the request; some httpFailure messages are missing. Upload errors do not reset loading. | Remote: disable submission during request, allow recovery/retry on failure and retain entered content. |
| UI-07 | Sort controls mutate arrays before success without rollback; page sort refreshes section state without explicitly reselecting current workshop. | Remote: verify rejected and successful reorder, paginator order and fresh current-workshop state. |
| UI-08 | workshops.service.ts mis-types page-sort and workshop-delete returns; image upload has no implementation in the reviewed service. | Remote + service + gateway: follow the local contract map and test actual responses/upload routing. |
| UI-09 | Published chip is unconditional; EXAM is a page type without a separate assessment workflow. | Product + both repos: decide whether publication or exam behavior is needed before adding requirements; do not claim it exists. |
| UI-10 | Catalog cards use div routerLink and image lacks alt; sidebars use fixed 320px columns and sorting is drag-based. | Remote: verify keyboard activation, labels, focus, ordering alternative and narrow-screen usability. |

## Follow-up order and boundary handoff

Start by agreeing section/identifier and response contracts with service-document.
Then choose a feature covering reliable CRUD/save/navigation and add explicit
acceptance cases; backend relationship integrity is a separate owner concern.
The admin shell must verify federated routing/shared versions/auth providers; the
gateway must confirm document and upload paths. Each feature should state which
integration checks are required for completion and which remain external.

No runtime fixes were made. [Development](development.md) records the verification
performed for this documentation migration. Both repositories contain a local
[contract map](api-contracts.md), so future work can proceed without sibling access.

## Section creation update — 2026-10-03

[001 Create sections](../specs/001-create-sections/handoff.md) implements named section
creation and dynamic ID-based catalog links, resolving the static catalog portion
of UI-02/API-03. Section-list Swagger shape is corrected and contracts regenerated,
including the missing-model build repair. Existing workshop slug and unrelated
validation/CRUD findings remain open. Live integration acceptance is still pending.
