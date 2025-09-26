// Test connection to finaled-17624 project
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function testConnection() {
  try {
    console.log('🔥 Testing connection to finaled-17624...');
    
    // Test auth
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('✅ Auth successful:', user.uid);
    
    // Create test user document
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      email: 'test@finaled.com',
      displayName: 'Test User',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log('✅ User document created');
    
    // Create test journal entry
    const journalRef = collection(db, 'users', user.uid, 'journalEntries');
    await addDoc(journalRef, {
      title: 'Test Dream Entry',
      description: 'This is a test entry to verify the connection works.',
      mood: '😊',
      sleepQuality: 'Good',
      date: new Date().toLocaleDateString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.uid
    });
    console.log('✅ Journal entry created');
    
    console.log('🎉 SUCCESS! Check your Firebase Console now!');
    console.log('🌐 Go to: https://console.firebase.google.com/project/finaled-5d517/firestore/databases/default/data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();

                                                                                      