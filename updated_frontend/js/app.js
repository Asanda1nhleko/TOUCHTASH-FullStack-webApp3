/* ============================================================
   touchTash — Intelligent Barber Booking System
   js/app.js  — Connected to Backend API (http://localhost:5000)
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

/* ─────────────────────────────────────────
   AUTH HELPERS
───────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('tt_token');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('tt_user')); } catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('tt_token', token);
  localStorage.setItem('tt_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('tt_token');
  localStorage.removeItem('tt_user');
}
function isLoggedIn() {
  return !!getToken();
}

/* ─────────────────────────────────────────
   ✅ NO AUTH GUARD - Home page is PUBLIC!
   Users can browse the site without logging in.
   Only protected pages (dashboard, admin) check login.
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   API FETCH HELPER
───────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

/* ─────────────────────────────────────────
   NAVBAR SCROLL EFFECT
───────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.querySelector('.tt-navbar');
  if (!navbar) return;
  const handleScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();

/* ─────────────────────────────────────────
   SMOOTH ACTIVE NAV LINK
───────────────────────────────────────── */
(function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.tt-navbar .nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ─────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────── */
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
  const icon  = icons[type] || icons.info;
  const toast = document.createElement('div');
  toast.className = `tt-toast ${type}`;
  toast.innerHTML = `<i class="bi ${icon}"></i><div><strong>${title}</strong><span>${message}</span></div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ─────────────────────────────────────────
   FORM VALIDATION HELPER
───────────────────────────────────────── */
function validateField(field) {
  const value = field.value.trim();
  let error = '';
  if (value === '') {
    error = 'This field is required.';
  } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = 'Please enter a valid email address.';
  } else if (field.id === 'confirmPassword') {
    const pw = document.getElementById('password');
    if (pw && value !== pw.value) error = 'Passwords do not match.';
  } else if (field.type === 'password' && value.length < 6) {
    error = 'Password must be at least 6 characters.';
  }
  const feedback = field.parentElement.querySelector('.invalid-feedback')
    || field.closest('.mb-3')?.querySelector('.invalid-feedback');
  if (error) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    if (feedback) feedback.textContent = error;
    return false;
  } else {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    return true;
  }
}

function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  let valid = true;
  form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
    if (!validateField(field)) valid = false;
  });
  return valid;
}

/* ─────────────────────────────────────────
   LOGIN FORM — calls POST /api/auth/login
───────────────────────────────────────── */
(function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validateForm('loginForm')) {
      showToast('Oops!', 'Please fix the errors before continuing.', 'error');
      return;
    }
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in…';

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAuth(data.token, data.user);

      showToast(
        'Welcome back!',
        `Hello, ${data.user.full_name}! You are now logged in.`,
        'success'
      );
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (err) {
      showToast('Login Failed', err.message || 'Invalid email or password.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
    }
  });

  // Password toggle
  const toggle  = document.getElementById('togglePassword');
  const pwField = document.getElementById('password');
  if (toggle && pwField) {
    toggle.addEventListener('click', () => {
      const isText = pwField.type === 'text';
      pwField.type = isText ? 'password' : 'text';
      toggle.querySelector('i').className = `bi ${isText ? 'bi-eye' : 'bi-eye-slash'}`;
    });
  }
})();

/* ─────────────────────────────────────────
   REGISTER FORM — calls POST /api/auth/register
───────────────────────────────────────── */
(function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validateForm('registerForm')) {
      showToast('Oops!', 'Please fix the errors before continuing.', 'error');
      return;
    }
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account…';

    const full_name = document.getElementById('fullName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('password').value;

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password })
      });
      showToast('Account Created!', 'Welcome to touchTash. Please sign in.', 'success');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (err) {
      showToast('Registration Failed', err.message || 'Could not create account.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-person-check me-2"></i>Create Account';
    }
  });

  ['togglePassword', 'toggleConfirmPassword'].forEach(id => {
    const btn    = document.getElementById(id);
    const target = id === 'togglePassword' ? 'password' : 'confirmPassword';
    const field  = document.getElementById(target);
    if (btn && field) {
      btn.addEventListener('click', () => {
        const isText = field.type === 'text';
        field.type = isText ? 'password' : 'text';
        btn.querySelector('i').className = `bi ${isText ? 'bi-eye' : 'bi-eye-slash'}`;
      });
    }
  });
})();

/* ─────────────────────────────────────────
   BOOKING PAGE — loads barbers & services from API
   POST /api/bookings to submit
───────────────────────────────────────── */
(function initBookingPage() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const user = getUser();

  // Load barbers from backend
  async function loadBarbers() {
    const container = document.querySelector('.barbers-row, #barbersContainer, .barber-list');
    if (!container) return;
    try {
      const barbers = await apiFetch('/barbers');
      if (!barbers.length) return;
      container.innerHTML = barbers.map(b => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="barber-card" data-id="${b.id}" data-barber="${b.barber_name}" tabindex="0">
            <div class="barber-img">
              ${b.image_url
                ? `<img src="http://localhost:5000${b.image_url}" alt="${b.barber_name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
                : `<i class="bi bi-person-circle" style="font-size:2.5rem;color:var(--gold)"></i>`}
            </div>
            <div class="barber-name">${b.barber_name}</div>
            ${b.specialty ? `<div class="barber-specialty">${b.specialty}</div>` : ''}
          </div>
        </div>`).join('');
      initBarberSelection();
    } catch (err) {
      console.error('Could not load barbers:', err);
    }
  }

  // Load services from backend
  async function loadServices() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    try {
      const services = await apiFetch('/services');
      select.innerHTML = '<option value="">Choose a service…</option>' +
        services.map(s => `<option value="${s.id}">${s.service_name}${s.price ? ' — R' + s.price : ''}</option>`).join('');
    } catch (err) {
      console.error('Could not load services:', err);
    }
  }

  loadBarbers();
  loadServices();

  // Disable past dates
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Time slot selection
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('time-slot') && !e.target.classList.contains('disabled')) {
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      e.target.classList.add('selected');
      const hidden = document.getElementById('selectedTime');
      if (hidden) hidden.value = e.target.textContent.trim();
    }
  });

  // Submit booking
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const barberEl   = document.getElementById('selectedBarber');
    const timeEl     = document.getElementById('selectedTime');
    const serviceEl  = document.getElementById('serviceSelect');
    const dateEl     = document.getElementById('appointmentDate');
    const notesEl    = document.getElementById('bookingNotes') || document.getElementById('notes');
    const nameEl     = document.getElementById('customerName');

    const barber_id    = barberEl?.value;
    const booking_time = timeEl?.value;
    const service_id   = serviceEl?.value;
    const booking_date = dateEl?.value;
    const notes        = notesEl?.value || '';

    if (!barber_id || !booking_time || !service_id || !booking_date) {
      showToast('Incomplete', 'Please fill in all fields and select a barber & time slot.', 'error');
      return;
    }

    if (!isLoggedIn()) {
      showToast('Please log in', 'You must be logged in to make a booking.', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    const currentUser = getUser();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking…';

    try {
      const currentUser = getUser();

await apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify({
        user_id: currentUser.id,
        barber_id: parseInt(barber_id),
        service_id: parseInt(service_id),
        booking_date,
        booking_time,
        notes
    })
});
      showToast('Booking Confirmed!', `Your appointment is set for ${booking_date} at ${booking_time}.`, 'success');
      form.reset();
      document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      if (barberEl) barberEl.value = '';
      if (timeEl) timeEl.value = '';
    } catch (err) {
      showToast('Booking Failed', err.message || 'Could not create booking.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-calendar-check me-2"></i>Confirm Booking';
    }
  });
})();

/* ─────────────────────────────────────────
   BARBER CARD SELECTION
───────────────────────────────────────── */
function initBarberSelection() {
  const cards = document.querySelectorAll('.barber-card');
  const hiddenInput = document.getElementById('selectedBarber');

  cards.forEach(card => {
    card.addEventListener('click', function() {
      cards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      if (hiddenInput) hiddenInput.value = this.dataset.id || this.dataset.barber || '';
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') this.click();
    });
  });
}
// Run on page load for statically rendered barber cards
(function() {
  const cards = document.querySelectorAll('.barber-card');
  if (cards.length) initBarberSelection();
})();

/* ─────────────────────────────────────────
   HAIRSTYLE RECOMMENDATION ENGINE
   Calls POST /api/hairstyles/recommend
   Falls back to local data if API has no result
───────────────────────────────────────── */
const hairstyleRecommendations = {
  oval:   { straight:['Classic Taper','Pompadour','Side Part','Slick Back'], curly:['Taper Fade','Textured Curls','Mid Fade','Afro Taper'], wavy:['French Crop','Textured Quiff','Side Sweep','Casual Taper'], coarse:['Low Fade','Buzz Cut','Shape-Up','Skin Fade'] },
  round:  { straight:['High Fade','Pompadour','Mohawk','Faux Hawk'], curly:['High Top','Taper Fade','Defined Curls','Fro-Hawk'], wavy:['Quiff','Undercut Pompadour','Textured Crop','Comb Over'], coarse:['High Fade','Line Up','Hard Part','Skin Fade'] },
  square: { straight:['Crew Cut','Side Part','Ivy League','Classic Taper'], curly:['Low Taper','Soft Curls Taper','Textured Top','Mid Fade'], wavy:['Textured Crop','Casual Taper','Beach Waves','Relaxed Comb Over'], coarse:['Buzz Cut','Low Fade','Temple Fade','Short Box'] },
  heart:  { straight:['Textured Fringe','Side Part','Slick Back','Long Taper'], curly:['Curly Fringe','Low Fade Curls','Loose Curls','Undercut'], wavy:['Side Swept','Textured Quiff','Casual Waves','Relaxed Taper'], coarse:['Low Taper','Shape-Up','Temple Fade','Skin Fade'] },
  oblong: { straight:['Side Part','Textured Crop','Short Back & Sides','Classic Fade'], curly:['Low Fade','Natural Curls','Defined Taper','Afro Fade'], wavy:['Textured Taper','Relaxed Waves','Comb Over','Soft Fade'], coarse:['Low Fade','Temple Fade','Shape-Up','Buzz Cut'] },
};

(function initRecommendationWidget() {
  const form = document.getElementById('recForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const face = document.getElementById('faceShape')?.value;
    const hair = document.getElementById('hairType')?.value;
    if (!face || !hair) {
      showToast('Selection needed', 'Please choose both face shape and hair type.', 'error');
      return;
    }

    const container = document.getElementById('recResults');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Finding your best styles…</p>';

    let results = [];

    try {
      // Try the real backend first
      const apiData = await apiFetch('/hairstyles/recommend', {
        method: 'POST',
        body: JSON.stringify({ face_shape: face, hair_type: hair })
      });
      if (Array.isArray(apiData) && apiData.length) {
        results = apiData.map(s => s.style_name || s.name || JSON.stringify(s));
      }
    } catch (_) { /* fall through to local data */ }

    // Fallback to local lookup
    if (!results.length) {
      const group = hairstyleRecommendations[face.toLowerCase()];
      results = (group && group[hair.toLowerCase()]) || [];
    }

    if (!results.length) {
      container.innerHTML = '<p class="text-muted">No recommendations found for this combination.</p>';
      return;
    }

    container.innerHTML = `
      <p class="section-label mb-3">Recommended for you</p>
      <div class="row g-2">
        ${results.map(r => `
          <div class="col-6">
            <div class="rec-style-card">
              <div class="rec-style-img"><i class="bi bi-scissors"></i></div>
              <div>
                <div class="rec-style-name">${r}</div>
                <div class="rec-style-tag">Great match</div>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

/* ─────────────────────────────────────────
   REVIEWS SECTION — GET /api/reviews
───────────────────────────────────────── */
(function initReviewsSection() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  apiFetch('/reviews').then(reviews => {
    if (!reviews.length) {
      container.innerHTML = '<p class="text-muted text-center">No reviews yet. Be the first!</p>';
      return;
    }
    container.innerHTML = reviews.slice(0, 6).map(r => `
      <div class="col-md-4">
        <div class="testimonial-card">
          <div class="stars">${'★'.repeat(Math.min(5, r.rating || 5))}${'☆'.repeat(Math.max(0, 5 - (r.rating || 5)))}</div>
          <p class="review-comment">"${r.comment || ''}"</p>
          <div class="reviewer">
            <strong>${r.full_name || 'Anonymous'}</strong>
            ${r.barber_name ? `<span> · ${r.barber_name}</span>` : ''}
          </div>
        </div>
      </div>`).join('');
  }).catch(() => { /* reviews section optional, fail silently */ });
})();

/* ─────────────────────────────────────────
   REVIEW SUBMIT FORM — POST /api/reviews
───────────────────────────────────────── */
(function initReviewForm() {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!isLoggedIn()) {
      showToast('Please log in', 'You must be logged in to leave a review.', 'error');
      return;
    }
    const user      = getUser();
    const barber_id = document.getElementById('reviewBarber')?.value;
    const rating    = document.getElementById('reviewRating')?.value;
    const comment   = document.getElementById('reviewComment')?.value;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting…';

    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({  barber_id, rating, comment })
      });
      showToast('Review Submitted!', 'Thank you for your feedback.', 'success');
      form.reset();
    } catch (err) {
      showToast('Failed', err.message || 'Could not submit review.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-2"></i>Submit Review';
    }
  });
})();

/* ─────────────────────────────────────────
   CHATBOT — calls POST /api/chatbot
   toggleChat() and sendChat() are GLOBAL so
   HTML onclick attributes can reach them.
───────────────────────────────────────── */
let _chatOpen = false;

// Local fallback replies when backend is unreachable
function _localBotReply(msg) {
  const t = msg.toLowerCase();
  if (t.includes('price') || t.includes('cost') || t.includes('how much'))
    return 'Haircuts start from R120. Skin Fade R150, Beard Trim R80, Full Groom R220.';
  if (t.includes('book') || t.includes('appointment'))
    return 'You can make a booking on the <a href="booking.html">booking page</a>!';
  if (t.includes('barber') || t.includes('who'))
    return 'We have Jordan K., Marcus D., Sipho M., and Thabo R. available.';
  if (t.includes('hour') || t.includes('open') || t.includes('time'))
    return 'We are open Mon–Fri 8am–7pm, Saturday 8am–5pm, Sunday 9am–2pm.';
  if (t.includes('hello') || t.includes('hi') || t.includes('hey'))
    return 'Hello! Welcome to TouchTash Barber. How can I help you today?';
  if (t.includes('location') || t.includes('address') || t.includes('where'))
    return 'We are at 123 Florida Road, Morningside, Durban.';
  return "I'm not sure about that — try asking about prices, bookings, barbers, or opening hours!";
}

function _chatAppendUserMsg(text) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'chat-msg user';
  el.innerHTML = `<div class="msg-bubble">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function _chatAppendBotMsg(html) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'chat-msg bot';
  el.innerHTML = `<div class="msg-bubble">${html}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function _chatAppendTyping() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return null;
  const el = document.createElement('div');
  el.className = 'chat-msg bot _typing-indicator';
  el.innerHTML = `<div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// Called by onclick="toggleChat()" in HTML
window.toggleChat = function() {
  _chatOpen = !_chatOpen;
  const win   = document.getElementById('chatWindow');
  const badge = document.getElementById('chatFabBadge');
  if (!win) return;
  win.classList.toggle('open', _chatOpen);
  if (badge) badge.style.display = 'none';
  if (_chatOpen && !win.querySelector('.chat-msg')) {
    _chatAppendBotMsg('👋 Hey! I\'m <strong>TashBot</strong>, your barber assistant.<br>Ask me about prices, bookings, barbers, or hours!');
  }
  if (_chatOpen) document.getElementById('chatInput')?.focus();
};

// Called by onclick="sendChat()" and Enter key in HTML
window.sendChat = async function() {
  const input = document.getElementById('chatInput');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  _chatAppendUserMsg(text);

  const typing = _chatAppendTyping();

  try {
    const data = await apiFetch('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message: text })
    });
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    _chatAppendBotMsg(data.botReply || _localBotReply(text));
  } catch {
    // Backend unreachable — use local fallback so chatbot always works
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    _chatAppendBotMsg(_localBotReply(text));
  }
};

// Wire up Enter key for pages that don't use inline onkeydown
(function() {
  document.getElementById('chatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.sendChat();
  });
})();

