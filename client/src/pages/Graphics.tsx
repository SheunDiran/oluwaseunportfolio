import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import "./Graphics.css";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SheunShell, { SheunFooter } from "@/components/SheunShell";

type Design = { title: string; imagePath: string; type: string; description: string };

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function Graphics() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selected, setSelected] = useState<Design | null>(null);
  const [ownerSession, setOwnerSession] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All work");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    setOwnerSession(unlockedUntil > Date.now());
    fetch(publicAsset("/designs.json"))
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => setDesigns(Array.isArray(data) ? data : []))
      .catch(() => setDesigns([]));
  }, []);

  const filters = useMemo(() => ["All work", ...Array.from(new Set(designs.map((design) => design.type)))], [designs]);
  const visibleDesigns = activeFilter === "All work" ? designs : designs.filter((design) => design.type === activeFilter);

  const pageCount = Math.max(1, Math.ceil(visibleDesigns.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedDesigns = visibleDesigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <SheunShell active="designs">
      <main className="graphics-page graphics-editorial">
        <section className="editorial-hero" aria-labelledby="editorial-title">
          <div className="editorial-composition">
            <h1 id="editorial-title"><span className="editorial-graphic">GRAPHIC</span><span className="editorial-script">Designer</span></h1>
            <img className="editorial-cutout" src={publicAsset("/images/sheun-designer-cutout.webp")} alt="Oluwaseun Oyediran with her arms crossed, wearing a pink shirt and dark waistcoat" fetchPriority="high" />
            <span className="editorial-flourish" aria-hidden="true" />
            <span className="editorial-coral-marks" aria-hidden="true"><i /><i /></span>
          </div>
          <div className="editorial-identity">
            <h2>Oluwaseun Oyediran</h2>
            <p className="editorial-role">GRAPHIC DESIGNER</p>
            <p>Thoughtful visuals for brands, events and communities.</p>
            <div className="editorial-actions"><a href="#selected-work">View my work <ArrowUpRight size={15} /></a><a href="/contact.html">Let’s work together</a></div>
          </div>
        </section>
        <section className="graphics-hero graphics-hero-intro">
          <div className="graphics-hero-copy">
            <small className="graphics-kicker"><span /> GRAPHIC DESIGNER / LAGOS, NIGERIA</small>
            <p className="graphics-intro-name">Hello, I&apos;m Oluwaseun <b>“Sheun”</b> Oyediran.</p>
            <h2>I make ideas<br />impossible<br /><em>to ignore.</em></h2>
            <p className="graphics-intro-bio">I&apos;m a graphic designer creating bold, thoughtful visuals for brands, events and communities. From the first glance to the smallest detail, I make every piece clear, expressive and made for its audience.</p>
            <div className="graphics-hero-actions"><a className="graphics-hero-link" href="#selected-work">Explore selected work <ArrowRight size={15} /></a><a className="graphics-hero-contact" href="/contact.html">Let&apos;s work together <ArrowUpRight size={14} /></a></div>
          </div>
          <div className="graphics-portrait-stage">
            <div className="graphics-portrait-orbit graphics-portrait-orbit-one" />
            <div className="graphics-portrait-orbit graphics-portrait-orbit-two" />
            <div className="graphics-portrait-circle"><img src="/images/about-sheun-portrait.jpeg" alt="Oluwaseun “Sheun” Oyediran, graphic designer" /></div>
            <span className="graphics-portrait-stamp">DESIGN<br />WITH<br />PURPOSE</span>
            <span className="graphics-portrait-caption">THE DESIGNER BEHIND THE WORK <i>↗</i></span>
            <span className="graphics-portrait-spark" aria-hidden="true">✳</span>
          </div>
          <div className="graphics-hero-foot"><span>VISUAL DESIGN / 01</span><span>FLYERS · BRANDING · CAMPAIGNS</span><a href="#selected-work">SCROLL TO EXPLORE ↓</a></div>
        </section>



        <section className="graphics-gallery" id="selected-work">
          <div className="graphics-gallery-head">
            <div><small>WORK</small><h2>Selected work</h2><p>Flyers, social content and visual identities.</p></div>

          </div>
          <div className="graphics-filter-row">

            <div className="graphics-filters" role="group" aria-label="Filter designs by category">
              {filters.map((filter) => (
                <button key={filter} className={activeFilter === filter ? "is-active" : ""} type="button" aria-pressed={activeFilter === filter} onClick={() => { setActiveFilter(filter); setPage(1); }}>
                  {filter === "All work" ? "All work" : filter}<span>{filter === "All work" ? designs.length : designs.filter((design) => design.type === filter).length}</span>
                </button>
              ))}
            </div>
          </div>
          {ownerSession && <a className="graphics-owner-add" href="/admin"><Plus size={15} /> Add a design <span>OWNER SESSION</span></a>}
          {visibleDesigns.length ? (
            <div className="graphics-gallery-grid">
              {pagedDesigns.map((design, index) => (
                <article className={`graphics-gallery-card graphics-gallery-card-${(index % 6) + 1}`} key={`${design.title}-${design.imagePath}`}>
                  <button type="button" onClick={() => setSelected(design)} aria-label={`View ${design.title}`}>
                    <div className="graphics-image-wrap"><img src={publicAsset(design.imagePath)} alt={design.title} loading="lazy" /><span>{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><i className="graphics-card-open"><ArrowUpRight size={17} /></i></div>
                    <div className="graphics-card-copy"><h3>{design.title}</h3></div>
                  </button>
                </article>
              ))}
            </div>
          ) : <p className="graphics-empty">New pieces are being prepared for the archive. Please check back soon.</p>}
          {pageCount > 1 && <nav className="graphics-pagination" aria-label="Design gallery pages">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span aria-live="polite">Page {currentPage} of {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next <ArrowRight size={15} /></button>
          </nav>}
        </section>

        <section className="graphics-cta"><div><small>HAVE A GOOD IDEA?</small><h2>Let&apos;s give it<br /><em>a visual voice.</em></h2></div><a href="/contact.html">Start a conversation <ArrowUpRight size={15} /></a><span className="graphics-cta-note">AVAILABLE FOR SELECT PROJECTS<br />BRANDING · CAMPAIGNS · EVENT ARTWORK</span></section>
      </main>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="graphics-viewer">
          {selected && <><small>{selected.type}</small><DialogTitle>{selected.title}</DialogTitle><img src={publicAsset(selected.imagePath)} alt={selected.title} /><DialogDescription>{selected.description}</DialogDescription><a href="/contact.html">Let’s work together <ArrowUpRight size={14} /></a></>}
        </DialogContent>
      </Dialog>
      <SheunFooter />
    </SheunShell>
  );
}
