import { randomUUID } from "node:crypto";
import {
  type AgentCommandPayload,
  type AgentCommandRecord,
  type AgentSessionRecord,
  type ApprovalDecision,
} from "./command.schemas.ts";

export class AgentCommand {
  private readonly record: AgentCommandRecord;

  private constructor(record: AgentCommandRecord) {
    this.record = record;
  }

  static codexMessage(session: AgentSessionRecord, message: string, now: string): AgentCommand {
    const payload: AgentCommandPayload = {
      type: "codex.message.send",
      sessionName: session.binding.sessionName,
      paneId: session.binding.paneId,
      message,
      targetId: session.conversationId,
    };
    if (session.binding.codexSessionId) {
      payload.codexSessionId = session.binding.codexSessionId;
    }

    return AgentCommand.queue(session, payload, now);
  }

  static approvalResponse(session: AgentSessionRecord, approvalRequestId: string, decision: ApprovalDecision, now: string): AgentCommand {
    return AgentCommand.queue(
      session,
      {
        type: "approval.respond",
        approvalRequestId,
        decision,
      },
      now,
    );
  }

  private static queue(session: AgentSessionRecord, payload: AgentCommandPayload, now: string): AgentCommand {
    return new AgentCommand({
      id: `cmd_${randomUUID()}`,
      agentId: session.agentId,
      sessionId: session.id,
      type: payload.type,
      status: "queued",
      payload,
      queuedAt: now,
    });
  }

  snapshot(): AgentCommandRecord {
    return {
      ...this.record,
      payload: { ...this.record.payload },
    };
  }
}
