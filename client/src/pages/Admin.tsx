import { FormEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Github, ImagePlus, LockKeyhole, Plus, Save, Upload, X } from "lucide-react";
import { Link } from "wouter";
import "./AdminUpload.css";

const DEFAULT_CONFIG = { repo: "SheunDiran/oluwaseunportfolio", branch: "main", dataPath: "client/public/designs.json", testimonialsPath: "client/public/testimonials.json", token: "" };
type Config = typeof DEFAULT_CONFIG;
type DesignRecord = { title: string; description: string; type: string; imagePath: string; tags?: string[] };
type Testimonial = { quote: string; name: string; organisation: string };
type Status = { kind: "idle" | "success" | "error"; text: string };
const IMAGE_LIMIT = 12 * 1024 * 1024;

function encodeText(value: string) { return btoa(unescape(encodeURIComponent(value))); }
async function encodeFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const end = Math.min(bytes.length, offset + chunkSize);
    for (let index = offset; index < end; index += 1) binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}
async function getFileSha(repo: string, path: string, branch: string, token: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error("Could not read the existing GitHub file. Check the repository, branch and token permissions.");
  const data = await response.json();
  return data.sha as string | undefined;
}
async function commitFile(config: Config, path: string, content: string, message: string, isBase64 = false) {
  const sha = await getFileSha(config.repo, path, config.branch, config.token);
  const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${config.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: isBase64 ? content : encodeText(content), branch: config.branch, ...(sha ? { sha } : {}) }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "GitHub did not accept the commit.");
  }
}
function readJson<T>(path: string, fallback: T): Promise<T> {
  return fetch(path).then((response) => response.ok ? response.json() as Promise<T> : fallback).catch(() => fallback);
}

