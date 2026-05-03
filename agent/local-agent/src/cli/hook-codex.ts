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
  /** Raw Codex hook JSON stream supplied by the hook process. */
  stdin?: AsyncIterable<Buffer | string>;
  /** HTTP client used to relay the hook request to the local agent app. */
  fetch?: typeof fetch;
  /** Error sink for fail-open relay errors. */
  stderr?: Pick<NodeJS.WriteStream, "write">;
};

/**
 * Receives a Codex hook payload from stdin and relays it to the local agent app.
 *
 * This CLI boundary intentionally fails open: relay failures are written to
 * stderr, but the returned exit code remains `0` so Codex hook execution is not
 * blocked by local-agent availability.
 */
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
