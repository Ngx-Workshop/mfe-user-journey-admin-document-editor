# Administrator document editor

Angular micro-frontend for Ngx-Workshop workshop and page authoring: section
catalogs, workshop metadata, ordered pages and block editing.

Start with [AGENTS.md](AGENTS.md) for the repository context and working rules.

- [Architecture and source map](docs/architecture.md)
- [Development and verification](docs/development.md)
- [HTTP contracts and external owners](docs/api-contracts.md)
- [Current gaps and readiness](docs/document-readiness.md)
- [Specification workflow](.specify/README.md), [constitution](.specify/memory/constitution.md)
  and [feature index](specs/README.md)
- [Migration record](docs/seed-adoption.md)

## Development

```bash
npm ci
npm run dev:bundle
```

The watched static bundle exposes remoteEntry.js on localhost:4201. Load it through
the admin shell’s Dev Mode override at https://admin.ngx-workshop.io/document-editor. Development calls
localhost:3007; production calls /api/documents through the gateway.
Build with npm run build. See the development guide for full prerequisites and checks.

## Integration snapshot

Angular/Material 21.1.0, editor-js2 ^21.0.9 and document-contracts 0.0.22.
Federation exposes ./Component (default App) and ./Routes (named Routes), with the
existing internal name ngx-seed-mfe. Preserve these contracts unless deliberately
migrating the host. The UI's Published label does not implement a publishing lifecycle.

The repository-local Markdown workflow is adapted from the seed/assessment repos.
Existing Spec Kit prompts and shell helpers remain optional adapters; see the
workflow guide before using them on existing feature files.

## Isolated local development

With MongoDB on 127.0.0.1:27017, run npm run start:local in service-document and
npm run dev:bundle in mfe-user-journey-admin-document-editor. Set the document editor
Dev Mode remote entry to http://localhost:4201/remoteEntry.js, then open
https://admin.ngx-workshop.io/document-editor.
The local API uses 3007 and the isolated document_local database; production keeps
its existing auth and API URLs. See [setup and hosted bundle instructions](docs/development.md).
