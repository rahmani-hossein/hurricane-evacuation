"""Interactive Florida Hurricane Evacuation Readiness ADK agent.

Supports multi-county operations for both Miami-Dade County (12086) and Lee County (12071)
using Google ADK, BigQuery analytical views, and Google Maps Grounding on Gemini 3.x.
"""
from __future__ import annotations

import os
import sys
import asyncio
from typing import Generator, Any, Optional, Dict, List

# Ensure repository root is on sys.path
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET = "evacuation_readiness_gold"
MODEL_NAME = os.environ.get("GEMINI_MODEL", os.environ.get("ADK_MODEL", "gemini-3.6-flash"))

# Agent Runtime may live in a regional location while Gemini 3.x is served from
# the supported global endpoint. Set this before ADK constructs its model client.
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", PROJECT)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")

from google.cloud import bigquery
from google.adk.agents import Agent
from google.adk.tools import google_maps_grounding
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent.prompts import SYSTEM_INSTRUCTION
from agent.tools import (
    rank_stranded_tracts,
    get_candidate_shelters,
    get_tract_access_state,
    get_county_power_dependence,
    run_equity_audit,
)


def query_miami_dade_readiness(
    question_type: str = "overview",
    geo_id: str | None = None,
    shelter_id: int | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    """Query curated Miami-Dade gold data for the coordinator.

    Args:
        question_type: One of overview, priority_tracts, shelter_options, or shelter.
        geo_id: Optional 11-digit tract ID for shelter options.
        shelter_id: Optional shelter ID for a shelter detail lookup.
        limit: Maximum rows returned for list queries.
    """
    limit = max(1, min(int(limit), 25))
    client = bigquery.Client(project=PROJECT)
    if question_type == "overview":
        sql = f"""
        SELECT * FROM `{PROJECT}.{DATASET}.miami_dade_county_risk_snapshot`
        """
        params = []
    elif question_type == "priority_tracts":
        sql = f"""
        SELECT geo_id, total_pop, pct_households_no_vehicle,
               pct_mobility_limitation, pct_no_internet, mobility_proxy_score
        FROM `{PROJECT}.{DATASET}.miami_dade_tract_mobility_proxy`
        ORDER BY mobility_proxy_score DESC
        LIMIT @limit
        """
        params = [bigquery.ScalarQueryParameter("limit", "INT64", limit)]
    elif question_type == "shelter_options":
        sql = f"""
        SELECT *
        FROM `{PROJECT}.{DATASET}.miami_dade_tract_shelter_options`
        WHERE (@geo_id IS NULL OR geo_id = @geo_id)
        ORDER BY mobility_proxy_score DESC, straight_line_miles ASC
        LIMIT @limit
        """
        params = [
            bigquery.ScalarQueryParameter("geo_id", "STRING", geo_id),
            bigquery.ScalarQueryParameter("limit", "INT64", limit),
        ]
    elif question_type == "shelter":
        sql = f"""
        SELECT shelter_id, shelter_name, address_1, city, zip5, latitude, longitude,
               usage_status, evacuation_capacity, wheelchair_accessible_status,
               generator_status, surge_status, readiness_score, readiness_confidence,
               data_quality_status
        FROM `{PROJECT}.{DATASET}.shelter_readiness_snapshot`
        WHERE county_fips = '12086' AND shelter_id = @shelter_id
        """
        params = [bigquery.ScalarQueryParameter("shelter_id", "INT64", shelter_id)]
    else:
        return {"error": "Unsupported question_type", "allowed": ["overview", "priority_tracts", "shelter_options", "shelter"]}

    job_config = bigquery.QueryJobConfig(query_parameters=params)
    rows = [dict(row) for row in client.query(sql, job_config=job_config).result()]
    return {"project": PROJECT, "county": "Miami-Dade", "question_type": question_type, "rows": rows}


ALL_TOOLS = [
    query_miami_dade_readiness,
    rank_stranded_tracts,
    get_candidate_shelters,
    get_tract_access_state,
    get_county_power_dependence,
    run_equity_audit,
    google_maps_grounding,
]

COMBINED_INSTRUCTION = f"""
You are the Florida Evacuation Readiness Planning Agent, serving emergency management coordinators across Florida counties, with specialized analytical tooling for Lee County (FIPS 12071) and Miami-Dade County (FIPS 12086).

{SYSTEM_INSTRUCTION}

For Miami-Dade County:
- Use `query_miami_dade_readiness` for curated BigQuery evidence from `{PROJECT}.{DATASET}`.
- Use Google Maps grounding for one named shelter at a time when the user asks to verify whether a place/address is current or when selecting a route. Do not use Maps to infer accessibility, operational capacity, medical suitability, or shelter opening status.
- Always distinguish listed capacity from confirmed available capacity, straight-line distance from drive time, and unrecorded accessibility from inaccessible.
"""


def create_evacuation_agent() -> Agent:
    """Builds and returns the Florida Evacuation Readiness Agent."""
    return Agent(
        name="florida_evacuation_readiness_agent",
        model=MODEL_NAME,
        description="Planning-time evacuation readiness agent for Florida counties (Lee County & Miami-Dade).",
        instruction=COMBINED_INSTRUCTION,
        tools=ALL_TOOLS,
    )


# Expose root_agent for ADK CLI & ADK Web UI loader
root_agent = create_evacuation_agent()


class EvacuationAgentRunner:
    """Convenience wrapper for executing queries against the ADK agent."""

    def __init__(self, agent: Optional[Agent] = None, app_name: str = "evacuation_readiness_app"):
        self.agent = agent or create_evacuation_agent()
        self.app_name = app_name
        self.session_service = InMemorySessionService()
        self.runner = Runner(
            app_name=self.app_name,
            agent=self.agent,
            session_service=self.session_service,
        )

    def query(self, user_message: str, user_id: str = "emergency_manager") -> str:
        """Sends a query to the agent and returns the complete text response."""
        session = asyncio.run(
            self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
            )
        )
        content = types.Content(parts=[types.Part.from_text(text=user_message)])
        events = list(
            self.runner.run(
                user_id=user_id,
                session_id=session.id,
                new_message=content,
            )
        )
        return "".join(
            part.text
            for event in events
            if event.content
            for part in event.content.parts
            if part.text
        )


if __name__ == "__main__":
    runner = EvacuationAgentRunner()
    print(runner.query("Give me the top 3 stranded tracts in Lee County and summarize their access states."))
