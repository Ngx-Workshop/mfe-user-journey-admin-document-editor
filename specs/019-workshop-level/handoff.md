# Workshop level handoff — 2026-10-10

Implemented: level defaults to 1, accepts integer request values 1–20, is returned on workshop responses and persisted on edit. Create callers may omit it; updates preserve omitted level. Required numeric editor input loads saved levels and defaults legacy responses to 1.

153 service tests and 28 focused ChromeHeadless workshop-authoring tests passed. Service production build, OpenAPI regeneration, generated contract compilation and editor production build passed. Whitespace checks passed. Tests use isolated persistence/HTTP doubles; no live MongoDB, gateway or hosted UI integration was run.

Delivery order: service-document support must deploy before the editor. Generated contracts are ready locally; publication and editor dependency upgrade remain release work. Editor currently reads level using a narrow extension to published 0.0.36 types; remove it after upgrading. No package was published or application deployed.

Workshop level display follow-up (2026-10-10): detail toolbar now shows a Material level chip; workshop cards show level below the title. Both default missing level to 1. The toolbar follows current workshop state. Installed contracts include level; five test fixtures were updated to the required field. Verified 52 focused ChromeHeadless tests and production build; no hosted UI check or deployment.
