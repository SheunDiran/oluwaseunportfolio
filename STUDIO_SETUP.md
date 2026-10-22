# Owner studio activation

The new `/admin` studio uses a server-verified password and an HttpOnly cookie. The owner sees no GitHub configuration. Designs can be added with repeated forms or multiple file selection, then published together. Titles are required; descriptions and tags are optional.

## One-time private setup

In the Vercel project serving `myportfoliosheun.vercel.app`, configure these Production environment variables as **Secrets**:

- `STUDIO_PASSWORD`: choose a strong, unique passphrase of at least 12 characters. This is the password used at `/admin`.
- `STUDIO_GITHUB_TOKEN`: a fine-grained GitHub token scoped only to `SheunDiran/oluwaseunportfolio`, with Contents read/write permission. Storage runs on the server; this token is never sent to the browser.

Never use a `VITE_` prefix for either secret. Do not paste secret values into chat or commit them. Updating the password invalidates existing owner sessions.

After setup, merge the studio branch into `main` and deploy that commit in the existing Vercel project. The new API is `/api/studio`. Before setup it fails closed and displays a setup-pending message; it does not let visitors create an owner account.

## Verify activation

1. Open `/admin`. Log in with the owner password.
2. Add one actual design with a title and no description. Publish it.
3. Confirm it appears in the saved-work panel, then on `/designs/` after deployment completes.
4. Select multiple designs or click Add another design to build a batch. Each design has independent fields.
5. Add approved feedback in the testimonial form.
6. Log out. The public gallery must no longer show Add pictures. A private/incognito window must also hide that button.

Uploads are saved persistently in the repository by the server. A batch updates the gallery and image references in one commit and preserves the latest archive. Concurrent updates are rejected rather than overwritten. Public gallery updates depend on the existing automatic deployment from `main`.

Images larger than 2.5 MB are optimised in the browser to stay below server request limits, preserving their full aspect ratio. Original local files remain untouched. Failed batches retain their forms so they can be retried.

Validation completed: TypeScript check, Vite production build, six server tests covering private setup, wrong passwords, cookie authentication, forged sessions, cross-origin requests, multi-design publication and forged image tickets. Real production sign-in/upload verification requires the private setup above.
