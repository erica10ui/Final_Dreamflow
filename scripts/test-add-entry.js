// Test addEntry function
const { db, firebaseReady } = require('../lib/firebase.js');
const { collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

async function testAddEntry() {
  try {
    console.log('🔥 Testing addEntry function...');
    console.log('Firebase ready:', firebaseReady);
    console.log('DB instance:', !!db);
    
    const testUserId = 'test-user-add-entry';
    
    // First, create a test user document
    console.log('\n📝 Creating test user document...');
    const userDocRef = doc(db, 'users', testUserId);
    await setDoc(userDocRef, {
      email: 'test@addentry.com',
      displayName: 'Add Entry Test User',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    }, { merge: true });
    
    console.log('✅ User document created');
    
    // Test adding a journal entry
    console.log('\n📝 Testing journal entry creation...');
    const entryData = {
      title: 'Test Dream Entry',
      description: 'This is a test dream entry to verify the addEntry function works.',
      mood: '😊',
      sleepQuality: 'Good',
      tags: ['test', 'dream']
    };
    
    const nowDate = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const entry = {
      ...entryData,
      tags: entryData.tags || [],
      date: nowDate,
      userId: testUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 Entry data:', entry);
    
    // Add to Firestore
    const entriesRef = collection(db, 'users', testUserId, 'journalEntries');
    const docRef = await addDoc(entriesRef, {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Journal entry created successfully!');
    console.log('📄 Document ID:', docRef.id);
    console.log('📄 Entry title:', entry.title);
    
    console.log('\n🎉 addEntry function test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testAddEntry();
