import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CodexHookHandler } from "./codexHookHandler.ts";
import { type HookRelayRequest } from "../../domain/schemas.ts";

function transcriptRow(type: string, payload: Record<string, unknown>): string {
  return JSON.stringify({ type, payload });
}

test("extracts transcript events and sends them to the central outbox", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "local-agent-handler-"));
  const transcriptPath = join(tempDir, "transcript.jsonl");
  const cursorPath = join(tempDir, "cursors.json");
  const outboxPath = join(tempDir, "outbox.jsonl");
  writeFileSync(
    transcriptPath,
    `${transcriptRow("event_msg", { type: "agent_message", message: "hello" })}\n`,
  );

  const handler = new CodexHookHandler({
    agentId: "local-agent-dev",
    cursorPath,
    outboxPath,
  });

  await handler.handle({
    protocolVersion: "local-agent.codex-hook.v1",
    eventId: "hook_test",
    sentAt: "2026-05-03T00:00:00.000Z",
    hookInput: hookInput(transcriptPath),
  });

  const [line] = readFileSync(outboxPath, "utf8").trim().split("\n");
  const envelope = JSON.parse(line ?? "{}");
  assert.equal(envelope.type, "assistant.message");
  assert.equal(envelope.agentId, "local-agent-dev");
  assert.equal(envelope.payload.text, "hello");
  assert.match(readFileSync(cursorPath, "utf8"), /transcript\.jsonl/);
});

test("does nothing when transcript path is null", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "local-agent-handler-"));
  const handler = new CodexHookHandler({
    agentId: "local-agent-dev",
    cursorPath: join(tempDir, "cursors.json"),
    outboxPath: join(tempDir, "outbox.jsonl"),
  });

  await handler.handle({
    protocolVersion: "local-agent.codex-hook.v1",
    eventId: "hook_test",
    sentAt: "2026-05-03T00:00:00.000Z",
    hookInput: hookInput(null),
  });
});

function hookInput(transcriptPath: string | null): HookRelayRequest["hookInput"] {
  return {
    session_id: "sess",
    transcript_path: transcriptPath,
    cwd: "/workspaces/SAA",
    hook_event_name: "SessionStart",
    model: "gpt-5.5",
  };
}
