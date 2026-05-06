import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQFn7RvpL3xchZPjAnzgCrDbR1ZOf11U8",
  authDomain: "sansara-history.firebaseapp.com",
  projectId: "sansara-history",
storageBucket: "sansara-history.firebasestorage.app",
  messagingSenderId: "494545798089",
  appId: "1:494545798089:web:6758168056a37b2575de18",
};

export const isFirebaseConfigured =
  Object.values(firebaseConfig).every(Boolean);

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { db, auth, storage };
