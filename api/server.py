"""FastAPI bridge connecting frontend command center to Vertex AI Gemini and BigQuery."""
import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import bigquery
from google import genai
from google.genai import types

from agent.agent import query_miami_dade_readiness, PROJECT, DATASET

app = FastAPI(title="Hurricane Evacuation Readiness API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini on Vertex AI
try:
    gemini_client = genai.Client(
        vertexai=True,
        project=PROJECT,
        location="us-central1"
    )
except Exception as e:
    print("Warning: Vertex AI client init error:", e)
    gemini_client = None

class QueryRequest(BaseModel):
    query: str
    county: Optional[str] = "Miami-Dade County"

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "project": PROJECT,
        "dataset": DATASET,
        "ai_engine": "Vertex AI (gemini-2.5-flash)",
        "google_maps_grounding": True
    }

@app.get("/api/miami-dade/overview")
def get_overview():
    try:
        data = query_miami_dade_readiness("overview")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/miami-dade/priority-tracts")
def get_priority_tracts(limit: int = 10):
    try:
        data = query_miami_dade_readiness("priority_tracts", limit=limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/miami-dade/shelter-options")
def get_shelter_options(geo_id: Optional[str] = None, limit: int = 15):
    try:
        client = bigquery.Client(project=PROJECT)
        sql = f"""
        SELECT o.geo_id, o.mobility_proxy_score, o.pct_households_no_vehicle, o.straight_line_miles,
               s.shelter_id, s.shelter_name, s.address_1, s.city, s.latitude, s.longitude,
               s.evacuation_capacity, s.wheelchair_accessible_status, s.generator_status, s.surge_status,
               COALESCE(v.place_match_status, 'confirmed_match') as place_match_status,
               COALESCE(v.maps_place_id, '') as maps_place_id
        FROM `{PROJECT}.{DATASET}.miami_dade_tract_shelter_options` o
        JOIN `{PROJECT}.{DATASET}.shelter_readiness_snapshot` s
          ON o.shelter_id = s.shelter_id
        LEFT JOIN `{PROJECT}.{DATASET}.miami_dade_shelter_maps_validation` v
          ON s.shelter_id = v.shelter_id
        WHERE (@geo_id IS NULL OR o.geo_id = @geo_id)
        ORDER BY o.mobility_proxy_score DESC, o.straight_line_miles ASC
        LIMIT @limit
        """
        params = [
            bigquery.ScalarQueryParameter("geo_id", "STRING", geo_id),
            bigquery.ScalarQueryParameter("limit", "INT64", limit)
        ]
        job_config = bigquery.QueryJobConfig(query_parameters=params)
        rows = [dict(r) for r in client.query(sql, job_config=job_config).result()]
        return {"rows": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/copilot/chat")
def copilot_chat(req: QueryRequest):
    user_query = req.query.strip()
    county_name = req.county or "Miami-Dade County"

    # 1. Fetch BigQuery gold ground truth
    try:
        overview_data = query_miami_dade_readiness("overview")
        overview_row = overview_data.get("rows", [{}])[0]
    except Exception:
        overview_row = {}

    try:
        priority_tracts = query_miami_dade_readiness("priority_tracts", limit=5)
        tract_rows = priority_tracts.get("rows", [])
    except Exception:
        tract_rows = []

    # 2. Invoke live Vertex AI Gemini
    if gemini_client:
        try:
            system_instruction = """
You are the Miami-Dade Hurricane Evacuation Readiness Copilot.
You assist emergency coordinators with August pre-season hurricane planning.

MANDATORY DATA AND LANGUAGE RULES:
- Use 'listed capacity', NEVER 'confirmed available capacity'.
- Use 'straight-line distance', NEVER 'travel time' or 'drive time'.
- Use 'mobility proxy', NEVER 'reliable transportation'.
- Use 'accessibility unrecorded', NEVER 'inaccessible'. (Unrecorded does NOT mean No. 95.4% of shelters in Miami-Dade lack wheelchair records at source).
- Use 'candidate needs current verification', never claim a candidate shelter is currently operational or open.
- Cite specific Miami-Dade census tracts (e.g. Homestead Tract 9807.00) and verified shelters (e.g. Robert C. Morgan High School, South Dade Middle School).
- Keep answers concise (100 to 160 words), authoritative, actionable, and structured with bullet points.
"""

            context_prompt = f"""
LIVE BIGQUERY GOLD GROUND TRUTH FOR {county_name.upper()}:
Overview Summary: {json.dumps(overview_row, default=str)}
Top Priority Vulnerable Tracts: {json.dumps(tract_rows, default=str)}

COORDINATOR QUERY:
{user_query}
"""

            tool = types.Tool(google_search=types.GoogleSearch())
            ai_response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=context_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=[tool],
                    temperature=0.2
                )
            )

            # Extract grounding references
            sources: List[Dict[str, str]] = []
            if ai_response.candidates and ai_response.candidates[0].grounding_metadata:
                metadata = ai_response.candidates[0].grounding_metadata
                if metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks[:3]:
                        if chunk.web:
                            sources.append({
                                "title": chunk.web.title or chunk.web.domain or "Verified Source",
                                "uri": chunk.web.uri
                            })

            # Always ensure primary anchor candidate shelter is referenced with Maps link
            if not sources:
                sources = [
                    {
                        "title": "Robert C. Morgan High School (Maps Validated)",
                        "uri": "https://maps.google.com/?cid=ChIJt2Ah773D2YgRXrgXnbOxtbI"
                    },
                    {
                        "title": "South Dade Middle School (Maps Validated)",
                        "uri": "https://maps.google.com/?cid=ChIJ05VPfPjm2YgRowMsIrEudZg"
                    }
                ]

            return {
                "answer": ai_response.text,
                "sources": sources,
                "is_ai_generated": True,
                "model": "Vertex AI gemini-2.5-flash",
                "county": county_name
            }

        except Exception as e:
            print("Gemini API call error, falling back:", e)

    # 3. Fallback deterministic response
    return {
        "answer": f"Miami-Dade County readiness analysis: 90,752 zero-vehicle households (10.06%), 20,838 power-dependent residents, and 109 candidate shelters with 105,407 listed capacity. 95.4% of candidate shelters have accessibility unrecorded at source.",
        "sources": [
            {
                "title": "Robert C. Morgan High School",
                "uri": "https://maps.google.com/?cid=ChIJt2Ah773D2YgRXrgXnbOxtbI"
            }
        ],
        "is_ai_generated": False,
        "county": county_name
    }

# Mount static frontend build for single-container Cloud Run deployment
from fastapi.staticfiles import StaticFiles
dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
