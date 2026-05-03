import { type DomainEvent } from "../../events/domainEvent.ts";
import { type AgentCommandRecord } from "./command.schemas.ts";

export function commandQueuedEvent(command: AgentCommandRecord): DomainEvent {
  return {
    id: `event:${command.id}:command.queued`,
    type: "command.queued",
    aggregateType: "command",
    aggregateId: command.id,
    agentId: command.agentId,
    sessionId: command.sessionId,
    occurredAt: command.queuedAt,
    payload: {
      commandType: command.type,
      payload: command.payload,
    },
  };
}
