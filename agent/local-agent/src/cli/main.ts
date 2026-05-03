#!/usr/bin/env node --experimental-strip-types
import { loadConfig } from "../config.ts";
import { runHook } from "./hook-codex.ts";
import { CodexHookHandler } from "../handlers/codex/codexHookHandler.ts";
import { startLocalAgentHttpServer } from "../transport/http/localAgentHttpServer.ts";

const command = process.argv[2] ?? "hook";
const config = loadConfig();

if (command === "hook") {
  process.exitCode = await runHook(config);
} else if (command === "app") {
  startLocalAgentHttpServer(
    config,
    new CodexHookHandler({
      agentId: config.agentId,
      cursorPath: config.cursorPath,
      outboxPath: config.outboxPath,
    }),
  );
} else {
  process.stderr.write(`Unknown local-agent command: ${command}\n`);
  process.exitCode = 2;
}
