# Sample Reference Artifact: Lee County Evacuation Readiness Brief

This document contains a verified sample execution of the **Florida Evacuation Readiness Agent** for Lee County, FL (`county_fips = '12071'`), answering the Challenge 4 requirements.

---

## Segment 1: Who Cannot Leave

Analysis of the 223 Census Tracts across Lee County identifies the top tracts where residents face the steepest barriers to personal vehicle self-evacuation based on the composite **Stranded Score** (equal weighting of percentile ranks in no-vehicle rate, age 65+, disability, and mobile homes).

### Top Ranked Vulnerable Census Tracts
1. **Tract 12071020801**
   * **Stranded Score:** 0.9550
   * **Total Population:** 2,062 | **Households without Vehicle:** 401 (22.6%)
   * **Age 65+:** 63.2% | **Disability:** 30.9% | **Mobile Homes:** 98.5%
   * **Socioeconomic Indicators:** Median Income: $26,568 | Poverty Rate: 26.9% | Limited English: 7.0% | SVI Rank: 0.7604
   * **Reachable Threshold:** 2.0 km (Micro-transit / Walk Zone)

2. **Tract 12071050104**
   * **Stranded Score:** 0.8941
   * **Total Population:** 2,636 | **Households without Vehicle:** 77 (8.3%)
   * **Age 65+:** 59.3% | **Disability:** 28.2% | **Mobile Homes:** 58.8%
   * **Socioeconomic Indicators:** Median Income: $54,572 | Poverty Rate: 6.1% | Limited English: 12.0%
   * **Reachable Threshold:** 2.0 km (Micro-transit / Walk Zone)

3. **Tract 12071010112**
   * **Stranded Score:** 0.8919
   * **Total Population:** 2,690 | **Households without Vehicle:** 17 (4.1%)
   * **Age 65+:** 79.5% | **Disability:** 34.5% | **Mobile Homes:** 84.1%
   * **Socioeconomic Indicators:** Median Income: $48,700 | Poverty Rate: 5.7%

4. **Tract 12071001913**
   * **Stranded Score:** 0.8570
   * **Total Population:** 1,370 | **Households without Vehicle:** 29 (5.4%)
   * **Age 65+:** 69.7% | **Disability:** 27.6% | **Mobile Homes:** 24.2%

5. **Tract 12071001910**
   * **Stranded Score:** 0.8491
   * **Total Population:** 1,480 | **Households without Vehicle:** 17 (3.1%)
   * **Age 65+:** 78.6% | **Disability:** 21.1% | **Mobile Homes:** 92.2%

6. **Tract 12071001916**
   * **Stranded Score:** 0.8232
   * **Total Population:** 1,412 | **Households without Vehicle:** 120 (10.3%)
   * **Age 65+:** 52.2% | **Disability:** 17.3% | **Mobile Homes:** 31.8%
   * **Socioeconomic Indicators:** Median Income: $35,374 | Poverty Rate: 12.5% | Limited English: 36.0%
   * **Reachable Threshold:** 2.0 km (Micro-transit / Walk Zone)

### Medical Power Reliance (HHS emPOWER Statistics)
* **Total Electricity-Dependent Residents:** 8,339
* **Oxygen-Dependent Residents:** 1,850
* **Dialysis-Dependent Residents:** 801

---

## Segment 2: Where They Would Go, and Whether That Holds Up

For pre-landfall evacuation planning, shelters must have usage classified as pre-landfall (`EVAC` or `BOTH`) and sit outside confirmed storm surge inundation zones. Candidate shelters were matched and verified via Google Maps Grounding.

### Shelter Evaluations & Grounding Checks
1. **Dr. Carrie D. Robinson Littleton Elementary School**
   * **FEMA Registry:** 700 Hutto Rd, North Fort Myers, FL 33903 | 0.84 km straight-line from Tract 12071020801 | Capacity: 0 recorded | Surge: Outside surge | Wheelchair: `UNRECORDED`
   * **Live Google Maps Grounding:** Facility verified active at 700 Hutto Rd, North Fort Myers, FL 33903. Attributes confirm wheelchair-accessible entrances and parking lots.

