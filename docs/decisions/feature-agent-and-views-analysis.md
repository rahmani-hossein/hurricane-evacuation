# `feature/agent-and-views`: Agent Review and Gold Migration Decision

**Reviewed:** 2026-10-20  
**Branch:** `origin/feature/agent-and-views`  
**Head:** `43a22cf`  
**Scope:** Separate ADK agent build found in the repository

## Finding

This is the agent build the team was referring to. It is a real Python ADK agent with five BigQuery function tools and Google Maps Grounding. It is designed for **Lee County, Florida (FIPS 12071)** and uses `gemini-3.6-flash`.

It is materially different from the Miami-Dade Agent Runtime deployment:

- `agent/agent.py` creates `florida_evacuation_readiness_agent`.
- `agent/tools.py` implements tract ranking, shelter matching, access-state classification, power dependence, and equity auditing.
- `scripts/create_views.sql` creates five Lee County analytical views.
- `agent/SAMPLE_INTERACTIONS.md` records ADK Web UI interactions.
- `agent/GOOGLE_MAPS_VALIDATION.md` documents the Maps verification workflow.

## Supported use cases

| Use case | Tool or behavior | Assessment |
|---|---|---|
| Rank residents least able to self-evacuate | `rank_stranded_tracts(top_n)` | Strong planning use case. Combines no-vehicle, age, disability, and mobile-home signals. |
| Find reachable shelter candidates | `get_candidate_shelters(geo_id)` | Strong. Applies EVAC/BOTH eligibility, surge filtering, and tract-specific distance. |
| Classify operational access gap | `get_tract_access_state(geo_id)` | Excellent differentiator. States A/B/C/D produce actionable inspection or transit work. |
| Plan for electricity-dependent medical needs | `get_county_power_dependence()` | Useful county-level planning signal; correctly cannot identify individual blocks. |
| Audit equity of prioritization | `run_equity_audit()` | Strong governance feature using income, poverty, language, internet, and SVI indicators. |
| Verify a shelter with Maps | `google_maps_grounding` | Meets the challenge requirement when the agent grounds one named facility and reports remaining official checks. |

## Tests performed

The branch was checked out in an isolated worktree using the project credentials and current BigQuery data.

- `python -m unittest tests/test_agent_tools.py -v`: **5/5 passed**.
- Live top-tract query: returned tract `12071020801` with stranded score `0.955`, State B, 401 households without a vehicle, and two reachable shelters with accessibility unrecorded.
- Live medical-power query: completed through the `power_dependent_counties` tool.
- Live shelter verification prompt: the agent compared the FEMA record for Dr. Carrie D. Robinson Littleton Elementary School with Google Maps and correctly preserved the distinction between Maps evidence and official emergency verification.
- ADK emitted an experimental JSON-schema/AFC warning for the combined tool list, but the agent still completed the tested responses. This should be monitored in deployment and pinned in the runtime requirements.

## Current data lineage

The agent currently sets:

```text
DATASET_ID = evacuation_readiness
```

Its tools query branch-created views:

- `evacuation_readiness.v_lee_tract_scores`
- `evacuation_readiness.v_lee_shelters`
- `evacuation_readiness.v_lee_tract_shelter_pairs`
- `evacuation_readiness.v_lee_tract_access_state`
- `evacuation_readiness.v_lee_equity_audit`

These views are valuable analytical products, but they are still in the raw dataset namespace and embed Lee County-specific logic. The branch also contains documentation and sample outputs that reference the source `evacuation_readiness` tables directly.

## Decision

**Adopt the agent logic and migrate the data products into gold.** Do not simply replace its dataset string with `evacuation_readiness_gold`: our existing gold layer is Miami-Dade-specific and does not yet contain all five Lee County products.

### Recommended migration

1. Preserve the five tool contracts and State A/B/C/D semantics.
2. Create county-scoped gold tables or views with stable names, for example:
   - `gold_tract_risk`
   - `gold_shelter_readiness`
   - `gold_tract_shelter_options`
   - `gold_tract_access_state`
   - `gold_equity_audit`
   - `gold_county_power_dependence`
3. Add `county_fips` to every gold product and make county a validated tool parameter; remove Lee County hardcoding from prompt and SQL.
4. Preserve provenance fields: `source_dataset`, `source_snapshot_at`, `maps_checked_at`, `data_quality_status`, and `operational_status`.
5. Keep `UNRECORDED` distinct from `NO`; keep `listed capacity` distinct from confirmed availability; keep straight-line distance distinct from travel time.
6. Keep Maps Grounding outside the batch gold build. It should verify named facilities at runtime or through a separately timestamped validation table.
7. Add Miami-Dade adapters that map the existing `miami_dade_tract_mobility_proxy`, `miami_dade_tract_shelter_options`, and `shelter_readiness_snapshot` into the same tool contract.

## Why this agent is worth keeping

The branch has the most challenge-aligned operational reasoning found so far: it converts data into a prioritized decision and a fallback action. The State D transit-gap path and State B verify-first path directly support the team’s shelter-readiness and “getting people out” tracks. The equity audit and medical power tool add defensible nuance that the current Miami-Dade agent does not expose as first-class tools.

## Risks to fix before production

- The branch is Lee County-specific while the current product direction is Miami-Dade; choose one canonical state/county scope for the demo.
- The two-kilometer threshold is a planning assumption, not a walking route. Use Maps routing when the question asks for actual travel time or directions.
- `v_lee_shelters` excludes confirmed surge shelters but retains unrecorded surge status; the agent must say “surge status unrecorded,” not “safe.”
- The sample output is not a substitute for current Maps evidence. Runtime grounding should generate the citation for the specific shelter asked about.
- County-level emPOWER values support resource planning but cannot identify medically dependent individuals or assign a resident to a shelter.
- The agent should expose snapshot and verification timestamps so an emergency manager can distinguish planning facts from current operational facts.

## Final recommendation

Use this branch as the operational-agent foundation. Promote its views into a county-parameterized gold layer, then merge its State A/B/C/D, equity-audit, and power-dependence tools into the canonical agent. For the hackathon demo, Lee County is the fastest path because this branch already has passing live tests; Miami-Dade remains the better fit only if the team wants to keep the existing gold dataset and frontend scope unchanged.
