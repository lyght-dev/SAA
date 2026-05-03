import { spawn } from "node:child_process";
import { isArray, isNumber, isPlainObject, isString } from "es-toolkit/compat";

export type ZellijCommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type ZellijRunner = (command: string, args: string[]) => Promise<ZellijCommandResult>;

export type ZellijTransportOptions = {
  binaryPath?: string;
};

export type CreateZellijPaneInput = {
  sessionName: string;
  paneName: string;
  cwd?: string;
};

export type SendZellijCommandInput = {
  sessionName: string;
  paneId: string;
  command: string;
};

export type SendZellijTextInput = {
  sessionName: string;
  paneId: string;
  text: string;
};

export type ZellijPane = {
  paneId: string;
};

export type ZellijPaneLookupInput = {
  sessionName: string;
  paneId: string;
};

export class ZellijTransportError extends Error {
  constructor(command: string, args: string[], result: ZellijCommandResult) {
    const stderr = result.stderr.trim();
    const details = stderr ? `: ${stderr}` : "";
    super(`${[command, ...args].join(" ")} failed with exit code ${result.exitCode}${details}`);
    this.name = "ZellijTransportError";
  }
}

export class ZellijTransport {
  private readonly runner: ZellijRunner;
  private readonly binaryPath: string;

  constructor(runner: ZellijRunner = runCommand, options: ZellijTransportOptions = {}) {
    this.runner = runner;
    this.binaryPath = options.binaryPath ?? "zellij";
  }

  async ensureSession(sessionName: string): Promise<void> {
    await this.run(["attach", "--create-background", sessionName]);
  }

  async createPane(input: CreateZellijPaneInput): Promise<string> {
    const { sessionName, paneName, cwd } = input;
    const cwdArgs = cwd ? ["--cwd", cwd] : [];
    const result = await this.run([
      "--session",
      sessionName,
      "action",
      "new-pane",
      "--name",
      paneName,
      ...cwdArgs,
    ]);

    return result.stdout.trim();
  }

  async sendCommand(input: SendZellijCommandInput): Promise<void> {
    await this.sendText({ sessionName: input.sessionName, paneId: input.paneId, text: input.command });
  }

  async sendText(input: SendZellijTextInput): Promise<void> {
    const { sessionName, paneId, text } = input;
    const targetArgs = ["--session", sessionName, "action"];

    await this.run([...targetArgs, "paste", "--pane-id", paneId, text]);
    await this.run([...targetArgs, "send-keys", "--pane-id", paneId, "Enter"]);
  }

  async listPanes(sessionName: string): Promise<ZellijPane[]> {
    const result = await this.run([
      "--session",
      sessionName,
      "action",
      "list-panes",
      "--json",
      "--all",
      "--state",
    ]);

    return parsePanes(result.stdout);
  }

  async paneExists(input: ZellijPaneLookupInput): Promise<boolean> {
    const panes = await this.listPanes(input.sessionName);
    return panes.some(({ paneId }) => paneId === input.paneId);
  }

  private async run(args: string[]): Promise<ZellijCommandResult> {
    const result = await this.runner(this.binaryPath, args);
    if (result.exitCode === 0) {
      return result;
    }

    throw new ZellijTransportError(this.binaryPath, args, result);
  }
}

function parsePanes(text: string): ZellijPane[] {
  try {
    const parsed = JSON.parse(text);
    if (!isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((value) => {
      const paneId = getPaneId(value);
      return paneId ? [{ paneId }] : [];
    });
  } catch {
    return [];
  }
}

function getPaneId(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.is_plugin === true) {
    return null;
  }

  if (isString(record.pane_id)) {
    return record.pane_id;
  }
  if (isString(record.paneId)) {
    return record.paneId;
  }
  if (isNumber(record.id)) {
    return `terminal_${record.id}`;
  }

  return null;
}

async function runCommand(command: string, args: string[]): Promise<ZellijCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        exitCode: code ?? 1,
      });
    });
  });
}
