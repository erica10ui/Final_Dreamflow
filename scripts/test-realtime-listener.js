// Test realtime listener setup
const { db, firebaseReady } = require('../lib/firebase.js');
const { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } = require('firebase/firestore');

async function testRealtimeListener() {
  try {
    console.log('🔥 Testing realtime listener setup...');
    console.log('Firebase ready:', firebaseReady);
    console.log('DB instance:', !!db);
    
    const testUserId = 'test-user-realtime';
    
    // First, create a test user document
    console.log('\n📝 Creating test user document...');
    const userDocRef = doc(db, 'users', testUserId);
    await setDoc(userDocRef, {
      email: 'test@realtime.com',
      displayName: 'Realtime Test User',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    }, { merge: true });
    
    console.log('✅ User document created');
    
    // Test the query
    console.log('\n🔍 Testing query setup...');
    const entriesRef = collection(db, 'users', testUserId, 'journalEntries');
    
    // Try with orderBy first
    let q;
    try {
      q = query(entriesRef, orderBy('createdAt', 'desc'));
      console.log('✅ OrderBy query created successfully');
    } catch (orderByError) {
      console.warn('⚠️ OrderBy query failed:', orderByError.message);
      q = entriesRef;
      console.log('✅ Using simple query as fallback');
    }
    
    // Test the realtime listener
    console.log('\n📡 Testing realtime listener...');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('✅ Realtime listener working!');
        console.log('📊 Snapshot size:', snapshot.docs.length);
        console.log('📊 Empty:', snapshot.empty);
        console.log('📊 From cache:', snapshot.metadata.fromCache);
        
        // Unsubscribe after first successful callback
        unsubscribe();
        console.log('🎉 Realtime listener test completed successfully!');
      },
      (error) => {
        console.error('❌ Realtime listener error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
    );
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testRealtimeListener();
