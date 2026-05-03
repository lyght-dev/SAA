import * as v from "valibot";
import { EventProjector } from "../../events/eventProjector.ts";
import { type CentralStore } from "../../infrastructure/persistence/centralStore.ts";
import { type Clock } from "../../shared/clock.ts";
import { AgentSession } from "../sessions/session.domain.ts";
import { CommandService } from "../commands/command.service.ts";
import { ApprovalRequest } from "./approval.domain.ts";
import { agentEventReceivedEvent, approvalRequestedEvent, approvalRespondedEvent } from "./approval.events.ts";
import {
  AgentEventSchema,
  type AgentEventInput,
  type ApprovalDecision,
  type ApprovalRequestRecord,
} from "../schemas.ts";

export class ApprovalService {
  private readonly store: CentralStore;
  private readonly events: EventProjector;
  private readonly commands: CommandService;
  private readonly now: Clock;

  constructor(store: CentralStore, events: EventProjector, commands: CommandService, now: Clock) {
    this.store = store;
    this.events = events;
    this.commands = commands;
    this.now = now;
  }

  async recordAgentEvent(input: AgentEventInput): Promise<void> {
    const event = v.parse(AgentEventSchema, input);
    await this.events.record(agentEventReceivedEvent(event));

    const approval = ApprovalRequest.fromAgentEvent(event);
    if (!approval) {
      return;
    }

    const record = approval.snapshot();
    await this.store.saveApprovalRequest(record);
    await this.events.record(approvalRequestedEvent(record));

    const session = AgentSession.from(await this.getSession(event.sessionId)).waitForApproval(this.now()).snapshot();
    await this.store.saveSession(session);
  }

  async get(requestId: string): Promise<ApprovalRequestRecord> {
    const approval = await this.store.getApprovalRequest(requestId);
    if (!approval) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    return approval;
  }

  async respond(requestId: string, decision: ApprovalDecision) {
    const approval = ApprovalRequest.from(await this.get(requestId)).respond(decision, this.now()).snapshot();
    await this.store.saveApprovalRequest(approval);
    await this.events.record(approvalRespondedEvent(approval, decision));

    const command = await this.commands.respondToApproval(approval.sessionId, requestId, decision);
    return { approval, command };
  }

  private async getSession(sessionId: string) {
    const session = await this.store.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session;
  }
}
