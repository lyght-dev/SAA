import { type Hono } from "hono";
import { ApprovalService } from "../modules/approvals/approval.service.ts";
import { AgentEventSchema } from "../modules/schemas.ts";
import { handleJson } from "../shared/http/json.ts";

export function registerAgentEventsRoutes(app: Hono, approvals: ApprovalService): void {
  app.post("/agent-events", async (context) =>
    handleJson(context, AgentEventSchema, async (body) => {
      await approvals.recordAgentEvent(body);
      return { ok: true };
    }),
  );
}
