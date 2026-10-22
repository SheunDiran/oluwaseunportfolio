export type DesignDraft = { id: string; file: File | null; title: string; description: string; type: string; tags: string };
export async function studioRequest(body?: unknown, action = "") {
  const response = await fetch(`/api/studio${action ? `?action=${action}` : ""}`, { credentials: "same-origin", cache: "no-store", ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error("Your studio is not available on this deployment yet.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export async function imageForUpload(file: File): Promise<string> {
  if (!/^(image\/(png|jpeg|webp))$/.test(file.type) || file.size > 12 * 1024 * 1024) throw new Error("Choose PNG, JPG or WebP pictures under 12 MB.");
  let blob: Blob = file;
  if (file.size > 2_500_000) {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2800 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare this image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Could not prepare this image.")), "image/webp", .88));
    } finally { bitmap.close(); }
  }
  if (blob.size > 2_800_000) throw new Error("This picture is still too large. Export a smaller JPG or WebP.");
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read this picture.")); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(blob); });
}
