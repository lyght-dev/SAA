import { type CentralStore } from "./centralStore.ts";
import {
  type AgentCommandRecord,
  type AgentSessionRecord,
  type ApprovalRequestRecord,
  type DomainEventRecord,
  type LocalAgentRecord,
} from "../../modules/schemas.ts";

export class InMemoryCentralStore implements CentralStore {
  private readonly agents = new Map<string, LocalAgentRecord>();
  private readonly sessions = new Map<string, AgentSessionRecord>();
  private readonly commands = new Map<string, AgentCommandRecord>();
  private readonly events = new Map<string, DomainEventRecord>();
  private readonly approvals = new Map<string, ApprovalRequestRecord>();

  async getAgent(agentId: string): Promise<LocalAgentRecord | null> {
    return cloneOrNull(this.agents.get(agentId));
  }

  async saveAgent(agent: LocalAgentRecord): Promise<void> {
    this.agents.set(agent.agentId, clone(agent));
  }

  async listAgents(): Promise<LocalAgentRecord[]> {
    return [...this.agents.values()].map(clone);
  }

  async saveSession(session: AgentSessionRecord): Promise<void> {
    this.sessions.set(session.id, clone(session));
  }

  async getSession(sessionId: string): Promise<AgentSessionRecord | null> {
    return cloneOrNull(this.sessions.get(sessionId));
  }

  async saveCommand(command: AgentCommandRecord): Promise<void> {
    this.commands.set(command.id, clone(command));
  }

  async getCommand(commandId: string): Promise<AgentCommandRecord | null> {
    return cloneOrNull(this.commands.get(commandId));
  }

  async listCommandsForAgent(agentId: string): Promise<AgentCommandRecord[]> {
    return [...this.commands.values()]
      .filter((command) => command.agentId === agentId)
      .map(clone);
  }

  async saveEvent(event: DomainEventRecord): Promise<void> {
    this.events.set(event.id, clone(event));
  }

  async saveApprovalRequest(request: ApprovalRequestRecord): Promise<void> {
    this.approvals.set(request.id, clone(request));
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequestRecord | null> {
    return cloneOrNull(this.approvals.get(requestId));
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function cloneOrNull<T>(value: T | undefined): T | null {
  return value ? clone(value) : null;
}
