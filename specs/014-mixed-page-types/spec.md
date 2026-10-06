# Mixed workshop page types

Status: Implemented and locally verified · 2026-10-06

FR-001: Adopt document-contracts 0.0.34 throughout navigation, ordering, deletion,
route resolution and page authoring using the workshopDocuments union.
FR-002: Creation offers Workshop Page, Assessment Test and Coding Lab. External
creation requires a nonblank resource ID and name, sends AddWorkshopReferenceDto,
and reconciles confirmed workshop state before opening the new placement.
FR-003: External routes display the label, page type and Hello world placeholder.
They never request document HTML, invoke the block editor or save blocks. Document
pages retain their existing editor. Rename changes only the navigation label.
FR-004: Mixed entries retain resourceId/kind across immutable ordering and deletion;
external deletion copy explains that the remote resource remains.
FR-005: Retain pending/error/retry behavior, federation entrypoints, environment API
routing and serialized blocks. Existing local untyped pages resolve as PAGE.

AC-001 Create each external kind, validate resource ID, recover failures, navigate
without document GET. AC-002 Mixed deep links/paginator/sidebar/reorder/delete.
AC-003 Workshop document editor and current tests continue to work.

Assumption: IDs are entered manually for this placeholder phase; no resource picker,
foreign API calls or real assessment/lab execution. Installed foreign contracts stay
available for subsequent integration. Replace obsolete EXAM radio with supported
assessment type rather than fabricating a document-backed exam.
