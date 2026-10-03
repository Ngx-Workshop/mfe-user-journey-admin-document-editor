# Document editor development

## Local document workflow (2026-10-03)

This mirrors the assessment repositories, using document-specific ports and data.
Prerequisite: MongoDB listening on 127.0.0.1:27017. After npm ci in each repository,
run these commands in separate terminals:

```bash
# service-document
npm run start:local
```

```bash
# mfe-user-journey-admin-document-editor
npm run dev:bundle
```

Open the MFE Orchestrator at https://admin.ngx-workshop.io/list-mfe-remotes. For the
document editor, open the code-icon Dev Mode Options, enable Dev Mode, and set
Remote Entry Point to http://localhost:4202/remoteEntry.js. Then open
https://admin.ngx-workshop.io/document-editor and reload after changes. The override
applies only to your browser; the global registry is unchanged. The document API is http://localhost:3007; data is stored
only in mongodb://127.0.0.1:27017/document_local. Port 4202 avoids the assessment
remote on 4201. This database starts empty; use Create Section, then Create New
Workshop. No production records are copied or required.

The local service sets DOCUMENT_LOCAL_DEV=true and NODE_ENV=development, overrides
MONGODB_URI/PORT, binds only to loopback and supplies local-document-admin. It rejects
other database URIs, non-loopback peers and unapproved origins. CORS allows
https://admin.ngx-workshop.io, http://localhost:4202 and http://127.0.0.1:4202.
Production mode and normal start:dev retain the platform authentication guard and
public-route metadata. Do not tunnel or reverse-proxy local auth mode.

The signed-in hosted shell owns routing and authentication. The root App remains
empty and the exported Routes retain userAuthenticatedGuard. Development bundles
use environment.development.ts for localhost:3007; production bundles use
/api/documents. Port 4202 serves assets, not a standalone editor.
Build production into a separate folder while the bundle watcher runs:
npm run build -- --output-path /tmp/document-editor-production-check.

All navigation, content, mutation and upload requests use the environment API base.
The service has no uploader endpoint: image URL entry works, local file uploads
require the external uploader and are outside this setup.

Verified: 29 service tests, 8 browser unit/component tests, production builds,
production API URL isolation and live browser/HTTP checks against local MongoDB.
See [local setup handoff](../specs/002-local-development/handoff.md) for scope and limits.

## Local setup and host integration

Use the repository's package-lock.json with npm ci. CI uses Node 22; use a Node 22
release compatible with the pinned Angular toolchain. Packages must be available
from the configured registry; do not embed registry credentials in source.

| Command | Purpose / prerequisites |
| --- | --- |
| npm ci | Install locked dependencies |
| npm start | Stock Angular server; not the hosted-shell development workflow |
| npm run build | Production bundle into dist/mfe-user-journey-admin-document-editor |
| npm run watch | Development watch build |
| npm run serve:bundle | Static bundle server on 4202; requires existing output |
| npm run dev:bundle | Watch + static bundle server for the hosted-shell override |
| npm test -- --watch=false --browsers=ChromeHeadless | Configured Karma runner; requires Chrome and real specs |
| ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json | TypeScript source check; does not validate Angular templates or runtime integration |

The shell mounts the exported Routes and supplies authentication context.
No frontend authentication bypass or local API proxy is needed.

## Verification by change

For UI/behavior changes run the production build, relevant unit/component checks
and host-mounted acceptance scenarios. Cover catalog/deep links, CRUD, sorting,
block round-trip, request failure/retry, permission denial, keyboard/focus and narrow
viewports where affected. Use HTTP test doubles for local failures and report their
limits. Section creation now has six browser component/HTTP checks in
src/app/components/workshops-pages/section-creation.spec.ts; unrelated journeys
still need coverage. There is no package lint script.

## Migration checks — 2026-10-01

- PASS: TypeScript command above using the installed dependencies.
- PASS: source/configuration/legacy workflow review; no frontend unit spec files found.
- PASS: 38 local documentation links resolve; all four feature templates exist,
  constitution gates are present and plan metadata fields match the legacy parser.
- PASS: bash syntax checks for all five retained helper scripts. Feature-changing
  helper commands were not executed.
- NOT RUN: npm ci, production build, Karma/browser journey, gateway/auth/upload
  integration or deployment. This was a documentation migration, not runtime work.

## Known limitations

See [readiness](document-readiness.md) for route/default-page, cache, save ordering,
loading/error recovery, accessibility and static publication-label findings.
[Contracts](api-contracts.md) records response typing, section-key and upload gaps.
Angular 21 with federation/build tooling 20 is an existing compatibility constraint;
this migration does not upgrade dependencies or claim a host build was verified.

## Section creation verification — 2026-10-03

Both production builds, service OpenAPI/contract generation and contract compilation
pass. Service tests: 15 passing; editor ChromeHeadless tests: 6 passing. Service tests
mock persistence and remote identity while exercising real validation/schema defaults
and role enforcement. Editor tests mock HTTP. No live database, auth or gateway test
was performed. See [feature handoff](../specs/001-create-sections/handoff.md).
Earlier migration results above are historical; generated-contract compilation now
passes, while the direct TypeScript deleteOutDir configuration issue remains separate
from the successful Nest production build.
