import { type DomainEvent } from "../../events/domainEvent.ts";
import { type AgentSessionRecord } from "./session.schemas.ts";

export function sessionBoundEvent(session: AgentSessionRecord): DomainEvent {
  return {
    id: `event:${session.id}:session.bound`,
    type: "session.bound",
    aggregateType: "session",
    aggregateId: session.id,
    agentId: session.agentId,
    sessionId: session.id,
    occurredAt: session.createdAt,
    payload: {
      binding: session.binding,
      conversationId: session.conversationId,
    },
  };
}
