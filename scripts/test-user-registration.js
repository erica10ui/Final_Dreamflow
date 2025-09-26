// Test user registration with Firebase
const { auth, firebaseReady } = require('../lib/firebase.js');
const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');

async function testUserRegistration() {
  try {
    console.log('🔥 Testing user registration with Firebase...');
    console.log('Firebase ready:', firebaseReady);
    console.log('Auth instance:', !!auth);
    
    // Test registration
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`\n📝 Creating user: ${testEmail}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ User created successfully!');
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);
    console.log('Email verified:', user.emailVerified);
    
    // Update profile
    await updateProfile(user, {
      displayName: 'Test User'
    });
    
    console.log('✅ Profile updated successfully!');
    console.log('Display name:', user.displayName);
    
    console.log('\n🎉 SUCCESS! User registration is working!');
    console.log('🌐 Check Firebase Console: https://console.firebase.google.com/project/finaled-17624/authentication/users');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testUserRegistration();
