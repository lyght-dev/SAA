import { type CentralStore } from "../persistence/centralStore.ts";
import {
  type AgentCommandRecord,
  type AgentSessionRecord,
  type ApprovalRequestRecord,
  type DomainEventRecord,
  type LocalAgentRecord,
} from "../../modules/schemas.ts";

type SupabaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseQuery<T = unknown> = PromiseLike<SupabaseResult<T>> & {
  upsert(row: Record<string, unknown>, options?: Record<string, unknown>): SupabaseQuery<T>;
  insert(row: Record<string, unknown>): SupabaseQuery<T>;
  select(columns?: string): SupabaseQuery<T>;
  eq(column: string, value: unknown): SupabaseQuery<T>;
  order(column: string, options?: Record<string, unknown>): SupabaseQuery<T>;
  maybeSingle(): SupabaseQuery<T>;
};

export type SupabaseStoreClient = {
  from(table: string): unknown;
};

export class SupabaseCentralStore implements CentralStore {
  private readonly client: SupabaseStoreClient;

  constructor(client: SupabaseStoreClient) {
    this.client = client;
  }

  async getAgent(agentId: string): Promise<LocalAgentRecord | null> {
    const row = await this.single("local_agents", "agent_id", agentId);
    return row ? toAgent(row) : null;
  }

  async saveAgent(agent: LocalAgentRecord): Promise<void> {
    await this.write(this.table("local_agents").upsert(fromAgent(agent), { onConflict: "agent_id" }));
  }

  async listAgents(): Promise<LocalAgentRecord[]> {
    const rows = await this.many(this.table("local_agents").select("*"));
    return rows.map(toAgent);
  }

  async saveSession(session: AgentSessionRecord): Promise<void> {
    await this.write(this.table("agent_sessions").upsert(fromSession(session), { onConflict: "id" }));
  }

  async getSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const row = await this.single("agent_sessions", "id", sessionId);
    return row ? toSession(row) : null;
  }

  async saveCommand(command: AgentCommandRecord): Promise<void> {
    await this.write(this.table("agent_commands").upsert(fromCommand(command), { onConflict: "id" }));
  }

  async getCommand(commandId: string): Promise<AgentCommandRecord | null> {
    const row = await this.single("agent_commands", "id", commandId);
    return row ? toCommand(row) : null;
  }

  async listCommandsForAgent(agentId: string): Promise<AgentCommandRecord[]> {
    const rows = await this.many(
      this.table("agent_commands").select("*").eq("agent_id", agentId).order("queued_at", { ascending: true }),
    );
    return rows.map(toCommand);
  }

  async saveEvent(event: DomainEventRecord): Promise<void> {
    await this.write(this.table("domain_events").upsert(fromEvent(event), { onConflict: "id" }));
  }

  async saveApprovalRequest(request: ApprovalRequestRecord): Promise<void> {
    await this.write(this.table("approval_requests").upsert(fromApproval(request), { onConflict: "id" }));
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequestRecord | null> {
    const row = await this.single("approval_requests", "id", requestId);
    return row ? toApproval(row) : null;
  }

  private async single(table: string, column: string, value: unknown): Promise<Record<string, unknown> | null> {
    const result = await this.table(table).select("*").eq(column, value).maybeSingle();
    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data as Record<string, unknown> | null) ?? null;
  }

  private async many(query: SupabaseQuery): Promise<Record<string, unknown>[]> {
    const result = await query;
    if (result.error) {
      throw new Error(result.error.message);
    }

    return Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : [];
  }

  private async write(query: SupabaseQuery): Promise<void> {
    const result = await query;
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  private table(table: string): SupabaseQuery {
    return this.client.from(table) as SupabaseQuery;
  }
}

function fromAgent(agent: LocalAgentRecord): Record<string, unknown> {
  return {
    agent_id: agent.agentId,
    node_name: agent.nodeName,
    hostname: agent.hostname,
    capabilities: agent.capabilities,
    status: agent.status,
    registered_at: agent.registeredAt,
    last_seen_at: agent.lastSeenAt,
  };
}

function toAgent(row: Record<string, unknown>): LocalAgentRecord {
  return {
    agentId: String(row.agent_id),
    nodeName: String(row.node_name),
    hostname: String(row.hostname),
    capabilities: row.capabilities as LocalAgentRecord["capabilities"],
    status: row.status as LocalAgentRecord["status"],
    registeredAt: String(row.registered_at),
    lastSeenAt: String(row.last_seen_at),
  };
}

function fromSession(session: AgentSessionRecord): Record<string, unknown> {
  return {
    id: session.id,
    agent_id: session.agentId,
    conversation_id: session.conversationId,
    status: session.status,
    binding: session.binding,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

function toSession(row: Record<string, unknown>): AgentSessionRecord {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    conversationId: String(row.conversation_id),
    status: row.status as AgentSessionRecord["status"],
    binding: row.binding as AgentSessionRecord["binding"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function fromCommand(command: AgentCommandRecord): Record<string, unknown> {
  return {
    id: command.id,
    agent_id: command.agentId,
    session_id: command.sessionId,
    type: command.type,
    status: command.status,
    payload: command.payload,
    queued_at: command.queuedAt,
    lease_owner: command.leaseOwner,
    lease_expires_at: command.leaseExpiresAt,
    completed_at: command.completedAt,
    error: command.error,
    result: command.result,
  };
}

function toCommand(row: Record<string, unknown>): AgentCommandRecord {
  const command: AgentCommandRecord = {
    id: String(row.id),
    agentId: String(row.agent_id),
    sessionId: String(row.session_id),
    type: row.type as AgentCommandRecord["type"],
    status: row.status as AgentCommandRecord["status"],
    payload: row.payload as AgentCommandRecord["payload"],
    queuedAt: String(row.queued_at),
  };

  if (row.lease_owner) command.leaseOwner = String(row.lease_owner);
  if (row.lease_expires_at) command.leaseExpiresAt = String(row.lease_expires_at);
  if (row.completed_at) command.completedAt = String(row.completed_at);
  if (row.error) command.error = String(row.error);
  if (row.result) command.result = row.result as Record<string, unknown>;
  return command;
}

function fromEvent(event: DomainEventRecord): Record<string, unknown> {
  return {
    id: event.id,
    agent_id: event.agentId,
    session_id: event.sessionId,
    type: event.type,
    occurred_at: event.occurredAt,
    payload: event.payload,
  };
}

function fromApproval(request: ApprovalRequestRecord): Record<string, unknown> {
  return {
    id: request.id,
    session_id: request.sessionId,
    agent_id: request.agentId,
    status: request.status,
    tool_name: request.toolName,
    question: request.question,
    choices: request.choices,
    arguments: request.arguments,
    requested_at: request.requestedAt,
    responded_at: request.respondedAt,
  };
}

function toApproval(row: Record<string, unknown>): ApprovalRequestRecord {
  const approval: ApprovalRequestRecord = {
    id: String(row.id),
    sessionId: String(row.session_id),
    agentId: String(row.agent_id),
    status: row.status as ApprovalRequestRecord["status"],
    toolName: String(row.tool_name),
    question: String(row.question),
    choices: row.choices as ApprovalRequestRecord["choices"],
    arguments: row.arguments as Record<string, unknown>,
    requestedAt: String(row.requested_at),
  };

  if (row.responded_at) approval.respondedAt = String(row.responded_at);
  return approval;
}
