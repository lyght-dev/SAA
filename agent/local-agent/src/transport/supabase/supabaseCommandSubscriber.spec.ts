import assert from "node:assert/strict";
import { test } from "vitest";
import { SupabaseCommandSubscriber } from "./supabaseCommandSubscriber.ts";

test("subscribes to agent command.created broadcasts and ticks the worker", () => {
  let tickCount = 0;
  const client = new FakeSupabaseRealtimeClient();
  const subscriber = new SupabaseCommandSubscriber(client, {
    agentId: "agent-a",
    onCommandCreated: () => {
      tickCount += 1;
    },
  });

  subscriber.start();
  client.emit("command.created", { commandId: "cmd-1" });

  assert.equal(client.topic, "agent:agent-a");
  assert.equal(tickCount, 1);
});

class FakeSupabaseRealtimeClient {
  topic = "";
  private handler: ((payload: unknown) => void) | null = null;

  channel(topic: string) {
    this.topic = topic;
    return {
      on: (_type: "broadcast", _filter: { event: string }, handler: (payload: unknown) => void) => {
        this.handler = handler;
        return this.channel(this.topic);
      },
      subscribe: () => undefined,
    };
  }

  emit(_event: string, _payload: unknown): void {
    this.handler?.(_payload);
  }
}
