import { readArchive } from "../server/studio-storage.js";
import { vercelApi } from "../server/vercel-api.js";

export async function GET() {
  try {
    const [designs, testimonials] = await Promise.all([
      readArchive("designs"),
      readArchive("testimonials"),
    ]);
    return Response.json(
      { designs, testimonials },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Gallery temporarily unavailable" }, { status: 503 });
  }
}

export default vercelApi({ GET });
