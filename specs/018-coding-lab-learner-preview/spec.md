# Coding lab learner preview
Status: Implemented and locally verified · 2026-10-06

Show exact linked published lab content instead of Hello world: title/language,
instructions, editable starter code, reset, expandable hints and sample examples.
Code remains local; no fabricated execution/scoring when no learner runner exists.
Read redacted PublishedLabDto only, excluding hidden tests/reference solutions.
Show loading, missing/unpublished/access-denied/error/retry and empty content states.
Cancel stale reads/reset edits when resource changes; preserve other page types.
Constitution: strict published types, stateless API, focused view state, inline BEM,
Material/keyboard controls, no route/federation changes or unsafe HTML rendering.
