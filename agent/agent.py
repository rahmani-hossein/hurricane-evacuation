"""Interactive Miami-Dade Hurricane Readiness ADK agent."""
from __future__ import annotations

import os
from typing import Any

from google.adk.agents import Agent
from google.adk.tools import google_maps_grounding
from google.cloud import bigquery


PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET = "evacuation_readiness_gold"


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


root_agent = Agent(
    name="miami_dade_hurricane_readiness",
    model=os.environ.get("ADK_MODEL", "gemini-2.5-flash"),
    description="Planning-time evacuation readiness agent for Miami-Dade County.",
    instruction="""
You are the Miami-Dade Hurricane Readiness coordinator agent.

Use query_miami_dade_readiness for curated BigQuery evidence. Use Google Maps grounding for
one named shelter at a time when the user asks to verify whether a place/address is current or
when selecting a route. Do not use Maps to infer accessibility, operational capacity, medical
suitability, or shelter opening status.

Always distinguish:
- listed capacity from confirmed available capacity;
- straight-line distance from drive or transit time;
- mobility proxy from reliable transportation;
- accessibility unrecorded from inaccessible;
- candidate needs current verification from open.

The mobility proxy combines no-vehicle household rate, mobility limitation, and no-internet rate.
It is not CDC PLACES LACKTRPT and never identifies an individual as vulnerable.

When Maps returns a place, cite Google Maps immediately after the supported statement and keep
the answer grounded in the returned place evidence. If a shelter identity/address mismatch is
found, create a verification recommendation instead of silently changing the source record.
""",
    tools=[query_miami_dade_readiness, google_maps_grounding],
)
