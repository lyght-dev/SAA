import * as v from "valibot";
import { type LocalAgentConfig } from "../config.ts";
import { CodexHookInputSchema } from "../domain/schemas.ts";
import { JsonlOutboxTransport } from "../transport/jsonlOutbox.ts";
import { FileTranscriptCursorStore } from "../transcript/fileCursorStore.ts";
import { readTranscriptIncrement } from "../transcript/reader.ts";
import { extractDomainEvents } from "../transcript/extractor.ts";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function runHook(config: LocalAgentConfig): Promise<number> {
  try {
    const raw = await readStdin();
    const hookInput = v.parse(CodexHookInputSchema, JSON.parse(raw));
    if (!hookInput.transcript_path) {
      return 0;
    }

    const cursorStore = new FileTranscriptCursorStore(config.cursorPath);
    const cursor = cursorStore.get(hookInput.session_id, hookInput.transcript_path);
    const events = extractDomainEvents(readTranscriptIncrement(cursor), hookInput, cursor);
    const outbox = new JsonlOutboxTransport(config.outboxPath, config.agentId);

    for (const event of events) {
      outbox.send(event);
    }

    cursorStore.save(hookInput.session_id, cursor);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`LocalAgent hook failed open: ${message}\n`);
  }

  return 0;
}
