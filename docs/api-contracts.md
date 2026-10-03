# Document HTTP contract map

Source review: 2026-10-03. This describes current controllers and caller mappings,
not a live integration test. Production adds `/api/documents` to these service
paths through the gateway; development uses `http://localhost:3007` directly. No global prefix is set in service main.ts.

| Method and service path | Request | Actual service return | Declared access |
| --- | --- | --- | --- |
| POST /navigation/section/create-section | `{ sectionTitle }` (trimmed, 1–120 chars) | SectionDto, HTTP 201 | Admin |
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
- The editor pins @tmdjr/document-contracts 0.0.22. The service source package says
  0.0.1, while deployment derives the patch from GITHUB_RUN_NUMBER. This is not proof
  of the current published version. Generated artifacts were refreshed during section
  creation work and now use current WorkshopPage/DeletePageParams source names.
  The editor's section request uses the published SectionDto name field and its
  response uses SectionDto, so this feature needs no frontend package upgrade.
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
