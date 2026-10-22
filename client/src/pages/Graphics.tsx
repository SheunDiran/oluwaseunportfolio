import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail, MessageCircle, Plus, Quote } from "lucide-react";
import "./Graphics.css";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SheunShell from "@/components/SheunShell";

type Design = { title: string; imagePath: string; type: string; description?: string; tags?: string[] };
type Testimonial = { quote: string; name: string; organisation: string };

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const categories = ["Flyers & Posters", "Social Media", "Branding"];

function categoryFor(design: Design) {
  if (categories.includes(design.type)) return design.type;
  const text = [design.type, ...(design.tags || [])].join(" ").toLowerCase();
  if (/social|communication|announcement|content/.test(text)) return "Social Media";
  if (/brand|community|identity|logo/.test(text)) return "Branding";
  if (/flyer|poster|event|campaign/.test(text)) return "Flyers & Posters";
  return "Other";
}

function GraphicFooter() {
  return (
    <footer className="graphics-footer">
      <div className="graphics-footer-inner">
        <div className="graphics-footer-main">
          <small>HAVE A GOOD IDEA?</small>
          <h2>Let&apos;s create something<br />worth seeing.</h2>
          <a className="graphics-footer-cta" href="/contact.html">Let&apos;s work together <ArrowUpRight size={16} /></a>
        </div>
        <div className="graphics-footer-contact">
          <span>FOLLOW / SAY HELLO</span>
          <a href="mailto:oluwaseunoyediran641@gmail.com"><Mail size={15} /> Email Sheun <ArrowUpRight size={13} /></a>
          <a href="https://wa.me/2347073754496?text=Hi%20Sheun%2C%20I%20found%20your%20graphic%20design%20portfolio." target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp <ArrowUpRight size={13} /></a>
          <small>LAGOS, NIGERIA · AVAILABLE FOR SELECT PROJECTS</small>
        </div>
        <div className="graphics-footer-bottom"><strong>SHEUN</strong><span>© {new Date().getFullYear()} Sheun. All rights reserved.</span><small>INDEPENDENT GRAPHIC DESIGNER</small></div>
      </div>
    </footer>
  );
}

