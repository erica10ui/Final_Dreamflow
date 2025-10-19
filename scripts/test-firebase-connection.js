import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2peZcEFItzlf7xVghBaQEzOwbpox54xA",
  authDomain: "finaled-17624.firebaseapp.com",
  projectId: "finaled-17624",
  storageBucket: "finaled-17624.firebasestorage.app",
  messagingSenderId: "109265291036",
  appId: "1:109265291036:web:8e116c4ff71691bb3f5cd9",
  measurementId: "G-GNLDS2HP31"
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test write operation
    const testDocRef = doc(db, 'test', 'connection');
    await setDoc(testDocRef, {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substr(2, 9)
    });
    
    console.log('✅ Write operation successful');
    
    // Test read operation
    const testDoc = await getDoc(testDocRef);
    if (testDoc.exists()) {
      const data = testDoc.data();
      console.log('✅ Read operation successful');
      console.log('📄 Test data:', data);
    } else {
      console.log('❌ Document not found');
    }
    
    // Test organized database structure
    console.log('\n🗂️ Testing organized database structure...');
    
    const { createDatabaseManager } = await import('../lib/database.js');
    const dbManager = createDatabaseManager('test-user-123');
    
    // Test sleep session
    const sleepSession = await dbManager.addSleepSession({
      startTime: new Date().toISOString(),
      duration: 8.5,
      quality: 'Good',
      notes: 'Test sleep session'
    });
    console.log('✅ Sleep session created:', sleepSession.id);
    
    // Test journal entry
    const journalEntry = await dbManager.addJournalEntry({
      title: 'Test Journal Entry',
      content: 'This is a test journal entry to verify Firebase connection.',
      mood: 'happy'
    });
    console.log('✅ Journal entry created:', journalEntry.id);
    
    // Test mood entry
    const moodEntry = await dbManager.addMoodEntry({
      mood: 'calm',
      intensity: 5,
      category: 'test'
    });
    console.log('✅ Mood entry created:', moodEntry.id);
    
    // Test activity session
    const activitySession = await dbManager.addActivitySession({
      type: 'meditation',
      category: 'test',
      duration: 10,
      intensity: 4,
      mood: 'peaceful',
      notes: 'Test meditation session'
    });
    console.log('✅ Activity session created:', activitySession.id);
    
    // Test comprehensive statistics
    const stats = await dbManager.calculateComprehensiveStatistics();
    console.log('✅ Comprehensive statistics calculated:', {
      sleep: stats.sleep,
      journal: stats.journal,
      mood: stats.mood,
      activities: stats.activities,
      wellness: stats.wellness
    });
    
    console.log('\n🎉 All Firebase tests passed successfully!');
    console.log('📊 Database structure is properly organized and working.');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    process.exit(1);
  }
}

testFirebaseConnection();
