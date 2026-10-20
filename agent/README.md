# Lee County Hurricane Readiness Agent

This folder contains the executable ADK package. Project documentation lives under [`../docs/`](../docs/),
so handoffs and decision artifacts do not accumulate in the repository root.

- Runtime handoff: [`../docs/handoffs/ADK_HANDOFF.md`](../docs/handoffs/ADK_HANDOFF.md)
- Data contract: [`../docs/handoffs/miami-dade-agent-handoff.md`](../docs/handoffs/miami-dade-agent-handoff.md)
- Validation results: [`../docs/validation/miami-dade-shelter-validation.md`](../docs/validation/miami-dade-shelter-validation.md)

The agent is a working Lee County implementation, not a placeholder. It combines custom BigQuery
function tools with Google Maps grounding, Google Search grounding for outreach discovery, and
preserves the uncertainty semantics of the gold tables.

The outreach use case is exposed through `find_outreach_candidates` and the dedicated
`agent.outreach` agent. It starts with the curated `lee_outreach_organizations` gold seed and then
uses grounded search to find and verify nearby community partners. Search results are leads, not
proof of activation or willingness to deploy.

## BigQuery MCP boundary

All analytical tools in `agent/tools.py` send read-only SQL through Google's managed BigQuery MCP
server at `https://bigquery.googleapis.com/mcp`, using the `execute_sql_readonly` tool. The agent
does not instantiate `google.cloud.bigquery.Client` for analytical queries. MCP supplies the
`goog-mcp-server: true` BigQuery job label, while the domain-specific Python tools preserve the
Lee County planning rules and return the existing tool contracts.

## Key Assumptions & Data Realities for the Emergency Manager

1. **Capacity 0 is a Paperwork / Floor-Plan Deficit (Not Building Incapacity)**:
   - In official FEMA/County registry records (`evacuation_readiness_gold.lee_shelter_readiness`), **27 out of 100 Lee County shelters** have `evacuation_capacity = 0` or NULL (15 explicitly flagged as `capacity_unverified`), such as **Dr. Carrie D. Robinson Littleton Elementary School** (Shelter ID 134167).
   - This occurs when emergency authorities have earmarked a facility as an eligible pre-landfall evacuation destination (`usage = 'EVAC'`), but have not completed an official cot allocation survey or Red Cross floor-plan quota.
   - **Emergency Manager Action:** The agent automatically flags these shelters under the **State B Verify-First Inspection Priorities** so that county planners and Red Cross liaisons can conduct physical space assessments and assign cot quotas before hurricane landfall.

2. **Grounding with Google Maps vs Administrative Records**:
   - Google Maps resolves facility existence, legal name expansions (e.g., short name "Littleton Elementary" -> full name "Dr. Carrie D. Robinson Littleton Elementary School"), active status, physical street address corrections, and physical ADA amenities (entrances, parking, restrooms).
   - **Google Maps does NOT store emergency cot quotas or hurricane capacity numbers**; those remain administrative emergency management metrics.
   - When the agent sees a capacity of 0, it grounds the building in Google Maps to prove the facility is physically active, and flags the capacity discrepancy as an administrative verification requirement for the emergency manager.

3. **Unrecorded Accessibility is Never "No"**:
   - 93% of shelters in Lee County have unrecorded wheelchair accessibility paperwork in the historical registry.
   - The agent never treats missing paperwork as inaccessibility; instead, it uses Google Maps physical attributes (entrance, parking, restroom) to cross-examine and flags the facility for physical pre-season inspection.

4. **Surge Hazard Exclusions**:
   - Shelters confirmed inside SLOSH storm surge inundation zones (e.g., Dunbar High School) are excluded from pre-landfall intake to prevent staging evacuees in flood hazard areas.

We built the on-ramp: every registered shelter in your state with capacity and accessibility, the
census tracts around them with disability, vehicle access and age, the counties where people depend
on electricity for medical equipment, hurricane and coastal-flood exposure per tract, and a
validation suite that tells you plainly whether any of it is wrong. We did not build the vehicle.
The design decisions in your agent are what you are judged on.

## What has to be true of what you build here