/* ─────────────────────────────────────────
   DASHBOARD SIDEBAR TOGGLE (Mobile)
───────────────────────────────────────── */
(function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  if (!toggleBtn || !sidebar) return;

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });

  if (overlay) overlay.addEventListener('click', closeSidebar);

  sidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) closeSidebar();
    });
  });
})();

/* ─────────────────────────────────────────
   CONTACT FORM (Home Page)
───────────────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending…';
    setTimeout(() => {
      showToast('Message Sent!', 'We will get back to you within 24 hours.', 'success');
      form.reset();
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-2"></i>Send Message';
    }, 1500);
  });
})();

/* ─────────────────────────────────────────
   SCROLL REVEAL ANIMATION
───────────────────────────────────────── */
(function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.service-card, .style-card, .testimonial-card, .stat-card, .barber-card'
  );
  if (!elements.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
})();

/* ─────────────────────────────────────────
   NAV LOGOUT BUTTON
───────────────────────────────────────── */
(function initLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    clearAuth();
    showToast('Logged out', 'You have been signed out.', 'info');
    setTimeout(() => window.location.href = 'index.html', 800);
  });
})();

/* ─────────────────────────────────────────
   SHOW LOGGED-IN USER NAME IN NAV
───────────────────────────────────────── */
(function updateNavUser() {
  const user = getUser();
  const nameEl = document.getElementById('navUserName');

  if (nameEl && user?.full_name) {
    nameEl.textContent = user.full_name;
  }
})();