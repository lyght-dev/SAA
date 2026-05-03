# LocalAgent

`agent/local-agent` is a small TypeScript Codex hook client. It reads Codex hook JSON from `stdin`, reads the Codex transcript, normalizes useful events, and writes the messages that would be sent to the central orchestrator into a mock JSONL outbox.

There is no HTTP listener in the current version. LocalAgent is a client from the central-orchestrator perspective, and the hook process performs the work directly.

## Run

Install dependencies:

```sh
pnpm --dir agent install
```

Codex hook config in `.codex/config.toml` calls:

```sh
node --experimental-strip-types <repo>/agent/local-agent/src/cli/main.ts hook
```

Do not use `pnpm` as the Codex hook command. Package-manager script banners write to `stdout`, and Codex hook `stdout` is protocol-sensitive.

Useful environment variables:

```sh
export LOCAL_AGENT_ID=local-agent-dev
export LOCAL_AGENT_MOCK_OUTBOX=.local/outbox.jsonl
export LOCAL_AGENT_CURSOR_STORE=.local/cursors.json
```

`LOCAL_AGENT_MOCK_OUTBOX` and `LOCAL_AGENT_CURSOR_STORE` are resolved from the current working directory of the hook process.

## Flow

```text
Codex hook event
  -> local-agent hook CLI
  -> transcript_path incremental reader
  -> domain event extractor
  -> .local/outbox.jsonl
  -> .local/cursors.json
```

The v1 mock does not send WebSocket traffic and does not receive approval results. `PermissionRequest` events are normalized into `approval.requested` in the outbox, then the hook exits without an allow/deny decision so Codex falls back to its built-in approval UI.

## Domain Events

Outbox rows are envelope JSON objects:

```json
{
  "id": "evt_uuid",
  "type": "approval.requested",
  "agentId": "local-agent-dev",
  "sessionId": "session-id",
  "turnId": "turn-id",
  "timestamp": "2026-05-02T00:00:00.000Z",
  "payload": {}
}
```

Supported payload types:

- `assistant.message`: AI text surfaced to the user from transcript `event_msg.agent_message`.
- `tool.call`: tool/function call from transcript `response_item.function_call`; `payload.arguments` is parsed from the transcript JSON string.
- `approval.requested`: escalation request inferred from `function_call.arguments.sandbox_permissions == "require_escalated"` or from a Codex `PermissionRequest` hook.

Approval choices are fixed to:

```json
["allow", "deny"]
```

## Transcript Rules

The extractor intentionally does not forward raw transcript content.

It reads from `transcript_path` using a file-backed per-session cursor:

- `sessionId`
- `transcriptPath`
- `byteOffset`
- `lineNo`
- `seenEventIds`

Rows used by v1:

- AI message: `type == "event_msg"` and `payload.type == "agent_message"`
- Tool call: `type == "response_item"` and `payload.type == "function_call"`
- Approval request: parsed `payload.arguments.sandbox_permissions == "require_escalated"`

Rows intentionally ignored by v1:

- `event_msg.exec_command_end`
- `response_item.function_call_output`
- `PostToolUse.tool_response`
- raw `session_meta`, `turn_context`, system/developer context, and token/rate-limit metadata

## Validation

Valibot schemas define the runtime boundaries and domain types in `agent/local-agent/src/domain/schemas.ts`.

Run:

```sh
pnpm --dir agent --filter local-agent check
pnpm --dir agent --filter local-agent test
```

Current tests cover:

- captured Codex hook payload shape validation
- file-backed transcript cursor behavior
- transcript extraction into `assistant.message`, `tool.call`, and `approval.requested`
