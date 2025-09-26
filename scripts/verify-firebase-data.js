// Verify data exists in Firebase
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'finaled-17624'
});

const db = getFirestore(app);

async function verifyData() {
  try {
    console.log('🔍 Verifying data in Firebase...\n');
    
    // Check test collection
    console.log('📋 Checking test collection:');
    const testSnapshot = await db.collection('test').get();
    if (testSnapshot.empty) {
      console.log('❌ No documents in test collection');
    } else {
      testSnapshot.forEach(doc => {
        console.log(`✅ Document ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
      });
    }
    
    // Check users collection
    console.log('\n👥 Checking users collection:');
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('❌ No documents in users collection');
    } else {
      usersSnapshot.forEach(doc => {
        console.log(`✅ User ID: ${doc.id}`);
        console.log(`   Email: ${doc.data().email}`);
        console.log(`   Display Name: ${doc.data().displayName}`);
      });
    }
    
    // Check journal entries
    console.log('\n📝 Checking journal entries:');
    const journalSnapshot = await db.collectionGroup('journalEntries').get();
    if (journalSnapshot.empty) {
      console.log('❌ No journal entries found');
    } else {
      journalSnapshot.forEach(doc => {
        console.log(`✅ Journal Entry ID: ${doc.id}`);
        console.log(`   Title: ${doc.data().title}`);
        console.log(`   Mood: ${doc.data().mood}`);
        console.log(`   User ID: ${doc.data().userId}`);
      });
    }
    
    console.log('\n🎉 Data verification complete!');
    console.log('🌐 Check Firebase Console: https://console.firebase.google.com/project/finaled-17624/firestore/databases/default/data');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

verifyData();
