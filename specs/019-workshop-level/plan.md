# Plan

Add schema defaults/range, request DTO validation, response projection and edit persistence in service-document; regenerate OpenAPI/contracts. Add required numeric form control, bounds, integer validation, load/reset and payload mapping in the editor. Published contracts 0.0.36 predate level: use a narrow optional level extension when reading until a regenerated package is released.

Delivery order: deploy service support before editor adoption; publish generated contracts separately, then upgrade editor dependency and remove temporary read extension. No publication/deployment in this task. Legacy records receive a read default; no bulk migration.

Constitution Check: Existing API paths, federation exports and authorization remain intact. Verify DTO/schema/service behavior and routed form/payload tests; builds do not establish hosted integration.

Display follow-up: project workshopLevel into the detail view model, render a Material chip in the toolbar and a level label below each card title. Use existing published level types and preserve a default of 1. Update test fixtures for the installed contract requirement.
