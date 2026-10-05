# Feature: Section creation page

Status: Implemented; backend integration pending
Updated: 2026-10-05

## Scope and requirements

Replace the growing section creation modal with a dedicated authoring route.
Preserve section identifiers, catalog navigation, host authentication, and the
existing documents-folder image picker.

- FR-001 / AC-001: The catalog Create Section link opens `create-section` beneath
  the host mount. Direct navigation renders the same page rather than interpreting
  the route as a section ID. Cancel returns to the mounted catalog without a POST.
- FR-002 / AC-002: A typed form accepts `sectionTitle`, numeric `summary`,
  `menuSvgPath`, and `headerSvgPath`. Submit trims the title and paths and sends
  exactly those four fields. The title remains required and limited to 120
  characters; summary is a required finite number, initially zero. Empty artwork
  paths retain existing default-artwork behavior.
- FR-003 / AC-003: Confirmed creation merges the returned SectionDto into section
  state and returns to the catalog. Pending submission blocks duplicate requests
  and route departure. Failures preserve all inputs and permit retry; permission
  failures are explicit. Navigation failure after creation never permits a
  duplicate POST.
- FR-004 / AC-004: Image selection/upload retains the shell-backed documents
  folder scope. Users explicitly apply a selected image URL to the menu or header
  field. An asset without a usable URL reports an error without clearing inputs.
  Folder failures allow retry and manual path entry, never a root-folder fallback.

## Contract boundary

The user's requested `summary: number` is preserved, not changed to descriptive
text. No new minimum, integer constraint, or mandatory artwork is imposed.
Published SectionDto contains the new fields, but the documented creation endpoint
accepts title only. The frontend request extension is intended behavior, not proof
of backend support. Backend validation, persistence, Swagger, and release order
are recorded in [handoff](handoff.md). No sibling files, dependencies, or deployment
are changed.

## Constitution Check

Typed forms and service-owned HTTP preserve quality and ownership. Material labels,
validation, semantic form controls, responsive page sizing, and explicit errors
preserve UX/accessibility. Router/component tests cover observable behavior.
Federation exports, singleton versions, existing IDs/routes, and serialized blocks
are unchanged. Live backend acceptance remains distinct from mocked tests.
