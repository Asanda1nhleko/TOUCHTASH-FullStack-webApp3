/* ================================================
   touchTash — Dashboard Extra JS (FIXED)
   ================================================ */

// ===== API BASE (SET THIS EXPLICITLY) =====
//const API_BASE = 'http://localhost:5000/api';

// ===== WHATSAPP =====
function openWhatsApp(message) {
    const phoneNumber = '27720000000';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// ===== AUTH HELPERS =====
function getToken() { return localStorage.getItem('tt_token'); }
function getUser()  { 
    try { return JSON.parse(localStorage.getItem('tt_user')); } 
    catch { return null; } 
}

// ===== API FETCH (with token handling) =====
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    
    // Handle 401 (Unauthorized) – redirect to login
    if (res.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error('Session expired. Please log in again.');
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
}

// ===== AUTH GUARD (with better handling) =====
(function authGuard() {
    const publicPages = ['index.html', 'login.html', 'register.html', 'booking.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If it's a protected page and user is NOT logged in → redirect to login
    if (!publicPages.includes(currentPage)) {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        // Optional: verify token is valid (backend check) – but let's keep it simple
    }
})();

// ===== SET GREETING =====
(function setGreeting() {
    const user = getUser();
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const el = document.getElementById('greetingText');
    if (el) el.textContent = `${greet}, ${user?.full_name || 'there'} 👋`;
    const dateEl = document.getElementById('greetingDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-ZA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
})();

// ===== LOAD BOOKINGS =====
let APPOINTMENTS = [];

async function loadBookings() {
    try {
        const response = await apiFetch('/bookings');
        APPOINTMENTS = response.bookings || response || [];
        console.log('Bookings loaded:', APPOINTMENTS.length);
        renderOverviewTable();
        renderDashboardStats();
        renderAllAppointments();
    } catch (err) {
        console.error('Could not load bookings:', err);
        showToast('Error', 'Could not load your bookings. Please refresh the page.', 'error');
    }
}

// ===== SIDEBAR NAVIGATION =====
const SECTIONS = ['overview', 'appointments', 'analytics'];

window.switchSection = function(name) {
    SECTIONS.forEach(s => {
        const el = document.getElementById('section-' + s);
        if (el) el.classList.toggle('d-none', s !== name);
    });
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
        a.classList.toggle('active', a.dataset.section === name);
    });
    if (name === 'analytics') initAnalytics();
    if (name === 'appointments') renderAllAppointments();
    window.location.hash = name;
};

// Handle hash on load
if (window.location.hash) {
    const section = window.location.hash.replace('#', '');
    if (SECTIONS.includes(section)) {
        setTimeout(() => switchSection(section), 100);
    }
}

// ===== SIDEBAR TOGGLE =====
window.closeSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
};

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }
    if (overlay) overlay.addEventListener('click', window.closeSidebar);
    
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section && SECTIONS.includes(section)) {
                switchSection(section);
            }
            if (window.innerWidth < 992) closeSidebar();
        });
    });
});

// ===== RENDER OVERVIEW TABLE =====
function renderOverviewTable() {
    const tbody = document.getElementById('apptTableBody');
    if (!tbody) return;

    const upcoming = APPOINTMENTS
        .filter(a => ['confirmed', 'pending'].includes(a.status))
        .slice(0, 4);

    if (!upcoming.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--light-gray)">📅 No upcoming appointments.</td></tr>`;
        return;
    }

    tbody.innerHTML = upcoming.map(a => `
        <tr>
            <td><div style="font-weight:600;font-size:0.875rem">${a.service_name || a.name || 'Service'}</div></td>
            <td>${a.barber_name || '—'}</td>
            <td>${formatDate(a.booking_date)}</td>
            <td>${a.booking_time || '—'}</td>
            <td><span class="badge-status ${a.status}">${cap(a.status)}</span></td>
            <td><button class="tbl-action" onclick="cancelAppt(${a.id})">Cancel</button></td>
        </tr>
    `).join('');
}

