import test from "node:test";
import assert from "node:assert/strict";
import { createLocalAgentHttpApp } from "./localAgentHttpServer.ts";
import { type HookRelayRequest } from "../../domain/schemas.ts";

test("routes codex hook relay requests to the codex hook handler", async () => {
  const handled: HookRelayRequest[] = [];
  const app = createLocalAgentHttpApp({
    handle: async (request) => {
      handled.push(request);
    },
  });
  const body: HookRelayRequest = {
    protocolVersion: "local-agent.codex-hook.v1",
    eventId: "hook_test",
    sentAt: "2026-05-03T00:00:00.000Z",
    hookInput: {
      session_id: "sess",
      transcript_path: null,
      cwd: "/workspaces/SAA",
      hook_event_name: "SessionStart",
      model: "gpt-5.5",
    },
  };

  const response = await app.request("/codex/hooks", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(handled, [body]);
});

test("exposes a health check", async () => {
  const app = createLocalAgentHttpApp({ handle: async () => undefined });
  const response = await app.request("/healthz");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
