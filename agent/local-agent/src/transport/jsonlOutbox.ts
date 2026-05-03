import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as v from "valibot";
import { type DomainEvent, OutboundEnvelopeSchema } from "../domain/schemas.ts";
import { toOutboundEnvelope } from "../domain/envelope.ts";

export class JsonlOutboxTransport {
  private readonly outboxPath: string;
  private readonly agentId: string;

  constructor(outboxPath: string, agentId: string) {
    this.outboxPath = outboxPath;
    this.agentId = agentId;
  }

  send(event: DomainEvent): void {
    const envelope = toOutboundEnvelope(this.agentId, event);
    v.parse(OutboundEnvelopeSchema, envelope);
    mkdirSync(dirname(this.outboxPath), { recursive: true });
    appendFileSync(this.outboxPath, `${JSON.stringify(envelope)}\n`, "utf8");
  }
}
