import { ArrowUpRight, Printer } from "lucide-react";

export default function DesignResume() {
  return (
    <main className="design-resume-page">
      <style>{`
        .design-resume-page { min-height:100vh; background:#edf0e9; color:#18251e; font-family:Arial,Helvetica,sans-serif; padding:40px 18px; }
        .design-resume-sheet { max-width:820px; margin:0 auto; background:#fff; padding:50px 52px; box-shadow:0 16px 45px rgba(12,35,21,.08); }
        .design-resume-top {display:flex;justify-content:space-between;gap:14px;align-items:flex-start;border-bottom:3px solid #244c37;padding-bottom:22px}
        .design-resume-kicker {font-size:11px;font-weight:700;color:#416c52;letter-spacing:.16em;text-transform:uppercase}
        .design-resume-page h1 {font-size:34px;letter-spacing:-.045em;line-height:1.1;margin:9px 0}
        .design-resume-page h2 {color:#245039;font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin:26px 0 10px}
        .design-resume-page h3 {font-size:15px;margin:14px 0 4px}
        .design-resume-page p,.design-resume-page li {font-size:13px;line-height:1.62}
        .design-resume-page p {margin:6px 0}
        .design-resume-page a {color:#245039;overflow-wrap:anywhere}
        .design-resume-meta {font-size:12px;line-height:1.9}
        .design-resume-role {font-size:15px;font-weight:600;color:#496955}
        .design-resume-section {border-bottom:1px solid #e1e8e2;padding-bottom:12px}
        .design-resume-page ul {margin:7px 0 0;padding-left:19px}
        .design-resume-toolbar {display:flex;justify-content:space-between;gap:12px;max-width:820px;margin:0 auto 13px;align-items:center;font-size:12px;color:#45614e}
        .design-resume-toolbar button{background:#244c37;color:white;border:0;border-radius:6px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:7px}
        .design-resume-footer {font-size:11px;color:#607162;margin-top:25px}
        @media(max-width:560px){.design-resume-sheet{padding:28px 22px}.design-resume-page h1{font-size:27px}.design-resume-top{display:block}.design-resume-meta{margin-top:15px}.design-resume-page{padding:20px 10px}}
        @media print {.design-resume-page{background:white;padding:0}.design-resume-sheet{max-width:none;box-shadow:none;padding:22px 32px}.design-resume-toolbar{display:none}.design-resume-page h2{margin-top:17px}.design-resume-page p,.design-resume-page li{font-size:12px}}
      `}</style>
      <div className="design-resume-toolbar"><span>Graphic Designer CV · Online and printable</span><button type="button" onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</button></div>
      <article className="design-resume-sheet">
        <header className="design-resume-top">
          <div>
            <div className="design-resume-kicker">Visual Communication / Creative Design</div>
            <h1>Oluwaseun Favour<br/>Oyediran</h1>
            <div className="design-resume-role">Graphic Designer</div>
          </div>
          <div className="design-resume-meta">
            Lagos, Nigeria<br/>
            <a href="mailto:oluwaseunoyediran641@gmail.com">oluwaseunoyediran641@gmail.com</a><br/>
            <a href="tel:+2347073754496">+234 707 375 4496</a><br/>
            <a href="https://myportfoliosheun.vercel.app/designs/" target="_blank" rel="noreferrer">View design portfolio <ArrowUpRight size={12}/></a>
          </div>
        </header>
        <section className="design-resume-section"><h2>Profile</h2>
          <p>Graphic designer with over three years of hands-on experience creating compelling visuals for events, social campaigns, university organisations and digital products. Skilled at translating briefs into clear layouts, strong visual hierarchy and consistent brand communication. Experienced collaborating with teams, responding to feedback and delivering promotional materials to deadlines.</p>
        </section>
        <section className="design-resume-section"><h2>Design Toolkit & Skills</h2>
          <p><strong>Primary design tools:</strong> Adobe Photoshop, Canva. <strong>Additional tool:</strong> Figma (occasional use).</p>
          <p><strong>Specialties:</strong> Social media graphics, carousels, flyers and posters, campaign materials, brand visuals, thumbnails, presentation slides, typography, layout, colour and composition.</p>
          <p><strong>Collaboration:</strong> Design briefs, client communication, feedback incorporation, file formats and digital publishing requirements.</p>
        </section>
        <section className="design-resume-section"><h2>Selected Experience</h2>
          <h3>Media & Graphics Co-Head · Nigerian Economic Discourse (NED 10.0)</h3>
          <p><em>October 2026 – Present</em></p>
          <ul><li>Co-lead media and graphics for a large university economics event, including promotional flyers, social media carousels, theme-reveal visuals and merchandise concepts.</li><li>Maintain consistency across campaign materials and coordinate creative feedback.</li></ul>
          <h3>Graphic Design & Publicity Projects · University, Church & Community Initiatives</h3>
          <p><em>2023 – Present</em></p>
          <ul><li>Create flyers, posters, social media graphics and presentation materials tailored to audiences and formats.</li><li>Organise content into readable layouts and refine designs following stakeholder review.</li></ul>
          <h3>Student Election Communication · NESA & SOSSA, University of Lagos</h3>
          <p><em>2026</em></p>
          <ul><li>Designed election announcements, registration countdowns, eligibility notices and related communication visuals.</li></ul>
          <h3>Founder · D-HUB (Creative & Technical Projects)</h3>
          <p><em>2024 – Present</em></p>
          <ul><li>Coordinate client requirements and combine visual design with website and digital product development.</li></ul>
        </section>
        <section className="design-resume-section"><h2>Education</h2>
          <p><strong>University of Lagos</strong> — B.Sc. Economics (in progress)</p>
        </section>
        <section><h2>Portfolio</h2>
          <p><a href="https://myportfoliosheun.vercel.app/designs/">myportfoliosheun.vercel.app/designs/</a></p>
          <p><a href="https://myportfoliosheun.vercel.app/">myportfoliosheun.vercel.app</a></p>
        </section>
        <p className="design-resume-footer">Current version: November 2026 · Detailed work examples and visual samples are available in the linked design portfolio.</p>
      </article>
    </main>
  );
}
