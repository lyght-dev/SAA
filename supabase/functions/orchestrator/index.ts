import { createApp } from "../../../agent/central-orchestrator/src/app.ts";
import { createSupabaseRuntime } from "../../../agent/central-orchestrator/src/infrastructure/supabase/supabaseRuntime.ts";

const supabase = createSupabaseRuntime({
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? undefined,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined,
});

if (!supabase) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const app = createApp({ supabase });

Deno.serve((request) => app.fetch(stripFunctionPrefix(request)));

function stripFunctionPrefix(request: Request): Request {
  const url = new URL(request.url);
  url.pathname = url.pathname
    .replace(/^\/functions\/v1\/orchestrator\/?/, "/")
    .replace(/^\/orchestrator\/?/, "/");
  return new Request(url, request);
}
