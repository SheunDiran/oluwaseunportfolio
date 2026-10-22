import { get } from "@vercel/blob";
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") || "";
  if (!/^artwork\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(path)) return new Response("Not found", { status: 404 });
  try {
    const result = await get(path, { access: "private" });
    if (!result || result.statusCode !== 200) return new Response("Not found", { status: 404 });
    const extension = path.split(".").pop();
    return new Response(result.stream, { headers: { "Content-Type": extension === "jpg" ? "image/jpeg" : `image/${extension}`, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Image temporarily unavailable", { status: 503 }); }
}
