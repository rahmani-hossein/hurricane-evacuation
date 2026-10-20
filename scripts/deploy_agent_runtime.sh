#!/usr/bin/env bash
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-04-9fa9c7b57012}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-east1}"
BUCKET="${AGENT_ENGINE_STAGING_BUCKET:-gs://${PROJECT}-agent-staging}"

export CLOUDSDK_PYTHON="${CLOUDSDK_PYTHON:-/opt/homebrew/bin/python3.13}"
export GOOGLE_CLOUD_PROJECT="$PROJECT"
export GOOGLE_CLOUD_LOCATION="$LOCATION"
export GOOGLE_GENAI_USE_VERTEXAI=True
export ADK_MODEL="${ADK_MODEL:-gemini-3.6-flash}"
export AGENT_ENGINE_STAGING_BUCKET="$BUCKET"
PYTHON_BIN="${PYTHON_BIN:-python3}"

gcloud config set project "$PROJECT" >/dev/null
gcloud services enable \
  aiplatform.googleapis.com \
  bigquery.googleapis.com \
  storage.googleapis.com \
  logging.googleapis.com \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  iam.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

if ! gcloud storage buckets describe "$BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "$BUCKET" --location="$LOCATION" --uniform-bucket-level-access
fi

"$PYTHON_BIN" -m agent.deploy
