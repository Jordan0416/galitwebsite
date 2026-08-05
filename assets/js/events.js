// Loads events live from the "Website Events" tab of the Google Sheet.
// Columns: A date, B title, C location, D description,
//          E image (pasted onto the row, or a link), F RSVP link (optional).
// Images pasted into the sheet are served by /api/topic-image?tab=events.
// If the tab doesn't exist or can't be reached, the example content
// already in the page stays as a fallback.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Website Events';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_TAB);

  var fallback = document.getElementById('eventsFallback');
  var container = document.getElementById('eventsList');
  if (!fallback || !container) return;
  fallback.style.display = 'none';

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

  function render(rows) {
    var count = 0;
    rows.forEach(function (cols, rowIndex) {
      var date = (cols[0] || '').trim();
      var title = (cols[1] || '').trim();
      var location = (cols[2] || '').trim();
      var desc = (cols[3] || '').trim();
      var link = (cols[5] || '').trim();
      if (!title) return;
      if (title.toLowerCase().replace(/[^a-z]/g, '') === 'eventtitle') return; // header row
      count++;

      var card = document.createElement('article');
      card.className = 'event-card';

      var imgUrl = (cols[4] || '').trim();
      if (/^https?:\/\//i.test(imgUrl)) {
        var dm = imgUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]+)/);
        if (dm) imgUrl = 'https://drive.google.com/thumbnail?id=' + dm[1] + '&sz=w1200';
      } else {
        imgUrl = '/api/topic-image?tab=events&row=' + rowIndex;
      }
      var img = document.createElement('img');
      img.src = imgUrl;
      img.alt = title;
      img.addEventListener('error', function () {
        img.remove();
        card.classList.add('no-image');
      });
      card.appendChild(img);

      var body = document.createElement('div');
      body.className = 'event-card-body';
      if (date) {
        var d = document.createElement('span');
        d.className = 'event-date';
        d.textContent = date;
        body.appendChild(d);
      }
      var h = document.createElement('h2');
      h.textContent = title;
      body.appendChild(h);
      if (location) {
        var loc = document.createElement('p');
        loc.className = 'event-location';
        loc.textContent = location;
        body.appendChild(loc);
      }
      desc.split('\n').forEach(function (para) {
        para = para.trim();
        if (!para) return;
        var p = document.createElement('p');
        p.textContent = para;
        body.appendChild(p);
      });
      var cta = document.createElement('a');
      cta.className = 'cta-button display';
      cta.textContent = (window.SITE_I18N && window.SITE_I18N.t.rsvp) || 'RSVP';
      if (/^https?:\/\//i.test(link)) {
        cta.href = link;
        cta.target = '_blank';
        cta.rel = 'noopener';
      } else {
        cta.href = 'contact.html';
      }
      body.appendChild(cta);
      card.appendChild(body);

      container.appendChild(card);
    });

    if (!count) {
      var note = document.createElement('p');
      note.className = 'events-note';
      note.textContent = (window.SITE_I18N && window.SITE_I18N.t.comingSoon) ||
        'New events are coming soon — check back or follow along on social media.';
      container.appendChild(note);
    }
  }

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('sheet fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);
      // Google returns the FIRST tab when the requested tab doesn't exist,
      // so require the events header row before rendering anything.
      var head = rows[0] || [];
      var normH = function (s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); };
      if (normH(head[1]) !== 'eventtitle' && normH(head[0]) !== 'date') {
        throw new Error('Website Events tab not found (create it with the header row)');
      }
      render(rows);
    })
    .catch(function (err) {
      console.warn('Events sheet unavailable, using static content.', err);
      fallback.style.display = '';
    });
})();
