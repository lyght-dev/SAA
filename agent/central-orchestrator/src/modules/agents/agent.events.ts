import { type DomainEvent } from "../../events/domainEvent.ts";
import { type LocalAgentRecord } from "./agent.schemas.ts";

export function agentRegisteredEvent(agent: LocalAgentRecord): DomainEvent {
  return {
    id: `event:${agent.agentId}:${agent.lastSeenAt}`,
    type: "agent.registered",
    aggregateType: "agent",
    aggregateId: agent.agentId,
    agentId: agent.agentId,
    sessionId: "system",
    occurredAt: agent.lastSeenAt,
    payload: {
      nodeName: agent.nodeName,
      hostname: agent.hostname,
      capabilities: agent.capabilities,
    },
  };
}
