import assert from "node:assert/strict";
import { test } from "vitest";
import { EventProjector } from "../../events/eventProjector.ts";
import { EventStore } from "../../events/eventStore.ts";
import { InMemoryEventBus } from "../../events/inMemoryEventBus.ts";
import { InMemoryCentralStore } from "../../infrastructure/persistence/inMemoryCentralStore.ts";
import { RecordingRealtimeNotifier } from "../../infrastructure/realtime/recordingRealtimeNotifier.ts";
import { AgentService } from "./agent.service.ts";

test("registers LocalAgent boot info and discovery returns online nodes", async () => {
  const store = new InMemoryCentralStore();
  const notifier = new RecordingRealtimeNotifier();
  const events = new EventProjector(new EventStore(store), new InMemoryEventBus(notifier));
  const agents = new AgentService(store, events, () => "2026-05-03T00:00:00.000Z");

  await agents.register({
    type: "agent.register",
    agentId: "agent-a",
    nodeName: "macbook",
    hostname: "lyght-macbook",
    capabilities: { codex: true, zellij: true },
  });

  await agents.register({
    type: "agent.register",
    agentId: "agent-a",
    nodeName: "macbook-renamed",
    hostname: "lyght-macbook",
    capabilities: { codex: true, zellij: true },
  });

  const discovered = await agents.discover();
  assert.deepEqual(
    discovered.map(({ agentId, nodeName, status }) => ({ agentId, nodeName, status })),
    [{ agentId: "agent-a", nodeName: "macbook-renamed", status: "online" }],
  );
});