- **An ADK agent**, in Python.
- **At least one tool you built yourself.** A Python function tool, or one you defined in MCP
  Toolbox—either counts. The obvious candidate wraps a shelter query. The more valuable one holds
  the logic that is not a single query: deciding what "reachable" means for a household with no
  vehicle, weighing an unrecorded accessibility flag against a recorded one, turning a list of
  tracts into a readiness brief with a recommendation attached. Consuming only prebuilt generic
  tools and calling that your design does not count.
- **At least one Google-managed MCP server, consumed.** Do not author your own—use BigQuery's
  built-in server or the [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox).
- **Deployed to Google Cloud**—Agent Runtime or Cloud Run, your choice.
- **Your required differentiator: Grounding with Google Maps, genuinely used.** Your agent must
  call it and act on what comes back. Naming it in a slide does not count, and neither does calling
  it once for decoration in a flow that would give the same answer without it.

## Your model choice decides your architecture

**On Gemini 2.5 and older**, a built-in tool cannot share an agent with a function tool of your own:

```
400 INVALID_ARGUMENT—"Unable to submit request because Multiple tools are supported
only when they are all search tools."
```

**On Gemini 3.x it works.** Verified 2026-08-09: `google_maps_grounding` and a BigQuery function
tool in one ADK agent, run end to end, both firing in a single turn. The same request on
`gemini-2.5-flash` still returns the 400.

**This deployment uses Gemini 2.5 because that is what the hackathon project exposes.** The root
agent keeps the BigQuery/function tools, while Maps and Search are isolated in ADK sub-agents and
wrapped with `AgentTool`:

- a **maps agent** holding `google_maps_grounding` and nothing else
- your **root agent** holding your function tools, an MCP server, and the maps agent wrapped in
  `AgentTool`

`GoogleMapsGroundingTool` takes no constructor arguments and does not accept
`bypass_multi_tools_limit`, so on an older model the sub-agent is the only route. `google_maps` and
`google_search` coexist on any model.

**Ignore this warning**—it appears once per turn and means nothing here:
`Tools at indices [0] are not compatible with automatic function calling (AFC). AFC is disabled.`
ADK runs its own function-calling loop.

## What Grounding with Google Maps will and will not do

| Will | Will not |
|---|---|
| Find places, addresses, ratings, opening hours | Give you a drive time unless `routing` is in `grounding_types` |
| Tell you whether somewhere is open **right now** | Know anything in our tables—who lives nearby, wheelchair flags, generators |
| Tell you a place has closed, or been renamed | Answer anything but English |
| Say honestly when it does not know | Answer an *area* question about accessibility |

**Accessibility depends on how you ask.** An area question gets you nothing. **One named building at
one address** got a definite answer 5 times out of 8 in our testing, and agreed with FEMA 4 times
out of 5 where both had a view. Iterating over your candidate shelters one at a time is a real
strategy and almost nobody will try it.

Routing is available too: add `routing` to `grounding_types` alongside `places` and the same grounded
call returns drive times and directions ([Routing—Find Directions](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-maps#routing-find-directions)).
That is the add-on that turns the straight-line distances in our tables into something a planner can
use—the tables themselves carry straight-line distance only. Routing is newer than the rest of the
feature, so if you build on it, test it early. Five to eight seconds per grounded call is normal,
not a bug.

Attribution is a requirement, not a nicety: display the Google Maps sources immediately after the
content they support, viewable within one user interaction, with the words "Google Maps" unmodified
and `translate="no"`. You may keep `place_id` and `review_id`; you may not cache, store or export
the rest of what comes back.

## The thing worth remembering while you build

**Our data knows what a place *is*. Maps knows whether it is *still there*. Neither knows whether it
works for the person you are trying to help.**

FEMA's file is a historical registry. We checked fifteen Florida shelters against Google Maps:
**fourteen still exist, one had been renamed** (same building, new name—a name-only lookup misses
it). So the value of a runtime check is not finding rubble, it is catching the ones that moved or
changed, and knowing what a place is *now*.

The accessibility gap is the harder one. For roughly two thirds of American shelters **nobody has
written it down**, and no amount of grounding creates a record that does not exist.

An agent that reports "no accessible shelters nearby" when it means "nobody recorded any" has
stated a fact about paperwork as a fact about buildings. An agent that says *"eleven of these I can
speak to, sixty-four nobody has assessed"* is more useful, more honest, and will score better.

See the README's "Six defects you will meet" for the data traps and Section 13 of the notebook for
the constraints.
