# Workshop level handoff — 2026-10-10

Implemented: level defaults to 1, accepts integer request values 1–20, is returned on workshop responses and persisted on edit. Create callers may omit it; updates preserve omitted level. Required numeric editor input loads saved levels and defaults legacy responses to 1.

153 service tests and 28 focused ChromeHeadless workshop-authoring tests passed. Service production build, OpenAPI regeneration, generated contract compilation and editor production build passed. Whitespace checks passed. Tests use isolated persistence/HTTP doubles; no live MongoDB, gateway or hosted UI integration was run.

Delivery order: service-document support must deploy before the editor. Generated contracts are ready locally; publication and editor dependency upgrade remain release work. Editor currently reads level using a narrow extension to published 0.0.36 types; remove it after upgrading. No package was published or application deployed.
