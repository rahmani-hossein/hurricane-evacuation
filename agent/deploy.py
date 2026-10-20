"""Deploy the Lee County ADK agent to Vertex AI Agent Runtime."""

from __future__ import annotations

import os
from pathlib import Path

import vertexai
from vertexai import agent_engines

from agent.agent import root_agent


PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-east1")
STAGING_BUCKET = os.environ.get("AGENT_ENGINE_STAGING_BUCKET", f"gs://{PROJECT}-agent-staging")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    # `extra_packages` is archived with the path passed to `tar.add`. Use a
    # repository-relative path so the remote runtime extracts `agent/` at the
    # importable package root instead of embedding the local absolute path.
    os.chdir(repo_root)
    vertexai.init(project=PROJECT, location=LOCATION, staging_bucket=STAGING_BUCKET)

    app = agent_engines.AdkApp(
        agent=root_agent,
        app_name="lee_county_hurricane_readiness",
        enable_tracing=True,
    )

    remote_agent = agent_engines.create(
        agent_engine=app,
        requirements=str(repo_root / "requirements.txt"),
        extra_packages=["agent"],
        display_name="Lee County Hurricane Readiness",
        description=(
            "Planning-time Lee County evacuation readiness agent using curated BigQuery evidence "
            "and Google Maps grounding."
        ),
        env_vars={"GEMINI_MODEL": MODEL},
        min_instances=0,
        max_instances=2,
    )
    print(remote_agent.resource_name)


if __name__ == "__main__":
    main()
