import { type OutboundEnvelope } from "../../domain/schemas.ts";

export type CentralHttpClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
  authToken?: string;
};

export type RegisterAgentInput = {
  agentId: string;
  nodeName: string;
  hostname: string;
};

export type CentralCommand = {
  id: string;
  payload: {
    type: string;
    [key: string]: unknown;
  };
};

export class CentralHttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly authToken: string | undefined;

  constructor(options: CentralHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? fetch;
    this.authToken = options.authToken;
  }

  async registerAgent(input: RegisterAgentInput): Promise<void> {
    await this.post("/agents/register", {
      type: "agent.register",
      agentId: input.agentId,
      nodeName: input.nodeName,
      hostname: input.hostname,
      capabilities: { codex: true, zellij: true },
    });
  }

  async claimCommand(agentId: string): Promise<CentralCommand | null> {
    const response = await this.post<{ command: CentralCommand | null }>(`/agents/${agentId}/commands/claim`, {
      leaseMs: 30_000,
    });
    return response.command;
  }

  async completeCommand(agentId: string, commandId: string, result: Record<string, unknown>): Promise<void> {
    await this.post(`/agents/${agentId}/commands/${commandId}/complete`, { result });
  }

  async failCommand(agentId: string, commandId: string, error: string): Promise<void> {
    await this.post(`/agents/${agentId}/commands/${commandId}/fail`, { error });
  }

  async postAgentEvent(envelope: OutboundEnvelope): Promise<void> {
    await this.post("/agent-events", {
      eventId: envelope.id,
      agentId: envelope.agentId,
      sessionId: envelope.sessionId,
      type: envelope.payload.type,
      occurredAt: envelope.timestamp,
      payload: envelope.payload,
    });
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Central request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.authToken) {
      headers.authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }
}
