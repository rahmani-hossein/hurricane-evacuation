# Lee County copilot panel decision

## Context

The command center previously opened a blocking response modal for every query. Long agent responses were rendered as plain text, which hid headings and lists, and there was no way to continue a conversation in context. The public map also failed because the Cloud Run build received no Google Maps JavaScript API key.

## Alternatives

1. Keep the modal and improve typography. Minimal change, but it still interrupts the command center and does not support follow-ups.
2. Add a persistent right-side conversation panel with minimize/close controls, follow-up input, Markdown rendering, and per-answer Maps links. Recommended because it preserves the operational canvas while making the agent conversational.
3. Replace the panel with a full-screen chat route. Strong chat focus, but it hides the map and readiness brief during planning work.

## Recommendation and final decision

Use alternative 2. Queries open a non-blocking Lee County Readiness Copilot panel. Conversation turns remain visible, follow-ups reuse the existing `/api/copilot/chat` contract, Markdown is rendered for headings, lists, emphasis, code, and links, and each grounding source keeps its `View place` link.

Pass the ignored local Maps key to the Cloud Build step during deployment. Do not commit the key or expose credentials in the repository.

## Validation notes

- Frontend production build passes with TypeScript and Vite.
- Browser QA covered the query loading state, rendered Markdown, minimize/expand behavior, follow-up input, and place links.
- Cloud Run health and Lee readiness endpoints return 200 after deployment.
- Voice remains on its existing WebSocket path and was not changed by this UX work.
