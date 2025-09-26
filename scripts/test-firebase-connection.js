// Test Firebase Connection and Create Sample Data
// Run this with: node scripts/test-firebase-connection.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4Obi1igQwS44vvbYrpRCh9KfTrbcvJEY",
  authDomain: "finaled-5d517.firebaseapp.com",
  projectId: "finaled-5d517",
  storageBucket: "finaled-5d517.firebasestorage.app",
  messagingSenderId: "625111319495",
  appId: "1:625111319495:web:91cf42f5cd7c4f2ae5cfe2",
  measurementId: "G-6SD891DHVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test authentication
    console.log('🔐 Testing authentication...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('✅ Anonymous user signed in:', user.uid);
    
    // Test Firestore connection
    console.log('📊 Testing Firestore connection...');
    
    // Create a test user document
    const testUserId = user.uid;
    const userDocRef = doc(db, 'users', testUserId);
    await setDoc(userDocRef, {
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log('✅ User document created');
    
    // Create sample journal entries
    console.log('📝 Creating sample journal entries...');
    const journalEntriesRef = collection(db, 'users', testUserId, 'journalEntries');
    
    const sampleEntries = [
      {
        title: "Flying Dream",
        description: "I was flying over a beautiful city last night. The buildings were glowing with golden light and I could see everything from above. It felt so peaceful and free.",
        mood: "😊",
        sleepQuality: "Great",
        tags: ["flying", "city", "peaceful"],
        date: "Dec 15, 2024",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: testUserId
      },
      {
        title: "Ocean Adventure",
        description: "I was swimming in a crystal clear ocean with colorful fish all around me. The water was warm and I could breathe underwater. It was like being in a magical underwater world.",
        mood: "😌",
        sleepQuality: "Excellent",
        tags: ["ocean", "swimming", "magical"],
        date: "Dec 14, 2024",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: testUserId
      },
      {
        title: "Forest Journey",
        description: "I was walking through a dense forest with tall trees and sunlight filtering through the leaves. I heard birds singing and felt completely at peace with nature.",
        mood: "😴",
        sleepQuality: "Good",
        tags: ["forest", "nature", "peaceful"],
        date: "Dec 13, 2024",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: testUserId
      }
    ];
    
    for (const entry of sampleEntries) {
      await addDoc(journalEntriesRef, entry);
      console.log(`✅ Created entry: ${entry.title}`);
    }
    
    // Verify data was created
    console.log('🔍 Verifying data...');
    const entriesSnapshot = await getDocs(journalEntriesRef);
    console.log(`✅ Found ${entriesSnapshot.size} journal entries`);
    
    entriesSnapshot.forEach((doc) => {
      console.log(`  - ${doc.data().title} (${doc.data().mood})`);
    });
    
    console.log('🎉 Firebase connection test completed successfully!');
    console.log('📱 You can now use your journal app with real-time updates');
    console.log(`👤 Test user ID: ${testUserId}`);
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testFirebaseConnection();
