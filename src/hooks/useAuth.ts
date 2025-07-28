import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import type { AppUser } from '../types';
import { Role, FIRESTORE_COLLECTIONS } from '../types';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth,
      (firebaseUser: User | null) => {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }

        if (firebaseUser) {
          const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid);
          
          unsubscribeUserDoc = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as AppUser;

                if (userData.status === 'disabled') {
                    console.log(`User ${firebaseUser.uid} is disabled. Logging out.`);
                    signOut(auth);
                    setAuthState({ user: null, loading: false, error: null });
                    return;
                }

                const appUser: AppUser = {
                  ...userData,
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: userData.displayName || firebaseUser.displayName,
                  photoURL: userData.photoURL || firebaseUser.photoURL,
                  role: userData.role || Role.EMPLOYEE,
                  status: userData.status || 'active',
                };
                setAuthState({ user: appUser, loading: false, error: null });
            } else {
                console.warn(`No user document found in Firestore for UID: ${firebaseUser.uid}`);
                signOut(auth);
                setAuthState({ user: null, loading: false, error: new Error('User data not found.') });
            }
          }, (error) => {
            console.error("Error listening to user document:", error);
            signOut(auth);
            setAuthState({ user: null, loading: false, error });
          });
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
      },
      (error: Error) => {
        setAuthState({ user: null, loading: false, error });
      }
    );

    return () => {
        unsubscribeAuth();
        if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
        }
    };
  }, []);

  return authState;
};