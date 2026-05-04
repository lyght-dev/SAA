export type SupabaseRealtimeClient = {
  channel(topic: string): {
    on(
      type: "broadcast",
      filter: { event: string },
      handler: (payload: unknown) => void | Promise<void>,
    ): {
      subscribe(): unknown;
    };
  };
};

export type SupabaseCommandSubscriberOptions = {
  agentId: string;
  onCommandCreated(): void | Promise<void>;
};

export class SupabaseCommandSubscriber {
  private readonly client: SupabaseRealtimeClient;
  private readonly options: SupabaseCommandSubscriberOptions;

  constructor(client: SupabaseRealtimeClient, options: SupabaseCommandSubscriberOptions) {
    this.client = client;
    this.options = options;
  }

  start(): void {
    this.client
      .channel(`agent:${this.options.agentId}`)
      .on("broadcast", { event: "command.created" }, () => this.options.onCommandCreated())
      .subscribe();
  }
}
