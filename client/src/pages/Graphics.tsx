import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus, X } from "lucide-react";
import SheunShell, { SheunFooter } from "@/components/SheunShell";

type Design = { title: string; imagePath: string; type: string; description: string };

export default function Graphics() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selected, setSelected] = useState<Design | null>(null);
  const [ownerSession, setOwnerSession] = useState(false);

  useEffect(() => {
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    setOwnerSession(unlockedUntil > Date.now());
    fetch("/designs.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => setDesigns(Array.isArray(data) ? data : []))
      .catch(() => setDesigns([]));
  }, []);

  return (
    <SheunShell active="designs">
      <main className="graphics-page">
        <section className="graphics-hero">
          <div>
            <small>DESIGN / VISUAL COMMUNICATION</small>
            <h1>Visuals that<br /><em>make meaning</em><br />visible.</h1>
            <p>Flyers, identities and event artwork made to give ideas a clear face, a stronger feeling and somewhere to land.</p>
          </div>
          <div className="graphics-hero-index"><span>THE ARCHIVE</span><strong>{String(designs.length).padStart(2, "0")}</strong><small>SELECTED VISUAL WORKS</small></div>
        </section>
        <section className="graphics-intro">
          <div><small>THE DESIGN PRACTICE / 01</small><h2>Not decoration.<br /><em>Direction.</em></h2></div>
          <p>I use design to create a moment of recognition: the right colour, the right emphasis, the right visual cue for what matters next.</p>
        </section>
        <section className="graphics-gallery">
          <div className="graphics-gallery-head">
            <div><small>SELECTED WORK / 02</small><h2>A visual<br /><em>working archive.</em></h2></div>
            <span>Click any piece to study it closer <ArrowRight size={14} /></span>
          </div>
          {ownerSession && <a className="graphics-owner-add" href="/admin"><Plus size={15} /> Add a design <span>PRIVATE OWNER VIEW</span></a>}
          {designs.length ? (
            <div className="graphics-gallery-grid">
              {designs.map((design, index) => (
                <article className={`graphics-gallery-card graphics-gallery-card-${(index % 6) + 1}`} key={`${design.title}-${design.imagePath}`}>
                  <button type="button" onClick={() => setSelected(design)} aria-label={`View ${design.title}`}>
                    <div className="graphics-image-wrap"><img src={design.imagePath} alt={design.title} loading="lazy" /><span>{String(index + 1).padStart(2, "0")}</span></div>
                    <div className="graphics-card-copy"><small>{design.type}</small><h3>{design.title}</h3><span>View piece <ArrowUpRight size={14} /></span></div>
                  </button>
                </article>
              ))}
            </div>
          ) : <p className="graphics-empty">New pieces are being prepared for the archive. Please check back soon.</p>}
        </section>
        <section className="graphics-cta"><small>DESIGN WITH A JOB TO DO?</small><h2>Let&apos;s make the<br /><em>next idea visible.</em></h2><a href="/contact.html">Start a conversation <ArrowUpRight size={15} /></a></section>
      </main>
      {selected && <div className="graphics-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}><div onClick={(event) => event.stopPropagation()}><button className="graphics-close" type="button" onClick={() => setSelected(null)} aria-label="Close design"><X /></button><small>{selected.type}</small><h2>{selected.title}</h2><img src={selected.imagePath} alt={selected.title} /><p>{selected.description}</p><a href="/contact.html">Work on a visual direction <ArrowUpRight size={14} /></a></div></div>}
      <SheunFooter />
    </SheunShell>
  );
}
