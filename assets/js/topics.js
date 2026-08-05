// Loads speaking topics live from the "Talking Topics" tab of the Google Sheet.
// The sheet only needs to be shared as "anyone with the link can view".
// If the fetch fails, the static list already in the page stays as a fallback.
(function () {
  var SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var SHEET_TAB = 'Talking Topics';
  var SIGNUP_URL = 'https://script.google.com/macros/s/AKfycbxmAiL2g0LMTqI0WYRax8eoYvtOR_Ym3jfWkFl3L8wtv8Vh7Sn1cG6IFHV9WURblmh19Q/exec';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_TAB);

  var list = document.querySelector('.topics-list');
  if (!list) return;
  // Hide the static fallback immediately so the sheet topics don't "replace" it visibly;
  // it is restored only if the sheet can't be reached.
  list.style.display = 'none';

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

  function buildSignup(topicTitle) {
    var form = document.createElement('form');
    form.className = 'topic-signup';

    var note = document.createElement('p');
    note.className = 'topic-signup-note';
    note.textContent = 'Interested in this topic? Join the newsletter for updates:';
    form.appendChild(note);

    var row = document.createElement('div');
    row.className = 'topic-signup-row';

    var name = document.createElement('input');
    name.type = 'text';
    name.name = 'name';
    name.placeholder = 'Your name';
    name.required = true;
    row.appendChild(name);

    var email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'Your email';
    email.required = true;
    row.appendChild(email);

    var topic = document.createElement('input');
    topic.type = 'hidden';
    topic.name = 'topic';
    topic.value = topicTitle;
    form.appendChild(topic);

    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'display';
    btn.textContent = 'Sign up';
    row.appendChild(btn);
    form.appendChild(row);

    var status = document.createElement('p');
    status.className = 'topic-signup-status';
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true;
      status.textContent = 'Submitting...';
      fetch(SIGNUP_URL, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
        .then(function () {
          status.textContent = "Thanks for joining! We'll keep you posted on this topic.";
          form.reset();
        })
        .catch(function () {
          status.textContent = 'Something went wrong. Please try again.';
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    return form;
  }

  function render(rows) {
    var wrap = document.createElement('div');
    wrap.className = 'topics-accordion';
    var count = 0;

    rows.forEach(function (cols) {
      var title = (cols[0] || '').trim();
      var shortDesc = (cols[1] || '').trim();
      var longDesc = (cols[3] || '').trim();
      if (!title) return;
      if (title.toLowerCase().replace(/[^a-z]/g, '') === 'topictitle') return; // header row
      var body = shortDesc || longDesc;
      if (!body) return;
      count++;

      var item = document.createElement('details');
      item.className = 'topic-item';

      var summary = document.createElement('summary');
      var titleLines = title.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var h = document.createElement('span');
      h.className = 'topic-item-title';
      h.textContent = titleLines[0];
      summary.appendChild(h);
      if (titleLines.length > 1) {
        var sub = document.createElement('span');
        sub.className = 'topic-item-subtitle';
        sub.textContent = titleLines.slice(1).join(' ');
        summary.appendChild(sub);
      }
      item.appendChild(summary);

      var bodyWrap = document.createElement('div');
      bodyWrap.className = 'topic-item-body';

      var imgUrl = (cols[4] || '').trim();
      if (/^https?:\/\//i.test(imgUrl)) {
        // Convert Google Drive share links to a direct image URL
        var dm = imgUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]+)/);
        if (dm) imgUrl = 'https://drive.google.com/thumbnail?id=' + dm[1] + '&sz=w1200';
        var img = document.createElement('img');
        img.className = 'topic-image';
        img.src = imgUrl;
        img.alt = titleLines[0];
        img.loading = 'lazy';
        img.addEventListener('error', function () { img.remove(); });
        bodyWrap.appendChild(img);
      }
      var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ''); };
      var titleSet = titleLines.map(norm);
      var paras = body.split('\n')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      // The sheet's description often opens by repeating the title lines — drop those
      while (paras.length && titleSet.indexOf(norm(paras[0])) !== -1) paras.shift();
      paras.forEach(function (para) {
        var p = document.createElement('p');
        p.textContent = para;
        bodyWrap.appendChild(p);
      });
      bodyWrap.appendChild(buildSignup(titleLines.join(' — ')));
      item.appendChild(bodyWrap);

      wrap.appendChild(item);
    });

    if (count) list.replaceWith(wrap);
  }

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('sheet fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (text) { render(parseCSV(text)); })
    .catch(function (err) {
      console.warn('Topics sheet unavailable, using static list.', err);
      list.style.display = '';
    });
})();
