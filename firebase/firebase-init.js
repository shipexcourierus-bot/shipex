// ============================================================
// SWIFTSHIP — Firebase Initializer
// ============================================================
// Import this module wherever you need Firebase services.
// Replace the config values below with your Firebase project's
// actual credentials from the Firebase Console.
// ============================================================

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth }
  from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

// ── Replace with YOUR Firebase credentials ───────────────────
const firebaseConfig = {
    apiKey: "AIzaSyD4EwGJIdBY_UbGbmxNS6DlrKtYLVQ8TxU",
    authDomain: "swift-79e0a.firebaseapp.com",
    projectId: "swift-79e0a",
    storageBucket: "swift-79e0a.firebasestorage.app",
    messagingSenderId: "886461210461",
    appId: "1:886461210461:web:6f4421216a12979991d2b4",
    measurementId: "G-CM8WVQMV20"
  };
// ─────────────────────────────────────────────────────────────

// Singleton guard — prevents "duplicate app" errors when
// multiple modules import this file in the same page load.
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
