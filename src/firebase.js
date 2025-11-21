// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Read config from env
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// debug line 
console.log('REACT_APP_FIREBASE_API_KEY raw ->', process.env.REACT_APP_FIREBASE_API_KEY);
console.log('firebaseConfig ->', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN
});
// Sanity check: fail early with a helpful message if apiKey is missing/invalid
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
  // Throwing here will show a clear error in the console and stop further auth calls.
  throw new Error(
    "Firebase API key is missing. Ensure REACT_APP_FIREBASE_API_KEY is set in your .env and restart the dev server."
  );
}

// Initialize and export
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
