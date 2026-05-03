import { resolve } from "node:path";

export type LocalAgentConfig = {
  agentId: string;
  outboxPath: string;
  cursorPath: string;
};

export function loadConfig(): LocalAgentConfig {
  const outboxPath = resolve(process.env.LOCAL_AGENT_MOCK_OUTBOX ?? ".local/outbox.jsonl");
  const cursorPath = resolve(process.env.LOCAL_AGENT_CURSOR_STORE ?? ".local/cursors.json");

  return {
    agentId: process.env.LOCAL_AGENT_ID ?? "local-agent-dev",
    outboxPath,
    cursorPath,
  };
}
