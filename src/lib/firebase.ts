
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-kcbyEgY12WUfX-C7Jwje4Z4yiJjxVmI",
  authDomain: "freequickgstwithcma-cbixf.firebaseapp.com",
  projectId: "freequickgstwithcma-cbixf",
  storageBucket: "freequickgstwithcma-cbixf.firebasestorage.app",
  messagingSenderId: "225041713850",
  appId: "1:225041713850:web:3888fb5f9856047f53d083"
};

// Initialize Firebase App in a robust way
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
