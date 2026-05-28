/* ============================================================
   SHIPEX COURIER — Admin Dashboard JavaScript
   ============================================================ */

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  getFirestore,
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, onSnapshot, query, orderBy,
  serverTimestamp, limit
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

// ── YOUR FIREBASE CONFIG ──────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyD4EwGJIdBY_UbGbmxNS6DlrKtYLVQ8TxU",
    authDomain: "swift-79e0a.firebaseapp.com",
    projectId: "swift-79e0a",
    storageBucket: "swift-79e0a.firebasestorage.app",
    messagingSenderId: "886461210461",
    appId: "1:886461210461:web:6f4421216a12979991d2b4",
    measurementId: "G-CM8WVQMV20"
  };
// ─────────────────────────────────────────────────────────

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db   = getFirestore(app);
const auth = getAuth(app);

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
let currentUser = null;

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    const name = user.email?.split('@')[0] || 'Admin';
    setEl('adminAvatar', name.charAt(0).toUpperCase());
    setEl('adminName',   name.charAt(0).toUpperCase() + name.slice(1));
    showDashboard();
  } else {
    showLogin();
  }
});

function showDashboard() {
  document.getElementById('authScreen').style.display     = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
  initDashboard();
}
function showLogin() {
  document.getElementById('authScreen').style.display     = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('adminEmail')?.value.trim();
  const password = document.getElementById('adminPassword')?.value;
  const errEl    = document.getElementById('authError');
  const btn      = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Signing in…';
  if (errEl) errEl.style.display = 'none';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (errEl) { errEl.textContent = 'Invalid email or password.'; errEl.style.display = 'block'; }
  } finally { btn.disabled = false; btn.textContent = 'Sign In to Dashboard'; }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => signOut(auth));

// ══════════════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════════════
const html       = document.documentElement;
const savedTheme = localStorage.getItem('ss-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

function applyThemeIcon(t) {
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}
applyThemeIcon(savedTheme);

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('ss-theme', next);
    applyThemeIcon(next);
  });
});

// ══════════════════════════════════════════════════════════
// SIDEBAR — mobile toggle with overlay
// ══════════════════════════════════════════════════════════
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebar?.classList.add('open');
  sidebarOverlay?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar?.classList.remove('open');
  sidebarOverlay?.classList.remove('visible');
  document.body.style.overflow = '';
}

