import { type Hono } from "hono";
import { AgentService } from "../modules/agents/agent.service.ts";
import { AgentRegisterRequestSchema } from "../modules/agents/agent.schemas.ts";
import { handleJson } from "../shared/http/json.ts";

export function registerAgentsRoutes(app: Hono, agents: AgentService): void {
  app.post("/agents/register", async (context) =>
    handleJson(context, AgentRegisterRequestSchema, async (body) => ({
      agent: await agents.register(body),
    })),
  );

  app.get("/agents", async (context) => context.json({ agents: await agents.discover() }));
}
