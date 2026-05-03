import { type AgentRegisterRequest, type LocalAgentRecord } from "./agent.schemas.ts";

export class LocalAgent {
  private readonly record: LocalAgentRecord;

  private constructor(record: LocalAgentRecord) {
    this.record = record;
  }

  static register(input: AgentRegisterRequest, now: string): LocalAgent {
    return new LocalAgent({
      agentId: input.agentId,
      nodeName: input.nodeName,
      hostname: input.hostname,
      capabilities: input.capabilities,
      status: "online",
      registeredAt: now,
      lastSeenAt: now,
    });
  }

  static from(record: LocalAgentRecord): LocalAgent {
    return new LocalAgent(record);
  }

  refresh(input: AgentRegisterRequest, now: string): LocalAgent {
    return new LocalAgent({
      ...this.record,
      nodeName: input.nodeName,
      hostname: input.hostname,
      capabilities: input.capabilities,
      status: "online",
      lastSeenAt: now,
    });
  }

  heartbeat(now: string): LocalAgent {
    return new LocalAgent({
      ...this.record,
      status: "online",
      lastSeenAt: now,
    });
  }

  snapshot(): LocalAgentRecord {
    return { ...this.record, capabilities: { ...this.record.capabilities } };
  }
}
