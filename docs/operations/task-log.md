# Hackathon task log

This file is append-only. Add new entries at the bottom; do not rewrite prior entries.

## 2026-10-20

- Cloned and inspected the Challenge 4 hurricane-evacuation repository.
- Confirmed the Florida source tables in BigQuery dataset `evacuation_readiness`.
- Audited source quality: missing shelter usage, unrecorded accessibility/generator fields, normalized duplicate shelter groups, hazard join gaps, and Florida transportation-field coverage.
- Created reproducible raw → staging → gold build in `sql/build_stg_gold.sql`.
- Created `evacuation_readiness_stg` and `evacuation_readiness_gold` datasets.
- Created shelter readiness, tract-to-shelter options, and county risk gold tables.
- Ranked Florida counties; Miami-Dade (FIPS 12086) ranked highest in the current snapshot at 75.4/100.
- Validated a sample of Miami-Dade shelters using Google Maps/search and official facility sources.
- Created the two-page interactive team pitch: `hurricane-readiness-pitch.html` and its Markdown source.
- Narrowed the operating scope to Miami-Dade County.
- Added `miami_dade_tract_mobility_proxy`, `miami_dade_tract_shelter_options`, and `miami_dade_county_risk_snapshot` to the gold layer.
- Documented the agent-facing gold schema and Maps grounding handoff in `miami-dade-agent-handoff.md` and `.html`.

## 2026-10-20 — Repository organization

- Removed the temporary pitch artifacts from the repository.
- Moved handoffs to `docs/handoffs/`, validation results to `docs/validation/`, product decisions to
  `docs/decisions/`, and the append-only log to `docs/operations/`.
- Updated the agent README and added `docs/README.md` as the documentation index.
- Confirmed raw Miami-Dade shelter counts: 138 distinct shelter records; 113 EVAC/BOTH records; 109 EVAC/BOTH records with positive evacuation capacity and therefore in the current gold candidate set.
- Smoke-tested an ADK agent with `google_maps_grounding` against Gemini 3.6 Flash and Gemini 2.5 Flash. Both failed before tool execution with Vertex AI `aiplatform.endpoints.predict` permission denied; no Maps batch was run.
- Retried after the Cloud Shell IAM grant. The student account now visibly has `roles/aiplatform.user`, but the local ADK process still receives the same 403, indicating its Application Default Credentials are not the Cloud Shell/student identity or the lab model endpoint is separately restricted.
- ADC was re-authenticated locally with the hackathon project quota. Maps grounding smoke test succeeded for Dr. Michael M. Krop Senior High School and returned a Google Maps place ID.
- Added `agent/batch_maps_validation.py`; a 5-row smoke batch wrote 5 `confirmed_match` records.
- Completed the remaining 104 Miami-Dade candidate validations. Final result: 109 total, 104 `confirmed_match`, 5 `address_mismatch`, 0 API errors.
