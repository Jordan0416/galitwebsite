(function () {
  var slides = [
    {
      img: 'assets/images/galitcrowd.png',
      title: 'My name is Galit.',
      subtitle: 'I am an Egyptologist',
      caption: 'My life’s journey has carried me across geographies and through time—into ancient worlds and modern ones alike. Along the way, I’ve uncovered stories and wisdom that continue to shape how we live, lead, and understand ourselves. I’m excited to share these discoveries with you.'
    },
    {
      img: 'assets/images/slideshow2.jpeg',
      title: 'I am also a lecturer on leadership training',
      caption: 'Before delving back into exploring ancient worlds and the cosmos, I built a consulting practice guiding high-tech companies in leadership values and organizational principles.'
    },
    {
      img: 'assets/images/slideshow3.jpeg',
      title: 'The film Indiana Jones & Raiders of the Lost Ark changed my life!',
      caption: 'At 14, my father took me to see the film, and I left transformed—determined to become an archaeologist and uncover ancient Biblical mysteries, including the lost Ark.'
    },
    {
      img: 'assets/images/slideshow4.png',
      title: 'Oh, and I brought down rain in Africa',
      caption: 'Out of this world? Maybe. True? Absolutely. It’s a story I still struggle to tell without sounding unbelievable. The full experience is captured on video and shared in depth in my book, The Moon People.'
    }
  ];

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

  var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.dot'));
  var current = 0;
  var timer;

  function show(i) {
    current = (i + slides.length) % slides.length;

    dots.forEach(function (d, idx) {
      d.classList.toggle('active', idx === current);
    });

    img.classList.add('is-fading');
    headingEl.classList.add('is-fading');
    captionEl.classList.add('is-fading');

    setTimeout(function () {
      var s = slides[current];
      img.src = s.img;
      titleEl.textContent = s.title;
      subtitleEl.textContent = s.subtitle || '';
      captionEl.textContent = s.caption;
      img.classList.remove('is-fading');
      headingEl.classList.remove('is-fading');
      captionEl.classList.remove('is-fading');
    }, FADE_MS);
  }

  function goNext() { show(current + 1); }
  function goPrev() { show(current - 1); }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(goNext, 10000);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      show(i);
      startAutoplay();
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { goPrev(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goNext(); startAutoplay(); });

  show(0);
  startAutoplay();
})();
