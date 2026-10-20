"""Custom analytical tools for the Florida Evacuation Readiness Agent.

These tools query the curated gold views in `evacuation_readiness_gold` scoped to Lee County, FL (12071).
"""

from __future__ import annotations

from typing import List, Dict, Any
import json
import os
import urllib.request

import google.auth
from google.auth.transport.requests import Request

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET_ID = "evacuation_readiness_gold"
BIGQUERY_MCP_ENDPOINT = os.environ.get(
    "BIGQUERY_MCP_ENDPOINT", "https://bigquery.googleapis.com/mcp"
)
BIGQUERY_SCOPE = "https://www.googleapis.com/auth/bigquery"


def _sql_string(value: str) -> str:
    """Return a safely escaped GoogleSQL string literal."""
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def _sql_int(value: int, *, minimum: int = 1, maximum: int = 100) -> int:
    value = int(value)
    return max(minimum, min(value, maximum))


def _mcp_query(query: str) -> List[Dict[str, Any]]:
    """Execute read-only SQL through Google's managed BigQuery MCP server.

    Keeping this boundary in one place makes it explicit that the agent's
    analytical queries do not use the BigQuery Python client directly.
    """
    credentials, _ = google.auth.default(scopes=[BIGQUERY_SCOPE])
    credentials.refresh(Request())
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "execute_sql_readonly",
            "arguments": {
                "projectId": PROJECT_ID,
                "query": query,
                "timeoutMs": 20000,
            },
        },
    }
    request = urllib.request.Request(
        BIGQUERY_MCP_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {credentials.token}",
            "x-goog-user-project": PROJECT_ID,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "MCP-Protocol-Version": "2026-07-28",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        envelope = json.load(response)

    if "error" in envelope:
        raise RuntimeError(f"BigQuery MCP error: {envelope['error']}")
    result = envelope.get("result", {})
    if result.get("isError"):
        raise RuntimeError(f"BigQuery MCP tool error: {result}")

    structured = result.get("structuredContent")
    if isinstance(structured, dict):
        rows = structured.get("rows") or structured.get("result")
        if isinstance(rows, list):
            return _decode_mcp_rows(rows, structured.get("schema"))

    # MCP servers may return the structured tool result as JSON text content.
    for item in result.get("content", []):
        if item.get("type") != "text":
            continue
        try:
            decoded = json.loads(item.get("text", ""))
        except json.JSONDecodeError:
            continue
        if isinstance(decoded, dict):
            rows = decoded.get("rows") or decoded.get("result")
            if isinstance(rows, list):
                return _decode_mcp_rows(rows, decoded.get("schema"))
    raise RuntimeError("BigQuery MCP returned no tabular rows")


def _decode_mcp_rows(rows: List[Any], schema: Dict[str, Any] | None) -> List[Dict[str, Any]]:
    """Convert BigQuery MCP's wire rows ({f:[{v:...}]}) to normal dicts."""
    fields = [field.get("name") for field in (schema or {}).get("fields", [])]
    types = [field.get("type") for field in (schema or {}).get("fields", [])]
    decoded = []
    for row in rows:
        values = row.get("f", []) if isinstance(row, dict) else row
        record = {}
        for index, name in enumerate(fields):
            value = values[index].get("v") if index < len(values) else None
            if value is not None and index < len(types):
                if types[index] in {"INTEGER", "INT64"}:
                    value = int(value)
                elif types[index] in {"FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"}:
                    value = float(value)
                elif types[index] in {"BOOLEAN", "BOOL"}:
                    value = str(value).lower() == "true"
            record[name] = value
        decoded.append(record)
    return decoded

def rank_stranded_tracts(top_n: int = 10) -> List[Dict[str, Any]]:
    """Ranks the census tracts in Lee County whose residents have the highest barrier to self-evacuation.
    
    Computes Stranded Score from vehicle access, age 65+, disability, and mobile home rates.
    
    Args:
        top_n: Number of top vulnerable tracts to return (default: 10).
    
    Returns:
        List of tract records including geo_id, population, stranded_score, and households without vehicle.
    """
    query = f"""
    SELECT 
        geo_id,
        total_pop,
        households_no_vehicle,
        ROUND(pct_no_vehicle, 1) AS pct_no_vehicle,
        ROUND(pct_age_65_plus, 1) AS pct_age_65_plus,
        ROUND(pct_disability, 1) AS pct_disability,
        ROUND(pct_mobile_homes, 1) AS pct_mobile_homes,
        stranded_score,
        reachable_dist_m
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_risk`
    ORDER BY stranded_score DESC
    LIMIT @top_n
    """
    return _mcp_query(query.replace("@top_n", str(_sql_int(top_n))))

def get_candidate_shelters(geo_id: str) -> List[Dict[str, Any]]:
    """Retrieves eligible pre-landfall evacuation shelters within reach for a given census tract.
    
    Only returns shelters where usage IN ('EVAC', 'BOTH') and that are outside confirmed surge zones.
    Preserves distinct wheelchair records: 'YES', 'NO', or 'UNRECORDED'.
    Returns tract origin coordinates (tract_lat, tract_lon) and shelter addresses so Google Maps
    can verify real-time driving/walking distance, availability, and physical accessibility.
    
    Args:
        geo_id: 11-digit Census tract ID (e.g., '12071020801').
    
    Returns:
        List of candidate shelters with distance in km, tract_lat, tract_lon, wheelchair_record, and capacity.
    """
    query = f"""
    SELECT 
        s.shelter_id,
        s.shelter_name,
        s.address_1,
        s.city,
        s.evacuation_capacity,
        s.wheelchair_record,
        s.surge_record,
        s.km_straight_line,
        r.lat AS tract_lat,
        r.lon AS tract_lon
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_shelter_options` s
    JOIN `{PROJECT_ID}.{DATASET_ID}.lee_tract_risk` r ON s.tract_geo_id = r.geo_id
    WHERE s.tract_geo_id = @geo_id
    ORDER BY s.km_straight_line ASC
    """
    return _mcp_query(query.replace("@geo_id", _sql_string(geo_id)))

def get_tract_access_state(geo_id: str) -> Dict[str, Any]:
    """Gets the operational access state (A, B, C, or D) for a census tract.
    
    State A: Accessible shelter on record within reach.
    State B: Shelters in reach, but none confirmed accessible; at least one UNRECORDED (Verify-First).
    State C: Shelters in reach, but all recorded NOT accessible.
    State D: No eligible pre-landfall shelter within reach (Transit Gap).
    
    Args:
        geo_id: 11-digit Census tract ID.
        
    Returns:
        Dictionary with access state classification and recommended action.
    """
    query = f"""
    SELECT 
        geo_id,
        stranded_score,
        households_no_vehicle,
        total_reachable_shelters,
        count_yes,
        count_no,
        count_unrecorded,
        access_state,
        action_recommendation
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_access_state`
    WHERE geo_id = @geo_id
    """
    rows = _mcp_query(query.replace("@geo_id", _sql_string(geo_id)))
    return rows[0] if rows else {"error": f"Tract {geo_id} not found."}

def get_county_power_dependence() -> Dict[str, Any]:
    """Gets HHS emPOWER medical power-dependence statistics for Lee County, FL.
    
    Includes counts of residents relying on electricity for life-sustaining medical devices,
    dialysis, and oxygen.
    
    Returns:
        Dictionary with electricity-dependent counts for Lee County.
    """
    query = f"""
    SELECT 
        county_name,
        fips_code,
        power_dependent_residents,
        dialysis_dependent,
        oxygen_dependent
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_county_power_dependence`
    WHERE fips_code = '12071'
    """
    rows = _mcp_query(query)
    return rows[0] if rows else {"error": "Lee County power data not found."}

def run_equity_audit() -> List[Dict[str, Any]]:
    """Performs an equity audit by comparing top stranded tracts against socioeconomic indicators.
    
    Verifies income, poverty, and language metrics across prioritized tracts to ensure fair allocation.
    
    Returns:
        List of audit rows across top vulnerable tracts.
    """
    query = f"""
    SELECT 
        geo_id,
        stranded_score,
        access_state,
        households_no_vehicle,
        median_income,
        ROUND(poverty_rate, 1) AS poverty_rate,
        ROUND(pct_limited_english, 1) AS pct_limited_english,
        svi_socioeconomic
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_equity_audit`
    ORDER BY stranded_score DESC
    LIMIT 10
    """
    return _mcp_query(query)


def find_outreach_candidates(
    geo_id=None,
    capabilities=None,
    top_n: int = 10,
) -> List[Dict[str, Any]]:
    """Finds trusted Lee County organizations to contact about peer check-ins.

    This returns a curated seed list, not a live claim that an organization is available,
    activated, or willing to deploy. Use the returned service area and source URL to guide a
    follow-up Google Search grounding query near the selected tract. Search-discovered results
    must be independently verified before outreach or assignment.

    Args:
        geo_id: Optional Lee County tract ID. The result includes its risk/access context.
        capabilities: Optional tags such as CERT, transportation, senior_services,
            disability_services, language_access, or volunteer_coordination.
        top_n: Maximum number of seed organizations to return.
    """
    target_cte = f"""
    target AS (
      SELECT r.geo_id, r.lat, r.lon, r.stranded_score,
             a.access_state, a.action_recommendation
      FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_risk` r
      LEFT JOIN `{PROJECT_ID}.{DATASET_ID}.lee_tract_access_state` a USING (geo_id)
      WHERE (@geo_id IS NULL OR r.geo_id = @geo_id)
      QUALIFY ROW_NUMBER() OVER (ORDER BY r.stranded_score DESC) = 1
    )
    """
    capability_clause = ""
    geo_literal = "NULL" if geo_id is None else _sql_string(geo_id)
    if capabilities:
        capability_values = ", ".join(_sql_string(tag) for tag in capabilities)
        capability_clause = f"AND EXISTS (SELECT 1 FROM UNNEST(o.capability_tags) tag WHERE tag IN ({capability_values}))"
    query = f"""
    WITH {target_cte}
    SELECT
      o.*,
      t.geo_id AS target_geo_id,
      t.lat AS target_lat,
      t.lon AS target_lon,
      t.stranded_score,
      t.access_state,
      t.action_recommendation,
      'countywide seed; verify proximity and activation with Google Search/Maps' AS proximity_status,
      CONCAT(
        'Find ', ARRAY_TO_STRING(o.capability_tags, ' or '),
        ' organizations near tract ', COALESCE(t.geo_id, 'the highest-priority tract'),
        ' in Lee County, Florida'
      ) AS suggested_search
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_outreach_organizations` o
    CROSS JOIN target t
    WHERE 1 = 1 {capability_clause}
    ORDER BY o.seed_priority DESC
    LIMIT @top_n
    """
    query = query.replace("@geo_id", geo_literal).replace("@top_n", str(_sql_int(top_n)))
    return _mcp_query(query)


def find_tract_by_coordinates(latitude: float, longitude: float) -> Dict[str, Any]:
    """Finds the Lee County census tract corresponding to the specified geographic coordinates.
    
    Uses BigQuery ST_DISTANCE against tract centroids in `lee_tract_risk` to find the enclosing or nearest tract.
    
    Args:
        latitude: Latitude coordinate of the resident (e.g. 26.6916).
        longitude: Longitude coordinate of the resident (e.g. -81.9078).
        
    Returns:
        Dict with geo_id, stranded_score, total_pop, demographics, tract coordinates, and distance_to_tract_centroid_m.
    """
    query = f"""
    SELECT 
        geo_id,
        stranded_score,
        total_pop,
        households_no_vehicle,
        ROUND(pct_no_vehicle, 1) as pct_no_vehicle,
        ROUND(pct_age_65_plus, 1) as pct_age_65_plus,
        ROUND(pct_disability, 1) as pct_disability,
        ROUND(pct_mobile_homes, 1) as pct_mobile_homes,
        lat as tract_lat,
        lon as tract_lon,
        ROUND(ST_DISTANCE(point, ST_GEOGPOINT(@lon, @lat)), 1) AS distance_to_tract_centroid_m
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_risk`
    ORDER BY distance_to_tract_centroid_m ASC
    LIMIT 1
    """
    query = query.replace("@lat", str(float(latitude))).replace("@lon", str(float(longitude)))
    results = _mcp_query(query)
    return results[0] if results else {}

