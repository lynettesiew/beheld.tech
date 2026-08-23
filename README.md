# beheld.tech

Landing page for **BeHeld** — small circles of founders, matched by what you're stuck on.

Static site: no build step, no dependencies. Open `index.html` and it works.

## Structure

```
.
├── index.html              # the landing page
├── 404.html                # not-found page (same styles)
├── CNAME                   # custom domain for GitHub Pages
├── robots.txt
├── sitemap.xml
├── .nojekyll               # serve files as-is on GitHub Pages
└── assets/
    ├── css/styles.css      # all styles
    ├── js/main.js          # the three interactive demos
    └── img/
        ├── favicon.svg
        ├── apple-touch-icon.png
        └── og-image.png    # 1200×630 social preview
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Responsive approach

Desktop-first. The base rules in `assets/css/styles.css` **are** the desktop design; every
media query is `max-width` and only scales things down. They live in one labelled block at
the bottom of the stylesheet:

| Breakpoint | What changes |
| --- | --- |
| `961–1100px` | Small laptops — tighter card padding so 3 columns still breathe |
| `≤960px` | Multi-column grids stack to one column |
| `≤640px` | Phone — type scale, spacing, full-width buttons, larger tap targets |
| `≤520px` | Nav links give way to the Apply button |
| `≤380px` | Small phones (iPhone SE) — final tightening |

To change the desktop design, edit the base rules. To change only phones, edit the
`≤640px` block.

## Editing

- **Copy and layout** → `index.html`
- **Colors, type, spacing** → the `:root` variables at the top of `assets/css/styles.css`
- **Interactive demos** → `assets/js/main.js`
  - `DATA` — the hero "what are you stuck on?" matcher
  - `HELPS` — the replies to the sample voice note
  - `MOVES` — the commitment chips
  - `CITIES` — the rotating city line

The apply button points at the Tally form: `https://tally.so/r/QK9bQG`. It appears in four
places in `index.html` and once in `assets/js/main.js`.

## Deploying (GitHub Pages)

1. Repo **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
2. `CNAME` already sets the custom domain to `beheld.tech`.
3. At your DNS provider, point the apex `A` records at GitHub Pages
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   and `www` as a `CNAME` to `lynettesiew.github.io`.
4. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate is issued.

Any other static host (Netlify, Vercel, Cloudflare Pages) works too — publish directory is
the repo root, build command is empty.
