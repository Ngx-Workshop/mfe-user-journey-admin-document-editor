# Document editor tests

Keep specs outside production source. `testing/app` mirrors `src/app`:

- `testing/app/components/workshops-pages/sections` covers section catalog/authoring/deletion.
- `testing/app/components/workshops-pages/workshops` covers workshop catalog/authoring.
- Other component, service and view-model specs follow their matching app folders.

Test files import application code from `src/app`; application code must not import
from `testing`. When moving application files, move matching specs and update imports.

Run the complete suite with:

```sh
npm test -- --watch=false --browsers=ChromeHeadless
```

Run a focused suite with:

```sh
npm test -- --watch=false --browsers=ChromeHeadless \
  --include='../testing/app/services/document-state.spec.ts'
```

The installed Karma builder discovers tests relative to the project's `src` source
root, so `angular.json` uses `../testing/**/*.spec.ts`. `tsconfig.spec.json` includes
`testing/**/*.ts` plus source declarations; imported application modules are compiled
through their imports. `tsconfig.app.json` excludes specs and the testing tree.
