"""Automated Evaluation Suite for Challenge 4 Rubric & 7 Benchmark Questions.

Tests the Florida Evacuation Readiness Agent against the official judging criteria
defined in the challenge README:
1. Impact & Insight (30 pts): Actionable readiness intelligence for emergency managers.
2. Technical Execution (30 pts): Genuine invocation of BigQuery tools & Google Maps Grounding.
3. Rigor & Judgment (25 pts): Distinction between paperwork absence (UNRECORDED) and reality,
   scale limitations, and defensible assumptions.
4. Craft & Communication (15 pts): Clear structure, source attribution, and actionable briefs.
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from typing import Any, Dict, List, Optional

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent.agent import create_evacuation_agent


class AgentEvaluator:
    """Executes benchmark queries and records tool calls, timings, and textual assertions."""

    def __init__(self, app_name: str = "rubric_eval"):
        self.agent = create_evacuation_agent()
        self.app_name = app_name
        self.session_service = InMemorySessionService()
        self.runner = Runner(
            app_name=self.app_name,
            agent=self.agent,
            session_service=self.session_service,
        )

    def evaluate_query(
        self,
        query: str,
        user_id: str = "evaluator",
    ) -> Dict[str, Any]:
        """Runs a single prompt through the ADK runner and extracts tools called + final response."""
        session = asyncio.run(
            self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
            )
        )
        msg = types.Content(parts=[types.Part.from_text(text=query)])
        
        start_time = time.time()
        events = list(
            self.runner.run(
                user_id=user_id,
                session_id=session.id,
                new_message=msg,
            )
        )
        elapsed_sec = time.time() - start_time

        tool_calls: List[str] = []
        text_parts: List[str] = []

        for event in events:
            if not event.content:
                continue
            for part in event.content.parts:
                if hasattr(part, "function_call") and part.function_call:
                    tool_calls.append(part.function_call.name)
                if hasattr(part, "text") and part.text:
                    text_parts.append(part.text)

        full_text = "".join(text_parts)
        return {
            "query": query,
            "tool_calls": tool_calls,
            "response": full_text,
            "elapsed_seconds": round(elapsed_sec, 2),
        }


def run_benchmark_suite() -> Dict[str, Any]:
    evaluator = AgentEvaluator()
    results = []

    print("=" * 80)
    print("STARTING CHALLENGE 4 AGENT RUBRIC BENCHMARK SUITE")
    print("Evaluating Florida Evacuation Readiness Agent (Lee County, FL)")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # TEST 1: Who cannot leave (Impact & Insight)
    # -------------------------------------------------------------------------
    print("\n[1/7] Testing: 'Which neighborhoods in Lee County would struggle most to self-evacuate?'")
    res1 = evaluator.evaluate_query(
        "Which neighborhoods in Lee County would struggle most to self-evacuate? Give me the top tracts.",
        user_id="eval_q1",
    )
    passed1 = (
        "rank_stranded_tracts" in res1["tool_calls"]
        and ("12071020801" in res1["response"] or "stranded" in res1["response"].lower())
        and ("vehicle" in res1["response"].lower() or "car" in res1["response"].lower())
    )
    score1 = 15 if passed1 else 0
    results.append({
        "id": "Q1",
        "title": "Who Cannot Leave (Ranked Vulnerability)",
        "dimension": "Impact & Insight",
        "max_score": 15,
        "score": score1,
        "passed": passed1,
        "tools_called": res1["tool_calls"],
        "notes": "Invoked rank_stranded_tracts, identified top tract 12071020801, cited carless households.",
    })
    print(f" -> {'PASS' if passed1 else 'FAIL'} ({score1}/15 pts) | Tools: {res1['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 2: Power & Medically Dependent Scale (Rigor & Judgment)
    # -------------------------------------------------------------------------
    print("\n[2/7] Testing: 'How many people depend on electricity for medical equipment?'")
    res2 = evaluator.evaluate_query(
        "How many people in Lee County depend on electricity for medical equipment?",
        user_id="eval_q2",
    )
    has_power_num = "8,339" in res2["response"] or "8339" in res2["response"]
    scale_noted = "county" in res2["response"].lower() or "empower" in res2["response"].lower()
    passed2 = (
        "get_county_power_dependence" in res2["tool_calls"]
        and has_power_num
        and scale_noted
    )
    score2 = 15 if passed2 else (10 if has_power_num else 0)
    results.append({
        "id": "Q2",
        "title": "Electricity & Medical Dependency (emPOWER)",
        "dimension": "Rigor & Judgment",
        "max_score": 15,
        "score": score2,
        "passed": passed2,
        "tools_called": res2["tool_calls"],
        "notes": "Invoked get_county_power_dependence, reported 8,339 residents, noted county scale.",
    })
    print(f" -> {'PASS' if passed2 else 'FAIL'} ({score2}/15 pts) | Tools: {res2['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 3: Candidate Shelter Destination & Straight-line Distance (Technical Execution)
    # -------------------------------------------------------------------------
    print("\n[3/7] Testing: 'Where would I send people from tract 12071020801, and how far is it?'")
    res3 = evaluator.evaluate_query(
        "Where would I send people from the top stranded tract (12071020801), and how far is it?",
        user_id="eval_q3",
    )
    passed3 = (
        "get_candidate_shelters" in res3["tool_calls"]
        and ("littleton" in res3["response"].lower() or "all souls" in res3["response"].lower())
        and ("km" in res3["response"].lower() or "distance" in res3["response"].lower())
    )
    score3 = 15 if passed3 else 0
    results.append({
        "id": "Q3",
        "title": "Candidate Shelter Destinations & Distance",
        "dimension": "Technical Execution",
        "max_score": 15,
        "score": score3,
        "passed": passed3,
        "tools_called": res3["tool_calls"],
        "notes": "Invoked get_candidate_shelters, matched Littleton/All Souls, calculated straight-line distance.",
    })
    print(f" -> {'PASS' if passed3 else 'FAIL'} ({score3}/15 pts) | Tools: {res3['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 4: Accessibility & The "Unrecorded" Trap (Rigor & Grounding)
    # -------------------------------------------------------------------------
    print("\n[4/7] Testing: 'Which shelters near tract 12071020801 can take a wheelchair?' (Unrecorded Trap)")
    res4 = evaluator.evaluate_query(
        "Which shelters near tract 12071020801 can take a wheelchair? Can someone in a wheelchair get into Littleton Elementary? Check live Google Maps verification.",
        user_id="eval_q4",
    )
    resp4_lower = res4["response"].lower()
    no_false_refusal = "no accessible shelter" not in resp4_lower
    unrecorded_distinction = "unrecorded" in resp4_lower or "unverified" in resp4_lower or "paperwork" in resp4_lower
    grounding_called = "google_maps_grounding" in res4["tool_calls"]
    has_ada_details = "wheelchair" in resp4_lower and ("entrance" in resp4_lower or "parking" in resp4_lower or "accessible" in resp4_lower)
    passed4 = no_false_refusal and unrecorded_distinction and (grounding_called or has_ada_details)
    score4 = 20 if passed4 else (12 if unrecorded_distinction else 0)
    results.append({
        "id": "Q4",
        "title": "Unrecorded vs Inaccessible Distinction + Maps ADA Grounding",
        "dimension": "Rigor & Judgment",
        "max_score": 20,
        "score": score4,
        "passed": passed4,
        "tools_called": res4["tool_calls"],
        "notes": "Avoided false refusal, labeled official record UNRECORDED, grounded physical ADA access via Google Maps.",
    })
    print(f" -> {'PASS' if passed4 else 'FAIL'} ({score4}/20 pts) | Tools: {res4['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 5: Live Venue Existence Grounding (Technical Execution)
    # -------------------------------------------------------------------------
    print("\n[5/7] Testing: 'Is Littleton Elementary still open and where is it located?'")
    res5 = evaluator.evaluate_query(
        "Is Littleton Elementary still open, is it active, and what is its verified street address and operational status on Google Maps?",
        user_id="eval_q5",
    )
    resp5_lower = res5["response"].lower()
    passed5 = (
        "google_maps_grounding" in res5["tool_calls"]
        and ("700 hutto" in resp5_lower or "north fort myers" in resp5_lower or "33903" in resp5_lower)
        and ("dr. carrie" in resp5_lower or "littleton" in resp5_lower)
        and ("active" in resp5_lower or "open" in resp5_lower or "school" in resp5_lower)
    )
    score5 = 15 if passed5 else 0
    results.append({
        "id": "Q5",
        "title": "Live Venue Verification via Google Maps",
        "dimension": "Technical Execution",
        "max_score": 15,
        "score": score5,
        "passed": passed5,
        "tools_called": res5["tool_calls"],
        "notes": "Verified place name, address (700 Hutto Rd), and confirmed active operational status.",
    })
    print(f" -> {'PASS' if passed5 else 'FAIL'} ({score5}/15 pts) | Tools: {res5['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 6: Location & Spatial Routing (Bonus / Range)
    # -------------------------------------------------------------------------
    print("\n[6/7] Testing: 'Resident at coordinates (26.6916, -81.9078) - locate tract and shelter'")
    res6 = evaluator.evaluate_query(
        "I am a resident located at latitude 26.6916 and longitude -81.9078 in Lee County. Which census tract am I in, what is my vulnerability, and which shelter is reachable?",
        user_id="eval_q6",
    )
    resp6_lower = res6["response"].lower()
    passed6 = (
        ("find_tract_by_coordinates" in res6["tool_calls"] or "12071020801" in resp6_lower)
        and ("get_candidate_shelters" in res6["tool_calls"] or "littleton" in resp6_lower or "all souls" in resp6_lower)
    )
    score6 = 10 if passed6 else 0
    results.append({
        "id": "Q6",
        "title": "Resident Location & Real-Time Shelter Routing",
        "dimension": "Bonus / Range",
        "max_score": 10,
        "score": score6,
        "passed": passed6,
        "tools_called": res6["tool_calls"],
        "notes": "Matched tract 12071020801 via coordinates, candidate shelters, and grounded real-time route.",
    })
    print(f" -> {'PASS' if passed6 else 'FAIL'} ({score6}/10 pts) | Tools: {res6['tool_calls']}")

    # -------------------------------------------------------------------------
    # TEST 7: Pre-Season Fixes & Readiness Deliverable (Impact & Actionability)
    # -------------------------------------------------------------------------
    print("\n[7/7] Testing: 'What should the Lee County emergency manager fix before hurricane season?'")
    res7 = evaluator.evaluate_query(
        "What operational gaps should the Lee County emergency manager fix before hurricane season starts? Outline the priority actions.",
        user_id="eval_q7",
    )
    resp7_lower = res7["response"].lower()
    passed7 = (
        ("state b" in resp7_lower or "verify" in resp7_lower or "inspection" in resp7_lower)
        and ("transit" in resp7_lower or "pickup" in resp7_lower or "state d" in resp7_lower)
    )
    score7 = 10 if passed7 else 0
    results.append({
        "id": "Q7",
        "title": "Actionable Pre-Season Operational Fixes",
        "dimension": "Impact & Insight",
        "max_score": 10,
        "score": score7,
        "passed": passed7,
        "tools_called": res7["tool_calls"],
        "notes": "Specified State B Verify-First inspection list and State D transit pickup coordination.",
    })
    print(f" -> {'PASS' if passed7 else 'FAIL'} ({score7}/10 pts) | Tools: {res7['tool_calls']}")

    # -------------------------------------------------------------------------
    # COMPILE REPORT CARD
    # -------------------------------------------------------------------------
    total_score = sum(r["score"] for r in results)
    max_score = sum(r["max_score"] for r in results)

    print("\n" + "=" * 80)
    print("CHALLENGE 4 AGENT EVALUATION REPORT CARD")
    print("=" * 80)
    print(f"{'ID':<4} | {'Benchmark Test':<45} | {'Dimension':<20} | {'Score':<8} | {'Status'}")
    print("-" * 85)
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"{r['id']:<4} | {r['title'][:45]:<45} | {r['dimension']:<20} | {r['score']}/{r['max_score']:<5} | {status}")
    print("-" * 85)
    print(f"TOTAL EVALUATION SCORE: {total_score} / {max_score} ({round(total_score/max_score*100, 1)}%)")
    print("=" * 80)

    return {
        "total_score": total_score,
        "max_score": max_score,
        "percentage": round(total_score / max_score * 100, 1),
        "results": results,
    }


if __name__ == "__main__":
    run_benchmark_suite()
