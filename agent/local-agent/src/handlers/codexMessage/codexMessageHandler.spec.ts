import assert from "node:assert/strict";
import test from "node:test";
import {
  CodexMessageHandler,
  type CodexMessageTransport,
} from "./codexMessageHandler.ts";
import { type CodexMessageRequest } from "../../domain/schemas.ts";

test("sends a codex message to the exact pane from the central request", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const transport: CodexMessageTransport = {
    async paneExists(input) {
      calls.push({ name: "paneExists", input });
      return true;
    },
    async sendText(input) {
      calls.push({ name: "sendText", input });
    },
  };
  const request: CodexMessageRequest = {
    type: "codex.message.send",
    targetId: "discord-thread-123",
    sessionName: "saa-agent",
    paneId: "terminal_7",
    message: "어떤 skill들이 있어?",
  };

  const result = await new CodexMessageHandler(transport).handle(request);

  assert.deepEqual(result, { ok: true, sessionName: "saa-agent", paneId: "terminal_7" });
  assert.deepEqual(calls, [
    { name: "paneExists", input: { sessionName: "saa-agent", paneId: "terminal_7" } },
    {
      name: "sendText",
      input: { sessionName: "saa-agent", paneId: "terminal_7", text: "어떤 skill들이 있어?" },
    },
  ]);
});

test("returns a failed result and does not send text when the pane is missing", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const transport: CodexMessageTransport = {
    async paneExists(input) {
      calls.push({ name: "paneExists", input });
      return false;
    },
    async sendText(input) {
      calls.push({ name: "sendText", input });
    },
  };

  const result = await new CodexMessageHandler(transport).handle({
    type: "codex.message.send",
    sessionName: "saa-agent",
    paneId: "terminal_missing",
    message: "hello world",
  });

  assert.deepEqual(result, {
    ok: false,
    sessionName: "saa-agent",
    paneId: "terminal_missing",
    reason: "pane_not_found",
  });
  assert.deepEqual(calls, [
    { name: "paneExists", input: { sessionName: "saa-agent", paneId: "terminal_missing" } },
  ]);
});
