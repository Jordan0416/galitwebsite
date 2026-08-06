// Renders a single event page (event.html?e=<sheet row index>) from the
// "Website Events" tab of the Google Sheet. Shares the row-index scheme
// with events.js, so every event card links straight here.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Website Events';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_TAB);

  var container = document.getElementById('eventDetail');
  if (!container) return;

  function t(key, fallback) {
    return (window.SITE_I18N && window.SITE_I18N.t && window.SITE_I18N.t[key]) || fallback;
  }

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

  function backLink() {
    var back = document.createElement('a');
    back.className = 'back-link';
    back.href = 'events.html';
    back.textContent = t('allEvents', '← All Events');
    return back;
  }

  function showNotFound() {
    container.innerHTML = '';
    container.appendChild(backLink());
    var msg = document.createElement('p');
    msg.className = 'events-intro';
    msg.textContent = t('eventNotFound', "This event could not be found — it may have passed or been removed.");
    container.appendChild(msg);
  }

  function render(cols, rowIndex) {
    var date = (cols[0] || '').trim();
    var title = (cols[1] || '').trim();
    var location = (cols[2] || '').trim();
    var desc = (cols[3] || '').trim();
    var link = (cols[5] || '').trim();

    document.title = title + ' | Dr Galit Ben Tovel';
    container.innerHTML = '';
    container.appendChild(backLink());

    var wrap = document.createElement('div');
    wrap.className = 'event-detail';

    var imgUrl = (cols[4] || '').trim();
    if (/^https?:\/\//i.test(imgUrl)) {
      var dm = imgUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]+)/);
      if (dm) imgUrl = 'https://drive.google.com/thumbnail?id=' + dm[1] + '&sz=w1600';
    } else {
      imgUrl = '/api/topic-image?tab=events&row=' + rowIndex;
    }
    var img = document.createElement('img');
    img.className = 'event-detail-img';
    img.src = imgUrl;
    img.alt = title;
    img.addEventListener('error', function () { img.remove(); });
    wrap.appendChild(img);

    if (date) {
      var d = document.createElement('span');
      d.className = 'event-date';
      d.textContent = date;
      wrap.appendChild(d);
    }
    var h = document.createElement('h1');
    h.className = 'gold-heading event-detail-title';
    h.textContent = title;
    wrap.appendChild(h);
    if (location) {
      var loc = document.createElement('p');
      loc.className = 'event-location';
      loc.textContent = location;
      wrap.appendChild(loc);
    }
    desc.split('\n').forEach(function (para) {
      para = para.trim();
      if (!para) return;
      var p = document.createElement('p');
      p.textContent = para;
      wrap.appendChild(p);
    });

    var cta = document.createElement('a');
    cta.className = 'cta-button display';
    cta.textContent = t('rsvp', 'RSVP');
    if (/^https?:\/\//i.test(link)) {
      cta.href = link;
      cta.target = '_blank';
      cta.rel = 'noopener';
    } else {
      cta.href = 'contact.html';
    }
    wrap.appendChild(cta);

    container.appendChild(wrap);
  }

  var rowIndex = parseInt(new URLSearchParams(location.search).get('e'), 10);

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('sheet fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);
      var head = rows[0] || [];
      var normH = function (s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); };
      if (normH(head[1]) !== 'eventtitle' && normH(head[0]) !== 'date') {
        throw new Error('Website Events tab not found');
      }
      var cols = rows[rowIndex];
      var title = cols && (cols[1] || '').trim();
      if (isNaN(rowIndex) || rowIndex < 1 || !title) {
        showNotFound();
        return;
      }
      var i18n = window.SITE_I18N;
      if (i18n && i18n.lang === 'he' && i18n.translate) {
        var fields = [0, 1, 2, 3];
        var texts = [];
        var slots = [];
        fields.forEach(function (c) {
          (cols[c] || '').split('\n').forEach(function (line, part) {
            texts.push(line);
            slots.push({ c: c, part: part });
          });
        });
        return i18n.translate(texts).then(function (out) {
          var copy = cols.slice();
          var cells = {};
          out.forEach(function (tr, i) {
            var s = slots[i];
            (cells[s.c] = cells[s.c] || [])[s.part] = tr;
          });
          Object.keys(cells).forEach(function (c) {
            copy[c] = cells[c].join('\n');
          });
          render(copy, rowIndex);
        });
      }
      render(cols, rowIndex);
    })
    .catch(function () { showNotFound(); });
})();
