# LocalAgent

`agent/local-agent` is a small TypeScript LocalAgent PoC. A long-running Agent App process listens on localhost for Codex hook relay requests, reads the Codex transcript, normalizes useful events, and either sends them to the central orchestrator or writes them into a mock JSONL outbox.

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
export LOCAL_AGENT_CENTRAL_BASE_URL=http://127.0.0.1:54321/functions/v1/orchestrator
export LOCAL_AGENT_SUPABASE_URL=http://127.0.0.1:54321
export LOCAL_AGENT_SUPABASE_ANON_KEY=<anon-key>
export LOCAL_AGENT_POLL_INTERVAL_MS=1000
```

`LOCAL_AGENT_MOCK_OUTBOX` and `LOCAL_AGENT_CURSOR_STORE` are resolved from the current working directory of the Agent App process.
`LOCAL_AGENT_CENTRAL_BASE_URL` enables central relay and command polling. `LOCAL_AGENT_SUPABASE_URL` plus `LOCAL_AGENT_SUPABASE_ANON_KEY` enables Realtime wakeups on `agent:<agent_id>`; command execution still uses the HTTP claim API as the durable source of truth.

## Flow

```text
Codex hook event
  -> local-agent hook script
  -> localhost POST /codex/hooks
  -> long-running local-agent app
  -> transcript_path incremental reader
  -> domain event extractor
  -> central POST /agent-events or .local/outbox.jsonl
  -> .local/cursors.json
```

The v1 mock does not send WebSocket traffic and does not receive approval results. `PermissionRequest` events are normalized into `approval.requested` in the outbox, then the hook exits without an allow/deny decision so Codex falls back to its built-in approval UI.

## Zellij Terminal Control

LocalAgent has a small terminal command handler for zellij-backed execution. The Agent App can claim central commands over HTTP and wake immediately when Supabase Realtime broadcasts `command.created`.

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

# Central Orchestrator

`agent/central-orchestrator` is the first server-side control-plane package. It assumes a single admin user for v1 and models the Supabase-backed orchestrator as Postgres source of truth plus API writes plus Realtime notifications.

The package is shaped as a serverless Hono app. `src/app.ts` exports `createApp()` and a default Hono app; `src/index.ts` re-exports that default app for serverless runtimes. It does not start a Node HTTP listener.

By default `createApp()` uses Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present. Without those variables it falls back to the in-memory store for tests and local package-only development.

## Supabase Local Runtime

Start Supabase from the repository root:

```sh
npx supabase start
```

Copy the local API URL and server-side Secret key from the CLI output into an ignored env file:

```sh
cp supabase/.env.example supabase/.env.local
```

Required server-side values:

```sh
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Required LocalAgent values:

```sh
LOCAL_AGENT_CENTRAL_BASE_URL=http://127.0.0.1:54321/functions/v1/orchestrator
LOCAL_AGENT_SUPABASE_URL=http://127.0.0.1:54321
LOCAL_AGENT_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Serve the Edge Function locally:

```sh
npx supabase functions serve orchestrator --env-file supabase/.env.local
```

The database schema is in `supabase/migrations`. RLS is enabled on all orchestrator tables; v1 writes go through the Edge Function with the service role key. Do not expose the service role key to LocalAgent, Discord, or browser clients.

## Central Flow

```text
LocalAgent boot
  -> POST /agents/register
  -> central upserts local_agents
  -> LocalAgent subscribes to Realtime topic agent:<agent_id>

Admin / DiscordBot / UI
  -> GET /agents
  -> choose LocalAgent node
  -> POST /sessions
  -> central stores session binding
  -> POST /sessions/:sessionId/messages
  -> central queues command for bound LocalAgent
  -> Realtime command.created { commandId }

LocalAgent
  -> fetch/claim command
  -> execute zellij/codex action
  -> POST /agent-events
  -> central appends event and updates projections
```

## Central Domain

The server domain is class-based:

- `LocalAgent`: registration, heartbeat-ready online state, discovery snapshot.
- `AgentSession`: selected LocalAgent plus exact zellij/codex binding.
- `AgentCommand`: durable command queue item routed to one LocalAgent.
- `ApprovalRequest`: pending approval state and admin allow/deny transition.

Directory structure follows a serverless app layout:

- `src/app.ts`: Hono app composition and dependency wiring.
- `src/routes/*`: thin HTTP route modules.
- `src/modules/*`: domain classes, schemas, events, and services.
- `src/events/*`: domain event envelope, store, bus, and projector.
- `src/infrastructure/*`: persistence and Realtime adapters.
- `src/shared/*`: app-wide HTTP and runtime helpers.

Primary events:

- `agent.registered`
- `session.bound`
- `command.queued`
- `agent.event.received`
- `approval.requested`
- `approval.responded`

Realtime notifications are derived from events. For v1, `command.queued` publishes `command.created { commandId }` to `agent:<agent_id>`.

## Central ERD Target

The Supabase adapter persists these tables:

- `local_agents`: `agent_id`, `node_name`, `hostname`, `capabilities`, `status`, `registered_at`, `last_seen_at`
- `agent_sessions`: `id`, `agent_id`, `conversation_id`, `status`, `binding`, `created_at`, `updated_at`
- `agent_commands`: `id`, `agent_id`, `session_id`, `type`, `status`, `payload`, `queued_at`, `lease_owner`, `lease_expires_at`, `completed_at`, `error`, `result`
- `domain_events`: `id`, `agent_id`, `session_id`, `type`, `occurred_at`, `payload`
- `approval_requests`: `id`, `session_id`, `agent_id`, `status`, `tool_name`, `question`, `choices`, `arguments`, `requested_at`, `responded_at`

## Central State Machines

LocalAgent:

```text
registered -> online -> stale -> offline
offline -> online
```

AgentSession:

```text
created -> bound -> active
active -> waiting_approval -> active
active -> completed
active -> agent_offline -> active | failed
```

AgentCommand:

```text
queued -> leased -> acked -> completed
queued | leased -> expired -> queued
leased | acked -> failed
```

ApprovalRequest:

```text
pending -> approved | denied | expired | cancelled
```

## Central HTTP API

- `POST /agents/register`: LocalAgent boot registration.
- `GET /agents`: admin discovery of online LocalAgent nodes.
- `POST /sessions`: create a session bound to a selected LocalAgent and exact pane.
- `POST /sessions/:sessionId/messages`: queue `codex.message.send` for the bound LocalAgent.
- `POST /agents/:agentId/commands/claim`: LocalAgent leases the next queued command.
- `POST /agents/:agentId/commands/:commandId/complete`: LocalAgent marks a leased command complete.
- `POST /agents/:agentId/commands/:commandId/fail`: LocalAgent marks a leased command failed.
- `POST /agent-events`: ingest LocalAgent domain events.
- `POST /approvals/:requestId/respond`: queue `approval.respond` for the bound LocalAgent.

Run:

```sh
pnpm --dir agent --filter central-orchestrator test
pnpm --dir agent --filter central-orchestrator check
```