export default function Admin() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [designs, setDesigns] = useState<DesignRecord[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [form, setForm] = useState({ title: "", description: "", type: "Flyers & Posters", tags: "", file: null as File | null });
  const [quoteForm, setQuoteForm] = useState<Testimonial>({ quote: "", name: "", organisation: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasPassword(Boolean(localStorage.getItem("dhub-admin-password")));
    try {
      const savedConfig = localStorage.getItem("dhub-github-config");
      if (savedConfig) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
    } catch { localStorage.removeItem("dhub-github-config"); }
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    setIsUnlocked(unlockedUntil > Date.now());
    void readJson<DesignRecord[]>("/designs.json", []).then((data) => setDesigns(Array.isArray(data) ? data : []));
    void readJson<Testimonial[]>("/testimonials.json", []).then((data) => setTestimonials(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!form.file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(form.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  function unlock(event: FormEvent) {
    event.preventDefault();
    const saved = localStorage.getItem("dhub-admin-password");
    if (!saved) {
      if (password.length < 8) { setStatus({ kind: "error", text: "Choose at least 8 characters for your browser-only owner key." }); return; }
      localStorage.setItem("dhub-admin-password", password);
      setHasPassword(true);
      setIsUnlocked(true);
      sessionStorage.setItem("dhub-admin-unlocked-until", String(Date.now() + 1000 * 60 * 60 * 8));
      setPassword("");
      return;
    }
    if (password !== saved) { setStatus({ kind: "error", text: "That password does not match this browser's local owner key." }); return; }
    setIsUnlocked(true);
    sessionStorage.setItem("dhub-admin-unlocked-until", String(Date.now() + 1000 * 60 * 60 * 8));
    setPassword("");
  }

  function chooseFile(file?: File) {
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type)) { setStatus({ kind: "error", text: "Please choose a PNG, JPG or WebP image." }); return; }
    if (file.size > IMAGE_LIMIT) { setStatus({ kind: "error", text: "That image is over 12 MB. Export a smaller JPG or WebP and try again." }); return; }
    setForm((current) => ({ ...current, file }));
    setStatus({ kind: "idle", text: "" });
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }
  function saveConfig() {
    if (!config.repo.trim() || !config.branch.trim() || !config.token.trim()) { setStatus({ kind: "error", text: "Add your repository, branch and GitHub token before saving." }); return; }
    localStorage.setItem("dhub-github-config", JSON.stringify(config));
    setStatus({ kind: "success", text: "GitHub connection saved on this browser only." });
  }

  async function addDesign(event: FormEvent) {
    event.preventDefault();
    if (!config.repo || !config.token || !form.file || !form.title.trim() || !form.description.trim()) { setStatus({ kind: "error", text: "Add a GitHub connection, image, project title and short description first." }); return; }
    setBusy(true);
    setStatus({ kind: "idle", text: "Uploading your artwork and updating the archive…" });
    let imageUploaded = false;
    let imagePath = "";
    try {
      const extension = form.file.name.split(".").pop()?.toLowerCase() || "webp";
      const slug = form.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64) || "design";
      imagePath = `client/public/designs/${slug}-${Date.now()}.${extension}`;
      await commitFile(config, imagePath, await encodeFile(form.file), `Add design: ${form.title.trim()}`, true);
      imageUploaded = true;
      const nextDesign: DesignRecord = {
        title: form.title.trim(), description: form.description.trim(), type: form.type, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        imagePath: `/${imagePath.replace("client/public/", "")}`,
      };
      const nextDesigns = [nextDesign, ...designs];
      await commitFile(config, config.dataPath, JSON.stringify(nextDesigns, null, 2), `Add ${form.title.trim()} to the design archive`);
      localStorage.setItem("dhub-github-config", JSON.stringify(config));
      setDesigns(nextDesigns);
      setForm({ title: "", description: "", type: "Flyers & Posters", tags: "", file: null });
      setStatus({ kind: "success", text: "Artwork added. Vercel will rebuild the live portfolio from the new GitHub commit." });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Something went wrong while committing.";
      setStatus({ kind: "error", text: imageUploaded ? `The image uploaded, but the archive list did not update. Keep this path for recovery: ${imagePath}. ${detail}` : detail });
    } finally { setBusy(false); }
  }

  async function addTestimonial(event: FormEvent) {
    event.preventDefault();
    if (!config.repo || !config.token || !quoteForm.quote.trim() || !quoteForm.name.trim()) { setStatus({ kind: "error", text: "Add your GitHub connection, approved quote and client name first." }); return; }
    setBusy(true);
    setStatus({ kind: "idle", text: "Adding the approved client feedback…" });
    try {
      const next = [{ quote: quoteForm.quote.trim(), name: quoteForm.name.trim(), organisation: quoteForm.organisation.trim() }, ...testimonials];
      await commitFile(config, config.testimonialsPath, JSON.stringify(next, null, 2), `Add testimonial from ${quoteForm.name.trim()}`);
      localStorage.setItem("dhub-github-config", JSON.stringify(config));
      setTestimonials(next);
      setQuoteForm({ quote: "", name: "", organisation: "" });
      setStatus({ kind: "success", text: "Testimonial added. Only publish feedback you have permission to share." });
    } catch (error) { setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not save the testimonial." }); }
    finally { setBusy(false); }
  }

  const statusIcon = useMemo(() => status.kind === "success" ? <Check size={16} /> : <X size={16} />, [status.kind]);
  if (!isUnlocked) return <div className="admin-shell"><div className="admin-card admin-login"><Link href="/designs" className="admin-back"><ArrowLeft size={15} /> Back to designs</Link><div className="admin-icon"><LockKeyhole size={23} /></div><span className="eyebrow">Private route / owner access</span><h1>{hasPassword ? "Welcome back." : "Set your owner key."}</h1><p>{hasPassword ? "Unlock this browser's private design workspace." : "Choose an owner key for this browser. This is a convenience gate; GitHub permissions control who can publish changes."}</p><form onSubmit={unlock}><label>{hasPassword ? "Browser-only owner key" : "Create browser-only owner key"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoFocus /></label><button className="admin-submit" type="submit">{hasPassword ? "Unlock workspace" : "Create owner key"} <LockKeyhole size={15} /></button></form>{status.kind === "error" && <p className="admin-status error">{status.text}</p>}</div></div>;

  return (
    <div className="admin-shell admin-design-studio">
      <div className="admin-topbar"><Link href="/designs" className="admin-back"><ArrowLeft size={15} /> Back to design portfolio</Link><span className="admin-secure"><span /> Owner workspace active</span></div>
      <main className="admin-main">
        <div className="admin-heading"><div><span className="eyebrow">SHEUN / DESIGN STUDIO</span><h1>Add to the archive.</h1><p>Upload a flyer, add its title and tags, then let Vercel publish your update.</p></div><Github size={40} strokeWidth={1.2} /></div>
        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-title"><span>01</span><h2>Connect GitHub once</h2></div>
            <p className="admin-help">A fine-grained token needs <strong>Contents: Read and write</strong> access to <code>SheunDiran/oluwaseunportfolio</code>. It is stored only in this browser and is never included in the public page. Never paste it into chat or commit it.</p>
            <label>Repository <input placeholder="owner/repository" value={config.repo} onChange={(event) => setConfig({ ...config, repo: event.target.value })} /></label>
            <div className="admin-fields"><label>Branch <input value={config.branch} onChange={(event) => setConfig({ ...config, branch: event.target.value })} /></label><label>Design archive path <input value={config.dataPath} onChange={(event) => setConfig({ ...config, dataPath: event.target.value })} /></label></div>
            <label>Testimonials file <input value={config.testimonialsPath} onChange={(event) => setConfig({ ...config, testimonialsPath: event.target.value })} /></label>
            <label>Fine-grained GitHub token <input type="password" autoComplete="off" placeholder="github_pat_…" value={config.token} onChange={(event) => setConfig({ ...config, token: event.target.value })} /></label>
            <button className="admin-secondary admin-save-connection" type="button" onClick={saveConfig}><Save size={15} /> Save connection on this browser</button>
            <a className="admin-token-help" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">Create a fine-grained token <ArrowLeft size={13} /></a>
          </section>

          <section className="admin-card">
            <div className="admin-card-title"><span>02</span><h2>Upload a new design</h2></div>
            <p className="admin-help">Choose a strong image, add its display details and category. New work appears first in the gallery.</p>
            <form onSubmit={addDesign}>
              <label>Artwork image <div className={`upload-box admin-dropzone ${dragging ? "is-dragging" : ""} ${previewUrl ? "has-preview" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}>
                {previewUrl ? <img className="admin-image-preview" src={previewUrl} alt="Preview of selected artwork" /> : <><ImagePlus size={28} /><strong>Drop artwork here or browse</strong><span>PNG, JPG or WebP · up to 12 MB</span></>}
                {previewUrl && <span className="admin-file-name">{form.file?.name} · Choose a different image</span>}
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onClick={(event) => event.stopPropagation()} onChange={(event) => chooseFile(event.target.files?.[0])} />
              </div></label>
              <label>Project title <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Community day flyer" maxLength={90} /></label>
              <label>Short project note <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What was the design for? Keep it clear and concise." rows={3} maxLength={420} /></label>
              <label>Category <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Flyers &amp; Posters</option><option>Social Media</option><option>Branding</option><option>Other</option></select></label>
              <label>Tags <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="event, campaign, community (comma-separated)" /></label>
              <button className="admin-submit" type="submit" disabled={busy}>{busy ? "Publishing…" : <><Upload size={16} /> Add design to portfolio</>}</button>
            </form>
          </section>
        </div>

        <div className="admin-grid admin-secondary-grid">
          <section className="admin-card">
            <div className="admin-card-title"><span>03</span><h2>Add a client testimonial</h2></div>
            <p className="admin-help">Use the client&apos;s approved words and confirm they have permission to be featured publicly.</p>
            <form onSubmit={addTestimonial}>
              <label>Client&apos;s words <textarea value={quoteForm.quote} onChange={(event) => setQuoteForm({ ...quoteForm, quote: event.target.value })} placeholder="Paste an approved quote…" rows={4} maxLength={700} /></label>
              <div className="admin-fields"><label>Name <input value={quoteForm.name} onChange={(event) => setQuoteForm({ ...quoteForm, name: event.target.value })} placeholder="Client name" maxLength={80} /></label><label>Organisation <input value={quoteForm.organisation} onChange={(event) => setQuoteForm({ ...quoteForm, organisation: event.target.value })} placeholder="Optional" maxLength={100} /></label></div>
              <button className="admin-submit" type="submit" disabled={busy}>{busy ? "Publishing…" : <><Plus size={16} /> Add approved testimonial</>}</button>
            </form>
          </section>
          <section className="admin-card">
            <div className="admin-card-title"><span>04</span><h2>Published feedback</h2></div>
            {testimonials.length ? <div className="admin-quote-list">{testimonials.map((item, index) => <article key={`${item.name}-${index}`}><blockquote>“{item.quote}”</blockquote><strong>{item.name}</strong><small>{item.organisation}</small></article>)}</div> : <p className="admin-help">No testimonials published yet. Add real client feedback here when you have approval to share it.</p>}
          </section>
        </div>

        <section className="admin-card admin-archive"><div className="admin-card-title"><span>05</span><h2>Current portfolio pieces</h2></div><div className="archive-list">{designs.length === 0 ? <p className="admin-help">No remote entries loaded yet.</p> : designs.map((design, index) => <div className="archive-row" key={`${design.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{design.title}</strong><small>{design.type}</small></div>)}</div></section>
        {status.text && <p className={`admin-status admin-global-status ${status.kind}`}>{statusIcon}{status.text}</p>}
        <p className="admin-deploy-note">After an upload, GitHub saves the image and archive data on <code>main</code>. Vercel then rebuilds the live website automatically; it can take a short moment to appear.</p>
      </main>
    </div>
  );
}
