# beheld.tech

Landing page for **BeHeld** — an always-on customer finder for early-stage
founders. It works out who might buy what they made, finds the actual people,
tries a few ways of reaching them, and reports on Thursday which one worked.
Places are opening a few at a time, through a waitlist.

Static site: no build step, no dependencies, and **one script**: the scan in
the hero (`assets/js/scan.js`). Open `index.html` and everything else works.

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
    ├── js/scan.js          # the scan in the hero, the only script
    └── img/
        ├── favicon.svg
        ├── apple-touch-icon.png
        └── og-waitlist.png           # 1200×630 social preview
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Python's server does not serve `404.html`
for missing paths the way GitHub Pages does — open `/404.html` directly to
check that page.)

## Page order

Hero (with the scan) → the scan result, hidden until there is one → what you get → the page they land on → a round inside → questions →
close.

Five sections, and a reader can finish the page in four screens. That is the
point: the earlier version explained the process, and the process is not what
a founder is buying. They are buying not having to be the salesperson.

Backgrounds alternate paper / band down the page, with the closing CTA as the
one dark beat.

## One script: the scan

The hero's form is the BeHeld scan. A visitor pastes their website;
`assets/js/scan.js` sends it to `POST https://api.beheld.tech/scan`, reads
`GET /scan/:id/summary` every 3 seconds with the three progress steps showing,
and, when it finishes, puts the scan card in the form's place: four tabs in
the "Your week" card's style (What you sell, Who buys, Who’s out there,
Where to start), with the "Your week" card hidden until "Scan another site". The blocks, their
order and their wording follow the working page at
<https://api.beheld.tech/scan>; change that page and this one together.

- **The id and the open tab go in the address** (`#scan=<id>&tab=buys`), so
  a reload or a shared link shows the same result, on the same tab, without
  a new scan. Tabs: `sell`, `buys`, `out-there`, `start`.
- **Everything the page changes on its own is announced** through one polite
  live region (`#scan-live`): the result arriving, a pick, the email sent, a
  failure.
- **"Get the full picture"** posts the visitor's email to
  `POST /scan/:id/interest`. The first address on a scan is the one kept.
- **Everything the scan wrote goes on the page as text**, never as HTML: it is
  model output about somebody else's website. Keep it that way.
- **No other scripts.** No analytics, no pixels, no cookies, nothing loaded
  from a third party. Fonts from Google are the only outside request.
- **Without scripts** the form still works: it opens the scan page on
  api.beheld.tech with the address filled in the URL.
- **The server only answers this page from `https://beheld.tech` and
  `https://www.beheld.tech`** (and from itself, for the preview at
  `https://api.beheld.tech/preview/`). Any other host needs adding to the
  bridge's list first.

The two other interactive pieces are still HTML and CSS only:

- **The weekly report card** in the hero is a **radio group**. Four
  `<input type="radio" name="week">` elements sit before the tabs and the
  panels so `:checked ~` sibling selectors can light the right label and
  reveal the right panel. The inputs are visually hidden but still focusable,
  so the card is keyboard-navigable with the arrow keys.
- **The FAQ** is `<details>` / `<summary>`. The browser handles the open
  state, the keyboard and the semantics; the stylesheet only hides the default
  marker and rotates the chevron.

### Wording on this page

No exclamation marks, no long dashes, and the word "free" does not appear.
The scan's own text is held to the same rule by the bridge (it rewrites a
sentence that breaks it). This should return nothing:

```bash
grep -n -i -w 'free' index.html assets/js/scan.js; grep -n '—' index.html assets/js/scan.js
```

## Editing

- **Copy and layout** → `index.html`
- **Colors, type, spacing** → the `:root` variables at the top of `assets/css/styles.css`

### The round inside

The table is currently **an example**, not a real run. Nothing in it is
sourced, so nothing in it names a real company. Each customer type has two
rows, one outbound and one inbound, so the two can be read against each other.

When a real round produces data, three things change together, and doing one
without the others is how the page starts lying:

1. Replace the numbers in the six rows with the real ones. **Never round up.**
2. Change the eyebrow from `A round inside` to name the founder or the round.
3. Change the hero's second button from `See a round` to match.

The line under the table promises that each row in a real report links out to
where its tactic came from. That promise rests on an evidence rule worth
keeping straight, because it is easy to overclaim here:

