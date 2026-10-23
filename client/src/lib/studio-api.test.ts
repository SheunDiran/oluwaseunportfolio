import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../server/studio-storage.js", () => ({ readArchive: vi.fn(async () => []), saveImage: vi.fn(async () => "artwork/12345678-1234-1234-1234-123456789012.png"), saveBatch: vi.fn(async () => {}) }));
import { readArchive, saveBatch } from "../../../server/studio-storage.js";
import { GET, POST } from "../../../api/studio";
const origin = "https://portfolio.example";
const request = (body: unknown, source = origin) => new Request(`${origin}/api/studio`, { method: "POST", headers: { Origin: source, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("STUDIO_PASSWORD", ""); vi.mocked(readArchive).mockResolvedValue([]); });
afterEach(() => vi.unstubAllEnvs());
describe("direct portfolio studio", () => {
  it("opens without password, cookie, or authentication setup", async () => {
    expect((await GET(new Request(`${origin}/api/studio`))).status).toBe(200);
    const data = await (await GET(new Request(`${origin}/api/studio?action=data`))).json();
    expect(data).toEqual({ designs: [], testimonials: [] });
  });
  it("publishes several designs with optional descriptions without logging in", async () => {
    const image = Buffer.from([137,80,78,71,13,10,26,10,0]).toString("base64");
    const upload = await (await POST(request({ action: "image", image }))).json();
    const item = { ticket: upload.ticket, title: "My flyer", type: "Flyers & Posters" };
    expect((await POST(request({ action: "designs", items: [item, { ...item, title: "Second" }] }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("designs", expect.arrayContaining([expect.objectContaining({ title: "My flyer", description: "" }), expect.objectContaining({ title: "Second" })]));
  });
  it("edits and removes existing testimonials by stable identity", async () => {
    vi.mocked(readArchive).mockResolvedValue([{ id: "seed:testimonials:0", quote: "Old", name: "Client" }]);
    expect((await POST(request({ action: "edit-testimonial", id: "seed:testimonials:0", quote: "Updated", name: "Client" }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("testimonial-changes", [{ id: "seed:testimonials:0", quote: "Updated", name: "Client", organisation: "" }]);
    expect((await POST(request({ action: "remove-testimonial", id: "seed:testimonials:0" }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("testimonial-changes", [{ id: "seed:testimonials:0", removed: true }]);
  });
  it("edits design text and optionally replaces its image", async () => {
    vi.mocked(readArchive).mockResolvedValue([{ id: "existing-design", title: "Old" }]);
    const path = "artwork/12345678-1234-1234-1234-123456789012.png";
    expect((await POST(request({ action: "edit-design", id: "existing-design", title: "New title", description: "Updated", ticket: path }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("design-changes", [{ id: "existing-design", title: "New title", description: "Updated", imagePath: `/api/artwork?path=${encodeURIComponent(path)}` }]);
    expect((await POST(request({ action: "edit-design", id: "existing-design", title: "Text only" }))).status).toBe(200);
    expect(vi.mocked(saveBatch).mock.calls.at(-1)?.[1]).toEqual([{ id: "existing-design", title: "Text only", description: "" }]);
  });
  it("moves a pinned design to first place without duplicate positions and supports unpinning", async () => {
    vi.mocked(readArchive).mockResolvedValue([{ id: "one", pinned: true, pinOrder: 1 }, { id: "two", pinned: true, pinOrder: 2 }]);
    expect((await POST(request({ action: "pin-design", id: "two", pinned: true, pinOrder: 1 }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("design-changes", [{ id: "two", pinned: true, pinOrder: 1 }, { id: "one", pinned: true, pinOrder: 2 }]);
    expect((await POST(request({ action: "pin-design", id: "one", pinned: false }))).status).toBe(200);
    expect(vi.mocked(saveBatch).mock.calls.at(-1)?.[1]).toEqual([{ id: "two", pinned: true, pinOrder: 1 }, { id: "one", pinned: false, pinOrder: 0 }]);
  });
  it("deletes a known design and rejects stale or invalid edits", async () => {
    vi.mocked(readArchive).mockResolvedValue([{ id: "one" }]);
    expect((await POST(request({ action: "remove-design", id: "one" }))).status).toBe(200);
    expect(saveBatch).toHaveBeenCalledWith("design-changes", [{ id: "one", removed: true }]);
    vi.mocked(saveBatch).mockClear();
    expect((await POST(request({ action: "edit-design", id: "missing", title: "New" }))).status).toBe(404);
    expect((await POST(request({ action: "pin-design", id: "one", pinned: true, pinOrder: -1 }))).status).toBe(400);
    expect(saveBatch).not.toHaveBeenCalled();
  });
  it("rejects malformed pictures, missing titles and cross-origin writes", async () => {
    expect((await POST(request({ action: "image", image: "bad" }))).status).toBe(400);
    expect((await POST(request({ action: "designs", items: [{ ticket: "artwork/12345678-1234-1234-1234-123456789012.png", title: "", type: "Other" }] }))).status).toBe(400);
    expect((await POST(request({ action: "testimonial", name: "A", quote: "B" }, "https://other.example"))).status).toBe(403);
    expect(saveBatch).not.toHaveBeenCalled();
  });
});
