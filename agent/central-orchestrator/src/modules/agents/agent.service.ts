import * as v from "valibot";
import { EventProjector } from "../../events/eventProjector.ts";
import { type CentralStore } from "../../infrastructure/persistence/centralStore.ts";
import { type Clock } from "../../shared/clock.ts";
import { LocalAgent } from "./agent.domain.ts";
import { agentRegisteredEvent } from "./agent.events.ts";
import {
  AgentRegisterRequestSchema,
  type AgentRegisterRequest,
  type LocalAgentRecord,
} from "./agent.schemas.ts";

export class AgentService {
  private readonly store: CentralStore;
  private readonly events: EventProjector;
  private readonly now: Clock;

  constructor(store: CentralStore, events: EventProjector, now: Clock) {
    this.store = store;
    this.events = events;
    this.now = now;
  }

  async register(input: AgentRegisterRequest): Promise<LocalAgentRecord> {
    const parsed = v.parse(AgentRegisterRequestSchema, input);
    const current = await this.store.getAgent(parsed.agentId);
    const agent = current ? LocalAgent.from(current).refresh(parsed, this.now()) : LocalAgent.register(parsed, this.now());
    const record = agent.snapshot();

    await this.store.saveAgent(record);
    await this.events.record(agentRegisteredEvent(record));
    return record;
  }

  async discover(): Promise<LocalAgentRecord[]> {
    const agents = await this.store.listAgents();
    return agents.filter(({ status }) => status === "online");
  }
}
