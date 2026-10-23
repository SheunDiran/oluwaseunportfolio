import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { studioRequest, imageForUpload, type DesignDraft } from "@/lib/studio";
import "./AdminUpload.css";

type Design = { id: string; title: string; description?: string; imagePath: string; type: string; pinned?: boolean; pinOrder?: number };
type Testimonial = { id?: string; quote: string; name: string; organisation: string };
const blank = (): DesignDraft => ({ id: crypto.randomUUID(), file: null, title: "", description: "", type: "Flyers & Posters", tags: "" });
export default function Admin() {
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
    loadArchive().catch(error => { setFailed(true); setMessage(error.message); });
  }, []);
  async function loadArchive() { const data = await studioRequest(undefined, "data"); setDesigns(data.designs || []); setTestimonials(data.testimonials || []); }
  function status(text: string, error = false) { setMessage(text); setFailed(error); }
  async function changeQuote(item: Testimonial, remove = false) {
    setBusy(true); status(remove ? "Removing testimonial…" : "Saving changes…");
    try { const result = await studioRequest({ action: remove ? "remove-testimonial" : "edit-testimonial", ...item }); setTestimonials(result.items); status(remove ? "Testimonial removed." : "Testimonial updated."); }
    catch (error) { status((error as Error).message, true); } finally { setBusy(false); }
  }
  async function changeDesign(action: string, item: Design, file?: File) {
    setBusy(true); status(action === "remove-design" ? "Removing design…" : "Saving design…");
    try {
      let ticket: string | undefined;
      if (file) { status("Uploading replacement picture…"); ticket = (await studioRequest({ action: "image", image: await imageForUpload(file) })).ticket; }
      const result = await studioRequest({ action, id: item.id, title: item.title, description: item.description || "", pinned: !!item.pinned, pinOrder: item.pinOrder, ...(ticket ? { ticket } : {}) });
      setDesigns(result.items); status(action === "remove-design" ? "Design removed from your portfolio." : "Design saved. Your gallery is updated.");
      return true;
    } catch (error) { status((error as Error).message, true); return false; } finally { setBusy(false); }
  }
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
      status(`${items.length} design${items.length === 1 ? "" : "s"} saved. They’re available in your gallery now.`);
    } catch (error) { status((error as Error).message, true); } finally { setBusy(false); }
  }
  async function publishQuote(event: FormEvent) { event.preventDefault(); setBusy(true); status("Saving testimonial…"); try { const result = await studioRequest({ action: "testimonial", ...quote }); setTestimonials(result.items); setQuote({ quote: "", name: "", organisation: "" }); status("Testimonial saved and published."); } catch (error) { status((error as Error).message, true); } finally { setBusy(false); } }
  const feedback = message && <p className={`studio-status ${failed ? "is-error" : ""}`} role="status" aria-live="polite">{message}</p>;
  return <main className="studio-page">
    <header className="studio-header"><a href="/designs/" className="studio-back"><ArrowLeft size={16} /> View portfolio</a></header>
    <div className="studio-heading"><span className="studio-eyebrow">SHEUN / OWNER STUDIO</span><h1>Your work, ready to share.</h1><p>Add pictures, give them titles, and publish when you’re ready.</p></div>
    {feedback}
    <section className="studio-panel"><div className="studio-section-heading"><div><h2>Add designs</h2><p>Descriptions are optional. Publish up to 50 designs together.</p></div><button className="studio-secondary" type="button" onClick={() => input.current?.click()} disabled={busy}>Choose multiple pictures</button><input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ""; }} /></div>
      <form onSubmit={publish}><fieldset disabled={busy}><div className="studio-design-grid">{drafts.map((item, index) => <DesignForm key={item.id} item={item} index={index} update={changes => update(item.id, changes)} remove={() => { tickets.current.delete(item.id); setDrafts(current => current.filter(entry => entry.id !== item.id)); }} />)}</div>
        <div className="studio-actions"><button type="button" className="studio-secondary studio-add-another" disabled={drafts.length >= 50} onClick={() => setDrafts(current => [...current, blank()])}><Plus size={18} /> Add another design</button><button type="submit" className="studio-primary" disabled={!drafts.length || busy}><Upload size={18} /> {busy ? "Publishing…" : `Publish ${drafts.length} design${drafts.length === 1 ? "" : "s"}`}</button></div>
      </fieldset></form>
    </section>
    <section className="studio-panel"><h2>Add a testimonial</h2><p>Use feedback you have permission to share.</p><form onSubmit={publishQuote}><fieldset disabled={busy}><label>Testimonial<textarea required rows={4} maxLength={700} value={quote.quote} onChange={event => setQuote({ ...quote, quote: event.target.value })} /></label><div className="studio-two-fields"><label>Name<input required maxLength={80} value={quote.name} onChange={event => setQuote({ ...quote, name: event.target.value })} /></label><label>Organisation <span>(optional)</span><input maxLength={100} value={quote.organisation} onChange={event => setQuote({ ...quote, organisation: event.target.value })} /></label></div><button className="studio-primary" disabled={busy}>Publish testimonial</button></fieldset></form></section>
    <section className="studio-panel"><h2>Saved work · {designs.length}</h2><p>Edit or replace your artwork here. Pinned designs stay above new uploads; use positions 1, 2, 3 to choose their order.</p><div className="studio-saved-grid">{designs.map(item => <SavedDesign key={item.id} item={item} busy={busy} save={changeDesign} />)}</div>{!designs.length && <p>Your published designs will appear here.</p>}<h2>Testimonials · {testimonials.length}</h2>{testimonials.map(item => <TestimonialEditor key={item.id} item={item} busy={busy} save={changeQuote} />)}</section>
  </main>;
}
function DesignForm({ item, index, update, remove }: { item: DesignDraft; index: number; update: (changes: Partial<DesignDraft>) => void; remove: () => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => { if (!item.file) { setPreview(""); return; } const url = URL.createObjectURL(item.file); setPreview(url); return () => URL.revokeObjectURL(url); }, [item.file]);
  return <article className="studio-design-form"><div className="studio-card-heading"><h3>Design {index + 1}</h3><button type="button" className="studio-remove" onClick={remove} aria-label={`Remove design ${index + 1}`}><Trash2 size={16} /> Remove</button></div><label className="studio-picture-picker">{preview ? <img src={preview} alt={`Preview of ${item.title || `design ${index + 1}`}`} /> : <><ImagePlus size={32} /><strong>Choose picture</strong><span>PNG, JPG or WebP · up to 12 MB</span></>}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Picture for design ${index + 1}`} onChange={event => { const file = event.target.files?.[0]; if (file) update({ file, title: item.title || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }); }} /></label><label>Title<input required maxLength={90} placeholder="e.g. NESA event flyer" value={item.title} onChange={event => update({ title: event.target.value })} /></label><label>Description <span>(optional)</span><textarea rows={2} maxLength={420} placeholder="A short note about this design" value={item.description} onChange={event => update({ description: event.target.value })} /></label><label>Category<select value={item.type} onChange={event => update({ type: event.target.value })}><option>Flyers &amp; Posters</option><option>Social Media</option><option>Branding</option><option>Other</option></select></label><label>Tags <span>(optional)</span><input maxLength={300} placeholder="event, social, community" value={item.tags} onChange={event => update({ tags: event.target.value })} /></label></article>;
}

function TestimonialEditor({ item, busy, save }: { item: Testimonial; busy: boolean; save: (item: Testimonial, remove?: boolean) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  if (!editing) return <blockquote>{item.quote}<cite>{item.name}{item.organisation ? ` · ${item.organisation}` : ""}</cite><div className="studio-actions"><button type="button" className="studio-secondary" disabled={busy} onClick={() => setEditing(true)}>Edit</button><button type="button" className="studio-remove" disabled={busy} onClick={() => { if (window.confirm("Remove this testimonial from your portfolio?")) void save(item, true); }}>Remove</button></div></blockquote>;
  return <form onSubmit={event => { event.preventDefault(); void save(draft); }}><fieldset disabled={busy}><label>Testimonial<textarea required maxLength={700} value={draft.quote} onChange={event => setDraft({ ...draft, quote: event.target.value })} /></label><label>Name<input required maxLength={80} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label>Organisation (optional)<input maxLength={100} value={draft.organisation} onChange={event => setDraft({ ...draft, organisation: event.target.value })} /></label><div className="studio-actions"><button className="studio-primary">Save changes</button><button type="button" className="studio-secondary" onClick={() => { setDraft(item); setEditing(false); }}>Close</button></div></fieldset></form>;
}

function SavedDesign({ item, busy, save }: { item: Design; busy: boolean; save: (action: string, item: Design, file?: File) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState("");
  const [position, setPosition] = useState(String(item.pinOrder || 1));
  useEffect(() => { setTitle(item.title); setDescription(item.description || ""); setPosition(String(item.pinOrder || 1)); }, [item]);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  return <article className="studio-saved-design"><img src={preview || item.imagePath} alt={title} loading="lazy" />
    {editing ? <form onSubmit={async event => { event.preventDefault(); if (await save("edit-design", { ...item, title, description }, file)) { setFile(undefined); setEditing(false); } }}><fieldset disabled={busy}>
      <label>Title<input required maxLength={90} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label>Description (optional)<textarea rows={3} maxLength={420} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <label>Replace image (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setFile(event.target.files?.[0])} /></label>
      <div className="studio-actions"><button className="studio-primary">Save changes</button><button className="studio-secondary" type="button" onClick={() => { setEditing(false); setFile(undefined); setTitle(item.title); setDescription(item.description || ""); }}>Cancel</button></div>
    </fieldset></form> : <><h3>{item.title}</h3><p>{item.type}{item.pinned ? ` · Pinned #${item.pinOrder || 1}` : ""}</p><div className="studio-actions">
      <button className="studio-secondary" type="button" disabled={busy} onClick={() => setEditing(true)}>Edit</button>
      <button className="studio-secondary" type="button" disabled={busy} onClick={() => void save("pin-design", { ...item, pinned: !item.pinned, pinOrder: item.pinned ? item.pinOrder : undefined })}>{item.pinned ? "Unpin" : "Pin to top"}</button>
      <button className="studio-remove" type="button" disabled={busy} onClick={() => { if (window.confirm(`Delete “${item.title}” from your portfolio?`)) void save("remove-design", item); }}>Delete</button>
    </div></>}
    {item.pinned && !editing && <form className="studio-pin-position" onSubmit={event => { event.preventDefault(); void save("pin-design", { ...item, pinned: true, pinOrder: Number(position) }); }}><label>Pin position<input type="number" min={1} max={10000} step={1} required value={position} disabled={busy} onChange={event => setPosition(event.target.value)} /></label><button className="studio-secondary" disabled={busy}>Save position</button></form>}
  </article>;
}

