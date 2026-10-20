# Shared Deployment & Access Guide

The **Florida Evacuation Readiness Command Center & Agent** is published and deployed to Google Cloud so that everyone on the team can access, test, and integrate it.

---

## 1. Live Command Center Web App

The unified Command Center dashboard with interactive Leaflet maps, tract risk filters, equity audit views, and live AI Preparedness Copilot is deployed on Cloud Run:

* 👉 **[Command Center Web App](https://hurricane-evacuation-command-851021919219.us-east1.run.app)**
* **URL:** `https://hurricane-evacuation-command-851021919219.us-east1.run.app`
* **Features:**
  * Interactive county map & census tract risk scores (Lee County & Miami-Dade).
  * Direct chat copilot in the bottom bar connected to the teammate's live Agent API.
  * Verified Google Maps shelter grounding links.
  * Voice copilot integration.

---

## 2. Teammate ADK Agent API (`evacuation-agent-api`)

The primary analytical agent backend is an ADK FastAPI server deployed on Cloud Run:

* **Base URL:** `https://evacuation-agent-api-851021919219.us-east1.run.app`
* 👉 **[Hosted ADK Web UI](https://evacuation-agent-api-851021919219.us-east1.run.app/dev-ui/)**
  * Standalone chat interface with live tool visualizer and Maps Grounding traces.
* **REST Endpoints for Frontend Integration:**
  * **List Apps:** `GET https://evacuation-agent-api-851021919219.us-east1.run.app/list-apps`
  * **App Info & Tools:** `GET https://evacuation-agent-api-851021919219.us-east1.run.app/apps/agent/app-info`
  * **Create Session:** `POST https://evacuation-agent-api-851021919219.us-east1.run.app/apps/agent/users/{user_id}/sessions`
  * **Synchronous Run:** `POST https://evacuation-agent-api-851021919219.us-east1.run.app/run`
  * **Streaming Query (SSE):** `POST https://evacuation-agent-api-851021919219.us-east1.run.app/run_sse`

---

## 3. Vertex AI Reasoning Engines (Managed Platform Runtimes)

The team has deployed Vertex AI Agent Engine resources in `us-east1` as platform runtimes and fallbacks:

* **Primary Lee County Engine:**
  * **Resource ID:** `projects/851021919219/locations/us-east1/reasoningEngines/5276937832231862272`
  * Model: `gemini-2.5-flash` with Maps/Search grounding sub-agents.
* **Secondary Lee County Engine:**
  * **Resource ID:** `projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104`
  * 👉 **[Vertex AI Agent Playground](https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/us-east1/agent-engines/7330860737289519104/playground?project=851021919219)**
* **Miami-Dade County Engine:**
  * **Resource ID:** `projects/851021919219/locations/us-east1/reasoningEngines/1188724901742116864`

---

## 4. End-to-End Chat Routing Architecture

When a user submits a query via the Command Center chat bar or prompt pills (`POST /api/copilot/chat`):

1. **Priority 1 (Teammate ADK Agent API):** Queries `https://evacuation-agent-api-851021919219.us-east1.run.app/run`. Executes BigQuery tools (`rank_stranded_tracts`, `get_tract_access_state`, `get_candidate_shelters`) and returns live grounded response.
2. **Priority 2 (Vertex AI Reasoning Engine Fallback):** If the Cloud Run agent API is unreachable, queries `reasoningEngines/5276937832231862272` or `reasoningEngines/7330860737289519104`.
3. **Response Envelope:** Returns the answer, verified Google Maps links, and active backend identifier displayed in the modal badge.

---

## 5. Local Development & Testing

```bash
# Test Teammate ADK Agent API via Python
python3 -c "
from api.server import copilot_chat, QueryRequest
req = QueryRequest(query='What are the top 3 stranded tracts in Lee County?', county='Lee County')
print(copilot_chat(req))
"

# Run Unit Tests
python3 -m unittest tests/test_agent_tools.py

# Run CLI Agent Test
python3 agent/test_agent.py "What are the top 3 stranded tracts?"
```
