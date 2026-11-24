// Home page slideshow. The slides come from the "Platform Copy" tab of the
// Google Sheet (see platform-copy.js); the list below is the same copy
// built in, shown until the sheet answers and kept if it can't be reached.
// A slide's sheet photo is used only once it has actually loaded — a Drive
// link that isn't shared publicly leaves the built-in photo in place.
(function () {
  var FALLBACK_IMAGES = [
    'assets/images/galitcrowd.png',
    'assets/images/slideshow3.jpeg',
    'assets/images/slideshow2.jpeg',
    'assets/images/about-portrait.jpg',
    'assets/images/slideshow4.png'
  ];
  var DOT_ICONS = ['assets/images/1.png', 'assets/images/2.png', 'assets/images/3.png', 'assets/images/4.png'];

  var slides = [
    {
      title: 'My name is Galit. I am an Egyptologist.',
      caption: 'My fascination with ancient civilizations has taken me to extraordinary places, uncovering stories, symbols, and traditions along the way.'
    },
    {
      title: 'Even as a child, I was fascinated by ancient mysteries.',
      caption: 'At 14, my father took me to see *Raiders of the Lost Ark*. I left the theater transformed. Inspired to pursue archaeology and eventually Egyptology, I dreamed of uncovering ancient biblical mysteries, including the Exodus and the lost Ark.'
    },
    {
      title: 'But life had other plans for me.',
      caption: 'Early in my career, I moved from the ancient world into the modern world of business and leadership, building a consulting practice focused on organizational values and leadership development.'
    },
    {
      title: 'Years later, my childhood dream found me again.',
      caption: 'A personal turning point drew me back to Egyptology, but this time I approached the ancient world through a more personal and spiritual lens. It’s a journey I’m still on today.'
    },
    {
      title: 'Oh, and I brought down rain in Africa!',
      caption: 'Out of this world? Maybe. True? Absolutely. It’s a story I still struggle to tell without sounding unbelievable. The full experience is captured on video and shared in depth in my book.'
    }
  ];
  slides.forEach(function (s, i) { s.img = FALLBACK_IMAGES[i]; });

  var FADE_MS = 200;

  var img = document.getElementById('aboutPhoto');
  var headingEl = document.querySelector('.about-photo-heading');
  var titleEl = document.getElementById('aboutPhotoTitle');
  var subtitleEl = document.getElementById('aboutPhotoSubtitle');
  var captionEl = document.getElementById('aboutPhotoCaption');
  var dotsWrap = document.getElementById('aboutDots');
  var prevBtn = document.getElementById('aboutPrev');
  var nextBtn = document.getElementById('aboutNext');
  if (!img || !dotsWrap) return;

  var dots = [];
  var current = 0;

  // *text* in the sheet becomes italics
  function setCaption(el, text) {
    el.textContent = '';
    String(text || '').split(/\*([^*]+)\*/).forEach(function (part, i) {
      if (!part) return;
      if (i % 2) {
        var em = document.createElement('em');
        em.textContent = part;
        el.appendChild(em);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function paint() {
    var s = slides[current];
    if (img.getAttribute('src') !== s.img) img.src = s.img;
    titleEl.textContent = s.title;
    if (subtitleEl) subtitleEl.textContent = s.subtitle || '';
    setCaption(captionEl, s.caption);
  }

  function show(i, instant) {
    current = (i + slides.length) % slides.length;
    dots.forEach(function (d, idx) {
      d.classList.toggle('active', idx === current);
    });
    if (instant) { paint(); return; }

    img.classList.add('is-fading');
    headingEl.classList.add('is-fading');
    captionEl.classList.add('is-fading');
    setTimeout(function () {
      paint();
      img.classList.remove('is-fading');
      headingEl.classList.remove('is-fading');
      captionEl.classList.remove('is-fading');
    }, FADE_MS);
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.className = 'dot';
      b.setAttribute('aria-label', 'Photo ' + (i + 1));
      var icon = document.createElement('img');
      icon.src = DOT_ICONS[i % DOT_ICONS.length];
      icon.alt = '';
      b.appendChild(icon);
      b.addEventListener('click', function () { show(i); });
      dotsWrap.appendChild(b);
      return b;
    });
  }

  function useSlides(next) {
    slides = next.map(function (s, i) {
      var slide = {
        title: s.title,
        caption: s.caption,
        img: FALLBACK_IMAGES[i] || FALLBACK_IMAGES[0]
      };
      if (s.img) {
        // Swap in the sheet's photo only if it really loads
        var probe = new Image();
        probe.onload = function () {
          slide.img = s.img;
          if (slides[current] === slide) img.src = s.img;
        };
        probe.src = s.img;
      }
      return slide;
    });
    buildDots();
    show(0, true);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });

  var hebrew = !!(window.SITE_I18N && window.SITE_I18N.lang === 'he');
  buildDots();
  // In Hebrew the built-in (English) text is held back until the sheet
  // copy has been translated, so it doesn't flash English first.
  if (hebrew) { dots[0].classList.add('active'); }
  else show(0, true);

  (window.PLATFORM_COPY || Promise.resolve(null)).then(function (copy) {
    if (copy && copy.slides && copy.slides.length) useSlides(copy.slides);
    else if (hebrew) show(0, true);
  });
})();
