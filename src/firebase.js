import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfAhNL5liTxDMcP60PnwkgPYtTxiHEBMs",
  authDomain: "kaard-pos-system.firebaseapp.com",
  projectId: "kaard-pos-system",
  storageBucket: "kaard-pos-system.firebasestorage.app",
  messagingSenderId: "501194306288",
  appId: "1:501194306288:web:b69b5a01c5bcf22b594835"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Log to confirm export
console.log("Firebase Exporting Auth:", auth);

// EXPORT THEM
export { db, auth };