import assert from "node:assert/strict";
import { test } from "vitest";
import app, { createApp } from "./app.ts";
import { InMemoryCentralStore } from "./infrastructure/persistence/inMemoryCentralStore.ts";
import { RecordingRealtimeNotifier } from "./infrastructure/realtime/recordingRealtimeNotifier.ts";

test("creates a serverless Hono app without starting an HTTP listener", async () => {
  const app = createApp({
    store: new InMemoryCentralStore(),
    notifier: new RecordingRealtimeNotifier(),
  });

  const response = await app.request("/healthz");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("exports a default serverless fetch app", async () => {
  const response = await app.request("/healthz");
  assert.equal(response.status, 200);
});

test("exposes admin-only orchestration HTTP routes from the serverless app", async () => {
  const notifier = new RecordingRealtimeNotifier();
  const app = createApp({
    store: new InMemoryCentralStore(),
    notifier,
    now: () => "2026-05-03T00:00:00.000Z",
  });

  const registerResponse = await app.request("/agents/register", {
    method: "POST",
    body: JSON.stringify({
      type: "agent.register",
      agentId: "agent-a",
      nodeName: "macbook",
      hostname: "macbook",
      capabilities: { codex: true, zellij: true },
    }),
  });
  assert.equal(registerResponse.status, 200);

  const agentsResponse = await app.request("/agents");
  assert.equal(agentsResponse.status, 200);
  assert.deepEqual(await agentsResponse.json(), {
    agents: [
      {
        agentId: "agent-a",
        nodeName: "macbook",
        hostname: "macbook",
        capabilities: { codex: true, zellij: true },
        status: "online",
        registeredAt: "2026-05-03T00:00:00.000Z",
        lastSeenAt: "2026-05-03T00:00:00.000Z",
      },
    ],
  });

  const sessionResponse = await app.request("/sessions", {
    method: "POST",
    body: JSON.stringify({
      agentId: "agent-a",
      sessionName: "saa-agent",
      paneId: "terminal_1",
      conversationId: "discord-thread-1",
    }),
  });
  assert.equal(sessionResponse.status, 200);
  const { session } = await sessionResponse.json();

  const commandResponse = await app.request(`/sessions/${session.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message: "hello" }),
  });
  assert.equal(commandResponse.status, 200);
  const { command } = await commandResponse.json();
  assert.equal(command.agentId, "agent-a");
  assert.equal(command.payload.message, "hello");
  assert.deepEqual(notifier.messages.at(-1), {
    topic: "agent:agent-a",
    event: "command.created",
    payload: { commandId: command.id },
  });
});

test("records approval events and accepts admin approval responses over HTTP", async () => {
  const app = createApp({
    store: new InMemoryCentralStore(),
    notifier: new RecordingRealtimeNotifier(),
    now: () => "2026-05-03T00:00:00.000Z",
  });

  await app.request("/agents/register", {
    method: "POST",
    body: JSON.stringify({
      type: "agent.register",
      agentId: "agent-a",
      nodeName: "macbook",
      hostname: "macbook",
      capabilities: { codex: true, zellij: true },
    }),
  });
  const sessionResponse = await app.request("/sessions", {
    method: "POST",
    body: JSON.stringify({
      agentId: "agent-a",
      sessionName: "saa-agent",
      paneId: "terminal_1",
      conversationId: "discord-thread-1",
    }),
  });
  const { session } = await sessionResponse.json();

  const eventResponse = await app.request("/agent-events", {
    method: "POST",
    body: JSON.stringify({
      eventId: "evt-approval",
      agentId: "agent-a",
      sessionId: session.id,
      type: "approval.requested",
      occurredAt: "2026-05-03T00:00:00.000Z",
      payload: {
        requestId: "approval-1",
        toolName: "Bash",
        question: "Allow command?",
        choices: ["allow", "deny"],
        arguments: { command: "pnpm test" },
      },
    }),
  });
  assert.equal(eventResponse.status, 200);

  const approvalResponse = await app.request("/approvals/approval-1/respond", {
    method: "POST",
    body: JSON.stringify({ decision: "deny" }),
  });
  assert.equal(approvalResponse.status, 200);
  const { approval, command } = await approvalResponse.json();
  assert.equal(approval.status, "denied");
  assert.equal(command.payload.type, "approval.respond");
  assert.equal(command.payload.decision, "deny");
});
