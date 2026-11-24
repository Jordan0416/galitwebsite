// Site-wide tools: English/Hebrew language toggle + accessibility panel.
// Included on every page BEFORE the page scripts, so dynamic content
// (topics/events) can read the current language from window.SITE_I18N.
(function () {
  var LANG_KEY = 'siteLang';
  var ACC_KEY = 'siteAccess';

  // ---------------- Language ----------------
  var lang = localStorage.getItem(LANG_KEY) === 'he' ? 'he' : 'en';

  // Strings used by dynamically-rendered content (topics.js / events.js)
  var dynamic = {
    en: {
      signupNote: 'Interested in this topic? Join the newsletter for updates:',
      yourName: 'Your name',
      yourEmail: 'Your email',
      signUp: 'Sign up',
      submitting: 'Submitting...',
      thanksTopic: "Thanks for joining! We'll keep you posted on this topic.",
      error: 'Something went wrong. Please try again.',
      rsvp: 'RSVP',
      details: 'Event details',
      rsvpTitle: 'RSVP for this event',
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone number',
      notes: 'Anything we should know? (optional)',
      sendRsvp: 'Send RSVP',
      thanksRsvp: "Thanks! Your spot is noted — we'll be in touch soon.",
      itinerary: 'Itinerary',
      allEvents: '← All Events',
      eventNotFound: 'This event could not be found — it may have passed or been removed.',
      comingSoon: 'New events are coming soon — check back or follow along on social media.'
    },
    he: {
      signupNote: 'מתעניינים בנושא? הצטרפו לניוזלטר לעדכונים:',
      yourName: 'השם שלכם',
      yourEmail: 'האימייל שלכם',
      signUp: 'הרשמה',
      submitting: 'שולח...',
      thanksTopic: 'תודה שהצטרפתם! נעדכן אתכם בנושא זה.',
      error: 'משהו השתבש. אנא נסו שוב.',
      rsvp: 'הרשמה',
      details: 'פרטי האירוע',
      rsvpTitle: 'הרשמה לאירוע',
      firstName: 'שם פרטי',
      lastName: 'שם משפחה',
      phone: 'מספר טלפון',
      notes: 'משהו שכדאי שנדע? (אופציונלי)',
      sendRsvp: 'שליחת הרשמה',
      thanksRsvp: 'תודה! ההרשמה נקלטה — ניצור קשר בקרוב.',
      itinerary: 'מסלול הטיול',
      allEvents: '→ כל האירועים',
      eventNotFound: 'האירוע לא נמצא — ייתכן שהוא חלף או הוסר.',
      comingSoon: 'אירועים חדשים יפורסמו בקרוב — חזרו לבקר או עקבו ברשתות החברתיות.'
    }
  };

  // ---------------- Hebrew corrections from the sheet ----------------
  // The "Website Hebrew" tab of the Google Sheet lists English text
  // (column A) next to the Hebrew that should be shown for it (column B).
  // A row there wins over both the built-in Hebrew below and the machine
  // translation of sheet content. Matching ignores case, spacing and
  // quote/dash style. The last good copy is kept in localStorage so the
  // corrected text shows immediately on the next visit.
  var HE_SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
  var HE_SHEET_TAB = 'Website Hebrew';
  var HE_CACHE_KEY = 'siteHeFixes';
  var heFixes = {};
  try { heFixes = JSON.parse(localStorage.getItem(HE_CACHE_KEY)) || {}; } catch (e) { heFixes = {}; }

  function normKey(s) {
    return String(s == null ? '' : s)
      .replace(/[‘’‚′]/g, "'")
      .replace(/[“”„″]/g, '"')
      .replace(/[‐-―−]/g, '-')
      .replace(/[ ‎‏‪-‮]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // Corrected Hebrew for an English string, or the given fallback.
  function fixFor(en, fallback) {
    var k = normKey(en);
    return (k && Object.prototype.hasOwnProperty.call(heFixes, k)) ? heFixes[k] : fallback;
  }

  function parseFixCSV(text) {
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

  function applyFixesToDynamic() {
    Object.keys(dynamic.en).forEach(function (k) {
      dynamic.he[k] = fixFor(dynamic.en[k], builtInHe[k]);
    });
  }

  var fixesPromise = null;
  function loadFixes() {
    if (fixesPromise) return fixesPromise;
    var url = 'https://docs.google.com/spreadsheets/d/' + HE_SHEET_ID +
      '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(HE_SHEET_TAB);
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 4000); });
    var load = fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('fixes fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var rows = parseFixCSV(text);
        // Google returns the FIRST tab when the requested one is missing,
        // so require this tab's own header row.
        var head = rows[0] || [];
        if (normKey(head[0]).indexOf('english') !== 0 || normKey(head[1]).indexOf('hebrew') !== 0) {
          throw new Error('Website Hebrew tab not found');
        }
        var next = {};
        rows.slice(1).forEach(function (cols) {
          var en = (cols[0] || '').trim();
          var he = (cols[1] || '').trim();
          if (!en || !he) return;
          next[normKey(en)] = he;
          // A multi-line cell also corrects each of its lines on their own
          var enLines = en.split('\n'), heLines = he.split('\n');
          if (enLines.length > 1 && enLines.length === heLines.length) {
            enLines.forEach(function (line, i) {
              var k = normKey(line);
              if (k && heLines[i].trim() && !next[k]) next[k] = heLines[i].trim();
            });
          }
        });
        var before = JSON.stringify(heFixes);
        var after = JSON.stringify(next);
        heFixes = next;
        try { localStorage.setItem(HE_CACHE_KEY, after); } catch (e) {}
        applyFixesToDynamic();
        // Static text was already swapped using the cached copy — redo it
        // only if the sheet has changed since.
        if (before !== after && lang === 'he' && document.querySelector('.lang-toggle')) applyLang('he');
      })
      .catch(function (err) {
        console.warn('Hebrew corrections unavailable, using built-in text.', err);
      });
    fixesPromise = Promise.race([load, timeout]);
    return fixesPromise;
  }

  function stripTags(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html).replace(/<br\s*\/?>/gi, ' ');
    return d.textContent;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var builtInHe = {};
  Object.keys(dynamic.he).forEach(function (k) { builtInHe[k] = dynamic.he[k]; });
  applyFixesToDynamic();

  function buildI18n(l) {
    return {
      lang: l,
      t: dynamic[l],
      // Translate an array of strings for the current language.
      // English (or any failure) resolves to the originals untouched.
      translate: function (texts) {
        if (l !== 'he' || !texts.length) return Promise.resolve(texts);
        return loadFixes().then(function () {
          var out = texts.slice();
          var need = [];
          var needIdx = [];
          texts.forEach(function (text, i) {
            var fixed = fixFor(text, null);
            if (fixed !== null) out[i] = fixed;
            else if (String(text).trim()) { need.push(text); needIdx.push(i); }
          });
          if (!need.length) return out;
          return fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: need, target: 'he' })
          })
            .then(function (r) { if (!r.ok) throw new Error('translate ' + r.status); return r.json(); })
            .then(function (d) {
              if (d.translations && d.translations.length === need.length) {
                d.translations.forEach(function (tr, j) { out[needIdx[j]] = tr; });
              }
              return out;
            })
            .catch(function () { return out; });
        });
      }
    };
  }

  window.SITE_I18N = buildI18n(lang);
  if (lang === 'he') loadFixes();

  // Static text translations: selector → Hebrew. English originals are
  // captured from the page itself before the first swap.
  var T = [
    { s: '.logo', he: 'ד״ר גלית בן טובאל' },
    { s: '.logo-tagline', he: 'סופרת / חוקרת / מרצה' },
    { s: '.main-nav a[href="about.html"]', he: 'אודות' },
    { s: '.main-nav a[href="events.html"]', he: 'אירועים' },
    { s: '.main-nav a[href="topics.html"]', he: 'נושאים' },
    { s: '.main-nav a[href="shop.html"]', he: 'חנות' },
    { s: '.main-nav a[href="contact.html"]', he: 'צור קשר' },
    { s: '.site-footer', he: '© 2026 ד״ר גלית בן טובאל. כל הזכויות שמורות.' },
    // Home
    { s: '.hero-kicker', he: 'הצטרפו אליי למסע לגילוי מחדש של' },
    { s: '.hero-copy h1', he: 'החוכמה העתיקה<br>של האנושות', html: true },
    { s: '.hero-sub', he: 'יחד נחקור מה הידע הזה יכול ללמד אותנו על החיים היום.' },
    { s: '.discover-heading', he: 'גלו כיצד תבונה עתיקה יכולה להנחות את חייכם המודרניים.' },
    { s: '.card[href="shop.html"] h3', he: 'ספרים' },
    { s: '.card[href="shop.html"] p', he: 'בקרוב' },
    { s: '.card[href="topics.html"] h3', he: 'הרצאות' },
    { s: '.card[href="topics.html"] p', he: 'למידע נוסף' },
    { s: '.card[href="events.html"] h3', he: 'אירועים' },
    { s: '.card[href="events.html"] p', he: 'הצטרפו אליי' },
    { s: '.quote', he: '"התגליות של גלית מאירות את היכולות העוצמתיות של חקירה עצמית ואהבה, שיכולות לעזור לשנות את המציאות שלכם."' },
    { s: '.newsletter-title', he: 'הצטרפו לשיחה' },
    { s: '.newsletter p.lead', he: 'עדכונים בלעדיים וחוכמה בחינם, ישירות לתיבת הדואר שלכם.' },
    { s: '#newsletterForm input[name="name"]', he: 'השם שלכם', attr: 'placeholder' },
    { s: '#newsletterForm input[name="email"]', he: 'האימייל שלכם', attr: 'placeholder' },
    { s: '#newsletterForm button', he: 'הרשמה' },
    { s: '.popup-modal h3', he: 'הצטרפו לשיחה' },
    { s: '.popup-modal > p', he: 'הירשמו לעדכונים בלעדיים ולחוכמה בחינם, ישירות לתיבת הדואר שלכם.' },
    { s: '#popupForm label:nth-of-type(1)', he: 'שם: ', firstText: true },
    { s: '#popupForm label:nth-of-type(2)', he: 'אימייל: ', firstText: true },
    { s: '#popupForm button', he: 'הצטרפו לשיחה' },
    // Topics page
    { s: '.topics-banner h1', he: 'נושאים להרצאות' },
    { s: '.topics-banner p', he: 'הרצאות המגשרות בין חוכמה עתיקה לחיים מודרניים — גלו נושא למטה והצטרפו לשיחה.' },
    // Events page
    { s: '.events-page h1', he: 'אירועים' },
    { s: '.events-intro', he: 'הצטרפו אליי — הרצאות ומפגשים קרובים.' },
    { s: '.events-note', he: 'אירועים נוספים יפורסמו בקרוב — חזרו לבקר או עקבו ברשתות החברתיות.' },
    // About page
    { s: '.about-intro h1', he: 'גלית אביה בן טובאל היא אגיפטולוגית, ארכיאולוגית ומרצה למנהל עסקים, שעבודתה מגשרת בין חוכמה קוסמולוגית עתיקה לבין החיים המודרניים.' },
    { s: '.about-intro p:nth-of-type(1)', he: 'בעלת תואר דוקטור באגיפטולוגיה מהאוניברסיטה העברית בירושלים ותואר בפיתוח ארגוני מאוניברסיטת ג׳ורג׳טאון, עבודתה מושתתת על חקר החוכמה הקוסמולוגית העתיקה והקשר של האנושות אל הקדוש.' },
    { s: '.about-intro p:nth-of-type(2)', he: 'בתחילת דרכה הייתה גלית שקועה במחקר אקדמי ובחקר תרבויות עתיקות. כאשר נסגרה מחלקת האגיפטולוגיה שבה עבדה מסיבות תקציביות, נאלצה לעזוב את דרכה המקורית ולהפנות את חייה המקצועיים לעולם העסקים. במהלך העשורים שלאחר מכן בנתה קריירה ענפה בייעוץ ארגוני, והפכה למנכ״לית ובעלים של חברת ייעוץ המלווה חברות הייטק, בתי חולים ומנהיגים מהמגזר הציבורי והפרטי. היא מלמדת גם בבית הספר למנהל עסקים באוניברסיטת רייכמן, בהתמחות בהתנהגות ארגונית וניהול.' },
    { s: '.about-intro p:nth-of-type(3)', he: 'לפני כעשור, משבר אישי הפך לנקודת מפנה שהחזירה אותה לייעודה הראשון. גלית, שנמשכה שוב לארכיאולוגיה ולחקר עולמות עתיקים, החלה לחשוף גוף ידע קוסמולוגי עתיק — שנזנח זמן רב ובמקרים רבים הוסר מהנרטיבים ההיסטוריים השולטים — שבמרכזו ערכים של אהבה, אחדות, חוכמה, חירות ואחווה.' },
    { s: '.about-intro p:nth-of-type(4)', he: 'מאז שובה לשורשיה, היא מפתחת, מנסחת וחולקת תובנות אלה באמצעות מחקר, כתיבה והרצאות, עם המחפשים משמעות, תכלית וחיבור עמוקים יותר בעולם ההולך ומתפצל.' },
    // Simple pages (shop / contact)
    { s: '.simple-page h1', he: null, map: { 'Books': 'ספרים', 'Speaking & Contact': 'הרצאות ויצירת קשר' } },
    { s: '.simple-page p', he: null, map: {
      'Coming soon.': 'בקרוב.',
      'For speaking engagements and inquiries, reach out — details coming soon.': 'להזמנת הרצאות ולפניות, צרו קשר — פרטים בקרוב.'
    } },
    // Static topic pages
    { s: '.topic-page .back-link', he: '→ כל הנושאים' },
    { s: '.topic-page p', he: 'פרטים מלאים על הרצאה זו יפורסמו בקרוב. בינתיים, צרו קשר כדי להזמין את ד״ר גלית בן טובאל להרצאה בנושא זה.' },
    { s: '.topic-page .cta-button', he: 'הזמינו הרצאה זו' }
  ];

  function applyLang(next) {
    lang = next;
    localStorage.setItem(LANG_KEY, lang);
    window.SITE_I18N = buildI18n(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

    if (lang === 'he') loadFixes();

    T.forEach(function (entry) {
      document.querySelectorAll(entry.s).forEach(function (el) {
        if (entry.attr) {
          if (el.__en === undefined) el.__en = el.getAttribute(entry.attr) || '';
          el.setAttribute(entry.attr, lang === 'he' ? fixFor(el.__en, entry.he) : el.__en);
        } else if (entry.firstText) {
          var node = el.firstChild;
          if (!node || node.nodeType !== 3) return;
          if (el.__en === undefined) el.__en = node.nodeValue;
          var fixedLabel = fixFor(el.__en, null);
          node.nodeValue = lang === 'he' ? (fixedLabel !== null ? fixedLabel + ' ' : entry.he) : el.__en;
        } else if (entry.map) {
          var key = el.textContent.trim().replace(/\s+/g, ' ');
          if (el.__en === undefined) { el.__en = el.textContent; el.__enKey = key; }
          if (lang === 'he') {
            var mapped = fixFor(el.__enKey, entry.map[el.__enKey]);
            if (mapped) el.textContent = mapped;
          } else {
            el.textContent = el.__en;
          }
        } else if (entry.html) {
          if (el.__en === undefined) el.__en = el.innerHTML;
          if (lang === 'he') {
            // Keep the built-in line break unless the sheet text differs
            var fixedHtml = fixFor(stripTags(el.__en), null);
            el.innerHTML = (fixedHtml === null || normKey(fixedHtml) === normKey(stripTags(entry.he)))
              ? entry.he
              : escapeHtml(fixedHtml).replace(/\n/g, '<br>');
          } else {
            el.innerHTML = el.__en;
          }
        } else {
          if (el.__en === undefined) el.__en = el.textContent;
          el.textContent = lang === 'he' ? fixFor(el.__en, entry.he) : el.__en;
        }
      });
    });

    var toggle = document.querySelector('.lang-toggle');
    if (toggle) toggle.textContent = lang === 'he' ? 'English' : 'עברית';
    renderAccPanel();
  }

  // ---------------- Accessibility ----------------
  var ACC_OPTIONS = [
    { key: 'large', cls: 'acc-large', en: 'Larger text', he: 'טקסט גדול יותר' },
    { key: 'contrast', cls: 'acc-contrast', en: 'High contrast', he: 'ניגודיות גבוהה' },
    { key: 'dyslexia', cls: 'acc-dyslexia', en: 'Dyslexia-friendly font', he: 'גופן ידידותי לדיסלקציה' },
    { key: 'motion', cls: 'acc-motion', en: 'Reduce motion', he: 'הפחתת אנימציות' },
    { key: 'underline', cls: 'acc-underline', en: 'Underline links', he: 'קו תחתון לקישורים' }
  ];

  function getAcc() {
    try { return JSON.parse(localStorage.getItem(ACC_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function applyAcc() {
    var acc = getAcc();
    ACC_OPTIONS.forEach(function (o) {
      document.documentElement.classList.toggle(o.cls, !!acc[o.key]);
    });
  }

  var panelEl = null;
  function renderAccPanel() {
    if (!panelEl) return;
    var acc = getAcc();
    panelEl.innerHTML = '';
    var title = document.createElement('p');
    title.className = 'a11y-title';
    title.textContent = lang === 'he' ? fixFor('Accessibility', 'נגישות') : 'Accessibility';
    panelEl.appendChild(title);

    ACC_OPTIONS.forEach(function (o) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!acc[o.key];
      cb.addEventListener('change', function () {
        var a = getAcc();
        a[o.key] = cb.checked;
        localStorage.setItem(ACC_KEY, JSON.stringify(a));
        applyAcc();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + (lang === 'he' ? fixFor(o.en, o.he) : o.en)));
      panelEl.appendChild(label);
    });

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'a11y-reset';
    reset.textContent = lang === 'he' ? fixFor('Reset', 'איפוס') : 'Reset';
    reset.addEventListener('click', function () {
      localStorage.removeItem(ACC_KEY);
      applyAcc();
      renderAccPanel();
    });
    panelEl.appendChild(reset);
  }

  // ---------------- Build UI ----------------
  document.addEventListener('DOMContentLoaded', function () {
    // Language toggle in the header (top right)
    var header = document.querySelector('.site-header');
    if (header) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'lang-toggle';
      toggle.setAttribute('aria-label', 'Switch language / החלפת שפה');
      toggle.addEventListener('click', function () {
        var next = lang === 'he' ? 'en' : 'he';
        // Pages with sheet-driven content reload so it re-renders
        // (and machine-translates) in the new language.
        if (document.querySelector('.topics-accordion, .topics-list, #eventsList, #eventDetail, #aboutText')) {
          localStorage.setItem(LANG_KEY, next);
          location.reload();
        } else {
          applyLang(next);
        }
      });
      header.appendChild(toggle);
    }

    // Accessibility widget (floating, bottom corner)
    var widget = document.createElement('div');
    widget.className = 'a11y-widget';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'a11y-button';
    btn.setAttribute('aria-label', 'Accessibility options / אפשרויות נגישות');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 5h-6.5v13a1.5 1.5 0 0 1-3 0v-6h-1v6a1.5 1.5 0 0 1-3 0V7H3a1 1 0 0 1 0-2h18a1 1 0 0 1 0 2z"/></svg>';
    panelEl = document.createElement('div');
    panelEl.className = 'a11y-panel';
    btn.addEventListener('click', function () {
      var open = widget.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!widget.contains(e.target)) {
        widget.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    widget.appendChild(panelEl);
    widget.appendChild(btn);
    document.body.appendChild(widget);

    applyAcc();
    applyLang(lang);
  });
})();
