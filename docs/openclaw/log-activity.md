# Log Activity — OpenClaw integration

This document describes how to report activities from OpenClaw/Tenacitas to Mission Control so they appear in the Activity feed and stats.

## Option 1: Call the API directly (recommended for hooks)

From OpenClaw gateway or any script, send a POST to Mission Control:

```bash
BASE_URL="${MISSION_CONTROL_URL:-http://localhost:3000}"
curl -s -X POST "${BASE_URL}/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool_call",
    "description": "read_file src/app/page.tsx",
    "status": "success",
    "duration_ms": 120,
    "tokens_used": 1500,
    "agent": "tenacitas"
  }'
```

Full API contract: [../api/activities.md](../api/activities.md).

## Option 2: Explicit “log_activity” tool/skill

Until OpenClaw has a built-in hook that logs every tool call automatically, you can expose a **log_activity** action that the agent (or the runtime) calls to register an activity.

- **Endpoint**: `POST {BASE_URL}/api/activities`
- **Body**: Same as in [../api/activities.md](../api/activities.md) (type, description, status, optional timestamp, duration_ms, tokens_used, agent, metadata).

Example payload when the agent explicitly reports an action:

```json
{
  "type": "tool_call",
  "description": "grep pattern=useState path=src",
  "status": "success",
  "duration_ms": 45,
  "tokens_used": 0,
  "agent": "tenacitas"
}
```

Implement this in OpenClaw as a small tool that performs the HTTP POST; the agent can call it after important actions, or your runtime can wrap other tools to call it on success/error.

## Environment

- Set `MISSION_CONTROL_URL` or `NEXT_PUBLIC_BASE_URL` to the Mission Control base URL (e.g. `https://mara.example.com`) when running outside the same host.
