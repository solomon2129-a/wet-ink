import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQsNW2WyqgHwxPSivxGyciG1UeWrBsi2Q",
  authDomain: "wet-ink-e976e.firebaseapp.com",
  projectId: "wet-ink-e976e",
  storageBucket: "wet-ink-e976e.firebasestorage.app",
  messagingSenderId: "182250852455",
  appId: "1:182250852455:web:e620ae8ba92f7fe58804c2",
  measurementId: "G-MB6VHP8FC6",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
