# BigQuery Data Views: Lee County Evacuation Readiness

This document explains the analytical views created in BigQuery under the dataset `evacuation_readiness` for **Lee County, Florida (`county_fips = '12071'`)**.

These views bridge raw federal data tables with the operational needs of the AI Agent and the Emergency Manager, adhering to the data plan described in [`plan.md`](../plan.md).

---

## 1. `v_lee_tract_scores`

### Purpose
Calculates the vulnerability and **Stranded Score** for all 223 census tracts in Lee County. It identifies the neighborhoods whose residents are least capable of self-evacuating.

### Methodology
- **Raw Metric Percentile Ranks:**
  Computes `PERCENT_RANK()` within Lee County for four core risk indicators:
  1. `pct_no_vehicle` (Households without an automobile)
  2. `pct_age_65_plus` (Senior population share)
  3. `pct_disability` (Population living with disabilities)
  4. `pct_mobile_homes` (Housing units susceptible to storm surge and wind damage)
- **Stranded Score:**
  Equal-weighted average of the four percentile ranks:
  $$\text{Stranded Score} = \frac{\text{rk\_no\_veh} + \text{rk\_age\_65} + \text{rk\_disab} + \text{rk\_mob\_homes}}{4}$$
- **Reachable Distance Threshold (`reachable_dist_m`):**
  - **Top quartile of vehicle-less tracts ($\ge 75\text{th}$ percentile):** Set to **2,000 meters (2 km)**. A realistic walking/micro-transit threshold for car-less and vulnerable residents.
  - **Other tracts:** Set to **25,000 meters (25 km)** (driving distance).

### Key Columns
| Column | Type | Description |
|---|---|---|
| `geo_id` | STRING | 11-digit Census Tract FIPS (e.g., `12071020801`) |
| `total_pop` | FLOAT | Total tract population |
| `households_no_vehicle` | FLOAT | Absolute count of households without a vehicle (for sizing emergency response) |
| `pct_no_vehicle` | FLOAT | Proportion of households without a vehicle |
| `stranded_score` | FLOAT | Composite vulnerability score between 0.0 and 1.0 |
| `reachable_dist_m` | FLOAT | Straight-line buffer threshold in meters (2,000 or 25,000) |
| `lat`, `lon` | FLOAT | Tract centroid geographic coordinates |

---

## 2. `v_lee_shelters`

### Purpose
Filters and cleans registered shelters in Lee County that are eligible for pre-landfall evacuation, assigns surge zone indicators, and links each shelter to its geographically nearest census tract.

### Methodology
- **Usage Filter:** Requires `usage IN ('EVAC', 'BOTH')`. Excludes purely `POST` impact recovery shelters.
- **Surge Zone Exclusion:** Excludes shelters confirmed to sit within the storm surge hazard zone (`in_surge_slosh_area IS NOT TRUE`). Shelters with unrecorded surge status are retained but clearly labeled.
- **Three-Valued Logic:** Preserves NULL values explicitly:
  - `wheelchair_record`: `'YES'`, `'NO'`, or `'UNRECORDED'`
  - `surge_record`: `'IN_SURGE'`, `'OUTSIDE_SURGE'`, or `'UNRECORDED'`
- **Tract Centroid Spatial Join:** Uses BigQuery `ST_DISTANCE` with windowed ranking (`ROW_NUMBER()`) to assign each shelter to its closest tract centroid in `vulnerability_tracts`.

### Key Columns
| Column | Type | Description |
|---|---|---|
| `shelter_id` | INTEGER | FEMA unique shelter identifier |
| `shelter_name` | STRING | Facility name (e.g. `Skyline Elementary School`) |
| `address_1`, `city`, `zip` | STRING | Physical street address |
| `evacuation_capacity` | FLOAT | Registered pre-impact capacity |
| `wheelchair_record` | STRING | `YES`, `NO`, or `UNRECORDED` |
| `surge_record` | STRING | `OUTSIDE_SURGE` or `UNRECORDED` |
| `nearest_tract_geo_id` | STRING | GEOID of the nearest tract centroid |
| `dist_to_nearest_tract_km`| FLOAT | Distance in kilometers to that nearest centroid |

