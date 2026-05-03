import { type DomainEvent } from "./domainEvent.ts";
import { type EventBus } from "./eventBus.ts";
import { type RealtimeNotifier } from "../infrastructure/realtime/realtimeNotifier.ts";

export class InMemoryEventBus implements EventBus {
  private readonly notifier: RealtimeNotifier;

  constructor(notifier: RealtimeNotifier) {
    this.notifier = notifier;
  }

  async publish(event: DomainEvent): Promise<void> {
    if (event.type !== "command.queued") {
      return;
    }

    await this.notifier.notify({
      topic: `agent:${event.agentId}`,
      event: "command.created",
      payload: { commandId: event.aggregateId },
    });
  }
}
