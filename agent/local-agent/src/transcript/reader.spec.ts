import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { TranscriptCursorStore, readTranscriptIncrement } from "./reader.ts";

const withTranscript = (body: string, fn: (path: string) => void) => {
  const tempDir = mkdtempSync(join(tmpdir(), "local-agent-reader-"));
  try {
    const transcriptPath = join(tempDir, "transcript.jsonl");
    writeFileSync(transcriptPath, body);
    fn(transcriptPath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

const row = (type: string, payload: Record<string, unknown>) =>
  JSON.stringify({
    timestamp: "2026-05-02T00:00:00.000Z",
    type,
    payload,
  });

test("reuses cursor for the same session and transcript path", () => {
  const store = new TranscriptCursorStore();
  const first = store.get("sess", "/tmp/a.jsonl");
  const second = store.get("sess", "/tmp/a.jsonl");
  const third = store.get("sess", "/tmp/b.jsonl");

  expect(first).toBe(second);
  expect(first).not.toBe(third);
});

test("reads complete JSONL rows and advances cursor", () => {
  withTranscript(`${row("event_msg", { type: "agent_message", message: "hello" })}\n`, (transcriptPath) => {
    const cursor = new TranscriptCursorStore().get("sess", transcriptPath);
    const firstRead = readTranscriptIncrement(cursor);
    const secondRead = readTranscriptIncrement(cursor);

    expect(firstRead).toHaveLength(1);
    expect(firstRead[0]?.lineNo).toBe(1);
    expect(firstRead[0]?.row.type).toBe("event_msg");
    expect(secondRead).toHaveLength(0);
  });
});

test("ignores partial trailing JSON until newline completes it", () => {
  const complete = `${row("event_msg", { type: "agent_message", message: "hello" })}\n`;
  const partial = row("response_item", { type: "function_call", name: "exec_command" });

  withTranscript(`${complete}${partial}`, (transcriptPath) => {
    const cursor = new TranscriptCursorStore().get("sess", transcriptPath);
    expect(readTranscriptIncrement(cursor)).toHaveLength(1);

    appendFileSync(transcriptPath, "\n");
    const secondRead = readTranscriptIncrement(cursor);

    expect(secondRead).toHaveLength(1);
    expect(secondRead[0]?.lineNo).toBe(2);
    expect(secondRead[0]?.row.type).toBe("response_item");
  });
});
