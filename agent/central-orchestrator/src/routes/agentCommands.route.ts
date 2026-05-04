import { type Hono } from "hono";
import * as v from "valibot";
import { CommandService } from "../modules/commands/command.service.ts";
import { handleJson } from "../shared/http/json.ts";

const ClaimCommandRequestSchema = v.object({
  leaseMs: v.optional(v.number()),
});

const CompleteCommandRequestSchema = v.object({
  result: v.optional(v.record(v.string(), v.unknown())),
});

const FailCommandRequestSchema = v.object({
  error: v.string(),
});

export function registerAgentCommandsRoutes(app: Hono, commands: CommandService): void {
  app.post("/agents/:agentId/commands/claim", async (context) =>
    handleJson(context, ClaimCommandRequestSchema, async ({ leaseMs }) => ({
      command: await commands.claimNext(context.req.param("agentId"), leaseMs ?? 30_000),
    })),
  );

  app.post("/agents/:agentId/commands/:commandId/complete", async (context) =>
    handleJson(context, CompleteCommandRequestSchema, async ({ result }) => ({
      command: await commands.complete(
        context.req.param("commandId"),
        context.req.param("agentId"),
        result ?? {},
      ),
    })),
  );

  app.post("/agents/:agentId/commands/:commandId/fail", async (context) =>
    handleJson(context, FailCommandRequestSchema, async ({ error }) => ({
      command: await commands.fail(context.req.param("commandId"), context.req.param("agentId"), error),
    })),
  );
}
