import { spawn } from "node:child_process";
import { isArray, isNumber, isPlainObject, isString } from "es-toolkit/compat";

export type ZellijCommandResult = {
  /** Captured stdout from the zellij process. */
  stdout: string;
  /** Captured stderr from the zellij process. */
  stderr: string;
  /** Process exit code normalized to `1` when unavailable. */
  exitCode: number;
};

/** Executes a zellij command and returns its raw process result. */
export type ZellijRunner = (command: string, args: string[]) => Promise<ZellijCommandResult>;

export type ZellijTransportOptions = {
  /** zellij executable path used for all external transport calls. */
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
  /**
   * Error raised when an external zellij command exits non-zero.
   */
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

  /**
   * Ensures the named zellij session exists using zellij's background attach API.
   */
  async ensureSession(sessionName: string): Promise<void> {
    await this.run(["attach", "--create-background", sessionName]);
  }

  /**
   * Creates a named zellij pane and returns the pane id reported by zellij.
   */
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

  /**
   * Sends a shell command to a zellij pane and presses Enter.
   */
  async sendCommand(input: SendZellijCommandInput): Promise<void> {
    await this.sendText({ sessionName: input.sessionName, paneId: input.paneId, text: input.command });
  }

  /**
   * Sends arbitrary text to a zellij pane and presses Enter.
   */
  async sendText(input: SendZellijTextInput): Promise<void> {
    const { sessionName, paneId, text } = input;
    const targetArgs = ["--session", sessionName, "action"];

    await this.run([...targetArgs, "paste", "--pane-id", paneId, text]);
    await this.run([...targetArgs, "send-keys", "--pane-id", paneId, "Enter"]);
  }

  /**
   * Lists non-plugin zellij panes visible in the target session.
   */
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

  /**
   * Checks whether a central-managed pane id still exists in zellij.
   */
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
