#!/usr/bin/env node --experimental-strip-types
import { loadConfig } from "../config.ts";
import { runHook } from "./hook-codex.ts";

const command = process.argv[2] ?? "hook";
const config = loadConfig();

if (command === "hook") {
  process.exitCode = await runHook(config);
} else {
  process.stderr.write(`Unknown local-agent command: ${command}\n`);
  process.exitCode = 2;
}
