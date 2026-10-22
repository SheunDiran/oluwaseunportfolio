import { readArchive } from "../server/studio-storage";
export async function GET() {
  try {
    const [designs, testimonials] = await Promise.all([readArchive("designs"), readArchive("testimonials")]);
    return Response.json({ designs, testimonials }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Gallery temporarily unavailable" }, { status: 503 }); }
}
