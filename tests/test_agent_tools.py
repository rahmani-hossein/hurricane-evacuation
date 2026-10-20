"""Automated unit tests for BigQuery analytical tools in agent/tools.py."""

import unittest
import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")

from agent.tools import (
    rank_stranded_tracts,
    get_candidate_shelters,
    get_tract_access_state,
    get_county_power_dependence,
    run_equity_audit,
)

class TestAgentTools(unittest.TestCase):

    def test_rank_stranded_tracts(self):
        tracts = rank_stranded_tracts(top_n=5)
        self.assertIsInstance(tracts, list)
        self.assertEqual(len(tracts), 5)
        top_tract = tracts[0]
        self.assertIn("geo_id", top_tract)
        self.assertIn("stranded_score", top_tract)
        self.assertIn("households_no_vehicle", top_tract)
        self.assertGreater(top_tract["stranded_score"], 0.8)

    def test_get_candidate_shelters(self):
        # Tract 12071020801 is the top stranded tract
        shelters = get_candidate_shelters("12071020801")
        self.assertIsInstance(shelters, list)
        self.assertGreaterEqual(len(shelters), 1)
        first_shelter = shelters[0]
        self.assertIn("shelter_name", first_shelter)
        self.assertIn("wheelchair_record", first_shelter)
        self.assertIn("km_straight_line", first_shelter)
        self.assertIn(first_shelter["wheelchair_record"], ["YES", "NO", "UNRECORDED"])

    def test_get_tract_access_state(self):
        access = get_tract_access_state("12071020801")
        self.assertIsInstance(access, dict)
        self.assertIn("access_state", access)
        self.assertIn(access["access_state"], ["A", "B", "C", "D"])
        self.assertIn("action_recommendation", access)

    def test_get_county_power_dependence(self):
        power = get_county_power_dependence()
        self.assertIsInstance(power, dict)
        self.assertEqual(power.get("fips_code"), "12071")
        self.assertGreater(power.get("power_dependent_residents", 0), 0)

    def test_run_equity_audit(self):
        audit = run_equity_audit()
        self.assertIsInstance(audit, list)
        self.assertGreater(len(audit), 0)
        row = audit[0]
        self.assertIn("median_income", row)
        self.assertIn("poverty_rate", row)

if __name__ == "__main__":
    unittest.main()
