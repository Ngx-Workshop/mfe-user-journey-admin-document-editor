# Document HTTP contract map

Source review: 2026-10-01. This describes current controllers and caller mappings,
not a live integration test. The browser adds `/api/documents` to these service
paths; gateway routing is external. No global prefix is set in service main.ts.

| Method and service path | Request | Actual service return | Declared access |
| --- | --- | --- | --- |
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
| GET /workshop/workshops | none | WorkshopPage[] | Global guards plus RemoteAuthGuard |
| GET /workshop/:objectId | page Mongo ID | WorkshopPage document | Public |
| POST /workshop/update-workshop-html | `{ _id, html }` | Updated WorkshopPage document | Admin |

Public means `@Auth(AuthType.None)`; Admin means `@Roles(Role.Admin)` under global
AuthenticationGuard and RolesGuard registrations. Actual external auth behavior
still needs integration checks. POST handlers lack explicit HttpCode overrides;
Nest's default POST status is 201 even where Swagger advertises ApiOkResponse.

## Data distinctions

- Section keys come from Section._id stringification. The UI links use angular,
  nestjs and rxjs, while the service schema declares an ObjectId. Verify stored
  records and section routing before claiming these keys match.
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
- Sections are a single wrapper object, but the controller's Swagger response
  marks SectionsMapDto as an array. Some workshop Swagger responses use the
  Mongoose Workshop schema rather than the actual mapped WorkshopDto.
- The editor pins @tmdjr/document-contracts 0.0.22. The service source package says
  0.0.1, while deployment derives the patch from GITHUB_RUN_NUMBER. This is not proof
  of the current published version. Checked-in generated models use older
  WorkshopDocumentDto/PageParamsDto names, unlike current WorkshopPageDto and
  DeletePageParamsDto source/OpenAPI. The barrel also exports a missing
  models/Workshop file while a WorkshopDoc file exists.
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
update the consumer and verify the full journey. This migration changes none of
those runtime interfaces.
