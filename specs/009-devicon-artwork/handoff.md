# Handoff: Devicon or image artwork

Status: Implemented; live integration pending
[Spec](spec.md) | [Plan](plan.md) | [Tasks](tasks.md)
Updated: 2026-10-05

## Delivered behavior

Section menu/header and workshop thumbnail fields support image URLs/paths or
Devicon CSS-class strings such as `devicon-angular-plain colored`. Each preview
renders only an image or icon, not both. Section menu/header preview bindings and
visibility now correspond to their own controls. Blank previews remain absent.
Saved section/workshop catalogs and the context header share the same classification;
Devicon values are never bound to image src/ngSrc. Existing image attributes,
Cloudinary optimization and blank catalog fallbacks remain.

Reused the user's MenuDeviconComponent/IsDeviconPipe, preserving its Material-name
fallback. Classification trims surrounding whitespace and recognizes CSS classes
instead of similarly named image files (devicon-angular.svg remains an image).
Added labelled preview hosts and decorative catalog/header icons; CSS variable
--devicon-size allows catalog/header sizing without changing default component
sizes. Input hints document class syntax.

Preserved picker dialogs/afterClosed behavior, validation, trim-on-submit, HTTP
mapping, identifiers, routes and serialized blocks. The user's other ongoing dialog
work is preserved. No package/font installation, CDN, provider or federation change.

## Verification

| Scenario/check | Result | Evidence/limits |
| --- | --- | --- |
| AC-001/002 | PASS locally | Exclusive icon/image previews on section/workshop create/edit, input events, whitespace/classes, independent menu/header values and empty states. |
| AC-003 | PASS locally | Saved section/workshop catalog Devicon branch, context header icon/image switching and mocked workshop edit reload. No icon-valued image src. |
| AC-004 | PASS locally | Exact trimmed icon POST/PATCH strings; existing image delivery, dialog/focus/error/upload, CRUD/navigation and environment regressions. |
| Shared component/pipe | PASS locally | Class and modifier detection; image-path/URL/empty rejection, trimmed decorative i and unchanged Material fallback. |
| Production build | PASS | Strict templates/source/federation; unchanged section-list style warning (4.14 kB vs 4.00 kB, 139 bytes over). |
| Hosted glyph/font check | BLOCKED | Browser opening admin document-editor redirected to auth sign-in. User explicitly confirmed shell-owned Devicon styling; local tests have no glyph CSS. |
| Persistence/auth/other consumers | NOT RUN | Mocked HTTP is not evidence of backend acceptance, release or cross-consumer compatibility. |

Actual test command: 66 SUCCESS.

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/components/devicon.component.spec.ts' \
  --include='src/app/components/document-image-picker/document-image-picker.spec.ts' \
  --include='src/app/components/workshops-pages/section-creation.spec.ts' \
  --include='src/app/components/workshops-pages/workshop-authoring.spec.ts' \
  --include='src/app/services/document-api-environment.spec.ts'
```

Tests use real components/exported child routes under a simulated host and mocked
HTTP, excluding host auth/initial resolver. They verify DOM routing/classes, not
actual Devicon glyph appearance. Synthetic image paths cause harmless 404 warnings.
The auth redirect produced existing federation component-ID warnings; these were
not addressed as unrelated.

Build command: `npm run build -- --output-path
/tmp/document-editor-devicon-6d08b5df`. Temporary output removed, watched dist
untouched. `git diff --check` passes. No dependencies changed or installed.

## Contract and external handoff

The user selected the admin shell's existing Devicon font/CSS rather than bundling
it locally. mfe-shell-admin/release owner must verify the stylesheet includes the
entered glyph classes and that icons look correct in previews/catalog/header.

service-document retains string fields menuSvgPath/headerSvgPath/thumbnail with the
same DTOs/endpoints. Verify icon-valued create/edit/reload without losing IDs,
workshop associations or page references. Expanded section creation artwork
acceptance is still the existing separate integration obligation.

Other consumers of these fields must recognize the class-string convention and
provide compatible Devicon styles rather than binding it to img src. Deliver
compatible readers before icon-valued records reach them. No backend/other-repo
code, package publication, data migration or deployment was performed.

## Remaining work and context

X001 remains: sign into hosted admin shell and verify real glyphs, images, saved
records/reload, keyboard/narrow layout and consumer compatibility. Local
implementation tasks are complete.
Architecture, development, HTTP contract map and feature index updated;
constitution unchanged.
