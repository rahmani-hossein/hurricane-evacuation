# Frontend Architecture & Implementation Plan: August Readiness Command Center

**Challenge 4: Adaptive Evacuation Readiness & Vulnerable Community Planning**  
**Role:** Frontend Lead  
**Deliverable:** Interactive Operations Dashboard & Pre-Season Readiness Brief UI

---

## 1. Persona & Product Story
- **Who your user is:** The **County Emergency Management Director** drafting the seasonal readiness brief in mid-August (3 weeks before peak storm season).
- **The Core User Goal:** Identify which vulnerable populations cannot self-evacuate, evaluate whether designated shelters are physically viable and verified, and generate actionable pre-season intervention tasks.
- **Why this beats a standard chat interface:** 
  > *"A map of a county with the gaps marked beats a chat log."*  
  Judges score **Craft & Communication (15%)** and **Impact (30%)** heavily on whether an emergency manager could actually act on the interface.

---

## 2. Dashboard Layout Architecture

A modern split-screen operations view built for clarity under decision-making pressure:

```
+----------------------------------------------------------------------------------------------------+
| 🛡️ Florida Pre-Season Evacuation Readiness | County: [ Lee County, FL ▾ ] | Season: August 2026     |
+----------------------------------------------------+-----------------------------------------------+
|  🗺️ INTERACTIVE GEOSPATIAL MAP (60%)                |  📋 THE READINESS BRIEF PANEL (40%)           |
|                                                    |                                               |
|  [Filter Toggles]                                  |  [Tab 1: Readiness Brief] [Tab 2: Copilot]     |
|  🔘 Zero-Vehicle Tracts  🔘 Mobile Homes           |                                               |
|  🔘 Verified Shelters    🔘 Surge Risk Warning     |  SECTION 1: WHO CANNOT SELF-EVACUATE          |
|                                                    |  • 3,420 Households with no vehicle access   |
|  ┌──────────────────────────────────────────────┐  |  • 1,280 Residents power/oxygen dependent     |
|  │ [Red Polygon: High carless tract]            │  |  • Top Vulnerable Tract: Tract 0801.02        |
|  │       \  (Straight line distance 6.2 km)     │  |                                               |
|  │        ▼                                     │  SECTION 2: SHELTER DESTINATION AUDIT         |
|  │   [🔴 Shelter: Sits in SLOSH Surge Zone!]   │  |  • Estero High School: 🟢 Verified Active    |
|  │                                              │  |    [Verified via Google Maps] (compliant)   |
|  │   [🟢 Shelter: Verified Active & Generator]  │  |  • ⚠️ 88% Wheelchair Data UNRECORDED (not No)|
|  │                                              │  |                                               |
|  │   [🟡 Shelter: Unrecorded Accessibility]    │  |  SECTION 3: ACTIONABLE AUGUST DIRECTIVES   |
|  └──────────────────────────────────────────────┘  |  1. [Transit] Pre-position bus at Tract 0801 |
|                                                    |  2. [Surge] Relocate evacuees from Shelter #4 |
|                                                    |  3. [Audit] Inspect ramp at Cypress Lake HS   |
+----------------------------------------------------+-----------------------------------------------+
|  💬 AGENT COPILOT COMMAND BAR: "Find accessible shelters within 5km of high-density mobile homes"  |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Core UI Components & Specs

### Component 1: The Interactive Map (`<EvacuationMap />`)
- **Technology:** `Leaflet` via `react-leaflet` (zero API key needed to start; works instantly with OpenStreetMap tiles).
- **Layers:**
  1. **Vulnerability Choropleth:** Census tracts shaded from light orange to dark red based on `% no vehicle` or mobile home count.
  2. **Shelter Markers (Color-Coded Status):**
     - 🟢 **Green:** Safe (Outside surge zone + generator equipped).
     - 🟡 **Amber:** **Unrecorded Status** (Clear badge: *"Unassessed in federal registry - not confirmed inaccessible"*).
     - 🔴 **Red:** **Critical Hazard** (Located directly in FEMA SLOSH surge zone or 100-yr floodplain).
  3. **Transit Connection Vectors:** Dynamic lines connecting vulnerable tract centroids to the nearest candidate shelters.
  4. **Care Facilities (Blue Crosses):** Nursing homes with bed counts displayed on hover.

### Component 2: The Official "Readiness Brief" Card (`<ReadinessBrief />`)
Three structured segments matching the exact hackathon submission criteria:
1. **Who Cannot Leave:**
   - Total zero-vehicle households in county.
   - Total power-dependent patients (HHS emPOWER county baseline).
   - Top 5 prioritized tracts with metrics (over-65 %, disability %, vehicle-less %).
2. **Where They Can Go (Shelter Audit):**
   - Total evacuation capacity vs. estimated vulnerable population.
   - Shelter status breakdown: Available vs. Surge-threatened.
   - Unrecorded accessibility callout badge.
3. **What to Fix Before September (Action Directives):**
   - High-priority operational recommendations formatted as checklist cards with severity tags (`URGENT`, `AUDIT`, `TRANSIT`).

### Component 3: Google Maps Attribution Card (`<GoogleMapsAttribution />`)
Strict compliance with Google Platform guidelines:
- Must appear immediately adjacent to the grounded facility information.
- Visible within one user interaction.
- The phrase `Google Maps` must have `translate="no"`, unmodified capitalization, and link to source place URI.

```tsx
export function MapsAttribution({ title, placeUri, address, status }: MapsAttributionProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 my-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">{title}</span>
        <span className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
          {status || "Active / Open"}
        </span>
      </div>
      <p className="text-slate-500 truncate mt-0.5">{address}</p>
      <div className="mt-2 flex items-center justify-between text-slate-400 border-t border-slate-100 pt-1.5">
        <span className="text-[11px]">
          Verified live via <strong translate="no" className="text-slate-700">Google Maps</strong>
        </span>
        <a 
          href={placeUri} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium"
        >
          View on Maps →
        </a>
      </div>
    </div>
  );
}
```

### Component 4: "Unrecorded ≠ No" Clarification Banner (`<DataIntegrityAlert />`)
A prominent UI alert that directly satisfies the challenge’s judging requirement:
> *"88% of shelters in Florida have no recorded wheelchair accessibility. This system marks them as UNRECORDED rather than INACCESSIBLE to prevent dangerous false negatives."*

---

## 4. Frontend Tech Stack

- **Tooling:** Vite + React (TypeScript)
- **Styling:** Tailwind CSS (fast styling, modern operational dark/light theme)
- **Maps:** `leaflet` + `react-leaflet`
- **Icons:** `lucide-react` (bus, alert-triangle, shield-alert, power-off, map-pin, check-circle)
- **State Management:** React hooks / lightweight state (Zustand or React Context)
- **Environment:** Cloud Shell container with Node v24.21 and npm 12.2.0

---

## 5. Mock Data Contract (Build Without Waiting on Agent)

The frontend will use `frontend/src/mock/readinessData.json` so you can build and polish the complete UI immediately:

```json
{
  "county": "Lee County",
  "state": "FL",
  "summary": {
    "total_vulnerable_households": 3420,
    "power_dependent_patients": 1280,
    "total_shelter_capacity": 42500,
    "surge_exposed_shelters_count": 4,
    "unrecorded_accessibility_pct": 86.5
  },
  "top_vulnerable_tracts": [
    {
      "tract_id": "12071080102",
      "name": "Tract 801.02 (Pine Island / Matlacha)",
      "households_no_vehicle": 412,
      "pct_no_vehicle": 18.4,
      "pct_age_65_plus": 41.2,
      "mobile_homes": 380,
      "lat": 26.6214,
      "lon": -82.1158,
      "nearest_shelter_dist_km": 8.4,
      "risk_level": "CRITICAL"
    }
  ],
  "candidate_shelters": [
    {
      "shelter_id": 1042,
      "shelter_name": "Estero High School",
      "address": "21900 River Ranch Rd, Estero, FL 33928",
      "lat": 26.4385,
      "lon": -81.7942,
      "evacuation_capacity": 2200,
      "wheelchair_accessible": true,
      "generator_onsite": true,
      "in_surge_zone": false,
      "grounding_status": "Verified Active",
      "maps_place_uri": "https://maps.google.com/?cid=1234567890"
    },
    {
      "shelter_id": 1088,
      "shelter_name": "Sanibel Community Center",
      "address": "2173 Periwinkle Way, Sanibel, FL 33957",
      "lat": 26.4369,
      "lon": -82.0792,
      "evacuation_capacity": 450,
      "wheelchair_accessible": null,
      "generator_onsite": false,
      "in_surge_zone": true,
      "grounding_status": "Renamed / Limited Access",
      "maps_place_uri": "https://maps.google.com/?cid=9876543210"
    }
  ],
  "action_directives": [
    {
      "id": 1,
      "type": "SURGE_HAZARD",
      "severity": "HIGH",
      "title": "De-designate Sanibel Community Center for Pre-Landfall Evacuation",
      "description": "Shelter is located within SLOSH Category 2 surge zone. Re-route coastal evacuees inland to Estero HS."
    },
    {
      "id": 2,
      "type": "TRANSIT_GAP",
      "severity": "CRITICAL",
      "title": "Establish Paratransit Pickup Depot at Pine Island Center",
      "description": "412 zero-vehicle households located >8km from nearest verified accessible facility."
    },
    {
      "id": 3,
      "type": "ACCESSIBILITY_AUDIT",
      "severity": "MEDIUM",
      "title": "Dispatch In-Person Ramp & Door Assessment to Riverdale HS",
      "description": "Accessibility status unrecorded in federal NSS database. Facility is outside surge zone with 1,800 capacity."
    }
  ]
}
```

---

## 6. Implementation Timeline & Next Steps

| Phase | Duration | Tasks |
|---|---|---|
| **Phase 1: Scaffolding** | 15 mins | Initialize Vite React app in `frontend/`, install Tailwind, Lucide, Leaflet |
| **Phase 2: Layout & Map** | 30 mins | Implement Leaflet map with custom marker icons (Verified, Unrecorded, Surge) |
| **Phase 3: Readiness Brief** | 30 mins | Build 3-part brief sidebar cards + Action directives checklist |
| **Phase 4: Maps Attribution** | 15 mins | Build compliant Google Maps component with `translate="no"` |
| **Phase 5: Agent API Hookup**| 20 mins | Connect chat bar / brief refresh button to Python backend endpoint |
| **Total** | ~1 hr 50m | Ready for demo rehearsal & video recording |
