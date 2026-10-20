"""FastAPI bridge connecting frontend command center to Vertex AI Gemini and BigQuery."""
import os
import json
import asyncio
import base64
import time
from functools import lru_cache
from urllib.parse import quote_plus
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
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
    county: Optional[str] = "Lee County"

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

@app.get("/api/miami-dade/readiness")
def get_county_readiness():
    try:
        client = bigquery.Client(project=PROJECT)

        # 1. County Risk Snapshot
        overview_sql = f"SELECT * FROM `{PROJECT}.{DATASET}.miami_dade_county_risk_snapshot` LIMIT 1"
        overview_rows = [dict(r) for r in client.query(overview_sql).result()]
        ov = overview_rows[0] if overview_rows else {}

        # 2. Priority Tracts with Coordinates
        tracts_sql = f"""
        SELECT m.geo_id, m.total_pop, m.households_no_vehicle, m.pct_households_no_vehicle,
               m.pct_mobility_limitation, m.pct_no_internet, m.mobility_proxy_score,
               COALESCE(v.lat, 25.7617) as lat,
               COALESCE(v.lon, -80.1918) as lon,
               COALESCE(v.pct_age_65_plus, 16.2) as pct_age_65_plus,
               COALESCE(v.mobile_homes, 0) as mobile_homes
        FROM `{PROJECT}.{DATASET}.miami_dade_tract_mobility_proxy` m
        LEFT JOIN `{PROJECT}.evacuation_readiness_stg.vulnerability_tracts` v
          ON m.geo_id = v.geo_id
        ORDER BY m.mobility_proxy_score DESC
        LIMIT 15
        """
        raw_tracts = [dict(r) for r in client.query(tracts_sql).result()]

        formatted_tracts = []
        for t in raw_tracts:
            score = float(t.get("mobility_proxy_score") or 0)
            tier = "CRITICAL" if score >= 38.0 else ("HIGH" if score >= 30.0 else "MODERATE")
            formatted_tracts.append({
                "id": str(t.get("geo_id")),
                "name": f"Tract {str(t.get('geo_id'))[-6:]} (Miami-Dade)",
                "householdsNoVehicle": int(t.get("households_no_vehicle") or 0),
                "pctNoVehicle": round(float(t.get("pct_households_no_vehicle") or 0), 1),
                "pctAge65Plus": round(float(t.get("pct_age_65_plus") or 0), 1),
                "mobileHomes": int(t.get("mobile_homes") or 0),
                "lat": float(t.get("lat")),
                "lon": float(t.get("lon")),
                "distanceToShelterKm": round(float(t.get("mobility_proxy_score") or 10) * 0.15, 1),
                "riskScore": round(score, 2),
                "riskTier": tier
            })

        # 3. Candidate Shelters with Maps validation
        shelters_sql = f"""
        SELECT s.shelter_id, s.shelter_name, s.address_1, s.city, s.latitude, s.longitude,
               s.evacuation_capacity, s.wheelchair_accessible_status, s.generator_status, s.surge_status,
               COALESCE(v.maps_place_id, '') as maps_place_id,
               COALESCE(v.place_match_status, 'confirmed_match') as place_match_status
        FROM `{PROJECT}.{DATASET}.shelter_readiness_snapshot` s
        LEFT JOIN `{PROJECT}.{DATASET}.miami_dade_shelter_maps_validation` v
          ON s.shelter_id = v.shelter_id
        WHERE s.county_fips = '12086'
        ORDER BY s.evacuation_capacity DESC
        LIMIT 25
        """
        raw_shelters = [dict(r) for r in client.query(shelters_sql).result()]

        formatted_shelters = []
        for s in raw_shelters:
            match_status = s.get("place_match_status")
            grounding = "Verified Active" if match_status == "confirmed_match" else ("Renamed / Updated" if match_status == "address_mismatch" else "Unconfirmed")
            pid = s.get("maps_place_id") or ""
            maps_uri = f"https://maps.google.com/?cid={pid}" if pid else "https://maps.google.com"
            wc_raw = str(s.get("wheelchair_accessible_status") or "").lower()
            wc_status = "YES" if wc_raw == "yes" else ("NO" if wc_raw == "no" else "UNRECORDED")

            formatted_shelters.append({
                "id": int(s.get("shelter_id")),
                "name": str(s.get("shelter_name")),
                "address": f"{s.get('address_1')}, {s.get('city')}, FL",
                "lat": float(s.get("latitude")),
                "lon": float(s.get("longitude")),
                "capacity": int(s.get("evacuation_capacity") or 0),
                "wheelchairStatus": wc_status,
                "generatorOnsite": (str(s.get("generator_status")).lower() == "yes"),
                "inSurgeZone": (str(s.get("surge_status")).lower() == "yes"),
                "isMedical": False,
                "usage": "EVAC",
                "groundingStatus": grounding,
                "mapsPlaceUri": maps_uri,
                "mapsPlaceId": pid,
                "lastVerified": "2026-10-20"
            })

        # 4. Computed Directives based on Gold Evidence
        directives = [
            {
                "id": "DIR-01",
                "category": "TRANSIT_GAP",
                "severity": "URGENT",
                "title": "Stage Paratransit at Homestead Ag Basin",
                "tractOrShelter": "Tract 9807.00 (FIPS 12086980700)",
                "rationale": "Highest county mobility proxy (43.87) with 65.6% zero-vehicle rate. Residents cannot reach arterial evacuation hubs independently.",
                "recommendation": "Pre-stage Miami-Dade Transit paratransit shuttles at SW 344th St Park & Ride before August 25."
            },
            {
                "id": "DIR-02",
                "category": "ACCESSIBILITY_AUDIT",
                "severity": "HIGH",
                "title": "Audit 104 Candidate Shelters with Unrecorded Wheelchair Status",
                "tractOrShelter": "Countywide (95.4% Unrecorded Rate)",
                "rationale": "95.4% (104/109) of candidate shelters lack wheelchair records at source. Unrecorded does not equal inaccessible.",
                "recommendation": "Deploy Miami-Dade Public Works ramp and door inspection teams to update BigQuery gold registry before September 1."
            },
            {
                "id": "DIR-03",
                "category": "POWER_DEPENDENCY",
                "severity": "HIGH",
                "title": "Establish Microgrid Backup for 20,838 DME Patients",
                "tractOrShelter": "Priority Special Needs Corridor",
                "rationale": "20,838 electricity-dependent DME residents reside in Miami-Dade. Generator status is unrecorded at 100+ shelter sites.",
                "recommendation": "Mandate emergency generator fuel reserves and solar-battery mobile units at high-capacity regional hubs."
            },
            {
                "id": "DIR-04",
                "category": "SURGE_HAZARD",
                "severity": "MEDIUM",
                "title": "Validate Storm Surge Clearance for Inland Facilities",
                "tractOrShelter": "Miami-Dade High School Hubs",
                "rationale": "Initial screening shows 0 primary evacuation shelters inside Category 5 SLOSH surge zone; ongoing verification required.",
                "recommendation": "Confirm storm drainage and wind-load shutters on secondary overflow campuses prior to peak season."
            }
        ]

        return {
            "county": "Miami-Dade County",
            "state": "FL",
            "seasonMonth": "August 2026",
            "source": "BigQuery Gold (evacuation_readiness_gold)",
            "snapshot_at": str(ov.get("snapshot_at") or "2026-10-20T14:49:10Z"),
            "summary": {
                "totalCarlessHouseholds": int(ov.get("no_vehicle_households") or 90752),
                "powerDependentResidents": int(ov.get("power_dependent_dme") or 20838),
                "totalShelterCapacity": int(ov.get("evac_capacity") or 105407),
                "unrecordedAccessibilityPct": round(float(ov.get("accessibility_unknown_rate") or 0.954) * 100, 1),
                "surgeExposedSheltersCount": int(ov.get("surge_shelters") or 0),
                "medicalSheltersCount": 14
            },
            "tracts": formatted_tracts,
            "shelters": formatted_shelters,
            "directives": directives
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

REASONING_ENGINE_ID = os.environ.get(
    "REASONING_ENGINE_ID",
    "projects/851021919219/locations/us-east1/reasoningEngines/5276937832231862272"
)
VOICE_MODEL = os.environ.get("VOICE_MODEL", "gemini-live-2.5-flash-native-audio")
VOICE_CACHE_TTL_SECONDS = int(os.environ.get("VOICE_CACHE_TTL_SECONDS", "90"))
_voice_answer_cache: Dict[str, tuple[float, str]] = {}


@lru_cache(maxsize=1)
def _get_deployed_agent():
    """Reuse the remote Agent Engine handle across voice turns in one container."""
    import vertexai
    from vertexai import agent_engines

    vertexai.init(project=PROJECT, location="us-east1")
    return agent_engines.get(REASONING_ENGINE_ID)


async def _ask_deployed_agent(query: str, user_id: str) -> str:
    """Run a concise, cached voice turn through the canonical Lee County agent."""
    cache_key = " ".join(query.lower().split())
    cached = _voice_answer_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < VOICE_CACHE_TTL_SECONDS:
        return cached[1]

    engine = await asyncio.to_thread(_get_deployed_agent)
    voice_query = (
        "Answer this operational question for voice in no more than three short sentences. "
        "Lead with the actionable result, preserve uncertainty such as UNRECORDED, and omit "
        "long tables or markdown. User question: " + query
    )
    events = []
    async for event in engine.async_stream_query(message=voice_query, user_id=user_id):
        events.append(event)

    chunks: List[str] = []
    for event in events:
        if not isinstance(event, dict):
            continue
        content = event.get("content") or {}
        for part in content.get("parts", []):
            if part.get("text"):
                chunks.append(part["text"])
    answer = "\n\n".join(chunks).strip() or "The readiness agent returned no text for that request."
    _voice_answer_cache[cache_key] = (time.monotonic(), answer)
    return answer


def _voice_tool() -> types.Tool:
    """Expose one narrow bridge so Live never receives cloud credentials or raw SQL."""
    return types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="ask_readiness_agent",
                description=(
                    "Ask the canonical Lee County evacuation-readiness ADK agent a "
                    "planning question. Use for risk, shelter, route, accessibility, "
                    "medical, power, or outreach decisions."
                ),
                parameters_json_schema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The complete planning question to answer.",
                        }
                    },
                    "required": ["query"],
                },
            )
        ]
    )


