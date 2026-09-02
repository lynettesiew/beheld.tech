# beheld.tech

Landing page for **BeHeld** — we find the people already looking for what you
sell, tell you which path to try first, and run it with you. The first
Blueprint is free.

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
    ├── js/main.js          # the hero's rotating clause (~35 lines; the only JS)
    └── img/
        ├── favicon.svg
        ├── apple-touch-icon.png
        └── og-image.png    # 1200×630 social preview
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Python's server does not serve `404.html`
for missing paths the way GitHub Pages does — open `/404.html` directly to
check that page.)

## Page order

Hero → your Blueprint → contrast → how it works → you approve everything →
every run teaches the next → findings so far → what this costs you → is this
for you → FAQ → close.

**Pricing is currently hidden.** The packages section sat between "what this
costs you" and "is this for you". It was removed rather than commented out, so
that no price sits in the page source for a crawler to find, and it is kept in
git instead: `git show 9342ec7:index.html`. Hiding it also meant taking the
price out of the nav, step 4 of "how it works", the closing paragraph and the
four meta descriptions, and swapping the band backgrounds on "is this for you"
and the FAQ so the alternation still holds. The `.pkg`, `.promise` and `.pkgs`
rules stay in the stylesheet, dormant.

Two sections carry the weight the old page missed. **Every run teaches the
next** (the dark band) absorbed the old verdicts strip, because five verdicts
listed on their own never said what happens to the verdict; the loop that
spends it does. **What this costs you** sits immediately above the prices so
that $1,200 lands against 30 minutes a week and the cost of a first sales
hire, rather than against nothing.

The prices moved down, behind the approval mechanism and the pilot findings.
A reader used to meet $6,000 at section six, before any evidence. The trust
strip came out entirely: three hand-counted numbers at the top of the page
start an argument about scale, which is the one argument a pilot cannot win.

"How it works" carries a fourth step (`.step--run`, the only one in the brand
colour) on purpose: with three steps the journey ended at a document, and
readers concluded the Blueprint *was* the product. The hero now says the same
thing again on its own line (`.hero__run`).

Backgrounds alternate paper / band down the page, with the loop section and
the closing CTA as the two dark beats.

## Responsive approach

Desktop-first. The base rules in `assets/css/styles.css` **are** the desktop
design; every media query is `max-width` and only scales things down. Most
sections reflow on their own through `repeat(auto-fit, minmax(…))` and need no
breakpoint at all. The explicit ones, each sitting with the component it
belongs to:

| Breakpoint | What changes |
| --- | --- |
| `≤1100px` | Hero stacks: the Blueprint card drops below the headline |
| `≤1000px` | Closing CTA stacks |
| `≤940px` | Trust strip — the numeral moves above its sentence so three facts stay on one row |
| `≤880px` | "You approve everything" stacks the chat mock above the checklist |
| `≤860px` | Nav links give way to the CTA |
| `≤900px` | Packages table stacks **by attribute**, not by plan — see below |
| `≤760px` | Contrast table stacks; the column headings hide and each cell grows its own Elsewhere/BeHeld label |
| `≤520px` | Blueprint card rows stack label over text |
| `≤400px` | Small phones — nav wordmark and CTA tighten |

To change the desktop design, edit the base rules.

## Editing

- **Copy and layout** → `index.html`
- **Colors, type, spacing** → the `:root` variables at the top of `assets/css/styles.css`
- **The rotating hero clause** → `assets/js/main.js`

### Numbers you edit by hand

The findings cards and the `$70,000` figure in **what this costs you** are
plain text. Nothing is wired to a data source, on purpose. Update them as the
numbers change, and **never round up**: they only work while they are
literally true. The salary figure carries its basis in a `.src` line directly
underneath, because a sourced number survives an argument and a bare one does
not. Localise both if you sell outside the US.

While pricing is hidden, no price should appear anywhere on the page. This
should return nothing:

```bash
grep -n '1,200\|\$900\|6,000' index.html
```

When it comes back, prices appear in four places and must agree: the
`<title>`, the meta and OG descriptions, the package cards (`.pkg__price`),
and the closing paragraph.

### The package cards (currently hidden)

