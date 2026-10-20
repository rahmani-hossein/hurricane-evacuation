# Miami-Dade Agent Handoff

## Purpose

This is the contract between BigQuery, ADK agents, and the Miami-Dade coordinator interface.

- State: Florida
- County: Miami-Dade
- County FIPS: `12086`
- Project: `qwiklabs-gcp-04-9fa9c7b57012`
- Raw dataset: `evacuation_readiness`
- Staging dataset: `evacuation_readiness_stg`
- Gold dataset: `evacuation_readiness_gold`

Agents should query gold first. Raw tables are source evidence, not the semantic contract.

## Gold schema

### `shelter_readiness_snapshot`

One row per source shelter record. Use identity fields (`shelter_id`, `shelter_name`, `address_1`, `city`, `zip5`, coordinates, `point`), operating mode (`usage_status`), capacities, tri-state evidence fields, duplicate fields, `data_quality_status`, `readiness_score`, `readiness_confidence`, and `snapshot_at`.

`usage_status` is `EVAC`, `POST`, `BOTH`, or `unrecorded`. `unrecorded` means the source did not provide a value; it does not mean `no`.

`candidate_needs_current_verification` means the record remains useful for planning, but its source functional flag requires current verification. Never present it as open or currently operational.

The readiness score is a planning prioritization score, not a guarantee of availability.

### `tract_shelter_options`

Nearest candidate EVAC/BOTH shelters within 50 straight-line miles of populated tracts. `straight_line_miles` is not drive time or transit time. Use Maps routing for selected candidates.

### `county_risk_snapshot`

Statewide county planning snapshot containing population, no-vehicle households, age/disability/mobile-home/internet indicators, hazard pressure, shelter count/capacity, accessibility unknown rate, power-dependent values, `county_priority_score`, and `snapshot_at`.

The score is a prioritization device. Always accompany it with underlying metrics and timestamp.

### `miami_dade_tract_mobility_proxy`

Miami-Dade-only mobility enrichment, one row per populated tract. It contains `pct_households_no_vehicle`, `pct_mobility_limitation`, `pct_disability`, `pct_no_internet`, `mobility_proxy_score`, `proxy_definition`, `interpretation_note`, and `snapshot_at`.

Current proxy: `50% no-vehicle household rate + 30% mobility limitation + 20% no-internet rate`.

This is not CDC PLACES `LACKTRPT`, not a self-reported reliable-transportation estimate, and not an individual-level estimate. Use the word `proxy` in every answer that relies on it.

### `miami_dade_tract_shelter_options`

Miami-Dade-only tract/shelter options enriched with the mobility proxy. Use it for: “Which tracts have high mobility pressure and no nearby high-confidence shelter option?”

### `miami_dade_county_risk_snapshot`

One-row Miami-Dade summary with statewide risk fields plus `avg_mobility_proxy_score`, `max_mobility_proxy_score`, `mobility_proxy_no_vehicle_households`, `operating_scope`, and `mobility_caveat`.

## Agent language contract

Agents may answer which Miami-Dade tracts to prioritize, which candidate shelters are closest, what is known versus unrecorded, where mobility pressure is highest, and what verification/fallback action should happen next.

Agents must:

- say `listed capacity`, not confirmed available capacity
- say `straight-line distance`, not travel time
- say `mobility proxy`, not reliable transportation
- say `accessibility unrecorded`, not inaccessible
- say `candidate needs current verification`, not open
- never identify an individual as vulnerable from tract aggregates
- never infer a medical diagnosis from power-dependence or disability fields

## Maps grounding handoff

The batch Maps job validates place identity and creates a verification queue. It must not decide accessibility, operational capacity, or medical suitability from Maps alone.

Required setup:

1. Billing-enabled Google Cloud project.
2. Service account, workload identity, or restricted API key.
3. Places/Geocoding APIs for place identity and Routes API for travel-time validation.
4. API restrictions, quotas, retries, and rate limits.
5. Secure credential storage; never commit keys.
6. Destination table for evidence, timestamps, request IDs, statuses, and errors.

Use the 109 Miami-Dade EVAC/BOTH candidate rows from `shelter_readiness_snapshot`. Send shelter ID, source name, normalized address, coordinates, source timestamp, duplicate group, and quality status.

The table `gold.miami_dade_shelter_maps_validation` has been created with the persisted fields `shelter_id`, `query_name`, `query_address`, `query_latitude`, `query_longitude`, `maps_place_id`, `place_match_status`, `maps_checked_at`, and `error_code`. Full Maps response text and returned place metadata are intentionally not persisted.

The first completed batch validated all 109 candidates: 104 `confirmed_match`, 5 `address_mismatch`, and 0 API errors. The five mismatches are retained as review actions, not silently corrected.

Use statuses `confirmed_match`, `probable_match_review`, `address_mismatch`, `not_found`, `ambiguous_place`, and `api_error`.

Exact/near-exact address plus close coordinates can be `confirmed_match`. Name-only matches, campus-level matches, ZIP conflicts, and no-result cases need review. Do not silently overwrite source data.

After identity validation, call Routes only for selected tract-to-shelter pairs. Capture duration, distance, travel mode, timestamp, and closure/traffic evidence. Do not claim a route is safe during an active storm without current evidence.

## Remaining build steps

1. Load Miami-Dade GTFS and calculate stop/service coverage.
2. Implement Maps place validation and write the validation table.
3. Expose only gold and validated Maps evidence to ADK tools.
4. Add peer tasks and fallback queues.
5. Build the coordinator flow around tract priority → shelter options → verification task.
