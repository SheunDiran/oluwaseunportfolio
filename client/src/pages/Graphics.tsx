import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus, X } from "lucide-react";
import SheunShell, { SheunFooter } from "@/components/SheunShell";

type Design = { title: string; imagePath: string; type: string; description: string };

export default function Graphics() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selected, setSelected] = useState<Design | null>(null);
  const [ownerSession, setOwnerSession] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All work");

  useEffect(() => {
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    setOwnerSession(unlockedUntil > Date.now());
    fetch("/designs.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => setDesigns(Array.isArray(data) ? data : []))
      .catch(() => setDesigns([]));
  }, []);

  const filters = useMemo(() => ["All work", ...Array.from(new Set(designs.map((design) => design.type)))], [designs]);
  const visibleDesigns = activeFilter === "All work" ? designs : designs.filter((design) => design.type === activeFilter);

  return (
    <SheunShell active="designs">
      <main className="graphics-page">
        <section className="graphics-hero">
          <div className="graphics-hero-copy">
            <small className="graphics-kicker"><span /> DESIGN / VISUAL COMMUNICATION</small>
            <h1>Ideas made<br /><em>impossible</em><br />to ignore.</h1>
            <p>A selection of visual identities, campaign artwork and event graphics. Each piece is designed to make its message feel clear, memorable and unmistakably its own.</p>
            <a className="graphics-hero-link" href="#selected-work">Explore selected work <ArrowRight size={15} /></a>
          </div>
          <div className="graphics-hero-index" aria-label={`${designs.length} selected works`}>
            <span>INDEPENDENT DESIGN PRACTICE</span>
            <strong>{String(designs.length).padStart(2, "0")}</strong>
            <small>SELECTED VISUAL WORKS</small>
            <div className="graphics-index-mark" aria-hidden="true">S<span>—</span></div>
          </div>
          <div className="graphics-hero-foot"><span>LAGOS, NIGERIA</span><span>BRAND · CAMPAIGN · CULTURE</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>

        <section className="graphics-intro">
          <div><small>THE DESIGN PRACTICE / 01</small><h2>Not decoration.<br /><em>Direction.</em></h2></div>
          <p>Good graphics do more than fill a space. They help people notice, understand and feel something. I bring thoughtful composition and a strong point of view to every brief, from a one-off flyer to a complete visual identity.</p>
        </section>

        <section className="graphics-gallery" id="selected-work">
          <div className="graphics-gallery-head">
            <div><small>SELECTED WORK / 02</small><h2>A visual<br /><em>working archive.</em></h2></div>
            <span>{String(visibleDesigns.length).padStart(2, "0")} PIECES <i /> MADE WITH INTENTION</span>
          </div>
          <div className="graphics-filter-row">
            <span className="graphics-filter-label">BROWSE BY DISCIPLINE</span>
            <div className="graphics-filters" role="group" aria-label="Filter designs by category">
              {filters.map((filter) => (
                <button key={filter} className={activeFilter === filter ? "is-active" : ""} type="button" aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                  {filter === "All work" ? "All work" : filter}<span>{filter === "All work" ? designs.length : designs.filter((design) => design.type === filter).length}</span>
                </button>
              ))}
            </div>
          </div>
          {ownerSession && <a className="graphics-owner-add" href="/admin"><Plus size={15} /> Add a design <span>OWNER SESSION</span></a>}
          {visibleDesigns.length ? (
            <div className="graphics-gallery-grid">
              {visibleDesigns.map((design, index) => (
                <article className={`graphics-gallery-card graphics-gallery-card-${(index % 6) + 1}`} key={`${design.title}-${design.imagePath}`}>
                  <button type="button" onClick={() => setSelected(design)} aria-label={`View ${design.title}`}>
                    <div className="graphics-image-wrap"><img src={design.imagePath} alt={design.title} loading="lazy" /><span>{String(index + 1).padStart(2, "0")}</span><i className="graphics-card-open"><ArrowUpRight size={17} /></i></div>
                    <div className="graphics-card-copy"><small>{design.type}</small><h3>{design.title}</h3><span>View project <ArrowUpRight size={14} /></span></div>
                  </button>
                </article>
              ))}
            </div>
          ) : <p className="graphics-empty">New pieces are being prepared for the archive. Please check back soon.</p>}
        </section>

        <section className="graphics-cta"><div><small>HAVE A GOOD IDEA?</small><h2>Let&apos;s give it<br /><em>a visual voice.</em></h2></div><a href="/contact.html">Start a conversation <ArrowUpRight size={15} /></a><span className="graphics-cta-note">AVAILABLE FOR SELECT PROJECTS<br />BRANDING · CAMPAIGNS · EVENT ARTWORK</span></section>
      </main>
      {selected && <div className="graphics-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}><div onClick={(event) => event.stopPropagation()}><button className="graphics-close" type="button" onClick={() => setSelected(null)} aria-label="Close design"><X /></button><small>{selected.type}</small><h2>{selected.title}</h2><img src={selected.imagePath} alt={selected.title} /><p>{selected.description}</p><a href="/contact.html">Work on a visual direction <ArrowUpRight size={14} /></a></div></div>}
      <SheunFooter />
    </SheunShell>
  );
}