// ===== RENDER ALL APPOINTMENTS =====
function renderAllAppointments() {
    const filter = document.getElementById('apptFilter')?.value || 'all';
    const tbody = document.getElementById('allApptBody');
    if (!tbody) return;

    const list = filter === 'all' ? APPOINTMENTS : APPOINTMENTS.filter(a => a.status === filter);

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-gray)">📅 No appointments found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(a => `
        <tr>
            <td>${a.service_name || a.name || 'Service'}</td>
            <td>${a.barber_name || '—'}</td>
            <td>${formatDate(a.booking_date)}</td>
            <td>${a.booking_time || '—'}</td>
            <td>R${a.price || 150}</td>
            <td><span class="badge-status ${a.status}">${cap(a.status)}</span></td>
            <td>
                ${a.status === 'cancelled' || a.status === 'completed'
                    ? `<a href="booking.html" class="tbl-action">Rebook</a>`
                    : `<button class="tbl-action" onclick="updateStatus(${a.id},'confirmed')">Confirm</button>
                       <button class="tbl-action" onclick="cancelAppt(${a.id})" style="color:#ff3b30;">Cancel</button>`}
            </td>
        </tr>
    `).join('');
}

document.getElementById('apptFilter')?.addEventListener('change', renderAllAppointments);

// ===== UPDATE STATUS =====
async function updateStatus(id, status) {
    try {
        await apiFetch(`/bookings/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify({ status }) 
        });
        const appt = APPOINTMENTS.find(a => a.id === id);
        if (appt) appt.status = status;
        renderOverviewTable();
        renderAllAppointments();
        renderDashboardStats();
        showToast('Updated', `Booking status changed to ${status}.`, 'success');
    } catch (err) {
        showToast('Error', err.message || 'Could not update booking.', 'error');
    }
}

async function cancelAppt(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    await updateStatus(id, 'cancelled');
}

// ===== DASHBOARD STATS =====
function renderDashboardStats() {
    const totalBookings = APPOINTMENTS.length;
    const upcomingBookings = APPOINTMENTS.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
    const completedBookings = APPOINTMENTS.filter(b => b.status === 'completed').length;
    
    let totalSpent = 0;
    APPOINTMENTS.filter(b => b.status === 'completed').forEach(b => {
        totalSpent += b.price || 150;
    });

    const kpis = document.querySelectorAll('.kpi-num');
    if (kpis.length >= 3) {
        kpis[0].textContent = totalBookings;
        kpis[1].textContent = upcomingBookings;
        kpis[2].textContent = completedBookings;
    }
    
    const totalSpentEl = document.getElementById('totalSpent');
    if (totalSpentEl) totalSpentEl.textContent = `R${totalSpent}`;
    
    const profileStats = document.querySelectorAll('.profile-stat-num');
    if (profileStats.length >= 2) {
        profileStats[0].textContent = totalBookings;
        profileStats[1].textContent = upcomingBookings;
    }
    
    const badge = document.querySelector('.badge-count');
    if (badge) badge.textContent = upcomingBookings;
    
    const profileBookings = document.getElementById('profileBookings');
    if (profileBookings) profileBookings.textContent = totalBookings;
}

// ===== ANALYTICS =====
function initAnalytics() {
    console.log('Analytics initialized');
    showToast('Analytics', 'Analytics dashboard coming soon!', 'info');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(title, body, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `tt-toast ${type}`;
    toast.innerHTML = `<div class="tt-toast-title">${title}</div><div class="tt-toast-body">${body}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ===== CHATBOT =====
let chatOpen = false;

window.toggleChat = function() {
    chatOpen = !chatOpen;
    const win = document.getElementById('chatWindow');
    const badge = document.getElementById('chatFabBadge');
    if (!win) return;
    win.classList.toggle('open', chatOpen);
    if (badge) badge.style.display = 'none';
    if (chatOpen && !win.querySelector('.chat-msg')) {
        setTimeout(() => appendBotMsg('👋 Hey! I\'m <strong>TashBot</strong>, your barber assistant.<br>Ask me about prices, bookings, barbers, hours, or anything about our barber shop! 😊'), 300);
    }
};

window.sendChat = async function() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    appendUserMsg(text);
    
    const typingEl = appendTyping();
    
    try {
        const response = await fetch(`${API_BASE}/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ message: text })
        });
        
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        
        const data = await response.json();
        const botReply = data.botReply || _localBotReply(text);
        appendBotMsg(botReply);
    } catch (error) {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        console.error('Chat error:', error);
        appendBotMsg(_localBotReply(text));
    }
};

