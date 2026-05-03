import * as v from "valibot";
import { isPlainObject } from "es-toolkit/compat";

export const UnknownRecordSchema = v.record(v.string(), v.unknown());

export const CodexHookInputSchema = v.objectWithRest(
  {
    session_id: v.string(),
    transcript_path: v.nullable(v.string()),
    cwd: v.string(),
    hook_event_name: v.string(),
    model: v.string(),
    permission_mode: v.optional(v.string()),
    turn_id: v.optional(v.string()),
    tool_name: v.optional(v.string()),
    tool_use_id: v.optional(v.string()),
    tool_input: v.optional(UnknownRecordSchema),
    tool_response: v.optional(v.unknown()),
    prompt: v.optional(v.string()),
    source: v.optional(v.string()),
    stop_hook_active: v.optional(v.boolean()),
    last_assistant_message: v.optional(v.string()),
    agent_id: v.optional(v.string()),
    agent_type: v.optional(v.string()),
  },
  v.unknown(),
);

export type CodexHookInput = v.InferOutput<typeof CodexHookInputSchema>;

export const HookRelayRequestSchema = v.object({
  protocolVersion: v.literal("local-agent.codex-hook.v1"),
  eventId: v.string(),
  sentAt: v.string(),
  hookInput: CodexHookInputSchema,
});

export type HookRelayRequest = v.InferOutput<typeof HookRelayRequestSchema>;

export const AssistantMessageEventSchema = v.object({
  type: v.literal("assistant.message"),
  sessionId: v.string(),
  turnId: v.optional(v.string()),
  phase: v.optional(v.string()),
  text: v.string(),
  source: v.object({
    transcriptLine: v.number(),
    hookEventName: v.string(),
  }),
});

export const ToolCallEventSchema = v.object({
  type: v.literal("tool.call"),
  sessionId: v.string(),
  turnId: v.optional(v.string()),
  toolName: v.string(),
  callId: v.string(),
  arguments: UnknownRecordSchema,
  source: v.object({
    transcriptLine: v.number(),
    hookEventName: v.string(),
  }),
});

export const ApprovalRequestedEventSchema = v.object({
  type: v.literal("approval.requested"),
  requestId: v.string(),
  sessionId: v.string(),
  turnId: v.optional(v.string()),
  toolName: v.string(),
  callId: v.optional(v.string()),
  question: v.string(),
  choices: v.tuple([v.literal("allow"), v.literal("deny")]),
  arguments: UnknownRecordSchema,
  source: v.object({
    transcriptLine: v.optional(v.number()),
    hookEventName: v.string(),
  }),
});

export const DomainEventSchema = v.variant("type", [
  AssistantMessageEventSchema,
  ToolCallEventSchema,
  ApprovalRequestedEventSchema,
]);

export type DomainEvent = v.InferOutput<typeof DomainEventSchema>;

export const OutboundEnvelopeSchema = v.object({
  id: v.string(),
  type: v.string(),
  agentId: v.string(),
  sessionId: v.string(),
  turnId: v.optional(v.string()),
  timestamp: v.string(),
  payload: DomainEventSchema,
});

export type OutboundEnvelope = v.InferOutput<typeof OutboundEnvelopeSchema>;

export const TranscriptRowSchema = v.objectWithRest(
  {
    timestamp: v.optional(v.string()),
    type: v.string(),
    payload: v.optional(UnknownRecordSchema),
  },
  v.unknown(),
);

export type TranscriptRow = v.InferOutput<typeof TranscriptRowSchema>;

export function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text);
    if (isPlainObject(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}
