import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZx8ZoZrHs4oqHbq1n_3hK-0iKh8TwZM8",
  authDomain: "websitekelas-7d9b9.firebaseapp.com",
  projectId: "websitekelas-7d9b9",
  storageBucket: "websitekelas-7d9b9.firebasestorage.app",
  messagingSenderId: "840909260920",
  appId: "1:840909260920:web:eb3d8300114ab695ed858d",
  measurementId: "G-SCGW49409Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
