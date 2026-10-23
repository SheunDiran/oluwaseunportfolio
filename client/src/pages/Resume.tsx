import { ArrowDownToLine, ArrowLeft, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

export default function Resume() {
  return (
    <div className="resume-page">
      <div className="resume-container">
        <div className="resume-nav-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <a className="resume-back" href="/"><ArrowLeft size={16} /> Back to Portfolio</a>
          <a
            className="resume-download-btn"
            href="/oluwaseun-oyediran-resume.pdf"
            download="Oluwaseun-Oyediran-Resume.pdf"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#101914",
              color: "#d7f467",
              padding: "10px 18px",
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            <ArrowDownToLine size={15} /> Download PDF CV
          </a>
        </div>

        <div className="resume-header">
          <img src="/images/about-sheun-portrait.jpeg" alt="Oyediran Oluwaseun" />
          <div style={{ flex: 1 }}>
            <h1>OYEDIRAN OLUWASEUN</h1>
            <p style={{ color: "#198754", fontWeight: 600, fontSize: "16px", marginTop: "4px" }}>
              Python Full-Stack Developer · Technical Instructor · Founder of Diran Hub
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "10px", fontSize: "14px", color: "#666" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><MapPin size={14} color="#198754" /> Lagos, Nigeria</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Phone size={14} color="#198754" /> +234-707-375-4496</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Mail size={14} color="#198754" /> oluwaseunoyediran641@gmail.com</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px", fontSize: "13px" }}>
              <a href="https://www.linkedin.com/in/oluwaseun-oyediran-65bb43326/" target="_blank" rel="noreferrer" style={{ color: "#198754", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                LinkedIn <ExternalLink size={12} />
              </a>
              <a href="https://wa.me/2347073754496?text=Hi%20Sheun%2C%20I%20found%20your%20portfolio%20and%20would%20love%20to%20talk." target="_blank" rel="noreferrer" style={{ color: "#198754", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                WhatsApp <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        <section>
          <h2>Professional Summary</h2>
          <p>
            Python full-stack web developer and technical instructor skilled in Python, Flask, JavaScript, and React.js.
            Demonstrated track record of designing and deploying scalable, user-centric web applications, including real-time
            logistics tracking software, commercial portals, and interactive educational platforms. Founder of Diran Hub,
            combining hands-on software development with teaching over 30+ learners to bridge technical theory and production practice.
          </p>
        </section>

        <section>
          <h2>Technical Capabilities & Tooling</h2>
          <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
            <p style={{ margin: 0 }}><strong>Frontend:</strong> JavaScript (ES6+), React.js, HTML5, CSS3, Tailwind CSS, Responsive Web Architecture</p>
            <p style={{ margin: 0 }}><strong>Backend &amp; Databases:</strong> Python, Flask, RESTful APIs, MySQL, Database Modeling, Session &amp; JWT Auth, Role-Based Access Control (RBAC)</p>
            <p style={{ margin: 0 }}><strong>Tools &amp; DevOps:</strong> Git, GitHub, Linux / Bash, Postman, Figma, PythonAnywhere, Cloud Deployment</p>
            <p style={{ margin: 0 }}><strong>Pedagogy &amp; Leadership:</strong> Technical Instruction, Curriculum Development, Code Review, Mentorship, Public Speaking</p>
          </div>
          <div className="resume-tags">
            <span>Python / Flask</span>
            <span>JavaScript</span>
            <span>React.js</span>
            <span>HTML5 / CSS3</span>
            <span>MySQL</span>
            <span>REST APIs</span>
            <span>Git / GitHub</span>
            <span>Product Design</span>
            <span>Technical Training</span>
          </div>
        </section>

        <section>
          <h2>Experience & Leadership</h2>
          <div style={{ display: "grid", gap: "24px" }}>
            <article>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#101914" }}>Founder &amp; Product Engineer</h3>
                <span style={{ fontSize: "13px", color: "#198754", fontFamily: "'DM Mono', monospace" }}>2024 – PRESENT</span>
              </div>
              <p style={{ margin: "2px 0 8px", fontStyle: "italic", color: "#666", fontSize: "14px" }}>
                Diran Hub (Academy · Agency · Playground) · Lagos, Nigeria
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0, color: "#444", fontSize: "14.5px", lineHeight: "1.6" }}>
                <li>Established an engineering ecosystem providing full-stack client web applications, developer learning cohorts, and sandbox builds.</li>
                <li>Architected and shipped production web applications, guiding system design from scoping to cloud deployment.</li>
                <li>Taught and mentored cohort students through real-world software workflows and practical development milestones.</li>
              </ul>
            </article>

            <article>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#101914" }}>Lead Technical Instructor</h3>
                <span style={{ fontSize: "13px", color: "#198754", fontFamily: "'DM Mono', monospace" }}>2024 – PRESENT</span>
              </div>
              <p style={{ margin: "2px 0 8px", fontStyle: "italic", color: "#666", fontSize: "14px" }}>
                CodeCamp, ILM Nexus Academy &amp; MS Virtual Academy · Lagos, Nigeria
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0, color: "#444", fontSize: "14.5px", lineHeight: "1.6" }}>
                <li>Trained 30+ students across software development bootcamps and intensive web engineering cohorts.</li>
                <li>Delivered curriculum covering core Python programming, modern JavaScript, database management, and web architectures.</li>
                <li>Mentored students through building and deploying complete capstone applications ready for industry inspection.</li>
              </ul>
            </article>

            <article>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#101914" }}>Full-Stack Developer</h3>
                <span style={{ fontSize: "13px", color: "#198754", fontFamily: "'DM Mono', monospace" }}>APRIL 2025</span>
              </div>
              <p style={{ margin: "2px 0 8px", fontStyle: "italic", color: "#666", fontSize: "14px" }}>
                OMAK Logistics · Lagos, Nigeria
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0, color: "#444", fontSize: "14.5px", lineHeight: "1.6" }}>
                <li>Engineered and deployed a full-stack logistics web platform enabling users to create and track parcel shipments in real time.</li>
                <li>Implemented secure user authentication, role-based workflows for riders and dispatchers, and live shipment status updates.</li>
              </ul>
            </article>

            <article>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#101914" }}>Web Developer</h3>
                <span style={{ fontSize: "13px", color: "#198754", fontFamily: "'DM Mono', monospace" }}>2025</span>
              </div>
              <p style={{ margin: "2px 0 8px", fontStyle: "italic", color: "#666", fontSize: "14px" }}>
                Tectonic Global · Lagos, Nigeria
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0, color: "#444", fontSize: "14.5px", lineHeight: "1.6" }}>
                <li>Developed and deployed a multi-page web platform for a surveying enterprise, powered by Python backend services and responsive client UI.</li>
              </ul>
            </article>
          </div>
        </section>

        <section>
          <h2>Featured Projects &amp; Innovations</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "#101914" }}>
                OMAK Logistics Web Portal <span style={{ fontWeight: "normal", color: "#198754", fontSize: "13px" }}>(Full-Stack Logistics System)</span>
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                Real-time parcel dispatch, live tracking, secure rider workflows, and client shipment dashboard deployed for logistics operations.
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "#101914" }}>
                MamaGuard MVP <span style={{ fontWeight: "normal", color: "#198754", fontSize: "13px" }}>(NITHUB Hackathon Maternal Health)</span>
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                Maternal health web application built during the NITHUB Hackathon, focused on postpartum health checks and finding nearby care.
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "#101914" }}>
                Tonic Solfa Music Web App <span style={{ fontWeight: "normal", color: "#198754", fontSize: "13px" }}>(Interactive Music EdTech)</span>
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                Music learning project for finding songs and studying tonic solfa notation.
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "#101914" }}>
                D5 Rentals Booking Platform <span style={{ fontWeight: "normal", color: "#198754", fontSize: "13px" }}>(Event Equipment Booking)</span>
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                Digital booking system streamlining rental inventory, inquiries, and customer reservations for chairs, canopies, and event essentials in Lagos.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Education &amp; Credentials</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <strong style={{ fontSize: "16px", color: "#101914" }}>Certificate in Software Development</strong> — MOAT Academy, Lagos
              <p style={{ margin: "4px 0 0", color: "#555", fontSize: "14px" }}>
                Comprehensive software development training covering Python, JavaScript, relational databases, web frameworks, and production engineering practices.
              </p>
            </div>
            <div>
              <strong style={{ fontSize: "16px", color: "#101914" }}>B.Sc. in Economics</strong> — University of Lagos (UNILAG)
              <p style={{ margin: "4px 0 0", color: "#555", fontSize: "14px" }}>
                In progress. Focus on systems analysis, economic modeling, market data evaluation, and quantitative problem solving.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Community, Leadership &amp; Speaking</h2>
          <ul style={{ paddingLeft: "20px", margin: 0, color: "#444", fontSize: "14.5px", lineHeight: "1.6" }}>
            <li><strong>NESA Growth Club:</strong> Organised and facilitated career development sessions for young professionals.</li>
            <li><strong>JCI Nigeria:</strong> Active community leadership championing social impact, personal leadership, and civic responsibility.</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #e0e5e0", paddingTop: "24px", marginTop: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#777", fontFamily: "'DM Mono', monospace" }}>
              OYEDIRAN OLUWASEUN · PORTFOLIO RESUME · 2026
            </p>
            <a
              href="/oluwaseun-oyediran-resume.pdf"
              download="Oluwaseun-Oyediran-Resume.pdf"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#198754",
                color: "#ffffff",
                padding: "8px 16px",
                fontSize: "11px",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              <ArrowDownToLine size={14} /> Download PDF Version
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
