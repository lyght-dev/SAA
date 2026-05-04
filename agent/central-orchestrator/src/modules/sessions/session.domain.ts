import { type AgentSessionRecord, type SessionBinding } from "./session.schemas.ts";

export type CreateSessionInput = {
  agentId: string;
  sessionName: string;
  paneId: string;
  conversationId: string;
  codexSessionId?: string;
};

export class AgentSession {
  private readonly record: AgentSessionRecord;

  private constructor(record: AgentSessionRecord) {
    this.record = record;
  }

  static create(input: CreateSessionInput, now: string): AgentSession {
    const binding: SessionBinding = {
      sessionName: input.sessionName,
      paneId: input.paneId,
    };
    if (input.codexSessionId) {
      binding.codexSessionId = input.codexSessionId;
    }

    return new AgentSession({
      id: `sess_${crypto.randomUUID()}`,
      agentId: input.agentId,
      conversationId: input.conversationId,
      status: "active",
      binding,
      createdAt: now,
      updatedAt: now,
    });
  }

  static from(record: AgentSessionRecord): AgentSession {
    return new AgentSession(record);
  }

  waitForApproval(now: string): AgentSession {
    return new AgentSession({ ...this.record, status: "waiting_approval", updatedAt: now });
  }

  snapshot(): AgentSessionRecord {
    return {
      ...this.record,
      binding: { ...this.record.binding },
    };
  }
}
