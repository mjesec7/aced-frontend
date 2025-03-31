// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg032Kbbm2NbSYgYiwu_xgQDUZ1vHf1jA",
  authDomain: "aced-9cf72.firebaseapp.com",
  projectId: "aced-9cf72",
  storageBucket: "aced-9cf72.appspot.com", // ✅ Fixed the incorrect URL
  messagingSenderId: "295500018562",
  appId: "1:295500018562:web:1bf3a721401ab29665559b",
  measurementId: "G-VH244VZZD8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export everything in ONE statement
export { db, auth, doc, getDoc, updateDoc };
