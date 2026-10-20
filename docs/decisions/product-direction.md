# Hurricane Readiness Lab — product direction

## Context

Challenge 4 asks for a planning-time capability for one state, before a storm exists. The supplied Florida BigQuery dataset is already loaded in project `qwiklabs-gcp-04-9fa9c7b57012`, dataset `evacuation_readiness`.

Observed baseline:

- 2,793 registered shelters.
- 848,784 listed evacuation spaces.
- 2,463 shelters have wheelchair accessibility unrecorded; 247 say yes and 83 say no.
- 155 shelters are marked medical-needs.
- 207 shelters have a generator recorded; 58 are marked inside a surge/slosh area.
- Supporting tables contain 694 care facilities, 67 power-dependent counties, and 5,114 hazard tracts.

The central product truth is: a recorded blank is not a negative. The interface must distinguish observed facts, public-record gaps, and live verification.

## Data exploration verdict

The current tables are **good source extracts, not yet a safe agent contract**. BigQuery MCP can query them today, but a general-purpose agent will make avoidable mistakes unless we add curated views or operational marts.

Findings from the loaded Florida dataset:

- `shelters`: 2,793 rows and 2,793 distinct `shelter_id` values, but 332 rows have no `usage`; 2,463 have wheelchair access unrecorded; 2,318 have generator status unrecorded.
- Shelter rows have complete names, addresses, cities, ZIPs, and coordinates in this state, but normalized `(name, city, ZIP)` keys produce 73 duplicate groups / 151 rows. Some are historical or variant records with different capacities and EVAC/POST usage, so they must not be blindly deduplicated.
- `vulnerability_tracts`: 5,160 distinct 11-digit tract IDs and valid Florida coordinates. The percentage fields are stored on a 0–100 scale, not 0–1. `pct_lacktrpt` is entirely null for Florida by design, so it must not become an agent claim that Florida has no transportation data.
- `hazard_tracts`: 46 vulnerability tracts have no hazard match; the examples are zero-population special tracts, so the mismatch should be retained with a join-status flag, not silently dropped.
- `care_facilities`: 694 unique CMS-certified nursing facilities with complete addresses, coordinates, and positive bed counts. This is not a hospital layer and cannot answer hospital-remoteness questions by itself.
- `power_dependent_counties`: 67 distinct counties with a county-level power-dependence signal. It cannot identify people or assign medical dependence to a tract.

### Recommended data contract

Use three layers:

1. **Raw/source** — immutable snapshots, source URL, source retrieval time, source row ID, original values. Never ask the agent to reason directly over this layer.
2. **Staging** — normalized types and keys, validation flags, geographies, deduplication groups, and lineage. Keep `unknown`/`null` distinct from `false`.
3. **Operational marts** — narrow, purpose-built views for the agent and UI: `county_risk`, `tract_priority`, `shelter_readiness`, `tract_shelter_options`, `medical_escalations`, and `peer_tasks`.

Do not “clean” away inconvenient records. Preserve the source row and add fields such as `data_quality_status`, `duplicate_group_id`, `hazard_join_status`, `address_normalization_status`, `freshness_at`, and `confidence_reason`.

### Normalization that is worth doing

- Shelter addresses: trim, uppercase, normalize street suffixes and punctuation, zero-pad ZIPs, parse ZIP+4, and create a canonical address key. Do not geocode and store new coordinates from Maps as a permanent source; use the supplied coordinates or a compliant geocoder with explicit lineage.
- Shelter identity: create a `canonical_shelter_id` from address/coordinates plus reviewable fuzzy matching. Keep separate records when usage, capacity, or source vintage differs. A same-name school can have separate EVAC and POST roles.
- Tri-state booleans: expose `yes`, `no`, and `unrecorded` as a first-class enum. Do not use a SQL boolean alone in agent-facing output.
- Tracts: cast `geo_id` to a validated 11-character string; store percentages with a declared unit of `percent_0_100`; attach `hazard_join_status` and retain zero-population special tracts.
- Facilities: use CCN as the stable nursing-facility key. Add a separate hospital/ED source before ranking hospital remoteness; do not substitute nursing homes for hospitals.
- Geography: store `GEOGRAPHY` points and a county dimension. Use a spatial bridge table for nearest shelter candidates instead of asking the agent to cross-join raw points on every turn.

### Batch versus runtime

Shelter readiness should be a **batch validation plus selective runtime verification**:

