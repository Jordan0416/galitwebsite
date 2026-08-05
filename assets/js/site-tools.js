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
      comingSoon: 'אירועים חדשים יפורסמו בקרוב — חזרו לבקר או עקבו ברשתות החברתיות.'
    }
  };

  window.SITE_I18N = { lang: lang, t: dynamic[lang] };

  // Static text translations: selector → Hebrew. English originals are
  // captured from the page itself before the first swap.
  var T = [
    { s: '.logo', he: 'ד״ר גלית בן טובל' },
    { s: '.logo-tagline', he: 'סופרת / חוקרת / מחנכת' },
    { s: '.main-nav a[href="about.html"]', he: 'אודות' },
    { s: '.main-nav a[href="events.html"]', he: 'אירועים' },
    { s: '.main-nav a[href="topics.html"]', he: 'נושאים' },
    { s: '.main-nav a[href="shop.html"]', he: 'חנות' },
    { s: '.main-nav a[href="contact.html"]', he: 'צור קשר' },
    { s: '.site-footer', he: '© 2026 ד״ר גלית בן טובל. כל הזכויות שמורות.' },
    // Home
    { s: '.hero-copy h1', he: 'הביטו למעלה!<br>יש תבונה ירחית מעליכם.', html: true },
    { s: '.hero-copy p', he: 'תרבויות עתיקות הבינו זאת.<br>לימוד מקצביה יכול לשנות את חייכם!!', html: true },
    { s: '.discover-heading', he: 'גלו כיצד תבונה עתיקה יכולה להנחות את חייכם המודרניים.' },
    { s: '.card[href="shop.html"] h3', he: 'ספרים' },
    { s: '.card[href="shop.html"] p', he: 'בקרוב' },
    { s: '.card[href="contact.html"] h3', he: 'הרצאות' },
    { s: '.card[href="contact.html"] p', he: 'למידע נוסף' },
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
    { s: '.about-intro h1', he: 'גלית אביה בן טובל היא אגיפטולוגית, ארכיאולוגית ומרצה למנהל עסקים, שעבודתה מגשרת בין חוכמה קוסמולוגית עתיקה לבין החיים המודרניים.' },
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
    { s: '.topic-page p', he: 'פרטים מלאים על הרצאה זו יפורסמו בקרוב. בינתיים, צרו קשר כדי להזמין את ד״ר גלית בן טובל להרצאה בנושא זה.' },
    { s: '.topic-page .cta-button', he: 'הזמינו הרצאה זו' }
  ];

  function applyLang(next) {
    lang = next;
    localStorage.setItem(LANG_KEY, lang);
    window.SITE_I18N = { lang: lang, t: dynamic[lang] };
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

    T.forEach(function (entry) {
      document.querySelectorAll(entry.s).forEach(function (el) {
        if (entry.attr) {
          if (el.__en === undefined) el.__en = el.getAttribute(entry.attr) || '';
          el.setAttribute(entry.attr, lang === 'he' ? entry.he : el.__en);
        } else if (entry.firstText) {
          var node = el.firstChild;
          if (!node || node.nodeType !== 3) return;
          if (el.__en === undefined) el.__en = node.nodeValue;
          node.nodeValue = lang === 'he' ? entry.he : el.__en;
        } else if (entry.map) {
          var key = el.textContent.trim().replace(/\s+/g, ' ');
          if (el.__en === undefined) el.__en = el.textContent;
          if (lang === 'he') {
            if (entry.map[key]) el.textContent = entry.map[key];
          } else {
            el.textContent = el.__en;
          }
        } else if (entry.html) {
          if (el.__en === undefined) el.__en = el.innerHTML;
          el.innerHTML = lang === 'he' ? entry.he : el.__en;
        } else {
          if (el.__en === undefined) el.__en = el.textContent;
          el.textContent = lang === 'he' ? entry.he : el.__en;
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
    title.textContent = lang === 'he' ? 'נגישות' : 'Accessibility';
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
      label.appendChild(document.createTextNode(' ' + (lang === 'he' ? o.he : o.en)));
      panelEl.appendChild(label);
    });

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'a11y-reset';
    reset.textContent = lang === 'he' ? 'איפוס' : 'Reset';
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
        applyLang(lang === 'he' ? 'en' : 'he');
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
