import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../../../api/studio";
const origin = "https://portfolio.example";
const request = (body: unknown, cookie = "", source = origin) => new Request(`${origin}/api/studio`, { method: "POST", headers: { Origin: source, "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv("STUDIO_PASSWORD", "a-long-test-only-owner-password"); vi.stubEnv("STUDIO_GITHUB_TOKEN", "test-only-token"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
async function login() { const response = await POST(request({ action: "login", password: "a-long-test-only-owner-password" })); return response.headers.get("set-cookie")!.split(";")[0]; }
describe("private owner studio", () => {
  it("fails closed when private setup is absent", async () => { vi.stubEnv("STUDIO_GITHUB_TOKEN", ""); expect((await GET(new Request(`${origin}/api/studio`))).status).toBe(503); });
  it("rejects incorrect passwords and unauthenticated publishing", async () => { expect((await POST(request({ action: "login", password: "wrong" }))).status).toBe(401); expect((await POST(request({ action: "designs", items: [] }))).status).toBe(401); });
  it("uses an HttpOnly secure cookie and rejects forged sessions", async () => {
    const response = await POST(request({ action: "login", password: "a-long-test-only-owner-password" }));
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
    expect((await (await GET(new Request(`${origin}/api/studio`, { headers: { Cookie: cookie.split(";")[0] } }))).json()).authenticated).toBe(true);
    expect((await (await GET(new Request(`${origin}/api/studio`, { headers: { Cookie: "__Host-sheun-studio=forged.fake" } }))).json()).authenticated).toBe(false);
  });
  it("rejects cross-origin posts", async () => { expect((await POST(request({ action: "logout" }, await login(), "https://other.example"))).status).toBe(403); });
  it("publishes several designs with blank descriptions in one commit, preserving existing designs", async () => {
    const cookie = await login(); const calls: { path: string; body: any }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, options: RequestInit) => {
      const path = String(url); const body = options.body ? JSON.parse(String(options.body)) : undefined; calls.push({ path, body });
      const data = path.endsWith("git/blobs") ? { sha: "image-sha" } : path.endsWith("git/ref/heads/main") ? { object: { sha: "head" } } : path.endsWith("git/commits/head") ? { tree: { sha: "base-tree" } } : path.includes("contents/") ? { content: Buffer.from(JSON.stringify([{ title: "Previous" }])).toString("base64") } : path.endsWith("git/trees") ? { sha: "new-tree" } : { sha: "new-commit" };
      return { ok: true, json: async () => data };
    }));
    const image = Buffer.from([137,80,78,71,13,10,26,10,0]).toString("base64");
    const upload = await (await POST(request({ action: "image", image }, cookie))).json();
    const item = { ticket: upload.ticket, title: "My flyer", description: "", type: "Flyers & Posters", tags: "" };
    const response = await POST(request({ action: "designs", items: [item, { ...item, title: "Second flyer" }] }, cookie));
    expect(response.status).toBe(200);
    const result = await response.json(); expect(result.items.map((entry: any) => entry.title)).toEqual(["My flyer", "Second flyer", "Previous"]);
    expect(calls.filter(call => call.path.endsWith("git/refs/heads/main"))).toHaveLength(1);
    expect(calls.at(-1)!.body.force).toBe(false);
  });
  it("rejects an unsigned image ticket without writing", async () => {
    const cookie = await login(); const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ object: { sha: "head" }, tree: { sha: "tree" } }) })); vi.stubGlobal("fetch", fetch);
    expect((await POST(request({ action: "designs", items: [{ ticket: "forged.fake", title: "No" }] }, cookie))).status).toBe(400);
    expect(fetch.mock.calls.every(call => !(call[1] as any)?.body)).toBe(true);
  });
});
