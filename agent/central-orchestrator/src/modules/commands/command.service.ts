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

  async claimNext(agentId: string, leaseMs: number): Promise<AgentCommandRecord | null> {
    const now = this.now();
    const command = (await this.store.listCommandsForAgent(agentId))
      .filter((candidate) => canClaim(candidate, now))
      .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))[0];

    if (!command) {
      return null;
    }

    const leased: AgentCommandRecord = {
      ...command,
      status: "leased",
      leaseOwner: agentId,
      leaseExpiresAt: new Date(new Date(now).getTime() + leaseMs).toISOString(),
    };
    await this.store.saveCommand(leased);
    return leased;
  }

  async complete(commandId: string, agentId: string, result: Record<string, unknown>): Promise<AgentCommandRecord> {
    const command = await this.getCommandForOwner(commandId, agentId);
    const completed: AgentCommandRecord = {
      ...command,
      status: "completed",
      completedAt: this.now(),
      result,
    };

    await this.store.saveCommand(completed);
    return completed;
  }

  async fail(commandId: string, agentId: string, error: string): Promise<AgentCommandRecord> {
    const command = await this.getCommandForOwner(commandId, agentId);
    const failed: AgentCommandRecord = {
      ...command,
      status: "failed",
      completedAt: this.now(),
      error,
    };

    await this.store.saveCommand(failed);
    return failed;
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

  private async getCommandForOwner(commandId: string, agentId: string): Promise<AgentCommandRecord> {
    const command = await this.store.getCommand(commandId);
    if (!command || command.agentId !== agentId || command.leaseOwner !== agentId) {
      throw new Error(`Command is not leased by agent: ${commandId}`);
    }

    return command;
  }
}

function canClaim(command: AgentCommandRecord, now: string): boolean {
  if (command.status === "queued") {
    return true;
  }

  if (command.status !== "leased" || !command.leaseExpiresAt) {
    return false;
  }

  return command.leaseExpiresAt <= now;
}