- Nightly or pre-brief batch: validate coordinates, identity duplicates, stale records, missing fields, capacity anomalies, EVAC/POST semantics, nearest tract/hazard, and route-candidate coverage. Materialize a `shelter_readiness_snapshot` with a timestamp.
- Runtime: when the coordinator selects a shelter or asks for a current answer, verify only the small candidate set with Google Maps grounding. Re-rank on the returned place identity/status and expose the timestamp and source. Do not call Maps for every shelter on every prompt.
- Before publishing a readiness brief: run a deliberate “refresh selected evidence” step, not an implicit hidden refresh.

The agent should never claim “accessible” from Maps alone. Maps can help confirm a named building exists/is current and can provide routes; the public record or a human assessment must support accessibility and medical capability.

## Alternatives

### A. Shelter Readiness Console

Rank shelters by operational risk: unrecorded accessibility, missing generator data, medical designation, surge exposure, and Maps verification state.

Tradeoff: strongest fit to the supplied shelter records and easiest demo, but less direct focus on the people who cannot self-evacuate.

### B. No-Car Evacuation Planner

Start with census tracts that have high no-vehicle household counts and disability/age signals. Match them to candidate shelters and add route-aware pickup recommendations.

Tradeoff: most human-centered and visually compelling, but needs careful language because vehicle ownership is not the same as access to a ride.

### C. Adaptive Readiness Brief — recommended

Combine B as the main workflow with A as the verification loop. The agent answers: “Which tract should we act on first, where would those residents go, what do we know about that shelter, and what must a person verify before September?”

Tradeoff: slightly more implementation work, but it demonstrates the complete challenge spine: BigQuery/MCP for structured evidence, custom scoring for judgment, and Google Maps grounding for current place identity/status.

## Recommendation

Build **Adaptive Evacuation Operations** for **Florida, with Miami-Dade County as the opening scene**. Florida is the best exercise state because it combines the right hazard, the largest accessibility-recording gap in the supplied comparison, the second-most medical-needs shelters, and enough urban density for a credible building-level volunteer concept. Miami-Dade is the best demo county because it has about 2.7M residents, roughly 90,752 no-vehicle households, 138 registered shelters, 130 shelters with wheelchair accessibility unrecorded, and 7 medical-needs shelters. It gives us a strong transport story, a real shelter-data gap, and a clear medical escalation path without pretending the data identifies individuals.

Do not present this as three unrelated tracks. Present one shared **resident-to-destination action graph** with three operating modes:

1. **Getting people out** is the primary mode: find high-pressure tracts, identify candidate shelters, estimate reachable options, and propose pickup/volunteer actions.
2. **Shelter readiness** is the destination gate: verify whether the shelter is current, how it is designated, what is recorded, and what remains unknown.
3. **Medically unavailable** is the escalation mode: identify facilities/counties where a generator, transfer agreement, or medical-needs designation is missing, then create a fallback plan rather than a false individual-level identification.

The primary user is a county emergency manager preparing an August plan. The hero flow should be:

1. Select a county or ask a natural-language question.
2. Rank census tracts by non-self-evacuation pressure using explainable signals.
3. Show nearby shelters, separating EVAC/POST/BOTH usage and recorded vs unrecorded accessibility.
4. Ground one named shelter at a time with Google Maps to verify that the place still exists and what it is now.
5. Turn the result into a readiness brief with owners, urgency, evidence, and uncertainty.

### The operating model

The system should produce an **action queue**, not just a ranking:

| Situation | Detect from public data | Action | Fallback if it fails |
|---|---|---|---|
| High no-vehicle / disability tract | Vulnerability tract + hazard + distance | Assign a pickup corridor and building outreach priority | Escalate to county transit/paratransit or a nearby receiving shelter |
| Candidate shelter has blank accessibility | `wheelchair_accessible IS NULL` | Send a verification task to the shelter operator or trained field volunteer | Keep it in “unknown”; route only with a human confirmation |
| Maps says place renamed/closed/moved | Named-building grounding | Flag registry mismatch and search for the current place | Select next-best shelter and preserve the mismatch as evidence |
| Medical dependency is high at county scale | emPOWER + care facilities + power resilience | Pre-position generator/fuel, confirm transfer agreement, reserve medical-needs capacity | Identify a receiving hospital/facility and trigger a human escalation |
| Volunteer or transport assignment fails | Task status timeout / no acknowledgement | Reassign to backup captain or county partner | Fall back to fixed pickup location and phone-based check-in |
| Road route becomes unreliable | Maps routing or operator update | Recompute route and switch destination | Use pre-agreed inland receiving site; never claim live safety from stale data |

### The creative layer: building-level mutual aid, safely scoped

Add a **Neighbor Lift network** for apartment buildings and senior-heavy complexes. It is not a public list of vulnerable people and it must not store names, medical diagnoses, or precise household-level risk.

