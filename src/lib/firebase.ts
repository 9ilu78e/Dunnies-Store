import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: any = null;
let auth: any = null;
let analytics: any = null;
let googleProvider: any = null;

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

// Google Sign-In function
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please ensure you are running in a browser environment.');
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Force token refresh to avoid expired tokens
    const idToken = await user.getIdToken(true);
    
    // Send token to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds timeout
    
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to authenticate with backend');
      }
      
      const data = await response.json();
      console.log('Google auth successful:', data);
      return { user: data.user, token: idToken };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // If it's an abort error, but we have a Firebase user, try to continue
      if (error.name === 'AbortError' && user) {
        console.warn('Backend timeout, but Firebase auth successful. Using fallback.');
        // Create fallback user data
        return { 
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photo: user.photoURL,
            provider: "firebase",
            role: "user" // Default to user role on timeout
          }, 
          token: idToken 
        };
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
};

// Email Sign-In function
export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please ensure you are running in a browser environment.');
  }
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Send token to backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with backend');
    }
    
    const data = await response.json();
    return { user: data.user, token: idToken };
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
};

export { app, analytics, auth, googleProvider };
export default app;
