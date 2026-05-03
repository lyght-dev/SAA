import { type TerminalCommandRequest } from "../../domain/schemas.ts";

export type { TerminalCommandRequest } from "../../domain/schemas.ts";

export type TerminalCommandResult = {
  sessionName: string;
  paneId: string;
};

export type TerminalTransport = {
  ensureSession(sessionName: string): Promise<void>;
  createPane(input: { sessionName: string; paneName: string; cwd?: string }): Promise<string>;
  sendCommand(input: { sessionName: string; paneId: string; command: string }): Promise<void>;
};

export class TerminalCommandHandler {
  private readonly transport: TerminalTransport;

  constructor(transport: TerminalTransport) {
    this.transport = transport;
  }

  async handle(request: TerminalCommandRequest): Promise<TerminalCommandResult> {
    const { sessionName, paneName, paneId: existingPaneId, cwd, command } = request;

    await this.transport.ensureSession(sessionName);
    const createPaneInput = cwd ? { sessionName, paneName, cwd } : { sessionName, paneName };
    const paneId = existingPaneId ?? (await this.transport.createPane(createPaneInput));
    await this.transport.sendCommand({ sessionName, paneId, command });

    return { sessionName, paneId };
  }
}
