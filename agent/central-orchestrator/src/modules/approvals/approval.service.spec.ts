import assert from "node:assert/strict";
import { test } from "vitest";
import { EventProjector } from "../../events/eventProjector.ts";
import { EventStore } from "../../events/eventStore.ts";
import { InMemoryEventBus } from "../../events/inMemoryEventBus.ts";
import { InMemoryCentralStore } from "../../infrastructure/persistence/inMemoryCentralStore.ts";
import { RecordingRealtimeNotifier } from "../../infrastructure/realtime/recordingRealtimeNotifier.ts";
import { AgentService } from "../agents/agent.service.ts";
import { CommandService } from "../commands/command.service.ts";
import { SessionService } from "../sessions/session.service.ts";
import { ApprovalService } from "./approval.service.ts";

test("approval requested events create pending approvals and admin decisions queue agent commands", async () => {
  const store = new InMemoryCentralStore();
  const notifier = new RecordingRealtimeNotifier();
  const events = new EventProjector(new EventStore(store), new InMemoryEventBus(notifier));
  const now = () => "2026-05-03T00:00:00.000Z";
  const agents = new AgentService(store, events, now);
  const sessions = new SessionService(store, events, now);
  const commands = new CommandService(store, events, now);
  const approvals = new ApprovalService(store, events, commands, now);

  await agents.register({
    type: "agent.register",
    agentId: "agent-a",
    nodeName: "macbook",
    hostname: "macbook",
    capabilities: { codex: true, zellij: true },
  });
  const session = await sessions.create({
    agentId: "agent-a",
    sessionName: "saa-agent",
    paneId: "terminal_1",
    conversationId: "discord-thread-1",
  });

  await approvals.recordAgentEvent({
    eventId: "evt-approval",
    agentId: "agent-a",
    sessionId: session.id,
    type: "approval.requested",
    occurredAt: "2026-05-03T00:00:00.000Z",
    payload: {
      requestId: "approval-1",
      toolName: "Bash",
      question: "Allow command?",
      choices: ["allow", "deny"],
      arguments: { command: "pnpm test" },
    },
  });

  assert.equal((await approvals.get("approval-1")).status, "pending");

  const { approval, command } = await approvals.respond("approval-1", "allow");
  assert.equal(approval.status, "approved");
  assert.equal(command.payload.type, "approval.respond");
  assert.equal(command.payload.decision, "allow");
});
