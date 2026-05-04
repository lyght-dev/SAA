import assert from "node:assert/strict";
import { test } from "vitest";
import { CentralHttpClient } from "./centralHttpClient.ts";

test("registers LocalAgent with central orchestrator", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const client = new CentralHttpClient({
    baseUrl: "http://central.test",
    fetch: async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return jsonResponse({ agent: { agentId: "agent-a" } });
    },
  });

  await client.registerAgent({
    agentId: "agent-a",
    nodeName: "macbook",
    hostname: "macbook.local",
  });

  assert.deepEqual(calls, [
    {
      url: "http://central.test/agents/register",
      body: {
        type: "agent.register",
        agentId: "agent-a",
        nodeName: "macbook",
        hostname: "macbook.local",
        capabilities: { codex: true, zellij: true },
      },
    },
  ]);
});

test("claims, completes, fails commands, and posts agent events", async () => {
  const calls: string[] = [];
  const client = new CentralHttpClient({
    baseUrl: "http://central.test/",
    fetch: async (url) => {
      calls.push(String(url));
      if (String(url).endsWith("/claim")) {
        return jsonResponse({ command: { id: "cmd-1", payload: { type: "codex.message.send" } } });
      }
      return jsonResponse({ ok: true, command: { id: "cmd-1" } });
    },
  });

  assert.equal((await client.claimCommand("agent-a"))?.id, "cmd-1");
  await client.completeCommand("agent-a", "cmd-1", { ok: true });
  await client.failCommand("agent-a", "cmd-1", "failed");
  await client.postAgentEvent({
    id: "evt-1",
    type: "assistant.message",
    agentId: "agent-a",
    sessionId: "sess-1",
    timestamp: "2026-05-04T00:00:00.000Z",
    payload: {
      type: "assistant.message",
      sessionId: "sess-1",
      text: "hello",
      source: { transcriptLine: 1, hookEventName: "Stop" },
    },
  });

  assert.deepEqual(calls, [
    "http://central.test/agents/agent-a/commands/claim",
    "http://central.test/agents/agent-a/commands/cmd-1/complete",
    "http://central.test/agents/agent-a/commands/cmd-1/fail",
    "http://central.test/agent-events",
  ]);
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
