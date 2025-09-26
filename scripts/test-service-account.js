// Test connection using service account
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'finaled-17624'
});

const db = getFirestore(app);

async function testServiceAccountConnection() {
  try {
    console.log('🔥 Testing service account connection to finaled-17624...');
    
    // Test writing to Firestore
    const testDoc = await db.collection('test').add({
      message: 'Hello from service account!',
      timestamp: new Date(),
      testId: 'service-account-test'
    });
    
    console.log('✅ Document written with ID:', testDoc.id);
    
    // Test reading from Firestore
    const doc = await db.collection('test').doc(testDoc.id).get();
    if (doc.exists) {
      console.log('✅ Document read successfully:', doc.data());
    }
    
    // Create a test user document
    const userRef = db.collection('users').doc('test-user-123');
    await userRef.set({
      email: 'test@finaled.com',
      displayName: 'Service Account Test User',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log('✅ User document created');
    
    // Create a test journal entry
    const journalRef = userRef.collection('journalEntries').doc();
    await journalRef.set({
      title: 'Service Account Test Entry',
      description: 'This entry was created using the service account.',
      mood: '😊',
      sleepQuality: 'Good',
      date: new Date().toLocaleDateString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user-123'
    });
    console.log('✅ Journal entry created');
    
    console.log('🎉 SUCCESS! Service account connection working!');
    console.log('🌐 Check your Firebase Console: https://console.firebase.google.com/project/finaled-17624/firestore/databases/default/data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testServiceAccountConnection();
