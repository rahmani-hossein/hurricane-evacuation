# Sample Inputs, Outputs & Test Suite for Team Validation

This document provides sample inputs (prompts), corresponding verified model outputs, and test instructions for teammates validating the **Florida Evacuation Readiness Agent**.

---

## 1. Verified Sample Inputs (Prompts)

### Primary Prompt: Pre-Season Evacuation Readiness Brief
```text
As the Lee County Emergency Manager, I need our Pre-Season Evacuation Readiness Brief before September 1. Please analyze Lee County census tracts and shelters, and produce the 4-part brief:

1. Who cannot leave (top stranded tracts, vehicle-less counts, senior & disability shares).
2. Where they would go and whether it holds up (eligible pre-landfall shelters within reach, capacities, wheelchair records, and live Google Maps verification).
3. What to fix before the season (State B verify-first inspection priorities, State D transit pickup staging, surge hazards).
4. What the data cannot tell us (unrecorded accessibility paperwork, county-level data limitations).
```

### Alternative Test Prompts

#### Prompt A: Worst-Off Census Tract & 2 km Walkability
```text
Which census tract in Lee County has the highest stranded score, what are its demographics, and what candidate shelters are within its 2 km reach?
```

#### Prompt B: Medical Power Dependence (HHS emPOWER)
```text
How many residents in Lee County depend on electricity for life-sustaining medical devices and oxygen equipment, and what are the shelter implications?
```

#### Prompt C: Equity Audit
```text
Run an equity audit on our top stranded tracts to verify income, poverty, and language demographics against the county baseline.
```

---

## 2. Actual Agent Output (Produced via ADK Web UI)

