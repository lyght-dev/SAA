import assert from "node:assert/strict";
import { test } from "vitest";
import { SupabaseCentralStore } from "./supabaseCentralStore.ts";

test("upserts LocalAgent rows into Supabase tables", async () => {
  const client = new FakeSupabaseClient();
  const store = new SupabaseCentralStore(client);

  await store.saveAgent({
    agentId: "agent-a",
    nodeName: "macbook",
    hostname: "macbook.local",
    capabilities: { codex: true, zellij: true },
    status: "online",
    registeredAt: "2026-05-04T00:00:00.000Z",
    lastSeenAt: "2026-05-04T00:00:00.000Z",
  });

  assert.deepEqual(client.rows.local_agents[0], {
    agent_id: "agent-a",
    node_name: "macbook",
    hostname: "macbook.local",
    capabilities: { codex: true, zellij: true },
    status: "online",
    registered_at: "2026-05-04T00:00:00.000Z",
    last_seen_at: "2026-05-04T00:00:00.000Z",
  });
});

test("persists and reads queued commands for an agent", async () => {
  const client = new FakeSupabaseClient();
  const store = new SupabaseCentralStore(client);

  await store.saveCommand({
    id: "cmd-1",
    agentId: "agent-a",
    sessionId: "sess-1",
    type: "codex.message.send",
    status: "queued",
    payload: {
      type: "codex.message.send",
      sessionName: "saa-agent",
      paneId: "terminal_1",
      message: "hello",
    },
    queuedAt: "2026-05-04T00:00:00.000Z",
  });

  const commands = await store.listCommandsForAgent("agent-a");
  assert.equal(commands.length, 1);
  assert.equal(commands[0]?.id, "cmd-1");
  assert.equal(commands[0]?.payload.type, "codex.message.send");
});

type TableName =
  | "local_agents"
  | "agent_sessions"
  | "agent_commands"
  | "domain_events"
  | "approval_requests";

class FakeSupabaseClient {
  readonly rows: Record<TableName, Record<string, unknown>[]> = {
    local_agents: [],
    agent_sessions: [],
    agent_commands: [],
    domain_events: [],
    approval_requests: [],
  };

  from(table: TableName): FakeQuery {
    return new FakeQuery(this.rows[table]);
  }
}

class FakeQuery implements PromiseLike<{ data: unknown; error: null }> {
  private data: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private maybeSingleMode = false;

  constructor(private readonly rows: Record<string, unknown>[]) {}

  upsert(row: Record<string, unknown>): FakeQuery {
    this.rows.splice(0, this.rows.length, row);
    this.data = row;
    return this;
  }

  insert(row: Record<string, unknown>): FakeQuery {
    this.rows.push(row);
    this.data = row;
    return this;
  }

  select(): FakeQuery {
    this.data = [...this.rows];
    return this;
  }

  eq(column: string, value: unknown): FakeQuery {
    const source = Array.isArray(this.data) ? this.data : this.rows;
    this.data = source.filter((row) => row[column] === value);
    return this;
  }

  order(): FakeQuery {
    return this;
  }

  maybeSingle(): FakeQuery {
    this.maybeSingleMode = true;
    return this;
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    _onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const data = this.maybeSingleMode && Array.isArray(this.data) ? this.data[0] ?? null : this.data;
    return Promise.resolve({ data, error: null }).then(onfulfilled ?? undefined);
  }
}
