# Document editor development

## Local setup and host integration

Use the repository's package-lock.json with npm ci. CI uses Node 22; use a Node 22
release compatible with the pinned Angular toolchain. Packages must be available
from the configured registry; do not embed registry credentials in source.

| Command | Purpose / prerequisites |
| --- | --- |
| npm ci | Install locked dependencies |
| npm start | Serve remoteEntry.js on localhost:4201 |
| npm run build | Production bundle into dist/mfe-user-journey-admin-document-editor |
| npm run watch | Development watch build |
| npm run serve:bundle | Static bundle server on 4201; requires existing output |
| npm run dev:bundle | Watch + static server; do not run alongside npm start on the same port |
| npm test -- --watch=false --browsers=ChromeHeadless | Configured Karma runner; requires Chrome and real specs |
| ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json | TypeScript source check; does not validate Angular templates or runtime integration |

The standalone root App is empty and app.config.ts does not register a router.
Use a host mounting ./Routes with router/auth metadata providers to exercise the
journey. No local API proxy is configured in angular.json. Browser requests use
/api/documents; arrange same-origin gateway routing and authenticated context.
A successful static bundle fetch is not a complete standalone demo.

## Verification by change

For UI/behavior changes run the production build, relevant unit/component checks
and host-mounted acceptance scenarios. Cover catalog/deep links, CRUD, sorting,
block round-trip, request failure/retry, permission denial, keyboard/focus and narrow
viewports where affected. Use HTTP test doubles for local failures and report their
limits. There are currently no src/**/*.spec.ts files; the configured test command
does not establish coverage. There is no package lint script.

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
