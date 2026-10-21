import { ReactNode, useEffect, useState } from "react";
import { ArrowUpRight, Menu, MessageCircle, X } from "lucide-react";
import FeedbackDrawer from "./FeedbackDrawer";

const face = "/manus-storage/myface_df9a62aa.jpeg";

export default function SheunShell({ children, active }: { children: ReactNode; active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const links = [
    ["About me", "/about.html"],
    ["Skills", "/skills.html"],
    ["Projects", "/projects.html"],
    ["Designs", "/designs"],
    ["Training", "/training.html"],
  ];

  useEffect(() => {
    const closeOnResize = () => { if (window.innerWidth > 780) setMenuOpen(false); };
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  return <div className="sheun-page"><header className="sheun-page-header"><a className="sheun-page-brand" href="/" onClick={(event) => { if ((event.target as HTMLElement).closest(".sheun-brand-avatar")) { event.preventDefault(); setAvatarOpen(true); } setMenuOpen(false); }}><img className="sheun-brand-avatar" src={face} alt="Sheun — open full portrait" /><span className="sheun-brand-mark">S</span><b className="sheun-brand-full">OYEDIRAN OLUWASEUN <i>(SHEUN)</i></b><b className="sheun-brand-short">SHEUN</b></a><div className="sheun-mobile-tools"><button className="sheun-mobile-avatar" type="button" onClick={() => setAvatarOpen(true)} aria-label="Open Sheun's profile image"><img src={face} alt="Sheun" /></button><button className="sheun-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div><nav className={menuOpen ? "is-open" : ""}>{links.map(([label, href]) => <a key={href} className={active === label.toLowerCase() || (active === "about" && label === "About me") ? "active" : ""} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}<a className="sheun-nav-contact" href="/contact.html" onClick={() => setMenuOpen(false)}>Let's talk <ArrowUpRight size={14} /></a></nav></header>{children}{avatarOpen && <div className="mobile-profile-lightbox" role="dialog" aria-modal="true" aria-label="Sheun profile image" onMouseDown={(event) => event.target === event.currentTarget && setAvatarOpen(false)}><button type="button" onClick={() => setAvatarOpen(false)} aria-label="Close profile image"><X size={20} /></button><img src={face} alt="Full portrait of Sheun" /><span>ESC TO CLOSE / SHEUN 001</span></div>}<a className="whatsapp-float" href="https://wa.me/2347073754496?text=Hi%20Sheun%2C%20I%20found%20your%20portfolio%20and%20would%20love%20to%20talk." target="_blank" rel="noreferrer" aria-label="Message Sheun on WhatsApp"><MessageCircle size={21} /><span>WhatsApp Sheun</span></a><FeedbackDrawer /></div>;
}

export function SheunFooter() { return <footer className="sheun-page-footer"><div className="sheun-footer-signal" aria-hidden="true"><span /><span /><span /></div><div className="sheun-footer-lead"><span className="sheun-footer-kicker">A GOOD NEXT STEP</span><h2>Let&apos;s build<br /><em>something useful.</em></h2><a href="/contact.html">Start a conversation <ArrowUpRight size={15} /></a></div><div className="sheun-footer-column"><h3>Navigate</h3><a href="/">Home</a><a href="/about.html">About me</a><a href="/skills.html">Skills</a><a href="/projects.html">Projects</a><a href="/designs">Designs</a></div><div className="sheun-footer-column"><h3>Keep exploring</h3><a href="/training.html">Training</a><a href="/contact.html">Let&apos;s talk</a><a href="/resume.html">Resume</a><a href="/oluwaseun-oyediran-resume.pdf" download="Oluwaseun-Oyediran-Resume.pdf">Download CV</a></div><div className="sheun-footer-column"><h3>Say hello</h3><a href="mailto:oluwaseunoyediran641@gmail.com">Email Sheun</a><a href="https://wa.me/2347073754496?text=Hi%20Sheun%2C%20I%20found%20your%20portfolio%20and%20would%20love%20to%20talk." target="_blank" rel="noreferrer">WhatsApp</a><span>Lagos, Nigeria</span></div><div className="sheun-footer-bottom"><small>© 2026 SHEUN / BUILT WITH INTENTION</small><span>Software · Education · Community</span></div></footer>; }
