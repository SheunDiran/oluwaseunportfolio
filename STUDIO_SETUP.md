# Owner studio

The studio at `/admin` uses your private owner password. Publishing pictures and testimonials does not use GitHub credentials, commits, or redeployments.

In the Vercel project serving myportfoliosheun.vercel.app:

1. Settings → Environment Variables: set `STUDIO_PASSWORD` to a unique passphrase of at least 12 characters, for Production.
2. Storage → Create Database → Blob → Private. Connect the store to this project for Production. Current Blob integrations supply storage identity and authentication automatically; no token needs to be copied into the studio.
3. Redeploy once after connecting storage or changing environment settings.

Sign in at `/admin`, choose multiple pictures or Add another design, enter titles, and Publish. Descriptions are optional. New designs and testimonials appear immediately when the gallery is reopened. Public visitors cannot publish. Updating the password invalidates existing owner sessions.

Images are private in storage and served through the public artwork endpoint; only artwork paths are accessible there. Metadata remains server-only. Every batch uses a separate immutable object, preserving concurrent uploads. Failed forms remain available to retry. Existing bundled portfolio items remain visible.
