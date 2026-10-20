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
