import { expect, test } from "vitest";
import { ZellijTransport, type ZellijRunner } from "./zellijTransport.ts";

test("ensures a background zellij session through the official attach API", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner);
  await zellij.ensureSession("saa-agent");

  expect(calls).toEqual([
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

  expect(calls[0]?.command).toBe("/opt/bin/zellij");
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

  expect(paneId).toBe("terminal_7");
  expect(calls).toEqual([
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

  expect(calls).toEqual([
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

test("sends text into a specific pane and sends Enter", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return { stdout: "", stderr: "", exitCode: 0 };
  };

  const zellij = new ZellijTransport(runner);
  await zellij.sendText({
    sessionName: "saa-agent",
    paneId: "terminal_7",
    text: "어떤 skill들이 있어?",
  });

  expect(calls).toEqual([
    {
      command: "zellij",
      args: [
        "--session",
        "saa-agent",
        "action",
        "paste",
        "--pane-id",
        "terminal_7",
        "어떤 skill들이 있어?",
      ],
    },
    {
      command: "zellij",
      args: ["--session", "saa-agent", "action", "send-keys", "--pane-id", "terminal_7", "Enter"],
    },
  ]);
});

test("checks whether a specific pane exists in a session", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const runner: ZellijRunner = async (command, args) => {
    calls.push({ command, args });
    return {
      stdout: JSON.stringify([
        { id: 1, pane_id: "terminal_1", is_plugin: false },
        { id: 7, pane_id: "terminal_7", is_plugin: false },
      ]),
      stderr: "",
      exitCode: 0,
    };
  };

  const zellij = new ZellijTransport(runner);
  const exists = await zellij.paneExists({ sessionName: "saa-agent", paneId: "terminal_7" });

  expect(exists).toBe(true);
  expect(calls).toEqual([
    {
      command: "zellij",
      args: ["--session", "saa-agent", "action", "list-panes", "--json", "--all", "--state"],
    },
  ]);
});

test("treats missing pane ids as absent", async () => {
  const runner: ZellijRunner = async () => ({
    stdout: JSON.stringify([{ id: 1, pane_id: "terminal_1", is_plugin: false }]),
    stderr: "",
    exitCode: 0,
  });

  const zellij = new ZellijTransport(runner);

  await expect(zellij.paneExists({ sessionName: "saa-agent", paneId: "terminal_7" })).resolves.toBe(false);
});

test("ignores plugin panes when checking terminal pane ids", async () => {
  const runner: ZellijRunner = async () => ({
    stdout: JSON.stringify([
      { id: 7, is_plugin: true, title: "status-bar" },
      { id: 1, is_plugin: false, title: "codex" },
    ]),
    stderr: "",
    exitCode: 0,
  });

  const zellij = new ZellijTransport(runner);

  await expect(zellij.paneExists({ sessionName: "saa-agent", paneId: "terminal_7" })).resolves.toBe(false);
});

test("maps zellij terminal pane ids from numeric list-panes ids", async () => {
  const runner: ZellijRunner = async () => ({
    stdout: JSON.stringify([{ id: 7, is_plugin: false, title: "codex" }]),
    stderr: "",
    exitCode: 0,
  });

  const zellij = new ZellijTransport(runner);

  await expect(zellij.paneExists({ sessionName: "saa-agent", paneId: "terminal_7" })).resolves.toBe(true);
});

test("throws a zellij error when an action exits non-zero", async () => {
  const runner: ZellijRunner = async () => ({
    stdout: "",
    stderr: "No active zellij sessions found.",
    exitCode: 1,
  });

  const zellij = new ZellijTransport(runner);

  await expect(zellij.ensureSession("saa-agent")).rejects.toThrow(
    /zellij attach --create-background saa-agent failed with exit code 1[\s\S]*No active zellij sessions found\./,
  );
});
