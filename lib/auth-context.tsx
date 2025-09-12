// lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type AppUser = {
  id: string;
  email: string;
  name?: string;
  role?: string; // "user" | "admin"
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser | null>;
  register: (name: string, email: string, password: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // intenta leer doc users/{uid}
        let role = "user";
        let displayName = fbUser.displayName ?? "";

        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            role = data?.role ?? "user";
            displayName = data?.displayName ?? displayName;
          }
        } catch (e) {
          console.warn("Error leyendo users doc:", e);
        }

        setUser({
          id: fbUser.uid,
          email: fbUser.email ?? "",
          name: displayName,
          role,
        });
      } catch (err) {
        console.error("onAuthStateChanged error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function login(email: string, password: string): Promise<AppUser | null> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    // lee doc users/{uid}
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        const appUser: AppUser = {
          id: fbUser.uid,
          email: fbUser.email ?? "",
          name: data?.displayName ?? fbUser.displayName ?? "",
          role: data?.role ?? "user",
        };
        setUser(appUser);
        return appUser;
      } else {
        // doc no existe -> devolvemos fallback user (y no creamos nada automático)
        const fallback: AppUser = {
          id: fbUser.uid,
          email: fbUser.email ?? "",
          name: fbUser.displayName ?? "",
          role: "user",
        };
        setUser(fallback);
        return fallback;
      }
    } catch (err) {
      console.warn("login: error reading/creating users doc:", err);
      const fallback: AppUser = {
        id: fbUser.uid,
        email: fbUser.email ?? "",
        name: fbUser.displayName ?? "",
        role: "user",
      };
      setUser(fallback);
      return fallback;
    }
  }

  async function register(name: string, email: string, password: string): Promise<AppUser | null> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;
    try {
      if (name) await updateProfile(fbUser, { displayName: name });
    } catch (e) {
      console.warn("updateProfile failed:", e);
    }
    try {
      await setDoc(doc(db, "users", fbUser.uid), { displayName: name, email, role: "user", createdAt: new Date() });
    } catch (e) {
      console.warn("setDoc users failed:", e);
    }
    const appUser: AppUser = { id: fbUser.uid, email: fbUser.email ?? "", name, role: "user" };
    setUser(appUser);
    return appUser;
  }

  async function logout() {
    await firebaseSignOut(auth);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
