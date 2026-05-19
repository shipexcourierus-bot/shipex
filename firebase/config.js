// ============================================================
// SWIFTSHIP — Firebase Configuration
// Replace these values with your actual Firebase project config
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyD4EwGJIdBY_UbGbmxNS6DlrKtYLVQ8TxU",
    authDomain: "swift-79e0a.firebaseapp.com",
    projectId: "swift-79e0a",
    storageBucket: "swift-79e0a.firebasestorage.app",
    messagingSenderId: "886461210461",
    appId: "1:886461210461:web:6f4421216a12979991d2b4",
    measurementId: "G-CM8WVQMV20"
  };

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ============================================================
// EmailJS Configuration
// Replace with your EmailJS credentials
// ============================================================
export const EMAILJS_CONFIG = {
  SERVICE_ID: "service_9bwgp33",
  TEMPLATE_ID: "template_7yt7wqh",
  PUBLIC_KEY: "hO5nniWy-LPjXZSc6",
  COMPANY_EMAIL: "shipexcourierUS@gmail.com"
};
