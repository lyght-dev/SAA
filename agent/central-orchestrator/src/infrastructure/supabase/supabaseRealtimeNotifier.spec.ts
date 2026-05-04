import assert from "node:assert/strict";
import { test } from "vitest";
import { SupabaseRealtimeNotifier } from "./supabaseRealtimeNotifier.ts";

test("sends realtime broadcast through Supabase channel", async () => {
  const client = new FakeRealtimeClient();
  const notifier = new SupabaseRealtimeNotifier(client);

  await notifier.notify({
    topic: "agent:agent-a",
    event: "command.created",
    payload: { commandId: "cmd-1" },
  });

  assert.deepEqual(client.sent, [
    {
      topic: "agent:agent-a",
      message: {
        type: "broadcast",
        event: "command.created",
        payload: { commandId: "cmd-1" },
      },
    },
  ]);
});

class FakeRealtimeClient {
  readonly sent: Array<{ topic: string; message: unknown }> = [];

  channel(topic: string): { send: (message: unknown) => Promise<unknown> } {
    return {
      send: async (message: unknown) => {
        this.sent.push({ topic, message });
        return "ok";
      },
    };
  }
}
