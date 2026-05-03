import { type DomainEvent } from "./domainEvent.ts";
import { type EventBus } from "./eventBus.ts";
import { EventStore } from "./eventStore.ts";

export class EventProjector {
  private readonly eventStore: EventStore;
  private readonly eventBus: EventBus;

  constructor(eventStore: EventStore, eventBus: EventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
  }

  async record(event: DomainEvent): Promise<void> {
    await this.eventStore.append(event);
    await this.eventBus.publish(event);
  }
}
