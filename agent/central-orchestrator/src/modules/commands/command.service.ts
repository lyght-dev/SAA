import { isString } from "es-toolkit/compat";
import { EventProjector } from "../../events/eventProjector.ts";
import { type CentralStore } from "../../infrastructure/persistence/centralStore.ts";
import { type Clock } from "../../shared/clock.ts";
import { AgentCommand } from "./command.domain.ts";
import { commandQueuedEvent } from "./command.events.ts";
import { type AgentCommandRecord, type ApprovalDecision } from "./command.schemas.ts";

export class CommandService {
  private readonly store: CentralStore;
  private readonly events: EventProjector;
  private readonly now: Clock;

  constructor(store: CentralStore, events: EventProjector, now: Clock) {
    this.store = store;
    this.events = events;
    this.now = now;
  }

  async sendCodexMessage(sessionId: string, message: string): Promise<AgentCommandRecord> {
    if (!isString(message) || message.length === 0) {
      throw new Error("message must be a non-empty string");
    }

    const session = await this.getSession(sessionId);
    const command = AgentCommand.codexMessage(session, message, this.now()).snapshot();
    await this.queue(command);
    return command;
  }

  async respondToApproval(sessionId: string, approvalRequestId: string, decision: ApprovalDecision): Promise<AgentCommandRecord> {
    const session = await this.getSession(sessionId);
    const command = AgentCommand.approvalResponse(session, approvalRequestId, decision, this.now()).snapshot();
    await this.queue(command);
    return command;
  }

  private async queue(command: AgentCommandRecord): Promise<void> {
    await this.store.saveCommand(command);
    await this.events.record(commandQueuedEvent(command));
  }

  private async getSession(sessionId: string) {
    const session = await this.store.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session;
  }
}