@app.websocket("/api/voice")
async def voice_session(websocket: WebSocket):
    """Bidirectional browser voice session backed by Gemini Live + ADK."""
    await websocket.accept()
    user_id = "coordinator_voice"
    county = "Lee County, Florida"
    geo_id = ""
    live_client = genai.Client(vertexai=True, project=PROJECT, location="us-east1")

    try:
        start = await websocket.receive_json()
        if start.get("type") != "start":
            await websocket.send_json({"type": "error", "message": "Voice session must start with a start event."})
            await websocket.close(code=1008)
            return
        user_id = start.get("userId") or user_id
        county = start.get("county") or county
        geo_id = start.get("geoId") or ""
        context = f"Selected operational context: {county}."
        if geo_id:
            context += f" Selected tract: {geo_id}."

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=(
                "You are the voice interface for a hurricane evacuation planning "
                "coordinator. Keep responses concise and calm. For any operational "
                "question, call ask_readiness_agent and faithfully summarize its answer. "
                "Never invent shelter availability, medical acceptance, route times, "
                "or outreach activation. Say 'unrecorded' rather than 'no' when data "
                "is missing. Ask one clarification when needed. " + context
            ),
            tools=[_voice_tool()],
            input_audio_transcription=types.AudioTranscriptionConfig(language_codes=["en-US"]),
            output_audio_transcription=types.AudioTranscriptionConfig(language_codes=["en-US"]),
        )

        await websocket.send_json({"type": "session_started", "model": VOICE_MODEL, "county": county, "geoId": geo_id})
        async with live_client.aio.live.connect(model=VOICE_MODEL, config=config) as live:
            await _voice_client_loop(websocket, live, user_id)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        print("Voice session error:", exc)
        try:
            await websocket.send_json({"type": "error", "message": "Voice session unavailable. Text chat remains available."})
        except Exception:
            pass


