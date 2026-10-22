import { get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import seedDesigns from "../client/public/designs.json";
import seedTestimonials from "../client/public/testimonials.json";

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
export async function saveBatch(collection: Collection, entries: unknown[]) {
  connected();
  // Each publication has its own immutable object: simultaneous batches never overwrite.
  await put(`studio/${collection}/${Date.now()}-${randomUUID()}.json`, JSON.stringify(entries), { access: "private", addRandomSuffix: false, contentType: "application/json" });
}
export async function readArchive(collection: Collection): Promise<any[]> {
  const seed = collection === "designs" ? seedDesigns : seedTestimonials;
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) return seed;
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `studio/${collection}/`, cursor });
    paths.push(...page.blobs.map(blob => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const batches = await Promise.all(paths.sort().reverse().map(async path => {
    const result = await get(path, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) throw new Error("ArchiveUnavailable");
    const data = await new Response(result.stream).json();
    if (!Array.isArray(data)) throw new Error("InvalidArchive");
    return data;
  }));
  return [...batches.flat(), ...seed];
}
