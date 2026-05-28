/* ============================================================
   SWIFTSHIP — Homepage JavaScript
   Self-contained Firebase init — no relative path issues.
   ============================================================ */

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  getFirestore,
  collection, addDoc, doc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

// ──────────────────────────────────────────────────────────
// ★ PASTE YOUR FIREBASE CREDENTIALS HERE (same as admin.js)
// ──────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyD4EwGJIdBY_UbGbmxNS6DlrKtYLVQ8TxU",
    authDomain: "swift-79e0a.firebaseapp.com",
    projectId: "swift-79e0a",
    storageBucket: "swift-79e0a.firebasestorage.app",
    messagingSenderId: "886461210461",
    appId: "1:886461210461:web:6f4421216a12979991d2b4",
    measurementId: "G-CM8WVQMV20"
  };
// ──────────────────────────────────────────────────────────

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

// ══════════════════════════════════════════════════════════
// LOADER
// ══════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 1200);
});

// ══════════════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════════════
const html       = document.documentElement;
const savedTheme = localStorage.getItem('ss-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

const themeToggle = document.getElementById('themeToggle');
function applyThemeIcon(theme) {
  if (themeToggle) themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
applyThemeIcon(savedTheme);

themeToggle?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ss-theme', next);
  applyThemeIcon(next);
});

// ══════════════════════════════════════════════════════════
// NAVBAR SCROLL
// ══════════════════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 20));

// ══════════════════════════════════════════════════════════
// MOBILE NAV
// ══════════════════════════════════════════════════════════
const mobileNav = document.getElementById('mobileNav');

document.getElementById('hamburger')?.addEventListener('click', () => {
  mobileNav?.classList.add('open');
  document.body.style.overflow = 'hidden';
});

document.getElementById('mobileNavClose')?.addEventListener('click', closeMobile);
mobileNav?.addEventListener('click', e => {
  if (e.target.tagName === 'A' || e.target === mobileNav) closeMobile();
});

function closeMobile() {
  mobileNav?.classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════════════════════════
new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  .observe.bind(
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  );

// Simpler reveal setup
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

// ══════════════════════════════════════════════════════════
// COUNTER ANIMATION
// ══════════════════════════════════════════════════════════
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting || e.target.dataset.counted) return;
    e.target.dataset.counted = '1';
    const target = parseInt(e.target.dataset.target);
    const suffix = e.target.dataset.suffix || '';
    const el     = e.target;
    const step   = target / (2000 / 16);
    let cur      = 0;
    const tick   = () => {
      cur = Math.min(cur + step, target);
      el.textContent = Math.floor(cur).toLocaleString() + suffix;
      if (cur < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

// ══════════════════════════════════════════════════════════
// FAQ ACCORDION
// ══════════════════════════════════════════════════════════
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question')?.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ══════════════════════════════════════════════════════════
// HERO TRACK INPUT
// ══════════════════════════════════════════════════════════
document.getElementById('heroTrackBtn')?.addEventListener('click', () => {
  const id = document.getElementById('heroTrackInput')?.value.trim();
  if (id) window.location.href = `tracking/?id=${encodeURIComponent(id)}`;
  else    showToast('Enter a tracking ID', 'warning');
});
document.getElementById('heroTrackInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('heroTrackBtn')?.click();
});

// ══════════════════════════════════════════════════════════
// NEWSLETTER
// ══════════════════════════════════════════════════════════
document.getElementById('newsletterForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const email      = emailInput?.value.trim();
  if (!email || !isValidEmail(email)) { showToast('Enter a valid email', 'error'); return; }
  try {
    await addDoc(collection(db, 'newsletter'), { email, createdAt: serverTimestamp() });
    showToast('Subscribed successfully!');
    e.target.reset();
  } catch (err) {
    console.warn('Newsletter:', err.message);
    showToast('Subscribed! (Configure Firebase to persist)', 'warning');
    e.target.reset();
  }
});

// ══════════════════════════════════════════════════════════
// CONTACT FORM
// ══════════════════════════════════════════════════════════
document.getElementById('contactForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data   = Object.fromEntries(new FormData(e.target));
  const btn    = e.target.querySelector('button[type="submit"]');
  if (!data.name || !data.email || !data.message) { showToast('Fill in all required fields', 'error'); return; }
  if (!isValidEmail(data.email))                  { showToast('Enter a valid email', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    await addDoc(collection(db, 'contact_messages'), { ...data, read: false, createdAt: serverTimestamp() });
    showToast('Message sent! We\'ll respond within 2 hours.');
    e.target.reset();
  } catch (err) {
    console.warn('Contact form:', err.message);
    showToast('Message received! (Configure Firebase to persist)', 'warning');
    e.target.reset();
  } finally {
    btn.disabled = false; btn.textContent = 'Send Message';
  }
});

// ══════════════════════════════════════════════════════════
// LIVE CHAT
// ══════════════════════════════════════════════════════════
let chatSessionId  = localStorage.getItem('ss-chat-session');
let chatUserData   = null;
let chatInitDone   = !!chatSessionId;
let chatUnsubscribe = null;

const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatWidget    = document.getElementById('chatWidget');
const chatMessages  = document.getElementById('chatMessages');
const chatInput     = document.getElementById('chatInput');
const chatModal     = document.getElementById('chatModal');

chatToggleBtn?.addEventListener('click', () => {
  const isOpen = chatToggleBtn.classList.contains('open');
  isOpen ? closeChat() : openChat();
});

document.getElementById('chatMinimizeBtn')?.addEventListener('click', closeChat);
document.getElementById('chatCloseBtn')?.addEventListener('click', closeChat);

