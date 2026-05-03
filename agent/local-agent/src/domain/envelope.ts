import { randomUUID } from "node:crypto";
import * as v from "valibot";
import { type DomainEvent, OutboundEnvelopeSchema } from "./schemas.ts";

export function toOutboundEnvelope(agentId: string, event: DomainEvent): v.InferOutput<typeof OutboundEnvelopeSchema> {
  return v.parse(OutboundEnvelopeSchema, {
    id: `evt_${randomUUID().replaceAll("-", "")}`,
    type: event.type,
    agentId,
    sessionId: event.sessionId,
    turnId: "turnId" in event ? event.turnId : undefined,
    timestamp: new Date().toISOString(),
    payload: event,
  });
}
