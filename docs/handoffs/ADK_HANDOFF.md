# Running the Lee County ADK agent

This is the canonical agent contract for the hackathon. The operating scope is **Lee County, Florida (FIPS 12071)**. The Miami-Dade agent and tables remain in the repository as historical work, but should not be used by the canonical Lee County ADK consumer.

## Deployed Agent Runtime

- Display name: `Lee County Hurricane Readiness`
- Resource: `projects/851021919219/locations/us-east1/reasoningEngines/5276937832231862272`
- Region: `us-east1`
- Model: `gemini-2.5-flash`; Maps and Search are isolated in ADK sub-agents for Gemini 2.5 compatibility.
- Framework: Google ADK
- Staging bucket: `gs://qwiklabs-gcp-04-9fa9c7b57012-agent-staging`

The resource supports standard ADK session/query methods and can be opened from Vertex AI Agent Runtime or consumed through the Agent Runtime API. The reproducible deployment entry point is `scripts/deploy_agent_runtime.sh`.

## Gold data contract

The agent queries only `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold`:

| Gold view | Purpose |
|---|---|
| `lee_tract_risk` | Percentile-based stranded score, tract demographics, and 2 km/25 km reachability threshold. |
| `lee_shelter_readiness` | EVAC/BOTH shelter candidates with normalized uncertainty fields and readiness score/confidence. Confirmed surge shelters are excluded; unrecorded surge is retained as unverified. |
| `lee_tract_shelter_options` | Tract-to-shelter options within the tract-specific straight-line threshold. |
| `lee_tract_access_state` | State A/B/C/D classification and recommended action. |
| `lee_equity_audit` | Priority tracts joined to income, poverty, language, internet, and SVI fields. |
| `lee_county_power_dependence` | County-level emPOWER-derived power-dependence planning signal. |

The gold views are built by `sql/build_stg_gold.sql` from raw `evacuation_readiness` tables through `evacuation_readiness_stg`. Raw tables are source evidence only; agents should not query them directly.

## Tool contract

`agent/tools.py` exposes:

- `rank_stranded_tracts(top_n)`
- `get_candidate_shelters(geo_id)`
- `get_tract_access_state(geo_id)`
- `get_county_power_dependence()`
- `run_equity_audit()`
- Google Maps Grounding for a named shelter or route question

The mobility threshold is a planning rule: top-quartile no-vehicle tracts use a 2 km straight-line threshold; other tracts use 25 km. Straight-line distance is not driving, transit, or walking time.

## Language and safety rules

- Say `UNRECORDED` or `accessibility unrecorded`, never inaccessible when paperwork is missing.
- Say `listed capacity`, never confirmed available capacity.
- A State A record means wheelchair accessibility is recorded in the planning data; it does not mean the facility is open or has beds.
- State B means a verify-first inspection need.
- State C means all reachable records are marked not accessible.
- State D means a transit gap and need for a pickup/staging plan.
- Maps can confirm place identity, public place attributes, and routes. Maps does not prove emergency opening, bed availability, medical acceptance, generator readiness, or formal ADA compliance.
- County-level medical-power data supports resource planning and cannot identify individuals or buildings.

## Validation

From the repository root:

```bash
python -m unittest tests/test_agent_tools.py -v
python agent/test_agent.py "What are the top 3 stranded tracts in Lee County and their access states?"
```

The current validation result is 5/5 tool tests passed. The deployed smoke test returned tract `12071020801` as State B, tract `12071050104` as State D, and tract `12071010112` as State A. A second deployed smoke test successfully used Google Maps Grounding for Dr. Carrie D. Robinson Littleton Elementary School.
