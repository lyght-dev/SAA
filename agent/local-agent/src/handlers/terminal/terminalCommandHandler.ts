import { type TerminalCommandRequest } from "../../domain/schemas.ts";

export type { TerminalCommandRequest } from "../../domain/schemas.ts";

export type TerminalCommandResult = {
  /** zellij session used for command execution. */
  sessionName: string;
  /** Existing or newly-created pane that received the command. */
  paneId: string;
};

export type TerminalTransport = {
  /** Ensures the external terminal session is ready for command delivery. */
  ensureSession(sessionName: string): Promise<void>;
  /** Creates a terminal pane for central-orchestrator command execution. */
  createPane(input: { sessionName: string; paneName: string; cwd?: string }): Promise<string>;
  /** Sends a command to a concrete terminal pane. */
  sendCommand(input: { sessionName: string; paneId: string; command: string }): Promise<void>;
};

export class TerminalCommandHandler {
  private readonly transport: TerminalTransport;

  constructor(transport: TerminalTransport) {
    this.transport = transport;
  }

  /**
   * Handles a central-orchestrator request to run a terminal command locally.
   *
   * The request may provide an existing `paneId`. If it does not, this handler
   * creates a pane before sending the command through the terminal transport.
   */
  async handle(request: TerminalCommandRequest): Promise<TerminalCommandResult> {
    const { sessionName, paneName, paneId: existingPaneId, cwd, command } = request;

    await this.transport.ensureSession(sessionName);
    const createPaneInput = cwd ? { sessionName, paneName, cwd } : { sessionName, paneName };
    const paneId = existingPaneId ?? (await this.transport.createPane(createPaneInput));
    await this.transport.sendCommand({ sessionName, paneId, command });

    return { sessionName, paneId };
  }
}
