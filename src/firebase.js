import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAaOdSCIu83D5ub8byKWIaF2qXyNihjJFI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "xbank-dd5bf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "xbank-dd5bf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "xbank-dd5bf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "790574233331",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:790574233331:web:dbd98cd03cf6a7bb436986",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);