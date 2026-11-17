import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAT-RpxaldSac0XNr1FCM0Vla5L3OLHzYM",
  authDomain: "banking-software-b9e22.firebaseapp.com",
  projectId: "banking-software-b9e22",
  storageBucket: "banking-software-b9e22.firebasestorage.app",
  messagingSenderId: "733253578016",
  appId: "1:733253578016:web:50704a5fd26eecd3b07b45",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
