import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';
import { ADMIN_EMAILS } from '../constants';
import { normalizeLocation } from '../lib/locationUtils';

interface AuthContextType {
  user: (User & { isAdmin?: boolean }) | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { isAdmin?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const isAdmin = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.trim().toLowerCase());
        
        console.log('Auth State Change:', { email: firebaseUser.email, isAdmin });

        // Use onSnapshot for real-time updates
        unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as User;
            // Ensure email is present from firebaseUser if missing in doc
            if (!data.email && firebaseUser.email) {
              data.email = firebaseUser.email;
            }
            setUser({ ...data, isAdmin: !!isAdmin });
            setLoading(false);
          } else {
            // New user setup - only if document doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              location: {
                areaName: normalizeLocation('Mumbai'),
                lat: 19.076,
                lng: 72.877
              },
              language: 'en'
            };
            await setDoc(userRef, newUser);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
