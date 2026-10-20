# Shared Deployment & Access Guide

The **Florida Evacuation Readiness Agent** is published and deployed to Google Cloud so that everyone on the team can access, test, and integrate it.

---

## 1. Instant Access: Hosted Web UI (No Setup Required)

Anyone on the team can open this link in any browser:
👉 **[Hosted ADK Web UI](https://evacuation-agent-api-851021919219.us-east1.run.app/dev-ui/)**
* URL: `https://evacuation-agent-api-851021919219.us-east1.run.app/dev-ui/`
* Includes the complete chat interface, live tool visualizer, and Google Maps Grounding traces.

---

## 2. Vertex AI Agent Engine (Managed Platform Runtime)

The agent is deployed to **Vertex AI Agent Engine (Reasoning Engine)** in `us-east1`:
* **Resource Name:** `projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104`
* **Google Cloud Console Playground:**
  👉 **[Vertex AI Agent Playground](https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/us-east1/agent-engines/7330860737289519104/playground?project=851021919219)**

---

## 3. Frontend Integration API (For Command Center Web App)

The team's web application (`https://hurricane-evacuation-command-851021919219.us-east1.run.app`) can query the agent backend directly via CORS-enabled REST/SSE:

* **Base URL:** `https://evacuation-agent-api-851021919219.us-east1.run.app`
* **List Apps:** `GET https://evacuation-agent-api-851021919219.us-east1.run.app/list-apps`
* **App Info & Tools:** `GET https://evacuation-agent-api-851021919219.us-east1.run.app/apps/agent/app-info`
* **Streaming Query (SSE):** `POST https://evacuation-agent-api-851021919219.us-east1.run.app/run_sse`
* **Synchronous Run:** `POST https://evacuation-agent-api-851021919219.us-east1.run.app/run`

---

## 4. Local Development & Testing

Teammates working in Cloud Shell or locally can pull the branch:
```bash
git fetch origin feature/agent-and-views
git checkout feature/agent-and-views
```

* **Run Unit Tests:** `python3 -m unittest tests/test_agent_tools.py`
* **Run CLI Test:** `python3 agent/test_agent.py "What are the top 3 stranded tracts?"`
* **Run Local Web UI:** `adk web --port 8080 --host 0.0.0.0 .`
