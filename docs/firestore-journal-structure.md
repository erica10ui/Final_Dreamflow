it only firestore rules# Firestore Journal Database Structure & CRUD Methods

## 📊 Database Structure

Your Firestore database is organized with a user-based collection structure for security and scalability:

```
📁 users/{userId}
  └── 📁 journalEntries/{entryId}
      ├── title: string (max 200 chars)
      ├── description: string (max 5000 chars)
      ├── mood: string (emoji: 😊, 😌, 😴, 😰, 😤, 😢, 😡, 🤔)
      ├── sleepQuality: string (Poor, Fair, Good, Great, Excellent)
      ├── tags: array (max 10 items)
      ├── date: string (formatted date)
      ├── userId: string (for security)
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

## 🔐 Security Rules

The Firestore security rules ensure that:
- Users can only access their own data
- Data validation is enforced at the database level
- Journal entries have proper structure and limits

## 📝 CRUD Methods

### ➕ CREATE - Add New Journal Entry

```javascript
import { useJournal } from '../contexts/JournalContext';

const { addEntry } = useJournal();

const newEntry = {
  title: "Flying Dream",
  description: "I was flying over the city last night...",
  mood: "😊",
  sleepQuality: "Great",
  tags: ["flying", "city", "adventure"]
};

try {
  const createdEntry = await addEntry(newEntry);
  console.log('Entry created:', createdEntry);
} catch (error) {
  console.error('Error creating entry:', error);
}
```

### 📖 READ - Get Journal Entries

```javascript
const { dreamEntries, loadEntries, getEntryById, searchEntries } = useJournal();

// Load all entries (with pagination)
await loadEntries(); // Initial load
await loadEntries(false); // Load more (pagination)
await loadEntries(true); // Refresh

// Get specific entry by ID
const entry = await getEntryById('entryId123');

// Search entries
const searchResults = await searchEntries('flying');
```

### 📝 UPDATE - Update Journal Entry

```javascript
const { updateEntry } = useJournal();

const updatedData = {
  title: "Updated Flying Dream",
  description: "Updated description...",
  mood: "😌",
  sleepQuality: "Excellent"
};

try {
  await updateEntry('entryId123', updatedData);
  console.log('Entry updated successfully');
} catch (error) {
  console.error('Error updating entry:', error);
}
```

### 🗑️ DELETE - Delete Journal Entry

```javascript
const { deleteEntry, batchDeleteEntries } = useJournal();

// Delete single entry
try {
  await deleteEntry('entryId123');
  console.log('Entry deleted successfully');
} catch (error) {
  console.error('Error deleting entry:', error);
}

// Delete multiple entries
try {
  await batchDeleteEntries(['entryId1', 'entryId2', 'entryId3']);
  console.log('Entries deleted successfully');
} catch (error) {
  console.error('Error batch deleting entries:', error);
}
```

## 🔄 Batch Operations

### Batch Update Multiple Entries

```javascript
const { batchUpdateEntries } = useJournal();

const updates = [
  {
    id: 'entryId1',
    data: { mood: '😊', sleepQuality: 'Great' }
  },
  {
    id: 'entryId2',
    data: { tags: ['updated', 'batch'] }
  }
];

try {
  await batchUpdateEntries(updates);
  console.log('Batch update completed');
} catch (error) {
  console.error('Error batch updating:', error);
}
```

## 📊 Analytics & Statistics

```javascript
const { getStats } = useJournal();

const stats = getStats();
console.log('Total dreams:', stats.totalDreams);
console.log('Sleep streak:', stats.sleepStreak);
console.log('Average sleep quality:', stats.avgSleepQuality);
console.log('Quality distribution:', stats.qualityDistribution);
console.log('Mood distribution:', stats.moodDistribution);
```

## 🔍 Advanced Queries

### Filter by Sleep Quality

```javascript
const excellentSleepEntries = dreamEntries.filter(
  entry => entry.sleepQuality === 'Excellent'
);
```

### Filter by Mood

```javascript
const happyEntries = dreamEntries.filter(
  entry => entry.mood === '😊'
);
```

### Filter by Date Range

```javascript
const recentEntries = dreamEntries.filter(entry => {
  const entryDate = new Date(entry.createdAt);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return entryDate >= weekAgo;
});
```

### Search with Multiple Criteria

```javascript
const searchResults = dreamEntries.filter(entry => {
  const matchesTitle = entry.title.toLowerCase().includes('flying');
  const matchesQuality = entry.sleepQuality === 'Great';
  const matchesMood = entry.mood === '😊';
  
  return matchesTitle && matchesQuality && matchesMood;
});
```

## 🚀 Performance Optimizations

### Pagination

```javascript
const { loadEntries, hasMore, lastVisible } = useJournal();

// Load initial entries
await loadEntries(true);

// Load more entries (infinite scroll)
if (hasMore) {
  await loadEntries(false);
}
```

### Offline Support

The context automatically falls back to local storage when Firebase is unavailable:

```javascript
// Works offline - data is saved locally
const entry = await addEntry(newEntryData);

// When online, data syncs to Firestore
```

## 🛡️ Error Handling

```javascript
try {
  const entry = await addEntry(entryData);
  // Success
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Permission denied - check security rules');
  } else if (error.code === 'invalid-argument') {
    console.error('Invalid data - check validation rules');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📱 React Native Integration

### Using in Components

```javascript
import React, { useEffect, useState } from 'react';
import { useJournal } from '../contexts/JournalContext';

export default function JournalScreen() {
  const { 
    dreamEntries, 
    loading, 
    addEntry, 
    updateEntry, 
    deleteEntry,
    getStats 
  } = useJournal();
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    mood: '😊',
    sleepQuality: 'Good'
  });

  const handleSave = async () => {
    try {
      await addEntry(newEntry);
      setNewEntry({ title: '', description: '', mood: '😊', sleepQuality: 'Good' });
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    // Your component JSX
  );
}
```

## 🔧 Configuration

### Firebase Setup

Make sure your `lib/firebase.js` is properly configured:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Environment Variables

Required environment variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📈 Monitoring & Debugging

### Enable Firestore Logging

```javascript
// Add to your app initialization
import { enableLogging } from 'firebase/firestore';
enableLogging(true);
```

### Check Security Rules

Test your security rules in the Firebase Console:
1. Go to Firestore Database
2. Click on "Rules" tab
3. Use the Rules Playground to test different scenarios

## 🎯 Best Practices

1. **Always validate data** before sending to Firestore
2. **Use batch operations** for multiple writes
3. **Implement proper error handling** for network issues
4. **Use pagination** for large datasets
5. **Cache data locally** for offline support
6. **Monitor security rules** regularly
7. **Use indexes** for complex queries
8. **Implement proper loading states** for better UX

This structure provides a robust, scalable, and secure foundation for your journal application with comprehensive CRUD operations and advanced features.
