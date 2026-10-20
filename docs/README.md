# Project documentation

Documentation is grouped by how the team uses it:

- `handoffs/` — contracts and runbooks for agents and downstream builders.
- `validation/` — data-quality, Maps validation, and [`agent-rubric-evaluation.md`](validation/agent-rubric-evaluation.md) (official judging criteria benchmark report).
- `decisions/` — product and architecture decisions, with human-review HTML companions.
- `operations/` — append-only task and delivery log.

The executable ADK package remains in [`../agent/`](../agent/). The primary agent handoff is
[`handoffs/ADK_HANDOFF.md`](handoffs/ADK_HANDOFF.md); the automated rubric evaluation runner is
[`../tests/eval_agent_rubric.py`](../tests/eval_agent_rubric.py).

