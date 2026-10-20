# Challenge 4 Agent Rubric Evaluation & Benchmark Results

**Evaluation Date:** October 20, 2026  
**Agent Under Test:** Florida Evacuation Readiness Agent (`florida_evacuation_readiness_agent`)  
**Target County:** Lee County, Florida (County FIPS: `12071`)  
**Test Suite:** [`tests/eval_agent_rubric.py`](../../tests/eval_agent_rubric.py)  
**Overall Rubric Score:** **100 / 100 (100.0% — PASS)**

---

## 1. Executive Summary

This evaluation suite assesses the Florida Evacuation Readiness Agent against the official judging criteria specified in the **Agents for Impact 2026 — Challenge 4** guidelines. The evaluation executes real queries through the Google ADK runtime, programmatically verifying:
1. **Tool Invocation & Data Provenance:** Genuine execution of BigQuery gold views and Google Maps Grounding.
2. **Rigor & Missing Data Handling:** Strict adherence to the rule that `UNRECORDED` wheelchair accessibility is distinct from "inaccessible".
3. **Physical Venue Grounding:** Live Google Maps verification of active facility status, verified street addresses, and physical ADA infrastructure.
4. **Actionability:** Structuring answers into the required 4-part August Readiness Brief with operational Access States (A, B, C, D).

```text
================================================================================
CHALLENGE 4 AGENT EVALUATION REPORT CARD
================================================================================
ID   | Benchmark Test                                | Dimension            | Score    | Status
-------------------------------------------------------------------------------------
Q1   | Who Cannot Leave (Ranked Vulnerability)       | Impact & Insight     | 15/15    | PASS
Q2   | Electricity & Medical Dependency (emPOWER)    | Rigor & Judgment     | 15/15    | PASS
Q3   | Candidate Shelter Destinations & Distance     | Technical Execution  | 15/15    | PASS
Q4   | Unrecorded vs Inaccessible Distinction + Maps | Rigor & Judgment     | 20/20    | PASS
Q5   | Live Venue Verification via Google Maps       | Technical Execution  | 15/15    | PASS
Q6   | Resident Location & Real-Time Shelter Routing | Bonus / Range        | 10/10    | PASS
Q7   | Actionable Pre-Season Operational Fixes       | Impact & Insight     | 10/10    | PASS
-------------------------------------------------------------------------------------
TOTAL EVALUATION SCORE: 100 / 100 (100.0%)
================================================================================
```

---

## 2. Detailed Test Results by Benchmark Question

### Q1. Who Cannot Leave? (Impact & Insight — 15/15 pts)
* **Prompt:** *"Which neighborhoods in Lee County would struggle most to self-evacuate? Give me the top tracts."*
* **Tools Invoked:** `rank_stranded_tracts`, `run_equity_audit`
* **Agent Finding:**
  * Top Ranked Tract: **`12071020801`** (North Fort Myers) with Stranded Score **0.9545**.
  * Demographics cited: 401 carless households (22.6%), 63.2% seniors (65+), 30.9% residents with disabilities, 98.5% mobile homes.
* **Rubric Verification:** ✅ Identified specific ranked tracts with quantified transit, age, and housing metrics rather than generic heatmaps.

---

### Q2. Electricity & Medical Dependency (Rigor & Judgment — 15/15 pts)
* **Prompt:** *"How many people in Lee County depend on electricity for medical equipment?"*
* **Tools Invoked:** `get_county_power_dependence`
* **Agent Finding:**
  * Total electricity-dependent population: **8,339 residents** (HHS emPOWER).
  * Equipment breakdown: 2,752 oxygen equipment users, 514 ventilator users, 345 dialysis/ESRD patients.
  * **Critical Rigor Check:** The agent explicitly noted: *"HHS emPOWER publishes at county scale; this total cannot be allocated to individual census blocks or neighborhood streets."*
* **Rubric Verification:** ✅ Exact figures cited; defended scale limitations without over-promising block-level granularity.

---

### Q3. Candidate Shelter Destinations & Distance (Technical Execution — 15/15 pts)
* **Prompt:** *"Where would I send people from the top stranded tract (12071020801), and how far is it?"*
* **Tools Invoked:** `get_candidate_shelters`, `get_tract_access_state`
* **Agent Finding:**
  * Shelter 1: **Littleton Elementary School** (0.84 km straight-line distance, capacity 0, unrecorded wheelchair accessibility).
  * Shelter 2: **All Souls Episcopal Church** (1.99 km straight-line distance, capacity 100, unrecorded wheelchair accessibility).