The planning-time workflow is:

1. The agent identifies a tract/building cluster with elevated need, not a person.
2. A building captain or partner organization creates a voluntary “check-in pod” for that building.
3. Residents opt in through a lightweight channel and select needs such as `ride`, `mobility assistance`, `power backup`, `pet`, or `language support`.
4. The system counts open needs at building/tract level, matches them to volunteer capacity, and assigns a two-person buddy task with a backup.
5. A check-in must resolve to `confirmed`, `needs county help`, `no response`, or `declined`; it never silently becomes “safe.”
6. If the task is not acknowledged by the deadline, it escalates to the county partner or predetermined phone tree.

The demo can show a synthetic apartment-building workflow while all public-data rankings stay at tract level. That is both safer and more credible than implying public data can identify a specific resident.

### What “medically unavailable” should mean

Avoid the phrase as if the system can diagnose a person. Define it operationally as **medical evacuation capacity unavailable or unverified**:

- No suitable medical-needs shelter within the selected reachability threshold.
- A care facility has no recorded backup-power/transfer evidence in the team’s operational layer.
- County-level emPOWER shows a large power-dependent population but receiving capacity is not demonstrated.
- A facility or shelter’s public record is stale or contradicted by live place verification.

Every medical output should end with a human action: confirm generator/fuel, confirm transport, confirm receiving facility, or escalate to the health department. The agent should refuse to infer an individual’s medical status from a tract.

### Reachability decision

Use a three-tier definition rather than one arbitrary distance:

- **Near:** ≤2 km straight-line distance, useful for walking/short assisted movement but not proof of accessibility.
- **Reachable by vehicle:** route duration from Google Maps when routing is available; otherwise mark as “distance only.”
- **Operationally reachable:** route plus a confirmed pickup/volunteer resource and a destination that passes the shelter verification gate.

This lets the UI say “near on a map” without claiming “reachable for this person.”

## County risk model

Rank **need relative to usable capacity**, not counties with the most people or the most shelters. Use a transparent 0–100 score with separately displayed components:

`county_priority = 30% vulnerable_need + 25% destination_gap + 20% hazard_exposure + 15% medical_dependency + 10% transport_friction`

Where:

- `vulnerable_need`: no-vehicle households, disability, 65+, mobile homes, and limited internet, aggregated with population denominators.
- `destination_gap`: vulnerable population divided by **usable EVAC capacity**, with accessibility unknown shown separately from confirmed accessible capacity.
- `hazard_exposure`: tract-level hurricane/coastal-flood exposure weighted by population.
- `medical_dependency`: county emPOWER signal plus care-facility beds, explicitly county-level.
- `transport_friction`: route time or GTFS reachability once added; before that, label it “distance-only.”

Maintain a separate **data-confidence score**. A high-risk county with poor data should be prioritized for verification, not falsely treated as low risk or high risk with false precision.

## Interface architecture

Build two surfaces over the same backend, with different permissions and offline behavior.

### Coordinator web

- Full Florida map with county risk choropleth, tract priority overlay, shelter symbols, hospitals/EDs, nursing facilities, and route candidates.
- Filters for track/mode: getting out, shelter readiness, medical escalation, peer capacity, data confidence.
- Clicking a county opens a ranked county brief; clicking a tract opens evidence and nearby options.
- Clicking a shelter opens a readiness drawer: source vintage, EVAC/POST/BOTH, capacity, generator/accessibility states, hazard, duplicate group, Maps verification, and next action.
- “Start conversation from here” seeds the agent with the selected county/tract/shelter and a bounded tool context.
- Use a heatmap only for tract-level modeled risk. Do not show “people at risk” at building level unless that building is a voluntary peer-program record.
- A right-side action queue shows unassigned checks, overdue peer tasks, fallback destination, and government escalation owner.

### Resident / peer mobile

- Onboarding asks for voluntary needs categories, preferred language, mobility/ride needs, pets, and consent; avoid diagnoses and unnecessary identity data.
- Offline package contains the selected evacuation plan, two fallback destinations, saved route geometry/instructions, peer contact aliases, and a phone-tree card.
- Conversational layer works online with the agent; offline it becomes a deterministic FAQ and plan navigator using cached evidence. It must say “offline plan last refreshed at …” and never pretend to know current shelter status.
- Peer mode exposes only assigned tasks and coarse building/zone context. A “no response” path escalates without exposing a neighbor’s private details.
- Store-and-forward check-ins when connectivity returns; use SMS/voice fallback for critical status.

### Fallback ladder

