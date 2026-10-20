# Voice conversation handoff

## Context

The coordinator UI now supports a browser voice session at `WS /api/voice`. The browser never receives Google credentials. The API opens Gemini Live, then delegates operational questions through `ask_readiness_agent` to the canonical Lee County Agent Engine.

## Recommendation

Use push-to-talk as the default interaction. The browser sends mono PCM audio at 16 kHz; Gemini Live returns native PCM audio, normally at 24 kHz, plus partial input/output transcriptions. The UI renders the transcript and tool state while audio plays.

## Event contract

Client → server: `start`, `audio`, `audio_end`, `text`, `interrupt`, or `stop`.

Server → client: `session_started`, `user_transcript`, `agent_transcript`, `audio`, `tool_started`, `tool_completed`, `agent_turn_complete`, `interrupt`, or `error`.

## Agent and data semantics

The voice gateway calls `projects/851021919219/locations/us-east1/reasoningEngines/5276937832231862272`. The downstream agent remains responsible for BigQuery gold views, Maps grounding, Search grounding, and the interpretation rules: listed capacity is not available capacity, straight-line distance is not drive time, and unrecorded accessibility is not inaccessible.

The gateway should not execute SQL, send outreach, claim shelter activation, or infer medical suitability. External actions require a separate confirmed workflow.

## Alternatives considered

1. **Live API + ADK bridge (recommended):** natural audio and interruption with one authoritative planning agent.
2. **Streaming STT → text Agent Engine → TTS:** easier to debug, but slower and less natural; keep as a fallback if Live is unavailable.
3. **Direct Live tools:** lowest latency, but duplicates the ADK data/tool contract and risks answer drift.

## Validation notes

- `api/server.py` passes Python compilation.
- `frontend` production build passes with `npm run build`.
- Local WebSocket smoke test completed a readiness-agent tool turn with `tool_started`, `tool_completed`, and `agent_turn_complete`.
- Offline behavior is intentionally limited to text chat and cached UI data; no live voice answer is fabricated when the network is unavailable.
