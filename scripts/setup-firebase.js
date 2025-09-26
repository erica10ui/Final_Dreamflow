// Firebase Setup Script for Journal App
// This script helps you set up your Firebase project for the journal application

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB4Obi1igQwS44vvbYrpRCh9KfTrbcvJEY",
  authDomain: "finaled-5d517.firebaseapp.com",
  projectId: "finaled-5d517",
  storageBucket: "finaled-5d517.firebasestorage.app",
  messagingSenderId: "625111319495",
  appId: "1:625111319495:web:91cf42f5cd7c4f2ae5cfe2",
  measurementId: "G-6SD891DHVP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupFirebase() {
  console.log('🚀 Setting up Firebase for your Journal App...\n');
  
  try {
    // Step 1: Test connection
    console.log('1️⃣ Testing Firebase connection...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('   ✅ Connected to Firebase');
    console.log(`   👤 User ID: ${user.uid}\n`);
    
    // Step 2: Create user document
    console.log('2️⃣ Creating user document...');
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      email: 'demo@journalapp.com',
      displayName: 'Journal User',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
    console.log('   ✅ User document created\n');
    
    // Step 3: Create sample journal entries
    console.log('3️⃣ Creating sample journal entries...');
    const journalEntriesRef = collection(db, 'users', user.uid, 'journalEntries');
    
    const sampleEntries = [
      {
        title: "Welcome to Your Dream Journal",
        description: "This is your first dream entry! Start recording your dreams and explore the fascinating world of your subconscious mind. Each dream is unique and tells a story about your inner thoughts and feelings.",
        mood: "😊",
        sleepQuality: "Great",
        tags: ["welcome", "first-dream", "introduction"],
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid
      },
      {
        title: "Flying Over the City",
        description: "I was soaring high above a beautiful city with golden buildings. The view was breathtaking and I felt completely free. The wind was gentle and the sky was painted in beautiful colors.",
        mood: "😌",
        sleepQuality: "Excellent",
        tags: ["flying", "city", "freedom"],
        date: new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        userId: user.uid
      },
      {
        title: "Underwater Adventure",
        description: "I was swimming in a crystal clear ocean with colorful fish and coral reefs. I could breathe underwater and explore the magical underwater world. It was peaceful and serene.",
        mood: "😴",
        sleepQuality: "Good",
        tags: ["ocean", "swimming", "underwater"],
        date: new Date(Date.now() - 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
        userId: user.uid
      }
    ];
    
    for (let i = 0; i < sampleEntries.length; i++) {
      const entry = sampleEntries[i];
      await addDoc(journalEntriesRef, entry);
      console.log(`   ✅ Created: "${entry.title}"`);
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('📱 Your journal app is now ready with:');
    console.log('   • Real-time Firestore database');
    console.log('   • Sample journal entries');
    console.log('   • User authentication');
    console.log('   • Live updates across devices');
    
    console.log('\n🔗 Next steps:');
    console.log('   1. Run your React Native app');
    console.log('   2. Open the journal page');
    console.log('   3. You should see the sample entries');
    console.log('   4. Try adding a new entry to test real-time updates');
    
    console.log(`\n👤 Your test user ID: ${user.uid}`);
    console.log('🌐 Check your Firebase console to see the data:');
    console.log('   https://console.firebase.google.com/project/finaled-5d517/firestore');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify Firebase project is active');
    console.error('   3. Make sure Firestore is enabled in your project');
    console.error('   4. Check if authentication is enabled');
  }
}

setupFirebase();
