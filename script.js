/* Minimal client-side interactivity for validation CTAs. */
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Survey modal controls
  const modal = document.getElementById('survey-modal');
  const openSurvey = document.getElementById('open-survey');
  const openSurveyFooter = document.getElementById('open-survey-footer');
  const closeEls = modal ? modal.querySelectorAll('[data-close]') : [];

  function openModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  if (openSurvey) openSurvey.addEventListener('click', openModal);
  if (openSurveyFooter) openSurveyFooter.addEventListener('click', openModal);
  closeEls.forEach((el) => el.addEventListener('click', closeModal));

  // Limit survey features selection to 3
  const surveyForm = document.getElementById('survey-form');
  if (surveyForm) {
    const status = document.getElementById('survey-status');
    const checkboxes = surveyForm.querySelectorAll('input[type="checkbox"][name="features"]');
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        const checked = surveyForm.querySelectorAll('input[name="features"]:checked');
        if (checked.length > 3) {
          cb.checked = false;
          if (status) status.textContent = 'Please select up to 3 features.';
        } else if (status) {
          status.textContent = '';
        }
      });
    });
    surveyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(surveyForm);
      const features = formData.getAll('features');
      const feedback = formData.get('feedback');
      if (status) status.textContent = 'Submitting...';
      fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, feedback })
      }).then(r => r.json()).then((res) => {
        if (res && res.ok) {
          if (status) status.textContent = 'Thanks for your feedback!';
          setTimeout(closeModal, 600);
          surveyForm.reset();
        } else {
          if (status) status.textContent = 'Something went wrong. Please try again later.';
        }
      }).catch(() => {
        if (status) status.textContent = 'Network error. Please try again later.';
      });
    });
  }

  // Waitlist form (local-only demo)
  const waitlistForm = document.getElementById('waitlist-form');
  if (waitlistForm) {
    const status = document.getElementById('wl-status');
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = /** @type {HTMLInputElement} */ (document.getElementById('wl-email'));
      if (!email || !email.value.includes('@')) {
        if (status) status.textContent = 'Enter a valid email.';
        return;
      }
      if (status) status.textContent = 'Submitting...';
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value })
      }).then(r => r.json()).then((res) => {
        if (res && res.ok) {
          if (status) status.textContent = 'Added! We will be in touch.';
          waitlistForm.reset();
        } else {
          if (status) status.textContent = 'Something went wrong. Please try again later.';
        }
      }).catch(() => {
        if (status) status.textContent = 'Can\'t reach server. Is it running on :8001?';
      });
    });
  }

  // Interest form (local-only demo)
  const interestForm = document.getElementById('interest-form');
  if (interestForm) {
    const status = document.getElementById('interest-status');
    interestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(interestForm);
      const interest = formData.get('interest');
      const price = formData.get('price');
      if (status) status.textContent = 'Submitting...';
      fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest, price })
      }).then(r => r.json()).then((res) => {
        if (res && res.ok) {
          if (status) status.textContent = 'Thanks! Your response helps us prioritize.';
          interestForm.reset();
        } else {
          if (status) status.textContent = 'Something went wrong. Please try again later.';
        }
      }).catch(() => {
        if (status) status.textContent = 'Can\'t reach server. Is it running on :8001?';
      });
    });
  }

  // Preorder button (non-binding)
  const preorderBtn = document.getElementById('preorder');
  if (preorderBtn) {
    const status = document.getElementById('preorder-status');
    preorderBtn.addEventListener('click', () => {
      if (status) status.textContent = 'Submitting...';
      fetch('/api/preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reserved: true })
      }).then(r => r.json()).then((res) => {
        if (res && res.ok) {
          if (status) status.textContent = 'Reservation noted — we will notify you first!';
        } else {
          if (status) status.textContent = 'Something went wrong. Please try again later.';
        }
      }).catch(() => {
        if (status) status.textContent = 'Can\'t reach server. Is it running on :8001?';
      });
    });
  }
})();


