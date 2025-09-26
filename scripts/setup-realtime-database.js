// Setup Real-time Firestore Database for Journal App
// This script creates the basic database structure for real-time journal entries

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB4Obi1igQwS44vvbYrpRCh9KfTrbcvJEY",
  authDomain: "finaled-5d517.firebaseapp.com",
  projectId: "natural-oath-456110-s9",
  storageBucket: "natural-oath-456110-s9.firebasestorage.app",
  messagingSenderId: "625111319495",
  appId: "1:625111319495:web:91cf42f5cd7c4f2ae5cfe2",
  measurementId: "G-6SD891DHVP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupRealtimeDatabase() {
  try {
    console.log('🔥 Setting up real-time Firestore database...');
    
    // Test authentication
    console.log('🔐 Testing authentication...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('✅ User authenticated:', user.uid);
    
    // Create a test user document to initialize the structure
    console.log('👤 Creating user structure...');
    const testUserId = 'test-user-structure';
    const userDocRef = doc(db, 'users', testUserId);
    
    await setDoc(userDocRef, {
      email: 'test@journalapp.com',
      displayName: 'Journal User',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
    
    console.log('✅ User document structure created');
    console.log('📁 Database structure ready:');
    console.log('   users/{userId}');
    console.log('   └── journalEntries/{entryId}');
    
    console.log('\n🎉 Real-time database setup complete!');
    console.log('📱 Your journal app is now ready to save entries in real-time');
    console.log('🔄 When you add a journal entry, it will automatically save to Firestore');
    console.log('⚡ Real-time updates will work across all devices');
    
    console.log('\n🌐 Check your Firebase console:');
    console.log('   https://console.firebase.google.com/project/natural-oath-456110-s9/firestore');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 To fix this:');
      console.log('1. Go to Firebase Console');
      console.log('2. Enable Firestore Database');
      console.log('3. Enable Authentication');
      console.log('4. Run this script again');
    }
  }
}

setupRealtimeDatabase();