function _localBotReply(msg) {
    const t = msg.toLowerCase();
    if (t.includes('price') || t.includes('cost') || t.includes('how much'))
        return '💰 Our prices: Classic Haircut R120, Skin Fade R150, Beard Trim R80, Full Groom R220, Kids Cut R90, Hot Towel Shave R180.';
    if (t.includes('book') || t.includes('appointment') || t.includes('schedule'))
        return '📅 You can book on our <a href="booking.html">booking page</a>!';
    if (t.includes('barber') || t.includes('stylist') || t.includes('who cuts'))
        return '✂️ We have 4 expert barbers: Jordan K., Marcus D., Sipho M., and Thabo R.';
    if (t.includes('hour') || t.includes('open') || t.includes('time'))
        return '🕐 We are open Monday-Saturday: 8am-6pm, Sunday: 9am-2pm.';
    if (t.includes('location') || t.includes('address') || t.includes('where'))
        return '📍 We are at Shop 5, Mlazi Plaza, V Section, Mlazi, Durban, 4024.';
    if (t.includes('contact') || t.includes('phone') || t.includes('call'))
        return '📞 Call us at +27 31 000 0000 or email hello@touchtash.co.za.';
    if (t.includes('hello') || t.includes('hi') || t.includes('hey'))
        return '👋 Hello! Welcome to touchTash Barber. How can I help?';
    if (t.includes('review') || t.includes('rating'))
        return '⭐ Our customers rate us 4.9/5 stars!';
    if (t.includes('thank'))
        return '🙏 You\'re welcome! Have a great day! 😊';
    if (t.includes('help'))
        return '🆘 Ask me about: Prices, Booking, Barbers, Hours, Location, Contact info.';
    if (t.includes('wild') || t.includes('crazy') || t.includes('funny'))
        return '😄 We keep things fun with good music and friendly conversations! No wild stuff - just great haircuts! ✂️';
    return "🤔 Try asking about prices, booking, barbers, hours, or location!";
}

function appendUserMsg(text) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg user';
    el.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
}

function appendBotMsg(html) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg bot';
    el.innerHTML = `<div class="msg-bubble">${html}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
}

function appendTyping() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return null;
    const el = document.createElement('div');
    el.className = 'chat-msg bot';
    el.innerHTML = `<div class="msg-bubble"><span class="typing-dots">...</span></div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
}

document.getElementById('chatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.sendChat();
});

// ===== HELPERS =====
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== LOGOUT =====
window.logout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

// ===== EDIT PROFILE (placeholder) =====
window.editProfile = function() {
    showToast('Profile', 'Edit profile feature coming soon!', 'info');
};

// ===== NOTIFICATIONS (placeholder) =====
window.showNotifications = function() {
    showToast('Notifications', 'You have no new notifications', 'info');
};

// ===== LOAD ADMIN STATS =====
async function loadAdminStats() {
    const user = getUser();
    if (user?.role !== 'admin') return;
    try {
        const stats = await apiFetch('/admin/stats');
        console.log('Admin stats:', stats);
    } catch (err) {
        console.error('Could not load admin stats:', err);
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Only load bookings if on a dashboard page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'dashboard.html' || currentPage === 'admin-dashboard.html') {
        loadBookings();
    }
    loadAdminStats();
    
    const editProfileBtn = document.querySelector('.profile-body .btn-ghost');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Profile', 'Edit profile feature coming soon!', 'info');
        });
    }
    
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            showToast('Notifications', 'You have no new notifications', 'info');
        });
    }
});