export default function Graphics() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selected, setSelected] = useState<Design | null>(null);
  const [ownerSession, setOwnerSession] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All work");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const unlockedUntil = Number(sessionStorage.getItem("dhub-admin-unlocked-until") || 0);
    const controller = new AbortController();
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    setOwnerSession(false);
    try {
      const savedConfig = JSON.parse(localStorage.getItem("dhub-github-config") || "{}");
      if (unlockedUntil > Date.now() && savedConfig.repo === "SheunDiran/oluwaseunportfolio" && typeof savedConfig.token === "string" && savedConfig.token) {
        fetch("https://api.github.com/repos/SheunDiran/oluwaseunportfolio", { headers: { Authorization: `Bearer ${savedConfig.token}`, Accept: "application/vnd.github+json" }, signal: controller.signal })
          .then(response => response.ok ? response.json() : null)
          .then(repo => { if (!controller.signal.aborted && Date.now() < unlockedUntil && repo?.permissions?.push === true) setOwnerSession(true); })
          .catch(() => undefined);
        expiryTimer = setTimeout(() => setOwnerSession(false), unlockedUntil - Date.now());
      }
    } catch { setOwnerSession(false); }
    fetch(publicAsset("/designs.json"))
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => setDesigns(Array.isArray(data) ? data : []))
      .catch(() => setDesigns([]));
    fetch(publicAsset("/testimonials.json"))
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]));
    return () => { controller.abort(); if (expiryTimer) clearTimeout(expiryTimer); };
  }, []);

  const filters = useMemo(() => ["All work", ...categories, ...(designs.some((design) => categoryFor(design) === "Other") ? ["Other"] : [])], [designs]);
  const countFor = (filter: string) => filter === "All work" ? designs.length : designs.filter((design) => categoryFor(design) === filter).length;
  const visibleDesigns = activeFilter === "All work" ? designs : designs.filter((design) => categoryFor(design) === activeFilter);
  const pageCount = Math.max(1, Math.ceil(visibleDesigns.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedDesigns = visibleDesigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisible = visibleDesigns.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(currentPage * pageSize, visibleDesigns.length);

  function goToPage(nextPage: number) {
    setPage(Math.max(1, Math.min(pageCount, nextPage)));
    document.getElementById("selected-work")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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

        <section className="graphics-gallery graphics-selected-work" id="selected-work">
          <div className="graphics-gallery-head">
            <div><small>WORK</small><h2>Selected work</h2><p>Flyers, social content and visual identities.</p></div>
            {ownerSession && <a className="graphics-owner-preview" href="/admin" aria-label="Open owner preview and add a design"><span><Plus size={22} /></span><small>Add pictures</small></a>}
          </div>
          {designs.length > 0 && <div className="graphics-filter-row">
            <div className="graphics-filters" role="group" aria-label="Filter designs by category">
              {filters.map((filter) => (
                <button key={filter} className={activeFilter === filter ? "is-active" : ""} type="button" aria-pressed={activeFilter === filter} onClick={() => { setActiveFilter(filter); setPage(1); }}>
                  {filter}<span aria-label={`${countFor(filter)} designs`}>{countFor(filter)}</span>
                </button>
              ))}
            </div>
          </div>}
          {visibleDesigns.length ? (
            <div className="graphics-gallery-grid">
              {pagedDesigns.map((design, index) => (
                <article className={`graphics-gallery-card graphics-gallery-card-${(index % 6) + 1}`} key={`${design.title}-${design.imagePath}`}>
                  <button type="button" onClick={() => setSelected(design)} aria-label={`View ${design.title}`}>
                    <div className="graphics-image-wrap"><img src={publicAsset(design.imagePath)} alt={design.title} loading="lazy" /><span>{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><i className="graphics-card-open"><ArrowUpRight size={17} /></i></div>
                    <div className="graphics-card-copy"><small>{design.type}</small><h3>{design.title}</h3></div>
                  </button>
                </article>
              ))}
            </div>
          ) : <p className="graphics-empty">{designs.length ? "There are no pieces in this category yet. Choose another filter to keep exploring." : "I’m preparing the first pieces for this archive. Please check back soon."}</p>}
          {visibleDesigns.length > 0 && <nav className="graphics-pagination graphics-pagination-numbered" aria-label="Design gallery pages">
            <button className="graphics-page-arrow" type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} aria-label="Previous page"><ArrowLeft size={16} /></button>
            <div className="graphics-page-numbers">{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={currentPage === pageNumber ? "is-current" : ""} aria-current={currentPage === pageNumber ? "page" : undefined} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)}</div>
            <button className="graphics-page-arrow" type="button" disabled={currentPage === pageCount} onClick={() => goToPage(currentPage + 1)} aria-label="Next page"><ArrowRight size={16} /></button>
            <span className="graphics-page-summary">Showing {firstVisible}–{lastVisible} of {visibleDesigns.length}</span>
          </nav>}
        </section>

        <section className="graphics-testimonials" aria-labelledby="graphics-testimonials-title">
          <div className="graphics-testimonials-heading"><small>TESTIMONIALS</small><h2 id="graphics-testimonials-title">Words from people I&apos;ve worked with</h2></div>
          {testimonials.length ? (
            <div className="graphics-testimonial-grid">{testimonials.map((item, index) => <article className="graphics-testimonial-card" key={`${item.name}-${index}`}><Quote size={25} aria-hidden="true" /><blockquote>{item.quote}</blockquote><span className="graphics-testimonial-rule" /><p>{item.name}<small>{item.organisation}</small></p></article>)}</div>
          ) : (
            <div className="graphics-testimonial-grid graphics-testimonial-empty">
              <article className="graphics-testimonial-card"><Quote size={25} aria-hidden="true" /><p className="graphics-testimonial-note">Client notes will appear here once I have permission to share them.</p><span className="graphics-testimonial-rule" /><small>CLIENT STORIES / COMING SOON</small></article>
              <article className="graphics-testimonial-card graphics-testimonial-invite"><Quote size={25} aria-hidden="true" /><p className="graphics-testimonial-note">Have we worked together? I&apos;d love to hear about your experience.</p><span className="graphics-testimonial-rule" /><a href="mailto:oluwaseunoyediran641@gmail.com?subject=Portfolio%20testimonial">Share a note <ArrowUpRight size={13} /></a></article>
            </div>
          )}
        </section>
      </main>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="graphics-viewer">
          {selected && <><small>{selected.type}</small><DialogTitle>{selected.title}</DialogTitle><img src={publicAsset(selected.imagePath)} alt={selected.title} /><DialogDescription className={selected.description ? "" : "sr-only"}>{selected.description || `Full artwork: ${selected.title}`}</DialogDescription>{selected.tags?.length ? <div className="graphics-viewer-tags" aria-label="Project tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}<a href="/contact.html">Let’s work together <ArrowUpRight size={14} /></a></>}
        </DialogContent>
      </Dialog>
      <GraphicFooter />
    </SheunShell>
  );
}
