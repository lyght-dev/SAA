import * as v from "valibot";
import {
  CodexMessageRequestSchema,
  TerminalCommandRequestSchema,
  type CodexMessageRequest,
  type TerminalCommandRequest,
} from "../../domain/schemas.ts";
import { type CodexMessageResult } from "../codexMessage/codexMessageHandler.ts";
import { type TerminalCommandResult } from "../terminal/terminalCommandHandler.ts";
import { type CentralCommand } from "../../transport/central/centralHttpClient.ts";

export type CentralCommandClient = {
  claimCommand(agentId: string): Promise<CentralCommand | null>;
  completeCommand(agentId: string, commandId: string, result: Record<string, unknown>): Promise<void>;
  failCommand(agentId: string, commandId: string, error: string): Promise<void>;
};

export type CentralCommandWorkerOptions = {
  agentId: string;
  central: CentralCommandClient;
  codex?: { handle(request: CodexMessageRequest): Promise<CodexMessageResult> };
  terminal?: { handle(request: TerminalCommandRequest): Promise<TerminalCommandResult> };
};

export class CentralCommandWorker {
  private readonly agentId: string;
  private readonly central: CentralCommandClient;
  private readonly codex?: CentralCommandWorkerOptions["codex"];
  private readonly terminal?: CentralCommandWorkerOptions["terminal"];

  constructor(options: CentralCommandWorkerOptions) {
    this.agentId = options.agentId;
    this.central = options.central;
    this.codex = options.codex;
    this.terminal = options.terminal;
  }

  async tick(): Promise<void> {
    const command = await this.central.claimCommand(this.agentId);
    if (!command) {
      return;
    }

    try {
      const result = await this.dispatch(command);
      await this.central.completeCommand(this.agentId, command.id, result);
    } catch (error) {
      await this.central.failCommand(this.agentId, command.id, error instanceof Error ? error.message : "Command failed");
    }
  }

  private async dispatch(command: CentralCommand): Promise<Record<string, unknown>> {
    if (command.payload.type === "codex.message.send" && this.codex) {
      return this.codex.handle(v.parse(CodexMessageRequestSchema, command.payload));
    }

    if (command.payload.type === "terminal.command.send" && this.terminal) {
      return this.terminal.handle(v.parse(TerminalCommandRequestSchema, command.payload));
    }

    throw new Error(`Unsupported command type: ${command.payload.type}`);
  }
}
