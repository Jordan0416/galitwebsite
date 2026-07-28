(function () {
  var field = document.getElementById('starfield');
  if (!field) return;

  var COUNT = 140;
  for (var i = 0; i < COUNT; i++) {
    var star = document.createElement('div');
    star.className = 'star';

    var size = Math.random() * 2.2 + 0.8;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = (Math.random() * 100) + '%';
    star.style.top = (Math.random() * 100) + '%';
    star.style.opacity = (Math.random() * 0.5 + 0.35).toFixed(2);

    var anims = [];
    if (Math.random() < 0.45) {
      var twinkleDur = (2 + Math.random() * 2.5).toFixed(2);
      var twinkleDelay = (Math.random() * 3.2).toFixed(2);
      anims.push('star-twinkle ' + twinkleDur + 's ease-in-out ' + twinkleDelay + 's infinite');
    }
    if (Math.random() < 0.5) {
      star.style.setProperty('--drift-x', (Math.random() * 18 - 9).toFixed(1) + 'px');
      star.style.setProperty('--drift-y', (Math.random() * 14 - 7).toFixed(1) + 'px');
      var driftDur = (7 + Math.random() * 6).toFixed(2);
      var driftDelay = (Math.random() * 4).toFixed(2);
      anims.push('star-drift ' + driftDur + 's ease-in-out ' + driftDelay + 's infinite alternate');
    }
    if (anims.length) {
      star.style.animation = anims.join(', ');
    }

    field.appendChild(star);
  }

  // A handful of shooting stars that streak across on their own random cadence.
  var SHOOTERS = 5;
  for (var j = 0; j < SHOOTERS; j++) {
    var shooter = document.createElement('div');
    shooter.className = 'shooting-star';
    shooter.style.top = (Math.random() * 55) + '%';
    shooter.style.left = (Math.random() * 60) + '%';
    shooter.style.animationDuration = (5.5 + Math.random() * 2.5).toFixed(2) + 's';
    shooter.style.animationDelay = (Math.random() * 12).toFixed(2) + 's';
    field.appendChild(shooter);
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
