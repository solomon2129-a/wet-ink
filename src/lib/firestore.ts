import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  uid: string;
  username: string;
  bio: string;
  isPublic: boolean;
  allowLiveReading: boolean;
  createdAt?: Timestamp;
}

export interface Book {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  authorName: string; // pen name shown to readers — set by writer
  title: string;
  content: string;
  isPublic: boolean;
  wordCount: number;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

// Users
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

// Books
export async function getUserBook(userId: string): Promise<Book | null> {
  const q = query(collection(db, "books"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Book;
}

export async function createBook(book: Omit<Book, "id">): Promise<string> {
  const ref = doc(collection(db, "books"));
  await setDoc(ref, {
    ...book,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBook(
  bookId: string,
  data: Partial<Book>
): Promise<void> {
  await updateDoc(doc(db, "books", bookId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicBooks(): Promise<Book[]> {
  const q = query(collection(db, "books"), where("isPublic", "==", true));
  const snap = await getDocs(q);
  const books = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
  // Sort client-side — avoids needing a composite Firestore index
  return books.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
}

export async function getBookById(bookId: string): Promise<Book | null> {
  const snap = await getDoc(doc(db, "books", bookId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Book) : null;
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}