`.pkg` replaced a real `<table>`, which reverses an earlier decision, so the
reasoning is worth keeping. The table was right that the plans need **one
shared schema** and it made "your time" comparable across all three. It was
wrong about what it cost to read: six rows of prose asked a first-time visitor
to scan a grid before they knew what any plan was, and the founder one-pager,
which is three cards of short bullets, was consistently read faster.

The cards keep the schema informally: each is **six lines in the same order** —
what it is, the work, your time, what you get, what happens if it stops, what
you keep. If you add a fact to one plan, add the line to all three, even when
the answer is the same, and keep the order. Lines stay under about ten words;
anything longer belongs in the FAQ.

`.pkg--pick` is the recommended plan, carrying the ink border and the gold
offset shadow. Only one card gets it.

The grid is `repeat(auto-fit, minmax(280px, 1fr))`, so the cards reflow on
their own and the layout needs no breakpoint of its own.

### Anonymization

The hero Blueprint card and the findings cards describe real pilots. Product
category and role only — never a person's name, never a company name.

### Headlines

`h1` and `h2` are set for sentence-length headlines: the type scale is a
`clamp()` that stays readable at full-sentence length. For anything unusually
long, cap the measure inline (`style="max-width:20em"`) rather than dropping
the size.

### The rotating hero clause

`main.js` rotates the clause inside the line that sits **above** the `h1`:
*"Everyone tells you to hire an SDR / buy a lead list / run ads / post on
LinkedIn / do it all yourself."* Five phrases, 4.2 seconds each, with a 400ms
fade that must stay in step with `.rotator`'s `transition` in the stylesheet:
change one, change the other. The phrases are lower case because they sit
inside a sentence now, and the frame puts the doubt on the advice rather than
on the reader.

It sits above the headline on purpose. Motion beats size for attention, so the
moving element has to pose the problem the headline answers; below the `h1` it
competed with it instead.

It **loops for as long as the page is open**. An earlier version ran one pass
and stopped, on the reasoning that permanent motion competes with the headline
and the CTA. In practice a line that freezes after twenty seconds reads as
broken rather than as restraint, and the five alternatives it names are the
argument the section is making, so a visitor who arrives late should still see
them.

It is decorative, and it degrades on purpose. The markup ships with the last
phrase already in the DOM, so with JavaScript off the line still reads
"Everyone tells you to do it all yourself." The script also does nothing under
`prefers-reduced-motion: reduce`, leaving that same static phrase. **If macOS
"Reduce motion" is on, you will never see it move** — that is correct
behaviour, not a bug.

### The Tally form

Every CTA points at `https://tally.so/r/QK9bQG` — the nav button and three
buttons down the page, all reading "Get your free Blueprint".

```bash
grep -c 'tally.so/r/QK9bQG' index.html   # expect 4
```

There is no hero input on the page any more, so nothing populates Tally's
`initial_ask` hidden field automatically. For links written by hand (a QR
code, an email, a social bio) the parameter still works and needs an actual
value — `?initial_ask` on its own carries nothing:

```
https://tally.so/r/QK9bQG?initial_ask=get%20my%20first%20ten%20customers
```

Open that URL to check the wiring. Question 1 should already contain the text;
if it doesn't, the hidden field isn't connected to that question's **Default
answer** in Tally yet.

## Cache busting — read before you deploy a style change

GitHub Pages serves everything with `Cache-Control: max-age=600`, and this site
has no build step, so asset filenames never change on their own. That means a
returning visitor can load **new HTML against an old stylesheet** — which looks
like the site is broken rather than cached.

So: **whenever you change `styles.css` or `main.js`, bump the `?v=` number** on
every reference to it.

- `index.html` — two references (the stylesheet and the script)
- `404.html` — one reference (the stylesheet)

```bash
grep -rn "?v=" index.html 404.html
```

Currently at `v=20`. After a bump, the first 10 minutes still serve some
visitors cached HTML pointing at the old URL; after that everyone is
guaranteed a matched pair.

## Deploying (GitHub Pages)

1. Repo **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
2. `CNAME` already sets the custom domain to `beheld.tech`.
3. At your DNS provider, point the apex `A` records at GitHub Pages
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   and `www` as a `CNAME` to `lynettesiew.github.io`.
4. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate is issued.

Any other static host (Netlify, Vercel, Cloudflare Pages) works too — publish directory is
the repo root, build command is empty.
