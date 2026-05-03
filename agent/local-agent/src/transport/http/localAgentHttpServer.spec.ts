import { expect, test } from "vitest";
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

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(handled).toEqual([body]);
});

test("exposes a health check", async () => {
  const app = createLocalAgentHttpApp({ handle: async () => undefined });
  const response = await app.request("/healthz");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
