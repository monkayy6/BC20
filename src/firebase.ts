import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC30dl88c1E7co5MACDCqsLtE2Eh7uS5zc",
  authDomain: "behrend-connect.firebaseapp.com",
  projectId: "behrend-connect",
  storageBucket: "behrend-connect.firebasestorage.app",
  messagingSenderId: "248607509377",
  appId: "1:248607509377:web:093d7c397e7976d8623680"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);