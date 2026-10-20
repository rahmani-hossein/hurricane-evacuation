# Frontend Command Center & Live Cloud Run Service Handoff

## 🌐 Live Production URL
**Cloud Run URL:** [https://hurricane-evacuation-command-851021919219.us-east1.run.app](https://hurricane-evacuation-command-851021919219.us-east1.run.app)

- **Region:** `us-east1`
- **Min Instances:** `1` (Zero cold start during judging presentation)
- **Status:** Active, serving 100% traffic, publicly accessible with no login required.

---

## 🎯 Compliance with Hackathon Criteria & Guidelines

1. **Required Deployment to Google Cloud (README line 269):**
   - Deployed to Google Cloud Run as a single unified container containing both the Vite/React UI and the FastAPI ADK agent bridge.
2. **Attribution Requirement (README line 487):**
   - Features full Google Maps attribution with unmodified casing, `<span translate="no">Google Maps</span>`, and 1-click links to Place IDs.
3. **The Readiness Brief Deliverable (README lines 528-544):**
   - **Segment 1: Who Cannot Leave:** Ranks vulnerable tracts (e.g. Tract 9807.00 Homestead) by ACS mobility proxy (zero vehicles, mobile homes, age).
   - **Segment 2: Where They Would Go:** Lists candidate destinations, capacities, generator status, surge hazard check, and batch Maps place validation.
   - **Segment 3: August Action Directives:** Concrete pre-season directives (staging paratransit, ramp inspection audits before Sept 1, medical microgrid backup).
4. **Data Integrity & Language Contract (ADK_HANDOFF.md):**
   - Strictly distinguishes *"listed capacity"* from confirmed available capacity.
   - Strictly distinguishes *"straight-line distance"* from drive time.
   - Strictly distinguishes *"accessibility unrecorded"* (95.4% in Miami-Dade) from inaccessible.
   - Strictly states *"candidate needs current verification"* instead of claiming shelters are currently open.

---

## 🛠️ Local Development (For Teammates)

If running locally in Cloud Shell:
```bash
# 1. Start the API
export GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-9fa9c7b57012
python3 -m uvicorn api.server:app --host 0.0.0.0 --port 8000 &

# 2. Start Frontend
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 8080
```
Then use Web Preview on Port 8080.
