import { type CodexMessageRequest } from "../../domain/schemas.ts";

export type { CodexMessageRequest } from "../../domain/schemas.ts";

export type CodexMessageResult =
  | {
      /** Message was delivered to the requested pane. */
      ok: true;
      sessionName: string;
      paneId: string;
    }
  | {
      /** Message was rejected before delivery. */
      ok: false;
      sessionName: string;
      paneId: string;
      reason: "pane_not_found";
    };

export type CodexMessageTransport = {
  /** Checks whether central-managed pane routing still points to a live pane. */
  paneExists(input: { sessionName: string; paneId: string }): Promise<boolean>;
  /** Sends user-provided text to the requested Codex pane. */
  sendText(input: { sessionName: string; paneId: string; text: string }): Promise<void>;
};

export class CodexMessageHandler {
  private readonly transport: CodexMessageTransport;

  constructor(transport: CodexMessageTransport) {
    this.transport = transport;
  }

  /**
   * Handles a central-orchestrator request to send text into a Codex pane.
   *
   * Pane ownership stays with the central orchestrator, so the local agent only
   * verifies that the requested pane exists before writing text to it.
   */
  async handle(request: CodexMessageRequest): Promise<CodexMessageResult> {
    const { sessionName, paneId, message } = request;
    const paneExists = await this.transport.paneExists({ sessionName, paneId });
    if (!paneExists) {
      return { ok: false, sessionName, paneId, reason: "pane_not_found" };
    }

    await this.transport.sendText({ sessionName, paneId, text: message });
    return { ok: true, sessionName, paneId };
  }
}
