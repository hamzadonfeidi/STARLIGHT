import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  getRedirectResult,
  signInWithPopup, 
  signInWithRedirect,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext();
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

const getSavedMockUser = () => {
  if (isFirebaseConfigured || typeof window === 'undefined') return null;

  try {
    const savedUser = localStorage.getItem('starlight_mock_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem('starlight_mock_user');
    return null;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getSavedMockUser);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // Sign up with Email and Password
  const signup = (email, password) => {
    if (!isFirebaseConfigured) {
      // Mock signup for demo mode
      const mockUser = { email, uid: 'mock-user-id' };
      setCurrentUser(mockUser);
      localStorage.setItem('starlight_mock_user', JSON.stringify(mockUser));
      return Promise.resolve(mockUser);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Log in with Email and Password
  const login = (email, password) => {
    if (!isFirebaseConfigured) {
      // Mock login for demo mode
      const mockUser = { email, uid: 'mock-user-id' };
      setCurrentUser(mockUser);
      localStorage.setItem('starlight_mock_user', JSON.stringify(mockUser));
      return Promise.resolve(mockUser);
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out
  const logout = () => {
    if (!isFirebaseConfigured) {
      setCurrentUser(null);
      localStorage.removeItem('starlight_mock_user');
      return Promise.resolve();
    }
    return signOut(auth);
  };

  // Sign in / Sign up with Google Popup
  const loginWithGoogle = async ({ redirect = false } = {}) => {
    if (!isFirebaseConfigured) {
      const mockUser = { email: 'hamzadonfeidi@gmail.com', displayName: 'Hamza', uid: 'mock-user-id' };
      setCurrentUser(mockUser);
      localStorage.setItem('starlight_mock_user', JSON.stringify(mockUser));
      return Promise.resolve(mockUser);
    }

    if (redirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (POPUP_FALLBACK_CODES.has(error.code)) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      throw error;
    }
  };

  // Check if current user has Admin privileges
  const isAdmin = currentUser && currentUser.email === 'hamzadonfeidi@gmail.com';

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    getRedirectResult(auth).catch((error) => {
      console.error('Google redirect sign-in failed:', error.code, error.message);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user: currentUser,
    loading,
    isAdmin,
    signup,
    login,
    isDemoMode: !isFirebaseConfigured,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
