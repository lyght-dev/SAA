import assert from "node:assert/strict";
import { test } from "vitest";
import { EventProjector } from "../../events/eventProjector.ts";
import { EventStore } from "../../events/eventStore.ts";
import { InMemoryEventBus } from "../../events/inMemoryEventBus.ts";
import { InMemoryCentralStore } from "../../infrastructure/persistence/inMemoryCentralStore.ts";
import { RecordingRealtimeNotifier } from "../../infrastructure/realtime/recordingRealtimeNotifier.ts";
import { AgentService } from "../agents/agent.service.ts";
import { SessionService } from "../sessions/session.service.ts";
import { CommandService } from "./command.service.ts";

test("routes codex messages only to the bound LocalAgent via command.queued event", async () => {
  const store = new InMemoryCentralStore();
  const notifier = new RecordingRealtimeNotifier();
  const events = new EventProjector(new EventStore(store), new InMemoryEventBus(notifier));
  const now = () => "2026-05-03T00:00:00.000Z";
  const agents = new AgentService(store, events, now);
  const sessions = new SessionService(store, events, now);
  const commands = new CommandService(store, events, now);

  await agents.register({
    type: "agent.register",
    agentId: "agent-b",
    nodeName: "linux",
    hostname: "linux",
    capabilities: { codex: true, zellij: true },
  });

  const session = await sessions.create({
    agentId: "agent-b",
    sessionName: "saa-agent",
    paneId: "terminal_7",
    conversationId: "discord-thread-1",
  });
  const command = await commands.sendCodexMessage(session.id, "내 이름이 뭐야?");

  assert.equal(command.agentId, "agent-b");
  assert.equal(command.payload.type, "codex.message.send");
  assert.equal(command.payload.paneId, "terminal_7");
  assert.deepEqual(notifier.messages, [
    {
      topic: "agent:agent-b",
      event: "command.created",
      payload: { commandId: command.id },
    },
  ]);
});
