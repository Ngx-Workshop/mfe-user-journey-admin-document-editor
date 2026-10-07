# Source organization

The three admin authoring remotes use the same feature-first convention. This
checkout contains its own implementation; sibling repositories are not required.

```text
src/
  main.ts, bootstrap.ts, index.html, styles.scss
  environments/
  app/
    app.ts, app.config.ts, app.routes.ts
    features/
      <feature>/
        pages/          # Routed areas, local view models and page-only views
        components/     # Views/workspaces reused by pages
        api/            # Stateless HTTP and external data adapters
        state/          # Singleton server state and command orchestration
        models/         # Domain types and published-contract adapters
        forms/          # Form factories and validators
        utils/          # Pure projection, ordering and other helpers
        config/         # Feature-specific configuration
        resolvers/      # Route data resolution
```

Feature roots are `assessment-tests`, `document-editor` and `coding-labs` in their
respective repositories. Create a category only when it contains code; empty
placeholder directories are unnecessary. Domain-specific page names may differ,
but these category names and responsibilities stay the same.

Keep a page's dedicated presentation components and view models beside that page.
Move a component into `components/` when it serves multiple pages. Keep cohesive
workspaces in a named subfolder. Document authoring areas remain grouped as
`pages/sections`, `pages/workshops` and `pages/documents`. Existing file names and
exported symbols are retained; `.page.ts` and `.component.ts` both identify routed
components in the inherited code.

`app.routes.ts` remains the public federation route entry. A feature may have an
internal route module. Bootstrap, environment files, route URLs, HTTP contracts,
provider lifetimes and federation exports are unaffected by this layout.

Tests live in `testing/app/features/<feature>/`, mirroring production responsibility
folders; `testing/app/app.spec.ts` covers the app when present. Scenario suites may
cover several modules in the same area. Never import tests into production source.

Run `npm run check:layout` to detect misplaced application files, unknown feature
categories, source-tree specs and test folders without corresponding source folders.
Run the existing unit suite and production build after moving files. Keep this
convention and the local architecture source map current. Historical feature
records describe the paths used when that work was delivered.
