import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// User's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzjyaQRyr-4XXP4IQgmqkKCzkCmybIkPk",
  authDomain: "studio-2286653873-edb5d.firebaseapp.com",
  projectId: "studio-2286653873-edb5d",
  storageBucket: "studio-2286653873-edb5d.firebasestorage.app",
  messagingSenderId: "823268710331",
  appId: "1:823268710331:web:f271e7db8b6494bd93569e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
