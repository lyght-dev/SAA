import { type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseClient, loadSupabaseConfig, type SupabaseConfig, type SupabaseEnv } from "./supabaseClient.ts";

export type SupabaseRuntime = {
  config: SupabaseConfig;
  client: SupabaseClient;
};

export function createSupabaseRuntime(env: SupabaseEnv): SupabaseRuntime | null {
  const config = loadSupabaseConfig(env);
  if (!config) {
    return null;
  }

  return {
    config,
    client: createSupabaseClient(config),
  };
}
