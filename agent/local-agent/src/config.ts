import { resolve } from "node:path";

export type LocalAgentConfig = {
  agentId: string;
  outboxPath: string;
  cursorPath: string;
  zellijBinaryPath: string;
  hookRelayHost: string;
  hookRelayPort: number;
  centralBaseUrl?: string;
  authToken?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  pollIntervalMs: number;
};

export function loadConfig(): LocalAgentConfig {
  const outboxPath = resolve(process.env.LOCAL_AGENT_MOCK_OUTBOX ?? ".local/outbox.jsonl");
  const cursorPath = resolve(process.env.LOCAL_AGENT_CURSOR_STORE ?? ".local/cursors.json");

  const config: LocalAgentConfig = {
    agentId: process.env.LOCAL_AGENT_ID ?? "local-agent-dev",
    outboxPath,
    cursorPath,
    zellijBinaryPath: process.env.LOCAL_AGENT_ZELLIJ_BIN ?? "zellij",
    hookRelayHost: process.env.LOCAL_AGENT_HOOK_RELAY_HOST ?? "127.0.0.1",
    hookRelayPort: Number(process.env.LOCAL_AGENT_HOOK_RELAY_PORT ?? 47231),
    pollIntervalMs: Number(process.env.LOCAL_AGENT_POLL_INTERVAL_MS ?? 1000),
  };

  if (process.env.LOCAL_AGENT_CENTRAL_BASE_URL) {
    config.centralBaseUrl = process.env.LOCAL_AGENT_CENTRAL_BASE_URL;
  }
  if (process.env.LOCAL_AGENT_AUTH_TOKEN) {
    config.authToken = process.env.LOCAL_AGENT_AUTH_TOKEN;
  }
  if (process.env.LOCAL_AGENT_SUPABASE_URL) {
    config.supabaseUrl = process.env.LOCAL_AGENT_SUPABASE_URL;
  }
  if (process.env.LOCAL_AGENT_SUPABASE_ANON_KEY) {
    config.supabaseAnonKey = process.env.LOCAL_AGENT_SUPABASE_ANON_KEY;
  }

  return config;
}
