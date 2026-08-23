# beheld.tech

Landing page for **BeHeld** — tell us where you're stuck, and we'll find the
people who can help and ask them for you.

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
    ├── js/main.js          # the hero input (~30 lines; the only JS on the page)
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
| `≤960px` | Multi-column grids stack to one column |
| `≤640px` | Phone — type scale, spacing, full-width buttons, larger tap targets; **figures swap to their redrawn narrow versions** |
| `≤520px` | Nav links give way to the CTA |
| `≤380px` | Small phones (iPhone SE) — final tightening |

To change the desktop design, edit the base rules. To change only phones, edit the
`≤640px` block.

## Editing

- **Copy and layout** → `index.html`
- **Colors, type, spacing** → the `:root` variables at the top of `assets/css/styles.css`
- **The hero input** → `assets/js/main.js`

### Headlines

There are two type scales and they are not interchangeable:

- **`h1` / `h2` on their own** — for headlines of five words or fewer
  ("We go and ask.", "Nobody should build alone."). Weight 800, very tight leading.
- **`h1.h-sentence` / `h2.h-sentence`** — for headlines that are full sentences.
  Lighter weight, looser leading, and a max-width in `em` that holds each line
  to roughly 32–38 characters.

Using the display scale on a sentence produces a wall of type; using the sentence
scale on three words makes it look undersized. Pick by length.

### The Tally form

Every CTA points at `https://tally.so/r/QK9bQG` — the nav button, the offer button
and the closing button, three places in `index.html`.

The hero input is a real `<form method="get">` aimed at the same URL, so it works
with JavaScript disabled: the browser builds `?initial_ask=…` and URL-encodes the
value itself.

**`initial_ask` is the Tally hidden field name** that pre-fills question 1. It is
case-sensitive and it is written in exactly one place — the input's `name`
attribute in `index.html`. `main.js` also appends it to the other CTAs so that
text typed in the hero travels with someone who clicks a button further down.

For links written by hand (a QR code, an email, a social bio) the parameter needs
an actual value — `?initial_ask` on its own carries nothing:

```
https://tally.so/r/QK9bQG?initial_ask=get%20my%20first%20ten%20customers
```

Open that URL to check the wiring. Question 1 should already contain the text; if
it doesn't, the hidden field isn't connected to that question's **Default answer**
in Tally yet.

### Figures

The three inline SVG diagrams are hand-authored, no library. Each is drawn twice —
`.fig-wide` and `.fig-narrow` — because a 460-unit viewBox squeezed onto a phone
drops its labels below 10px. Both sit in the DOM; the `<figure>` carries
`role="img"` and the `aria-label`, and both `<svg>`s are `aria-hidden`, so a screen
reader announces the claim once rather than twice.

## Cache busting — read before you deploy a style change

GitHub Pages serves everything with `Cache-Control: max-age=600`, and this site
has no build step, so asset filenames never change on their own. That means a
returning visitor can load **new HTML against an old stylesheet** — which looks
like the site is broken rather than cached: headings stick and overlap, the hero
input loses its frame, the screen-reader label becomes visible, and any SVG using
a newly-added CSS variable falls back to solid black.

So: **whenever you change `styles.css` or `main.js`, bump the `?v=` number** on
every reference to it.

- `index.html` — two references (the stylesheet and the script)
- `404.html` — one reference (the stylesheet)

```bash
grep -rn "?v=" index.html 404.html
```

Currently at `v=5`. After a bump, the first 10 minutes still serve some visitors
cached HTML pointing at the old URL; after that everyone is guaranteed a matched
pair.

## Deploying (GitHub Pages)

1. Repo **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
2. `CNAME` already sets the custom domain to `beheld.tech`.
3. At your DNS provider, point the apex `A` records at GitHub Pages
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   and `www` as a `CNAME` to `lynettesiew.github.io`.
4. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate is issued.

Any other static host (Netlify, Vercel, Cloudflare Pages) works too — publish directory is
the repo root, build command is empty.
