# LocalAgent

`agent/local-agent` is a small TypeScript LocalAgent PoC. A long-running Agent App process listens on localhost for Codex hook relay requests, reads the Codex transcript, normalizes useful events, and writes the messages that would be sent to the central orchestrator into a mock JSONL outbox.

The Codex hook process is a separate short-lived script. It reads Codex hook JSON from `stdin`, posts it to the local Agent App process, and exits fail-open so Codex CLI keeps its own UX intact if LocalAgent is unavailable.

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

Run the local Agent App before starting a Codex session:

```sh
node --experimental-strip-types <repo>/agent/local-agent/src/cli/main.ts app
```

Useful environment variables:

```sh
export LOCAL_AGENT_ID=local-agent-dev
export LOCAL_AGENT_MOCK_OUTBOX=.local/outbox.jsonl
export LOCAL_AGENT_CURSOR_STORE=.local/cursors.json
export LOCAL_AGENT_ZELLIJ_BIN=zellij
export LOCAL_AGENT_HOOK_RELAY_HOST=127.0.0.1
export LOCAL_AGENT_HOOK_RELAY_PORT=47231
```

`LOCAL_AGENT_MOCK_OUTBOX` and `LOCAL_AGENT_CURSOR_STORE` are resolved from the current working directory of the Agent App process.

## Flow

```text
Codex hook event
  -> local-agent hook script
  -> localhost POST /codex/hooks
  -> long-running local-agent app
  -> transcript_path incremental reader
  -> domain event extractor
  -> .local/outbox.jsonl
  -> .local/cursors.json
```

The v1 mock does not send WebSocket traffic and does not receive approval results. `PermissionRequest` events are normalized into `approval.requested` in the outbox, then the hook exits without an allow/deny decision so Codex falls back to its built-in approval UI.

## Zellij Terminal Control

LocalAgent has a small terminal command handler for zellij-backed execution. The current version only defines the domain handler and zellij transport; it is not yet wired to a central WebSocket inbox.

The transport uses Zellij's official programmatic CLI surface:

- ensure a headless session: `zellij attach --create-background <session>`
- create a pane: `zellij --session <session> action new-pane --name <pane>`
- list panes: `zellij --session <session> action list-panes --json --all --state`
- write a command: `zellij --session <session> action paste --pane-id <pane> <command>`
- submit the command: `zellij --session <session> action send-keys --pane-id <pane> Enter`

The domain request shape is:

```json
{
  "type": "terminal.command.send",
  "sessionName": "saa-agent",
  "paneName": "worker",
  "paneId": "terminal_7",
  "cwd": "/workspaces/SAA",
  "command": "pnpm --dir agent test"
}
```

`paneId` is optional. If omitted, the handler creates a new pane and returns the created pane id.

Codex message routing is pane-explicit. Central owns the binding between its conversation target and zellij pane, then sends LocalAgent the exact pane id:

```json
{
  "type": "codex.message.send",
  "targetId": "discord-thread-123",
  "sessionName": "saa-agent",
  "paneId": "terminal_7",
  "codexSessionId": "codex-session-id",
  "message": "어떤 skill들이 있어?"
}
```

LocalAgent checks that `paneId` exists in `sessionName`, then writes only to that pane with `--pane-id`. It does not infer routing from the focused pane, pane order, or pane name, and it does not store central pane bindings.

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
- Codex hook script relay over localhost HTTP
- Hono HTTP listener routing to the Codex hook handler
- file-backed transcript cursor behavior
- transcript extraction into `assistant.message`, `tool.call`, and `approval.requested`
