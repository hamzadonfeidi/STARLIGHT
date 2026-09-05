import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration.
// By default, this uses Vite environment variables.
// If you're not using a .env file, you can directly replace the empty strings below
// with the values from your Firebase Project Console (Project Settings > Web App).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize Firebase App
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Initialize Firebase Authentication
export const auth = isFirebaseConfigured ? getAuth(app) : null;

// Configure Auth Providers
export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;
if (googleProvider) {
  // Force Google account selection prompt on every login
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

// Initialize Cloud Firestore Database
export const db = isFirebaseConfigured ? getFirestore(app) : null;

export default app;
