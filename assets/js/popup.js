var POPUP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmAiL2g0LMTqI0WYRax8eoYvtOR_Ym3jfWkFl3L8wtv8Vh7Sn1cG6IFHV9WURblmh19Q/exec';
var POPUP_SEEN_KEY = 'galitPopupSeen';

document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.getElementById('popupOverlay');
  if (!overlay) return;

  if (localStorage.getItem(POPUP_SEEN_KEY)) return;

  var form = document.getElementById('popupForm');
  var status = document.getElementById('popupStatus');
  var closeBtn = document.getElementById('popupClose');

  function dismiss() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    localStorage.setItem(POPUP_SEEN_KEY, '1');
  }

  setTimeout(function () {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }, 1500);

  closeBtn.addEventListener('click', dismiss);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) dismiss();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) dismiss();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    status.textContent = 'Submitting...';

    fetch(POPUP_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new FormData(form)
    })
      .then(function () {
        status.textContent = "Thanks for joining! We'll be in touch.";
        setTimeout(dismiss, 1200);
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
        submitButton.disabled = false;
      });
  });
});
