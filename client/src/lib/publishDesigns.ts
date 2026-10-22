export type PublishConfig = { repo: string; branch: string; dataPath: string; token: string };
export type QueuedDesign = { id: string; file: File; title: string; description: string; type: string; tags: string };
export type DesignRecord = { title: string; description?: string; type: string; imagePath: string; tags?: string[] };

export async function publishDesigns(config: PublishConfig, queue: QueuedDesign[], progress: (message: string) => void): Promise<DesignRecord[]> {
  if (!queue.length || queue.some(item => !item.title.trim())) throw new Error("Give every picture a title before publishing.");
  const base = `https://api.github.com/repos/${config.repo}`;
  async function api(path: string, body?: unknown, method = "POST") {
    const response = await fetch(`${base}/${path}`, {
      method: body === undefined ? "GET" : method,
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(response.status === 409 || response.status === 422 ? "The portfolio changed while you were publishing. Your pictures are still selected. Try publishing again to keep the latest work." : data.message || "GitHub could not save these pictures. Check your connection and token permissions.");
    return data;
  }
  const additions: DesignRecord[] = [];
  const entries: { path: string; mode: string; type: string; sha?: string; content?: string }[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    progress(`Uploading picture ${index + 1} of ${queue.length}…`);
    const bytes = new Uint8Array(await item.file.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    const blob = await api("git/blobs", { content: btoa(binary), encoding: "base64" });
    const extension = item.file.type === "image/png" ? "png" : item.file.type === "image/jpeg" ? "jpg" : "webp";
    const slug = item.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "design";
    const path = `client/public/designs/${slug}-${item.id}.${extension}`;
    entries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    additions.push({ title: item.title.trim(), description: item.description.trim(), type: item.type, tags: item.tags.split(",").map(tag => tag.trim()).filter(Boolean), imagePath: `/${path.replace("client/public/", "")}` });
  }
  progress("Saving your gallery…");
  const branch = config.branch.split("/").map(encodeURIComponent).join("/");
  const head = await api(`git/ref/heads/${branch}`);
  const commit = await api(`git/commits/${head.object.sha}`);
  // Read the archive at the same head used as the parent, so stale pages cannot erase new work.
  const archive = await api(`contents/${config.dataPath.split("/").map(encodeURIComponent).join("/")}?ref=${head.object.sha}`);
  const bytes = Uint8Array.from(atob(archive.content.replace(/\s/g, "")), char => char.charCodeAt(0));
  const previous: DesignRecord[] = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(previous)) throw new Error("The gallery list is invalid. Your selected pictures have been kept.");
  const next = [...additions, ...previous];
  entries.push({ path: config.dataPath, mode: "100644", type: "blob", content: JSON.stringify(next, null, 2) + "\n" });
  const tree = await api("git/trees", { base_tree: commit.tree.sha, tree: entries });
  const saved = await api("git/commits", { message: `Add ${queue.length} design${queue.length === 1 ? "" : "s"} to the portfolio`, tree: tree.sha, parents: [head.object.sha] });
  await api(`git/refs/heads/${branch}`, { sha: saved.sha, force: false }, "PATCH");
  return next;
}
