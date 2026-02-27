# Activities API

Mission Control exposes an API for logging agent activities (e.g. tool calls from Tenacitas/OpenClaw). Data is stored in SQLite with **30-day retention**.

## POST /api/activities

Register a single activity. Used by Tenacitas or by an OpenClaw hook after each tool call.

### URL

- **Base URL**: Use the same origin as the dashboard, or set `NEXT_PUBLIC_BASE_URL` (e.g. `https://mara.example.com`).
- **Endpoint**: `POST {BASE_URL}/api/activities`

### Request

**Headers**

- `Content-Type: application/json`

**Body (JSON)**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `type`         | string | Yes      | Activity type, e.g. `tool_call`, `file_read`, `file_write`, `command`, `message`, `cron_run`, `agent_action`. |
| `description`  | string | Yes      | Human-readable description (e.g. tool name + short summary). |
| `status`       | string | Yes      | One of: `success`, `error`, `pending`, `running`. |
| `timestamp`    | string | No       | ISO 8601 date of the event. If omitted, server uses current time. Must not be in the future. |
| `duration_ms`  | number | No       | Duration in milliseconds (maps to ROADMAP "duration"). |
| `tokens_used`  | number | No       | Token count for this action. |
| `agent`        | string | No       | Agent identifier (e.g. `tenacitas`, `main`). |
| `metadata`     | object | No       | Extra key-value data. |

### Response

- **201 Created**: Returns the created activity (includes `id`, `timestamp`, and all stored fields).
- **400 Bad Request**: Missing/invalid fields (e.g. invalid or future `timestamp`).
- **500**: Server error.

### Example (curl)

```bash
curl -X POST "https://mara.example.com/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool_call",
    "description": "read_file path=src/app/page.tsx",
    "status": "success",
    "timestamp": "2026-02-27T10:00:00.000Z",
    "duration_ms": 120,
    "tokens_used": 1500,
    "agent": "tenacitas"
  }'
```

### Example (tool call payload from OpenClaw)

After each tool execution, OpenClaw (or a gateway hook) can POST:

```json
{
  "type": "tool_call",
  "description": "<tool_name> <short_args_summary>",
  "status": "success",
  "timestamp": "<ISO8601_when_tool_ran>",
  "duration_ms": <milliseconds>,
  "tokens_used": <number>,
  "agent": "tenacitas"
}
```

Use `status: "error"` when the tool fails, and optionally put error details in `metadata`.

---

## Hook in OpenClaw (automatic logging per tool call)

OpenClaw is not part of this repository. To log every tool call automatically:

1. **In OpenClaw** (gateway or runtime that executes tools): after each tool call, perform an HTTP POST to Mission Control’s `POST /api/activities` with the payload above. Use the same base URL as the dashboard (e.g. from env like `MISSION_CONTROL_URL` or `NEXT_PUBLIC_BASE_URL`).
2. **Contract**: Exactly as in this document — same URL, method, body fields, and validation (timestamp optional, no future dates).

Until OpenClaw has a built-in hook, you can:

- Use a **log_activity** action that the agent or runtime calls explicitly — see [OpenClaw log-activity integration](../openclaw/log-activity.md), or
- Add a small middleware in the OpenClaw codebase that, on tool completion, calls this endpoint (fire-and-forget or with minimal error handling).

---

## GET /api/activities (reference)

- **Query**: `limit`, `offset`, `sort` (`newest` | `oldest`), `type`, `status`, `agent`, `startDate`, `endDate`, `format` (`json` | `csv`).
- **Response**: `{ activities, total, limit, offset, hasMore }` or CSV when `format=csv`.

## GET /api/activities/stats

- Returns counts (total, today, by type, by status), heatmap data, trend, and hourly distribution.

## GET /api/activities/stream

- Server-Sent Events stream of new activities (polling-based). Clients subscribe for real-time updates.
