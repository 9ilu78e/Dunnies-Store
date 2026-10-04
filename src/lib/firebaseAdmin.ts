import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";

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
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw new FirebaseAdminConfigurationError(
      "Google sign-in is not configured on the server. Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID to your Firebase project ID in the Render service environment, then redeploy."
    );
  }

  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new FirebaseAdminConfigurationError(
      "Google sign-in server credentials are incomplete. Set both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or configure application default credentials."
    );
  }

  admin.initializeApp({
    projectId,
    ...(clientEmail && privateKey
      ? {
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        }
      : {}),
  });

  return getAuth();
}

export default admin;
