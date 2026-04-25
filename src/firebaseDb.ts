import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export type FirebaseItem = {
  id: number;
};

const ensureDb = () => {
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  return db;
};



const stripUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }

  if (value && typeof value === "object") {
    const nextObject: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (val === undefined) return;
      nextObject[key] = stripUndefinedDeep(val);
    });

    return nextObject as T;
  }

  return value;
};

export const loadCollection = async <T extends FirebaseItem>(
  collectionName: string
): Promise<T[]> => {
  const currentDb = ensureDb();
  const ref = collection(currentDb, collectionName);
  const q = query(ref, orderBy("id", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => item.data() as T);
};

export const subscribeCollection = <T extends FirebaseItem>(
  collectionName: string,
  onData: (items: T[]) => void
) => {
  if (!db) {
    return () => {};
  }

  const ref = collection(db, collectionName);
  const q = query(ref, orderBy("id", "asc"));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((item) => item.data() as T);
    onData(items);
  });
};

export const saveItem = async <T extends FirebaseItem>(
  collectionName: string,
  item: T
) => {
  const currentDb = ensureDb();
  await setDoc(
    doc(currentDb, collectionName, String(item.id)),
    stripUndefinedDeep(item)
  );
};

export const saveItemsBatch = async <T extends FirebaseItem>(
  collectionName: string,
  items: T[]
) => {
  const currentDb = ensureDb();
  const batch = writeBatch(currentDb);

  items.forEach((item) => {
    batch.set(
      doc(currentDb, collectionName, String(item.id)),
      stripUndefinedDeep(item)
    );
  });

  await batch.commit();
};

export const deleteItem = async (collectionName: string, id: number) => {
  const currentDb = ensureDb();
  await deleteDoc(doc(currentDb, collectionName, String(id)));
};

export const deleteItemsBatch = async (
  collectionName: string,
  ids: number[]
) => {
  const currentDb = ensureDb();
  const batch = writeBatch(currentDb);

  ids.forEach((id) => {
    batch.delete(doc(currentDb, collectionName, String(id)));
  });

  await batch.commit();
};

export const seedCollectionIfEmpty = async <T extends FirebaseItem>(
  collectionName: string,
  items: T[]
) => {
  const currentDb = ensureDb();
  const snapshot = await getDocs(collection(currentDb, collectionName));

  if (!snapshot.empty) return;

  const batch = writeBatch(currentDb);

  items.forEach((item) => {
    batch.set(
      doc(currentDb, collectionName, String(item.id)),
      stripUndefinedDeep(item)
    );
  });

  await batch.commit();
};
