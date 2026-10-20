# No One Left Behind · Lee County pitch deck

## Context

This six-slide HTML pitch is for the Lee County disaster-relief planning team. It frames the product as a county capability for preparedness: identify the people and places most likely to be missed, organize trusted local partners around them, ground shelter records with Maps, and keep a human fallback for what the data cannot know.

## Story and recommendation

Recommendation: use the provided six-slide pitch template structure. Keep the three-slide HTML version separate for the under-three-minute recording; this handoff deck fills the required template sections:

`risk zone → trusted local hub → peer volunteer → verified/appropriate shelter → resident plan`

The planner is not replacing the community. The planner uses the agent to find where the community can matter most. Around priority areas such as Pine Island / Matlacha, Central Fort Myers, North Cape Coral, and Sanibel, the county can identify libraries, community centers, nonprofits, volunteer centers, faith groups, and neighborhood networks that can recruit peers and spread awareness of Neighbor Lift.

## Evidence used from the latest repo snapshot

- The README says that after Hurricane Ian, the median age of people who died was in the seventies.
- The latest Lee County UI mock data reports 3,840 households without a vehicle, 1,420 power-dependent residents, 87.5% unrecorded shelter accessibility, 3 surge-exposed shelters, and 2 medical shelters.
- The latest Lee County mock data names priority areas including Pine Island / Matlacha (412 no-vehicle households; 11.2 km to the nearest verified inland shelter), Central Fort Myers East, North Cape Coral Corridor, and Sanibel Island Coast.
- Lee County-specific directives include LeeTran/paratransit staging, physical shelter accessibility audits, medical-needs assignments, and a transfer agreement for oxygen-dependent residents.
- The data contract distinguishes recorded facts, derived calculations, live Google Maps verification, and unknowns. “Unrecorded” is never presented as “no.” Maps can ground a place or route; it cannot prove emergency operations, accessibility, or medical acceptance.

## Alternatives considered

1. **Shelter Readiness Console** — strongest fit to shelter records and easiest demo, but too facility-centric for the community ask.
2. **No-Car Evacuation Planner** — strongest resident story, but can wrongly equate no vehicle with no ride.
3. **Community Readiness Loop** — recommended. It joins the agent’s risk prioritization, outreach partners, peer network, shelter grounding, and resident plan while keeping the county’s limitations visible.

## Project criteria carried into the deck

The README scores impact and insight, technical execution including genuine Maps grounding, rigor and judgment, and craft and communication. The deck therefore shows the planning-time use case, Lee County-specific evidence, the Maps handoff and its effect on recommendations, the human validation fallback, and the resident/community outcome. It does not claim live emergency operations or individual-level identification.

## Final decision

Use a light, warm, civic visual system rather than a dark product-dashboard theme, while mapping the content to the supplied template:

1. **Team name / project** — No One Left Behind, Lee County framing, community image.
2. **Our Team** — names, emails, working roles, and submission/sharing fields.
3. **Challenge Overview** — Ian statistic, county evidence, and who benefits.
4. **Impact / Our Agent** — automatic grounded conversation from risk zone to community action.
5. **Sources / outcome** — four actions, command-center evidence, Maps limits, and human validation.
6. **Prototype Architecture** — manager → command center → ADK/Gemini agent → BigQuery, Maps, and community network.

## Validation notes

Run the real HTML through a local server at desktop and mobile widths. Verify exactly six snap slides, arrow/PageUp/PageDown/Space navigation, progress state, the automatic slide-4 typing/reveal/follow-up sequence, prompt buttons, and the captured Lee County command-center / Readiness Copilot screens on slides 5–6. Check that the deck consistently says **Lee County**, that the local names and numbers match the repo, and that no slide treats public data as individual identification or Maps as proof of shelter accessibility. The separate `presentation-community-v2.html` remains the three-slide recording cut.
