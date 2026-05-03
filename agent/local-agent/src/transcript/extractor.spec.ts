import { expect, test } from "vitest";
import * as v from "valibot";
import { CodexHookInputSchema } from "../domain/schemas.ts";
import { extractDomainEvents } from "./extractor.ts";
import { type ParsedTranscriptRow, type TranscriptCursor } from "./reader.ts";

const hookInput = v.parse(CodexHookInputSchema, {
  session_id: "sess",
  turn_id: "turn",
  transcript_path: "/tmp/transcript.jsonl",
  cwd: "/workspaces/SAA",
  hook_event_name: "PermissionRequest",
  model: "gpt-5.5",
  permission_mode: "default",
  tool_name: "Bash",
  tool_input: {
    command: "rm -rf .git",
    description: "Do you want to delete .git?",
  },
});

const cursor = (): TranscriptCursor => ({
  transcriptPath: "/tmp/transcript.jsonl",
  byteOffset: 0,
  lineNo: 0,
  seenEventIds: new Set<string>(),
});

const parsedRow = (lineNo: number, type: string, payload: Record<string, unknown>): ParsedTranscriptRow => ({
  lineNo,
  byteOffset: 0,
  row: {
    timestamp: "2026-05-02T00:00:00.000Z",
    type,
    payload,
  },
});

test("extracts assistant message, tool call, and approval request from transcript rows", () => {
  const rows = [
    parsedRow(1, "event_msg", {
      type: "agent_message",
      message: "Running the requested command.",
      phase: "commentary",
    }),
    parsedRow(2, "response_item", {
      type: "function_call",
      name: "exec_command",
      call_id: "call_123",
      arguments: JSON.stringify({
        cmd: "rm -rf .git",
        workdir: "/workspaces/SAA",
        sandbox_permissions: "require_escalated",
        justification: "Do you want to delete .git?",
      }),
    }),
  ];

  const events = extractDomainEvents(rows, hookInput, cursor());

  expect(
    events.map((event) => event.type),
  ).toEqual(["assistant.message", "tool.call", "approval.requested"]);
  expect(events[0]?.type === "assistant.message" ? events[0].text : undefined).toBe(
    "Running the requested command.",
  );
  expect(events[1]?.type === "tool.call" ? events[1].callId : undefined).toBe("call_123");
  expect(events[2]?.type === "approval.requested" ? events[2].question : undefined).toBe(
    "Do you want to delete .git?",
  );
});

test("uses PermissionRequest hook as approval fallback when transcript has no approval call", () => {
  const events = extractDomainEvents([], hookInput, cursor());

  expect(events.map((event) => event.type)).toEqual(["approval.requested"]);
  expect(events[0]?.type === "approval.requested" ? events[0].toolName : undefined).toBe("Bash");
});

test("deduplicates events by cursor seen ids", () => {
  const sharedCursor = cursor();
  const preToolHookInput = {
    ...hookInput,
    hook_event_name: "PreToolUse",
  };
  const rows = [
    parsedRow(1, "response_item", {
      type: "function_call",
      name: "exec_command",
      call_id: "call_123",
      arguments: JSON.stringify({ cmd: "pwd" }),
    }),
  ];

  expect(extractDomainEvents(rows, preToolHookInput, sharedCursor)).toHaveLength(1);
  expect(extractDomainEvents(rows, preToolHookInput, sharedCursor)).toHaveLength(0);
});
