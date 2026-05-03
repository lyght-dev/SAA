import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "./config.ts";

test("loads the zellij binary path from LOCAL_AGENT_ZELLIJ_BIN", () => {
  const previous = process.env.LOCAL_AGENT_ZELLIJ_BIN;
  process.env.LOCAL_AGENT_ZELLIJ_BIN = "/opt/bin/zellij";

  try {
    assert.equal(loadConfig().zellijBinaryPath, "/opt/bin/zellij");
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
    assert.equal(config.hookRelayHost, "127.0.0.2");
    assert.equal(config.hookRelayPort, 48111);
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
