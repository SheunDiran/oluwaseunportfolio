import { readArchive, saveBatch, saveImage } from "../server/studio-storage.js";
import { vercelApi } from "../server/vercel-api.js";

class StudioError extends Error { constructor(message: string, public status = 400) { super(message); } }
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new StudioError("Please open your studio on this website and try again.", 403);
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new StudioError("Please check your titles and text, then try again.");
  return value.trim();
}
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get("action") === "data") {
      const [designs, testimonials] = await Promise.all([readArchive("designs"), readArchive("testimonials")]);
      return reply({ designs, testimonials });
    }
    return reply({ ready: true });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 3_900_000) throw new StudioError("This picture is too large. Please export a smaller version.", 413);
    const raw = await request.text();
    if (raw.length > 3_900_000) throw new StudioError("This picture is too large. Please export a smaller version.", 413);
    let body: any; try { body = JSON.parse(raw); } catch { throw new StudioError("The upload could not be read. Please try again."); }
    if (body.action === "image") {
      if (typeof body.image !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(body.image)) throw new StudioError("Please choose a valid image.");
      const bytes = Buffer.from(body.image, "base64");
      if (bytes.length > 2_800_000) throw new StudioError("Please choose an image under 2.8 MB after optimisation.", 413);
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
      if (!png && !jpeg && !webp) throw new StudioError("Use a PNG, JPG or WebP image.");
      const path = await saveImage(bytes, png ? "png" : jpeg ? "jpg" : "webp");
      return reply({ ticket: path });
    }
    if (["edit-design", "remove-design", "pin-design"].includes(body.action)) {
      const id = text(body.id, 300, true);
      const current = await readArchive("designs");
      if (!current.some(item => item.id === id)) throw new StudioError("This design no longer exists. Refresh the page.", 404);
      let change: Record<string, unknown> = { id };
      let pinChanges: Record<string, unknown>[] | undefined;
      if (body.action === "remove-design") change.removed = true;
      else if (body.action === "pin-design") {
        if (typeof body.pinned !== "boolean") throw new StudioError("Choose whether to pin this design.");
        const order = body.pinOrder ?? Math.min(10000, Math.max(0, ...current.filter(item => item.pinned).map(item => item.pinOrder || 1)) + 1);
        if (!Number.isInteger(order) || order < 1 || order > 10000) throw new StudioError("Pin position must be a whole number from 1 to 10000.");
        const pinned = current.filter(item => item.pinned && item.id !== id);
        if (body.pinned) pinned.splice(Math.min(order - 1, pinned.length), 0, { id });
        pinChanges = pinned.map((item, index) => ({ id: item.id, pinned: true, pinOrder: index + 1 }));
        if (!body.pinned) pinChanges.push({ id, pinned: false, pinOrder: 0 });
      } else {
        change.title = text(body.title, 90, true);
        change.description = text(body.description ?? "", 420);
        if (body.ticket !== undefined) {
          if (typeof body.ticket !== "string" || !/^artwork\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(body.ticket)) throw new StudioError("Please select a valid uploaded picture.");
          change.imagePath = `/api/artwork?path=${encodeURIComponent(body.ticket)}`;
        }
      }
      await saveBatch("design-changes", pinChanges || [change]);
      return reply({ saved: true, items: await readArchive("designs") });
    }
    if (body.action === "edit-testimonial" || body.action === "remove-testimonial") {
      const id = text(body.id, 300, true);
      const current = await readArchive("testimonials");
      if (!current.some(item => item.id === id)) throw new StudioError("This testimonial no longer exists. Refresh the page.", 404);
      const change = body.action === "remove-testimonial" ? { id, removed: true } : { id, quote: text(body.quote, 700, true), name: text(body.name, 80, true), organisation: text(body.organisation ?? "", 100) };
      await saveBatch("testimonial-changes", [change]);
      return reply({ saved: true, items: await readArchive("testimonials") });
    }
    if (body.action !== "designs" && body.action !== "testimonial") throw new StudioError("Unknown studio action.");
    let additions: any[];
    const collection = body.action === "designs" ? "designs" : "testimonials";
    if (body.action === "designs") {
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw new StudioError("Choose between 1 and 50 designs per batch.");
      additions = body.items.map((item: any) => {
        const upload = typeof item.ticket === "string" && /^artwork\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(item.ticket) ? { path: item.ticket } : null;
        if (!upload) throw new StudioError("Please select a valid uploaded picture.");
        const type = text(item.type, 40, true);
        if (!["Flyers & Posters", "Social Media", "Branding", "Other"].includes(type)) throw new StudioError("Please choose a category.");
        return { title: text(item.title, 90, true), description: text(item.description ?? "", 420), type, tags: text(item.tags ?? "", 300).split(",").map(tag => tag.trim()).filter(Boolean), imagePath: `/api/artwork?path=${encodeURIComponent(upload.path)}` };
      });
    } else {
      additions = [{ quote: text(body.quote, 700, true), name: text(body.name, 80, true), organisation: text(body.organisation ?? "", 100) }];
    }
    await saveBatch(collection, additions);
    const next = await readArchive(collection);
    return reply({ saved: true, items: next });
  } catch (error) { return failure(error); }
}
function failure(error: unknown) {
  if (error instanceof StudioError) return reply({ error: error.message, ready: error.status !== 503, authenticated: false }, error.status);
  if (error instanceof Error && error.message === "StorageNotConnected") return reply({ error: "Connect a private Blob store in your Vercel project’s Storage tab, then redeploy once to enable uploads." }, 503);
  console.error("Studio request failed", error instanceof Error ? error.name : "UnknownError");
  return reply({ error: "Your changes could not be saved. Please try again." }, 500);
}

export default vercelApi({ GET, POST });
