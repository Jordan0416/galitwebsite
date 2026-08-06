// Loads the About page content live from the "Website About" tab of the
// Google Sheet. Column A says what each row is (Heading / Paragraph /
// Image), column B holds the text. An Image row with a photo pasted on
// it replaces the portrait. If the tab doesn't exist or can't be
// reached, the text already in the page stays as a fallback.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Website About';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_TAB);

  var textWrap = document.getElementById('aboutText');
  var portrait = document.getElementById('aboutPortrait');
  if (!textWrap) return;

  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // Hebrew mode: machine-translate the text column before rendering.
  function translateAboutRows(rows, norm) {
    var i18n = window.SITE_I18N;
    if (!i18n || i18n.lang !== 'he' || !i18n.translate) return Promise.resolve(rows);
    var texts = [];
    var slots = [];
    rows.forEach(function (cols, r) {
      var type = norm(cols[0]);
      if (type.indexOf('type') === 0 || type === 'image' || type === 'photo') return;
      var v = cols[1] || '';
      if (!v.trim()) return;
      v.split('\n').forEach(function (line, part) {
        texts.push(line);
        slots.push({ r: r, part: part });
      });
    });
    return i18n.translate(texts).then(function (out) {
      var copy = rows.map(function (cols) { return cols.slice(); });
      var cells = {};
      out.forEach(function (tr, i) {
        var s = slots[i];
        (cells[s.r] = cells[s.r] || [])[s.part] = tr;
      });
      Object.keys(cells).forEach(function (r) {
        copy[r][1] = cells[r].join('\n');
      });
      return copy;
    });
  }

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('sheet fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);
      var norm = function (s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); };
      // Google returns the FIRST tab when the requested tab doesn't exist,
      // so require the About header row before touching the page.
      var head = rows[0] || [];
      if (norm(head[0]).indexOf('type') !== 0) {
        throw new Error('Website About tab not found');
      }

      return translateAboutRows(rows, norm);
    })
    .then(function (rows) {
      if (!rows) return;
      var norm = function (s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); };
      var frag = document.createDocumentFragment();
      var blocks = 0;
      rows.forEach(function (cols, rowIndex) {
        var type = norm(cols[0]);
        var body = (cols[1] || '').trim();
        if (type.indexOf('type') === 0) return; // header row

        if (type === 'image' || type === 'photo') {
          if (portrait) {
            var orig = portrait.src;
            portrait.src = '/api/topic-image?tab=about&row=' + rowIndex;
            portrait.addEventListener('error', function restore() {
              portrait.removeEventListener('error', restore);
              portrait.src = orig;
            });
          }
          return;
        }
        if (!body) return;

        if (type === 'heading') {
          var h = document.createElement('h1');
          h.className = 'gold-heading';
          h.textContent = body;
          frag.appendChild(h);
          blocks++;
        } else {
          body.split('\n').forEach(function (para) {
            para = para.trim();
            if (!para) return;
            var p = document.createElement('p');
            p.textContent = para;
            frag.appendChild(p);
            blocks++;
          });
        }
      });

      if (blocks) {
        textWrap.innerHTML = '';
        textWrap.appendChild(frag);
      }
    })
    .catch(function (err) {
      console.warn('About sheet unavailable, using built-in content.', err);
    });
})();
