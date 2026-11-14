# Jack & Lou Wedding Site

A single Vite multi-page site containing the thank-you gallery and the original wedding invitation.

| URL | Page | Entry point |
| --- | --- | --- |
| `/` | Thank-you page, photos and video | `index.html` → `src/main.jsx` |
| `/invite` | Original wedding invitation | `invite.html` |
| `/invite/info` | Travel, hotels and FAQs | `invite/info.html` |
| `/invite/gifts` | New home fund / gift information | `invite/gifts.html` |

The invitation preserves the original content and external RSVP, calendar, map and video links. Its info and gifts pages link back to `/invite`.

## Development

```bash
npm install
npm run dev
```

Build and preview locally:

```bash
npm run build
npm run preview
```

Open the four URLs above on the local server. The old `/info` and `/gifts` URLs (including `.html` variants) redirect to their invitation pages in development and preview too.

## Styling and assets

- The React thank-you page uses `src/gallery.css`, which imports the current `style.css`.
- The invitation uses its own original stylesheet, `invite/style.css`, and the original interactions in `main.js` (scroll reveals, parallax, fireworks and draggable photos).
- Both versions share `fonts.css` and unchanged assets in `public/`.
- The invitation's original favicon and sharing image live in `public/invite/`; the homepage retains its current versions and sharing metadata.
- The invitation's hidden visual controls still toggle with the `c` key.

## Hosting

Vite builds all four HTML entry points into `dist/`. Vercel's `cleanUrls` setting serves HTML pages without extensions and redirects `.html` requests to their clean URLs. `vercel.json` redirects the old `/info` and `/gifts` paths to `/invite/info` and `/invite/gifts`; old `.html` links are canonicalized before following those redirects.

The intended production setup is one Vercel project serving `areyadancin.com` from `main`. Before rollout, verify which Vercel project owns the domain: the local `.vercel` link may point to the separate thank-you project.

Publishing requires explicit authorization. Keep changes local until authorized to push to GitHub or deploy. Once authorized, verify a preview deployment before production and retain the thank-you branch until the combined site is verified.
