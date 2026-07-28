(function () {
  var slides = [
    {
      img: 'assets/images/story-1.png',
      title: 'Indiana Jones & Raiders of the Lost Ark changed my life!',
      caption: 'At 14, my father took me to see the film, and I left transformed—determined to become an archaeologist and uncover ancient Biblical mysteries, including the lost Ark.'
    },
    {
      img: 'assets/images/story-2.png',
      title: 'I’m also a lecturer for leadership training',
      caption: 'Between periods of exploring ancient worlds and the cosmos, I delved into the world of business and built a consulting practice guiding high-tech companies in leadership values and organizational principles.'
    },
    {
      img: 'assets/images/story-3.png',
      title: 'I brought down rain in Africa',
      caption: 'Between periods of exploring ancient worlds and the cosmos, I delved into the world of business and built a consulting practice guiding high-tech companies in leadership values and organizational principles.'
    }
  ];

  var current = 0;
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var imgEl = document.getElementById('lightboxImg');
  var titleEl = document.getElementById('lightboxTitle');
  var captionEl = document.getElementById('lightboxCaption');
  var dotsWrap = document.getElementById('lightboxDots');

  slides.forEach(function (_, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    b.addEventListener('click', function () { render(i); });
    dotsWrap.appendChild(b);
  });

  function render(i) {
    current = (i + slides.length) % slides.length;
    var s = slides[current];
    imgEl.src = s.img;
    imgEl.alt = s.title;
    titleEl.textContent = s.title;
    captionEl.textContent = s.caption;
    Array.prototype.forEach.call(dotsWrap.children, function (d, idx) {
      d.classList.toggle('active', idx === current);
    });
  }

  function open(i) {
    render(i);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-slideshow]').forEach(function (el) {
    el.addEventListener('click', function () { open(0); });
  });

  document.getElementById('lightboxClose').addEventListener('click', close);
  document.getElementById('lightboxPrev').addEventListener('click', function () { render(current - 1); });
  document.getElementById('lightboxNext').addEventListener('click', function () { render(current + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') render(current - 1);
    if (e.key === 'ArrowRight') render(current + 1);
  });
})();
