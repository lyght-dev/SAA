import { serve, type ServerType } from "@hono/node-server";
import { Hono } from "hono";
import * as v from "valibot";
import { type LocalAgentConfig } from "../../config.ts";
import { type HookRelayRequest, HookRelayRequestSchema } from "../../domain/schemas.ts";

export type CodexHookRequestHandler = {
  handle(request: HookRelayRequest): Promise<void>;
};

export function createLocalAgentHttpApp(handler: CodexHookRequestHandler): Hono {
  const app = new Hono();

  app.get("/healthz", (context) => context.json({ ok: true }));
  app.post("/codex/hooks", async (context) => {
    const request = v.parse(HookRelayRequestSchema, await context.req.json());
    await handler.handle(request);
    return context.json({ ok: true });
  });

  return app;
}

export function startLocalAgentHttpServer(
  config: LocalAgentConfig,
  handler: CodexHookRequestHandler,
): ServerType {
  return serve({
    fetch: createLocalAgentHttpApp(handler).fetch,
    hostname: config.hookRelayHost,
    port: config.hookRelayPort,
  });
}
