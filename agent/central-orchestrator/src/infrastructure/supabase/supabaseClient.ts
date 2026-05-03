import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isString } from "es-toolkit/compat";

export type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

export function loadSupabaseConfig(env: NodeJS.ProcessEnv): SupabaseConfig | null {
  const url = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isNonEmptyString(url) || !isNonEmptyString(serviceRoleKey)) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}
