/* The scan in the hero. A visitor pastes their website; this posts it to
   api.beheld.tech/scan, reads GET /scan/:id/summary every 3 seconds with the
   three progress steps showing, and when it finishes puts the scan card in
   the form's place: four tabs in the "Your week" card's style.

   No analytics, no cookies, no other scripts. Everything the scan wrote is
   put on the page as text, never as HTML: it is model output about somebody
   else's website. Everything the page changes on its own is also said once
   through the polite live region #scan-live. */
(function () {
  'use strict';

  var API = 'https://api.beheld.tech';
  var ORDER = ['reading your site', 'checking public sources', 'ranking buyers'];
  var ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var TABS = [
    { key: 'sell', label: 'What you sell' },
    { key: 'buys', label: 'Who buys' },
    { key: 'out-there', label: 'Who\u2019s out there' },
    { key: 'start', label: 'Where to start' }
  ];
  var ASK_PICKED = 'Tell us where to look and we\u2019ll go count them';
  var THANKS = 'Thanks. We\u2019ll be in touch within a day.';

  var form = document.getElementById('scan-form');
  if (!form) return;
  var input = document.getElementById('scan-url');
  var btn = document.getElementById('scan-go');
  var startBox = document.getElementById('scan-start');
  var err = document.getElementById('scan-error');
  var steps = document.getElementById('scan-steps');
  var result = document.getElementById('scan-result');
  var live = document.getElementById('scan-live');
  var weekCard = document.getElementById('week-card');

  var current = null;   // the scan id on show
  var run = 0;          // bumps on every new scan, so a stale poll stops
  var picked = null;    // the hypothesis the visitor said "this one" to
  var shown = null;     // the result on show
  var ui = {};          // the card's parts, rebuilt for every result

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ small parts
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
  // Said once, politely. Cleared first so the same sentence twice is heard twice.
  function announce(msg) {
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 60);
  }
  function busy(on) { btn.disabled = on; input.disabled = on; }
  function setStep(name) {
    var at = ORDER.indexOf(name);
    Array.prototype.forEach.call(steps.children, function (li, i) {
      li.className = at < 0 ? '' : (i < at ? 'done' : (i === at ? 'now' : ''));
    });
  }
  // A failure takes the progress steps' place, and is said aloud.
  function fail(msg) {
    busy(false);
    steps.hidden = true;
    err.textContent = msg;
    err.hidden = false;
    announce(msg);
  }
  // Runs cb once the page has stopped scrolling, so a phone's keyboard does
  // not open halfway through a scroll: eight still frames in a row, or about
  // a second and a half at most. Not scrollend: switching tabs changes the
  // page's height, and the browser's own correction for that fires scrollend
  // before the smooth scroll has begun.
  function afterScroll(cb) {
    var last = -1, still = 0, frames = 0;
    (function tick() {
      var y = window.scrollY;
      still = (y === last) ? still + 1 : 0;
      last = y;
      if ((still >= 8 && frames > 2) || frames > 90) return cb();
      frames++;
      requestAnimationFrame(tick);
    })();
  }
  function scrollTo(node, block) {
    node.scrollIntoView({ block: block || 'start', behavior: reduced ? 'auto' : 'smooth' });
  }

  // ------------------------------------------------------------ the address
  function readHash() {
    var out = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) out[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
    });
    return out;
  }
  function writeHash(id, tab) {
    var h = id ? '#scan=' + id + (tab && tab !== 'sell' ? '&tab=' + tab : '') : '';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + h);
    else location.hash = h;
  }

  // ---------------------------------------------------------------- the tabs
  function openTab(key, opts) {
    opts = opts || {};
    if (!ui.tabs) return;
    TABS.forEach(function (t) {
      var on = t.key === key;
      ui.tabs[t.key].setAttribute('aria-selected', on ? 'true' : 'false');
      ui.tabs[t.key].tabIndex = on ? 0 : -1;
      ui.panels[t.key].hidden = !on;
    });
    if (opts.focus) ui.tabs[key].focus();
    writeHash(current, key);
  }
  function onTabKey(ev) {
    var i = TABS.map(function (t) { return t.key; }).indexOf(ev.currentTarget.getAttribute('data-tab'));
    var to = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') to = (i + 1) % TABS.length;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') to = (i + TABS.length - 1) % TABS.length;
    if (ev.key === 'Home') to = 0;
    if (ev.key === 'End') to = TABS.length - 1;
    if (to === null) return;
    ev.preventDefault();
    openTab(TABS[to].key, { focus: true });
  }

  // ------------------------------------------------------------ the panels
  function buyerLine(i) {
    var parts = [i.role_title, i.company_type].filter(Boolean).join(' at ');
    var extra = [i.headcount, i.geo].filter(Boolean).join(', ');
    return extra ? parts + ' (' + extra + ')' : parts;
  }
  function ghost() {
    var g = el('div', 'scan-ghost');
    g.setAttribute('aria-hidden', 'true');
    return g;
  }

  function panelSell(p, r) {
    p.appendChild(el('p', null, r.summary || ''));
    // A demo signal counts toward no buyer and is not shown.
    var sigs = (r.signals || []).filter(function (g) { return g.counts_toward_icp !== false; });
    if (!sigs.length) return;
    var ul = el('ul', 'scan-signals');
    sigs.forEach(function (g) {
      var li = el('li');
      li.appendChild(document.createTextNode(page(g.claim) + ' '));
      var src = el('span', 'scan-src'); src.appendChild(link(g.source_url, 'source')); li.appendChild(src);
      ul.appendChild(li);
    });
    p.appendChild(ul);
  }

  function panelBuys(p, r) {
    var icps = r.icps || [];
    if (!r.insufficient && icps[0]) {
      var b = icps[0];
      p.appendChild(el('p', 'scan-buyer', buyerLine(b)));
      if (b.why) p.appendChild(el('p', null, b.why));
      p.appendChild(el('p', 'scan-aside',
        'Confidence ' + Math.round((b.confidence || 0) * 100) + '%, based on ' +
        (b.signal_kinds_matched || 0) + ' of the 10 kinds of signal we look for.'));
      if (icps.length > 1) {
        p.appendChild(el('p', 'scan-sub', 'Also worth testing'));
        icps.slice(1).forEach(function (i) {
          p.appendChild(el('p', 'scan-buyer', buyerLine(i)));
          p.appendChild(el('p', 'scan-aside', 'Confidence ' + Math.round((i.confidence || 0) * 100) + '%, based on ' + (i.signal_kinds_matched || 0) + ' of 10.'));
        });
      }
      return;
    }
    var hyps = r.hypotheses || [];
    p.appendChild(el('p', 'scan-plain', hyps.length
      ? 'Not enough on the site yet to name a buyer with confidence. Here is what it points at.'
      : 'Not enough on the site yet to name a buyer with confidence.'));
    if (!hyps.length) return;
    p.appendChild(el('p', 'scan-aside', 'Hypotheses from your site, not yet evidence. Here is what would confirm each.'));
    ui.picks = [];
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
      var pick = el('button', 'scan-pick', 'This one');
      pick.type = 'button';
      pick.setAttribute('aria-pressed', 'false');
      pick.setAttribute('aria-label', 'This one: ' + buyerLine(x));
      pick.addEventListener('click', function () { choose(i); });
      ui.picks.push(pick);
      d.appendChild(pick);
      p.appendChild(d);
    });
  }

  function panelOutThere(p, r) {
    var ex = (r.examples || [])[0];
    if (r.examples_found > 0 && ex) {
      p.appendChild(el('p', 'scan-buyer', ex.company));
      var line = el('p');
      line.appendChild(document.createTextNode(page(ex.signal) + ' '));
      var src = el('span', 'scan-src'); src.appendChild(link(ex.source_url, 'source')); line.appendChild(src);
      p.appendChild(line);
      if (r.examples_hidden > 0) {
        var rows = el('div', 'scan-ghosts');
        rows.appendChild(ghost()); rows.appendChild(ghost());
        p.appendChild(rows);
        p.appendChild(el('p', 'scan-aside', r.examples_hidden + ' more after you register.'));
      }
      return;
    }
    // None found. With hypotheses to pick from, ask for a pick; with a
    // confident buyer (or nothing to pick), say so plainly.
    if (r.insufficient && (r.hypotheses || []).length) {
      var t = el('p', null, 'We look for companies that match your buyer and show a signal this month. Your buyer is still too loosely defined to search well. ');
      var a = el('a', 'scan-inline', 'Pick one on the Who buys tab');
      a.href = '#';
      a.addEventListener('click', function (ev) { ev.preventDefault(); openTab('buys', { focus: true }); });
      t.appendChild(a);
      t.appendChild(document.createTextNode(' and we\u2019ll count them.'));
      p.appendChild(t);
    } else {
      p.appendChild(el('p', null, 'We look for companies that match your buyer and show a signal this month, and found none we could stand behind this time. Your report counts them properly.'));
    }
  }

  function panelStart(p, r) {
    var t = r.first_tactic;
    if (t) {
      p.appendChild(el('p', 'scan-sub', t.label));
      p.appendChild(el('p', 'scan-buyer', t.name));
      if (t.why_short) p.appendChild(el('p', null, t.why_short));
      if (t.minimum_sample) p.appendChild(el('p', 'scan-aside', 'Try it with at least ' + t.minimum_sample + ' people before judging it.'));
    }
    // What the report holds, shown as locked rows. Each one leads to the email.
    var locked = el('div', 'scan-locked-list');
    ['The case against your first buyer', 'Your first three steps', 'The message angle'].forEach(function (label) {
      var row = el('button', 'scan-locked');
      row.type = 'button';
      row.appendChild(el('span', 'scan-locked__label', label));
      row.appendChild(el('span', 'visually-hidden', ', in your full report'));
      row.appendChild(ghost());
      row.addEventListener('click', function () { if (ui.email && document.body.contains(ui.email)) ui.email.focus(); });
      locked.appendChild(row);
    });
    p.appendChild(locked);

    var ask = el('div', 'scan-ask');
    ui.askTitle = el('h3', 'scan-ask__title');
    ui.askTitle.id = 'scan-ask-title';
    ask.appendChild(ui.askTitle);
    var f = el('form', 'scan-ask__form');
    f.noValidate = true;
    var lab = el('label', 'scan-ask__label', 'Your email');
    lab.htmlFor = 'interest-email';
    ui.email = el('input', 'scan-input');
    ui.email.id = 'interest-email'; ui.email.name = 'email'; ui.email.type = 'email';
    ui.email.autocomplete = 'email'; ui.email.setAttribute('autocapitalize', 'off'); ui.email.spellcheck = false;
    var go = el('button', 'btn btn--primary', 'Send me the full report');
    go.type = 'submit';
    ui.askErr = el('p', 'scan-error');
    ui.askErr.hidden = true;
    ui.askErr.setAttribute('role', 'alert');
    f.appendChild(lab); f.appendChild(ui.email); f.appendChild(go); f.appendChild(ui.askErr);
    f.addEventListener('submit', onAsk);
    ui.askForm = f;
    ask.appendChild(f);
    ui.ask = ask;
    p.appendChild(ask);
    var list = el('p', 'scan-list');
    var a = el('a', null, 'Get on the list');
    a.href = 'https://tally.so/r/QK9bQG';
    list.appendChild(a);
    p.appendChild(list);
    askTitle();
  }

  function askTitle() {
    if (!ui.askTitle || !shown) return;
    ui.askTitle.textContent = picked === null
      ? page('Get the full picture for ' + (shown.company_name || 'your site'))
      : ASK_PICKED;
  }

  // ------------------------------------------------------------- the card
  function render(r, tab) {
    shown = r;
    ui = {};
    result.textContent = '';

    var card = el('div', 'week scan-card');
    var bar = el('div', 'week__bar');
    bar.appendChild(el('b', null, r.company_name || 'Your site'));
    bar.appendChild(el('span', null, 'Your scan'));
    card.appendChild(bar);
    ui.bar = bar;

    var list = el('div', 'week__tabs');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Your scan');
    var body = el('div', 'week__body');
    ui.tabs = {}; ui.panels = {};
    TABS.forEach(function (t) {
      var b = el('button', 'scan-tab', t.label);
      b.type = 'button';
      b.id = 'scan-tab-' + t.key;
      b.setAttribute('role', 'tab');
      b.setAttribute('data-tab', t.key);
      b.setAttribute('aria-controls', 'scan-panel-' + t.key);
      b.addEventListener('click', function () { openTab(t.key); });
      b.addEventListener('keydown', onTabKey);
      list.appendChild(b);
      ui.tabs[t.key] = b;

      var p = el('div', 'scan-panel');
      p.id = 'scan-panel-' + t.key;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', b.id);
      p.tabIndex = 0;
      p.appendChild(el('p', 'week__q', t.label));
      body.appendChild(p);
      ui.panels[t.key] = p;
    });
    card.appendChild(list);
    card.appendChild(body);

    panelSell(ui.panels.sell, r);
    panelBuys(ui.panels.buys, r);
    panelOutThere(ui.panels['out-there'], r);
    panelStart(ui.panels.start, r);

    result.appendChild(card);
    if (r.sharpen) result.appendChild(el('p', 'scan-sharpen', r.sharpen));
    var again = el('button', 'scan-again', 'Scan another site');
    again.type = 'button';
    again.addEventListener('click', reset);
    result.appendChild(again);

    startBox.hidden = true;
    result.hidden = false;
    if (weekCard) weekCard.hidden = true;
    openTab(TABS.some(function (t) { return t.key === tab; }) ? tab : 'sell');

    // Make the arrival noticeable: bring it into view, light the bar, say it.
    scrollTo(card, 'start');
    bar.classList.remove('is-new');
    void bar.offsetWidth;
    bar.classList.add('is-new');
    announce(page('Your scan of ' + (r.company_name || 'your site') + ' is ready.'));
  }

  // "This one": remember the pick, say so, open Where to start, and give the
  // email field focus only once the scroll has finished.
  function choose(i) {
    picked = i;
    (ui.picks || []).forEach(function (b, j) {
      b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      b.textContent = j === i ? 'Picked' : 'This one';
    });
    askTitle();
    openTab('start');
    announce('Where to start. ' + ASK_PICKED + '.');
    if (!ui.email || !document.body.contains(ui.email)) { scrollTo(ui.ask, 'center'); return; }
    scrollTo(ui.email, 'center');
    afterScroll(function () { ui.email.focus({ preventScroll: true }); });
  }

  function reset() {
    run += 1;
    current = null; picked = null; shown = null; ui = {};
    result.textContent = '';
    result.hidden = true;
    startBox.hidden = false;
    steps.hidden = true;
    err.hidden = true;
    if (weekCard) weekCard.hidden = false;
    busy(false);
    writeHash(null);
    input.focus();
  }

  // ------------------------------------------------------ the scan and poll
  function poll(id, tries, mine, tab) {
    if (mine !== run) return;
    fetch(API + '/scan/' + encodeURIComponent(id) + '/summary', { credentials: 'omit' })
      .then(function (res) { return res.json().then(function (j) { return { code: res.status, j: j }; }); })
      .then(function (x) {
        if (mine !== run) return;
        if (x.code === 429) return setTimeout(function () { poll(id, tries + 1, mine, tab); }, 6000);
        if (x.code === 404) return fail('We could not find that scan. Paste your website to start a new one.');
        if (x.code !== 200) return fail('Something went wrong reading the result. Try again in a minute.');
        var j = x.j;
        if (j.status === 'failed') return fail('Sorry, we could not read your site.');
        if (j.status === 'done' || j.status === 'insufficient') {
          busy(false);
          steps.hidden = true;
          render(j, tab);
          return;
        }
        setStep(j.progress_step);
        if (tries > 80) return fail('This is taking longer than it should. Reload the page in a minute and the result will be here.');
        setTimeout(function () { poll(id, tries + 1, mine, tab); }, 3000);
      })
      .catch(function () { setTimeout(function () { poll(id, tries + 1, mine, tab); }, 5000); });
  }

  function start(id, tab) {
    run += 1;
    picked = null; shown = null;
    current = id;
    err.hidden = true;
    writeHash(id, tab);
    busy(true);
    steps.hidden = false;
    setStep('reading your site');
    poll(id, 0, run, tab);
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;
    var url = input.value.trim();
    if (!url) return fail('Paste your website address first.');
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
        if (x.code === 400) return fail('Try a website address like yourcompany.com.');
        if (x.code === 429) return fail('Three scans a day per visitor; try again tomorrow.');
        if (x.code !== 200 || !x.j.scan_id) return fail('That scan could not start. Try again in a minute.');
        // A cached result comes back finished, so the first read renders it at once.
        start(x.j.scan_id);
      })
      .catch(function () { fail('We could not reach the scanner. Check your connection and try again.'); });
  });

  // ------------------------------------------------------------- the email
  function onAsk(ev) {
    ev.preventDefault();
    ui.askErr.hidden = true;
    var v = ui.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      ui.askErr.textContent = 'That email address does not look right.';
      ui.askErr.hidden = false;
      return;
    }
    var go = ui.askForm.querySelector('button');
    go.disabled = true;
    fetch(API + '/scan/' + encodeURIComponent(current) + '/interest', {
      method: 'POST', credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: v, picked: picked })
    })
      .then(function (res) { return res.json().then(function (j) { return { code: res.status, j: j }; }); })
      .then(function (x) {
        if (x.code === 200 && x.j && x.j.ok === true) {
          ui.ask.textContent = '';
          ui.ask.appendChild(el('p', 'scan-thanks', THANKS));
          ui.email = null;
          announce(THANKS);
          return;
        }
        go.disabled = false;
        ui.askErr.textContent = x.code === 429
          ? 'Too many tries from here. Wait a minute and send it again.'
          : (x.code === 400 ? 'That email address does not look right.' : 'That did not go through. Try again in a minute.');
        ui.askErr.hidden = false;
      })
      .catch(function () {
        go.disabled = false;
        ui.askErr.textContent = 'We could not reach the server. Check your connection and try again.';
        ui.askErr.hidden = false;
      });
  }

  // ------------------------------------------------------- a reload or a link
  var h = readHash();
  if (h.scan && ID_RE.test(h.scan)) start(h.scan, h.tab);
})();
