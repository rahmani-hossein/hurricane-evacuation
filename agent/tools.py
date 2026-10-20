"""Custom analytical tools for the Florida Evacuation Readiness Agent.

These tools query the BigQuery views in `evacuation_readiness` scoped to Lee County, FL (12071).
"""

from typing import List, Dict, Any
from google.cloud import bigquery
import os

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
DATASET_ID = "evacuation_readiness"

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
        ROUND(pct_no_vehicle * 100, 1) AS pct_no_vehicle,
        ROUND(pct_age_65_plus * 100, 1) AS pct_age_65_plus,
        ROUND(pct_disability * 100, 1) AS pct_disability,
        ROUND(pct_mobile_homes * 100, 1) AS pct_mobile_homes,
        stranded_score,
        reachable_dist_m
    FROM `{PROJECT_ID}.{DATASET_ID}.v_lee_tract_scores`
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
    FROM `{PROJECT_ID}.{DATASET_ID}.v_lee_tract_shelter_pairs`
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
    FROM `{PROJECT_ID}.{DATASET_ID}.v_lee_tract_access_state`
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
        name AS county_name,
        fips_code,
        power_dependent_devices_dme AS power_dependent_residents,
        facility_esrd_dialysis_any_dme AS dialysis_dependent,
        o2_services_any_dme AS oxygen_dependent
    FROM `{PROJECT_ID}.{DATASET_ID}.power_dependent_counties`
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
        ROUND(poverty_rate * 100, 1) AS poverty_rate,
        ROUND(pct_limited_english * 100, 1) AS pct_limited_english,
        svi_socioeconomic
    FROM `{PROJECT_ID}.{DATASET_ID}.v_lee_equity_audit`
    ORDER BY stranded_score DESC
    LIMIT 10
    """
    job = client.query(query)
    return [dict(row.items()) for row in job.result()]
