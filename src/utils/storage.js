import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

// ==========================================
// 1. NEW FIREBASE FUNCTIONS (The Future)
// ==========================================

export const getCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id, // Use Firebase's random ID
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    return [];
  }
};

export const addItem = async (collectionName, item) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), item);
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
};

export const updateItem = async (collectionName, id, updates) => {
  try {
    const itemRef = doc(db, collectionName, id);
    await updateDoc(itemRef, updates);
    return true;
  } catch (error) {
    console.error(`Error updating ${collectionName} ${id}:`, error);
    return false;
  }
};

export const deleteItem = async (collectionName, id) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return false;
  }
};

// ==========================================
// 2. LEGACY FUNCTIONS (CRITICAL FOR NOW)
// (These prevent App.js from crashing while we migrate)
// ==========================================

export const getItem = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage`, error);
    return defaultValue;
  }
};

export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item "${key}" in localStorage`, error);
  }
};

export const initializeUsers = () => {
  // Kept to prevent import errors in index.js/App.js
  const users = getItem('users', null);
  if (users === null) {
    setItem('users', [
      { username: 'admin', password: 'admin123', role: 'admin', shop: 'all' }
    ]);
  }
};

// ==========================================
// 3. MIGRATION TOOL
// ==========================================

export const uploadLocalDataToFirebase = async () => {
  const collections = ['inventory', 'sales', 'stockRequests', 'transfers'];
  
  for (const name of collections) {
    const localData = localStorage.getItem(name);
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log(`Uploading ${parsed.length} items to ${name}...`);
      
      for (const item of parsed) {
        // Remove the old numeric ID to let Firebase generate a secure string ID
        const { id, ...data } = item; 
        await addDoc(collection(db, name), data);
      }
    }
  }
  console.log("Migration Complete!");
  alert("Data uploaded to Firebase!");
};