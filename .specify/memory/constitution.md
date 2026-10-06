# Constitution — Document editor remote

Version: 1.2.0 · Last amended: 2026-10-05
Original ratification date is unknown; the previous 1.0.0 record was amended 2026-01-12.

This amendment preserves the five original principles and expands them with
repository-specific boundaries and the local workflow. Updated dependent templates
and context documents accompany this migration. These are requirements for future
changes, not evidence that inherited code already meets every requirement.

## 1. Code quality

Keep strict TypeScript and Angular template checking. Prefer standalone components,
Angular control flow, typed reactive forms, signals and RxJS as appropriate to the
existing zoneless Angular application. Avoid new any types and unnecessary state
frameworks. Follow MVVM: stateless HTTP services, singleton domain state/command orchestration,
route/dialog view models and focused presentational components. Components consume
observable streams/signals; data access owns no singleton selection or editor state.

## 2. Testing

Cover changed logic with meaningful unit tests, changed UI with observable component
checks, and bug fixes with regressions. Tests must be deterministic and isolated.
Verify route resolution, payload mapping and failure recovery where affected.
A build or mocked response is not evidence of host/service integration.

## 3. Consistent user experience

Use Angular Material and established shared components. Make loading, empty,
validation, saving, success and error states truthful. Preserve recoverable edits
and prevent ambiguous duplicate mutations. Do not imply publication/versioning
from the current static Published label.

## 4. Accessibility

Interactive controls must support keyboard access and useful labels. Use semantic
HTML, deliberate dialog focus handling and responsive layouts. Ordering actions
need an accessible equivalent where drag-and-drop alone is insufficient.

## 5. Simple, idiomatic design

Prefer small focused components and existing patterns. Keep HTML and SCSS inline in the component TypeScript file. Aim for approximately
230 lines per component, splitting at meaningful view/orchestration boundaries rather
than hiding code. Use BEM for application-owned SCSS classes. Avoid unrelated refactors in feature work.

## 6. Document integration boundaries

The shell owns composition and auth context. Preserve default App, named Routes,
remoteEntry.js and ./Component / ./Routes exposures, including shared dependency
compatibility. The legacy federation name is a contract until deliberately migrated.
The service owns authorization and data; frontend authentication is not an admin
permission boundary. Use published document DTOs and explicit request mapping.
Preserve the distinction between workshop Mongo ID, workshop slug, page ID and
section key. The html field contains serialized editor blocks, not raw page markup.
Changes to its format require consumer compatibility and migration decisions.

## Workflow and governance

Read local context before work; maintain spec, plan, tasks and handoff for substantive
behavior changes. Include a Constitution Check in each spec/plan/tasks set. Check
correctness, tests, UX and accessibility, and document contract migration plans.
Record existing gaps separately. Amend principles intentionally with rationale,
version/date changes and dependent-template review; use a PR when submitting.

## 1.2.0 amendment
The user's 2026-10-05 repository refactor request makes inline component HTML/SCSS,
BEM and MVVM layering durable rules. The line count remains a design target rather
than a hard gate. The 012 spec/plan/tasks and architecture/development context were
reviewed against these rules; generic feature templates remain applicable.
