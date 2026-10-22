import { readArchive, saveBatch, saveImage } from "../server/studio-storage";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE = "__Host-sheun-studio";
const LIFE = 8 * 60 * 60;
class StudioError extends Error { constructor(message: string, public status = 400) { super(message); } }
const reply = (data: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
function settings() {
  const password = process.env.STUDIO_PASSWORD || "";
  if (password.length < 12) throw new StudioError("Set your private STUDIO_PASSWORD in Vercel to enable owner login.", 503);
  return { password };
}
function sign(payload: string, password: string) { return createHmac("sha256", password).update(`sheun-studio-v1:${payload}`).digest("base64url"); }
function seal(data: unknown, password: string) { const value = Buffer.from(JSON.stringify(data)).toString("base64url"); return `${value}.${sign(value, password)}`; }
function unseal(value: string, password: string): any {
  const [data, signature] = value.split(".");
  const expected = sign(data || "", password);
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const result = JSON.parse(Buffer.from(data, "base64url").toString()); return result.exp > Date.now() ? result : null; } catch { return null; }
}
function session(request: Request, password: string) {
  const cookie = (request.headers.get("cookie") || "").split(";").map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return cookie ? unseal(cookie, password)?.kind === "session" : false;
}
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
    const config = settings();
    if (!session(request, config.password)) return reply({ ready: true, authenticated: false });
    if (new URL(request.url).searchParams.get("action") === "data") {
      const [designs, testimonials] = await Promise.all([readArchive("designs"), readArchive("testimonials")]);
      return reply({ authenticated: true, designs, testimonials });
    }
    return reply({ ready: true, authenticated: true });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const config = settings();
    if (Number(request.headers.get("content-length") || 0) > 3_900_000) throw new StudioError("This picture is too large. Please export a smaller version.", 413);
    const raw = await request.text();
    if (raw.length > 3_900_000) throw new StudioError("This picture is too large. Please export a smaller version.", 413);
    let body: any; try { body = JSON.parse(raw); } catch { throw new StudioError("The upload could not be read. Please try again."); }
    if (body.action === "login") {
      const supplied = createHash("sha256").update(typeof body.password === "string" ? body.password : "").digest();
      const expected = createHash("sha256").update(config.password).digest();
      if (!timingSafeEqual(supplied, expected)) return reply({ error: "That password is incorrect." }, 401);
      const cookie = seal({ kind: "session", exp: Date.now() + LIFE * 1000, nonce: randomUUID() }, config.password);
      return reply({ authenticated: true }, 200, { "Set-Cookie": `${COOKIE}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${LIFE}` });
    }
    if (!session(request, config.password)) throw new StudioError("Please log in to publish your work.", 401);
    if (body.action === "logout") return reply({ authenticated: false }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    if (body.action === "image") {
      if (typeof body.image !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(body.image)) throw new StudioError("Please choose a valid image.");
      const bytes = Buffer.from(body.image, "base64");
      if (bytes.length > 2_800_000) throw new StudioError("Please choose an image under 2.8 MB after optimisation.", 413);
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
      if (!png && !jpeg && !webp) throw new StudioError("Use a PNG, JPG or WebP image.");
      const path = await saveImage(bytes, png ? "png" : jpeg ? "jpg" : "webp");
      return reply({ ticket: seal({ kind: "image", path, exp: Date.now() + LIFE * 1000 }, config.password) });
    }
    if (body.action !== "designs" && body.action !== "testimonial") throw new StudioError("Unknown studio action.");
    let additions: any[];
    const collection = body.action === "designs" ? "designs" : "testimonials";
    if (body.action === "designs") {
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw new StudioError("Choose between 1 and 50 designs per batch.");
      additions = body.items.map((item: any) => {
        const upload = typeof item.ticket === "string" && unseal(item.ticket, config.password);
        if (!upload || upload.kind !== "image") throw new StudioError("An upload expired. Please select the picture again.");
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
