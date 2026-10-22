import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, LogOut, Plus, Trash2, Upload } from "lucide-react";
import { studioRequest, imageForUpload, type DesignDraft } from "@/lib/studio";
import "./AdminUpload.css";

type Design = { title: string; imagePath: string; type: string };
type Testimonial = { quote: string; name: string; organisation: string };
const blank = (): DesignDraft => ({ id: crypto.randomUUID(), file: null, title: "", description: "", type: "Flyers & Posters", tags: "" });
export default function Admin() {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [password, setPassword] = useState("");
  const [drafts, setDrafts] = useState<DesignDraft[]>([blank()]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [quote, setQuote] = useState<Testimonial>({ quote: "", name: "", organisation: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const tickets = useRef(new Map<string, { file: File; ticket: string }>());
  useEffect(() => {
    // Retire the old browser-only credentials; server cookies now control access.
    localStorage.removeItem("dhub-admin-password"); localStorage.removeItem("dhub-github-config"); sessionStorage.removeItem("dhub-admin-unlocked-until");
    studioRequest().then(async data => { setSignedIn(data.authenticated); if (data.authenticated) await loadArchive(); }).catch(error => { setFailed(true); setMessage(error.message); setSetupNeeded(true); }).finally(() => setLoading(false));
  }, []);
  async function loadArchive() { const data = await studioRequest(undefined, "data"); setDesigns(data.designs || []); setTestimonials(data.testimonials || []); }
  function status(text: string, error = false) { setMessage(text); setFailed(error); }
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); status("");
    try { await studioRequest({ action: "login", password }); setPassword(""); setSignedIn(true); await loadArchive(); }
    catch (error) { status((error as Error).message, true); } finally { setBusy(false); }
  }
  async function logout() { setBusy(true); try { await studioRequest({ action: "logout" }); setSignedIn(false); setDrafts([blank()]); tickets.current.clear(); status(""); } catch (error) { status((error as Error).message, true); } finally { setBusy(false); } }
  function update(id: string, changes: Partial<DesignDraft>) { setDrafts(current => current.map(item => item.id === id ? { ...item, ...changes } : item)); }
  function addFiles(files: File[]) {
    const valid = files.filter(file => /^(image\/(png|jpeg|webp))$/.test(file.type) && file.size <= 12 * 1024 * 1024);
    if (valid.length !== files.length) status("Some files were skipped. Choose PNG, JPG or WebP pictures under 12 MB.", true);
    setDrafts(current => {
      const filled = valid.map(file => ({ ...blank(), file, title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }));
      return [...current.filter(item => item.file || item.title.trim() || item.description.trim()), ...filled].slice(0, 50);
    });
  }
  async function publish(event: FormEvent) {
    event.preventDefault();
    if (drafts.some(item => !item.file || !item.title.trim())) { status("Give each design a picture and title, or remove its empty form.", true); return; }
    setBusy(true);
    try {
      const items = [];
      for (let index = 0; index < drafts.length; index++) {
        const item = drafts[index]; const file = item.file!;
        status(`Uploading design ${index + 1} of ${drafts.length}…`);
        let cached = tickets.current.get(item.id);
        if (!cached || cached.file !== file) { const result = await studioRequest({ action: "image", image: await imageForUpload(file) }); cached = { file, ticket: result.ticket }; tickets.current.set(item.id, cached); }
        items.push({ title: item.title, description: item.description, type: item.type, tags: item.tags, ticket: cached.ticket });
      }
      status("Publishing your designs…");
      const result = await studioRequest({ action: "designs", items });
      setDesigns(result.items); tickets.current.clear(); setDrafts([blank()]);
      status(`${items.length} design${items.length === 1 ? "" : "s"} saved. They’ll appear in the gallery when the site finishes updating.`);
    } catch (error) { status((error as Error).message, true); } finally { setBusy(false); }
  }
  async function publishQuote(event: FormEvent) { event.preventDefault(); setBusy(true); status("Saving testimonial…"); try { const result = await studioRequest({ action: "testimonial", ...quote }); setTestimonials(result.items); setQuote({ quote: "", name: "", organisation: "" }); status("Testimonial saved. The site is updating."); } catch (error) { status((error as Error).message, true); } finally { setBusy(false); } }
  const feedback = message && <p className={`studio-status ${failed ? "is-error" : ""}`} role="status" aria-live="polite">{message}</p>;
  if (loading) return <main className="studio-page"><p>Opening your studio…</p></main>;
  if (!signedIn) return <main className="studio-page studio-login"><a href="/designs/" className="studio-back"><ArrowLeft size={16} /> Back to portfolio</a><section className="studio-panel"><span className="studio-eyebrow">SHEUN / OWNER STUDIO</span><h1>Welcome back.</h1><p>Log in to add designs and testimonials.</p>{feedback}{!setupNeeded && <form onSubmit={login}><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><button className="studio-primary" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button></form>}</section></main>;
  return <main className="studio-page">
    <header className="studio-header"><a href="/designs/" className="studio-back"><ArrowLeft size={16} /> View portfolio</a><button className="studio-secondary" onClick={logout} disabled={busy}><LogOut size={16} /> Log out</button></header>
    <div className="studio-heading"><span className="studio-eyebrow">SHEUN / OWNER STUDIO</span><h1>Your work, ready to share.</h1><p>Add pictures, give them titles, and publish when you’re ready.</p></div>
    {feedback}
    <section className="studio-panel"><div className="studio-section-heading"><div><h2>Add designs</h2><p>Descriptions are optional. Publish up to 50 designs together.</p></div><button className="studio-secondary" type="button" onClick={() => input.current?.click()} disabled={busy}>Choose multiple pictures</button><input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ""; }} /></div>
      <form onSubmit={publish}><fieldset disabled={busy}><div className="studio-design-grid">{drafts.map((item, index) => <DesignForm key={item.id} item={item} index={index} update={changes => update(item.id, changes)} remove={() => { tickets.current.delete(item.id); setDrafts(current => current.filter(entry => entry.id !== item.id)); }} />)}</div>
        <div className="studio-actions"><button type="button" className="studio-secondary studio-add-another" disabled={drafts.length >= 50} onClick={() => setDrafts(current => [...current, blank()])}><Plus size={18} /> Add another design</button><button type="submit" className="studio-primary" disabled={!drafts.length || busy}><Upload size={18} /> {busy ? "Publishing…" : `Publish ${drafts.length} design${drafts.length === 1 ? "" : "s"}`}</button></div>
      </fieldset></form>
    </section>
    <section className="studio-panel"><h2>Add a testimonial</h2><p>Use feedback you have permission to share.</p><form onSubmit={publishQuote}><fieldset disabled={busy}><label>Testimonial<textarea required rows={4} maxLength={700} value={quote.quote} onChange={event => setQuote({ ...quote, quote: event.target.value })} /></label><div className="studio-two-fields"><label>Name<input required maxLength={80} value={quote.name} onChange={event => setQuote({ ...quote, name: event.target.value })} /></label><label>Organisation <span>(optional)</span><input maxLength={100} value={quote.organisation} onChange={event => setQuote({ ...quote, organisation: event.target.value })} /></label></div><button className="studio-primary" disabled={busy}>Publish testimonial</button></fieldset></form></section>
    <section className="studio-panel"><h2>Saved work · {designs.length}</h2><div className="studio-saved-grid">{designs.map(item => <article key={item.imagePath}><img src={item.imagePath} alt={item.title} loading="lazy" /><h3>{item.title}</h3><p>{item.type}</p></article>)}</div>{!designs.length && <p>Your published designs will appear here.</p>}<h2>Testimonials · {testimonials.length}</h2>{testimonials.map((item, index) => <blockquote key={index}>{item.quote}<cite>{item.name}{item.organisation ? ` · ${item.organisation}` : ""}</cite></blockquote>)}</section>
  </main>;
}
function DesignForm({ item, index, update, remove }: { item: DesignDraft; index: number; update: (changes: Partial<DesignDraft>) => void; remove: () => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => { if (!item.file) { setPreview(""); return; } const url = URL.createObjectURL(item.file); setPreview(url); return () => URL.revokeObjectURL(url); }, [item.file]);
  return <article className="studio-design-form"><div className="studio-card-heading"><h3>Design {index + 1}</h3><button type="button" className="studio-remove" onClick={remove} aria-label={`Remove design ${index + 1}`}><Trash2 size={16} /> Remove</button></div><label className="studio-picture-picker">{preview ? <img src={preview} alt={`Preview of ${item.title || `design ${index + 1}`}`} /> : <><ImagePlus size={32} /><strong>Choose picture</strong><span>PNG, JPG or WebP · up to 12 MB</span></>}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Picture for design ${index + 1}`} onChange={event => { const file = event.target.files?.[0]; if (file) update({ file, title: item.title || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }); }} /></label><label>Title<input required maxLength={90} placeholder="e.g. NESA event flyer" value={item.title} onChange={event => update({ title: event.target.value })} /></label><label>Description <span>(optional)</span><textarea rows={2} maxLength={420} placeholder="A short note about this design" value={item.description} onChange={event => update({ description: event.target.value })} /></label><label>Category<select value={item.type} onChange={event => update({ type: event.target.value })}><option>Flyers &amp; Posters</option><option>Social Media</option><option>Branding</option><option>Other</option></select></label><label>Tags <span>(optional)</span><input maxLength={300} placeholder="event, social, community" value={item.tags} onChange={event => update({ tags: event.target.value })} /></label></article>;
}
