# Hurricane Readiness — Team Pitch

## The pitch

When a hurricane is still a forecast, the emergency manager has time to act—but only if the plan can answer four questions together:

1. Which Florida communities are least able to self-evacuate?
2. Which shelters can receive them, and what is still unknown?
3. Which medically dependent communities need a human escalation?
4. Who will check on people when the first plan fails?

**Hurricane Readiness** turns public data, Google Maps verification, and a consent-based neighbor network into an actionable readiness brief. It does not expose individual vulnerability. It finds priority areas, proposes destinations and transport actions, and makes uncertainty visible.

## Product modes

- **Getting people out:** rank tracts by non-self-evacuation pressure, match to EVAC shelters, and create pickup/peer tasks.
- **Shelter readiness:** score shelter records in batch, then verify selected candidates with Maps before publishing a brief.
- **Medical escalation:** identify county/facility power-dependence and missing capacity, then route cases to configured county/health queues.

## Demo story

The cleaned gold layer ranks **Miami-Dade County** first in the Florida snapshot. It has about 2.7M residents, 90,752 no-vehicle households, 109 EVAC/BOTH candidate shelters, and roughly 95% of candidate shelters with wheelchair accessibility unrecorded. The result is not “Miami is unsafe”; it is “Miami has the highest planning pressure and the biggest verification opportunity.”

## Agent questions

- “Which county should we work on first, and why?”
- “Show me the highest-pressure tracts in Miami-Dade with a shelter gap.”
- “Which shelter is the best destination for this tract?”
- “What does the public record know versus what needs verification?”
- “Verify the top three shelter places and tell me if the name/address still match.”
- “Who has no peer coverage, and what is the county fallback?”
- “Create a two-person check-in task with a backup.”
- “What changes if this shelter is unavailable?”

## Interface concepts

### Coordinator web

A map-first operations console with county heatmap, tract overlays, shelters, hospitals/care facilities, routes, and peer coverage. A selected tract opens an action drawer with evidence, uncertainty, candidate destinations, and a “start brief” conversation. Building-level views are limited to voluntarily registered peer-program locations or synthetic demo data.

### Resident / peer mobile

Three taps: “I need help,” “I can help,” and “Check my building.” Residents select needs categories—not diagnoses. The offline package stores the approved plan, two fallback shelters, route instructions, peer aliases, meeting points, and FAQ. Online chat can refresh; offline mode only answers from the downloaded package.

## Alternatives considered

1. Shelter-only console — easiest, but less human-centered.
2. No-car evacuation planner — powerful, but needs careful language about vehicle ownership versus access to a ride.
3. **Adaptive Evacuation Operations — recommended.** Combines the no-car workflow, shelter verification, medical escalation, and Neighbor Lift into one action graph.

## Validation notes

- Raw → staging → gold BigQuery build is in `sql/build_stg_gold.sql`.
- Gold tables are created in `evacuation_readiness_stg` and `evacuation_readiness_gold`.
- Highest-risk county is computed from a transparent score and separate data-confidence signals.
- Miami-Dade shelter validation was performed against Google Maps/search plus official school/facility sources. Georgia Jones-Ayers has an address/ZIP discrepancy that should remain a review task.
