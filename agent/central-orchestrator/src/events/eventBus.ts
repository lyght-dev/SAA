import { type DomainEvent } from "./domainEvent.ts";

export type EventBus = {
  publish(event: DomainEvent): Promise<void>;
};
