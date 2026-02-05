# Document Editor Tests<br><sup>MFE User Journey - Publisher</sup>

<img src="https://github.com/Ngx-Workshop/.github/blob/main/readme-assets/angular-gradient-wordmark.gif?raw=true" height="132" alt="Angular Logo" /> <img src="https://github.com/Ngx-Workshop/.github/blob/main/readme-assets/module-federation-logo.svg?raw=true" height="132" style="max-width: 100%;height: 132px;" alt="Module Federation" />

Angular micro-frontend (remote) for the **Publisher Document Editor** user journey in the NGX Workshop ecosystem.

This remote provides the document authoring and workshop management UI for sections like Angular, RxJS, and NestJS, including page editing, sorting, and CRUD flows.

## Summary

- **Framework:** Angular 21 (standalone components, zoneless change detection)
- **MFE:** Webpack Module Federation via `@angular-architects/module-federation` + `ngx-build-plus`
- **UI:** Angular Material + custom shared headers
- **Editor:** `@tmdjr/ngx-editor-js2`
- **APIs:** `/api/documents/**` and `/api/documents/navigation/**`

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install dependencies

```bash
npm install
```

### Run the remote in dev mode

```bash
npm start
```

The dev server runs on **http://localhost:4201** and serves the Module Federation remote at:

```
http://localhost:4201/remoteEntry.js
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Serve the built bundle (local preview)

```bash
npm run dev:bundle
```

This runs a watch build and serves the output from `dist/` on port **4201**.

## Architectural overview

### Micro-frontend exposure

The remote is configured via custom Webpack using `withModuleFederationPlugin`:

- **Remote name:** `ngx-seed-mfe`
- **remoteEntry:** `remoteEntry.js`
- **Exposes:**
  - `./Component` → root `App` component (default export for dynamic loading)
  - `./Routes` → route configuration for the host to mount

### Application bootstrap

- `src/main.ts` dynamically imports `bootstrap.ts`.
- `bootstrap.ts` bootstraps the standalone `App` component with `appConfig`.
- `appConfig` enables:
  - zoneless change detection
  - async animations
  - HttpClient with DI interceptors
  - Reactive Forms

### Routing & data flow

The remote supplies a route tree that:

- Guards entry via `userAuthenticatedGuard`.
- Resolves sections and workshop data before rendering.
- Lazily loads pages and detail views.

Key routes:

- `/` → section list
- `/:section/workshop-list` → workshop list per section
- `/:section/:workshopId/:documentId` → workshop page editor

### Core services

- **NavigationService**

  - Loads sections, workshops, and workshop pages
  - Manages in-memory state via `BehaviorSubject`s
  - Caches section workshop lists with a TTL

- **WorkshopEditorService**
  - Handles CRUD and sorting for workshops and pages
  - Persists editor HTML blocks and uploads assets

### UI composition

- **Section list** provides entry points for Angular, RxJS, and NestJS workshops.
- **Workshop list** shows cards with preview images and management actions.
- **Workshop detail** hosts the Editor.js-based page editor with pagination and sidepanel controls.
- **Side panels & modals** provide create/edit/delete flows for workshops and pages.

## Notes

- The remote expects API endpoints under `/api/documents` to be available from the host or a proxy.
- This project is intended to be consumed by a host shell that loads `remoteEntry.js` and mounts the exposed routes.
