import { type Hono } from "hono";

export function registerHealthRoute(app: Hono): void {
  app.get("/healthz", (context) => context.json({ ok: true }));
}
