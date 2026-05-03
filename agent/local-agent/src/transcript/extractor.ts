import { createHash } from "node:crypto";
import { compact } from "es-toolkit";
import { isPlainObject, isString } from "es-toolkit/compat";
import {
  type CodexHookInput,
  type DomainEvent,
  parseJsonObject,
} from "../domain/schemas.ts";
import { type ParsedTranscriptRow, type TranscriptCursor } from "./reader.ts";

function makeRequestId(parts: unknown[]): string {
  const digest = createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
  return `apr_${digest}`;
}

function markSeen(cursor: TranscriptCursor, id: string): boolean {
  if (cursor.seenEventIds.has(id)) {
    return false;
  }
  cursor.seenEventIds.add(id);
  return true;
}

export function extractDomainEvents(
  rows: ParsedTranscriptRow[],
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
): DomainEvent[] {
  const transcriptEvents = rows.flatMap((parsed) => extractRowEvents(parsed, hookInput, cursor));
  const sawTranscriptApproval = transcriptEvents.some(({ type }) => type === "approval.requested");
  const fallbackApproval = sawTranscriptApproval ? null : approvalFromPermissionHook(hookInput, cursor);

  return [...transcriptEvents, ...compact([fallbackApproval])];
}

function extractRowEvents(
  parsed: ParsedTranscriptRow,
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
): DomainEvent[] {
  const { payload } = parsed.row;
  if (!isPlainObject(payload)) {
    return [];
  }
  const payloadRecord = payload as Record<string, unknown>;

  return compact([
    assistantMessageFromRow(parsed, hookInput, cursor, payloadRecord),
    ...toolEventsFromRow(parsed, hookInput, cursor, payloadRecord),
  ]);
}

function assistantMessageFromRow(
  parsed: ParsedTranscriptRow,
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
  payload: Record<string, unknown>,
): DomainEvent | null {
  if (parsed.row.type !== "event_msg" || payload.type !== "agent_message") {
    return null;
  }
  if (!isString(payload.message)) {
    return null;
  }
  if (!markSeen(cursor, `assistant:${parsed.lineNo}`)) {
    return null;
  }

  return {
    type: "assistant.message",
    sessionId: hookInput.session_id,
    turnId: hookInput.turn_id,
    phase: isString(payload.phase) ? payload.phase : undefined,
    text: payload.message,
    source: {
      transcriptLine: parsed.lineNo,
      hookEventName: hookInput.hook_event_name,
    },
  };
}

function toolEventsFromRow(
  parsed: ParsedTranscriptRow,
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
  payload: Record<string, unknown>,
): DomainEvent[] {
  if (parsed.row.type !== "response_item" || payload.type !== "function_call") {
    return [];
  }
  if (!isString(payload.name) || !isString(payload.call_id) || !isString(payload.arguments)) {
    return [];
  }

  const args = parseJsonObject(payload.arguments);
  if (!args) {
    return [];
  }

  return compact([
    toolCallFromFunctionCall(parsed, hookInput, cursor, payload.name, payload.call_id, args),
    approvalFromFunctionCall(parsed, hookInput, cursor, payload.name, payload.call_id, args),
  ]);
}

function toolCallFromFunctionCall(
  parsed: ParsedTranscriptRow,
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
  toolName: string,
  callId: string,
  args: Record<string, unknown>,
): DomainEvent | null {
  if (!markSeen(cursor, `tool:${callId}`)) {
    return null;
  }

  return {
    type: "tool.call",
    sessionId: hookInput.session_id,
    turnId: hookInput.turn_id,
    toolName,
    callId,
    arguments: args,
    source: {
      transcriptLine: parsed.lineNo,
      hookEventName: hookInput.hook_event_name,
    },
  };
}

function approvalFromFunctionCall(
  parsed: ParsedTranscriptRow,
  hookInput: CodexHookInput,
  cursor: TranscriptCursor,
  toolName: string,
  callId: string,
  args: Record<string, unknown>,
): DomainEvent | null {
  if (args.sandbox_permissions !== "require_escalated") {
    return null;
  }

  const question = isString(args.justification) ? args.justification : "Approve this tool call?";
  const requestId = makeRequestId([hookInput.session_id, hookInput.turn_id, toolName, callId, args]);
  if (!markSeen(cursor, `approval:${requestId}`)) {
    return null;
  }

  return {
    type: "approval.requested",
    requestId,
    sessionId: hookInput.session_id,
    turnId: hookInput.turn_id,
    toolName,
    callId,
    question,
    choices: ["allow", "deny"],
    arguments: args,
    source: {
      transcriptLine: parsed.lineNo,
      hookEventName: hookInput.hook_event_name,
    },
  };
}

function approvalFromPermissionHook(hookInput: CodexHookInput, cursor: TranscriptCursor): DomainEvent | null {
  if (hookInput.hook_event_name !== "PermissionRequest" || !hookInput.tool_name) {
    return null;
  }
  const { tool_input: toolInput } = hookInput;
  if (!isPlainObject(toolInput)) {
    return null;
  }
  const toolInputRecord = toolInput as Record<string, unknown>;

  const { command, description } = toolInputRecord;
  const question = isString(description) ? description : "Approve this tool call?";
  const requestId = makeRequestId([hookInput.session_id, hookInput.turn_id, hookInput.tool_name, command, question]);
  if (!markSeen(cursor, `approval:${requestId}`)) {
    return null;
  }

  return {
    type: "approval.requested",
    requestId,
    sessionId: hookInput.session_id,
    turnId: hookInput.turn_id,
    toolName: hookInput.tool_name,
    question,
    choices: ["allow", "deny"],
    arguments: toolInputRecord,
    source: {
      hookEventName: hookInput.hook_event_name,
    },
  };
}
