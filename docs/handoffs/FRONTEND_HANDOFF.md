# Frontend handoff: Lee County Hurricane Readiness

## Goal

Connect the coordinator web UI to the deployed Lee County ADK agent through a server-side proxy, while keeping map and table views backed by the canonical BigQuery gold contract.

## Canonical runtime

| Setting | Value |
|---|---|
| County | Lee County, Florida |
| County FIPS | `12071` |
| Project | `qwiklabs-gcp-04-9fa9c7b57012` |
| Region | `us-east1` |
| Agent Runtime resource | `projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104` |
| Model | `gemini-3.6-flash` |

The older Miami-Dade-oriented frontend deployment is not the canonical agent for this PR. Use the Lee County runtime above.

## Connection pattern

The browser must call our application backend; never put Google credentials, ADC, or an Agent Runtime access token in browser code.

```python
import vertexai
from vertexai import agent_engines

vertexai.init(project="qwiklabs-gcp-04-9fa9c7b57012", location="us-east1")
engine = agent_engines.get(
    "projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104"
)
session = engine.create_session(user_id="coordinator_web")
session_id = session.get("id") if isinstance(session, dict) else session.id
events = engine.stream_query(
    message=user_query, user_id="coordinator_web", session_id=session_id
)
```

REST endpoints:

```text
https://us-east1-aiplatform.googleapis.com/v1/projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104:query
https://us-east1-aiplatform.googleapis.com/v1/projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104:streamQuery
```

Expose a small app API such as `POST /api/copilot/chat`; the browser sends the user message plus selected `geo_id`, and the backend forwards the request to Agent Runtime.

## Recommended app API

These routes should query `evacuation_readiness_gold` only:

```text
GET  /api/lee/overview
GET  /api/lee/priority-tracts?limit=10
GET  /api/lee/shelter-options?geo_id=12071020801&limit=20
GET  /api/lee/access-state?geo_id=12071020801
POST /api/copilot/chat
```

Suggested response envelope:

```json
{"county":"Lee County","county_fips":"12071","snapshot_at":"2026-10-20T00:00:00Z","rows":[]}
```

Priority tract fields: `geo_id`, `total_pop`, `households_no_vehicle`, `pct_no_vehicle`, `pct_age_65_plus`, `pct_disability`, `pct_mobile_homes`, `stranded_score`, `reachable_dist_m`, `lat`, `lon`.

Shelter option fields: `tract_geo_id`, `shelter_id`, `shelter_name`, `address_1`, `city`, `shelter_lat`, `shelter_lon`, `evacuation_capacity`, `wheelchair_record`, `surge_record`, `km_straight_line`, `readiness_score`, `readiness_confidence`, `data_quality_status`.

Access-state fields: `geo_id`, `access_state`, `total_reachable_shelters`, `count_yes`, `count_no`, `count_unrecorded`, `action_recommendation`.

Do not reintroduce `frontend/src/mock/readinessData.ts` or query raw tables from the UI. The gold views are the normalized, county-scoped agent contract.

## Map behavior

- Center on Lee County and draw tract circles from `lee_tract_risk`.
- Size or intensity circles with `stranded_score`.
- When a tract is selected, draw candidate shelter connections from `lee_tract_shelter_options` and label straight-line distance.
- Show `YES`, `NO`, and `UNRECORDED` accessibility distinctly.
- Treat `readiness_confidence` and `data_quality_status` as planning confidence, not live operational status.
- Show a Google Maps link only for the actual place returned by Maps verification.

| State | Visual | Meaning | UI action |
|---|---|---|---|
| A | Green | Recorded accessible destination exists | Verify current operations |
| B | Amber | Accessibility is unrecorded | Verify first |
| C | Red | Recorded options are not accessible | Find an alternate |
| D | Violet/red | No accessible option is reachable | Plan transit or pickup |

## Starter prompts

```text
What are the top 3 stranded tracts in Lee County and their access states?
Which shelters are candidates for tract 12071020801, and what must be verified?
Which tracts need a dedicated transit pickup point before landfall?
How many Lee County residents depend on electricity for medical equipment?
Verify Dr. Carrie D. Robinson Littleton Elementary School at 700 Hutto Rd, North Fort Myers using Google Maps.
Run an equity audit on the top stranded tracts.
```

## Safety and acceptance contract

- Accessibility being unrecorded does not mean inaccessible.
- Listed capacity is not the same as available beds.
- State A does not mean a shelter is open now.
- Mobility and medical-power measures are planning proxies; they do not identify individuals.
- Google Maps evidence does not prove shelter opening, bed availability, medical capability, generator status, or ADA compliance.
- Keep the selected tract ID in map, table, and conversation context.
- Test a State B tract and a State D tract.
- Empty shelter options must produce a transit-gap message, not a false “no risk” result.

