
const { initializeApp } = require("firebase/app");
const { getFirestore, connectFirestoreEmulator } = require("firebase/firestore");
const { getAuth, connectAuthEmulator } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyD2peZcEFItzlf7xVghBaQEzOwbpox54xA",
  authDomain: "finaled-17624.firebaseapp.com",
  projectId: "finaled-17624",
  storageBucket: "finaled-17624.firebasestorage.app",
  messagingSenderId: "109265291036",
  appId: "1:109265291036:web:8e116c4ff71691bb3f5cd9",
  measurementId: "G-GNLDS2HP31"
};

let app, db, auth, firebaseReady = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Configure offline persistence
  if (typeof window !== 'undefined') {
    // Web platform - enable offline persistence
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // Enable offline persistence by default
      enableNetwork(db).catch(console.warn);
    });
  }
  
  firebaseReady = true;
  console.log('LOG  🔥 Firebase initialized successfully');
} catch (error) {
  console.error('LOG  ❌ Firebase initialization failed:', error);
  firebaseReady = false;
}

let analytics = null;

// Enhanced error handling for Firebase operations
const withFirebaseErrorHandling = (operation, fallback = null) => {
  return async (...args) => {
    try {
      if (!firebaseReady) {
        throw new Error('Firebase not initialized');
      }
      return await operation(...args);
    } catch (error) {
      console.error('Firebase operation failed:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable' || error.message?.includes('fetch')) {
        console.warn('Network error detected, using fallback');
        return fallback;
      }
      
      throw error;
    }
  };
};

module.exports = { 
  app, 
  analytics, 
  db, 
  auth, 
  firebaseReady,
  withFirebaseErrorHandling
};