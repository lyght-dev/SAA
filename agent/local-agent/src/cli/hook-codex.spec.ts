import { Readable } from "node:stream";
import { expect, test } from "vitest";
import { runHook } from "./hook-codex.ts";
import { type LocalAgentConfig } from "../config.ts";

const config: LocalAgentConfig = {
  agentId: "local-agent-dev",
  outboxPath: ".local/outbox.jsonl",
  cursorPath: ".local/cursors.json",
  zellijBinaryPath: "zellij",
  hookRelayHost: "127.0.0.1",
  hookRelayPort: 47231,
};

test("relays stdin hook payload to the local agent app over HTTP", async () => {
  const hookInput = {
    session_id: "sess",
    transcript_path: "/tmp/transcript.jsonl",
    cwd: "/workspaces/SAA",
    hook_event_name: "SessionStart",
    model: "gpt-5.5",
  };
  const requests: Array<{ url: string; init: RequestInit }> = [];

  const exitCode = await runHook(config, {
    stdin: Readable.from([JSON.stringify(hookInput)]),
    fetch: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
    stderr: { write: () => true },
  });

  expect(exitCode).toBe(0);
  expect(requests).toHaveLength(1);
  expect(requests[0]?.url).toBe("http://127.0.0.1:47231/codex/hooks");
  expect(requests[0]?.init.method).toBe("POST");
  const body = JSON.parse(String(requests[0]?.init.body));
  expect(body.protocolVersion).toBe("local-agent.codex-hook.v1");
  expect(body.eventId).toMatch(/^hook_/);
  expect(body.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(body.hookInput).toEqual(hookInput);
});

test("fails open when the local agent app is unavailable", async () => {
  const messages: string[] = [];
  const exitCode = await runHook(config, {
    stdin: Readable.from(["{}"]),
    fetch: async () => {
      throw new Error("connect ECONNREFUSED");
    },
    stderr: {
      write: (message: string) => {
        messages.push(message);
        return true;
      },
    },
  });

  expect(exitCode).toBe(0);
  expect(messages.join("")).toMatch(/LocalAgent hook relay failed open: /);
});
