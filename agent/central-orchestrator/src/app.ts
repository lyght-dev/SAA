import { Hono } from "hono";
import { EventProjector } from "./events/eventProjector.ts";
import { EventStore } from "./events/eventStore.ts";
import { InMemoryEventBus } from "./events/inMemoryEventBus.ts";
import { type CentralStore } from "./infrastructure/persistence/centralStore.ts";
import { InMemoryCentralStore } from "./infrastructure/persistence/inMemoryCentralStore.ts";
import { RecordingRealtimeNotifier } from "./infrastructure/realtime/recordingRealtimeNotifier.ts";
import { type RealtimeNotifier } from "./infrastructure/realtime/realtimeNotifier.ts";
import { createSupabaseRuntime, type SupabaseRuntime } from "./infrastructure/supabase/supabaseRuntime.ts";
import { AgentService } from "./modules/agents/agent.service.ts";
import { ApprovalService } from "./modules/approvals/approval.service.ts";
import { CommandService } from "./modules/commands/command.service.ts";
import { SessionService } from "./modules/sessions/session.service.ts";
import { registerAgentEventsRoutes } from "./routes/agentEvents.route.ts";
import { registerAgentsRoutes } from "./routes/agents.route.ts";
import { registerApprovalsRoutes } from "./routes/approvals.route.ts";
import { registerHealthRoute } from "./routes/health.route.ts";
import { registerSessionsRoutes } from "./routes/sessions.route.ts";
import { type Clock, systemClock } from "./shared/clock.ts";

export type AppDependencies = {
  store: CentralStore;
  notifier: RealtimeNotifier;
  now?: Clock;
  supabase?: SupabaseRuntime | null;
};

export type AppServices = {
  agents: AgentService;
  sessions: SessionService;
  commands: CommandService;
  approvals: ApprovalService;
};

export function createApp(dependencies?: Partial<AppDependencies>): Hono {
  const store = dependencies?.store ?? new InMemoryCentralStore();
  const notifier = dependencies?.notifier ?? new RecordingRealtimeNotifier();
  const now = dependencies?.now ?? systemClock;
  const supabase = dependencies?.supabase ?? createSupabaseRuntime(process.env);
  void supabase;
  const events = new EventProjector(new EventStore(store), new InMemoryEventBus(notifier));
  const commands = new CommandService(store, events, now);
  const services: AppServices = {
    agents: new AgentService(store, events, now),
    sessions: new SessionService(store, events, now),
    commands,
    approvals: new ApprovalService(store, events, commands, now),
  };
  const app = new Hono();

  registerHealthRoute(app);
  registerAgentsRoutes(app, services.agents);
  registerSessionsRoutes(app, services.sessions, services.commands);
  registerAgentEventsRoutes(app, services.approvals);
  registerApprovalsRoutes(app, services.approvals);

  return app;
}

const app = createApp();

export default app;
