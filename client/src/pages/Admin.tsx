import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, Github, LockKeyhole, Plus, Upload, X } from "lucide-react";
import { Link } from "wouter";

const DEFAULT_CONFIG = { repo: "SheunDiran/oluwaseunportfolio", branch: "main", dataPath: "client/public/designs.json", token: "" };

type Config = typeof DEFAULT_CONFIG;

type DesignRecord = { title: string; description: string; type: string; imagePath: string };

function encodeText(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

async function getFileSha(repo: string, path: string, branch: string, token: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error("Could not read the existing GitHub file. Check the repository, branch and token.");
  const data = await response.json();
  return data.sha as string | undefined;
}

async function commitFile(config: Config, path: string, content: string, message: string, isBase64 = false) {
  const sha = await getFileSha(config.repo, path, config.branch, config.token);
  const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, { method: "PUT", headers: { Authorization: `Bearer ${config.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify({ message, content: isBase64 ? content : encodeText(content), branch: config.branch, ...(sha ? { sha } : {}) }) });
  if (!response.ok) throw new Error((await response.json()).message || "GitHub did not accept the commit.");
}

export default function Admin() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [designs, setDesigns] = useState<DesignRecord[]>([]);
  const [form, setForm] = useState({ title: "", description: "", type: "Visual study", file: null as File | null });
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; text: string }>({ kind: "idle", text: "" });

  useEffect(() => {
    setHasPassword(Boolean(localStorage.getItem("dhub-admin-password")));
    const savedConfig = localStorage.getItem("dhub-github-config");
    if (savedConfig) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    setIsUnlocked(unlockedUntil > Date.now());
    fetch("/designs.json").then((response) => (response.ok ? response.json() : [])).then((data) => { if (Array.isArray(data)) setDesigns(data); }).catch(() => undefined);
  }, []);

  function unlock(event: FormEvent) {
    event.preventDefault();
    const saved = localStorage.getItem("dhub-admin-password");
    if (!saved) {
      if (password.length < 8) { setStatus({ kind: "error", text: "Choose at least 8 characters for your browser-only password." }); return; }
      localStorage.setItem("dhub-admin-password", password);
      setHasPassword(true);
      setIsUnlocked(true);
      sessionStorage.setItem("dhub-admin-unlocked-until", String(Date.now() + 1000 * 60 * 60 * 8));
      setPassword("");
      return;
    }
    if (password !== saved) { setStatus({ kind: "error", text: "That password does not match this browser's local admin key." }); return; }
    setIsUnlocked(true);
    sessionStorage.setItem("dhub-admin-unlocked-until", String(Date.now() + 1000 * 60 * 60 * 8));
    setPassword("");
  }

  async function addDesign(event: FormEvent) {
    event.preventDefault();
    if (!config.repo || !config.token || !form.file || !form.title || !form.description) { setStatus({ kind: "error", text: "Add your repository, token, image, title and description first." }); return; }
    setStatus({ kind: "idle", text: "Committing design to GitHub…" });
    try {
      const fileData = await form.file.arrayBuffer();
      const bytes = new Uint8Array(fileData);
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const imagePath = `client/public/designs/${slug}-${Date.now()}.${form.file.name.split(".").pop() || "png"}`;
      await commitFile(config, imagePath, btoa(binary), `Add design: ${form.title}`, true);
      const nextDesign = { title: form.title, description: form.description, type: form.type, imagePath: `/${imagePath.replace("client/public/", "")}` };
      const nextDesigns = [nextDesign, ...designs];
      await commitFile(config, config.dataPath, JSON.stringify(nextDesigns, null, 2), `Update D-HUB design archive`);
      localStorage.setItem("dhub-github-config", JSON.stringify({ ...config, token: config.token }));
      setDesigns(nextDesigns);
      setForm({ title: "", description: "", type: "Visual study", file: null });
      setStatus({ kind: "success", text: "Design committed. The connected site will rebuild from the new commit." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Something went wrong while committing." });
    }
  }

  if (!isUnlocked) return <div className="admin-shell"><div className="admin-card admin-login"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Back to portfolio</Link><div className="admin-icon"><LockKeyhole size={23} /></div><span className="eyebrow">Private route / owner access</span><h1>{hasPassword ? "Welcome back." : "Set your owner key."}</h1><p>{hasPassword ? "This admin route is intentionally unlinked from the public portfolio." : "Your first password is stored only in this browser. It is a convenience gate, not a substitute for GitHub token security."}</p><form onSubmit={unlock}><label>{hasPassword ? "Browser-only password" : "Create browser-only password"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoFocus /></label><button className="admin-submit" type="submit">{hasPassword ? "Unlock workspace" : "Create owner key"} <LockKeyhole size={15} /></button></form>{status.kind === "error" && <p className="admin-status error">{status.text}</p>}</div></div>;

  return <div className="admin-shell"><div className="admin-topbar"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Back to portfolio</Link><span className="admin-secure"><span /> Local session active</span></div><main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">D-HUB / Owner studio</span><h1>Add a design.</h1><p>Commit a new piece to the archive without touching the rest of the site.</p></div><Github size={40} strokeWidth={1.2} /></div><div className="admin-grid"><section className="admin-card"><div className="admin-card-title"><span>01</span><h2>GitHub connection</h2></div><p className="admin-help">Use a fine-grained token with repository Contents read/write access. It stays in this browser&apos;s local storage and is never included in the public bundle.</p><label>Repository <input placeholder="owner/repository" value={config.repo} onChange={(event) => setConfig({ ...config, repo: event.target.value })} /></label><div className="admin-fields"><label>Branch <input value={config.branch} onChange={(event) => setConfig({ ...config, branch: event.target.value })} /></label><label>Data file path <input value={config.dataPath} onChange={(event) => setConfig({ ...config, dataPath: event.target.value })} /></label></div><label>Fine-grained GitHub token <input type="password" placeholder="github_pat_…" value={config.token} onChange={(event) => setConfig({ ...config, token: event.target.value })} /></label><button className="admin-secondary" type="button" onClick={() => { localStorage.setItem("dhub-github-config", JSON.stringify(config)); setStatus({ kind: "success", text: "GitHub connection saved locally." }); }}>Save connection <Check size={15} /></button></section><section className="admin-card"><div className="admin-card-title"><span>02</span><h2>New design</h2></div><form onSubmit={addDesign}><label>Image <div className="upload-box"><Upload size={17} /><span>{form.file ? form.file.name : "Choose a PNG, JPG or WebP"}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /></div></label><label>Title <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. A calmer checkout" /></label><label>Short description <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What was this study exploring?" rows={4} /></label><label>Category <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Visual study</option><option>Product design</option><option>Brand direction</option><option>Art direction</option></select></label><button className="admin-submit" type="submit"><Plus size={16} /> Commit design to GitHub</button></form>{status.text && <p className={`admin-status ${status.kind}`}>{status.kind === "success" ? <Check size={15} /> : <X size={15} />}{status.text}</p>}</section></div><section className="admin-card admin-archive"><div className="admin-card-title"><span>03</span><h2>Current archive</h2></div><div className="archive-list">{designs.length === 0 ? <p className="admin-help">No remote entries loaded yet.</p> : designs.map((design, index) => <div className="archive-row" key={`${design.title}-${index}`}><span>0{index + 1}</span><strong>{design.title}</strong><small>{design.type}</small></div>)}</div></section></main></div>;
}