1. Peer volunteer accepts task.
2. Backup peer/captain accepts task.
3. Building manager / partner organization queue.
4. County emergency-management or transit coordinator queue.
5. Fire/EMS/health-department escalation according to local policy.
6. Preselected alternate shelter or receiving facility.

The app should never invent the government responder. Model the responder as a configured role/queue supplied by the county, with a named operating policy in the demo.

## Tools to build

1. `rank_priority_tracts(county, limit)` — custom tool. Score only permitted signals: no-vehicle households, disability prevalence, age 65+, mobile homes, and hazard exposure. Return component scores, not just a black-box rank.
2. `find_shelter_options(geo_id, usage, limit)` — custom BigQuery function. Use `ST_DISTANCE`; return straight-line distance explicitly labeled as such.
3. `build_readiness_brief(tract, shelters, verification)` — custom tool. Convert evidence into a planner-facing recommendation and action list.
4. BigQuery managed MCP — use for schema/table exploration and queries; keep the custom tools for judgment and policy logic.
5. Google Maps grounding with `places` and, if stable in the smoke test, `routing`. Ask about one named shelter and address per call. Keep only `place_id`/`review_id`; re-ground live rather than caching Maps content.
6. `audit_claims()` — lightweight guardrail that labels every response sentence as `recorded`, `derived`, `live Maps`, or `unknown`.

## Additional public data worth adding

Prioritize one add-on, not a data buffet:

| Priority | Data | Why it helps | Caution |
|---|---|---|---|
| 1 | Florida Statewide Emergency Shelter Plan / regional shelter-demand tables | Gives a demand-side benchmark instead of treating listed capacity as sufficient. | Plan scenarios are not live operations; label the vintage and scenario. |
| 2 | Transit GTFS feeds for the chosen county/region | Converts “near a shelter” into “reachable by scheduled transit” and suggests pickup corridors. | GTFS service calendars can be stale; show feed date and do not imply paratransit eligibility. |
| 3 | NOAA/NHC storm-surge risk layers or live GIS feeds | Adds a compelling “what changes if the risk boundary moves?” story. | Live products are operational and may be absent outside an active storm; keep planning mode separate. |
| 4 | State licensing/inspection data for assisted living and home-health providers | Closes a real gap in the supplied national data for medically dependent populations. | State-specific, unevenly published, and may contain sensitive operational details. |

For the missing hospital layer, use CMS [Hospital General Information](https://data.cms.gov/provider-data/dataset/xubh-q36u), which publishes Medicare-registered hospital identity, address, type, and emergency-services fields. For the Miami-Dade transport layer, use the county's [GTFS open-data feeds](https://www.miamidade.gov/global/transportation/open-data-feeds.page) and treat realtime feed availability/license separately from static schedules. Sources for the rest: [Florida Statewide Emergency Shelter Plan](https://www.floridadisaster.org/globalassets/1/statewide-emergency-shelter-plan-2025.pdf), [Florida Special Needs Registry](https://www.floridadisaster.org/snr/), [NOAA/NHC GIS data](https://www.nhc.noaa.gov/gis/index.php), and [NOAA national storm-surge maps](https://www.nhc.noaa.gov/nationalsurge/).

## Frontend direction

Use a dark, high-contrast “operations room” canvas with a bright hazard accent, but keep the experience calm and legible:

- Left: conversational thread with prompt chips such as “find the highest-pressure tract” and “verify this shelter.”
- Center: living map that changes with the conversation. Highlight the selected tract, candidate shelters, straight-line distance, and surge context.
- Right: “Readiness brief” panel with four cards: Who, Where, What we know, Next action.
- Below the answer: an evidence rail showing BigQuery facts, derived calculations, Google Maps sources, and unknowns as separate chips.
- Add a timeline slider for planning scenarios: current public record → verified place identity → recommended action.
- Use a visible “unrecorded” state in amber, never gray it away. Use red only for actual exposure or blockers.
- Make the hero interaction dynamic: clicking a tract updates the chat context, map, shelter cards, and action queue together.

The standout moment is not a flashy map. It is a visible shift from “nearest shelter” to “nearest shelter that is plausible for this population, with the missing evidence called out.”

## Validation notes

- Repository cloned to `hurricane-evacuation/` and inspected.
- BigQuery tables verified with `bq ls` and summary queries.
- Workbook created at `outputs/hurricane-readiness-team-workbook.xlsx` and visually rendered/inspected.
- The supplied challenge image was inspected as a visual reference; it reinforces the purple/pink/amber visual language and the “find them while there is still time” framing.
- Next technical validation: choose the opening county, run the notebook’s quality checks, smoke-test Gemini 3.x + BigQuery MCP + Maps grounding, then prototype the tract-to-shelter interaction.
