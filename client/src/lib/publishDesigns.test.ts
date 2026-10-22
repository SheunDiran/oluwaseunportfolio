import { afterEach, describe, expect, it, vi } from "vitest";
import { publishDesigns, type QueuedDesign } from "./publishDesigns";

const config = { repo: "owner/portfolio", branch: "main", dataPath: "client/public/designs.json", token: "test-only" };
const picture = (id: string): QueuedDesign => ({ id, file: { type: "image/png", arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer } as File, title: `Flyer ${id}`, description: "", type: "Flyers & Posters", tags: "event, community" });
afterEach(() => vi.unstubAllGlobals());
describe("publishing a picture batch", () => {
  function setup(conflict = false) {
    const calls: { url: string; body: any; method: string }[] = [];
    const previous = [{ title: "Existing flyer", type: "Branding", imagePath: "/designs/existing.png" }];
    vi.stubGlobal("fetch", vi.fn(async (url: string, options: RequestInit) => {
      const body = options.body ? JSON.parse(String(options.body)) : undefined;
      calls.push({ url, body, method: options.method! });
      let data: any = { sha: "blob" };
      if (url.includes("git/ref/heads/")) data = { object: { sha: "latest-head" } };
      else if (url.endsWith("git/commits/latest-head")) data = { tree: { sha: "latest-tree" } };
      else if (url.includes("contents/")) data = { content: btoa(JSON.stringify(previous)) };
      else if (url.endsWith("git/trees")) data = { sha: "new-tree" };
      else if (url.endsWith("git/commits")) data = { sha: "new-commit" };
      const rejected = conflict && options.method === "PATCH";
      return { ok: !rejected, status: rejected ? 422 : 200, json: async () => data };
    }));
    return calls;
  }
  it("publishes optional descriptions and several pictures in one commit without losing existing designs", async () => {
    const calls = setup();
    const result = await publishDesigns(config, [picture("one"), picture("two")], () => {});
    expect(result.map(item => item.title)).toEqual(["Flyer one", "Flyer two", "Existing flyer"]);
    expect(result[0].description).toBe("");
    expect(calls.filter(call => call.method === "PATCH")).toHaveLength(1);
    expect(calls.find(call => call.method === "PATCH")?.body).toEqual({ sha: "new-commit", force: false });
    const tree = calls.find(call => call.url.endsWith("git/trees"))!.body;
    expect(tree.base_tree).toBe("latest-tree");
    expect(tree.tree).toHaveLength(3);
    expect(JSON.parse(tree.tree[2].content)).toEqual(result);
    expect(calls.find(call => call.url.includes("contents/"))!.url).toContain("ref=latest-head");
  });
  it("rejects a concurrent branch update rather than overwriting it", async () => {
    const calls = setup(true);
    await expect(publishDesigns(config, [picture("one")], () => {})).rejects.toThrow("portfolio changed");
    expect(calls.filter(call => call.method === "PATCH")).toHaveLength(1);
    expect(calls.at(-1)!.body.force).toBe(false);
  });
});
