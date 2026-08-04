# Roadside Inspection Intake — Implementation Plan

1. Specify domain behavior with failing tests for BASIC mapping, extraction normalization, tenant guarding, manual fallback, UI pre-fill, and additive schema evolution.
2. Implement a pure normalization and mapping module that preserves unknowns for review.
3. Add the authenticated parse endpoint and explicit API route classification.
4. Extend the existing inspection register with upload, extraction status, review warning, and pre-filled save flow while retaining manual and CSV entry.
5. Add the source-only migration and operational documentation.
6. Run focused tests, the complete Node suite, security/API Playwright suites, TypeScript, production build, and repository hygiene checks before publishing a draft stacked PR.
