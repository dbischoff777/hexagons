import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  // Development config values
  apiKey: "your-test-api-key",
  authDomain: "your-test-project.firebaseapp.com",
  projectId: "your-test-project",
  storageBucket: "your-test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 