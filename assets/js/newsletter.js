// Paste the Google Apps Script Web App URL here after deploying it (see setup instructions).
var NEWSLETTER_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmAiL2g0LMTqI0WYRax8eoYvtOR_Ym3jfWkFl3L8wtv8Vh7Sn1cG6IFHV9WURblmh19Q/exec';

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('newsletterForm');
  var status = document.getElementById('newsletterStatus');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (NEWSLETTER_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
      status.textContent = 'Signup form is not connected yet.';
      return;
    }

    var submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    status.textContent = 'Submitting...';

    fetch(NEWSLETTER_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new FormData(form)
    })
      .then(function () {
        status.textContent = "Thanks for joining! We'll be in touch.";
        form.reset();
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });
});
