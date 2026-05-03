import { type Hono } from "hono";
import * as v from "valibot";
import { ApprovalService } from "../modules/approvals/approval.service.ts";
import { handleJson } from "../shared/http/json.ts";

const ApprovalResponseRequestSchema = v.object({
  decision: v.union([v.literal("allow"), v.literal("deny")]),
});

export function registerApprovalsRoutes(app: Hono, approvals: ApprovalService): void {
  app.post("/approvals/:requestId/respond", async (context) =>
    handleJson(context, ApprovalResponseRequestSchema, async ({ decision }) => {
      const result = await approvals.respond(context.req.param("requestId"), decision);
      return { approval: result.approval, command: result.command };
    }),
  );
}
