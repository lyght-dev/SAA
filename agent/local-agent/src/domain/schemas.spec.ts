import { expect, test } from "vitest";
import * as v from "valibot";
import { CodexHookInputSchema, CodexMessageRequestSchema, TerminalCommandRequestSchema } from "./schemas.ts";

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
    expect(v.parse(CodexHookInputSchema, sample).session_id).toBe("sess");
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

  expect(request).toEqual({
    type: "terminal.command.send",
    sessionName: "saa-agent",
    paneName: "worker",
    cwd: "/workspaces/SAA",
    command: "pnpm --dir agent test",
  });
});

test("parses a codex message request with central-managed pane routing", () => {
  const request = v.parse(CodexMessageRequestSchema, {
    type: "codex.message.send",
    targetId: "discord-thread-123",
    sessionName: "saa-agent",
    paneId: "terminal_7",
    codexSessionId: "codex-session",
    message: "어떤 skill들이 있어?",
  });

  expect(request).toEqual({
    type: "codex.message.send",
    targetId: "discord-thread-123",
    sessionName: "saa-agent",
    paneId: "terminal_7",
    codexSessionId: "codex-session",
    message: "어떤 skill들이 있어?",
  });
});
