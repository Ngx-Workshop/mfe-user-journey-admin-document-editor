# Coding lab gallery handoff
Status: Implemented and locally verified · 2026-10-06

## Delivered

Searchable responsive gallery on Create Page when Coding Lab is selected, backed
by installed coding-labs-contracts 0.0.6 and existing /api/coding-labs/labs. Stateless
HTTP API, picker request state and presentation gallery are separate components.
Cards show available summary/tags/difficulty/duration plus explicit Draft/Published
status; archived labs omitted. Selected lab summary/highlight persists across searches
and pages. Loading, empty/error/retry and Load More supported with pending guards.
Search input uses Enter without submitting the enclosing page form.

Route selection supplies resourceId and suggests title unless the author has changed
the name. Switching types clears selection, preventing ID reuse between services.
Existing add-reference persists only workshop placement; coding-lab data is never
mutated. Assessment IDs remain manual. External page views remain placeholders.

## Verification

132 passing ChromeHeadless tests, app/spec TypeScript checks, production build into
separate /tmp output, clean whitespace checks. New tests exercise cards, filtering,
credentials, paging/search/deduplication/retry/empty/denied access, disabled controls,
route selection/name behavior, pending selection guard and exact reference payload.

Live signed-in hosted shell with local remote: published Sum an array demo challenge
loads from hosted coding API. Selection highlights card, suggests page name and
enables Create, with no console errors. The selected form is left open, unsubmitted;
no workshop/lab data changed. Screenshot in /tmp/document-editor-coding-lab-gallery.png.
Real catalog paging and permission failures verified with HTTP doubles; live catalog
contains one available lab. Existing reference persistence already verified in 014.

## Boundaries

Both environments use hosted /api/coding-labs; development documents remain
localhost:3007. No host registry/shared-federation or backend changes, publication or
deployment. Local lab service can be configured later via environment base, with its
normal CORS/auth. Test/lab execution and an assessment picker remain future work.
