// NOTE: This file is for demonstration/assessment only and is NOT imported by the app.
// The running app initializes Firebase in lib/firebase.js using environment variables.

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration (as provided)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyB4Obi1igQwS44vvbYrpRCh9KfTrbcvJEY',
  authDomain: 'finaled-5d517.firebaseapp.com',
  projectId: 'finaled-5d517',
  storageBucket: 'finaled-5d517.firebasestorage.app',
  messagingSenderId: '625111319495',
  appId: '1:625111319495:web:91cf42f5cd7c4f2ae5cfe2',
  measurementId: 'G-6SD891DHVP',
};

// Initialize Firebase (example only; not used by the app runtime)
const app = initializeApp(firebaseConfig);

// Analytics is web-only and optional
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };


