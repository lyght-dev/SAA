import assert from "node:assert/strict";
import { test } from "vitest";
import { CentralCommandWorker } from "./centralCommandWorker.ts";

test("claims a codex message command, dispatches it, and completes it", async () => {
  const completed: unknown[] = [];
  const worker = new CentralCommandWorker({
    agentId: "agent-a",
    central: {
      claimCommand: async () => ({
        id: "cmd-1",
        payload: {
          type: "codex.message.send",
          sessionName: "saa-agent",
          paneId: "terminal_1",
          message: "hello",
        },
      }),
      completeCommand: async (_agentId, commandId, result) => {
        completed.push({ commandId, result });
      },
      failCommand: async () => assert.fail("failCommand should not be called"),
    },
    codex: {
      handle: async (request) => {
        assert.equal(request.message, "hello");
        return { ok: true, sessionName: request.sessionName, paneId: request.paneId };
      },
    },
  });

  await worker.tick();

  assert.deepEqual(completed, [{ commandId: "cmd-1", result: { ok: true, sessionName: "saa-agent", paneId: "terminal_1" } }]);
});

test("fails an unsupported command type", async () => {
  const failures: unknown[] = [];
  const worker = new CentralCommandWorker({
    agentId: "agent-a",
    central: {
      claimCommand: async () => ({ id: "cmd-1", payload: { type: "approval.respond" } }),
      completeCommand: async () => assert.fail("completeCommand should not be called"),
      failCommand: async (_agentId, commandId, error) => {
        failures.push({ commandId, error });
      },
    },
  });

  await worker.tick();

  assert.deepEqual(failures, [{ commandId: "cmd-1", error: "Unsupported command type: approval.respond" }]);
});
