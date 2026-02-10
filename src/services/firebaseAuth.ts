import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const getCurrentFirebaseUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const auth = getAuth(app);
    
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      resolve({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      });
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        resolve(null);
      }
    });
  });
};

export const signOutFirebase = async () => {
  const auth = getAuth(app);
  await auth.signOut();
  
  // Clear all local storage data
  localStorage.removeItem('userId');
  localStorage.removeItem('cart');
  localStorage.removeItem('wishlist');
  
  // Clear any session data
  if (typeof window !== 'undefined') {
    // Clear any potential session cookies or data
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }
};
