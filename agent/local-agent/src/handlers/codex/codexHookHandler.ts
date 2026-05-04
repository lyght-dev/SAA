import * as v from "valibot";
import { type HookRelayRequest, HookRelayRequestSchema } from "../../domain/schemas.ts";
import { MockCentralOutbox } from "../../transport/central/mockCentralOutbox.ts";
import { FileTranscriptCursorStore } from "../../transcript/fileCursorStore.ts";
import { readTranscriptIncrement } from "../../transcript/reader.ts";
import { extractDomainEvents } from "../../transcript/extractor.ts";

export type CodexHookHandlerOptions = {
  /** Local agent id attached to outbound central events. */
  agentId: string;
  /** File path used to persist transcript cursor state between hook calls. */
  cursorPath: string;
  /** JSONL file path used as the mock central outbound transport. */
  outboxPath: string;
  eventSink?: {
    send(event: ReturnType<typeof extractDomainEvents>[number]): void | Promise<void>;
  };
};

export class CodexHookHandler {
  private readonly agentId: string;
  private readonly cursorPath: string;
  private readonly outboxPath: string;
  private readonly eventSink?: CodexHookHandlerOptions["eventSink"];

  constructor(options: CodexHookHandlerOptions) {
    this.agentId = options.agentId;
    this.cursorPath = options.cursorPath;
    this.outboxPath = options.outboxPath;
    this.eventSink = options.eventSink;
  }

  /**
   * Accepts a relayed Codex hook request and exports newly discovered events.
   *
   * Incoming hook requests may include a transcript path. When present, the
   * handler reads only unread transcript rows, extracts domain events, and
   * writes outbound central envelopes through the configured outbox transport.
   */
  async handle(request: HookRelayRequest): Promise<void> {
    const { hookInput } = v.parse(HookRelayRequestSchema, request);
    if (!hookInput.transcript_path) {
      return;
    }

    const cursorStore = new FileTranscriptCursorStore(this.cursorPath);
    const cursor = cursorStore.get(hookInput.session_id, hookInput.transcript_path);
    const events = extractDomainEvents(readTranscriptIncrement(cursor), hookInput, cursor);
    const outbox = this.eventSink ?? new MockCentralOutbox(this.outboxPath, this.agentId);

    for (const event of events) {
      await outbox.send(event);
    }

    cursorStore.save(hookInput.session_id, cursor);
  }
}
