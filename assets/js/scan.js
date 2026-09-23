/* The scan in the hero. Rebuilt from the working page at
   https://api.beheld.tech/scan: the same blocks in the same order, the same
   progress steps, the same wording. It reads only GET /scan/:id/summary, the
   whitelist the bridge serves for this page.

   No analytics, no cookies, no other scripts. Everything the scan wrote is
   put on the page as text, never as HTML: it is model output about somebody
   else's website. */
(function () {
  'use strict';

  var API = 'https://api.beheld.tech';
  var ORDER = ['reading your site', 'checking public sources', 'ranking buyers'];
  var ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  var form = document.getElementById('scan-form');
  if (!form) return;
  var input = document.getElementById('scan-url');
  var btn = document.getElementById('scan-go');
  var err = document.getElementById('scan-error');
  var steps = document.getElementById('scan-steps');
  var section = document.getElementById('scan');
  var out = document.getElementById('scan-out');
  var card = document.getElementById('scan-card');
  var ask = document.getElementById('interest-form');
  var email = document.getElementById('interest-email');
  var askErr = document.getElementById('interest-error');

  var current = null;   // the scan id on show
  var run = 0;          // bumps on every new scan, so a stale poll stops
  var picked = null;    // the hypothesis the visitor said "this one" to
  var shown = null;     // the result on show

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = page(text);
    return e;
  }
  // The page carries no long dash. The bridge rewrites them out of the scan;
  // this catches any that get through.
  function page(t) { return String(t).replace(/\s*\u2014\s*/g, ', '); }
  function safeHref(u) {
    try { var x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; }
    catch (e) { return null; }
  }
  function link(u, text) {
    var h = safeHref(u);
    if (!h) return el('span', null, text || '');
    var a = el('a', null, text || h);
    a.href = h; a.rel = 'noopener noreferrer nofollow'; a.target = '_blank';
    return a;
  }
  function block(title, cls) {
    var s = el('section', 'scan-block' + (cls ? ' ' + cls : ''));
    if (title) s.appendChild(el('h3', null, title));
    out.appendChild(s);
    return s;
  }
  function showError(msg) { err.textContent = msg; err.hidden = false; }
  function busy(on) { btn.disabled = on; input.disabled = on; }
  function setStep(name) {
    var at = ORDER.indexOf(name);
    Array.prototype.forEach.call(steps.children, function (li, i) {
      li.className = at < 0 ? '' : (i < at ? 'done' : (i === at ? 'now' : ''));
    });
  }
  function stepsDone() {
    Array.prototype.forEach.call(steps.children, function (li) { li.className = 'done'; });
  }

  // ------------------------------------------------------------ the blocks
  function buyerLine(i) {
    var parts = [i.role_title, i.company_type].filter(Boolean).join(' at ');
    var extra = [i.headcount, i.geo].filter(Boolean).join(', ');
    return extra ? parts + ' (' + extra + ')' : parts;
  }
  function renderSummary(r) {
    block('What you sell').appendChild(el('p', null, r.summary || ''));
  }
  function renderSignals(r) {
    // A demo signal counts toward no buyer and is not shown.
    var sigs = (r.signals || []).filter(function (g) { return g.counts_toward_icp !== false; });
    var s = block('What we found');
    if (!sigs.length) { s.appendChild(el('p', 'scan-aside', 'Nothing we could count this time.')); return; }
    var ul = el('ul', 'scan-signals');
    sigs.forEach(function (g) {
      var li = el('li');
      li.appendChild(document.createTextNode(page(g.claim) + ' '));
      var src = el('span', 'scan-src');
      src.appendChild(link(g.source_url, 'source'));
      li.appendChild(src);
      ul.appendChild(li);
    });
    s.appendChild(ul);
  }
  // The case against, under the primary buyer or the first hypothesis only.
  function caseAgainst(parent, x) {
    if (!x || !x.case_against) return;
    var c = el('p', 'scan-against');
    c.appendChild(el('span', 'scan-label', 'The case against: '));
    c.appendChild(document.createTextNode(page(x.case_against)));
    parent.appendChild(c);
    parent.appendChild(el('p', 'scan-aside', 'The full argument, and what it means for how many to contact, is in your report.'));
  }
  function renderBuyers(r) {
    var icps = r.icps || [];
    var p = icps[0];
    if (p) {
      var b = block('Your likeliest buyer');
      b.appendChild(el('p', 'scan-buyer', buyerLine(p)));
      if (p.why) b.appendChild(el('p', null, p.why));
      b.appendChild(el('p', 'scan-aside',
        'Confidence ' + Math.round((p.confidence || 0) * 100) + '%, based on ' +
        (p.signal_kinds_matched || 0) + ' of the 10 kinds of signal we look for.'));
      caseAgainst(b, p);
    }
    if (icps.length > 1) {
      var a = block('Also worth testing');
      icps.slice(1).forEach(function (i) {
        a.appendChild(el('p', 'scan-buyer', buyerLine(i)));
        a.appendChild(el('p', 'scan-aside', 'Confidence ' + Math.round((i.confidence || 0) * 100) + '%, based on ' + (i.signal_kinds_matched || 0) + ' of 10.'));
      });
    }
  }
  function renderHypotheses(r) {
    var hyps = r.hypotheses || [];
    var n = block(null);
    n.appendChild(el('p', 'scan-plain', hyps.length
      ? 'Not enough on the site yet to name a buyer with confidence. Here is what it points at.'
      : 'Not enough on the site yet to name a buyer with confidence.'));
    if (!hyps.length) return;
    var h = block('Buyers your copy points at');
    h.appendChild(el('p', 'scan-aside', 'Hypotheses from your site, not yet evidence. Here is what would confirm each.'));
    hyps.forEach(function (x, i) {
      var d = el('div', 'scan-hyp');
      d.appendChild(el('p', 'scan-buyer', buyerLine(x)));
      if (x.suggested_by) d.appendChild(el('p', null, x.suggested_by));
      if (x.would_confirm) {
        var c = el('p', 'scan-aside');
        c.appendChild(el('span', 'scan-label', 'What would confirm it: '));
        c.appendChild(document.createTextNode(page(x.would_confirm)));
        d.appendChild(c);
      }
      if (i === 0) caseAgainst(d, x);
      var pick = el('button', 'scan-pick', 'This one');
      pick.type = 'button';
      pick.setAttribute('aria-pressed', 'false');
      pick.setAttribute('aria-label', 'This one: ' + buyerLine(x));
      pick.addEventListener('click', function () { choose(i); });
      d.appendChild(pick);
      h.appendChild(d);
    });
  }
  function renderExample(r) {
    var ex = (r.examples || [])[0];
    if (!ex) return;
    var e = block('One real example');
    e.appendChild(el('p', 'scan-buyer', ex.company));
    var line = el('p');
    line.appendChild(document.createTextNode(page(ex.signal) + ' '));
    var src = el('span', 'scan-src'); src.appendChild(link(ex.source_url, 'source')); line.appendChild(src);
    e.appendChild(line);
    if (r.examples_hidden > 0) {
      e.appendChild(el('p', 'scan-aside', r.examples_hidden + ' more after you register.'));
    }
  }
  function renderTactic(r) {
    var t = r.first_tactic;
    if (!t) return;
    var s = block(null);
    var box = el('div', 'scan-tactic');
    box.appendChild(el('h3', null, t.label));
    box.appendChild(el('p', 'scan-tactic__name', t.name));
    box.appendChild(el('p', null, t.why_short));
    if (t.minimum_sample) box.appendChild(el('p', 'scan-aside', 'Try it with at least ' + t.minimum_sample + ' people before judging it.'));
    box.appendChild(el('p', 'scan-aside', 'Your first three steps and the message angle are in the report.'));
    box.appendChild(el('p', 'scan-aside', t.note));
    s.appendChild(box);
  }
  function renderSharpen(r) {
    if (!r.sharpen) return;
    block('What would sharpen this').appendChild(el('p', null, r.sharpen));
  }

  function render(r) {
    shown = r;
    out.textContent = '';
    renderSummary(r);
    renderSignals(r);
    if (r.insufficient) renderHypotheses(r); else renderBuyers(r);
    renderExample(r);
    renderTactic(r);
    renderSharpen(r);
    fillCard(r);
    section.hidden = false;
    card.hidden = false;
    section.scrollIntoView({ block: 'start' });
  }

  // ------------------------------------------------ the card, from the result
  function cardTitle() {
    var t = document.getElementById('scan-card-title');
    if (!t || !shown) return;
    t.textContent = picked === null
      ? page('Get the full picture for ' + (shown.company_name || 'your site'))
      : 'Tell us where to look and we\u2019ll go count them';
  }
  function fillCard(r) {
    cardTitle();
    var ul = document.getElementById('scan-card-adds');
    if (!ul) return;
    ul.textContent = '';
    if (r.examples_found > 0) {
      ul.appendChild(el('li', null, 'See all ' + r.examples_found + ' companies like your first buyer, with their signals.'));
    }
    ul.appendChild(el('li', null, 'The case against each buyer, beside the case for.'));
    ul.appendChild(el('li', null, 'How many of each buyer exist, and which to contact first.'));
  }
  // "This one" on a hypothesis: remember it, say so on the card, go there.
  function choose(i) {
    picked = i;
    Array.prototype.forEach.call(out.querySelectorAll('.scan-pick'), function (b, j) {
      b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      b.textContent = j === i ? 'Picked' : 'This one';
    });
    cardTitle();
    card.scrollIntoView({ block: 'center' });
    if (email && !email.disabled && document.body.contains(email)) email.focus({ preventScroll: true });
  }

  // ------------------------------------------------------ the scan and poll
  function remember(id) {
    current = id;
    if (history.replaceState) history.replaceState(null, '', '#scan=' + id);
    else location.hash = 'scan=' + id;
  }

  function poll(id, tries, mine) {
    if (mine !== run) return;
    fetch(API + '/scan/' + encodeURIComponent(id) + '/summary', { credentials: 'omit' })
      .then(function (res) { return res.json().then(function (j) { return { code: res.status, j: j }; }); })
      .then(function (x) {
        if (mine !== run) return;
        if (x.code === 429) return setTimeout(function () { poll(id, tries + 1, mine); }, 6000);
        if (x.code === 404) { busy(false); steps.hidden = true; return showError('We could not find that scan. Paste your website to start a new one.'); }
        if (x.code !== 200) { busy(false); return showError('Something went wrong reading the result. Try again in a minute.'); }
        var j = x.j;
        if (j.status === 'failed') { busy(false); steps.hidden = true; return showError('Sorry, we could not read your site.'); }
        if (j.status === 'done' || j.status === 'insufficient') {
          stepsDone();
          busy(false);
          render(j);
          return;
        }
        setStep(j.progress_step);
        if (tries > 80) { busy(false); return showError('This is taking longer than it should. Reload the page in a minute and the result will be here.'); }
        setTimeout(function () { poll(id, tries + 1, mine); }, 3000);
      })
      .catch(function () { setTimeout(function () { poll(id, tries + 1, mine); }, 5000); });
  }

  function start(id) {
    run += 1;
    picked = null;
    shown = null;
    err.hidden = true;
    out.textContent = '';
    section.hidden = true;
    resetCard();
    remember(id);
    busy(true);
    steps.hidden = false;
    setStep('reading your site');
    poll(id, 0, run);
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;
    var url = input.value.trim();
    if (!url) return showError('Paste your website address first.');
    busy(true);
    steps.hidden = false;
    setStep('reading your site');
    fetch(API + '/scan', {
      method: 'POST', credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: url })
    })
      .then(function (res) { return res.json().then(function (j) { return { code: res.status, j: j }; }); })
      .then(function (x) {
        if (x.code === 400) { busy(false); steps.hidden = true; return showError('Try a website address like yourcompany.com.'); }
        if (x.code === 429) { busy(false); steps.hidden = true; return showError('Three scans a day per visitor; try again tomorrow.'); }
        if (x.code !== 200 || !x.j.scan_id) {
          busy(false); steps.hidden = true;
          return showError('That scan could not start. Try again in a minute.');
        }
        // A cached result comes back finished, so the first read renders it at once.
        start(x.j.scan_id);
      })
      .catch(function () { busy(false); steps.hidden = true; showError('We could not reach the scanner. Check your connection and try again.'); });
  });

  // ---------------------------------------------------- the full-report card
  var cardHtml = card.innerHTML;   // the page's own markup, restored for a new scan
  function resetCard() {
    card.innerHTML = cardHtml;
    card.hidden = true;
    ask = document.getElementById('interest-form');
    email = document.getElementById('interest-email');
    askErr = document.getElementById('interest-error');
    ask.addEventListener('submit', onAsk);
  }
  function onAsk(ev) {
    ev.preventDefault();
    askErr.hidden = true;
    var v = email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { askErr.textContent = 'That email address does not look right.'; askErr.hidden = false; return; }
    var go = ask.querySelector('button');
    go.disabled = true;
    fetch(API + '/scan/' + encodeURIComponent(current) + '/interest', {
      method: 'POST', credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: v, picked: picked })
    })
      .then(function (res) { return res.json().then(function (j) { return { code: res.status, j: j }; }); })
      .then(function (x) {
        if (x.code === 200 && x.j && x.j.ok === true) {
          card.textContent = '';
          var t = el('p', 'scan-card__thanks', 'Thanks. We\u2019ll be in touch within a day.');
          t.tabIndex = -1;
          card.appendChild(t);
          t.focus();
          return;
        }
        go.disabled = false;
        askErr.textContent = x.code === 429
          ? 'Too many tries from here. Wait a minute and send it again.'
          : (x.code === 400 ? 'That email address does not look right.' : 'That did not go through. Try again in a minute.');
        askErr.hidden = false;
      })
      .catch(function () {
        go.disabled = false;
        askErr.textContent = 'We could not reach the server. Check your connection and try again.';
        askErr.hidden = false;
      });
  }
  ask.addEventListener('submit', onAsk);

  // ------------------------------------------------------- a reload or a link
  var m = /^#scan=(.+)$/.exec(location.hash);
  if (m && ID_RE.test(m[1])) start(m[1]);
})();
