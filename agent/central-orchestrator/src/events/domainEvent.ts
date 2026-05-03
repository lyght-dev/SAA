import { type DomainEventRecord } from "../modules/schemas.ts";

export type DomainEvent = DomainEventRecord & {
  aggregateType: "agent" | "session" | "command" | "approval";
  aggregateId: string;
};

export function toStoredEvent(event: DomainEvent): DomainEventRecord {
  return {
    id: event.id,
    agentId: event.agentId,
    sessionId: event.sessionId,
    type: event.type,
    occurredAt: event.occurredAt,
    payload: event.payload,
  };
}
