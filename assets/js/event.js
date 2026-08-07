// Renders a single event page (event.html?e=<sheet row index>) from the
// "Website Events" tab of the Google Sheet. Shares the row-index scheme
// with events.js, so every event card links straight here.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Website Events';
  var SIGNUP_URL = 'https://script.google.com/macros/s/AKfycbxmAiL2g0LMTqI0WYRax8eoYvtOR_Ym3jfWkFl3L8wtv8Vh7Sn1cG6IFHV9WURblmh19Q/exec';
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

  function imageUrlFor(raw, rowIndex, col) {
    raw = (raw || '').trim();
    if (/^https?:\/\//i.test(raw)) {
      var dm = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]+)/);
      if (dm) return 'https://drive.google.com/thumbnail?id=' + dm[1] + '&sz=w1600';
      return raw;
    }
    return '/api/topic-image?tab=events&row=' + rowIndex + '&col=' + col;
  }

  function render(cols, rowIndex) {
    var date = (cols[0] || '').trim();
    var title = (cols[1] || '').trim();
    var location = (cols[2] || '').trim();
    var desc = (cols[3] || '').trim();
    var link = (cols[5] || '').trim();
    var duration = (cols[6] || '').trim();
    var price = (cols[7] || '').trim();

    document.title = title + ' | Dr Galit Ben Tovel';
    container.innerHTML = '';
    container.appendChild(backLink());

    var wrap = document.createElement('div');
    wrap.className = 'event-detail';

    var img = document.createElement('img');
    img.className = 'event-detail-img';
    img.src = imageUrlFor(cols[4], rowIndex, 4);
    img.alt = title;
    img.addEventListener('error', function () { img.remove(); });
    wrap.appendChild(img);

    // Up to three extra images from columns I, J, K
    var gallery = document.createElement('div');
    gallery.className = 'event-gallery';
    [8, 9, 10].forEach(function (col) {
      var g = document.createElement('img');
      g.src = imageUrlFor(cols[col], rowIndex, col);
      g.alt = '';
      g.loading = 'lazy';
      g.addEventListener('error', function () {
        g.remove();
        if (!gallery.children.length) gallery.remove();
      });
      gallery.appendChild(g);
    });
    wrap.appendChild(gallery);

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
    if (duration || price) {
      var meta = document.createElement('p');
      meta.className = 'event-meta';
      meta.textContent = [duration, price].filter(Boolean).join('  ·  ');
      wrap.appendChild(meta);
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
      // A link in column F overrides the built-in form
      cta.href = link;
      cta.target = '_blank';
      cta.rel = 'noopener';
      wrap.appendChild(cta);
    } else {
      var form = buildRsvpForm(title, date);
      cta.href = '#rsvp';
      cta.addEventListener('click', function (ev) {
        ev.preventDefault();
        form.classList.toggle('open');
        if (form.classList.contains('open')) {
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var first = form.querySelector('input');
          if (first) first.focus();
        }
      });
      wrap.appendChild(cta);
      wrap.appendChild(form);
    }

    container.appendChild(wrap);
  }

  function buildRsvpForm(title, date) {
    var form = document.createElement('form');
    form.className = 'rsvp-form';

    var heading = document.createElement('p');
    heading.className = 'rsvp-form-title';
    heading.textContent = t('rsvpTitle', 'RSVP for this event');
    form.appendChild(heading);

    function input(type, name, placeholder, required) {
      var el = document.createElement('input');
      el.type = type;
      el.name = name;
      el.placeholder = placeholder;
      if (required) el.required = true;
      return el;
    }

    var nameRow = document.createElement('div');
    nameRow.className = 'rsvp-row';
    nameRow.appendChild(input('text', 'firstName', t('firstName', 'First name'), true));
    nameRow.appendChild(input('text', 'lastName', t('lastName', 'Last name'), true));
    form.appendChild(nameRow);

    var contactRow = document.createElement('div');
    contactRow.className = 'rsvp-row';
    contactRow.appendChild(input('email', 'email', t('yourEmail', 'Your email'), true));
    contactRow.appendChild(input('tel', 'phone', t('phone', 'Phone number'), true));
    form.appendChild(contactRow);

    var notes = document.createElement('textarea');
    notes.name = 'notes';
    notes.rows = 3;
    notes.placeholder = t('notes', 'Anything we should know? (optional)');
    form.appendChild(notes);

    var eventField = document.createElement('input');
    eventField.type = 'hidden';
    eventField.name = 'event';
    eventField.value = title + (date ? ' (' + date + ')' : '');
    form.appendChild(eventField);

    var formType = document.createElement('input');
    formType.type = 'hidden';
    formType.name = 'form';
    formType.value = 'rsvp';
    form.appendChild(formType);

    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'display';
    btn.textContent = t('sendRsvp', 'Send RSVP');
    form.appendChild(btn);

    var status = document.createElement('p');
    status.className = 'rsvp-status';
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      btn.disabled = true;
      status.textContent = t('submitting', 'Submitting...');
      fetch(SIGNUP_URL, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
        .then(function () {
          status.textContent = t('thanksRsvp', "Thanks! Your spot is noted — we'll be in touch soon.");
          form.reset();
        })
        .catch(function () {
          status.textContent = t('error', 'Something went wrong. Please try again.');
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    return form;
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
        var fields = [0, 1, 2, 3, 6, 7];
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