document.getElementById('sidebarToggle')?.addEventListener('click', openSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

// Show hamburger on mobile
if (window.innerWidth < 768) {
  const t = document.getElementById('sidebarToggle');
  if (t) t.style.display = 'flex';
}
window.addEventListener('resize', () => {
  const t = document.getElementById('sidebarToggle');
  if (t) t.style.display = window.innerWidth < 768 ? 'flex' : 'none';
  if (window.innerWidth >= 768) closeSidebar();
});

// ══════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════
const PANEL_TITLES = {
  overview:       'Dashboard Overview',
  shipments:      'Shipment Management',
  'new-shipment': 'New Shipment',
  tracking:       'Live Tracking',
  chats:          'Customer Support',
  analytics:      'Analytics',
  settings:       'Settings'
};

function navigateTo(panel) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.dashboard-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.nav-item[data-panel="${panel}"]`)?.classList.add('active');
  document.getElementById(`panel-${panel}`)?.classList.add('active');
  setEl('pageTitle',  PANEL_TITLES[panel] || 'Dashboard');
  setEl('breadcrumb', PANEL_TITLES[panel] || panel);
  // Auto-close sidebar on mobile after navigating
  if (window.innerWidth < 768) closeSidebar();
}
window.navigateTo = navigateTo;

document.querySelectorAll('.nav-item[data-panel]').forEach(item =>
  item.addEventListener('click', () => navigateTo(item.dataset.panel))
);

// ══════════════════════════════════════════════════════════
// DASHBOARD INIT
// ══════════════════════════════════════════════════════════
function initDashboard() {
  loadOverviewStats();
  loadRecentShipments();
  setupShipmentForm();
  setupShipmentsTable();
  setupChatPanel();
  initCharts();
}

// ── Stats ─────────────────────────────────────────────────
async function loadOverviewStats() {
  try {
    const snap      = await getDocs(collection(db, 'shipments'));
    const shipments = snap.docs.map(d => d.data());
    setEl('statTotal',     shipments.length);
    setEl('statDelivered', shipments.filter(s => s.status === 'delivered').length);
    setEl('statTransit',   shipments.filter(s => s.status === 'in_transit').length);
    setEl('statPending',   shipments.filter(s => ['pending','processing'].includes(s.status)).length);

    const chatSnap = await getDocs(collection(db, 'chats'));
    const unread   = chatSnap.docs.filter(d => (d.data().unread || 0) > 0).length;
    const badge    = document.getElementById('chatBadge');
    const notif    = document.getElementById('notifDot');
    if (badge) { badge.textContent = unread; badge.style.display = unread ? 'flex' : 'none'; }
    if (notif)   notif.style.display = unread ? 'block' : 'none';
  } catch (err) {
    console.warn('loadOverviewStats:', err.message);
    ['statTotal','statDelivered','statTransit','statPending'].forEach(id => setEl(id, '0'));
  }
}

// ── Recent Shipments ──────────────────────────────────────
function loadRecentShipments() {
  const tbody = document.getElementById('recentShipmentsTbody');
  if (!tbody) return;
  try {
    const q = query(collection(db, 'shipments'), orderBy('createdAt','desc'), limit(10));
    onSnapshot(q, snap => {
      tbody.innerHTML = snap.empty
        ? '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400)">No shipments yet.</td></tr>'
        : snap.docs.map(d => buildRow(d.id, d.data())).join('');
    }, err => console.warn('recentShipments:', err.message));
  } catch (err) { console.warn(err.message); }
}

function buildRow(id, s) {
  const ST = {
    pending:      ['Pending',           'status-pending'],
    processing:   ['Processing',        'status-processing'],
    in_transit:   ['In Transit',        'status-transit'],
    out_delivery: ['Out for Delivery',  'status-transit'],
    delivered:    ['Delivered',         'status-delivered'],
    failed:       ['Failed',            'status-pending']
  };
  const [label, cls] = ST[s.status] || ST.pending;
  return `
    <tr>
      <td><span class="table-id">${esc(s.trackingId||'—')}</span></td>
      <td>${esc(s.senderName||'—')}</td>
      <td>${esc(s.receiverName||'—')}</td>
      <td>${esc(s.currentLocation||'—')}</td>
      <td><span class="status-badge ${cls}">${label}</span></td>
      <td>${esc(s.estimatedDelivery||'—')}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="cp-btn up" onclick="editShipment('${id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="cp-btn up" onclick="viewShipmentTracking('${id}')" title="Track"><i class="fas fa-satellite-dish"></i></button>
          <button class="cp-btn"    onclick="deleteShipmentConfirm('${id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
}

// ── All Shipments table ───────────────────────────────────
function setupShipmentsTable() {
  const searchEl = document.getElementById('shipmentSearch');
  const filterEl = document.getElementById('statusFilter');
  let all = [];
  try {
    const q = query(collection(db, 'shipments'), orderBy('createdAt','desc'));
    onSnapshot(q, snap => {
      all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTable(all);
    }, err => console.warn(err.message));
  } catch (err) { console.warn(err.message); }

  const filter = () => {
    const s  = (searchEl?.value || '').toLowerCase();
    const st = filterEl?.value || '';
    renderTable(all.filter(x =>
      (!s  || [x.trackingId,x.senderName,x.receiverName,x.currentLocation].some(f=>(f||'').toLowerCase().includes(s))) &&
      (!st || x.status === st)
    ));
  };
  searchEl?.addEventListener('input', filter);
  filterEl?.addEventListener('change', filter);
}

function renderTable(rows) {
  const tbody = document.getElementById('allShipmentsTbody');
  if (!tbody) return;
  tbody.innerHTML = rows.length
    ? rows.map(s => buildRow(s.id, s)).join('')
    : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400)">No shipments match.</td></tr>';
}

// ══════════════════════════════════════════════════════════
// SHIPMENT FORM  ←  core fix: checkpoint-based location selector
// ══════════════════════════════════════════════════════════
let checkpoints       = [];
let editingShipmentId = null;

