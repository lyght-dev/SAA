import assert from "node:assert/strict";
import { test } from "vitest";
import { createSupabaseClient, loadSupabaseConfig } from "./supabaseClient.ts";

test("loads Supabase config from server-only environment variables", () => {
  const config = loadSupabaseConfig({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });

  assert.deepEqual(config, {
    url: "https://project.supabase.co",
    serviceRoleKey: "service-role-key",
  });
});

test("returns null when Supabase server env is incomplete", () => {
  assert.equal(loadSupabaseConfig({ SUPABASE_URL: "https://project.supabase.co" }), null);
  assert.equal(loadSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: "service-role-key" }), null);
});

test("creates a Supabase client for server-side infrastructure adapters", () => {
  const client = createSupabaseClient({
    url: "https://project.supabase.co",
    serviceRoleKey: "service-role-key",
  });

  assert.equal(typeof client.from, "function");
});
