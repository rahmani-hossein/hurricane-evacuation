# No One Left Behind · Lee County pitch deck

## Context

This six-slide HTML pitch is for the Lee County disaster-relief planning team. It frames the product as a county capability for preparedness: identify the people and places most likely to be missed, organize trusted local partners around them, ground shelter records with Maps, and keep a human fallback for what the data cannot know.

## Story and recommendation

Recommendation: tell one visible story in six slides. Start with the human stake from Hurricane Ian, make the Lee County planning gap concrete, then show the plan assembling in real time:

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

Use a light, warm, civic visual system rather than a dark product-dashboard theme. The supplied community image anchors the human opening. The hero interaction is the animated “county loop” on slide 3: a single click animates risk, partners, peers, shelter grounding, and the resident plan into one connected system. Slides remain sparse enough to present, but carry enough explanation for a handoff.

1. **No one gets left behind** — Ian statistic, Lee County framing, community image.
2. **Community is the multiplier** — Lee County evidence and why scarce resources require local capacity.
3. **Watch a plan come together** — animated risk → partner → peer → shelter → resident loop.
4. **The planner’s brief becomes a community brief** — county actions and local outreach workflow.
5. **Use Maps for the place; use people for the unknown** — grounding, limitations, and human validation.
6. **The plan travels with the person** — app placeholders plus CTA for county planners, hubs, volunteers, and residents.

## Validation notes

Run the real HTML through a local server at desktop and mobile widths. Verify six snap slides, arrow/PageUp/PageDown/Space navigation, progress state, the slide-3 animation button, role selection on slide 6, and placeholder labels for future app screenshots. Check that the deck consistently says **Lee County**, that the local names and numbers match the repo, and that no slide treats public data as individual identification or Maps as proof of shelter accessibility.
