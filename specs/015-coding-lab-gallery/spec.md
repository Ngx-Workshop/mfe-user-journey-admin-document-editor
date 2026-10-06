# Coding lab gallery
Status: Implemented and locally verified · 2026-10-06

FR-001: Choosing Coding Lab on Create Page shows a searchable paged gallery of
existing nonarchived labs using coding-labs-contracts 0.0.6 metadata.
FR-002: Cards display title/summary, status, difficulty, duration and tags where
available, with keyboard-accessible selection and a visible selected summary.
FR-003: Selection supplies resourceId to existing add-reference flow; auto-fill the
page name unless the author has entered a custom name. Type changes clear selection
so an assessment ID cannot silently become a lab ID. Pending/saved state disables selection.
FR-004: Loading, no results, failure, retry and Load More are explicit. Search and
pagination preserve selection. No lab mutation or lab-version fetch is performed.
FR-005: Existing PAGE/assessment creation and external placeholders continue to work.

AC-001 Selection and exact reference payload/name. AC-002 Search, paging, empty,
archived filtering, retry and pending guards. AC-003 Live hosted catalog in local editor.

Development uses hosted /api/coding-labs because only documents are running locally.
Draft and published labs can be selected for authoring, with status labelled;
archived labs are omitted. The selected ID identifies a lab, not a version/embed.
