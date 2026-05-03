import * as v from "valibot";

export const CapabilitiesSchema = v.object({
  codex: v.boolean(),
  zellij: v.boolean(),
});

export const AgentRegisterRequestSchema = v.object({
  type: v.literal("agent.register"),
  agentId: v.string(),
  nodeName: v.string(),
  hostname: v.string(),
  capabilities: CapabilitiesSchema,
});

export const AgentEventSchema = v.object({
  eventId: v.string(),
  agentId: v.string(),
  sessionId: v.string(),
  type: v.string(),
  occurredAt: v.string(),
  payload: v.record(v.string(), v.unknown()),
});

export type Capabilities = v.InferOutput<typeof CapabilitiesSchema>;
export type AgentRegisterRequest = v.InferOutput<typeof AgentRegisterRequestSchema>;
export type AgentEventInput = v.InferOutput<typeof AgentEventSchema>;

export type AgentStatus = "online" | "stale" | "offline";
export type SessionStatus = "created" | "bound" | "active" | "waiting_approval" | "completed" | "agent_offline" | "failed";
export type CommandStatus = "queued" | "leased" | "acked" | "completed" | "expired" | "failed";
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired" | "cancelled";
export type ApprovalDecision = "allow" | "deny";

export type LocalAgentRecord = {
  agentId: string;
  nodeName: string;
  hostname: string;
  capabilities: Capabilities;
  status: AgentStatus;
  registeredAt: string;
  lastSeenAt: string;
};

export type SessionBinding = {
  sessionName: string;
  paneId: string;
  codexSessionId?: string;
};

export type AgentSessionRecord = {
  id: string;
  agentId: string;
  conversationId: string;
  status: SessionStatus;
  binding: SessionBinding;
  createdAt: string;
  updatedAt: string;
};

export type CodexMessagePayload = {
  type: "codex.message.send";
  sessionName: string;
  paneId: string;
  message: string;
  targetId?: string;
  codexSessionId?: string;
};

export type ApprovalRespondPayload = {
  type: "approval.respond";
  approvalRequestId: string;
  decision: ApprovalDecision;
};

export type AgentCommandPayload = CodexMessagePayload | ApprovalRespondPayload;

export type AgentCommandRecord = {
  id: string;
  agentId: string;
  sessionId: string;
  type: AgentCommandPayload["type"];
  status: CommandStatus;
  payload: AgentCommandPayload;
  queuedAt: string;
};

export type ApprovalRequestRecord = {
  id: string;
  sessionId: string;
  agentId: string;
  status: ApprovalStatus;
  toolName: string;
  question: string;
  choices: ["allow", "deny"];
  arguments: Record<string, unknown>;
  requestedAt: string;
  respondedAt?: string;
};

export type DomainEventRecord = {
  id: string;
  agentId: string;
  sessionId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};
