# Assessment learner preview
Status: Implemented and locally verified · 2026-10-06

FR-001 Replace only ASSESSMENT_TEST Hello world with the exact linked assessment.
FR-002 Show metadata, start action, accessible single-choice questions and progress.
FR-003 Finish only after all questions have valid answers; show local score and feedback,
correct answers after completion, and restart. Render definition content as plain text.
FR-004 Handle loading, empty definition, missing link, not found, access denied and retry.
FR-005 Cancel stale reads/reset answers on linked-test changes; do not mutate remote
assessments, learner attempts or document blocks. Coding lab placeholder stays intact.

Constitution: strict published types, stateless HTTP, focused view state, inline BEM,
Material controls, deterministic tests, existing route/federation/service ownership.
