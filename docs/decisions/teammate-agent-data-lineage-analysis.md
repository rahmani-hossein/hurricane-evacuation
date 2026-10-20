# Teammate Agent: Data Lineage, Use-Case Test, and Gold Recommendation

**Date:** 2026-10-20  
**Scope:** `qwiklabs-gcp-04-9fa9c7b57012`, Miami-Dade hurricane-readiness workstream  
**Deployment inspected:** Cloud Run service `hurricane-evacuation-command`

## Context

The team suspected that a teammate had created an agent directly in the Google Cloud UI and that it was not using the curated gold tables. We inventoried Agent Runtime, Agent Registry, Discovery Engine, and project assets, inspected the Cloud Run deployment separately, downloaded its Cloud Run source archive, and exercised its public API. The Cloud Run command center is now explicitly excluded from the target agent in this note; it is the frontend deployment, not the separate build being sought.

## Findings

### What was found

- Agent Runtime has one project-owned reasoning engine: **Miami-Dade Hurricane Readiness**, `projects/851021919219/locations/us-east1/reasoningEngines/1188724901742116864`.
- Agent Registry has the corresponding Miami-Dade agent plus Google’s default Workspace Agent. No second teammate-created Agent Runtime/Registry agent was found.
- Cloud Run service **`hurricane-evacuation-command`** is healthy at `https://hurricane-evacuation-command-w43rjf4g6q-ue.a.run.app` and was created by another lab account. It is the command-center frontend deployment, not the separate agent build requested here.
- Its backend imports `agent.agent.query_miami_dade_readiness`, sets `DATASET = "evacuation_readiness_gold"`, and queries gold tables for overview, priority tracts, shelter options, and shelter details.
- Its copilot calls the same Agent Runtime engine above. The live response identified itself as `Vertex AI Agent Runtime (gemini-3.6-flash)` and returned current gold-backed metrics.
- Its frontend is **not fully live**. `frontend/src/App.tsx` initializes with `MOCK_MIAMI_DADE_DATA` and swaps to `MOCK_LEE_COUNTY_DATA`; `MapView`, `StatCards`, and `ReadinessBrief` render those mock objects. The frontend does not fetch the live overview, tract, or shelter endpoints for those visual surfaces.

### Data lineage map

| Surface | Current source | Status | Consequence |
|---|---|---|---|
| `/api/health` | hardcoded metadata | live endpoint | Says gold-backed, but is not a data freshness check |
| `/api/miami-dade/overview` | `evacuation_readiness_gold.miami_dade_county_risk_snapshot` | live gold | Good foundation for KPI cards |
| `/api/miami-dade/priority-tracts` | `evacuation_readiness_gold.miami_dade_tract_mobility_proxy` | live gold | Good foundation for risk layers |
| `/api/miami-dade/shelter-options` | gold tract/shelter tables plus Maps validation | live gold | Good foundation for shelter selection |
| `/api/copilot/chat` | deployed Agent Runtime, gold tool, Maps grounding | live agent | Useful planning copilot; not a live dispatch system |
| map markers and heatmap | `frontend/src/mock/readinessData.ts` | demo/mock | Can disagree with current BigQuery values |
| stat cards and action directives | `frontend/src/mock/readinessData.ts` | demo/mock | Claims may drift or overstate operational readiness |
| shelter details | mock shelter objects | demo/mock | Visual status is not guaranteed to match gold or current Maps validation |

## Supported use cases tested

1. **County readiness overview** — passed. The service returned population, no-vehicle households, shelter count/capacity, accessibility-record status, power-dependent DME, mobility proxy, and county priority score.
2. **Priority-area ranking** — passed. The service returned ordered Miami-Dade tract IDs with population, no-vehicle rate, mobility limitation, no-internet rate, and mobility proxy score.
3. **Shelter options for a high-need tract** — passed. The service returned shelter candidates, straight-line miles, listed capacity, readiness fields, and Maps place IDs.
4. **Medically dependent resident with no peer** — useful planning answer. The copilot recommended EEAP/Special Needs Shelter/medical-control escalation, while preserving the distinction between listed and confirmed capacity. This should be treated as policy guidance requiring human/agency verification, not an automated dispatch decision.
5. **Surge-zone question** — the request reached the live copilot, but the test call did not complete within the 30-second client window. The UI also has a client fallback that contains a hardcoded surge claim, so this path needs a deterministic API-backed test before demo use.

## Risks and gaps

- **Mock/live divergence:** the visual command center can show one set of tracts, shelter counts, capacities, and directives while the copilot answers from another.
- **Lee County implies multi-county support but is mock-only:** the selector changes the mock dataset; the backend remains Miami-Dade-oriented.
- **No operational status contract:** gold values are planning-time snapshots. They do not prove a shelter is open, has beds, has working generators, or can accept a particular medical need.
- **Accessibility semantics are mostly correct but need UI enforcement:** `unrecorded` must remain visually distinct from `no` and must not become “accessible” or “inaccessible” by styling shorthand.
- **The frontend fallback is unsafe for emergency claims:** hardcoded responses should be removed or clearly labeled as offline demo content; a failed backend should produce an unavailable state, not a confident operational claim.
- **Copilot source links are partly static:** the response currently appends fixed Maps links for two shelters even when the question is about another shelter or tract. Sources should be derived from the actual tool result.
- **Fallback code deserves review:** the direct Vertex fallback appears nested after the successful Agent Runtime return path, so it is not a reliable fallback if the runtime fails. The deterministic fallback can mask failure with a confident answer.

## Recommendation

**Move the command-center visual layer to gold-backed API responses now; do not replace the working Agent Runtime agent.** The gold migration is a targeted data-lineage fix, not a rewrite:

1. Keep the existing Agent Runtime and its gold query tool as the conversational source of truth.
2. Add a typed `/api/miami-dade/readiness` response or parallel calls that returns the county snapshot, priority tracts, shelter candidates, Maps validation status, and freshness metadata.
3. Replace `MOCK_MIAMI_DADE_DATA` in the coordinator view with API state. Keep mock data only behind an explicit “demo/offline preview” flag.
4. Have the backend compute directives from gold fields and label each directive as `planning recommendation`, `needs field verification`, or `current operational confirmation required`.
5. Make every selected tract/shelter detail panel use the same API payload as the map layer and link only to its actual `maps_place_id`.
6. Add automated contract checks for: 109 candidate shelters, 105,407 listed capacity, 104 accessibility-unrecorded candidates, top tract `12086980700`, and no claim that a candidate is open.
7. Treat live routing, shelter opening, bed availability, medical acceptance, and dispatch as separate real-time integrations. Gold is the right planning layer, not a substitute for them.

## Decision

**Recommended:** adopt the teammate’s UI and API shape, but make gold the only source for coordinator-facing metrics, map features, shelter details, and directives. Keep the existing uncertainty language and Maps grounding. Do not merge mock data into production responses.

## Validation notes

- Cloud Run root, `/docs`, and `/openapi.json` responded successfully.
- `/api/health`, `/api/miami-dade/overview`, `/api/miami-dade/priority-tracts?limit=3`, and `/api/miami-dade/shelter-options?limit=3` returned HTTP 200.
- Copilot smoke tests returned HTTP 200 for overview, priority tracts, shelter options, and medically dependent/no-peer planning questions.
- No source or response evidence was found for an independent UI-created agent separate from the Agent Runtime resource above.
- Follow-up searches also found no additional Agent Registry agent, reasoning engine, Discovery Engine app/engine, Dialogflow agent surface, or other Vertex/agent asset in this project. A console URL, exact agent name, resource ID, or the teammate’s project ID is now required to locate the separate build.
