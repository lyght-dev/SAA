import { type Hono } from "hono";
import * as v from "valibot";
import { CommandService } from "../modules/commands/command.service.ts";
import { SessionService } from "../modules/sessions/session.service.ts";
import { type CreateSessionInput } from "../modules/sessions/session.domain.ts";
import { handleJson } from "../shared/http/json.ts";

const CreateSessionRequestSchema = v.object({
  agentId: v.string(),
  sessionName: v.string(),
  paneId: v.string(),
  conversationId: v.string(),
  codexSessionId: v.optional(v.string()),
});

const SendMessageRequestSchema = v.object({
  message: v.string(),
});

export function registerSessionsRoutes(app: Hono, sessions: SessionService, commands: CommandService): void {
  app.post("/sessions", async (context) =>
    handleJson(context, CreateSessionRequestSchema, async (body) => ({
      session: await sessions.create(toCreateSessionInput(body)),
    })),
  );

  app.post("/sessions/:sessionId/messages", async (context) =>
    handleJson(context, SendMessageRequestSchema, async ({ message }) => ({
      command: await commands.sendCodexMessage(context.req.param("sessionId"), message),
    })),
  );
}

function toCreateSessionInput(body: v.InferOutput<typeof CreateSessionRequestSchema>): CreateSessionInput {
  const input: CreateSessionInput = {
    agentId: body.agentId,
    sessionName: body.sessionName,
    paneId: body.paneId,
    conversationId: body.conversationId,
  };

  if (body.codexSessionId) {
    input.codexSessionId = body.codexSessionId;
  }

  return input;
}
