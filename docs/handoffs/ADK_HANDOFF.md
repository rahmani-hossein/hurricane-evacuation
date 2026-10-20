# Running the Miami-Dade ADK agent

From the repository root:

```bash
source ../okf/.venv/bin/activate
export GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-9fa9c7b57012
export GOOGLE_CLOUD_LOCATION=global
export GOOGLE_GENAI_USE_VERTEXAI=True
adk web hurricane-evacuation
```

The root agent is in `agent/agent.py`. It has one custom BigQuery function tool and Google Maps grounding. The batch validator in `agent/batch_maps_validation.py` is separate and writes place-validation statuses to the gold dataset.

Before running locally, authenticate ADC:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project qwiklabs-gcp-04-9fa9c7b57012
```

The agent only queries Miami-Dade gold tables. It treats `unrecorded` as uncertainty and does not claim that a shelter is operational based on Maps alone.

## Agent Runtime deployment

The repository includes a reproducible deployment path for the Google Cloud ADK/Agent Runtime
console:

```bash
export CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.13
export GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-9fa9c7b57012
export GOOGLE_CLOUD_LOCATION=us-east1
export ADK_MODEL=gemini-3.6-flash
./scripts/deploy_agent_runtime.sh
```

The script enables the required APIs, creates the private staging bucket if needed, and deploys
`agent/deploy.py` as a managed Agent Runtime reasoning engine. It prints the resulting resource name
(`projects/.../locations/.../reasoningEngines/...`). Open Vertex AI / Agent Runtime in the Google
Cloud console and use that resource to launch the ADK playground.

The runtime identity needs Vertex AI access plus BigQuery Job User and BigQuery Data Viewer access
to the project and `evacuation_readiness_gold` dataset. The lab project currently grants the
default Agent Runtime identity `service-851021919219@gcp-sa-aiplatform-re.iam.gserviceaccount.com`
those BigQuery roles at project scope. Dataset-level IAM was not available in this lab, so the
project-level Data Viewer grant is intentionally broader than production least privilege.

Gemini 3.6 is served from the global model endpoint. `agent/agent.py` sets
`GOOGLE_CLOUD_LOCATION=global` before ADK constructs its model client while the managed Agent
Runtime resource remains in `us-east1`.
