// src/stores/authStore.ts
import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/firebaseConfig"; // ✅ adjust path if needed

// 🔑 Extend store type to include a private _inited flag
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  _inited: boolean; // private flag
  init: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,  // start true until Firebase resolves
  error: null,
  _inited: false,

  // 🔁 Start the Firebase auth listener
  init: () => {
    if (get()._inited) return; // no "any" cast needed
    set({ _inited: true });

    onAuthStateChanged(auth, (u) => {
      set({ user: u, loading: false, error: null });
    });
  },

  // 🔐 Email/Password Sign In
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      set({ user: cred.user });
    } catch (err) {
      const e = err as FirebaseError;
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  // ✳️ Optional: Sign Up (not needed if you only create users in console)
  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      set({ user: cred.user });
    } catch (err) {
      const e = err as FirebaseError;
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  // ✳️ Optional: Google sign-in
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      set({ user: cred.user });
    } catch (err) {
      const e = err as FirebaseError;
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  // 🔁 Password reset
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const e = err as FirebaseError;
      set({ error: e.message });
      throw e;
    }
  },

  // 🚪 Sign out
  signOutUser: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (err) {
      const e = err as FirebaseError;
      set({ error: e.message });
      throw e;
    }
  },

  // Manual setter
  setUser: (user) => set({ user }),
}));
