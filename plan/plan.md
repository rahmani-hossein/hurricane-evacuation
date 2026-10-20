# Hurricane Evacuation Readiness Agent - Project Plan

**Challenge 4: Adaptive Evacuation Readiness & Vulnerable Community Planning (Agents for Impact 2026)**

---

## 1. Executive Summary & Core Objective

The mission is to build an **ADK-powered AI agent** for a county emergency manager in **August** (pre-season preparedness window) to identify and protect vulnerable populations who cannot self-evacuate when a storm approaches (e.g., zero-vehicle households, mobility/wheelchair-dependent residents, and power/electricity-dependent medical patients).

> **Critical Rule & Guiding Principle:**
> *"Our data is the memory. Maps is the eyes. Neither does the other's job."*
> - **Unrecorded ≠ No**: In Florida, **88%** of shelter accessibility fields are blank. Blank means unassessed, not inaccessible.
> - **Planning ≠ Dispatch**: Google Maps Grounding and this system are strictly for **pre-season preparedness**, never real-time 911 emergency response.

---

## 2. Requirements Checklist & Architecture

| Requirement | Specification | Implementation Strategy |
|---|---|---|
| **Framework** | ADK (Agent Development Kit) in Python | Build agent modularly in `agent/` |
| **Model** | Gemini 3.x (e.g., `gemini-3.6-flash`) | Supports custom function tools alongside `google_maps_grounding` in a single agent without Gemini 2.5's `400 INVALID_ARGUMENT` tool limitation |
| **Data Warehouse** | Google Cloud BigQuery | Dataset: `evacuation_readiness` (Tables: `shelters`, `vulnerability_tracts`, `hazard_tracts`, `care_facilities`, `power_dependent_counties`) |
| **Managed MCP Server** | Google-managed MCP | BigQuery MCP server or MCP Toolbox for Databases |
| **Custom Function Tool** | Python tool(s) authored by us | Spatial readiness calculator (`ST_DISTANCE`), reachability analyzer, and gap identifier |
| **Required Differentiator** | Grounding with Google Maps | `google_maps_grounding` from `google.adk.tools` to verify live facility existence, renames, and active operational status |
| **Core Artifact** | Pre-Season Readiness Brief | 3-part structured assessment: (1) Who cannot leave, (2) Where they can go, (3) What gaps to fix before September |

---

## 3. Data Landscape (Florida - State on File)

The BigQuery dataset `evacuation_readiness` in project `qwiklabs-gcp-04-9fa9c7b57012` contains:

1. **`shelters` (2,793 rows)**
   - Key attributes: `shelter_id`, `shelter_name`, `address_1`, `city`, `latitude`, `longitude`, `evacuation_capacity`, `wheelchair_accessible`, `generator_onsite`, `is_medical`, `in_surge_slosh_area`, `usage`.
   - *Data traps to handle*: `wheelchair_accessible` is 88% blank; single space strings rather than NULL; check `usage` (`EVAC` vs `POST`).
2. **`vulnerability_tracts` (5,160 rows)**
   - Key attributes: `census_tract`, `county_name`, `households_no_vehicle`, `pct_no_vehicle`, `pct_age_65_plus`, `pct_disability`, `mobile_homes`, `centroid_lat`, `centroid_lon`.
   - *Note*: CDC PLACES does not publish `pct_lacktrpt` for FL, so vehicle ownership (`pct_no_vehicle`, `households_no_vehicle`) is our primary metric.
3. **`hazard_tracts` (5,114 rows)**
   - Hurricane (`HRCN_*`) and coastal flood (`CFLD_*`) hazard risk levels and expected annual losses from FEMA NRI.
4. **`care_facilities` (694 rows)**
   - Certified nursing home beds, coordinates, CMS provider info.
5. **`power_dependent_counties` (67 rows)**
   - HHS emPOWER counts of electricity-dependent medical patients (county-level aggregate).

---

## 4. Track Selection & Scenario Definition

### Recommended Scenario:
> **"Our agent helps a County Emergency Manager in Florida decide pre-season transit pickup points, facility backup power needs, and accessible shelter verifications before hurricane landfall."**

