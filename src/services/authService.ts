export interface CurrentUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: 'firebase' | 'email';
  role?: string;
}

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const response = await fetch("/api/auth/current", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user as CurrentUser;
  } catch (error) {
    console.error("Unable to get current user:", error);
    return null;
  }
};
