const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } = require("firebase/firestore");
const { getAuth, signInAnonymously } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyD2peZcEFItzlf7xVghBaQEzOwbpox54xA",
  authDomain: "finaled-5d517.firebaseapp.com",
  projectId: "finaled-5d517",
  storageBucket: "finaled-5d517.firebasestorage.app",
  messagingSenderId: "625111319495",
  appId: "1:625111319495:web:91cf42f5cd7c4f2ae5cfe2",
  measurementId: "G-6SD891DHVP"
};

async function testDreamSaving() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('🔐 Signing in anonymously...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('✅ User signed in:', user.uid);

    console.log('👤 Creating user document...');
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      email: 'test@dreamflow.com',
      displayName: 'Test User',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    }, { merge: true });
    console.log('✅ User document created');

    console.log('💭 Adding test dream entry...');
    const entriesRef = collection(db, 'users', user.uid, 'journalEntries');
    const dreamEntry = {
      title: 'Test Dream Entry',
      description: 'This is a test dream entry to verify saving functionality',
      mood: '😊',
      sleepQuality: 'Good',
      tags: ['test', 'dream'],
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(entriesRef, dreamEntry);
    console.log('✅ Dream entry saved with ID:', docRef.id);

    console.log('🧹 Cleaning up test data...');
    // Note: In a real scenario, you might want to delete the test entry
    // For now, we'll just log success
    
    console.log('🎉 Dream saving test completed successfully!');
    console.log('📊 Test Results:');
    console.log('  - Firebase connection: ✅ Working');
    console.log('  - Authentication: ✅ Working');
    console.log('  - User document creation: ✅ Working');
    console.log('  - Dream entry saving: ✅ Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

testDreamSaving();
