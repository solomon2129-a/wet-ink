"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile, UserProfile } from "@/lib/firestore";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getUserProfile(user.uid);
    setProfile(p);
  };

  useEffect(() => {
    // Handle Google redirect result (fires after redirect back to app)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const existing = await getUserProfile(result.user.uid);
        if (!existing) {
          await createUserProfile({
            uid: result.user.uid,
            username: result.user.displayName || result.user.email?.split("@")[0] || "writer",
            bio: "",
            isPublic: true,
            allowLiveReading: true,
          });
        }
      }
    }).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile({
      uid: cred.user.uid,
      username,
      bio: "",
      isPublic: true,
      allowLiveReading: true,
    });
    const p = await getUserProfile(cred.user.uid);
    setProfile(p);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Page will redirect to Google then back — result handled in useEffect above
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signInWithGoogle, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
