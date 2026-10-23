import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

async function generateResume() {
  const uploadedResumePath = path.join(process.cwd(), "client/public/oluwaseun-oyediran-cv.pdf");
  const downloadableResumePath = path.join(process.cwd(), "client/public/oluwaseun-oyediran-resume.pdf");
  if (fs.existsSync(uploadedResumePath)) {
    fs.copyFileSync(uploadedResumePath, downloadableResumePath);
    console.log("Using uploaded CV as the downloadable resume.");
    return;
  }

  const pdfDoc = await PDFDocument.create();
  
  // Page size: Standard Letter (612 x 792 pt)
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  // Colors (Sophisticated Dark Emerald & Slate Palette matching Sheun's portfolio)
  const primaryDark = rgb(0.06, 0.1, 0.08); // #101914
  const accentEmerald = rgb(0.1, 0.53, 0.33); // #198754
  const charcoal = rgb(0.2, 0.22, 0.21); // #333835
  const slateText = rgb(0.35, 0.38, 0.36); // #59615c
  const lightDivider = rgb(0.85, 0.88, 0.85); // #d9e0d9
  const bannerBg = rgb(0.96, 0.97, 0.95); // #f5f7f2
  
  // Try embedding user's actual photo
  let imageEmbed = null;
  const photoPath = path.join(process.cwd(), "client/public/manus-storage/myface_df9a62aa.jpeg");
  if (fs.existsSync(photoPath)) {
    try {
      const imageBytes = fs.readFileSync(photoPath);
      imageEmbed = await pdfDoc.embedJpg(imageBytes);
    } catch (e) {
      console.warn("Could not embed image:", e);
    }
  }

  // Draw Header Banner Background
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: bannerBg,
  });

  // Top accent bar
  page.drawRectangle({
    x: 0,
    y: height - 6,
    width: width,
    height: 6,
    color: accentEmerald,
  });

  // Draw Avatar / Portrait if available
  const marginX = 40;
  let textStartX = marginX;
  
  if (imageEmbed) {
    const avatarSize = 76;
    const avatarY = height - 100;
    
    // Draw border
    page.drawRectangle({
      x: marginX - 2,
      y: avatarY - 2,
      width: avatarSize + 4,
      height: avatarSize + 4,
      color: accentEmerald,
    });
    
    page.drawImage(imageEmbed, {
      x: marginX,
      y: avatarY,
      width: avatarSize,
      height: avatarSize,
    });
    
    textStartX = marginX + avatarSize + 18;
  }

  // Name & Title in Header
  page.drawText("OYEDIRAN OLUWASEUN", {
    x: textStartX,
    y: height - 42,
    size: 20,
    font: helveticaBold,
    color: primaryDark,
  });

  page.drawText("Python Full-Stack Developer  |  Technical Instructor  |  Founder of Diran Hub", {
    x: textStartX,
    y: height - 58,
    size: 10,
    font: helveticaBold,
    color: accentEmerald,
  });

  // Contact Info bar in Header
  const contactText = "Lagos, Nigeria   |   +234-707-375-4496   |   oluwaseunoyediran641@gmail.com";
  page.drawText(contactText, {
    x: textStartX,
    y: height - 74,
    size: 8.5,
    font: helvetica,
    color: slateText,
  });

  const linksText = "Portfolio: myportfoliosheun.vercel.app   |   LinkedIn: oluwaseun-oyediran-65bb43326";
  page.drawText(linksText, {
    x: textStartX,
    y: height - 88,
    size: 8.5,
    font: helvetica,
    color: slateText,
  });

  // Content Area
  let currentY = height - 138;

  function drawSectionHeading(title: string) {
    currentY -= 6;
    page.drawText(title.toUpperCase(), {
      x: marginX,
      y: currentY,
      size: 11,
      font: helveticaBold,
      color: primaryDark,
    });
    
    page.drawLine({
      start: { x: marginX, y: currentY - 4 },
      end: { x: width - marginX, y: currentY - 4 },
      thickness: 1.2,
      color: accentEmerald,
    });
    
    currentY -= 16;
  }

  // 1. PROFESSIONAL SUMMARY
  drawSectionHeading("Professional Summary");
  const summaryLines = [
    "Python Full-Stack Developer and Technical Instructor skilled in Python, Flask, JavaScript, and React.js with a strong",
    "background in architecting scalable, responsive web applications and real-time backend systems. Proven record building",
    "production platforms including logistics tracking systems, e-commerce portals, and educational tools. Founder of Diran Hub,",
    "with deep commitment to clean code, user-friendly interfaces, and training emerging software engineering talent.",
  ];
  for (const line of summaryLines) {
    page.drawText(line, {
      x: marginX,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: charcoal,
      lineHeight: 11,
    });
    currentY -= 11.5;
  }

  currentY -= 6;

  // 2. CORE SKILLS
  drawSectionHeading("Technical Capabilities & Tooling");
  const skillCategories = [
    { label: "Frontend:", items: "JavaScript (ES6+), React.js, HTML5, CSS3, Tailwind CSS, Responsive Web Architecture" },
    { label: "Backend & DB:", items: "Python, Flask, RESTful APIs, MySQL, Database Modeling, User Auth & RBAC" },
    { label: "Tools & DevOps:", items: "Git, GitHub, Linux / Bash, Postman, Figma, PythonAnywhere, Cloud Deployment" },
    { label: "Pedagogy & Soft Skills:", items: "Curriculum Design, Technical Training (30+ learners), Mentorship, Public Speaking" },
  ];

  for (const cat of skillCategories) {
    page.drawText(cat.label, {
      x: marginX,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: primaryDark,
    });
    page.drawText(cat.items, {
      x: marginX + 110,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: charcoal,
    });
    currentY -= 12;
  }

  currentY -= 6;

  // 3. WORK EXPERIENCE & LEADERSHIP
  drawSectionHeading("Experience & Professional Leadership");

  const experiences = [
    {
      role: "Founder & Product Engineer",
      org: "Diran Hub (Academy, Agency & Playground)",
      location: "Lagos, Nigeria",
      period: "2024 – Present",
      bullets: [
        "Founded and directed an engineering ecosystem spanning technical education cohorts, client digital builds, and sandbox projects.",
        "Delivered full-stack web applications for clients, overseeing architecture from initial scoping through production deployment.",
        "Led interactive training cohorts, mentoring aspiring developers in Python, web foundations, and software engineering practices.",
      ],
    },
    {
      role: "Lead Technical Instructor",
      org: "CodeCamp, ILM Nexus Academy & MS Virtual Academy",
      location: "Lagos, Nigeria",
      period: "2024 – Present",
      bullets: [
        "Delivered hands-on software development bootcamps and workshops to 30+ students across Python, JavaScript, and web technologies.",
        "Engineered real-world project assignments and guided learners from zero programming knowledge to shipping functional applications.",
      ],
    },
    {
      role: "Full-Stack Web Developer",
      org: "OMAK Logistics",
      location: "Lagos, Nigeria",
      period: "April 2025",
      bullets: [
        "Engineered a full-stack logistics web portal enabling clients to create shipments and track parcels in real time.",
        "Built responsive parcel dispatch and rider interfaces, role-based authentication, and live status progress tracking.",
      ],
    },
    {
      role: "Web Developer",
      org: "Tectonic Global",
      location: "Lagos, Nigeria",
      period: "2025",
      bullets: [
        "Architected and deployed a multi-page web platform for a surveying firm, engineered with a Python backend and responsive UI.",
      ],
    },
  ];

  for (const exp of experiences) {
    // Role line
    page.drawText(exp.role, {
      x: marginX,
      y: currentY,
      size: 9.5,
      font: helveticaBold,
      color: primaryDark,
    });
    
    // Period on right
    const periodWidth = helveticaBold.widthOfTextAtSize(exp.period, 8.5);
    page.drawText(exp.period, {
      x: width - marginX - periodWidth,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: accentEmerald,
    });

    currentY -= 11;

    // Org line
    page.drawText(`${exp.org}  ·  ${exp.location}`, {
      x: marginX,
      y: currentY,
      size: 8.5,
      font: helveticaOblique,
      color: slateText,
    });

    currentY -= 11;

    // Bullets
    for (const b of exp.bullets) {
      page.drawCircle({
        x: marginX + 4,
        y: currentY + 2.5,
        size: 1.5,
        color: accentEmerald,
      });
      page.drawText(b, {
        x: marginX + 12,
        y: currentY,
        size: 8,
        font: helvetica,
        color: charcoal,
      });
      currentY -= 10.5;
    }

    currentY -= 3;
  }

  // 4. SELECTED PROJECTS
  drawSectionHeading("Featured Projects & Innovations");

  const projects = [
    {
      name: "Tonic Solfa Music Web App",
      stack: "Python, Flask, JavaScript, Music Notation",
      desc: "Music learning website allowing users to search, add songs, and access tonic solfa notation.",
    },
    {
      name: "MamaGuard Maternal Health MVP",
      stack: "React, Python, Health Tech",
      desc: "Postpartum health MVP created for the NITHUB Hackathon, with daily check-ins and nearby care discovery.",
    },
    {
      name: "D5 Rentals Booking Portal",
      stack: "JavaScript, Responsive UI, Event Management",
      desc: "Online equipment reservation platform for tables, canopies, and event rental logistics in Lagos.",
    },
  ];

  for (const proj of projects) {
    page.drawText(proj.name, {
      x: marginX,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: primaryDark,
    });
    page.drawText(` (${proj.stack})`, {
      x: marginX + helveticaBold.widthOfTextAtSize(proj.name, 8.5),
      y: currentY,
      size: 8,
      font: helveticaOblique,
      color: accentEmerald,
    });
    currentY -= 10;
    page.drawText(proj.desc, {
      x: marginX + 10,
      y: currentY,
      size: 8,
      font: helvetica,
      color: charcoal,
    });
    currentY -= 11;
  }

  currentY -= 3;

  // 5. EDUCATION & CERTIFICATIONS
  drawSectionHeading("Education & Certifications");

  const eduItems = [
    {
      title: "Certificate in Software Development",
      school: "MOAT Academy",
      detail: "Intensive full-stack software development curriculum covering Python, JavaScript, databases, and engineering best practices.",
    },
    {
      title: "Bachelor of Science (B.Sc.) in Economics",
      school: "University of Lagos (UNILAG)",
      detail: "In progress. Analytical systems, statistical data analysis, market dynamics, and quantitative decision making.",
    },
  ];

  for (const edu of eduItems) {
    page.drawText(`${edu.title} — ${edu.school}`, {
      x: marginX,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: primaryDark,
    });
    currentY -= 10;
    page.drawText(edu.detail, {
      x: marginX + 10,
      y: currentY,
      size: 8,
      font: helvetica,
      color: charcoal,
    });
    currentY -= 11.5;
  }

  // Footer bar
  page.drawLine({
    start: { x: marginX, y: 24 },
    end: { x: width - marginX, y: 24 },
    thickness: 0.75,
    color: lightDivider,
  });

  page.drawText("Oyediran Oluwaseun  ·  Curriculum Vitae / Resume  ·  Lagos, Nigeria", {
    x: marginX,
    y: 13,
    size: 7.5,
    font: helvetica,
    color: slateText,
  });

  const pageNumText = "Page 1 of 1";
  page.drawText(pageNumText, {
    x: width - marginX - helvetica.widthOfTextAtSize(pageNumText, 7.5),
    y: 13,
    size: 7.5,
    font: helvetica,
    color: slateText,
  });

  const pdfBytes = await pdfDoc.save();
  
  // Save to client/public and dist/public
  const destPath1 = path.join(process.cwd(), "client/public/oluwaseun-oyediran-resume.pdf");
  fs.writeFileSync(destPath1, pdfBytes);
  console.log("Wrote to", destPath1);

  const distDir = path.join(process.cwd(), "dist/public");
  if (fs.existsSync(distDir)) {
    const destPath2 = path.join(distDir, "oluwaseun-oyediran-resume.pdf");
    fs.writeFileSync(destPath2, pdfBytes);
    console.log("Wrote to", destPath2);
  }
}

generateResume().catch(console.error);
