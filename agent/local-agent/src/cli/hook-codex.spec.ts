import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { runHook } from "./hook-codex.ts";
import { type LocalAgentConfig } from "../config.ts";

const config: LocalAgentConfig = {
  agentId: "local-agent-dev",
  outboxPath: ".local/outbox.jsonl",
  cursorPath: ".local/cursors.json",
  zellijBinaryPath: "zellij",
  hookRelayHost: "127.0.0.1",
  hookRelayPort: 47231,
};

test("relays stdin hook payload to the local agent app over HTTP", async () => {
  const hookInput = {
    session_id: "sess",
    transcript_path: "/tmp/transcript.jsonl",
    cwd: "/workspaces/SAA",
    hook_event_name: "SessionStart",
    model: "gpt-5.5",
  };
  const requests: Array<{ url: string; init: RequestInit }> = [];

  const exitCode = await runHook(config, {
    stdin: Readable.from([JSON.stringify(hookInput)]),
    fetch: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
    stderr: { write: () => true },
  });

  assert.equal(exitCode, 0);
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, "http://127.0.0.1:47231/codex/hooks");
  assert.equal(requests[0]?.init.method, "POST");
  const body = JSON.parse(String(requests[0]?.init.body));
  assert.equal(body.protocolVersion, "local-agent.codex-hook.v1");
  assert.match(body.eventId, /^hook_/);
  assert.match(body.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(body.hookInput, hookInput);
});

test("fails open when the local agent app is unavailable", async () => {
  const messages: string[] = [];
  const exitCode = await runHook(config, {
    stdin: Readable.from(["{}"]),
    fetch: async () => {
      throw new Error("connect ECONNREFUSED");
    },
    stderr: {
      write: (message: string) => {
        messages.push(message);
        return true;
      },
    },
  });

  assert.equal(exitCode, 0);
  assert.match(messages.join(""), /LocalAgent hook relay failed open: /);
});
