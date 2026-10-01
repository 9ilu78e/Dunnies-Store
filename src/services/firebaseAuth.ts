import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const getCurrentFirebaseUser = (): Promise<FirebaseUser | null> => {
  if (!app) {
    return Promise.resolve(null);
  }

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
  let logoutError: Error | null = null;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error(`Logout request failed (${response.status})`);
    }
  } catch (error) {
    logoutError =
      error instanceof Error ? error : new Error("Unable to clear server session");
  }

  if (app) {
    try {
      await getAuth(app).signOut();
    } catch (error) {
      if (!logoutError) {
        logoutError =
          error instanceof Error ? error : new Error("Unable to sign out of Firebase");
      }
    }
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem("userId");
    for (const name of ["auth_token", "email_verified", "userId"]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  }

  if (logoutError) throw logoutError;
};
