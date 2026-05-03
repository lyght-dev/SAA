import { EventProjector } from "../../events/eventProjector.ts";
import { type CentralStore } from "../../infrastructure/persistence/centralStore.ts";
import { type Clock } from "../../shared/clock.ts";
import { AgentSession, type CreateSessionInput } from "./session.domain.ts";
import { sessionBoundEvent } from "./session.events.ts";
import { type AgentSessionRecord } from "./session.schemas.ts";

export class SessionService {
  private readonly store: CentralStore;
  private readonly events: EventProjector;
  private readonly now: Clock;

  constructor(store: CentralStore, events: EventProjector, now: Clock) {
    this.store = store;
    this.events = events;
    this.now = now;
  }

  async create(input: CreateSessionInput): Promise<AgentSessionRecord> {
    const agent = await this.store.getAgent(input.agentId);
    if (!agent || agent.status !== "online") {
      throw new Error(`LocalAgent is not online: ${input.agentId}`);
    }

    const session = AgentSession.create(input, this.now()).snapshot();
    await this.store.saveSession(session);
    await this.events.record(sessionBoundEvent(session));
    return session;
  }
}
