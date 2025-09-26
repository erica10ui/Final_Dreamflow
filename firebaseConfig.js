// firebaseConfig.js
const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getAuth } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyD2peZcEFItzlf7xVghBaQEzOwbpox54xA",
  authDomain: "finaled-17624.firebaseapp.com",
  projectId: "finaled-17624",
  storageBucket: "finaled-17624.firebasestorage.app",
  messagingSenderId: "109265291036",
  appId: "1:109265291036:web:8e116c4ff71691bb3f5cd9",
  measurementId: "G-GNLDS2HP31"
};

// Initialize app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore instance
const db = getFirestore(app);

// Auth instance
const auth = getAuth(app);

module.exports = { db, auth, app };

