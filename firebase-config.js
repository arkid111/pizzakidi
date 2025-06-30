// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiSr5ICPHe5QBwfFWb9dCnBhygjtvOOQA",
  authDomain: "pizzakidiapp.firebaseapp.com",
  projectId: "pizzakidiapp",
  storageBucket: "pizzakidiapp.firebasestorage.app",
  messagingSenderId: "651903022076",
  appId: "1:651903022076:web:e92f2b198397c1ffb5b879",
  measurementId: "G-GLSRV3669P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