- **What a company visibly does** — content, events, job posts, partnerships —
  is observable and linkable. It says nothing about what that route produced.
- **What a founder says won them customers** — a post, an interview, a launch
  write-up — is quotable and linkable. It is evidence that they said it.
- **Connecting a route to an outcome** is inference. It is never presented as
  fact, on the page or in a report.

"Company X did Y and it worked" is not sourceable and must not appear.

### Price

**No price appears in this page.** The packages section was deleted rather
than commented out for exactly this reason, and is kept in git instead:
`git show 9342ec7:index.html`.

The redesign follows the same rule. The copy spec included a "What does it
cost?" answer with a figure in it, but the figure was unconfirmed and this
repo is public — and the repo root is the published site root, so this file is
served too. The whole question was left out rather than shipped as a guess.
Add it back once the price is settled; the FAQ is a list of `<details>`, so it
is one block wherever you want it.

This should return nothing:

```bash
grep -n '750\|1,200\|\$900\|6,000' index.html
```

### The Tally form

Every "Get on the list" points at `https://tally.so/r/QK9bQG`: the nav
button, the link under the scan's "Get the full picture" card, the closing
button and the footer. The hero's main action is the scan now.

```bash
grep -c 'tally.so/r/QK9bQG' index.html   # expect 4
```

The `initial_ask` hidden field still works for links written by hand (a QR
code, an email, a social bio) and needs an actual value — `?initial_ask` on
its own carries nothing:

```
https://tally.so/r/QK9bQG?initial_ask=get%20my%20first%20ten%20customers
```

### The social preview image

`assets/img/og-waitlist.png` is what Slack, LinkedIn and iMessage show
when someone pastes the link. It is a **hand-built asset, not generated from
the page**, so changing the headline in `index.html` does not change it — the
old one sat there for two positionings before anyone noticed.

It is rebuilt by rendering a 1200×630 HTML card in headless Chrome at 2x and
downscaling, which keeps the real fonts and the real palette:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --force-device-scale-factor=2 --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot=og-2x.png file://$PWD/card.html
sips -z 630 1200 og-2x.png
```

**Give it a new filename whenever the artwork changes.** Scrapers cache by
URL, so overwriting the same path leaves stale previews in circulation for
weeks. That is why the old `og-image.png` is gone rather than replaced.

After deploying, re-scrape so existing shares update:
[LinkedIn](https://www.linkedin.com/post-inspector/) ·
[Facebook](https://developers.facebook.com/tools/debug/) ·
[X](https://cards-dev.twitter.com/validator). Slack re-fetches on its own
after roughly 30 minutes.

### Headlines

`h1` and `h2` are set with `clamp()` so they stay readable at full-sentence
length. For anything unusually long, cap the measure inline
(`style="max-width:20em"`) rather than dropping the size.

### Anonymization

If the round is ever replaced with a real one, describe pilots by
product category and role only — never a person's name, never a company name,
unless that company is the *comparable* being linked to as a source.

## Responsive approach

Desktop-first. The base rules in `assets/css/styles.css` **are** the desktop
design; every media query is `max-width` and only scales things down.

| Breakpoint | What changes |
| --- | --- |
| `≤1100px` | Hero stacks: the weekly report card drops below the headline |
| `≤1000px` | "Four things" goes from four columns to two |
| `≤900px` | Questions stops being heading-left / list-right and stacks |
| `≤860px` | Nav links give way to the CTA |
| `≤820px` | Example-week rows stack |
| `≤560px` | "Four things" goes to one column |
| `≤400px` | Small phones — nav wordmark and CTA tighten |

To change the desktop design, edit the base rules.

## Cache busting — read before you deploy a style change

GitHub Pages serves everything with `Cache-Control: max-age=600`, and this
site has no build step, so asset filenames never change on their own. That
means a returning visitor can load **new HTML against an old stylesheet** —
which looks like the site is broken rather than cached.

So: **whenever you change `styles.css`, bump the `?v=` number** on every
reference to it.

- `index.html` — two references (the stylesheet, and `scan.js`: bump that one when the script changes)
- `404.html` — one reference (the stylesheet)

```bash
grep -rn "?v=" index.html 404.html
```

Currently at `v=27` for the stylesheet and `v=3` for the script. After a bump, the first 10 minutes still serve some
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
