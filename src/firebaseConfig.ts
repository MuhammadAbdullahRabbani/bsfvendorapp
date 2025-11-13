// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth,setPersistence,browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaYswy7rM-SZus9qimJateWGV11XY3m9w",
  authDomain: "venodrdb.firebaseapp.com",
  projectId: "venodrdb",
  storageBucket: "venodrdb.firebasestorage.app",
  messagingSenderId: "1064515822633",
  appId: "1:1064515822633:web:512ca851c1a299b112a838"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);