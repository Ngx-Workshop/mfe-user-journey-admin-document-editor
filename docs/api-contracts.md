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
| DELETE /navigation/section/{id} | Encoded section key in URL; no body | DeleteResultDto, HTTP 200; 400/404/409 documented; 409 means section contains workshops | Service-owned; verify admin enforcement live |
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

- DocumentApiService now types sortDocuments as WorkshopDto and deleteWorkshop as
  DeleteResultDto, matching the previously reviewed service returns (012 refactor).
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
- The unused legacy document-service uploadImage method was removed in 012.
  Section/workshop authoring continue using the shell uploader adapter. No endpoint
  or gateway change is required.

## Compatibility handoff

service-document owns DTO/Swagger/runtime alignment and generated package output.
mfe-user-journey-admin-document-editor owns request mapping, response typing and
UI recovery. The gateway owner must confirm `/api/documents` routing, upload routing
and auth forwarding; the admin shell owns route mounting and identity providers.
For contract changes: agree on runtime shapes, fix producer metadata, generate and
build contracts, review compatibility, publish only in an authorized release, then
update the consumer and verify the full journey. Section creation adds one admin endpoint; deploy it before enabling the editor flow.

Section deletion consumes the existing published 0.0.33 DELETE contract, not a new
DTO. Confirm producer support before rolling out the delete action. It deletes only
empty sections; the service must reject nonempty sections with 409 without deleting
workshops/pages or changing relationships. The consumer accepts only boolean
`acknowledged: true` with `deletedCount: 1`, then removes the confirmed section from
local catalog/cache/selection state. service-document and gateway owners must
verify live authorization, routing and persistence; installed declarations and
mocked HTTP are not proof of deployment. See [011 handoff](../specs/011-delete-sections/handoff.md).

## Local authentication mode

DocumentAuthGuard wraps the existing AuthenticationGuard. Only explicit non-production
DOCUMENT_LOCAL_DEV mode with the exact document_local URI, a loopback connection and
an approved origin supplies local-document-admin. RolesGuard is unchanged. Standalone
local development needs no live auth service; production and hosted shell auth remain
normal. See development.md for commands and origin restrictions.

## Shared section asset picker — 2026-10-04

The new picker uses the shell's uploader adapter rather than the legacy image-upload call: GET /api/uploader/folders returns FolderDto[], GET /api/uploader?archived=false&folderId=<MongoId> returns AssetDto[], POST /api/uploader/upload sends multipart file and folderId and returns AssetDto. The gateway translates /api/uploader to service-native /uploader. Requests retain shell HTTP interceptors and credentials. Published uploader types are consumed through @tmdjr/ngx-asset-manager 21.1.0 (peer contracts 0.0.13).

The folder name documents is looked up on the consumer side; only the returned folder ID is sent to the uploader. The picker permits image/*; a usable selected/uploaded URL is returned to the originating menuSvgPath or headerSvgPath field when the dialog closes. No asset ID is sent to the document service.

## Workshop authoring pages - 2026-10-05

Workshop create/edit use the same shell asset adapter, documents-folder Mongo ID,
image-only full gallery and upload acceptance. Selection/upload closes the picker
and returns its URL to thumbnail; workshop metadata is not saved until form submission.
No asset ID or file data is sent to service-document.

Fresh edit values come from GET `/navigation/workshops?section=<sectionId>`,
selected by WorkshopDto._id. No workshop metadata GET endpoint was introduced.
Create sends `{ sectionId, sortId, name, summary, thumbnail }` to the existing
create-workshop POST; edit sends `{ _id, name, summary, thumbnail }` to the existing
edit-workshop-name-and-summary POST. Create sortId is the fresh list count, matching
the former dialog. The server generates the workshop ID/slug/default page.
Published CreateWorkshopDto still requires _id; the consumer retains its existing
UpdateWorkshopDto mutation signature rather than inventing an ID. Backend runtime
acceptance/authorization remains a live check, not a contract-package change.

New route `:section/edit-workshop/:workshopId` uses the Mongo ID; existing editor
`:section/:workshopId/:documentId` continues using the workshop slug. Confirmed
responses refresh keyed navigation state and invalidate only the affected section
workshop cache. Section/page identifiers and serialized editor blocks are unchanged.

## Image picker dialog - 2026-10-05

Image-field actions now defer folder/gallery reads until a shared dialog opens.
It returns `string | undefined` through MatDialogRef/afterClosed, never an asset DTO.
Only a usable selected/uploaded image closes with a URL. Cancel/Escape/backdrop
return no value and leave metadata unchanged. Errors remain in the dialog; no root
folder fallback. Picker closure itself makes no document-service request.
The shell adapter, endpoints, credentials, folder ID and image-only upload contract
are unchanged. No producer change or release ordering is required. Closing during
an upload does not promise server-side rollback or asset deletion.

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

## Artwork value convention - 2026-10-05

The local authoring/catalog/header UI now interprets menuSvgPath, headerSvgPath and
thumbnail as either an image URL/path or a Devicon CSS-class string such as
`devicon-angular-plain colored`. Fields and request/response shapes remain strings;
no separate type discriminator, asset ID, schema, endpoint or package change.
Submit retains the ordinary trim behavior, with Devicon classes otherwise unchanged.
Picker results remain image URLs, not icons.

The user chose the shell's existing Devicon styling. mfe-shell-admin must provide
the matching font/CSS. service-document owns actual persistence/validation of these
strings; acceptance for icon-valued section creation remains part of the existing
creation-artwork integration check. Any other consumer currently binding these
fields directly to image src must add class-string branching and Devicon styles
before receiving icon-valued records; otherwise it will request the class string
as an image URL. Deliver compatible readers first, then enable/use icon-valued
records. No external consumer change or backend deployment was performed here.
