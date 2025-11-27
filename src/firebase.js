// ✅ Firebase SDK (Frontend-safe)
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// 🔧 Firebase config for aced-9cf72 (public-safe)
const firebaseConfig = {
  apiKey: "AIzaSyDg032Kbbm2NbSYgYiwu_xgQDUZ1vHf1jA",
  authDomain: "aced.live",
  projectId: "aced-9cf72",
  storageBucket: "aced-9cf72.appspot.com",
  messagingSenderId: "295500018562",
  appId: "1:295500018562:web:1bf3a721401ab29665559b",
  measurementId: "G-VH244VZZD8"
};

// 🚀 Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 📊 Optional: Analytics (only in browser context)
let analytics = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// ✅ Export Firebase instances + helpers
export {
  app,
  db,
  auth,
  analytics,
  doc,
  getDoc,
  updateDoc
};
