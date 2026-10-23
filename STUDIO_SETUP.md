# Portfolio studio

Open `/admin` to upload pictures, titles and optional descriptions. Choose multiple pictures or Add another design. Add, edit or remove testimonials. There is no password, login, or GitHub token requirement. Anyone who knows the admin URL can modify the portfolio; keep this tradeoff in mind when sharing links.

Uploads require persistent storage. In the existing Vercel project, connect a private Blob store for Production, then redeploy once. Vercel supplies the storage connection. No credentials are entered in the admin form. Subsequent content changes appear immediately in the gallery without commits or redeployments.

Existing artwork and testimonials are preserved. Testimonial edits and removals are stored separately and apply to both bundled and newly published feedback.

Under Saved work, Edit changes the title, description, or picture; Delete removes a design from the public gallery. Pin to top keeps a design ahead of new uploads. Set its Pin position and Save position to move it to first, second, and so on. Other pinned designs shift automatically. Unpin returns the design to its original chronological position.
