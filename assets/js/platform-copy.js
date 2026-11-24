// Loads the home page copy live from the "Platform Copy" tab of the
// Google Sheet. Column A is a label, the text sits in the columns after it:
//   MAIN            → hero headline
//   SUB             → hero sub-line
//   ABOUT SLIDERS   → slideshow titles      (one slide per column, B onward)
//   SLIDER content  → slideshow captions    (same columns)
//   Image links     → slideshow photos      (same columns; Drive links must
//                     be shared as "Anyone with the link" or the built-in
//                     photo for that slide is kept)
//   CTA             → line above the Books / Speaking / Events cards
//   POP UP          → newsletter popup text
// Other rows (bios, misc CTAs) are ignored. If the tab can't be reached,
// the text already in the page stays. The slideshow itself is drawn by
// about-photo.js, which waits on window.PLATFORM_COPY.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Platform Copy';
  var CACHE_KEY = 'platformCopy';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&headers=0&sheet=' + encodeURIComponent(SHEET_TAB);

  var i18n = window.SITE_I18N;
  var isHe = !!(i18n && i18n.lang === 'he');

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

  function same(a, b) {
    var n = function (s) {
      return clean(s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    };
    return n(a) === n(b);
  }

  function imageUrl(raw) {
    raw = clean(raw);
    if (!/^https?:\/\//i.test(raw)) return '';
    var m = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]+)/);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600' : raw;
  }

  function readCopy(rows) {
    var copy = { slides: [] };
    var titles = [], captions = [], images = [];
    rows.forEach(function (cols) {
      var label = (cols[0] || '').toLowerCase().replace(/[^a-z]/g, '');
      var vals = cols.slice(1);
      if (label === 'main') copy.main = clean(vals[0]);
      else if (label === 'sub') copy.sub = clean(vals[0]);
      else if (label === 'cta') copy.cta = clean(vals[0]);
      else if (label === 'popup') copy.popup = clean(vals[0]);
      else if (label === 'aboutsliders') titles = vals;
      else if (/^s[il]+dercontent$/.test(label)) captions = vals; // "SLIDER" is misspelt in the sheet
      else if (label === 'imagelinks') images = vals;
    });
    titles.forEach(function (t, i) {
      var title = clean(t), caption = clean(captions[i]);
      if (title && caption) copy.slides.push({ title: title, caption: caption, img: imageUrl(images[i]) });
    });
    // Google returns the FIRST tab when the requested one is missing, so
    // require at least one of this tab's own labels.
    if (!copy.main && !copy.slides.length) throw new Error('Platform Copy tab not found');
    return copy;
  }

  // Hebrew view: run every string through the site translator (sheet
  // corrections first, machine translation for the rest).
  function localise(copy) {
    if (!isHe || !i18n.translate) return Promise.resolve({ en: copy, shown: copy });
    var texts = [copy.main || '', copy.sub || '', copy.cta || '', copy.popup || ''];
    copy.slides.forEach(function (s) { texts.push(s.title, s.caption); });
    return i18n.translate(texts).then(function (out) {
      var he = { main: out[0], sub: out[1], cta: out[2], popup: out[3], slides: [] };
      copy.slides.forEach(function (s, i) {
        he.slides.push({ title: out[4 + i * 2], caption: out[5 + i * 2], img: s.img });
      });
      return { en: copy, shown: he };
    });
  }

  function setText(selector, en, shown) {
    if (!en) return;
    document.querySelectorAll(selector).forEach(function (el) {
      // Unchanged from the text built into the page: leave it, so the
      // built-in Hebrew (not a machine translation) is what shows.
      var builtIn = el.__en !== undefined ? el.__en : el.textContent;
      if (!el.__sheet && same(builtIn, en)) return;
      // site-tools.js reads __sheet so a language switch keeps this text
      el.__sheet = { en: en, he: isHe ? shown : null };
      el.textContent = shown;
    });
  }

  function apply(pair) {
    setText('.hero-copy h1', pair.en.main, pair.shown.main);
    setText('.hero-sub', pair.en.sub, pair.shown.sub);
    setText('.discover-heading', pair.en.cta, pair.shown.cta);
    setText('.popup-modal > p:not(.popup-status)', pair.en.popup, pair.shown.popup);
  }

  // English: show the last copy we saw straight away, so an edited
  // headline doesn't flash the built-in one first.
  if (!isHe) {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && (cached.main || cached.slides)) apply({ en: cached, shown: cached });
    } catch (e) {}
  }

  window.PLATFORM_COPY = fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('sheet fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var copy = readCopy(parseCSV(text));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(copy)); } catch (e) {}
      return localise(copy);
    })
    .then(function (pair) {
      apply(pair);
      return pair.shown;
    })
    .catch(function (err) {
      console.warn('Platform Copy sheet unavailable, using built-in content.', err);
      return null;
    });
})();
