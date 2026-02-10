import { getCurrentFirebaseUser } from './firebaseAuth';

export interface CurrentUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: 'firebase' | 'email';
  role?: string;
}

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  // First try to get Firebase user
  try {
    const firebaseUser = await getCurrentFirebaseUser();
    if (firebaseUser) {
      console.log('Found Firebase user:', firebaseUser);
      return {
        ...firebaseUser,
        provider: 'firebase'
      };
    }
  } catch (error) {
    console.log('No Firebase user found');
  }

  // If no Firebase user, check for email verification
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split('; ');
    console.log('All cookies:', cookies);
    
    const emailVerified = cookies.find(row => row.startsWith('email_verified='));
    const userId = cookies.find(row => row.startsWith('userId='));

    console.log('Email verified cookie:', emailVerified);
    console.log('User ID cookie:', userId);

    if (emailVerified && userId) {
      const email = decodeURIComponent(emailVerified.split('=')[1]);
      const uid = userId.split('=')[1];
      
      console.log('Creating email user with:', { email, uid });
      
      return {
        uid,
        email,
        displayName: email.split('@')[0], // Use email prefix as display name
        photoURL: null,
        provider: 'email',
        role: 'user' // Default role for email users
      };
    }
  }

  console.log('No user found, returning null');
  return null;
};
