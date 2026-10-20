# Shelter Verification & Google Maps Grounding Guide

This guide details how to use Google Maps Grounding alongside BigQuery shelter records to validate operational status, identify address discrepancies, verify physical wheelchair accessibility, and assess storm surge risk.

---

## 1. Grounding Principles & Dual-Source Truth

When validating evacuation shelters in Lee County, FL, always distinguish between:
* **FEMA / State Administrative Registry (`evacuation_readiness.shelters`):** Contains official emergency designation, usage classification (`EVAC`, `POST`, `BOTH`), official capacity, and recorded administrative ADA paperwork.
* **Google Maps Live Grounding:** Reflects the physical reality on the ground—whether the building is still open, current venue name, corrected street addresses, and physical accessibility attributes (entrance ramps, designated parking, ADA restrooms).

> **Rule:** Never say a facility is "not accessible" simply because FEMA records are `NULL` or unrecorded. Use Google Maps to verify physical features, but mark it as **State B (Verify-First)** until county paperwork is officially updated.

---

## 2. Key Verified Facilities

### 1. Hertz Arena
* **FEMA Registry Record:** 
  * ID: `134379` | Name: `Hertz Arena (Pet Friendly)`
  * Address: `11000 Everblades Parkway, Estero, FL`
  * FEMA Wheelchair Status: `false` (Defect / Missing Documentation)
* **Google Maps Grounding Verification:**
  * Verified Name: **Hertz Arena** (Operating commercial venue / stadium)
  * Full Address: `11000 Everblades Pkwy, Estero, FL 33928`
  * Accessibility: **Wheelchair-accessible entrance, parking lot, restrooms, and seating.**
  * Finding: Despite being flagged as not accessible in the FEMA registry, live Maps confirms full physical ADA accessibility.

### 2. Dr. Carrie D. Robinson Littleton Elementary School
* **FEMA Registry Record:**
  * ID: `134167` | Usage: `EVAC`
  * Distance: `0.84 km` straight-line from Tract `12071020801` (Top Stranded Tract)
  * FEMA Capacity: `0 / Unrecorded` | Wheelchair Status: `UNRECORDED`
* **Google Maps Grounding Verification:**
  * Operating as active elementary school at `700 Hutto Rd, North Fort Myers, FL 33903`.
  * Physical ADA: Accessible entrance and accessible parking lot confirmed.
  * Recommendation: Pre-season inspection team must finalize official shelter capacity before September 1.

### 3. J. Colin English Elementary School
* **FEMA Registry Record:**
  * ID: `134266` | Address: `120 Pine Island Dr` (Typo in FEMA record: "Dr" instead of "Rd")
  * Capacity: `800` | Wheelchair: `UNRECORDED`
* **Google Maps Grounding Verification:**
  * Operating at `120 Pine Island Rd, North Fort Myers, FL 33903`.
  * Physical ADA: Accessible entrance and parking lot.

### 4. Dunbar High School & Hazard Exclusion
* **FEMA Registry Record:**
  * `Dunbar High School - Pets` (Shelter ID `134601`): `in_surge_slosh_area = TRUE`
* **Operational Caution:**
  * While Google Maps confirms Dunbar High School is an active facility with accessible entrance and parking, it is located within a **SLOSH storm surge inundation area**.
  * **Rule:** It must be strictly excluded from pre-landfall evacuation staging.

---

## 3. How to Validate Any Shelter with the Agent

In the **ADK Web UI** or via CLI, enter prompts like:

```text
Verify the following facility using Google Maps:
Name: [Shelter Name]
Address: [Street Address, City, FL]

Please check:
1. Does it still exist under this name or has it been renamed?
2. Is it currently open / active?
3. What wheelchair accessibility attributes (entrance, parking, restroom) does Google Maps confirm?
4. How does this compare with the official FEMA registry record?
```
