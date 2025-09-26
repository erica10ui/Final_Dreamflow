// Test Journal Entry for Erica
// This script will create a journal entry in Firestore for user "erica"

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4Obi1igQwS44vvbYrpRCh9KfTrbcvJEY",
  authDomain: "finaled-5d517.firebaseapp.com",
  projectId: "natural-oath-456110-s9",
  storageBucket: "natural-oath-456110-s9.firebasestorage.app",
  messagingSenderId: "625111319495",
  appId: "1:625111319495:web:91cf42f5cd7c4f2ae5cfe2",
  measurementId: "G-6SD891DHVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createEricaJournal() {
  try {
    console.log('🔥 Testing Firebase connection for Erica...');
    
    // Test authentication
    console.log('🔐 Testing authentication...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('✅ User signed in:', user.uid);
    
    // Create user document for Erica
    console.log('👤 Creating user document for Erica...');
    const ericaUserId = 'erica-user-id'; // You can change this to match your actual user ID
    const userDocRef = doc(db, 'users', ericaUserId);
    await setDoc(userDocRef, {
      email: 'erica@example.com',
      displayName: 'Erica',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
    console.log('✅ Erica user document created');
    
    // Create journal entries for Erica
    console.log('📝 Creating journal entries for Erica...');
    const journalEntriesRef = collection(db, 'users', ericaUserId, 'journalEntries');
    
    const ericaEntries = [
      {
        title: "Erica's First Dream",
        description: "I had a beautiful dream about flying over a peaceful meadow. The grass was green and the sky was painted in beautiful colors. I felt so free and happy.",
        mood: "😊",
        sleepQuality: "Great",
        tags: ["flying", "meadow", "peaceful"],
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: ericaUserId
      },
      {
        title: "Ocean Adventure Dream",
        description: "I was swimming in a crystal clear ocean with colorful fish all around me. The water was warm and I could breathe underwater. It was like being in a magical underwater world.",
        mood: "😌",
        sleepQuality: "Excellent",
        tags: ["ocean", "swimming", "magical"],
        date: new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        userId: ericaUserId
      },
      {
        title: "Forest Walk Dream",
        description: "I was walking through a dense forest with tall trees and sunlight filtering through the leaves. I heard birds singing and felt completely at peace with nature.",
        mood: "😴",
        sleepQuality: "Good",
        tags: ["forest", "nature", "peaceful"],
        date: new Date(Date.now() - 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
        userId: ericaUserId
      }
    ];
    
    for (const entry of ericaEntries) {
      await addDoc(journalEntriesRef, entry);
      console.log(`✅ Created entry: "${entry.title}"`);
    }
    
    // Verify data was created
    console.log('🔍 Verifying Erica\'s journal entries...');
    const entriesSnapshot = await getDocs(journalEntriesRef);
    console.log(`✅ Found ${entriesSnapshot.size} journal entries for Erica`);
    
    entriesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.title} (${data.mood}) - ${data.date}`);
    });
    
    console.log('\n🎉 Erica\'s journal setup completed successfully!');
    console.log('📱 Erica can now use the journal app with real-time updates');
    console.log(`👤 Erica's user ID: ${ericaUserId}`);
    console.log('🌐 Check your Firebase console to see the data:');
    console.log('   https://console.firebase.google.com/project/natural-oath-456110-s9/firestore');
    
  } catch (error) {
    console.error('❌ Error creating Erica\'s journal:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
createEricaJournal();
