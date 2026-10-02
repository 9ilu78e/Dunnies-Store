import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigurationError";
  }
}

export function getFirebaseAdminAuth() {
  if (admin.apps.length) {
    return getAuth();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!projectId) {
    throw new FirebaseAdminConfigurationError(
      "Google sign-in is not configured on the server. Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID to your Firebase project ID in the Render service environment, then redeploy."
    );
  }

  admin.initializeApp({ projectId });

  return getAuth();
}

export default admin;
