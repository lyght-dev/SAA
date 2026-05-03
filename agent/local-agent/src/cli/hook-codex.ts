import { randomUUID } from "node:crypto";
import * as v from "valibot";
import { type LocalAgentConfig } from "../config.ts";
import { CodexHookInputSchema, type HookRelayRequest } from "../domain/schemas.ts";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export type HookRuntime = {
  stdin?: AsyncIterable<Buffer | string>;
  fetch?: typeof fetch;
  stderr?: Pick<NodeJS.WriteStream, "write">;
};

export async function runHook(config: LocalAgentConfig, runtime: HookRuntime = {}): Promise<number> {
  try {
    const raw = runtime.stdin ? await readInput(runtime.stdin) : await readStdin();
    const response = await relayHook(config, JSON.parse(raw), runtime.fetch ?? fetch);
    if (!response.ok) {
      throw new Error(`local agent app returned ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    (runtime.stderr ?? process.stderr).write(`LocalAgent hook relay failed open: ${message}\n`);
  }

  return 0;
}

async function readInput(input: AsyncIterable<Buffer | string>): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function relayHook(config: LocalAgentConfig, hookInput: unknown, fetchFn: typeof fetch): Promise<Response> {
  const request: HookRelayRequest = {
    protocolVersion: "local-agent.codex-hook.v1",
    eventId: `hook_${randomUUID().replaceAll("-", "")}`,
    sentAt: new Date().toISOString(),
    hookInput: v.parse(CodexHookInputSchema, hookInput),
  };

  return fetchFn(`http://${config.hookRelayHost}:${config.hookRelayPort}/codex/hooks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
}
