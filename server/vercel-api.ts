type NodeRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type NodeResponse = {
  status(code: number): NodeResponse;
  setHeader(name: string, value: string): void;
  send(body: Buffer): void;
};
type WebHandler = (request: Request) => Response | Promise<Response>;

/** Adapt Web Request/Response route handlers to Vercel's Node serverless contract. */
export function vercelApi(handlers: Partial<Record<string, WebHandler>>) {
  return async function handler(req: NodeRequest, res: NodeResponse) {
    const method = (req.method || "GET").toUpperCase();
    const route = handlers[method];
    if (!route) {
      const allowed = Object.keys(handlers).join(", ");
      res.status(405);
      res.setHeader("Allow", allowed);
      res.send(Buffer.from("Method not allowed"));
      return;
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers || {})) {
      if (value === undefined) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
    const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost";
    const protocol = (headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD" && req.body !== undefined) {
      if (typeof req.body === "string") body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body.toString("utf8");
      else body = JSON.stringify(req.body);
    }
    const request = new Request(url, { method, headers, ...(body === undefined ? {} : { body }) });
    const response = await route(request);
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  };
}