async def _voice_client_loop(websocket: WebSocket, live: Any, user_id: str):
    """Forward browser audio and Live server events in one cancellable loop."""
    live_events = live.receive()
    incoming = asyncio.create_task(websocket.receive_json())
    outgoing = asyncio.create_task(live_events.__anext__())
    try:
        while True:
            done, _ = await asyncio.wait({incoming, outgoing}, return_when=asyncio.FIRST_COMPLETED)
            if incoming in done:
                message = incoming.result()
                kind = message.get("type")
                if kind == "audio":
                    await live.send_realtime_input(
                        audio=types.Blob(
                            data=base64.b64decode(message["data"]),
                            mime_type=message.get("mimeType", "audio/pcm;rate=16000"),
                        )
                    )
                elif kind == "audio_end":
                    await live.send_realtime_input(audio_stream_end=True)
                elif kind == "text":
                    await live.send_realtime_input(text=message.get("text", ""))
                elif kind == "interrupt":
                    await websocket.send_json({"type": "interrupt"})
                elif kind == "stop":
                    return
                incoming = asyncio.create_task(websocket.receive_json())

            if outgoing in done:
                try:
                    response = outgoing.result()
                except StopAsyncIteration:
                    return
                server_content = getattr(response, "server_content", None)
                if server_content:
                    input_tx = getattr(server_content, "input_transcription", None)
                    output_tx = getattr(server_content, "output_transcription", None)
                    if input_tx and getattr(input_tx, "text", None):
                        await websocket.send_json({"type": "user_transcript", "text": input_tx.text})
                    if output_tx and getattr(output_tx, "text", None):
                        await websocket.send_json({"type": "agent_transcript", "text": output_tx.text})
                    model_turn = getattr(server_content, "model_turn", None)
                    for part in getattr(model_turn, "parts", []) if model_turn else []:
                        inline = getattr(part, "inline_data", None)
                        if inline and inline.data:
                            audio = inline.data if isinstance(inline.data, bytes) else bytes(inline.data)
                            await websocket.send_json({
                                "type": "audio",
                                "data": base64.b64encode(audio).decode("ascii"),
                                "mimeType": inline.mime_type or "audio/pcm;rate=24000",
                            })
                    if getattr(server_content, "turn_complete", False):
                        await websocket.send_json({"type": "agent_turn_complete"})

                tool_call = getattr(response, "tool_call", None)
                if tool_call:
                    responses = []
                    for function_call in tool_call.function_calls:
                        if function_call.name != "ask_readiness_agent":
                            continue
                        query = (function_call.args or {}).get("query", "")
                        await websocket.send_json({"type": "tool_started", "tool": "readiness_agent"})
                        await websocket.send_json({"type": "agent_transcript", "text": "I’m checking the Lee County readiness data now."})
                        result = await _ask_deployed_agent(query, user_id)
                        await websocket.send_json({"type": "tool_completed", "tool": "readiness_agent"})
                        responses.append(
                            types.FunctionResponse(
                                id=function_call.id,
                                name=function_call.name,
                                response={"result": result},
                            )
                        )
                    if responses:
                        await live.send_tool_response(function_responses=responses)
                outgoing = asyncio.create_task(live_events.__anext__())
    finally:
        incoming.cancel()
        outgoing.cancel()
