import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

export function getFirebaseAdminAuth() {
  if (admin.apps.length) {
    return getAuth();
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    .trim();
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "dunnis-store";

  const missingSettings = [
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !privateKey && "FIREBASE_PRIVATE_KEY",
  ].filter(Boolean);

  if (missingSettings.length > 0) {
    throw new Error(
      `Firebase Admin is not configured. Set ${missingSettings.join(" and ")} in the deployment environment.`
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
