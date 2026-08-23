/* beheld.tech — the page has one interaction: the hero ask input.
   Everything else is static HTML and CSS.

   The form itself is a real <form method="get">, so it works with
   JavaScript disabled — the browser builds ?initial_ask=… and URL-encodes
   the value on its own. Everything below is enhancement. */

const ask = document.getElementById('ask');
const field = document.getElementById('initial_ask');

if (ask && field) {
  // The arrow turns berry once there is something to send.
  field.addEventListener('input', () => {
    ask.classList.toggle('filled', field.value.trim().length > 0);
  });

  // Trim on the way out. No validation message: v4 promises that starting
  // costs nothing, and an error state is a cost. Empty submits go through.
  ask.addEventListener('submit', () => {
    field.value = field.value.trim();
  });

  // Carry what she typed at the top down to whichever button she clicks.
  // Without this, someone who types in the hero, reads the page, and clicks
  // the closing button watches their own sentence disappear.
  document.querySelectorAll('a.cta, a.nav-cta').forEach(link => {
    link.addEventListener('click', () => {
      const value = field.value.trim();
      if (value) {
        link.href = link.href.split('?')[0] + '?initial_ask=' + encodeURIComponent(value);
      }
    });
  });
}
