import assert from "node:assert/strict";
import { test } from "vitest";
import { createSupabaseRuntime } from "./supabaseRuntime.ts";

test("creates no Supabase runtime when environment is incomplete", () => {
  assert.equal(createSupabaseRuntime({}), null);
});

test("creates Supabase runtime when server-side credentials are present", () => {
  const runtime = createSupabaseRuntime({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });

  assert.equal(runtime?.config.url, "https://project.supabase.co");
  assert.equal(typeof runtime?.client.from, "function");
});
