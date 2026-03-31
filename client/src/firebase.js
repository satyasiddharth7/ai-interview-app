import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBa8gOzxPcew_yLWtUJAGvrCE42kk1wFPo",
  authDomain: "ai-interview-app-a0a02.firebaseapp.com",
  projectId: "ai-interview-app-a0a02",
  storageBucket: "ai-interview-app-a0a02.firebasestorage.app",
  messagingSenderId: "694021897987",
  appId: "1:694021897987:web:68171b432472d9eae57336"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();



























































