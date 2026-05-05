import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQFn7RvpL3xchZPjAnzgCrDbR1ZOf11U8",
  authDomain: "sansara-history.firebaseapp.com",
  projectId: "sansara-history",
  storageBucket: "sansara-history.appspot.com",
  messagingSenderId: "494545798089",
  appId: "1:494545798089:web:6758168056a37b2575de18",
};

export const isFirebaseConfigured =
  Object.values(firebaseConfig).every(Boolean);

let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
}

export { db, storage, auth };