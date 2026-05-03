import assert from "node:assert/strict";
import test from "node:test";
import { ZellijTransport, type ZellijRunner } from "./zellijTransport.ts";

test("ensures a background zellij session through the official attach API", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner);
  await zellij.ensureSession("saa-agent");

  assert.deepEqual(calls, [
    {
      command: "zellij",
      args: ["attach", "--create-background", "saa-agent"],
    },
  ]);
});

test("uses a configured zellij binary path", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner, { binaryPath: "/opt/bin/zellij" });
  await zellij.ensureSession("saa-agent");

  assert.equal(calls[0]?.command, "/opt/bin/zellij");
});

test("creates a named pane in a target zellij session and returns its pane id", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "terminal_7\n", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner);
  const paneId = await zellij.createPane({
    sessionName: "saa-agent",
    paneName: "worker",
    cwd: "/workspaces/SAA",
  });

  assert.equal(paneId, "terminal_7");
  assert.deepEqual(calls, [
    {
      command: "zellij",
      args: [
        "--session",
        "saa-agent",
        "action",
        "new-pane",
        "--name",
        "worker",
        "--cwd",
        "/workspaces/SAA",
      ],
    },
  ]);
});

test("pastes a command into a pane and sends Enter", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner);
  await zellij.sendCommand({
    sessionName: "saa-agent",
    paneId: "terminal_7",
    command: "pnpm --dir agent test",
  });

  assert.deepEqual(calls, [
    {
      command: "zellij",
      args: [
        "--session",
        "saa-agent",
        "action",
        "paste",
        "--pane-id",
        "terminal_7",
        "pnpm --dir agent test",
      ],
    },
    {
      command: "zellij",
      args: ["--session", "saa-agent", "action", "send-keys", "--pane-id", "terminal_7", "Enter"],
    },
  ]);
});

test("throws a zellij error when an action exits non-zero", async () => {
  const runner: ZellijRunner = async () => ({
    stdout: "",
    stderr: "No active zellij sessions found.",
    exitCode: 1,
  });

  const zellij = new ZellijTransport(runner);

  await assert.rejects(
    () => zellij.ensureSession("saa-agent"),
    (error) =>
      error instanceof Error &&
      error.message.includes("zellij attach --create-background saa-agent failed with exit code 1") &&
      error.message.includes("No active zellij sessions found."),
  );
});
