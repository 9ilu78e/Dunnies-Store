"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getCurrentUser } from "@/services/authService";

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Determine role - only admin for your specific email
        const isAdmin = currentUser.email === 'toonm831@gmail.com';
        const role = isAdmin ? 'admin' : 'user';
        
        const userData: User = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          photoURL: currentUser.photoURL,
          provider: currentUser.provider,
          role: role
        };
        
        setUser(userData);
        console.log('Auth context: User loaded', userData.email, 'Role:', role);
      } else {
        setUser(null);
        console.log('Auth context: No user found');
      }
    } catch (error) {
      console.error('Auth context: Error loading user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshUser,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}