* **Rubric Verification:** ✅ Spatially matched pre-landfall eligible shelters within the 2.0 km micro-transit threshold.

---

### Q4. Accessibility & The "Unrecorded" Trap (Rigor & Grounding — 20/20 pts)
* **Prompt:** *"Which shelters near tract 12071020801 can take a wheelchair? Can someone in a wheelchair get into Littleton Elementary? Check live Google Maps verification."*
* **Tools Invoked:** `get_candidate_shelters`, `google_maps_grounding`
* **The Challenge Trap:** FEMA records have NULL/empty accessibility flags for 93% of shelters in Lee County. Confusing missing paperwork with physical inaccessibility is an automatic point deduction.
* **Agent Finding:**
  * **Registry Status:** Explicitly stated that wheelchair accessibility is **UNRECORDED** in official planning files, and avoided falsely claiming "no accessible shelters".
  * **Live Google Maps Grounding:** Grounded the facility at *700 Hutto Rd, North Fort Myers*, confirming a **wheelchair accessible entrance** and **wheelchair accessible parking lot**.
* **Rubric Verification:** ✅ Defended paperwork vs reality distinction; resolved administrative blind spot with live physical grounding.

---

### Q5. Live Venue Existence Grounding (Technical Execution — 15/15 pts)
* **Prompt:** *"Is Littleton Elementary still open, is it active, and what is its verified street address and operational status on Google Maps?"*
* **Tools Invoked:** `google_maps_grounding`
* **Agent Finding:**
  * Official Name: **Dr. Carrie D. Robinson Littleton Elementary School**
  * Street Address: **700 Hutto Rd, North Fort Myers, FL 33903**
  * Operating Status: **Active / Open** public elementary school facility.
  * Physical ADA features: Wheelchair accessible entrance & parking lot.
* **Rubric Verification:** ✅ Directly called Google Maps Grounding; proved the facility is not demolished, closed, or repurposed.

---

### Q6. Resident Location & Shelter Routing (Bonus / Range — 10/10 pts)
* **Prompt:** *"I am a resident located at latitude 26.6916 and longitude -81.9078 in Lee County. Which census tract am I in, what is my vulnerability, and which shelter is reachable?"*
* **Tools Invoked:** `find_tract_by_coordinates`, `get_candidate_shelters`, `google_maps_grounding`
* **Agent Finding:**
  * Spatial Geocoding: Nearest tract centroid is **`12071020801`** (within 7 meters of centroid).
  * Vulnerability: Stranded Score **0.9545**, State B.
  * Matched Destination: Littleton Elementary (0.84 km) and All Souls Church (1.99 km) with live ADA verification.
* **Rubric Verification:** ✅ End-to-end chaining of spatial BigQuery `ST_DISTANCE` with real-time shelter selection and Google Maps routing.

---

### Q7. Actionable Pre-Season Operational Fixes (Impact & Actionability — 10/10 pts)
* **Prompt:** *"What operational gaps should the Lee County emergency manager fix before hurricane season starts? Outline the priority actions."*
* **Tools Invoked:** `rank_stranded_tracts`, `get_candidate_shelters`
* **Agent Recommendations:**
  1. **State B Verify-First Inspections:** Dispatch emergency management staff in August to physically inspect Littleton Elementary and All Souls Church to establish ADA cot quotas and verify cot capacity.
  2. **Surge Zone Exclusion:** Confirm surge-inundated facilities (e.g. Dunbar High School) remain excluded from pre-landfall intake.
  3. **State D Transit Pickup Staging:** Pre-stage micro-transit shuttle routes for high-vulnerability tracts that have no walkable shelter within 2.0 km.
* **Rubric Verification:** ✅ Deliverable focused on concrete August interventions before storms form.

---

## 3. How to Run This Benchmark Suite

The evaluation runner can be executed directly from the Cloud Shell terminal:

```bash
cd ~/hurricane-evacuation
python3 tests/eval_agent_rubric.py
```

The script runs all 7 test cases against the live agent, prints live tool execution telemetry, and outputs the final scored report card.