This combines:
1. **🏚️ Shelter Readiness:** Screening designated shelters in surge zones, surfacing unrecorded vs. confirmed accessible shelters, and verifying live status via Google Maps.
2. **🚌 Transit & Evacuation Access:** Identifying tracts with high zero-vehicle households and computing distance to the nearest viable shelters.
3. **🏥 Medical & Power Dependency:** Highlighting nursing home concentrations and power-dependent patient clusters against shelter generator capabilities.

---

## 5. Step-by-Step Execution Roadmap

### Phase 1: Environment & Tooling Setup
- [ ] Confirm Python virtual environment with `google-adk`, `google-cloud-bigquery`, `google-genai`.
- [ ] Verify `aiplatform.googleapis.com` and `bigquery.googleapis.com` are enabled.
- [ ] Set environment variables (`GOOGLE_GENAI_USE_VERTEXAI=True`, `GOOGLE_CLOUD_LOCATION=global`, `GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-9fa9c7b57012`).

### Phase 2: Core Analysis & Custom Tools (`agent/tools/`)
- [ ] **Tool 1: `query_vulnerable_tracts(county_name, top_n)`**
  - Queries `vulnerability_tracts` ranked by zero-vehicle households, elderly living alone, and mobile homes.
- [ ] **Tool 2: `find_nearby_shelters(latitude, longitude, radius_km, require_accessible, require_generator)`**
  - Uses BigQuery geospatial SQL (`ST_DISTANCE(ST_GEOGPOINT(longitude, latitude), ST_GEOGPOINT(s.longitude, s.latitude))`).
  - Separates `wheelchair_accessible = TRUE`, `wheelchair_accessible = FALSE`, and `wheelchair_accessible IS NULL` (Unrecorded).
  - Flags shelters situated in `in_surge_slosh_area`.
- [ ] **Tool 3: `audit_county_readiness(county_name)`**
  - Generates the aggregate readiness scorecard: total vulnerable population, shelter capacity deficit/surplus, power-dependent residents vs. generator shelters.

### Phase 3: Differentiator - Google Maps Grounding (`agent/tools/grounding.py`)
- [ ] Integrate `google_maps_grounding` via ADK.
- [ ] Use Maps grounding **targeted on candidate shelter names and addresses**:
  - Confirms if the building still exists, is open/active, or was renamed/relocated.
  - Formats attribution compliant with Google guidelines (`translate="no"`, unmodified "Google Maps", with links).

### Phase 4: Agent Core Prompt & ADK Implementation (`agent/agent.py`)
- [ ] System prompt design:
  - Role: Senior Emergency Preparedness Advisor for Florida counties.
  - Refusal criteria: Denies active/real-time 911 rescue dispatch requests with safety guidelines.
  - Strict honesty: Never reports "no accessible shelters" when the record is merely blank/unrecorded.
  - Reasoning flow: (1) Query vulnerability -> (2) Identify nearby candidate shelters -> (3) Ground candidates against Google Maps -> (4) Synthesize Readiness Brief.

### Phase 5: User Interface & Demo Execution
- [ ] Setup interactive UI (`adk web` or Streamlit app) displaying the interactive brief and Google Maps attribution.
- [ ] Prepare test queries for specific counties (e.g., Lee County, Pinellas County, Hillsborough County, or Miami-Dade).

### Phase 6: Pitch Deliverables
- [ ] Slide deck outline: Problem, Unrecorded Data Insight, Live Maps Grounding Value, County Brief Output, Responsible AI / Equity Audit.
- [ ] Demo video rehearsal script.

---

## 6. Key Decisions & Open Questions for Team

1. **Which county will be our hero demo?**
   - *Recommendation:* **Lee County** (Hurricane Ian ground zero, high senior population) or **Pinellas County** (highest density, significant storm surge exposure).
2. **UI Preference:**
   - Option A: `adk web` (Fastest, zero custom frontend code).
   - Option B: Lightweight Streamlit app with interactive folium map & attribution.
