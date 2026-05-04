import { type DomainEvent } from "../../domain/schemas.ts";
import { toOutboundEnvelope } from "../../domain/envelope.ts";
import { type CentralHttpClient } from "./centralHttpClient.ts";

export class HttpCentralEventSink {
  private readonly agentId: string;
  private readonly client: CentralHttpClient;

  constructor(agentId: string, client: CentralHttpClient) {
    this.agentId = agentId;
    this.client = client;
  }

  async send(event: DomainEvent): Promise<void> {
    await this.client.postAgentEvent(toOutboundEnvelope(this.agentId, event));
  }
}
