import * as v from "valibot";
import { type HookRelayRequest, HookRelayRequestSchema } from "../../domain/schemas.ts";
import { MockCentralOutbox } from "../../transport/central/mockCentralOutbox.ts";
import { FileTranscriptCursorStore } from "../../transcript/fileCursorStore.ts";
import { readTranscriptIncrement } from "../../transcript/reader.ts";
import { extractDomainEvents } from "../../transcript/extractor.ts";

export type CodexHookHandlerOptions = {
  agentId: string;
  cursorPath: string;
  outboxPath: string;
};

export class CodexHookHandler {
  private readonly agentId: string;
  private readonly cursorPath: string;
  private readonly outboxPath: string;

  constructor(options: CodexHookHandlerOptions) {
    this.agentId = options.agentId;
    this.cursorPath = options.cursorPath;
    this.outboxPath = options.outboxPath;
  }

  async handle(request: HookRelayRequest): Promise<void> {
    const { hookInput } = v.parse(HookRelayRequestSchema, request);
    if (!hookInput.transcript_path) {
      return;
    }

    const cursorStore = new FileTranscriptCursorStore(this.cursorPath);
    const cursor = cursorStore.get(hookInput.session_id, hookInput.transcript_path);
    const events = extractDomainEvents(readTranscriptIncrement(cursor), hookInput, cursor);
    const outbox = new MockCentralOutbox(this.outboxPath, this.agentId);

    for (const event of events) {
      outbox.send(event);
    }

    cursorStore.save(hookInput.session_id, cursor);
  }
}
