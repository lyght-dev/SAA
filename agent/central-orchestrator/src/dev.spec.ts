import assert from "node:assert/strict";
import { test } from "vitest";
import { getDevServerOptions } from "./dev.ts";

test("builds local dev server options from environment", () => {
  const options = getDevServerOptions({
    CENTRAL_ORCHESTRATOR_HOST: "127.0.0.1",
    CENTRAL_ORCHESTRATOR_PORT: "49152",
  });

  assert.equal(options.hostname, "127.0.0.1");
  assert.equal(options.port, 49152);
});

test("uses localhost defaults for local dev server options", () => {
  const options = getDevServerOptions({});

  assert.equal(options.hostname, "127.0.0.1");
  assert.equal(options.port, 47331);
});
