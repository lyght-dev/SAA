import assert from "node:assert/strict";
import test from "node:test";
import {
  TerminalCommandHandler,
  type TerminalCommandRequest,
  type TerminalTransport,
} from "./terminalCommandHandler.ts";

test("ensures a session, creates a pane, and sends the command", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const transport: TerminalTransport = {
    async ensureSession(sessionName) {
      calls.push({ name: "ensureSession", input: sessionName });
    },
    async createPane(input) {
      calls.push({ name: "createPane", input });
      return "terminal_7";
    },
    async sendCommand(input) {
      calls.push({ name: "sendCommand", input });
    },
  };

  const handler = new TerminalCommandHandler(transport);
  const request: TerminalCommandRequest = {
    type: "terminal.command.send",
    sessionName: "saa-agent",
    paneName: "worker",
    cwd: "/workspaces/SAA",
    command: "pnpm --dir agent test",
  };

  const result = await handler.handle(request);

  assert.deepEqual(result, { sessionName: "saa-agent", paneId: "terminal_7" });
  assert.deepEqual(calls, [
    { name: "ensureSession", input: "saa-agent" },
    {
      name: "createPane",
      input: { sessionName: "saa-agent", paneName: "worker", cwd: "/workspaces/SAA" },
    },
    {
      name: "sendCommand",
      input: { sessionName: "saa-agent", paneId: "terminal_7", command: "pnpm --dir agent test" },
    },
  ]);
});

test("reuses an existing pane id without creating a new pane", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const transport: TerminalTransport = {
    async ensureSession(sessionName) {
      calls.push({ name: "ensureSession", input: sessionName });
    },
    async createPane(input) {
      calls.push({ name: "createPane", input });
      return "terminal_ignored";
    },
    async sendCommand(input) {
      calls.push({ name: "sendCommand", input });
    },
  };

  const handler = new TerminalCommandHandler(transport);
  const result = await handler.handle({
    type: "terminal.command.send",
    sessionName: "saa-agent",
    paneName: "worker",
    paneId: "terminal_9",
    command: "git status",
  });

  assert.deepEqual(result, { sessionName: "saa-agent", paneId: "terminal_9" });
  assert.deepEqual(calls, [
    { name: "ensureSession", input: "saa-agent" },
    {
      name: "sendCommand",
      input: { sessionName: "saa-agent", paneId: "terminal_9", command: "git status" },
    },
  ]);
});