---

## 3. `v_lee_tract_shelter_pairs`

### Purpose
Pre-computes candidate destination pairings between census tracts and reachable shelters based on straight-line spatial distance.

### Methodology
- Joins `v_lee_tract_scores` and `v_lee_shelters` using:
  ```sql
  ST_DWITHIN(ST_GEOGPOINT(t.lon, t.lat), ST_GEOGPOINT(s.longitude, s.latitude), t.reachable_dist_m)
  ```
- Evaluates tract-specific reachability (2 km for car-less tracts, 25 km otherwise).

### Key Columns
| Column | Type | Description |
|---|---|---|
| `tract_geo_id` | STRING | Origin census tract |
| `stranded_score` | FLOAT | Origin tract vulnerability score |
| `shelter_id` | INTEGER | Destination shelter identifier |
| `shelter_name` | STRING | Destination shelter name |
| `address_1`, `city` | STRING | Destination shelter location for Maps verification |
| `wheelchair_record` | STRING | `YES`, `NO`, or `UNRECORDED` |
| `km_straight_line` | FLOAT | Euclidean distance in kilometers between tract and shelter |

---

## 4. `v_lee_tract_access_state`

### Purpose
Classifies each census tract into an actionable operational category (States A, B, C, D) to guide emergency resource allocation and pre-season audits.

### Access State Classification
| State | Definition | Operational Action |
|---|---|---|
| **State A** | At least one shelter within reach is recorded as wheelchair accessible (`YES`). | Destination verified on record; verify physical open status via Google Maps. |
| **State B** | Shelters exist within reach, but none recorded as YES (at least one is `UNRECORDED`). | **Verify-First Priority:** Send inspectors to verify physical ADA accessibility before season. |
| **State C** | Shelters exist within reach, but all recorded as `NO`. | Physical accessibility gap. |
| **State D** | No eligible pre-landfall shelter is within reach (especially critical for car-less tracts). | **Transit Gap:** Requires pre-staged paratransit bus routes and evacuation pickup points. |

### Key Columns
| Column | Type | Description |
|---|---|---|
| `geo_id` | STRING | Census tract identifier |
| `stranded_score` | FLOAT | Vulnerability rating |
| `total_reachable_shelters` | INTEGER | Number of eligible shelters within buffer distance |
| `count_yes` | INTEGER | Shelters with verified wheelchair access |
| `count_unrecorded` | INTEGER | Shelters with unrecorded accessibility |
| `access_state` | STRING | `'A'`, `'B'`, `'C'`, or `'D'` |
| `action_recommendation` | STRING | Executive recommendation for the Emergency Manager |

---

## 5. `v_lee_equity_audit`

### Purpose
Facilitates demographic and socioeconomic bias checks on the agent's ranking model by joining tract vulnerability rankings against socioeconomic baseline variables.

### Methodology
- Connects `v_lee_tract_access_state` back to Census ACS and CDC SVI socioeconomic metrics:
  - `median_income`
  - `poverty_rate`
  - `pct_limited_english`
  - `pct_no_internet`
  - `svi_socioeconomic` (CDC SVI theme rank)
- Enables verifying whether prioritized tracts correlate with low-income or language-isolated communities without using race as a model input.

---

## Tool Mapping Matrix

| BigQuery View | Consuming Agent Function Tool in `agent/tools.py` |
|---|---|
| `v_lee_tract_scores` | `rank_stranded_tracts(top_n)` |
| `v_lee_shelters` | `get_shelter_details(shelter_id)` |
| `v_lee_tract_shelter_pairs` | `get_candidate_shelters(geo_id)` |
| `v_lee_tract_access_state` | `get_tract_access_summary(geo_id)` |
| `v_lee_equity_audit` | `run_equity_audit()` |
