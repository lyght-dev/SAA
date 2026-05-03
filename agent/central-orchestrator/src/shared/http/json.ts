import * as v from "valibot";

export async function handleJson<T>(
  context: { req: { json: () => Promise<unknown> }; json: (value: unknown, status?: number) => Response },
  schema: v.GenericSchema<unknown, T>,
  handler: (body: T) => Promise<Record<string, unknown>>,
): Promise<Response> {
  try {
    const body = v.parse(schema, await context.req.json());
    return context.json(await handler(body));
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
  }
}
