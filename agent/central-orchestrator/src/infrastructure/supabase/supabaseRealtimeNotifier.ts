import { type RealtimeMessage, type RealtimeNotifier } from "../realtime/realtimeNotifier.ts";

export type SupabaseRealtimeClient = {
  channel(topic: string): {
    send(message: { type: "broadcast"; event: string; payload: Record<string, unknown> }): Promise<unknown>;
  };
};

export class SupabaseRealtimeNotifier implements RealtimeNotifier {
  private readonly client: SupabaseRealtimeClient;

  constructor(client: SupabaseRealtimeClient) {
    this.client = client;
  }

  async notify(message: RealtimeMessage): Promise<void> {
    await this.client.channel(message.topic).send({
      type: "broadcast",
      event: message.event,
      payload: message.payload,
    });
  }
}
