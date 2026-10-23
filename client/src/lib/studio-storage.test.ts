import { afterEach, describe, expect, it, vi } from "vitest";
const objects = vi.hoisted(() => new Map<string, string>());
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (path: string, body: string) => { objects.set(path, body); }),
  list: vi.fn(async (options: { prefix: string }) => ({ blobs: Array.from(objects.keys()).filter(path => path.startsWith(options.prefix)).map(pathname => ({ pathname })), hasMore: false })),
  get: vi.fn(async (path: string) => ({ statusCode: 200, stream: new Response(objects.get(path)).body })),
}));
import { readArchive, saveBatch } from "../../../server/studio-storage";
afterEach(() => { objects.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("persistent studio batches", () => {
  it("preserves simultaneous publications in separate objects", async () => {
    vi.stubEnv("BLOB_STORE_ID", "test-store");
    await Promise.all([saveBatch("designs", [{ title: "First" }]), saveBatch("designs", [{ title: "Second" }])]);
    expect(objects.size).toBe(2);
    expect(await readArchive("designs")).toEqual(expect.arrayContaining([expect.objectContaining({ title: "First" }), expect.objectContaining({ title: "Second" })]));
  });
  it("applies edits and removals to existing bundled testimonials", async () => {
    vi.stubEnv("BLOB_STORE_ID", "test-store");
    const initial = await readArchive("testimonials");
    expect(initial.length).toBeGreaterThan(0);
    await saveBatch("testimonial-changes", [{ id: initial[0].id, quote: "Approved updated feedback", name: "Client" }]);
    expect((await readArchive("testimonials"))[0].quote).toBe("Approved updated feedback");
    const other = initial[1];
    await saveBatch("testimonial-changes", [{ id: other.id, removed: true }]);
    expect((await readArchive("testimonials")).some(item => item.id === other.id)).toBe(false);
  });
  it("keeps pinned designs ahead of later uploads and merges edits, replacement and removal", async () => {
    vi.stubEnv("BLOB_STORE_ID", "test-store");
    vi.spyOn(Date, "now").mockReturnValue(1000);
    await saveBatch("designs", [{ title: "First", imagePath: "/old.png" }, { title: "Second" }]);
    const [first, second] = await readArchive("designs");
    expect([first.title, second.title]).toEqual(["First", "Second"]);
    vi.spyOn(Date, "now").mockReturnValue(2000);
    await saveBatch("design-changes", [{ id: first.id, pinned: true, pinOrder: 2 }, { id: second.id, pinned: true, pinOrder: 1 }]);
    vi.spyOn(Date, "now").mockReturnValue(3000);
    await saveBatch("designs", [{ title: "Newest" }]);
    expect((await readArchive("designs")).map(item => item.title)).toEqual(["Second", "First", "Newest"]);
    vi.spyOn(Date, "now").mockReturnValue(4000);
    await saveBatch("design-changes", [{ id: first.id, title: "Updated", description: "Details", imagePath: "/replacement.png" }]);
    const edited = (await readArchive("designs"))[1];
    expect(edited).toMatchObject({ id: first.id, pinned: true, pinOrder: 2, title: "Updated", imagePath: "/replacement.png" });
    vi.spyOn(Date, "now").mockReturnValue(5000);
    await saveBatch("design-changes", [{ id: first.id, pinned: false, pinOrder: 0 }, { id: second.id, removed: true }]);
    expect((await readArchive("designs")).map(item => item.title)).toEqual(["Newest", "Updated"]);
  });
  it("requires connected storage for writes", async () => {
    vi.stubEnv("BLOB_STORE_ID", ""); vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    await expect(saveBatch("designs", [])).rejects.toThrow("StorageNotConnected");
    expect(objects.size).toBe(0);
  });
});
