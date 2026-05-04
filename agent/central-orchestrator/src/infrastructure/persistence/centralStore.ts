import {
  type AgentCommandRecord,
  type AgentSessionRecord,
  type ApprovalRequestRecord,
  type DomainEventRecord,
  type LocalAgentRecord,
} from "../../modules/schemas.ts";

export type CentralStore = {
  getAgent(agentId: string): Promise<LocalAgentRecord | null>;
  saveAgent(agent: LocalAgentRecord): Promise<void>;
  listAgents(): Promise<LocalAgentRecord[]>;
  saveSession(session: AgentSessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<AgentSessionRecord | null>;
  saveCommand(command: AgentCommandRecord): Promise<void>;
  getCommand(commandId: string): Promise<AgentCommandRecord | null>;
  listCommandsForAgent(agentId: string): Promise<AgentCommandRecord[]>;
  saveEvent(event: DomainEventRecord): Promise<void>;
  saveApprovalRequest(request: ApprovalRequestRecord): Promise<void>;
  getApprovalRequest(requestId: string): Promise<ApprovalRequestRecord | null>;
};
