import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

const AuthContext = createContext(null);

const MAGIC_LINK_EMAIL_KEY = 'ame-vat-capture:magic-link-email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      role: user ? (user.email ? 'accountant' : 'client') : null,

      async loginWithPassword(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
      },

      async sendMagicLink(email, redirectPath = '/capture') {
        const actionCodeSettings = {
          url: `${window.location.origin}/magic-link-callback?next=${encodeURIComponent(redirectPath)}`,
          handleCodeInApp: true
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
      },

      async completeMagicLinkSignIn(href) {
        if (!isSignInWithEmailLink(auth, href)) {
          throw new Error('Invalid magic link');
        }
        let email = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
        if (!email) {
          email = window.prompt('Please confirm your email address to finish signing in');
        }
        if (!email) {
          throw new Error('Email required to complete sign in');
        }
        const credential = await signInWithEmailLink(auth, email, href);
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        return credential.user;
      },

      async logout() {
        await signOut(auth);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
