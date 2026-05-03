import { type CodexMessageRequest } from "../../domain/schemas.ts";

export type { CodexMessageRequest } from "../../domain/schemas.ts";

export type CodexMessageResult =
  | {
      ok: true;
      sessionName: string;
      paneId: string;
    }
  | {
      ok: false;
      sessionName: string;
      paneId: string;
      reason: "pane_not_found";
    };

export type CodexMessageTransport = {
  paneExists(input: { sessionName: string; paneId: string }): Promise<boolean>;
  sendText(input: { sessionName: string; paneId: string; text: string }): Promise<void>;
};

export class CodexMessageHandler {
  private readonly transport: CodexMessageTransport;

  constructor(transport: CodexMessageTransport) {
    this.transport = transport;
  }

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
