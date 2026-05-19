/* ============================================================
   SHIPEX COURIER — Tracking Page JavaScript
   ============================================================ */

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  getFirestore,
  collection, doc, onSnapshot, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

// ══════════════════════════════════════════════════════════
// THEME & NAV
// ══════════════════════════════════════════════════════════
const html       = document.documentElement;
const savedTheme = localStorage.getItem('ss-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.innerHTML = savedTheme === 'dark'
    ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('ss-theme', next);
    themeToggle.innerHTML = next === 'dark'
      ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 0));

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.add('open');
  document.body.style.overflow = 'hidden';
});
document.getElementById('mobileNavClose')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.remove('open');
  document.body.style.overflow = '';
});

// ══════════════════════════════════════════════════════════
// TRACKING SEARCH
// ══════════════════════════════════════════════════════════
let currentShipment = null;
let unsubTracking   = null;

const trackInput  = document.getElementById('trackInput');
const trackBtn    = document.getElementById('trackBtn');
const trackResult = document.getElementById('trackResult');
const emptyState  = document.getElementById('emptyState');

window.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    if (trackInput) trackInput.value = id;
    searchTracking(id);
  }
});

trackBtn?.addEventListener('click', () => {
  const id = trackInput?.value.trim();
  if (!id) { showToast('Enter a tracking ID', 'warning'); return; }
  history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
  searchTracking(id);
});

trackInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') trackBtn?.click();
});