function setupShipmentForm() {
  const modal  = document.getElementById('addCpModal');
  const cpForm = document.getElementById('cpForm');

  document.getElementById('addCheckpointBtn')?.addEventListener('click', () =>
    modal?.classList.add('open')
  );
  document.querySelector('#addCpModal .modal-close')?.addEventListener('click', () =>
    modal?.classList.remove('open')
  );

  cpForm?.addEventListener('submit', e => {
    e.preventDefault();
    checkpoints.push({
      location: document.getElementById('cpLocation')?.value.trim() || '',
      note:     document.getElementById('cpNote')?.value.trim()     || '',
      status:   document.getElementById('cpStatus')?.value          || 'pending',
      time:     document.getElementById('cpTime')?.value            || null
    });
    renderCheckpoints();
    rebuildLocationSelect();    // ← update dropdown whenever checkpoints change
    modal?.classList.remove('open');
    cpForm.reset();
  });

  document.getElementById('shipmentForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    await saveShipment(e.target);
  });
}

// ── Checkpoint list renderer ──────────────────────────────
function renderCheckpoints() {
  const list = document.getElementById('checkpointsList');
  if (!list) return;
  if (!checkpoints.length) {
    list.innerHTML = '<p style="color:var(--gray-400);font-size:0.88rem;padding:8px 0">No checkpoints added yet.</p>';
    return;
  }
  const STYLE = {
    pending:   ['rgba(100,116,139,0.12)','var(--gray-600)'],
    arrived:   ['rgba(245,158,11,0.12)', 'var(--amber-dark)'],
    in_transit:['rgba(27,79,216,0.12)',  'var(--blue)'],
    completed: ['rgba(16,185,129,0.12)', 'var(--success)']
  };
  list.innerHTML = checkpoints.map((cp, i) => {
    const [bg, color] = STYLE[cp.status] || STYLE.pending;
    const timeStr = cp.time ? new Date(cp.time).toLocaleString() : '—';
    return `
      <div class="checkpoint-row">
        <div class="cp-location">
          <i class="fas fa-map-marker-alt" style="color:var(--amber);margin-right:6px"></i>
          ${esc(cp.location)}
          ${cp.note ? `<span style="font-size:0.76rem;color:var(--gray-400);margin-left:8px">— ${esc(cp.note)}</span>` : ''}
        </div>
        <span class="cp-status-pill" style="background:${bg};color:${color}">${cp.status}</span>
        <div style="font-size:0.76rem;color:var(--gray-400)">${timeStr}</div>
        <div class="cp-actions">
          <button class="cp-btn up" onclick="moveCheckpoint(${i},-1)"><i class="fas fa-arrow-up"></i></button>
          <button class="cp-btn up" onclick="moveCheckpoint(${i},1)"><i class="fas fa-arrow-down"></i></button>
          <button class="cp-btn"    onclick="removeCheckpoint(${i})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');
}

window.moveCheckpoint = (i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= checkpoints.length) return;
  [checkpoints[i], checkpoints[j]] = [checkpoints[j], checkpoints[i]];
  renderCheckpoints(); rebuildLocationSelect();
};
window.removeCheckpoint = i => {
  checkpoints.splice(i, 1);
  renderCheckpoints(); rebuildLocationSelect();
};

// ── Rebuild the "Current Location" dropdown from checkpoints ─
function rebuildLocationSelect() {
  const select = document.getElementById('currentLocation');
  if (!select) return;

  // Remember current value
  const prev = select.value;

  // Build options: blank + each checkpoint location
  const opts = ['<option value="">— Select location —</option>'];
  checkpoints.forEach((cp, i) => {
    const selected = cp.location === prev ? ' selected' : '';
    opts.push(`<option value="${esc(cp.location)}"${selected}>${esc(cp.location)}</option>`);
  });
  select.innerHTML = opts.join('');

  // Listen for change → auto-mark that checkpoint as "arrived" and previous as "completed"
  select.onchange = () => {
    const chosen = select.value;
    checkpoints = checkpoints.map(cp => {
      if (cp.location === chosen) return { ...cp, status: 'arrived', time: cp.time || new Date().toISOString() };
      // if it was before the chosen one in the list, mark completed
      const chosenIdx  = checkpoints.findIndex(c => c.location === chosen);
      const thisIdx    = checkpoints.findIndex(c => c.location === cp.location);
      if (thisIdx < chosenIdx) return { ...cp, status: 'completed', time: cp.time || new Date().toISOString() };
      return cp;
    });
    renderCheckpoints();
  };
}

// ── Save / Update Shipment ────────────────────────────────
async function saveShipment(form) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Saving…';

  const v = id => document.getElementById(id)?.value.trim() || '';

  // Sync checkpoint statuses with chosen current location
  const chosenLocation = v('currentLocation');
  const chosenIdx      = checkpoints.findIndex(c => c.location === chosenLocation);

  const shipmentStatus   = v('shipmentStatus') || 'pending';
  const isLastCheckpoint = chosenIdx === checkpoints.length - 1;
  const isDelivered      = shipmentStatus === 'delivered';

  const syncedCheckpoints = checkpoints.map((cp, i) => {
    if (chosenIdx === -1) return cp;
    if (i < chosenIdx)    return { ...cp, status: 'completed', time: cp.time || new Date().toISOString() };
    if (i === chosenIdx) {
      // Final checkpoint + delivered status → mark completed (green ✓), not just arrived
      const finalStatus = (isLastCheckpoint && isDelivered) ? 'completed' : 'arrived';
      return { ...cp, status: finalStatus, time: cp.time || new Date().toISOString() };
    }
    return { ...cp, status: cp.status === 'completed' || cp.status === 'arrived' ? cp.status : 'pending' };
  });

  const data = {
    senderName:         v('senderName'),
    senderAddress:      v('senderAddress'),
    receiverName:       v('receiverName'),
    receiverAddress:    v('receiverAddress'),
    packageDescription: v('packageDesc'),
    weight:             v('weight'),
    deliveryType:       v('deliveryType'),
    estimatedDelivery:  v('estDelivery'),
    currentLocation:    chosenLocation,
    destination:        v('destination'),
    status:             shipmentStatus,
    shippingFee:        v('shippingFee'),
    carrier:            v('carrierName') || 'ShipEx Courier',
    checkpoints:        syncedCheckpoints,
    updatedAt:          serverTimestamp()
  };

  try {
    if (editingShipmentId) {
      await updateDoc(doc(db, 'shipments', editingShipmentId), data);
      showToast('Shipment updated — tracking page now reflects changes!');
      editingShipmentId = null;
    } else {
      const trackingId = generateTrackingId();
      await addDoc(collection(db, 'shipments'), {
        ...data, trackingId, createdAt: serverTimestamp()
      });
      const banner = document.getElementById('generatedTrackingId');
      const valEl  = document.getElementById('trackingIdValue');
      if (banner) banner.classList.add('visible');
      if (valEl)  valEl.textContent = trackingId;
      showToast(`Created! Tracking ID: ${trackingId}`);
    }
    form.reset();
    checkpoints = []; renderCheckpoints(); rebuildLocationSelect();
    loadOverviewStats();
    setTimeout(() => navigateTo('shipments'), 1500);
  } catch (err) {
    console.error('saveShipment:', err.code, err.message);
    showToast(`Save failed: ${err.message}`, 'error');
  } finally { btn.disabled = false; btn.textContent = 'Save Shipment'; }
}

window.editShipment = async id => {
  try {
    const snap = await getDoc(doc(db, 'shipments', id));
    if (!snap.exists()) { showToast('Not found','error'); return; }
    const s = snap.data();
    editingShipmentId = id;

    const map = {
      senderName:s.senderName, senderAddress:s.senderAddress,
      receiverName:s.receiverName, receiverAddress:s.receiverAddress,
      packageDesc:s.packageDescription, weight:s.weight,
      deliveryType:s.deliveryType, estDelivery:s.estimatedDelivery,
      destination:s.destination,
      shipmentStatus:s.status, shippingFee:s.shippingFee, carrierName:s.carrier
    };
    Object.entries(map).forEach(([k, v]) => {
      const el = document.getElementById(k);
      if (el && v != null) el.value = v;
    });

    checkpoints = Array.isArray(s.checkpoints) ? [...s.checkpoints] : [];
    renderCheckpoints();
    rebuildLocationSelect();

    // Now set the current location dropdown to saved value
    const locSelect = document.getElementById('currentLocation');
    if (locSelect && s.currentLocation) locSelect.value = s.currentLocation;

    navigateTo('new-shipment');
    showToast('Edit mode — update fields and save','warning');
  } catch (err) { console.error(err.message); showToast('Load error','error'); }
};

window.deleteShipmentConfirm = async id => {
  if (!confirm('Permanently delete this shipment?')) return;
  try { await deleteDoc(doc(db,'shipments',id)); loadOverviewStats(); showToast('Deleted'); }
  catch (err) { showToast('Delete failed','error'); }
};

window.viewShipmentTracking = async id => {
  try {
    const snap = await getDoc(doc(db,'shipments',id));
    if (snap.exists())
      window.open(`../tracking/?id=${encodeURIComponent(snap.data().trackingId)}`, '_blank');
  } catch { /**/ }
};

window.exportShipments = async () => {
  try {
    const snap = await getDocs(collection(db,'shipments'));
    const rows = [['Tracking ID','Sender','Receiver','Status','Location','Est. Delivery','Fee']];
    snap.forEach(d => { const s=d.data(); rows.push([s.trackingId,s.senderName,s.receiverName,s.status,s.currentLocation,s.estimatedDelivery,s.shippingFee]); });
    const csv = rows.map(r=>r.map(c=>`"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a   = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:'shipments.csv' });
    a.click(); showToast('CSV exported');
  } catch { showToast('Export failed','error'); }
};

window.adminTrack = () => {
  const id = document.getElementById('adminTrackInput')?.value.trim();
  if (id) window.open(`../tracking/?id=${encodeURIComponent(id)}`, '_blank');
  else showToast('Enter a tracking ID','warning');
};

window.resetForm = () => {
  document.getElementById('shipmentForm')?.reset();
  document.getElementById('generatedTrackingId')?.classList.remove('visible');
  checkpoints = []; editingShipmentId = null;
  renderCheckpoints(); rebuildLocationSelect();
};

function generateTrackingId() {
  const P=['SPX','LOG','SHX','PKG'], S=['NG','US','UK','GH','ZA','KE'];
  return `${P[Math.random()*P.length|0]}-${10000+Math.random()*89999|0}-${S[Math.random()*S.length|0]}`;
}

// ══════════════════════════════════════════════════════════
// CHAT PANEL
// ══════════════════════════════════════════════════════════
let activeChatId = null, chatUnsub = null;

function setupChatPanel() {
  loadChatList();
  document.getElementById('adminChatSend')?.addEventListener('click', sendAdminReply);
  document.getElementById('adminChatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminReply(); }
  });
  document.getElementById('resolveBtn')?.addEventListener('click', async () => {
    if (!activeChatId) return;
    try {
      await updateDoc(doc(db,'chats',activeChatId), { status:'resolved', unread:0 });
      activeChatId = null; showToast('Chat resolved');
      const msgs = document.getElementById('adminChatMessages');
      if (msgs) msgs.innerHTML = `<div style="text-align:center;margin:auto;color:var(--gray-400);padding:60px 20px">
        <i class="fas fa-check-circle" style="font-size:2.5rem;display:block;margin-bottom:16px;color:var(--success);opacity:0.5"></i>Chat resolved</div>`;
    } catch (err) { showToast(err.message,'error'); }
  });
}

