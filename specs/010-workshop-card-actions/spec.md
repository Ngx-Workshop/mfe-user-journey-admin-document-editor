# Feature: Workshop card actions

Status: Implemented; live integration pending
Created: 2026-10-05
Request: Move workshop edit/delete actions from the sidebar to workshop cards,
revealed on hover.

## Requirements and acceptance

- FR-001 / AC-001: Every workshop card contains labelled edit/delete actions;
  the sidebar retains workshop navigation/reordering but no duplicate actions.
- FR-002 / AC-002: Actions appear on card hover or keyboard focus within the card,
  and stay visible on no-hover/touch devices. They remain keyboard accessible.
- FR-003 / AC-003: Card content still opens the workshop slug/page route. Edit opens
  the existing dedicated Mongo-ID edit route; delete opens the existing typed-name
  confirmation dialog with the selected WorkshopDto. Neither action opens a page.
- FR-004 / AC-004: Delete cancellation makes no mutation; existing confirmation/
  deletion/catalog-refresh behavior is preserved. Thumbnail/Devicon rendering,
  workshop order and authoring routes remain compatible.

## Scope and Constitution Check

Use semantic card content links with sibling Material actions, not nested links
or a clickable outer container that intercepts actions. Move the existing delete
dialog orchestration unchanged; do not redesign its inherited loading/error logic.
No schema, endpoint, route, font, dependency or federation changes. Preserve
server-owned authorization/HTTP, identifier distinctions and serialized blocks.
Existing zero-page navigation and sorting gaps are out of scope.
