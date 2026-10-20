"""Batch Google Maps place validation for Miami-Dade shelter candidates.

This intentionally persists only the shelter source fields, Maps place_id,
derived match status, timestamp, and errors. Full Maps response text is not
written to BigQuery.
"""
from __future__ import annotations

import argparse
import asyncio
import os
from datetime import datetime, timezone

from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.adk.tools import google_maps_grounding
from google.cloud import bigquery


PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET = "evacuation_readiness_gold"
SOURCE = f"{PROJECT}.{DATASET}.shelter_readiness_snapshot"
DESTINATION = f"{PROJECT}.{DATASET}.miami_dade_shelter_maps_validation"


def make_agent() -> Agent:
    return Agent(
        name="miami_dade_shelter_maps_validator",
        model=os.environ.get("MAPS_GROUNDING_MODEL", "gemini-2.5-flash"),
        instruction=(
            "Validate exactly one named place using Google Maps grounding. "
            "Compare the supplied name/address to the grounded place. "
            "Do not infer shelter operation, capacity, medical suitability, "
            "or accessibility. Return a short assessment only."
        ),
        tools=[google_maps_grounding],
    )


def ensure_table(client: bigquery.Client) -> None:
    schema = [
        bigquery.SchemaField("shelter_id", "INT64"),
        bigquery.SchemaField("query_name", "STRING"),
        bigquery.SchemaField("query_address", "STRING"),
        bigquery.SchemaField("query_latitude", "FLOAT64"),
        bigquery.SchemaField("query_longitude", "FLOAT64"),
        bigquery.SchemaField("maps_place_id", "STRING"),
        bigquery.SchemaField("place_match_status", "STRING"),
        bigquery.SchemaField("maps_checked_at", "TIMESTAMP"),
        bigquery.SchemaField("error_code", "STRING"),
    ]
    table = bigquery.Table(DESTINATION, schema=schema)
    table.time_partitioning = bigquery.TimePartitioning(field="maps_checked_at")
    client.create_table(table, exists_ok=True)


def rows_to_validate(client: bigquery.Client, limit: int | None) -> list[dict]:
    query = f"""
    SELECT shelter_id, shelter_name, address_1, city, zip5, latitude, longitude
    FROM `{SOURCE}`
    WHERE county_fips = '12086'
      AND usage_status IN ('EVAC', 'BOTH')
      AND data_quality_status IN ('candidate', 'candidate_needs_current_verification')
      AND shelter_id NOT IN (SELECT shelter_id FROM `{DESTINATION}`)
    ORDER BY shelter_id
    """
    if limit:
        query += f" LIMIT {int(limit)}"
    return [dict(row) for row in client.query(query).result()]


def final_event(events):
    for event in reversed(events):
        if getattr(event, "is_final_response", lambda: False)():
            return event
    return None


def extract_result(event):
    if event is None:
        return None, "not_found"
    metadata = getattr(event, "grounding_metadata", None)
    chunks = getattr(metadata, "grounding_chunks", None) if metadata else None
    place_id = None
    if chunks:
        for chunk in chunks:
            maps = getattr(chunk, "maps", None)
            if maps and getattr(maps, "place_id", None):
                place_id = maps.place_id
                break
    text = " ".join(
        getattr(part, "text", "")
        for part in (getattr(getattr(event, "content", None), "parts", None) or [])
    ).lower()
    if not place_id:
        status = "not_found" if any(x in text for x in ("not found", "could not", "no matching")) else "ambiguous_place"
    elif any(x in text for x in ("mismatch", "different address", "does not match")):
        status = "address_mismatch"
    elif any(x in text for x in ("validated", "located at", "align", "match")):
        status = "confirmed_match"
    else:
        status = "probable_match_review"
    return place_id, status


async def validate_one(agent: Agent, row: dict, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        address = f"{row['address_1']}, {row['city']}, FL {row['zip5']}"
        prompt = (
            f"Validate this place with Google Maps: {row['shelter_name']}, {address}. "
            "Return whether the named place and address match."
        )
        try:
            events = await InMemoryRunner(agent=agent).run_debug(prompt, quiet=True)
            event = final_event(events)
            place_id, status = extract_result(event)
            return {
                "shelter_id": row["shelter_id"],
                "query_name": row["shelter_name"],
                "query_address": address,
                "query_latitude": row["latitude"],
                "query_longitude": row["longitude"],
                "maps_place_id": place_id,
                "place_match_status": status,
                "maps_checked_at": datetime.now(timezone.utc).isoformat(),
                "error_code": None,
            }
        except Exception as exc:  # keep the batch resumable
            return {
                "shelter_id": row["shelter_id"],
                "query_name": row["shelter_name"],
                "query_address": address,
                "query_latitude": row["latitude"],
                "query_longitude": row["longitude"],
                "maps_place_id": None,
                "place_match_status": "api_error",
                "maps_checked_at": datetime.now(timezone.utc).isoformat(),
                "error_code": type(exc).__name__,
            }


async def main(limit: int | None, concurrency: int) -> None:
    client = bigquery.Client(project=PROJECT)
    ensure_table(client)
    rows = rows_to_validate(client, limit)
    print(f"Candidates remaining: {len(rows)}")
    if not rows:
        return
    agent = make_agent()
    semaphore = asyncio.Semaphore(concurrency)
    results = await asyncio.gather(*(validate_one(agent, row, semaphore) for row in rows))
    errors = client.insert_rows_json(DESTINATION, results)
    if errors:
        raise RuntimeError(errors)
    counts = {}
    for result in results:
        counts[result["place_match_status"]] = counts.get(result["place_match_status"], 0) + 1
    print(f"Inserted {len(results)} validation rows: {counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--concurrency", type=int, default=4)
    args = parser.parse_args()
    asyncio.run(main(args.limit, args.concurrency))
