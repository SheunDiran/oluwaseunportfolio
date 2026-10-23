import { get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import seedDesigns from "../client/public/designs.json" with { type: "json" };
import seedTestimonials from "../client/public/testimonials.json" with { type: "json" };

type Collection = "designs" | "testimonials";
function connected() {
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("StorageNotConnected");
}
export async function saveImage(bytes: Buffer, extension: string) {
  connected();
  const path = `artwork/${randomUUID()}.${extension}`;
  await put(path, bytes, { access: "private", addRandomSuffix: false, contentType: extension === "jpg" ? "image/jpeg" : `image/${extension}` });
  return path;
}
export async function saveBatch(collection: Collection | "testimonial-changes", entries: unknown[]) {
  connected();
  // Each publication has its own immutable object: simultaneous batches never overwrite.
  await put(`studio/${collection}/${Date.now()}-${randomUUID()}.json`, JSON.stringify(entries), { access: "private", addRandomSuffix: false, contentType: "application/json" });
}
async function storedRecords(collection: string): Promise<any[]> {
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `studio/${collection}/`, cursor });
    paths.push(...page.blobs.map(blob => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const batches = await Promise.all(paths.sort().map(async path => {
    const result = await get(path, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) throw new Error("ArchiveUnavailable");
    const data = await new Response(result.stream).json();
    if (!Array.isArray(data)) throw new Error("InvalidArchive");
    return data.map((item, index) => ({ ...item, id: item.id || `${path}:${index}` }));
  }));
  return batches.flat();
}
export async function readArchive(collection: Collection): Promise<any[]> {
  const seed = (collection === "designs" ? seedDesigns : seedTestimonials).map((item, index) => ({ ...item, id: `seed:${collection}:${index}` }));
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) return seed;
  const records = [...(await storedRecords(collection)).reverse(), ...seed];
  if (collection !== "testimonials") return records;
  const changes = await storedRecords("testimonial-changes");
  const latest = new Map(changes.map(change => [change.id, change]));
  return records.filter(item => !latest.get(item.id)?.removed).map(item => ({ ...item, ...latest.get(item.id) }));
}
