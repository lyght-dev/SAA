import test from "node:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { CodexHookInputSchema, TerminalCommandRequestSchema } from "./schemas.ts";

test("parses captured Codex hook payload shapes", () => {
  const samples = [
    {
      session_id: "sess",
      transcript_path: "/tmp/transcript.jsonl",
      cwd: "/workspaces/SAA",
      hook_event_name: "SessionStart",
      model: "gpt-5.5",
      permission_mode: "default",
      source: "startup",
    },
    {
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
        description: "Do you want to permanently delete /workspaces/SAA/.git?",
      },
    },
  ];

  for (const sample of samples) {
    assert.equal(v.parse(CodexHookInputSchema, sample).session_id, "sess");
  }
});

test("parses a terminal command request for zellij-backed execution", () => {
  const request = v.parse(TerminalCommandRequestSchema, {
    type: "terminal.command.send",
    sessionName: "saa-agent",
    paneName: "worker",
    cwd: "/workspaces/SAA",
    command: "pnpm --dir agent test",
  });

  assert.deepEqual(request, {
    type: "terminal.command.send",
    sessionName: "saa-agent",
    paneName: "worker",
    cwd: "/workspaces/SAA",
    command: "pnpm --dir agent test",
  });
});
