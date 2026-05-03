# local-agent Directory Tree

`agent/local-agent` is a TypeScript package for the local Codex agent runtime. It relays Codex hook payloads into a local HTTP app, reads Codex transcripts incrementally, converts transcript rows into domain events, and sends terminal/Codex messages through zellij-backed transports.

## Test Policy

- Write spec files with Vitest.
- Place each `*.spec.ts` file next to the source file it verifies.
- Run tests with `pnpm --dir agent/local-agent test`.

## Structure

```text
agent/local-agent/
+-- package.json
+-- tsconfig.json
+-- tree.md
+-- src/
    +-- cli/
    |   +-- main.ts
    |   +-- hook-codex.ts
    |   +-- hook-codex.spec.ts
    +-- config.ts
    +-- config.spec.ts
    +-- domain/
    |   +-- envelope.ts
    |   +-- schemas.ts
    |   +-- schemas.spec.ts
    +-- handlers/
    |   +-- codex/
    |   |   +-- codexHookHandler.ts
    |   |   +-- codexHookHandler.spec.ts
    |   +-- codexMessage/
    |   |   +-- codexMessageHandler.ts
    |   |   +-- codexMessageHandler.spec.ts
    |   +-- terminal/
    |       +-- terminalCommandHandler.ts
    |       +-- terminalCommandHandler.spec.ts
    +-- transcript/
    |   +-- extractor.ts
    |   +-- extractor.spec.ts
    |   +-- fileCursorStore.ts
    |   +-- reader.ts
    |   +-- reader.spec.ts
    +-- transport/
        +-- central/
        |   +-- mockCentralOutbox.ts
        +-- http/
        |   +-- localAgentHttpServer.ts
        |   +-- localAgentHttpServer.spec.ts
        +-- zellij/
            +-- zellijTransport.ts
            +-- zellijTransport.spec.ts
```

## Directory Responsibilities

- `src/cli`: CLI entrypoints. `main.ts` selects hook relay or app server mode. `hook-codex.ts` reads hook JSON from stdin and posts it to the local HTTP app while failing open on relay errors.
- `src/config.ts`: Loads runtime configuration from environment variables, including agent id, cursor/outbox paths, zellij binary path, and hook relay host/port.
- `src/domain`: Defines Valibot schemas, request/event types, transcript row shapes, and outbound event envelope creation.
- `src/handlers/codex`: Handles relayed Codex hook requests, reads transcript increments, extracts domain events, writes outbound events, and persists transcript cursors.
- `src/handlers/codexMessage`: Sends central-managed Codex messages to an existing zellij pane after checking that the pane exists.
- `src/handlers/terminal`: Ensures a zellij session, creates or reuses a pane, and sends terminal commands.
- `src/transcript`: Tracks transcript cursors, reads complete JSONL rows incrementally, persists cursor state, and extracts assistant message/tool call/approval events.
- `src/transport/central`: Mock central outbox implementation for local event delivery through JSONL files.
- `src/transport/http`: Hono HTTP app and Node server wrapper for health checks and Codex hook relay requests.
- `src/transport/zellij`: zellij command transport for sessions, panes, command/text sending, pane lookup, and transport error mapping.
