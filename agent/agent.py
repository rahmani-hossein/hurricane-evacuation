"""Core Florida Evacuation Readiness Agent definition using Google ADK and Gemini 3.x."""

import asyncio
import os
import sys
from typing import Optional

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_maps_grounding
from google.genai import types

from agent.prompts import SYSTEM_INSTRUCTION
from agent.tools import (
    get_candidate_shelters,
    get_county_power_dependence,
    get_tract_access_state,
    rank_stranded_tracts,
    run_equity_audit,
)

MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")


def create_evacuation_agent() -> Agent:
    return Agent(
        name="florida_evacuation_readiness_agent",
        model=MODEL_NAME,
        instruction=SYSTEM_INSTRUCTION,
        tools=[
            rank_stranded_tracts,
            get_candidate_shelters,
            get_tract_access_state,
            get_county_power_dependence,
            run_equity_audit,
            google_maps_grounding,
        ],
    )


root_agent = create_evacuation_agent()


class EvacuationAgentRunner:
    def __init__(self, agent: Optional[Agent] = None, app_name: str = "evacuation_readiness_app"):
        self.agent = agent or create_evacuation_agent()
        self.app_name = app_name
        self.session_service = InMemorySessionService()
        self.runner = Runner(app_name=self.app_name, agent=self.agent, session_service=self.session_service)

    def query(self, user_message: str, user_id: str = "emergency_manager") -> str:
        session = asyncio.run(self.session_service.create_session(app_name=self.app_name, user_id=user_id))
        content = types.Content(parts=[types.Part.from_text(text=user_message)])
        events = list(self.runner.run(user_id=user_id, session_id=session.id, new_message=content))
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
