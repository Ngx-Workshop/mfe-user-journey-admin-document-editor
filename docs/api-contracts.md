# Document HTTP contract map

Source review: 2026-10-03. This describes current controllers and caller mappings,
not a live integration test. Production adds `/api/documents` to these service
paths through the gateway; development uses `http://localhost:3007` directly. No global prefix is set in service main.ts.

Section rows reflect the published 0.0.33 contracts on
2026-10-05; producer source and live authorization were not re-reviewed here.

| Method and service path | Request | Actual service return | Declared access |
| --- | --- | --- | --- |
| POST /navigation/section/create-section | CreateSectionDto: sectionTitle and optional sectionDescription | SectionDto, HTTP 201 | Admin |
| GET /navigation/section/{id} | Section key in URL (Mongo or legacy string) | SectionDto, HTTP 200 | Service-owned; verify live |
| PATCH /navigation/section/{id} | UpdateSectionDto: optional sectionTitle, sectionDescription, summary, menuSvgPath, headerSvgPath; UI omits summary | SectionDto, HTTP 200; 400/404 documented | Service-owned; verify admin enforcement live |
| GET /navigation/sections | none | `{ sections: Record<string, SectionDto> }` | Public |
| GET /navigation/workshops | `section` query | WorkshopDto[] ordered by sortId | Public |
| POST /navigation/workshop/create-workshop | CreateWorkshopDto | WorkshopDto with initial page reference | Admin |
| POST /navigation/workshop/edit-workshop-name-and-summary | UpdateWorkshopDto, including _id | WorkshopDto; name, summary, thumbnail and slug updated | Admin |
| POST /navigation/workshop/delete-workshop-and-workshop-documents | `{ _id }` | `{ acknowledged, deletedCount }` for workshop deletion | Admin |
| POST /navigation/workshop/sort-workshops | UpdateWorkshopDto[] | WorkshopDto[]; response order is not guaranteed | Admin |
| POST /navigation/page/create-page | CreateWorkshopPageDto with workshopId | Updated WorkshopDto | Admin |
| POST /navigation/page/delete-page-and-update-workshop | DeletePageParamsDto: _id, workshopId, name | DeleteResultDto | Admin |
| POST /navigation/page/edit-page-name-update-workshop | _id, workshopId, name | Updated WorkshopDto (embedded reference renamed) | Admin |
| POST /navigation/page/sort-pages | WorkshopPageIdentifierDto[]; workshopId query | One updated WorkshopDto | Admin |
| GET /workshop/health | none | `{ status: 'All good Maybe....?' }` | Global guards; no public exemption |
| GET /workshop/workshops | none | WorkshopPage[] | Global guards plus DocumentAuthGuard |
| GET /workshop/:objectId | page Mongo ID | WorkshopPage document | Public |
| POST /workshop/update-workshop-html | `{ _id, html }` | Updated WorkshopPage document | Admin |

Public means `@Auth(AuthType.None)`; Admin means `@Roles(Role.Admin)` under global
AuthenticationGuard and RolesGuard registrations. Actual external auth behavior
still needs integration checks. POST handlers lack explicit HttpCode overrides;
Nest's default POST status is 201 even where Swagger advertises ApiOkResponse.

## Data distinctions

- Section keys come from Section._id stringification. The catalog links use returned
  IDs, preserving legacy angular/nestjs/rxjs keys. New sections get ObjectIds; no
  existing records or workshop sectionId values are migrated.
- Workshop._id identifies mutations; workshopDocumentGroupId is a name-derived
  slug used by the UI route named :workshopId. Renaming recalculates that slug.
- Workshop.workshopDocuments contains {_id, name, sortId} references; page records
  link to their parent through workshopGroupId.
- Page html is a serialized JSON array of editor blocks (blockId, sortIndex, name,
  dataClean in the default block). The backend currently stores the string without
  validating its structure. pageType defaults to PAGE; the UI also offers EXAM,
  but this service has no assessment execution or scoring workflow.

## Known producer/consumer differences

- Editor sortDocuments is typed as WorkshopDto[]; the service returns WorkshopDto.
  Editor deleteWorkshop expects `{ id }`; the service returns DeleteResultDto.
