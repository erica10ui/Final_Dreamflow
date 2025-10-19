import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2peZcEFItzlf7xVghBaQEzOwbpox54xA",
  authDomain: "finaled-17624.firebaseapp.com",
  projectId: "finaled-17624",
  storageBucket: "finaled-17624.firebasestorage.app",
  messagingSenderId: "109265291036",
  appId: "1:109265291036:web:8e116c4ff71691bb3f5cd9",
  measurementId: "G-GNLDS2HP31"
};

async function testSimpleFirebase() {
  try {
    console.log('🔥 Testing simple Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test 1: Simple write to users collection
    const testUserId = 'test-user-' + Date.now();
    const userDocRef = doc(db, 'users', testUserId);
    
    await setDoc(userDocRef, {
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      testData: true
    });
    
    console.log('✅ User document created successfully');
    
    // Test 2: Read the document
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      console.log('✅ User document read successfully:', userDoc.data());
    } else {
      console.log('❌ User document not found');
    }
    
    // Test 3: Create a subcollection
    const sleepSessionsRef = collection(db, 'users', testUserId, 'sleep_sessions');
    const sleepSession = await addDoc(sleepSessionsRef, {
      startTime: new Date().toISOString(),
      duration: 8.5,
      quality: 'Good',
      notes: 'Test sleep session'
    });
    
    console.log('✅ Sleep session created successfully:', sleepSession.id);
    
    // Test 4: Create journal entry
    const journalRef = collection(db, 'users', testUserId, 'journal_entries');
    const journalEntry = await addDoc(journalRef, {
      title: 'Test Journal Entry',
      content: 'This is a test journal entry.',
      mood: 'happy',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Journal entry created successfully:', journalEntry.id);
    
    // Test 5: Create mood entry
    const moodRef = collection(db, 'users', testUserId, 'mood_entries');
    const moodEntry = await addDoc(moodRef, {
      mood: 'calm',
      intensity: 5,
      category: 'test',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Mood entry created successfully:', moodEntry.id);
    
    // Test 6: Create activity session
    const activityRef = collection(db, 'users', testUserId, 'activity_sessions');
    const activitySession = await addDoc(activityRef, {
      type: 'meditation',
      category: 'test',
      duration: 10,
      intensity: 4,
      mood: 'peaceful',
      notes: 'Test meditation session',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Activity session created successfully:', activitySession.id);
    
    console.log('\n🎉 All Firebase tests passed successfully!');
    console.log('📊 Database structure is working correctly.');
    console.log(`👤 Test user ID: ${testUserId}`);
    console.log('🗂️ Check your Firebase console to see the data!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testSimpleFirebase();

