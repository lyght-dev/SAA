import { expect, test } from "vitest";
import { loadConfig } from "./config.ts";

test("loads the zellij binary path from LOCAL_AGENT_ZELLIJ_BIN", () => {
  const previous = process.env.LOCAL_AGENT_ZELLIJ_BIN;
  process.env.LOCAL_AGENT_ZELLIJ_BIN = "/opt/bin/zellij";

  try {
    expect(loadConfig().zellijBinaryPath).toBe("/opt/bin/zellij");
  } finally {
    if (previous === undefined) {
      delete process.env.LOCAL_AGENT_ZELLIJ_BIN;
    } else {
      process.env.LOCAL_AGENT_ZELLIJ_BIN = previous;
    }
  }
});

test("loads the hook relay host and port from environment variables", () => {
  const previousHost = process.env.LOCAL_AGENT_HOOK_RELAY_HOST;
  const previousPort = process.env.LOCAL_AGENT_HOOK_RELAY_PORT;
  process.env.LOCAL_AGENT_HOOK_RELAY_HOST = "127.0.0.2";
  process.env.LOCAL_AGENT_HOOK_RELAY_PORT = "48111";

  try {
    const config = loadConfig();
    expect(config.hookRelayHost).toBe("127.0.0.2");
    expect(config.hookRelayPort).toBe(48111);
  } finally {
    if (previousHost === undefined) {
      delete process.env.LOCAL_AGENT_HOOK_RELAY_HOST;
    } else {
      process.env.LOCAL_AGENT_HOOK_RELAY_HOST = previousHost;
    }
    if (previousPort === undefined) {
      delete process.env.LOCAL_AGENT_HOOK_RELAY_PORT;
    } else {
      process.env.LOCAL_AGENT_HOOK_RELAY_PORT = previousPort;
    }
  }
});

test("loads central and Supabase connection settings from environment variables", () => {
  const previousCentral = process.env.LOCAL_AGENT_CENTRAL_BASE_URL;
  const previousToken = process.env.LOCAL_AGENT_AUTH_TOKEN;
  const previousSupabaseUrl = process.env.LOCAL_AGENT_SUPABASE_URL;
  const previousSupabaseAnonKey = process.env.LOCAL_AGENT_SUPABASE_ANON_KEY;
  const previousPoll = process.env.LOCAL_AGENT_POLL_INTERVAL_MS;

  process.env.LOCAL_AGENT_CENTRAL_BASE_URL = "http://localhost:54321/functions/v1/orchestrator";
  process.env.LOCAL_AGENT_AUTH_TOKEN = "shared-token";
  process.env.LOCAL_AGENT_SUPABASE_URL = "http://localhost:54321";
  process.env.LOCAL_AGENT_SUPABASE_ANON_KEY = "anon-key";
  process.env.LOCAL_AGENT_POLL_INTERVAL_MS = "250";

  try {
    const config = loadConfig();
    expect(config.centralBaseUrl).toBe("http://localhost:54321/functions/v1/orchestrator");
    expect(config.authToken).toBe("shared-token");
    expect(config.supabaseUrl).toBe("http://localhost:54321");
    expect(config.supabaseAnonKey).toBe("anon-key");
    expect(config.pollIntervalMs).toBe(250);
  } finally {
    restoreEnv("LOCAL_AGENT_CENTRAL_BASE_URL", previousCentral);
    restoreEnv("LOCAL_AGENT_AUTH_TOKEN", previousToken);
    restoreEnv("LOCAL_AGENT_SUPABASE_URL", previousSupabaseUrl);
    restoreEnv("LOCAL_AGENT_SUPABASE_ANON_KEY", previousSupabaseAnonKey);
    restoreEnv("LOCAL_AGENT_POLL_INTERVAL_MS", previousPoll);
  }
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