```markdown
Pre-Season Evacuation Readiness Brief: Lee County, Florida (FIPS 12071)
Prepared for: Lee County Emergency Management
Target Completion Date: Pre-September 1 Hurricane Season Readiness

### Segment 1: Who Cannot Leave (Top Stranded Tracts & Vulnerability Analysis)
An analysis of census tracts across Lee County identifies key residential areas where residents face severe barriers to self-evacuation due to lack of personal vehicle access, advanced age, disabilities, or residence in mobile homes. High car-less tracts (in the top quartile of non-vehicle ownership) are evaluated against a strict 2.0 km micro-transit/walking threshold, while standard tracts use a 25.0 km driving radius.

Top Stranded Census Tracts in Lee County:
1. Census Tract 12071020801 (North Fort Myers area)
   - Stranded Score: 0.9550 (Highest vulnerability in Lee County)
   - Total Population: 2,062 | Households Without Vehicle: 401 (22.6%)
   - Seniors (Age 65+): 63.2% | Disability Rate: 30.9% | Mobile Home Density: 98.5%
   - Socioeconomic Indicators: Median income $26,568; poverty rate 26.9%; limited English proficiency 7.0%.

2. Census Tract 12071050104
   - Stranded Score: 0.8941 | Total Population: 2,636 | Households Without Vehicle: 77 (8.3%)
   - Seniors: 59.3% | Disability Rate: 28.2% | Mobile Home Density: 58.8%
   - Socioeconomic Indicators: Median income $54,572; poverty rate 6.1%; limited English 12.0%.

3. Census Tract 12071010112
   - Stranded Score: 0.8919 | Total Population: 2,690 | Households Without Vehicle: 17 (4.1%)
   - Seniors: 79.5% | Disability Rate: 34.5% | Mobile Home Density: 84.1%

4. Census Tract 12071001913
   - Stranded Score: 0.8570 | Total Population: 1,370 | Households Without Vehicle: 29 (5.4%)
   - Seniors: 69.7% | Disability Rate: 27.6% | Mobile Home Density: 24.2%

5. Census Tract 12071001910
   - Stranded Score: 0.8491 | Total Population: 1,480 | Households Without Vehicle: 17 (3.1%)
   - Seniors: 78.6% | Disability Rate: 21.1% | Mobile Home Density: 92.2%

6. Census Tract 12071001916
   - Stranded Score: 0.8232 | Total Population: 1,412 | Households Without Vehicle: 120 (10.3%)
   - Seniors: 52.2% | Disability Rate: 17.3% | Mobile Home Density: 31.8%
   - Socioeconomic Indicators: Median income $35,374; poverty rate 12.5%; limited English 36.0%.

Medical Power Reliance (HHS emPOWER Statistics):
- Total Electricity-Dependent Residents: 8,339
- Oxygen-Dependent Residents: 1,850
- Dialysis-Dependent Residents: 801

---

### Segment 2: Where They Would Go & Live Verification
Candidate shelter evaluation focuses strictly on facilities where designated usage is EVAC or BOTH (pre-landfall evacuation eligible) and located outside confirmed storm surge inundation zones.

Primary Candidate Shelters & Live Status Grounding:
1. Dr. Carrie D. Robinson Littleton Elementary School
   - FEMA Registry: 700 Hutto Rd, North Fort Myers, FL (Shelter ID: 134167)
   - Distance: 0.84 km straight-line from Tract 12071020801.
   - FEMA Capacity: 0 / Unrecorded | Wheelchair Record: UNRECORDED.
   - Google Maps Verification: Verified active at 700 Hutto Rd, North Fort Myers, FL 33903. Maps confirms physical wheelchair-accessible entrance and wheelchair-accessible parking lot.

2. All Souls Episcopal Church
   - FEMA Registry: 14640 N Cleveland Ave, North Fort Myers, FL (Shelter ID: 345189)
   - Distance: 1.99 km straight-line from Tract 12071020801.
   - FEMA Capacity: 100 | Wheelchair Record: UNRECORDED.
   - Google Maps Verification: Verified active at 14640 N Cleveland Ave, Fort Myers, FL 33903 (4.7 stars across 113 reviews). Maps confirms wheelchair-accessible entrance, parking lot, and restroom.

3. J. Colin English Elementary School
   - FEMA Registry: 120 Pine Island Rd, North Fort Myers, FL (Shelter ID: 134266)
   - Distance: 1.75 km from Tract 12071020502.
   - FEMA Capacity: 800 | Wheelchair Record: UNRECORDED.
   - Google Maps Verification: Verified active at 120 Pine Island Rd, North Fort Myers, FL 33903. Maps confirms wheelchair-accessible entrance and parking lot.

4. North Fort Myers Academy for The Arts
   - FEMA Registry: 1856 Arts Way, North Fort Myers, FL 33917 | Capacity: 2,500
   - Google Maps Verification: Verified active at 1856 Arts Way, North Fort Myers, FL 33917. Maps confirms wheelchair-accessible entrance, parking lot, and restroom.

---

### Segment 3: What to Fix Before the Season (Operational Gaps & Action Priorities)

1. State B Priority Checklist (Verify-First List: Shelters in reach, accessibility unrecorded)
   - Tract 12071020801 (Stranded Score 0.9550, 401 car-less households):
     Inspect Littleton Elementary School (0.84 km) and All Souls Episcopal Church (1.99 km). While Google Maps indicates physical wheelchair accessibility, formal county ADA compliance documentation must be officially certified and Littleton Elementary's capacity allocated before September 1.
   - Tract 12071020502 (Stranded Score 0.8097, 70 car-less households):
     Inspect J. Colin English Elementary School (1.75 km). Confirm entry ramp slope and ADA restroom facilities.

2. State D Priority Checklist (Transit Gap & Pickup Staging)
   - Tract 12071050104 (Stranded Score 0.8941, 77 vehicle-less households, 58.8% mobile homes):
     0 shelters within 2.0 km walking distance. Action: Establish a dedicated LeeTran paratransit pickup point to shuttle residents inland.
   - Tract 12071001916 (Stranded Score 0.8232, 120 vehicle-less households, 36.0% limited English):
     0 shelters within 2.0 km. Action: Deploy targeted bilingual evacuation alerts (Spanish/English) and stage mobile pickup vehicles prior to landfall.

3. Surge Zone Safety
   - All candidate shelters were checked against SLOSH storm surge inundation models. Pre-landfall staging routes strictly direct residents to inland facilities outside flood hazard zones.

---

### Segment 4: What the Data Cannot Tell Us (Data Limitations & Risks)

1. Unrecorded Accessibility Records:
   Approximately 93% of evacuation shelters in Lee County have UNRECORDED wheelchair accessibility statuses in official datasets. UNRECORDED indicates missing paperwork, not lack of physical accessibility.
2. Medical Power Dependence Aggregation:
   HHS emPOWER figures (8,339 electricity-dependent, 1,850 oxygen-dependent, 801 dialysis-dependent) are aggregated at the county level and cannot pinpoint neighborhood blocks.
3. Vehicle Ownership vs. Evacuation Mobility:
   Census vehicle ownership figures do not reflect mechanical reliability, fuel availability, caregiving needs, or family car sharing.
```

---

## 3. How Teammates Can Test & Validate

### A. Run Automated Unit Tests
To verify all BigQuery queries, thresholds, and view linkages:
```bash
cd ~/hurricane-evacuation
python3 -m unittest tests/test_agent_tools.py
```
*Expected Result: `Ran 5 tests ... OK`*

### B. Run CLI Interactive Agent Test
```bash
python3 agent/test_agent.py "What are the top 3 stranded tracts in Lee County?"
```

### C. Launch ADK Web UI
```bash
adk web \
  --port 8080 \
  --allow_origins "regex:https://.*.cloudshell.dev" \
  --reload_agents \
  .
```
Then click **Web Preview $\rightarrow$ Preview on port 8080** in Cloud Shell.
