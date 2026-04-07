import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyD6fwguFWx9zeBxCRcLPRSO9vImFH5hYTo",
  authDomain: "financeflow-12683.firebaseapp.com",
  projectId: "financeflow-12683",
  storageBucket: "financeflow-12683.firebasestorage.app",
  messagingSenderId: "967832168024",
  appId: "1:967832168024:web:2da1a47093c934a66d0c2d",
  measurementId: "G-PWJHYC9KLN"
};

export const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);