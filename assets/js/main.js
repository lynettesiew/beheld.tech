/* beheld.tech — the page has one moving part: the question above the headline.
   It is decorative, not interactive. Everything else is static HTML and CSS.

   The markup ships with the last phrase already in place, so with JavaScript
   off, or with reduced motion asked for, the line still reads
   "Everyone tells you to do it all yourself." and nothing is missing. */

const rotator = document.getElementById('rotator');

// Lower case: the phrases sit inside the sentence "Everyone tells you to …",
// so the doubt lands on the advice rather than on the reader.
const PHRASES = [
  'hire an SDR',
  'buy a lead list',
  'run ads',
  'post on LinkedIn',
  'do it all yourself',
];

const HOLD = 4200;  // how long each phrase stays
const FADE = 400;   // must match .rotator's transition duration in the CSS

const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');

if (rotator && !stillness.matches) {
  // Start on the phrase already in the DOM so the first swap is a change,
  // not a repeat.
  let i = PHRASES.indexOf(rotator.textContent.trim());
  if (i < 0) i = PHRASES.length - 1;

  // One pass through the list, then it rests on the phrase it started with.
  // A permanent loop would compete with the headline and the call to action
  // for as long as anyone stayed on the page — the motion has a point to
  // make, and once it has made it, it should stop.
  let remaining = PHRASES.length;

  const timer = setInterval(() => {
    rotator.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % PHRASES.length;
      rotator.textContent = PHRASES[i];
      rotator.classList.remove('is-out');
    }, FADE);

    if (--remaining === 0) clearInterval(timer);
  }, HOLD);
}
