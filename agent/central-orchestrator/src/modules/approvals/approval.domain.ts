import { type AgentEventInput, type ApprovalDecision, type ApprovalRequestRecord } from "./approval.schemas.ts";

export class ApprovalRequest {
  private readonly record: ApprovalRequestRecord;

  private constructor(record: ApprovalRequestRecord) {
    this.record = record;
  }

  static fromAgentEvent(event: AgentEventInput): ApprovalRequest | null {
    if (event.type !== "approval.requested") {
      return null;
    }

    const { payload } = event;
    if (typeof payload.requestId !== "string" || typeof payload.toolName !== "string" || typeof payload.question !== "string") {
      return null;
    }

    return new ApprovalRequest({
      id: payload.requestId,
      sessionId: event.sessionId,
      agentId: event.agentId,
      status: "pending",
      toolName: payload.toolName,
      question: payload.question,
      choices: ["allow", "deny"],
      arguments: getArguments(payload.arguments),
      requestedAt: event.occurredAt,
    });
  }

  static from(record: ApprovalRequestRecord): ApprovalRequest {
    return new ApprovalRequest(record);
  }

  respond(decision: ApprovalDecision, now: string): ApprovalRequest {
    return new ApprovalRequest({
      ...this.record,
      status: decision === "allow" ? "approved" : "denied",
      respondedAt: now,
    });
  }

  snapshot(): ApprovalRequestRecord {
    return {
      ...this.record,
      arguments: { ...this.record.arguments },
    };
  }
}

function getArguments(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
