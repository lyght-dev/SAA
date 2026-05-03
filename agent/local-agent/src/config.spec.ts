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
