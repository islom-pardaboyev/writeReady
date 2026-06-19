import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";  
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBX1nra0EqXDL7xkL6fD_AcMOc09pEKY1M",
  authDomain: "writing-database-d0b7c.firebaseapp.com",
  projectId: "writing-database-d0b7c",
  storageBucket: "writing-database-d0b7c.firebasestorage.app",
  messagingSenderId: "1004044443581",
  appId: "1:1004044443581:web:3bfdf0ab147ed0b7bfbcd4",
  measurementId: "G-SGCXYWD9F7"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);