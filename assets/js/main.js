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

  // It keeps cycling for as long as the page is open. An earlier version
  // stopped after one pass so the motion would not compete with the headline,
  // but a line that freezes after twenty seconds reads as broken rather than
  // as restraint, and the five alternatives it names are the argument.
  setInterval(() => {
    rotator.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % PHRASES.length;
      rotator.textContent = PHRASES[i];
      rotator.classList.remove('is-out');
    }, FADE);
  }, HOLD);
}
