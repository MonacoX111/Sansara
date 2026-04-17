import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyQcF...",
  authDomain: "sansara-history.firebaseapp.com",
  projectId: "sansara-history",
  storageBucket: "sansara-history.firebasestorage.app",
  messagingSenderId: "494545798089",
  appId: "1:494545798089:web:6758168056a37b2575de18",
};

export const isFirebaseConfigured =
  Object.values(firebaseConfig).every(Boolean);

let db: Firestore | null = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
