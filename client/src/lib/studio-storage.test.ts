import { afterEach, describe, expect, it, vi } from "vitest";
const objects = vi.hoisted(() => new Map<string, string>());
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (path: string, body: string) => { objects.set(path, body); }),
  list: vi.fn(async () => ({ blobs: Array.from(objects.keys()).map(pathname => ({ pathname })), hasMore: false })),
  get: vi.fn(async (path: string) => ({ statusCode: 200, stream: new Response(objects.get(path)).body })),
}));
import { readArchive, saveBatch } from "../../../server/studio-storage";
afterEach(() => { objects.clear(); vi.unstubAllEnvs(); });
describe("persistent studio batches", () => {
  it("preserves simultaneous publications in separate objects", async () => {
    vi.stubEnv("BLOB_STORE_ID", "test-store");
    await Promise.all([saveBatch("designs", [{ title: "First" }]), saveBatch("designs", [{ title: "Second" }])]);
    expect(objects.size).toBe(2);
    expect(await readArchive("designs")).toEqual(expect.arrayContaining([{ title: "First" }, { title: "Second" }]));
  });
  it("requires connected storage for writes", async () => {
    vi.stubEnv("BLOB_STORE_ID", ""); vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    await expect(saveBatch("designs", [])).rejects.toThrow("StorageNotConnected");
    expect(objects.size).toBe(0);
  });
});
