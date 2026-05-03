import { type DomainEvent, toStoredEvent } from "./domainEvent.ts";
import { type CentralStore } from "../infrastructure/persistence/centralStore.ts";

export class EventStore {
  private readonly store: CentralStore;

  constructor(store: CentralStore) {
    this.store = store;
  }

  async append(event: DomainEvent): Promise<void> {
    await this.store.saveEvent(toStoredEvent(event));
  }
}