2. **All Souls Episcopal Church**
   * **FEMA Registry:** 14640 N Cleveland Ave, Fort Myers, FL 33903 | 1.99 km straight-line from Tract 12071020801 | Capacity: 100 | Surge: Outside surge | Wheelchair: `UNRECORDED`
   * **Live Google Maps Grounding:** Facility verified active at 14640 N Cleveland Ave, Fort Myers, FL 33903. Attributes confirm wheelchair-accessible entrance, parking lot, and restroom.

3. **J. Colin English Elementary School**
   * **FEMA Registry:** 120 Pine Island Rd, North Fort Myers, FL 33903 | 1.75 km from Tract 12071020502 | Capacity: 800 | Surge: Outside surge | Wheelchair: `UNRECORDED`
   * **Live Google Maps Grounding:** Facility verified active at 120 Pine Island Rd, North Fort Myers, FL 33903. Attributes confirm wheelchair-accessible entrance and parking lot.

4. **North Fort Myers Academy for The Arts**
   * **FEMA Registry:** 1856 Arts Way, North Fort Myers, FL 33917 | 1.90 km from Tract 12071020501 | Capacity: 2,500 | Surge: Outside surge | Wheelchair: `UNRECORDED`
   * **Live Google Maps Grounding:** Facility verified active at 1856 Arts Way, North Fort Myers, FL 33917. Attributes confirm wheelchair-accessible entrance, parking lot, and restroom.

---

## Segment 3: What to Fix Before the Season

### Operational Access Classifications & Action Plan

#### 1. State B: "Verify-First Shortlist" (Shelters within reach, wheelchair status unrecorded)
* **Tract 12071020801** (Stranded Score: 0.9550, 401 car-less households)
  * **Reachable Facilities:** Littleton Elementary School (0.84 km), All Souls Episcopal Church (1.99 km).
  * **Action Required:** Physical site inspection and official update of ADA/wheelchair accessibility compliance records before September 1. Although Google Maps confirms physical wheelchair accessibility, formal administrative paperwork remains unrecorded in emergency management databases.
* **Tract 12071020502** (Stranded Score: 0.8097, 70 car-less households)
  * **Reachable Facility:** J. Colin English Elementary School (1.75 km).
  * **Action Required:** Complete ADA verification sweep for building entry points and restroom stalls prior to landfall.

#### 2. State D: "Transit Gap / Dedicated Pickup Routes Needed" (No eligible pre-landfall shelter within 2.0 km)
* **Tract 12071050104** (Stranded Score: 0.8941, 77 car-less households, 58.8% mobile homes)
  * **Reachable Shelters within 2 km:** 0
  * **Action Required:** Establish a dedicated paratransit/micro-transit pickup hub to shuttle residents across the 2.0 km gap to inland high-capacity shelters prior to tropical storm force wind onset.
* **Tract 12071001916** (Stranded Score: 0.8232, 120 car-less households, 36.0% limited English proficiency)
  * **Reachable Shelters within 2 km:** 0
  * **Action Required:** Deploy targeted multi-lingual evacuation alerts (English/Spanish) and pre-stage bus routing.

#### 3. Hazard Mitigation
* **Surge Zone Exclusion:** Ensure all pre-landfall staging routes strictly direct residents to inland facilities outside SLOSH storm surge inundation zones.

---

## Segment 4: What the Data Cannot Tell Us

1. **Paperwork and Record Gaps:**  
   Approximately 93% of designated shelters in Lee County currently lack explicit wheelchair accessibility documentation (`NULL`/`UNRECORDED`) in official datasets. While live mapping data verifies physical access features at key locations, formal administrative verification is necessary to guarantee compliance with ADA emergency shelter standards.

2. **Geographic Granularity Limits:**  
   Department of Health and Human Services (HHS) emPOWER medical power-dependence figures (8,339 electricity-dependent residents, 1,850 oxygen-dependent residents, 801 dialysis-dependent residents) are aggregated at the county level. They do not provide exact street addresses or census-tract distributions, requiring coordination with local utility providers and home health agencies to map high-risk medical accounts.

3. **Behavioral and Economic Realities:**  
   Census statistics reflecting vehicle ownership do not capture vehicle reliability, financial constraints regarding fuel, caregiving responsibilities, or informal carpooling arrangements. Pre-landfall transit assistance must be available even in tracts with low rates of total zero-vehicle households.
