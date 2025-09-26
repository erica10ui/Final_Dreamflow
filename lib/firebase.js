const { initializeApp } = require("firebase/app");
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let analytics = null;

const firebaseReady = true;

module.exports = { app, analytics, db, auth, firebaseReady };