import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD89AtfUxLilCCrYa8qZZiqu5p3s10orqE",
  authDomain: "sistema-control-muestras.firebaseapp.com",
  projectId: "sistema-control-muestras",
  storageBucket: "sistema-control-muestras.firebasestorage.app",
  messagingSenderId: "274564730861",
  appId: "1:274564730861:web:1f45bd87ecc614c3f261e4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);