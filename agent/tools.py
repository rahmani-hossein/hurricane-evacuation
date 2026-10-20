"""Custom analytical tools for the Florida Evacuation Readiness Agent.

These tools query the curated gold views in `evacuation_readiness_gold` scoped to Lee County, FL (12071).
"""

from typing import List, Dict, Any
from google.cloud import bigquery
import os

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET_ID = "evacuation_readiness_gold"

def _get_bq_client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT_ID)

def rank_stranded_tracts(top_n: int = 10) -> List[Dict[str, Any]]:
    """Ranks the census tracts in Lee County whose residents have the highest barrier to self-evacuation.
    
    Computes Stranded Score from vehicle access, age 65+, disability, and mobile home rates.
    
    Args:
        top_n: Number of top vulnerable tracts to return (default: 10).
    
    Returns:
        List of tract records including geo_id, population, stranded_score, and households without vehicle.
    """
    client = _get_bq_client()
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
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("top_n", "INT64", top_n)]
    )
    job = client.query(query, job_config=job_config)
    return [dict(row.items()) for row in job.result()]

def get_candidate_shelters(geo_id: str) -> List[Dict[str, Any]]:
    """Retrieves eligible pre-landfall evacuation shelters within reach for a given census tract.
    
    Only returns shelters where usage IN ('EVAC', 'BOTH') and that are outside confirmed surge zones.
    Preserves distinct wheelchair records: 'YES', 'NO', or 'UNRECORDED'.
    
    Args:
        geo_id: 11-digit Census tract ID (e.g., '12071020801').
    
    Returns:
        List of candidate shelters with distance in km, wheelchair_record, and capacity.
    """
    client = _get_bq_client()
    query = f"""
    SELECT 
        shelter_id,
        shelter_name,
        address_1,
        city,
        evacuation_capacity,
        wheelchair_record,
        surge_record,
        km_straight_line
    FROM `{PROJECT_ID}.{DATASET_ID}.lee_tract_shelter_options`
    WHERE tract_geo_id = @geo_id
    ORDER BY km_straight_line ASC
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("geo_id", "STRING", geo_id)]
    )
    job = client.query(query, job_config=job_config)
    return [dict(row.items()) for row in job.result()]

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
    client = _get_bq_client()
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
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("geo_id", "STRING", geo_id)]
    )
    job = client.query(query, job_config=job_config)
    rows = [dict(row.items()) for row in job.result()]
    return rows[0] if rows else {"error": f"Tract {geo_id} not found."}

def get_county_power_dependence() -> Dict[str, Any]:
    """Gets HHS emPOWER medical power-dependence statistics for Lee County, FL.
    
    Includes counts of residents relying on electricity for life-sustaining medical devices,
    dialysis, and oxygen.
    
    Returns:
        Dictionary with electricity-dependent counts for Lee County.
    """
    client = _get_bq_client()
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
    job = client.query(query)
    rows = [dict(row.items()) for row in job.result()]
    return rows[0] if rows else {"error": "Lee County power data not found."}

def run_equity_audit() -> List[Dict[str, Any]]:
    """Performs an equity audit by comparing top stranded tracts against socioeconomic indicators.
    
    Verifies income, poverty, and language metrics across prioritized tracts to ensure fair allocation.
    
    Returns:
        List of audit rows across top vulnerable tracts.
    """
    client = _get_bq_client()
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
    job = client.query(query)
    return [dict(row.items()) for row in job.result()]


def find_outreach_candidates(
    geo_id: str | None = None,
    capabilities: List[str] | None = None,
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
    client = _get_bq_client()
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
    params = [bigquery.ScalarQueryParameter("geo_id", "STRING", geo_id)]
    if capabilities:
        capability_clause = "AND EXISTS (SELECT 1 FROM UNNEST(o.capability_tags) tag WHERE tag IN UNNEST(@capabilities))"
        params.append(bigquery.ArrayQueryParameter("capabilities", "STRING", capabilities))
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
    params.append(bigquery.ScalarQueryParameter("top_n", "INT64", top_n))
    job = client.query(query, bigquery.QueryJobConfig(query_parameters=params))
    return [dict(row.items()) for row in job.result()]
