import { FormEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Github, ImagePlus, LockKeyhole, Plus, Save, Upload, X } from "lucide-react";
import { Link } from "wouter";
import "./AdminUpload.css";
import { publishDesigns, type QueuedDesign } from "@/lib/publishDesigns";

const DEFAULT_CONFIG = { repo: "SheunDiran/oluwaseunportfolio", branch: "main", dataPath: "client/public/designs.json", testimonialsPath: "client/public/testimonials.json", token: "" };
type Config = typeof DEFAULT_CONFIG;
type DesignRecord = { title: string; description?: string; type: string; imagePath: string; tags?: string[] };
type Testimonial = { quote: string; name: string; organisation: string };
type Status = { kind: "idle" | "success" | "error"; text: string };
const IMAGE_LIMIT = 12 * 1024 * 1024;

function encodeText(value: string) { return btoa(unescape(encodeURIComponent(value))); }
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
  const [queue, setQueue] = useState<QueuedDesign[]>([]);
  const [quoteForm, setQuoteForm] = useState<Testimonial>({ quote: "", name: "", organisation: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
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

  function chooseFiles(files: File[]) {
    if (busy) return;
    const valid = files.filter(file => /^(image\/(png|jpeg|webp))$/.test(file.type) && file.size <= IMAGE_LIMIT);
    setQueue(current => [...current, ...valid.map(file => ({ id: crypto.randomUUID(), file, title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), description: "", type: "Flyers & Posters", tags: "" }))]);
    setStatus(valid.length === files.length ? { kind: "idle", text: "" } : { kind: "error", text: "Some files were skipped. Use PNG, JPG or WebP pictures up to 12 MB each." });
  }
  function updateQueued(id: string, patch: Partial<QueuedDesign>) {
    setQueue(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFiles(Array.from(event.dataTransfer.files));
  }
  function saveConfig() {
    if (!config.repo.trim() || !config.branch.trim() || !config.token.trim()) { setStatus({ kind: "error", text: "Add your repository, branch and GitHub token before saving." }); return; }
    localStorage.setItem("dhub-github-config", JSON.stringify(config));
    setStatus({ kind: "success", text: "GitHub connection saved on this browser only." });
  }

  async function addDesign(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!config.token || !queue.length || queue.some(item => !item.title.trim())) { setStatus({ kind: "error", text: "Connect GitHub, select pictures and give each one a title. Descriptions are optional." }); return; }
    setBusy(true);
    try {
      const next = await publishDesigns(config, queue, text => setStatus({ kind: "idle", text }));
      localStorage.setItem("dhub-github-config", JSON.stringify(config));
      setDesigns(next);
      const count = queue.length;
      setQueue([]);
      if (inputRef.current) inputRef.current.value = "";
      setStatus({ kind: "success", text: `${count} picture${count === 1 ? "" : "s"} saved to your portfolio. The gallery will update after Vercel finishes deploying.` });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Publishing failed. Your pictures are still selected; please retry." });
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

  const statusIcon = useMemo(() => status.kind === "success" ? <Check size={16} /> : status.kind === "error" ? <X size={16} /> : null, [status.kind]);
  if (!isUnlocked) return <div className="admin-shell"><div className="admin-card admin-login"><Link href="/designs" className="admin-back"><ArrowLeft size={15} /> Back to designs</Link><div className="admin-icon"><LockKeyhole size={23} /></div><span className="eyebrow">Private route / owner access</span><h1>{hasPassword ? "Welcome back." : "Set your owner key."}</h1><p>{hasPassword ? "Unlock this browser's private design workspace." : "Choose an owner key for this browser. This is a convenience gate; GitHub permissions control who can publish changes."}</p><form onSubmit={unlock}><label>{hasPassword ? "Browser-only owner key" : "Create browser-only owner key"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoFocus /></label><button className="admin-submit" type="submit">{hasPassword ? "Unlock workspace" : "Create owner key"} <LockKeyhole size={15} /></button></form>{status.kind === "error" && <p className="admin-status error">{status.text}</p>}</div></div>;

  return (
    <div className="admin-shell admin-design-studio">
      <div className="admin-topbar"><Link href="/designs" className="admin-back"><ArrowLeft size={15} /> Back to design portfolio</Link><button type="button" className="admin-secondary" disabled={busy} onClick={() => { sessionStorage.removeItem("dhub-admin-unlocked-until"); setIsUnlocked(false); }}>Lock workspace <LockKeyhole size={14} /></button></div>
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
              <fieldset disabled={busy} className="admin-upload-fields">
                <div className={`upload-box admin-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => { if (!busy) inputRef.current?.click(); }} role="button" tabIndex={busy ? -1 : 0} aria-label="Choose pictures to upload" onKeyDown={(event) => { if (!busy && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); inputRef.current?.click(); } }}>
                  <ImagePlus size={28} /><strong>Drop pictures here or browse</strong><span>Select several at once · PNG, JPG or WebP · up to 12 MB each</span>
                  <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="Select portfolio pictures" onClick={(event) => event.stopPropagation()} onChange={(event) => { chooseFiles(Array.from(event.target.files || [])); event.target.value = ""; }} />
                </div>
                {queue.length > 0 && <p className="admin-help">{queue.length} picture{queue.length === 1 ? "" : "s"} selected. Check each title below. Descriptions and tags are optional.</p>}
                <div className="admin-upload-queue">{queue.map(item => <UploadItem key={item.id} item={item} onChange={patch => updateQueued(item.id, patch)} onRemove={() => setQueue(current => current.filter(entry => entry.id !== item.id))} />)}</div>
                <button className="admin-submit" type="submit" disabled={busy || !queue.length}>{busy ? "Publishing pictures…" : <><Upload size={16} /> Publish {queue.length || ""} picture{queue.length === 1 ? "" : "s"}</>}</button>
              </fieldset>
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
        {status.text && <p role="status" aria-live="polite" className={`admin-status admin-global-status ${status.kind}`}>{statusIcon}{status.text}</p>}
        <p className="admin-deploy-note">After an upload, GitHub saves the image and archive data on <code>main</code>. Vercel then rebuilds the live website automatically; it can take a short moment to appear.</p>
      </main>
    </div>
  );
}

function UploadItem({ item, onChange, onRemove }: { item: QueuedDesign; onChange: (patch: Partial<QueuedDesign>) => void; onRemove: () => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => { const url = URL.createObjectURL(item.file); setPreview(url); return () => URL.revokeObjectURL(url); }, [item.file]);
  return <article className="admin-queued-picture">
    <div className="admin-queue-heading"><img src={preview} alt={`Preview of ${item.title || item.file.name}`} /><button type="button" onClick={onRemove} aria-label={`Remove ${item.title || item.file.name}`}><X size={18} /></button></div>
    <label>Title <input required value={item.title} maxLength={90} onChange={event => onChange({ title: event.target.value })} /></label>
    <label>Description <span className="admin-optional">(optional)</span><textarea value={item.description} maxLength={420} rows={2} onChange={event => onChange({ description: event.target.value })} /></label>
    <label>Category <select value={item.type} onChange={event => onChange({ type: event.target.value })}><option>Flyers &amp; Posters</option><option>Social Media</option><option>Branding</option><option>Other</option></select></label>
    <label>Tags <span className="admin-optional">(optional)</span><input value={item.tags} placeholder="event, campaign, community" onChange={event => onChange({ tags: event.target.value })} /></label>
  </article>;
}