function openChat() {
  chatWidget?.classList.add('open');
  chatToggleBtn?.classList.add('open');
  if (!chatInitDone) showChatModal();
  else               subscribeToChat();
}
function closeChat() {
  chatWidget?.classList.remove('open');
  chatToggleBtn?.classList.remove('open');
  if (chatUnsubscribe) { chatUnsubscribe(); chatUnsubscribe = null; }
}

function showChatModal() { chatModal?.classList.add('open'); }
function hideChatModal()  { chatModal?.classList.remove('open'); }

document.getElementById('chatModalForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name  = document.getElementById('chatName')?.value.trim();
  const email = document.getElementById('chatEmail')?.value.trim();
  const phone = document.getElementById('chatPhone')?.value.trim();

  if (!name || !email)       { showToast('Name and email required', 'error'); return; }
  if (!isValidEmail(email))  { showToast('Invalid email', 'error'); return; }

  chatUserData = { name, email, phone };
  hideChatModal();

  try {
    const docRef = await addDoc(collection(db, 'chats'), {
      customerName:  name,
      customerEmail: email,
      customerPhone: phone || '',
      status:        'open',
      unread:        0,
      lastMessage:   'Chat started',
      lastMessageAt: serverTimestamp(),
      createdAt:     serverTimestamp()
    });
    chatSessionId = docRef.id;
    localStorage.setItem('ss-chat-session', chatSessionId);
    chatInitDone = true;
    addBotMessage(`👋 Hi ${name.split(' ')[0]}! Welcome to ShipEx Courier support. How can we help you today?`);
    subscribeToChat();
  } catch (err) {
    console.warn('Chat init:', err.message);
    // Offline fallback — still show the chat UI
    chatSessionId = 'local-' + Date.now();
    localStorage.setItem('ss-chat-session', chatSessionId);
    chatInitDone = true;
    addBotMessage(`👋 Hi ${name.split(' ')[0]}! Welcome to ShipEx Courier support. How can we help?`);
  }
});

async function subscribeToChat() {
  if (!chatSessionId || chatSessionId.startsWith('local-')) return;
  try {
    const { onSnapshot: snap, query: q, orderBy: ob } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );
    const msgRef = collection(db, 'chats', chatSessionId, 'messages');
    chatUnsubscribe = snap(q(msgRef, ob('createdAt','asc')), snapshot => {
      if (!chatMessages) return;
      chatMessages.innerHTML = '';
      snapshot.forEach(docSnap => {
        const m = docSnap.data();
        appendChatBubble(m.text, m.sender === 'customer' ? 'user' : 'bot', m.createdAt?.toDate());
      });
    });
  } catch { /* offline */ }
}

document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);
chatInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

async function sendChatMessage() {
  const text = chatInput?.value.trim();
  if (!text) return;
  chatInput.value = '';
  appendChatBubble(text, 'user', new Date());

  try {
    if (chatSessionId && !chatSessionId.startsWith('local-')) {
      await addDoc(collection(db, 'chats', chatSessionId, 'messages'), {
        text, sender: 'customer', createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chatSessionId), {
        lastMessage: text, lastMessageAt: serverTimestamp(), unread: 1
      });
    }
  } catch { /* offline ok */ }

  // Auto-reply
  showTyping();
  setTimeout(() => {
    removeTyping();
    addBotMessage(autoReply(text));
  }, 1200 + Math.random() * 800);
}

function appendChatBubble(text, type, time) {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.className = `chat-msg ${type}`;
  el.innerHTML = `
    <div class="chat-msg-avatar">
      <i class="fas ${type === 'bot' ? 'fa-headset' : 'fa-user'}"></i>
    </div>
    <div>
      <div class="chat-bubble">${esc(text)}</div>
      <div class="chat-time">${time ? formatTime(time) : formatTime(new Date())}</div>
    </div>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addBotMessage(text) { appendChatBubble(text, 'bot', new Date()); }

function showTyping() {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.id = 'typingIndicator';
  el.className = 'chat-msg bot';
  el.innerHTML = `
    <div class="chat-msg-avatar"><i class="fas fa-headset"></i></div>
    <div class="typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function removeTyping() { document.getElementById('typingIndicator')?.remove(); }

function autoReply(text) {
  const t = text.toLowerCase();
  if (/track|package|shipment/.test(t))    return 'To track your package, visit our tracking page and enter your tracking ID. You can find it in your confirmation email. 📦';
  if (/delay|late|slow/.test(t))           return "We're sorry for the delay! Please share your tracking ID and we'll look into it immediately. 🔍";
  if (/hello|hi|hey|good/.test(t))         return 'Hello! 👋 How can I help you with your shipment today?';
  if (/price|cost|rate|quote/.test(t))     return 'Rates depend on weight, size and destination. Get a quote by filling our contact form or calling our hotline! 💬';
  if (/lost|missing|damaged/.test(t))      return "🚨 I'm escalating this right now. Please share your tracking ID and a team member will contact you within 2 hours.";
  if (/deliver|when|time/.test(t))         return 'Express: 1–2 days · Standard: 3–5 days · Economy: 7–14 days. Your exact date is on the tracking page. 📅';
  if (/cancel|return|refund/.test(t))      return 'For cancellations and returns, email support@shipex.com with your tracking ID. We respond within 4 hours.';
  return 'Thank you for reaching out! A support agent will be with you shortly. You can also call us at +1 (800) 794-SHIP. ⏰';
}

// ══════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function formatTime(d)   { return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showToast(msg, type = 'success') {
  let c = document.getElementById('toastContainer');
  if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.success}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation='toastIn 0.4s reverse'; setTimeout(()=>t.remove(),400); }, 3500);
}
