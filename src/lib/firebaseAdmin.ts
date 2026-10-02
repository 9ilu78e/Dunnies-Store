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

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const privateKey = rawPrivateKey
    ?.replace(/^["']([\s\S]*)["']$/, "$1")
    ?.replace(/\\n/g, "\n")
    .trim();
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    const missingSettings = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);
    throw new FirebaseAdminConfigurationError(
      `Google sign-in is not configured on the server. Set ${missingSettings.join(", ")} in the Render service environment, then redeploy.`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getAuth();
}

export default admin;
