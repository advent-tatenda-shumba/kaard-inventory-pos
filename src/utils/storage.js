import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc 
} from 'firebase/firestore';

// ==========================================
// 1. CORE FIREBASE FUNCTIONS
// ==========================================

export const getCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
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
// 2. USER MANAGEMENT
// ==========================================

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Used to initialize users in the database from a script
export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: new Date().toISOString()
    });
    console.log(`Profile created for ${userData.email}`);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};