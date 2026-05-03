import { type DomainEvent } from "../../events/domainEvent.ts";
import { type AgentEventInput, type ApprovalDecision, type ApprovalRequestRecord } from "./approval.schemas.ts";

export function agentEventReceivedEvent(event: AgentEventInput): DomainEvent {
  return {
    id: event.eventId,
    type: "agent.event.received",
    aggregateType: "session",
    aggregateId: event.sessionId,
    agentId: event.agentId,
    sessionId: event.sessionId,
    occurredAt: event.occurredAt,
    payload: {
      sourceType: event.type,
      payload: event.payload,
    },
  };
}

export function approvalRequestedEvent(approval: ApprovalRequestRecord): DomainEvent {
  return {
    id: `event:${approval.id}:approval.requested`,
    type: "approval.requested",
    aggregateType: "approval",
    aggregateId: approval.id,
    agentId: approval.agentId,
    sessionId: approval.sessionId,
    occurredAt: approval.requestedAt,
    payload: {
      toolName: approval.toolName,
      question: approval.question,
      choices: approval.choices,
      arguments: approval.arguments,
    },
  };
}

export function approvalRespondedEvent(approval: ApprovalRequestRecord, decision: ApprovalDecision): DomainEvent {
  return {
    id: `event:${approval.id}:approval.responded`,
    type: "approval.responded",
    aggregateType: "approval",
    aggregateId: approval.id,
    agentId: approval.agentId,
    sessionId: approval.sessionId,
    occurredAt: approval.respondedAt ?? new Date().toISOString(),
    payload: {
      approvalRequestId: approval.id,
      decision,
    },
  };
}
