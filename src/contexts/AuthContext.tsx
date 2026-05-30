import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
        
        // Use onSnapshot for real-time updates
        unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as User;
            // Ensure email is present from firebaseUser if missing in doc
            if (!data.email && firebaseUser.email) {
              data.email = firebaseUser.email;
            }

            // Dynamically generate referral code if missing
            if (!data.referralCode) {
              const cleanedName = (data.displayName || 'USER').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
              const genCode = `${cleanedName}${Math.floor(1000 + Math.random() * 9000)}`;
              await updateDoc(userRef, { referralCode: genCode });
              return;
            }

            const isEmailAdmin = (data.email && ADMIN_EMAILS.includes(data.email.trim().toLowerCase())) || 
                                 (firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.trim().toLowerCase()));
            const isNameAdmin = (data.displayName && data.displayName.toLowerCase().trim() === 'aryan gadewar') ||
                                (firebaseUser.displayName && firebaseUser.displayName.toLowerCase().trim() === 'aryan gadewar');
            
            setUser({ ...data, isAdmin: !!(isEmailAdmin || isNameAdmin) });
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