function loadChatList() {
  const listEl = document.getElementById('adminChatList');
  if (!listEl) return;
  try {
    const q = query(collection(db,'chats'), orderBy('lastMessageAt','desc'));
    onSnapshot(q, snap => {
      listEl.innerHTML = '';
      if (snap.empty) { listEl.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:40px 20px;font-size:0.85rem">No chats yet.</p>'; return; }
      const colors = ['#3B82F6','#8B5CF6','#EC4899','#10B981','#F59E0B'];
      snap.docs.forEach((docSnap, i) => {
        const c       = docSnap.data();
        const initials= (c.customerName||'U').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        const timeStr = c.lastMessageAt?.toDate ? c.lastMessageAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '';
        const item    = document.createElement('div');
        item.className = `chat-list-item${activeChatId===docSnap.id?' active':''}`;
        item.innerHTML = `
          <div class="chat-list-avatar" style="background:${colors[i%colors.length]}">${initials}</div>
          <div class="chat-list-info">
            <div class="chat-list-name">${esc(c.customerName||'Unknown')}</div>
            <div class="chat-list-preview">${esc(c.lastMessage||'No messages')}</div>
          </div>
          <div class="chat-list-meta">
            <div class="chat-list-time">${timeStr}</div>
            ${(c.unread||0)>0?`<div class="unread-badge">${c.unread}</div>`:''}
          </div>`;
        item.addEventListener('click', () => openAdminChat(docSnap.id, c, item));
        listEl.appendChild(item);
      });
    }, err => console.warn(err.message));
  } catch (err) { console.warn(err.message); }
}

async function openAdminChat(chatId, chatData, itemEl) {
  activeChatId = chatId;
  if (chatUnsub) chatUnsub();
  document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
  itemEl?.classList.add('active');

  const hdr = document.getElementById('adminChatUserInfo');
  if (hdr) hdr.innerHTML = `
    <h4>${esc(chatData.customerName||'Customer')}</h4>
    <span>${esc(chatData.customerEmail||'')}${chatData.customerPhone?' · '+chatData.customerPhone:''}</span>`;

  const resolveBtn = document.getElementById('resolveBtn');
  if (resolveBtn) resolveBtn.style.display = 'inline-flex';

  try { await updateDoc(doc(db,'chats',chatId),{unread:0}); } catch {/*ok*/}

  try {
    const q = query(collection(db,'chats',chatId,'messages'), orderBy('createdAt','asc'));
    chatUnsub = onSnapshot(q, snap => {
      const container = document.getElementById('adminChatMessages');
      if (!container) return;
      container.innerHTML = '';
      snap.forEach(docSnap => {
        const m = docSnap.data();
        const isCustomer = m.sender === 'customer';
        const timeStr = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '';
        const div = document.createElement('div');
        div.className = `chat-msg ${isCustomer?'bot':'user'}`;
        div.innerHTML = `
          <div class="chat-msg-avatar"><i class="fas ${isCustomer?'fa-user':'fa-headset'}"></i></div>
          <div>
            <div class="chat-bubble">${esc(m.text||'')}</div>
            <div class="chat-time">${timeStr}</div>
          </div>`;
        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    }, err => console.warn(err.message));
  } catch (err) { console.warn(err.message); }
}

async function sendAdminReply() {
  if (!activeChatId) { showToast('Select a chat first','warning'); return; }
  const input = document.getElementById('adminChatInput');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  try {
    await addDoc(collection(db,'chats',activeChatId,'messages'), { text, sender:'admin', createdAt:serverTimestamp() });
    await updateDoc(doc(db,'chats',activeChatId), { lastMessage:text, lastMessageAt:serverTimestamp() });
  } catch (err) { showToast('Send failed','error'); }
}

// ══════════════════════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════════════════════
function initCharts() {
  const tryInit = () => {
    if (typeof Chart === 'undefined') { setTimeout(tryInit, 300); return; }
    const mk = (id, cfg) => { const el=document.getElementById(id); if(el) new Chart(el,cfg); };

    mk('deliveryChart', {
      type:'line',
      data:{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets:[{ label:'Deliveries', data:[12,19,15,25,32,28,40,35,42,38,50,55],
          borderColor:'#1B4FD8', backgroundColor:'rgba(27,79,216,0.08)', borderWidth:2, fill:true, tension:0.4,
          pointBackgroundColor:'#F59E0B', pointBorderColor:'white', pointBorderWidth:2, pointRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'}}, x:{grid:{display:false}} } }
    });

    mk('statusChart', {
      type:'doughnut',
      data:{ labels:['Delivered','In Transit','Pending','Processing'],
        datasets:[{ data:[42,28,18,12], backgroundColor:['#10B981','#1B4FD8','#94A3B8','#F59E0B'], borderWidth:0, hoverOffset:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
    });

    mk('deliveryChart2', {
      type:'bar',
      data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets:[
          { label:'Deliveries', data:[24,38,29,45,52,18,12], backgroundColor:'rgba(27,79,216,0.75)', borderRadius:6 },
          { label:'Pickups',    data:[18,30,22,38,44,15,10], backgroundColor:'rgba(245,158,11,0.75)', borderRadius:6 }
        ] },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{position:'bottom'}}, scales:{ y:{beginAtZero:true}, x:{grid:{display:false}} } }
    });
  };
  tryInit();
}

// ══════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div'); d.textContent=String(str); return d.innerHTML;
}

function showToast(msg, type='success') {
  let c = document.getElementById('toastContainer');
  if (!c) { c=document.createElement('div'); c.id='toastContainer'; c.className='toast-container'; document.body.appendChild(c); }
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.success}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.animation='toastIn 0.4s reverse'; setTimeout(()=>t.remove(),400); }, 3500);
}
window.showToastGlobal = showToast;
