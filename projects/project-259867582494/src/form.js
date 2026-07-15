// Client-side validation for contact + newsletter forms.
// No backend: simulates submission with a short delay and clear status.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setError(input, message) {
  const field = input.closest('.field');
  if (!field) return;
  const err = field.querySelector('.error');
  if (message) {
    field.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    if (err) err.textContent = message;
  } else {
    field.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    if (err) err.textContent = '';
  }
}

export function initForms() {
  const form = document.getElementById('contact-form');
  if (form) wireContact(form);

  const news = document.getElementById('newsletter-form');
  if (news) wireNewsletter(news);
}

function wireContact(form) {
  const status = document.getElementById('form-status');
  const name = form.querySelector('#cf-name');
  const email = form.querySelector('#cf-email');
  const message = form.querySelector('#cf-message');

  // Clear errors on input.
  [name, email, message].forEach((el) => {
    if (el) el.addEventListener('input', () => setError(el, ''));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;

    if (!name.value.trim()) { setError(name, 'Please enter your name.'); ok = false; }
    if (!email.value.trim() || !EMAIL_RE.test(email.value.trim())) {
      setError(email, 'Please enter a valid email.'); ok = false;
    }
    if (message.value.trim().length < 10) {
      setError(message, 'Tell us a little more (10+ characters).'); ok = false;
    }

    if (!ok) {
      if (status) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'form-status err'; }
      const firstInvalid = form.querySelector('.invalid input, .invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (status) { status.textContent = ''; status.className = 'form-status'; }

    // Simulated async submit.
    await new Promise((r) => setTimeout(r, 700));
    form.reset();
    if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
    if (status) {
      status.textContent = "Thanks! We'll be in touch within two business days.";
      status.className = 'form-status ok';
    }
  });
}

function wireNewsletter(form) {
  const input = form.querySelector('#nl-email');
  const status = form.querySelector('#nl-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = (input.value || '').trim();
    if (!EMAIL_RE.test(value)) {
      if (status) { status.textContent = 'Please enter a valid email.'; status.className = 'form-status err'; }
      input.focus();
      return;
    }
    form.reset();
    if (status) { status.textContent = "You're on the list — welcome!"; status.className = 'form-status ok'; }
  });
}