async function searchTracking(trackingId) {
  showLoading();
  if (unsubTracking) { unsubTracking(); unsubTracking = null; }
  if (emptyState) emptyState.style.display = 'none';

  try {
    // Try uppercase first, then exact
    for (const id of [trackingId.toUpperCase(), trackingId]) {
      const q    = query(collection(db, 'shipments'), where('trackingId', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        subscribeToShipment(snap.docs[0].id);
        return;
      }
    }
    // Nothing found — show demo
    renderTrackingResult(demoShipment(trackingId));
  } catch (err) {
    console.warn('searchTracking:', err.message);
    renderTrackingResult(demoShipment(trackingId));
  }
}

function subscribeToShipment(docId) {
  unsubTracking = onSnapshot(doc(db, 'shipments', docId), snap => {
    if (snap.exists()) {
      currentShipment = { id: snap.id, ...snap.data() };
      renderTrackingResult(currentShipment);
    } else {
      showNotFound('—');
    }
  }, err => { console.warn('snapshot:', err.message); showNotFound('—'); });
}

// ══════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════
function demoShipment(id) {
  return {
    trackingId:         id.toUpperCase(),
    status:             'in_transit',
    senderName:         'TechCorp Ltd',
    senderAddress:      'Lagos, Nigeria',
    receiverName:       'John Doe',
    receiverAddress:    'Abuja, Nigeria',
    packageDescription: 'Electronics — Laptop',
    weight:             '2.5 kg',
    deliveryType:       'Express',
    estimatedDelivery:  new Date(Date.now() + 2 * 86400000)
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    currentLocation:    'Port Harcourt Hub',
    shippingFee:        '₦8,500',
    carrier:            'ShipEx Courier',
    checkpoints: [
      { location: 'Lagos Warehouse',       status: 'completed',  note: 'Package received and processed',   time: new Date(Date.now() - 3 * 86400000).toISOString() },
      { location: 'Benin Transit Hub',     status: 'completed',  note: 'Forwarded to next facility',       time: new Date(Date.now() - 2 * 86400000).toISOString() },
      { location: 'Port Harcourt Hub',     status: 'arrived',    note: 'Arrived at sorting facility',     time: new Date(Date.now() - 86400000).toISOString() },
      { location: 'Abuja Delivery Center', status: 'pending',    note: 'Awaiting dispatch',               time: null },
      { location: 'Delivered — Abuja',     status: 'pending',    note: 'Final delivery to receiver',      time: null }
    ]
  };
}

// ══════════════════════════════════════════════════════════
// CORE RENDER
// ══════════════════════════════════════════════════════════
function renderTrackingResult(shipment) {
  if (!trackResult) return;
  trackResult.classList.add('visible');
  currentShipment = shipment;

  const checkpoints  = Array.isArray(shipment.checkpoints) ? shipment.checkpoints : [];
  const isFailed     = ['failed', 'returned'].includes(shipment.status);
  const isDelivered  = shipment.status === 'delivered';

  // ── Work out what the "current" and "next" checkpoints are ──
  // currentIdx  = last checkpoint that is completed OR arrived
  // nextIdx     = the one after it
  // inTransitIdx = the one whose status is 'in_transit' (left this stop, not at next yet)
  let currentIdx   = -1;
  let inTransitIdx = -1;

  checkpoints.forEach((cp, i) => {
    if (cp.status === 'completed' || cp.status === 'arrived') currentIdx = i;
    if (cp.status === 'in_transit') inTransitIdx = i;
  });

  const nextIdx = currentIdx < checkpoints.length - 1 ? currentIdx + 1 : -1;

  // ── Journey progress percentage ──────────────────────────
  // Each segment between checkpoints is worth 100 / (n-1) points.
  // completed → full segment value
  // arrived   → full segment value
  // in_transit → half a segment (midpoint between prev and next)
  // failed    → progress reverts to where it was before the failure
  let progressPct = 0;

  if (checkpoints.length > 1) {
    const segmentPct = 100 / (checkpoints.length - 1);

    if (isFailed) {
      // Show progress regressing — fill only to where package currently IS, then subtract half a segment
      const failedAt = Math.max(0, currentIdx);
      progressPct = Math.max(0, failedAt * segmentPct - segmentPct * 0.5);
    } else if (isDelivered) {
      progressPct = 100;
    } else if (inTransitIdx !== -1) {
      // Package left inTransitIdx, halfway to next
      progressPct = (inTransitIdx * segmentPct) + (segmentPct * 0.5);
    } else if (currentIdx !== -1) {
      if (shipment.status === 'in_transit' || shipment.status === 'out_delivery') {
        // Status says it's moving but no explicit in_transit checkpoint —
        // show midpoint between current and next
        progressPct = (currentIdx * segmentPct) + (segmentPct * 0.5);
      } else {
        // arrived / at this checkpoint
        progressPct = currentIdx * segmentPct;
      }
    }
  } else if (isDelivered) {
    progressPct = 100;
  }

  progressPct = Math.min(100, Math.max(0, progressPct));

  // ── Human-readable journey status line ───────────────────
  const currentCp = currentIdx >= 0 ? checkpoints[currentIdx] : null;
  const nextCp    = nextIdx   >= 0 ? checkpoints[nextIdx]    : null;

  let journeyStatusHtml = '';
  let journeyStatusClass = '';

  if (isFailed) {
    journeyStatusClass = 'failed-text';
    journeyStatusHtml  = `
      <i class="fas fa-rotate-left"></i>
      <span>Shipment could not be delivered — package is being returned</span>`;
  } else if (isDelivered) {
    journeyStatusHtml = `
      <i class="fas fa-check-circle" style="color:var(--success)"></i>
      <span style="color:var(--success)">Package delivered successfully!</span>`;
  } else if (shipment.status === 'in_transit' || shipment.status === 'out_delivery') {
    if (currentCp && nextCp) {
      journeyStatusHtml = `
        <i class="fas fa-truck"></i>
        <span>Was at <strong>${esc(currentCp.location)}</strong> — now heading to <strong>${esc(nextCp.location)}</strong></span>`;
    } else if (currentCp) {
      journeyStatusHtml = `
        <i class="fas fa-truck"></i>
        <span>Departed <strong>${esc(currentCp.location)}</strong> — out for delivery</span>`;
    } else {
      journeyStatusHtml = `<i class="fas fa-truck"></i><span>Package is in transit</span>`;
    }
  } else if (shipment.status === 'processing') {
    journeyStatusHtml = `<i class="fas fa-gear"></i><span>Package is being processed for dispatch</span>`;
  } else if (currentCp) {
    journeyStatusHtml = `
      <i class="fas fa-location-dot"></i>
      <span>Package is currently at <strong>${esc(currentCp.location)}</strong></span>`;
  } else {
    journeyStatusHtml = `<i class="fas fa-box"></i><span>Shipment created — awaiting pickup</span>`;
  }

  // ── Build step timeline HTML ──────────────────────────────
  const stepsHtml = checkpoints.map((cp, i) => {
    // Determine visual state for this step
    let stepCls   = 'step-pending';
    let iconHtml  = '<i class="fas fa-circle-dot"></i>';
    let sublabel  = '';
    let lineHtml  = '';

    if (isFailed && i <= currentIdx) {
      stepCls  = 'step-failed';
      iconHtml = i < currentIdx
        ? '<i class="fas fa-check"></i>'
        : '<i class="fas fa-triangle-exclamation"></i>';
    } else if (cp.status === 'completed') {
      stepCls  = 'step-done';
      iconHtml = '<i class="fas fa-check"></i>';
      sublabel = `<span class="step-sublabel done-tag"><i class="fas fa-check"></i> Passed</span>`;
    } else if (cp.status === 'arrived') {
      // Package is HERE right now
      stepCls  = 'step-active';
      iconHtml = '<i class="fas fa-location-dot"></i>';
      sublabel = `<span class="step-sublabel here-tag"><i class="fas fa-location-dot"></i> Package is here now</span>`;
    } else if (cp.status === 'in_transit') {
      // Package HAS LEFT this stop — heading to next
      stepCls  = 'step-in-transit';
      iconHtml = '<i class="fas fa-truck"></i>';
      const dest = checkpoints[i + 1] ? checkpoints[i + 1].location : 'next stop';
      sublabel = `<span class="step-sublabel transit-tag"><i class="fas fa-truck"></i> Left here — en route to ${esc(dest.split(',')[0])}</span>`;
    }

    const timeStr = cp.time ? new Date(cp.time).toLocaleString() : 'Scheduled';

    // Line fill animation — calculate how much of the line below this step to fill
    let lineFillPct = 0;
    let lineFillClass = '';

    if (cp.status === 'completed' || (isFailed && i < currentIdx)) {
      lineFillPct = 100;
      lineFillClass = isFailed ? 'reversed' : '';
    } else if ((cp.status === 'arrived' || cp.status === 'in_transit') && !isFailed) {
      // Half-fill the line going down toward next checkpoint
      lineFillPct = cp.status === 'in_transit' ? 50 : 0;
    } else if (isFailed && i === currentIdx) {
      lineFillPct = 30;
      lineFillClass = 'reversed';
    }

    lineHtml = `<div class="step-line-fill ${lineFillClass}" style="height:${lineFillPct}%"></div>`;

    return `
      <div class="track-step ${stepCls}">
        <div class="step-icon-wrap">
          <div class="step-icon">${iconHtml}</div>
          <div class="step-line">${lineHtml}</div>
        </div>
        <div class="step-content">
          <div class="step-title">${esc(cp.location)}</div>
          <div class="step-desc">${esc(cp.note || '')}</div>
          ${sublabel}
          <div class="step-time">${timeStr}</div>
        </div>
      </div>`;
  }).join('');

  // ── Route visual ──────────────────────────────────────────
  const ROUTE_ICONS = ['fa-box', 'fa-warehouse', 'fa-truck', 'fa-flag-checkered', 'fa-house'];
  const routeHtml = checkpoints.map((cp, i) => {
    const isDone   = cp.status === 'completed' || (isFailed && i < currentIdx);
    const isActive = cp.status === 'arrived';
    const isMoving = cp.status === 'in_transit';
    const isFail   = isFailed && i === currentIdx;

    const dotCls = isDone ? 'done' : (isActive || isMoving ? 'active' : '');
    const dotStyle = isActive
      ? 'box-shadow:0 0 0 6px rgba(245,158,11,0.2);animation:pulse 2s ease infinite'
      : isFail
        ? 'background:rgba(239,68,68,0.1);border-color:var(--danger);color:var(--danger)'
        : '';

    const labelStyle = isDone
      ? 'color:var(--success);font-weight:700'
      : (isActive || isMoving)
        ? 'color:var(--amber);font-weight:700'
        : isFail
          ? 'color:var(--danger)'
          : '';

    const icon = ROUTE_ICONS[Math.min(i, ROUTE_ICONS.length - 1)];

    const connectorFill = isDone ? 'done' : (isMoving ? 'half' : '');
    const connectorHtml = i < checkpoints.length - 1 ? `
      <div class="route-connector ${connectorFill}" style="${isMoving ? 'background:linear-gradient(90deg,var(--success) 0%,var(--amber) 50%,var(--gray-200) 50%,var(--gray-200) 100%)' : ''}"></div>
    ` : '';

    return `
      <div class="route-point">
        <div class="route-dot ${dotCls}" style="${dotStyle}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="route-label" style="${labelStyle}">${esc(cp.location.split(',')[0])}</div>
      </div>${connectorHtml}`;
  }).join('');

  // ── Transit history ───────────────────────────────────────
  const transitItems = checkpoints.filter(c => c.status !== 'pending');
  const transitHtml  = transitItems.length
    ? [...transitItems].reverse().map((cp, i) => `
        <div class="transit-item ${i === 0 ? 'latest' : ''}">
          <div class="transit-dot"></div>
          <div style="flex:1">
            <div class="transit-loc">${esc(cp.location)}</div>
            <div class="transit-status">${esc(cp.note || '')}</div>
            ${cp.time ? `<div class="transit-time">${new Date(cp.time).toLocaleString()}</div>` : ''}
          </div>
        </div>`).join('')
    : '<p style="color:var(--gray-400);font-size:0.88rem">No transit history yet.</p>';

  // ── Status map ────────────────────────────────────────────
  const STATUS_MAP = {
    pending:      ['Pending',           'status-pending'],
    processing:   ['Processing',        'status-processing'],
    in_transit:   ['In Transit',        'status-transit'],
    out_delivery: ['Out for Delivery',  'status-transit'],
    delivered:    ['Delivered',         'status-delivered'],
    failed:       ['Failed / Returned', 'status-pending'],
    returned:     ['Returned',          'status-pending']
  };
  const [statusLabel, statusCls] = STATUS_MAP[shipment.status] || STATUS_MAP.pending;

  // ── Final HTML ────────────────────────────────────────────
  trackResult.innerHTML = `
    <div class="container">
      <div class="track-result-grid">

        <!-- LEFT: Timeline + Progress -->
        <div class="track-card">
          <div class="track-card-header">
            <div>
              <div class="track-id-label">Tracking ID</div>
              <div class="track-id-value">${esc(shipment.trackingId)}</div>
            </div>
            <span class="status-badge ${statusCls}">${statusLabel}</span>
          </div>

          <!-- Journey progress bar -->
          <div class="journey-progress-wrap">
            <div class="journey-progress-header">
              <div class="journey-progress-label">Journey progress</div>
              <div class="journey-progress-pct ${isFailed ? 'failed-pct' : ''}" id="progressPctLabel">0%</div>
            </div>
            <div class="journey-progress-track">
              <div
                class="journey-progress-fill ${isFailed ? 'failed-fill' : ''}"
                id="journeyProgressFill"
                style="width:0%"
              ></div>
            </div>
            <div class="journey-status-text ${isFailed ? 'failed-text' : ''}" id="journeyStatusText">
              ${journeyStatusHtml}
            </div>
          </div>

          <!-- Step timeline -->
          <div class="track-steps">${stepsHtml}</div>
        </div>

        <!-- RIGHT: Shipment details + history -->
        <div>
          <div class="track-card" style="margin-bottom:20px">
            <div class="track-card-header">
              <div class="panel-card-title" style="font-size:1rem;font-weight:700;color:var(--navy)">
                Shipment Details
              </div>
              <span class="status-badge ${statusCls}">${statusLabel}</span>
            </div>
            <div style="padding:24px">
              <div class="shipment-info-grid">
                <div class="info-item">
                  <div class="info-label">Sender</div>
                  <div class="info-value">${esc(shipment.senderName || '—')}</div>
                  <div style="font-size:0.8rem;color:var(--gray-400);margin-top:2px">${esc(shipment.senderAddress || '')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Receiver</div>
                  <div class="info-value">${esc(shipment.receiverName || '—')}</div>
                  <div style="font-size:0.8rem;color:var(--gray-400);margin-top:2px">${esc(shipment.receiverAddress || '')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Current Location</div>
                  <div class="info-value">
                    <i class="fas fa-location-dot" style="color:var(--amber);margin-right:4px"></i>
                    ${esc(shipment.currentLocation || '—')}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Est. Delivery</div>
                  <div class="info-value">${esc(shipment.estimatedDelivery || '—')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Service</div>
                  <div class="info-value">${esc(shipment.deliveryType || '—')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Weight</div>
                  <div class="info-value">${esc(shipment.weight || '—')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Package</div>
                  <div class="info-value">${esc(shipment.packageDescription || '—')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Carrier</div>
                  <div class="info-value">${esc(shipment.carrier || 'ShipEx Courier')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transit history -->
          <div class="track-card">
            <div style="padding:24px">
              <div class="transit-history">
                <h4>Transit History</h4>
                ${transitHtml}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Route visual -->
      <div class="track-map">
        <h4>
          <i class="fas fa-route" style="color:var(--amber);margin-right:8px"></i>
          Package Journey
        </h4>
        <div class="route-visual">${routeHtml}</div>
      </div>

      <!-- Actions -->
      <div class="track-actions">
        <button class="btn btn-primary" onclick="window.print()">
          <i class="fas fa-print"></i> Print Details
        </button>
        <button class="btn btn-outline" onclick="downloadReceipt()">
          <i class="fas fa-download"></i> Download Receipt
        </button>
        <button class="btn btn-outline" onclick="generateQR()">
          <i class="fas fa-qrcode"></i> QR Code
        </button>
        <button class="btn btn-outline" onclick="shareTracking()">
          <i class="fas fa-share-alt"></i> Share
        </button>
      </div>
    </div>`;

  // Animate the progress bar after DOM is painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const fill  = document.getElementById('journeyProgressFill');
      const label = document.getElementById('progressPctLabel');
      if (fill)  fill.style.width = `${progressPct}%`;
      if (label) {
        // Count up the percentage number
        let cur = 0;
        const target = Math.round(progressPct);
        const step   = target / 40;
        const tick   = () => {
          cur = Math.min(cur + step, target);
          label.textContent = `${Math.round(cur)}%`;
          if (cur < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════
// STATES
// ══════════════════════════════════════════════════════════
function showNotFound(id) {
  if (!trackResult) return;
  trackResult.classList.add('visible');
  trackResult.innerHTML = `
    <div class="container">
      <div class="track-empty">
        <i class="fas fa-box-open"></i>
        <h3>Shipment Not Found</h3>
        <p>No shipment found for <strong>${esc(id)}</strong>.<br>
        Check the ID or <a href="../index.html#contact" style="color:var(--blue-light)">contact support</a>.</p>
        <a href="../index.html" class="btn btn-primary" style="margin-top:24px">
          <i class="fas fa-home"></i> Back to Home
        </a>
      </div>
    </div>`;
}

function showLoading() {
  if (!trackResult) return;
  trackResult.classList.add('visible');
  trackResult.innerHTML = `
    <div class="container" style="text-align:center;padding:80px 0">
      <div style="width:48px;height:48px;border:3px solid rgba(0,0,0,0.1);border-top-color:var(--amber);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 20px"></div>
      <p style="color:var(--gray-600)">Searching for your shipment…</p>
    </div>`;
}

// ══════════════════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════════════════
window.downloadReceipt = () => {
  if (!currentShipment) return;
  const lines = [
    'SHIPEX COURIER — SHIPMENT RECEIPT',
    '='.repeat(38),
    `Tracking ID : ${currentShipment.trackingId}`,
    `Status      : ${currentShipment.status}`,
    ``,
    `SENDER      : ${currentShipment.senderName}`,
    `              ${currentShipment.senderAddress}`,
    ``,
    `RECEIVER    : ${currentShipment.receiverName}`,
    `              ${currentShipment.receiverAddress}`,
    ``,
    `Package     : ${currentShipment.packageDescription}`,
    `Weight      : ${currentShipment.weight}`,
    `Service     : ${currentShipment.deliveryType}`,
    `Est.Delivery: ${currentShipment.estimatedDelivery}`,
    `Fee         : ${currentShipment.shippingFee}`,
    ``,
    '='.repeat(38),
    'ShipEx Courier · shipex.com'
  ];
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })),
    download: `ShipEx-${currentShipment.trackingId}.txt`
  });
  a.click();
};

window.generateQR = () => {
  if (!currentShipment) return;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:300px;text-align:center">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
        <i class="fas fa-times"></i>
      </button>
      <h3 style="margin-bottom:6px">QR Code</h3>
      <p style="font-size:0.82rem;color:var(--gray-600);margin-bottom:20px">${esc(currentShipment.trackingId)}</p>
      <img src="${qrUrl}" alt="QR" style="width:200px;height:200px;border-radius:12px;margin:0 auto;display:block" />
      <p style="font-size:0.75rem;color:var(--gray-400);margin-top:14px">Scan to track this shipment</p>
    </div>`;
  document.body.appendChild(overlay);
};

window.shareTracking = () => {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: `Track ${currentShipment?.trackingId} — ShipEx Courier`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('Tracking link copied!'));
  }
};

// ══════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showToast(msg, type = 'success') {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastIn 0.4s reverse';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}
