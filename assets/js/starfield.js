(function () {
  var field = document.getElementById('starfield');
  if (!field) return;

  var COUNT = 120;
  for (var i = 0; i < COUNT; i++) {
    var star = document.createElement('div');
    star.className = 'star';

    var size = Math.random() * 1.6 + 0.6;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = (Math.random() * 100) + '%';
    star.style.top = (Math.random() * 100) + '%';
    star.style.opacity = (Math.random() * 0.3 + 0.2).toFixed(2);

    var anims = [];
    if (Math.random() < 0.4) {
      var twinkleDur = (3 + Math.random() * 3).toFixed(2);
      var twinkleDelay = (Math.random() * 4).toFixed(2);
      anims.push('star-twinkle ' + twinkleDur + 's ease-in-out ' + twinkleDelay + 's infinite');
    }
    if (Math.random() < 0.75) {
      star.style.setProperty('--drift-x', (Math.random() * 30 - 15).toFixed(1) + 'px');
      star.style.setProperty('--drift-y', (Math.random() * 22 - 11).toFixed(1) + 'px');
      var driftDur = (5 + Math.random() * 5).toFixed(2);
      var driftDelay = (Math.random() * 4).toFixed(2);
      anims.push('star-drift ' + driftDur + 's ease-in-out ' + driftDelay + 's infinite alternate');
    }
    if (anims.length) {
      star.style.animation = anims.join(', ');
    }

    field.appendChild(star);
  }

  var hero = field.closest('.hero');
  var glow = document.getElementById('heroGlow');
  if (hero && glow) {
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      hero.style.setProperty('--mx', x + 'px');
      hero.style.setProperty('--my', y + 'px');
    });
  }

  var ticking = false;
  function updateParallax() {
    var y = window.scrollY || window.pageYOffset;
    field.style.transform = 'translateY(' + (y * 0.25) + 'px)';
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  updateParallax();
})();