- Sections are a single wrapper object and Swagger now describes that shape.
  Some workshop Swagger responses still use the Mongoose Workshop schema rather
  than the actual mapped WorkshopDto.
- The editor pins @tmdjr/document-contracts 0.0.33. The previously reviewed service source package says
  0.0.1, while deployment derives the patch from GITHUB_RUN_NUMBER. This is not proof
  of the current published version. Generated artifacts were refreshed during section
  creation work and now use current WorkshopPage/DeletePageParams source names.
  The editor's creation request uses CreateSectionDto plus a Pick of published
  SectionDto for menuSvgPath/headerSvgPath. Description is declared by the creation
  DTO, but image paths are not; their acceptance remains unverified.
- POST /api/documents/uploader/image-upload accepts multipart `image` and the editor
  expects secure_url. No uploader controller/module exists in service-document.
  Its gateway destination and owner remain unverified.

## Compatibility handoff

service-document owns DTO/Swagger/runtime alignment and generated package output.
mfe-user-journey-admin-document-editor owns request mapping, response typing and
UI recovery. The gateway owner must confirm `/api/documents` routing, upload routing
and auth forwarding; the admin shell owns route mounting and identity providers.
For contract changes: agree on runtime shapes, fix producer metadata, generate and
build contracts, review compatibility, publish only in an authorized release, then
update the consumer and verify the full journey. Section creation adds one admin endpoint; deploy it before enabling the editor flow.

## Local authentication mode

DocumentAuthGuard wraps the existing AuthenticationGuard. Only explicit non-production
DOCUMENT_LOCAL_DEV mode with the exact document_local URI, a loopback connection and
an approved origin supplies local-document-admin. RolesGuard is unchanged. Standalone
local development needs no live auth service; production and hosted shell auth remain
normal. See development.md for commands and origin restrictions.

## Shared section asset picker — 2026-10-04

The new picker uses the shell's uploader adapter rather than the legacy image-upload call: GET /api/uploader/folders returns FolderDto[], GET /api/uploader?archived=false&folderId=<MongoId> returns AssetDto[], POST /api/uploader/upload sends multipart file and folderId and returns AssetDto. The gateway translates /api/uploader to service-native /uploader. Requests retain shell HTTP interceptors and credentials. Published uploader types are consumed through @tmdjr/ngx-asset-manager 21.1.0 (peer contracts 0.0.13).

The folder name documents is looked up on the consumer side; only the returned folder ID is sent to the uploader. The creation page permits image/* and retains selected/uploaded assets. Users can apply a usable asset URL to either menuSvgPath or headerSvgPath; no asset ID is sent to the document service.

## Section creation request extension - 2026-10-05

The earlier frontend sent `{ sectionTitle, summary, menuSvgPath, headerSvgPath }`;
see the historical [004 handoff](../specs/004-section-creation-page/handoff.md).
The description change below supersedes numeric summary authoring. Artwork paths
may be empty, and creation artwork acceptance remains separate because those paths
are not declared by CreateSectionDto. No backend or published package change was
performed in this checkout.

## Section editing - 2026-10-05

The frontend fetches a fresh SectionDto using GET `/navigation/section/{id}` and
PATCHes the four visible fields using UpdateSectionDto, with `_id` only in the
encoded path and no timestamp in the request body. Confirmed responses replace
catalog/current-section state by ID. The supporting backend must be deployed
before frontend rollout. See [005 handoff](../specs/005-edit-sections/handoff.md)
for editing and the following update for current field mapping.

## Section descriptions - 2026-10-05

Published 0.0.33 exposes sectionDescription as a string in SectionDto, and an
optional string in CreateSectionDto/UpdateSectionDto. An empty string clears it.
The UI uses a multiline text field, trims outer whitespace, and preserves internal
newlines. Create and edit send sectionTitle, sectionDescription and the existing
menu/header paths. Numeric summary is neither shown nor submitted, and confirmed
response state preserves it without coercion. No fallback from summary is used.
Backend owns existing-record description defaults/migration; verify reads and
create/edit/reload against the deployed producer. See
[006 handoff](../specs/006-section-description/handoff.md).