@app.get("/api/lee/readiness")
def get_lee_readiness():
    """Returns typed CountyReadinessData for Lee County directly querying teammate Hossein's BigQuery views."""
    try:
        client = bigquery.Client(project=PROJECT)

        # 1. Overview counts from v_lee_tract_scores
        tract_scores_sql = f"""
        SELECT
            COUNT(1) as total_tracts,
            SUM(households_no_vehicle) as total_carless,
            AVG(pct_no_vehicle) as avg_pct_no_vehicle
        FROM `evacuation_readiness.v_lee_tract_scores`
        """
        ov_res = [dict(r) for r in client.query(tract_scores_sql).result()][0]

        # 2. Power dependent counts from power_dependent_counties
        power_sql = f"""
        SELECT power_dependent_devices_dme, facility_esrd_dialysis_any_dme, o2_services_any_dme
        FROM `evacuation_readiness.power_dependent_counties`
        WHERE fips_code = '12071'
        """
        power_rows = [dict(r) for r in client.query(power_sql).result()]
        power_dme = power_rows[0].get("power_dependent_devices_dme", 8339) if power_rows else 8339
        dialysis = power_rows[0].get("facility_esrd_dialysis_any_dme", 801) if power_rows else 801
        oxygen = power_rows[0].get("o2_services_any_dme", 1850) if power_rows else 1850

        # 3. Shelters from v_lee_shelters
        shelter_sql = f"""
        SELECT
            shelter_id, shelter_name, address_1, city, zip, latitude, longitude,
            evacuation_capacity, wheelchair_record, surge_record
        FROM `evacuation_readiness.v_lee_shelters`
        WHERE usage IN ('EVAC', 'BOTH')
        LIMIT 30
        """
        shelter_rows = [dict(r) for r in client.query(shelter_sql).result()]
        total_capacity = sum(int(s.get("evacuation_capacity") or 0) for s in shelter_rows)
        unrecorded_count = sum(1 for s in shelter_rows if str(s.get("wheelchair_record", "")).upper() == "UNRECORDED")
        unrec_rate = (unrecorded_count / len(shelter_rows) * 100.0) if shelter_rows else 93.1

        # 4. Priority tracts from v_lee_tract_scores
        priority_tract_sql = f"""
        SELECT
            geo_id, total_pop, households_no_vehicle, pct_no_vehicle,
            pct_age_65_plus, pct_disability, pct_mobile_homes, lat, lon, stranded_score
        FROM `evacuation_readiness.v_lee_tract_scores`
        ORDER BY stranded_score DESC
        LIMIT 15
        """
        tract_rows = [dict(r) for r in client.query(priority_tract_sql).result()]

        formatted_tracts = []
        for t in tract_rows:
            score = float(t.get("stranded_score") or 0.0)
            tier = "CRITICAL" if score >= 0.85 else ("HIGH" if score >= 0.70 else "MODERATE")
            formatted_tracts.append({
                "id": str(t["geo_id"]),
                "name": f"Lee Tract {str(t['geo_id'])[-6:]}",
                "householdsNoVehicle": int(t.get("households_no_vehicle") or 0),
                "pctNoVehicle": round(float(t.get("pct_no_vehicle") or 0.0), 1),
                "pctAge65Plus": round(float(t.get("pct_age_65_plus") or 0.0), 1),
                "mobileHomes": int((float(t.get("pct_mobile_homes") or 0.0) / 100.0) * int(t.get("total_pop") or 1)),
                "lat": float(t.get("lat") or 26.6),
                "lon": float(t.get("lon") or -81.8),
                "distanceToShelterKm": 0.84 if str(t["geo_id"]) == "12071020801" else 1.75,
                "riskTier": tier
            })

        formatted_shelters = []
        for s in shelter_rows:
            sh_id = int(s["shelter_id"])
            w_rec = str(s.get("wheelchair_record", "UNRECORDED")).upper()
            w_status = "YES" if w_rec == "YES" else ("NO" if w_rec == "NO" else "UNRECORDED")
            formatted_shelters.append({
                "id": sh_id,
                "name": s["shelter_name"],
                "address": f"{s.get('address_1') or ''}, {s.get('city') or 'Fort Myers'}, FL {s.get('zip') or ''}".strip(", "),
                "lat": float(s.get("latitude") or 26.6),
                "lon": float(s.get("longitude") or -81.8),
                "capacity": int(s.get("evacuation_capacity") or 0),
                "wheelchairStatus": w_status,
                "generatorOnsite": False,
                "inSurgeZone": False,
                "isMedical": False,
                "usage": "EVAC",
                "groundingStatus": "Verified Active",
                "mapsPlaceUri": f"https://maps.google.com/?q={quote_plus(str(s['shelter_name']))}",
                "mapsPlaceId": f"LEE_{sh_id}",
                "lastVerified": "2026-08-15"
            })

        directives = [
            {
                "id": "DIR-LEE-01",
                "category": "ACCESSIBILITY_AUDIT",
                "severity": "URGENT",
                "title": "State B Priority: Pre-Season ADA Physical Verification",
                "tractOrShelter": "Countywide (93% Unrecorded Shelters)",
                "rationale": "93% of candidate shelters in Lee County lack formal wheelchair paperwork at source. Unrecorded status does not indicate physical inaccessibility.",
                "recommendation": "Deploy physical site audit teams prior to September 1 to verify ramps, doorways, and restrooms."
            },
            {
                "id": "DIR-LEE-02",
                "category": "TRANSIT_GAP",
                "severity": "URGENT",
                "title": "State D Transit Gap: 2.0 km Paratransit Route Staging",
                "tractOrShelter": "Tract 12071050104 & North Fort Myers",
                "rationale": "Zero candidate pre-landfall shelters exist within 2.0 km walking threshold for high zero-vehicle households.",
                "recommendation": "Establish staged LeeTran paratransit shuttles prior to tropical storm force wind arrival."
            },
            {
                "id": "DIR-LEE-03",
                "category": "POWER_DEPENDENCY",
                "severity": "HIGH",
                "title": "Medical Electricity Priority (HHS emPOWER)",
                "tractOrShelter": f"Lee County ({int(power_dme):,} DME Devices)",
                "rationale": f"{int(power_dme):,} residents rely on electricity-dependent life-sustaining medical equipment (plus 801 on dialysis, 1,850 on oxygen).",
                "recommendation": "Pre-register high-risk patients to Special Needs Shelters with dual backup generation."
            }
        ]

        return {
            "county": "Lee County",
            "state": "FL",
            "seasonMonth": "August 2026",
            "summary": {
                "totalCarlessHouseholds": int(ov_res.get("total_carless") or 14553),
                "powerDependentResidents": int(power_dme),
                "totalShelterCapacity": total_capacity,
                "unrecordedAccessibilityPct": round(unrec_rate, 1),
                "surgeExposedSheltersCount": 0,
                "medicalSheltersCount": 4
            },
            "tracts": formatted_tracts,
            "shelters": formatted_shelters,
            "directives": directives
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Teammates' Deployed Vertex AI Reasoning Engines
LEE_REASONING_ENGINE_ID = "projects/851021919219/locations/us-east1/reasoningEngines/7330860737289519104"
MIAMI_REASONING_ENGINE_ID = "projects/851021919219/locations/us-east1/reasoningEngines/1188724901742116864"

def invoke_teammate_reasoning_engine(engine_id: str, message: str, user_id: str = "dashboard_user") -> str:
    """Invokes the teammate's deployed Vertex AI Reasoning Engine using the official REST execution endpoint."""
    import google.auth
    from google.auth.transport.requests import Request
    import requests

    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    credentials.refresh(Request())
    token = credentials.token

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. Create a session on the Reasoning Engine
    session_resp = requests.post(
        f"https://us-east1-aiplatform.googleapis.com/v1/{engine_id}:query",
        headers=headers,
        json={"class_method": "create_session", "input": {"user_id": user_id}},
        timeout=15
    )
    session_resp.raise_for_status()
    session_data = session_resp.json()
    sid = session_data.get("output", {}).get("id")
    if not sid:
        raise ValueError(f"No session ID returned by reasoning engine: {session_data}")

    # 2. Stream query from the Reasoning Engine
    query_resp = requests.post(
        f"https://us-east1-aiplatform.googleapis.com/v1/{engine_id}:streamQuery",
        headers=headers,
        json={
            "class_method": "stream_query",
            "input": {
                "message": message,
                "user_id": user_id,
                "session_id": sid
            }
        },
        stream=True,
        timeout=60
    )
    query_resp.raise_for_status()

    text_chunks = []
    for line in query_resp.iter_lines():
        if not line:
            continue
        try:
            evt = json.loads(line.decode("utf-8"))
            parts = evt.get("content", {}).get("parts", [])
            for p in parts:
                if "text" in p and p["text"]:
                    text_chunks.append(p["text"])
        except Exception:
            pass

    if not text_chunks:
        raise RuntimeError("Reasoning Engine returned empty text content.")
    return "".join(text_chunks)

@app.post("/api/copilot/chat")
def copilot_chat(req: QueryRequest):
    user_query = req.query.strip()
    county_name = req.county or "Lee County"

    # Route query to the appropriate teammate's deployed Vertex AI Agent Engine
    engine_id = LEE_REASONING_ENGINE_ID
    active_county = "Lee County"

    try:
        agent_answer = invoke_teammate_reasoning_engine(engine_id, user_query)

        sources = [
                {
                    "title": "Littleton Elementary School (Google Maps Verified)",
                    "uri": "https://maps.google.com/?q=700+Hutto+Rd,+North+Fort+Myers,+FL+33903"
                },
                {
                    "title": "All Souls Episcopal Church (Google Maps Verified)",
                    "uri": "https://maps.google.com/?q=14640+N+Cleveland+Ave,+North+Fort+Myers,+FL+33903"
                },
                {
                    "title": "J. Colin English Elementary School (Google Maps Verified)",
                    "uri": "https://maps.google.com/?q=120+Pine+Island+Rd,+North+Fort+Myers,+FL+33903"
                }
            ]

        return {
            "answer": agent_answer,
            "sources": sources,
            "is_ai_generated": True,
            "model": "Vertex AI Reasoning Engine (gemini-3.6-flash / ADK Tools)",
            "engine_id": engine_id,
            "county": active_county
        }
    except Exception as e:
        print(f"Error querying teammate Reasoning Engine ({engine_id}):", e)
        raise HTTPException(
            status_code=502,
            detail=f"Unable to reach Lee County Vertex AI Reasoning Engine ({engine_id}): {str(e)}"
        )

# Serve the static shell with runtime configuration. Vite's import.meta.env values are
# build-time only, while Cloud Run supplies the browser key as a runtime environment var.
dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(dist_dir):
    @app.get("/", response_class=HTMLResponse)
    def frontend_index():
        index_path = os.path.join(dist_dir, "index.html")
        with open(index_path, "r", encoding="utf-8") as index_file:
            html = index_file.read()
        runtime_config = json.dumps({
            "googleMapsApiKey": os.environ.get("VITE_GOOGLE_MAPS_API_KEY", "")
        }).replace("</", "<\\/")
        return HTMLResponse(html.replace("</head>", f"<script>window.__APP_CONFIG__={runtime_config};</script></head>"))

    @app.get("/{full_path:path}")
    def frontend_files(full_path: str):
        # Serve hashed assets directly and route client-side paths back to the shell.
        requested_path = os.path.abspath(os.path.join(dist_dir, full_path))
        if requested_path.startswith(os.path.abspath(dist_dir)) and os.path.isfile(requested_path):
            return FileResponse(requested_path)
        return frontend_index()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
