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

## 2026-10-20 — Agent Runtime publication

- Confirmed PR #1 merged to `main`.
- Added Agent Runtime deployment files: `requirements.txt`, `agent/deploy.py`, and
  `scripts/deploy_agent_runtime.sh`.
- Enabled the required Vertex AI, BigQuery, Cloud Storage, Logging, Resource Manager, IAM, Cloud
  Build, Artifact Registry, and Service Usage APIs.
- Created the private staging bucket `gs://qwiklabs-gcp-04-9fa9c7b57012-agent-staging`.
- Deployed the agent to Agent Runtime resource
  `projects/qwiklabs-gcp-04-9fa9c7b57012/locations/us-east1/reasoningEngines/1188724901742116864`.
- Granted the default Agent Runtime identity BigQuery Job User and Data Viewer access at project
  scope because the lab did not allow dataset-level IAM bindings.
- Hosted smoke test passed: the agent returned 109 Miami-Dade EVAC/BOTH shelter candidates and
  105,407 listed evacuation capacity.
- Opened follow-up deployment PR #3 for the repository deployment scaffolding.
- Confirmed raw Miami-Dade shelter counts: 138 distinct shelter records; 113 EVAC/BOTH records; 109 EVAC/BOTH records with positive evacuation capacity and therefore in the current gold candidate set.
- Smoke-tested an ADK agent with `google_maps_grounding` against Gemini 3.6 Flash and Gemini 2.5 Flash. Both failed before tool execution with Vertex AI `aiplatform.endpoints.predict` permission denied; no Maps batch was run.
- Retried after the Cloud Shell IAM grant. The student account now visibly has `roles/aiplatform.user`, but the local ADK process still receives the same 403, indicating its Application Default Credentials are not the Cloud Shell/student identity or the lab model endpoint is separately restricted.
- ADC was re-authenticated locally with the hackathon project quota. Maps grounding smoke test succeeded for Dr. Michael M. Krop Senior High School and returned a Google Maps place ID.
- Added `agent/batch_maps_validation.py`; a 5-row smoke batch wrote 5 `confirmed_match` records.
- Completed the remaining 104 Miami-Dade candidate validations. Final result: 109 total, 104 `confirmed_match`, 5 `address_mismatch`, 0 API errors.
- Discovered `feature/agent-and-views`, the separate Lee County ADK agent build with State A/B/C/D access logic, equity auditing, medical power planning, and Maps Grounding.
- Chose Lee County as the single canonical hackathon county because this agent already had end-to-end live tests and a stronger operational decision contract.
- Added Lee County gold views to `sql/build_stg_gold.sql`: `lee_tract_risk`, `lee_shelter_readiness`, `lee_tract_shelter_options`, `lee_tract_access_state`, `lee_equity_audit`, and `lee_county_power_dependence`.
- Rebuilt the staging/gold script successfully in BigQuery. Lee gold contains 221 tracts, 82 eligible shelter records, 8,794 tract-shelter options, and State A/B/D classifications.
- Migrated `agent/tools.py` from raw `evacuation_readiness` views to `evacuation_readiness_gold` Lee views. Tool suite result: 5/5 passed.
- Deployed canonical Lee County Agent Runtime resource: `projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104`.
- Remote Agent Runtime smoke tests passed for top stranded tracts/access states and named-shelter Google Maps verification.
- Added the Lee County outreach seed table `evacuation_readiness_gold.lee_outreach_organizations` with official Emergency Management, CERT, ARES/RACES, and United Way coordination leads.
- Added `find_outreach_candidates` and a dedicated Google Search-grounded `agent.outreach` agent for finding and verifying peer-program outreach partners near high-risk tracts.
- Rebuilt BigQuery successfully and verified six curated outreach seed records; updated the frontend handoff with outreach lead fields and safety semantics.
