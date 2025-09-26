const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@dreamflow.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  username: 'test_user'
};

let authToken = '';

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', response.data.message);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testUserRegistration() {
  try {
    console.log('👤 Testing user registration...');
    const response = await api.post('/auth/register', testUser);
    authToken = response.data.token;
    console.log('✅ User registration successful:', response.data.user.email);
  } catch (error) {
    console.error('❌ User registration failed:', error.response?.data?.message || error.message);
  }
}

async function testUserLogin() {
  try {
    console.log('🔐 Testing user login...');
    const response = await api.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    authToken = response.data.token;
    console.log('✅ User login successful:', response.data.user.email);
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.message || error.message);
  }
}

async function testJournalEntry() {
  try {
    console.log('📝 Testing journal entry creation...');
    const journalEntry = {
      title: 'Test Dream',
      description: 'This is a test dream entry for API testing.',
      mood: '😊',
      sleepQuality: 'Good',
      tags: ['test', 'api'],
      dreamDate: new Date().toISOString().split('T')[0]
    };

    const response = await api.post('/journal', journalEntry);
    console.log('✅ Journal entry created:', response.data.entry.title);
    return response.data.entry.id;
  } catch (error) {
    console.error('❌ Journal entry creation failed:', error.response?.data?.message || error.message);
  }
}

async function testSleepSession() {
  try {
    console.log('😴 Testing sleep session creation...');
    const sleepSession = {
      startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      endTime: new Date().toISOString(),
      quality: 'Good',
      notes: 'Test sleep session'
    };

    const response = await api.post('/sleep/sessions/start', { startTime: sleepSession.startTime });
    const sessionId = response.data.session.id;
    
    // End the session
    await api.put(`/sleep/sessions/${sessionId}/end`, {
      endTime: sleepSession.endTime,
      quality: sleepSession.quality,
      notes: sleepSession.notes
    });
    
    console.log('✅ Sleep session created and ended:', sessionId);
  } catch (error) {
    console.error('❌ Sleep session creation failed:', error.response?.data?.message || error.message);
  }
}

async function testNotifications() {
  try {
    console.log('🔔 Testing notification creation...');
    const notification = {
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification',
      scheduledTime: '09:00:00',
      isEnabled: true
    };

    const response = await api.post('/notifications', notification);
    console.log('✅ Notification created:', response.data.notification.title);
  } catch (error) {
    console.error('❌ Notification creation failed:', error.response?.data?.message || error.message);
  }
}

async function testPreferences() {
  try {
    console.log('⚙️ Testing preferences update...');
    const preferences = {
      sleepType: 'night_owl',
      sosReliefPreferences: {
        breathing: true,
        meditation: false,
        sounds: true
      },
      mentorPreferences: {
        style: 'gentle',
        frequency: 'daily'
      }
    };

    const response = await api.put('/preferences', preferences);
    console.log('✅ Preferences updated successfully');
  } catch (error) {
    console.error('❌ Preferences update failed:', error.response?.data?.message || error.message);
  }
}

async function testJournalStats() {
  try {
    console.log('📊 Testing journal statistics...');
    const response = await api.get('/journal/stats');
    console.log('✅ Journal stats retrieved:', response.data.stats);
  } catch (error) {
    console.error('❌ Journal stats failed:', error.response?.data?.message || error.message);
  }
}

async function testSleepStats() {
  try {
    console.log('📈 Testing sleep statistics...');
    const response = await api.get('/sleep/stats');
    console.log('✅ Sleep stats retrieved:', response.data.stats);
  } catch (error) {
    console.error('❌ Sleep stats failed:', error.response?.data?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testHealthCheck();
  console.log('');
  
  await testUserRegistration();
  console.log('');
  
  await testUserLogin();
  console.log('');
  
  await testJournalEntry();
  console.log('');
  
  await testSleepSession();
  console.log('');
  
  await testNotifications();
  console.log('');
  
  await testPreferences();
  console.log('');
  
  await testJournalStats();
  console.log('');
  
  await testSleepStats();
  console.log('');
  
  console.log('🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testJournalEntry,
  testSleepSession,
  testNotifications,
  testPreferences,
  testJournalStats,
  testSleepStats,
  runAllTests
};
