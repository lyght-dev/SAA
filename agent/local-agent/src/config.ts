import { resolve } from "node:path";

export type LocalAgentConfig = {
  agentId: string;
  outboxPath: string;
  cursorPath: string;
  zellijBinaryPath: string;
  hookRelayHost: string;
  hookRelayPort: number;
};

export function loadConfig(): LocalAgentConfig {
  const outboxPath = resolve(process.env.LOCAL_AGENT_MOCK_OUTBOX ?? ".local/outbox.jsonl");
  const cursorPath = resolve(process.env.LOCAL_AGENT_CURSOR_STORE ?? ".local/cursors.json");

  return {
    agentId: process.env.LOCAL_AGENT_ID ?? "local-agent-dev",
    outboxPath,
    cursorPath,
    zellijBinaryPath: process.env.LOCAL_AGENT_ZELLIJ_BIN ?? "zellij",
    hookRelayHost: process.env.LOCAL_AGENT_HOOK_RELAY_HOST ?? "127.0.0.1",
    hookRelayPort: Number(process.env.LOCAL_AGENT_HOOK_RELAY_PORT ?? 47231),
  };
}
