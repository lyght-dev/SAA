#!/usr/bin/env node --experimental-strip-types
import { hostname } from "node:os";
import { createClient } from "@supabase/supabase-js";
import { loadConfig } from "../config.ts";
import { runHook } from "./hook-codex.ts";
import { CodexHookHandler } from "../handlers/codex/codexHookHandler.ts";
import { startLocalAgentHttpServer } from "../transport/http/localAgentHttpServer.ts";
import { CentralHttpClient } from "../transport/central/centralHttpClient.ts";
import { HttpCentralEventSink } from "../transport/central/httpCentralEventSink.ts";
import { CentralCommandWorker } from "../handlers/centralCommand/centralCommandWorker.ts";
import { CodexMessageHandler } from "../handlers/codexMessage/codexMessageHandler.ts";
import { TerminalCommandHandler } from "../handlers/terminal/terminalCommandHandler.ts";
import { ZellijTransport } from "../transport/zellij/zellijTransport.ts";
import { SupabaseCommandSubscriber } from "../transport/supabase/supabaseCommandSubscriber.ts";

const command = process.argv[2] ?? "hook";
const config = loadConfig();

if (command === "hook") {
  process.exitCode = await runHook(config);
} else if (command === "app") {
  const central = config.centralBaseUrl
    ? new CentralHttpClient({
        baseUrl: config.centralBaseUrl,
        ...(config.authToken ? { authToken: config.authToken } : {}),
      })
    : null;
  const zellij = new ZellijTransport(undefined, { binaryPath: config.zellijBinaryPath });
  const worker = central
    ? new CentralCommandWorker({
        agentId: config.agentId,
        central,
        codex: new CodexMessageHandler(zellij),
        terminal: new TerminalCommandHandler(zellij),
      })
    : null;

  if (central && worker) {
    await central.registerAgent({
      agentId: config.agentId,
      nodeName: config.agentId,
      hostname: hostname(),
    });
    setInterval(() => void worker.tick().catch(logError), config.pollIntervalMs);

    if (config.supabaseUrl && config.supabaseAnonKey) {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      new SupabaseCommandSubscriber(supabase, {
        agentId: config.agentId,
        onCommandCreated: () => worker.tick().catch(logError),
      }).start();
    }
  }

  startLocalAgentHttpServer(
    config,
    new CodexHookHandler({
      agentId: config.agentId,
      cursorPath: config.cursorPath,
      outboxPath: config.outboxPath,
      ...(central ? { eventSink: new HttpCentralEventSink(config.agentId, central) } : {}),
    }),
  );
} else {
  process.stderr.write(`Unknown local-agent command: ${command}\n`);
  process.exitCode = 2;
}

function logError(error: unknown): void {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
}
