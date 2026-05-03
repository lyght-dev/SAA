import { serve } from "@hono/node-server";
import app from "./app.ts";

export type DevServerOptions = {
  hostname: string;
  port: number;
};

export function getDevServerOptions(env: NodeJS.ProcessEnv): DevServerOptions {
  return {
    hostname: env.CENTRAL_ORCHESTRATOR_HOST ?? "127.0.0.1",
    port: toPort(env.CENTRAL_ORCHESTRATOR_PORT),
  };
}

function toPort(value: string | undefined): number {
  if (!value) {
    return 47331;
  }

  const port = Number(value);
  if (Number.isInteger(port) && port > 0 && port < 65536) {
    return port;
  }

  return 47331;
}

if (process.argv[1]?.endsWith("dev.ts")) {
  const options = getDevServerOptions(process.env);
  serve(
    {
      fetch: app.fetch,
      hostname: options.hostname,
      port: options.port,
    },
    ({ address, port }) => {
      process.stdout.write(`central-orchestrator listening on http://${address}:${port}\n`);
    },
  );
}
