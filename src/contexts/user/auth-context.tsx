
'use client';

import { 
    useState, 
    useEffect, 
    createContext, 
    useContext, 
    type ReactNode,
    useCallback
} from 'react';
import { useRouter } from 'next/navigation';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User as FirebaseUser,
    getAdditionalUserInfo,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider, microsoftProvider } from '@/lib/core/firebase';
import { 
  type User, 
  type UserStatus, 
  type WidgetInstance,
} from '@/lib/types';
import {
    type Organization,
} from '@/lib/types/organizations';
import { useToast } from '@/hooks/use-toast';
import { useDebug } from '@/contexts/system/debug-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateAvatar } from '@/ai/flows/generative-ai/generate-avatar-flow';


const SESSION_STORAGE_KEY = 'chorey_session_id';

type AuthContextType = {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    mfaRequired: boolean;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithMicrosoft: () => Promise<void>;
    logout: (message?: { title: string, description: string }) => void;
    completeMfa: () => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultDashboardConfig: WidgetInstance[] = [
  { id: 'widget-welcome', type: 'welcome', config: {} },
  { id: 'widget-mytasks', type: 'myTasks', config: { limit: 5 } },
  { id: 'widget-activity', type: 'activityFeed', config: {} },
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useLocalStorage(SESSION_STORAGE_KEY, '');
    const router = useRouter();
    const { toast } = useToast();
    const { isDebugMode } = useDebug();

    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        if (isDebugMode) {
            console.log(`[DEBUG] Full error object in ${context}:`, error);
        }
        toast({
            title: `Fout bij ${context}`,
            description: error.message,
            variant: 'destructive',
        });
    }

    const logout = useCallback(async (message?: { title: string, description: string }) => {
        try {
            if (currentSessionId) {
                const sessionRef = doc(db, 'sessions', currentSessionId);
                await updateDoc(sessionRef, { isActive: false }).catch(console.error);
            }
            setCurrentSessionId('');
            setMfaRequired(false);
            await signOut(auth);
            if (message) {
                toast(message);
            }
            router.push('/login');
        } catch (error) {
            handleError(error, 'uitloggen');
        }
    }, [currentSessionId, setCurrentSessionId, toast, router]);

    const fetchUserAndOrgData = useCallback(async (firebaseUser: FirebaseUser) => {
        if (isDebugMode) console.log('[DEBUG] AuthContext: Running fetchUserAndOrgData for', firebaseUser.uid);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
              if (isDebugMode) console.warn('[DEBUG] AuthContext: No user document found for UID:', firebaseUser.uid);
              return;
          }

          const rawData = userDoc.data();
          const userData: User = {
              id: userDoc.id,
              ...rawData,
              status: rawData.status ? {
                  ...rawData.status,
                  until: (rawData.status.until as Timestamp | null)?.toDate() ?? null,
              } : { type: 'Offline', until: null },
              lastDigestSentAt: (rawData.lastDigestSentAt as Timestamp | null)?.toDate() ?? undefined,
              dashboardConfig: rawData.dashboardConfig || defaultDashboardConfig,
              cosmetic: rawData.cosmetic || {},
              streakData: rawData.streakData ? {
                  ...rawData.streakData,
                  lastCompletionDate: (rawData.streakData.lastCompletionDate as Timestamp).toDate(),
              } : undefined,
          } as User;
          setUser(userData);

        } catch (error) {
           handleError(error, 'laden gebruikers- en org data');
        }
    }, [isDebugMode]);
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Auth state changed. User:', firebaseUser?.uid || 'null');
            
            setLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                if (!mfaRequired) {
                    await fetchUserAndOrgData(firebaseUser);
                }
            } else {
                setAuthUser(null);
                setUser(null);
                setMfaRequired(false);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
        };
    }, [fetchUserAndOrgData, isDebugMode, mfaRequired]);

    const createSession = async (uid: string) => {
        const sessionId = crypto.randomUUID();
        await setDoc(doc(db, 'sessions', sessionId), {
            userId: uid,
            createdAt: new Date(),
            lastAccessed: new Date(),
            userAgent: navigator.userAgent,
            isActive: true,
        });
        setCurrentSessionId(sessionId);
    };

    const handleLoginSuccess = async (firebaseUser: FirebaseUser) => {
        setAuthUser(firebaseUser); // Set auth user immediately
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
            setMfaRequired(true);
            router.push('/login/verify');
        } else {
            await createSession(firebaseUser.uid);
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            const credential = await signInWithEmailAndPassword(auth, email, pass);
            await handleLoginSuccess(credential.user);
        } catch (error) {
            handleError(error, 'inloggen');
            throw error;
        }
    };

    const signupWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;
            
            let avatarUrl = `https://placehold.co/100x100.png`;
            try {
                const result = await generateAvatar({ userId: firebaseUser.uid, name: name });
                if (result.avatarUrl) {
                    avatarUrl = result.avatarUrl;
                }
            } catch (aiError) {
                console.error("Failed to generate AI avatar, using placeholder.", aiError);
            }

            const newUser: Omit<User, 'id'> = {
                name,
                email,
                avatar: avatarUrl,
                organizationIds: [],
                currentOrganizationId: null,
                status: { type: 'Online', until: null }
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            await createSession(firebaseUser.uid);
            setUser({ id: firebaseUser.uid, ...newUser });

        } catch (error) {
            handleError(error, 'registreren');
            throw error;
        }
    };

    const loginWithGoogle = async (): Promise<void> => {
        setLoading(true);
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            const firebaseUser = userCredential.user;
            const additionalInfo = getAdditionalUserInfo(userCredential);

            if (additionalInfo?.isNewUser) {
                let avatarUrl = firebaseUser.photoURL || `https://placehold.co/100x100.png`;
                try {
                    const result = await generateAvatar({ userId: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email! });
                    if (result.avatarUrl) {
                        avatarUrl = result.avatarUrl;
                    }
                } catch (aiError) {
                    console.error("Failed to generate AI avatar, using placeholder.", aiError);
                }

                const newUser: Omit<User, 'id'> = {
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                    email: firebaseUser.email!,
                    avatar: avatarUrl,
                    organizationIds: [],
                    currentOrganizationId: null,
                    status: { type: 'Online', until: null },
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            }
            
            await handleLoginSuccess(firebaseUser);

        } catch (error: any) {
            handleError(error, 'inloggen met Google');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithMicrosoft = async (): Promise<void> => {
        setLoading(true);
        try {
            const userCredential = await signInWithPopup(auth, microsoftProvider);
            const firebaseUser = userCredential.user;
            const additionalInfo = getAdditionalUserInfo(userCredential);

            if (additionalInfo?.isNewUser) {
                let avatarUrl = firebaseUser.photoURL || `https://placehold.co/100x100.png`;
                 try {
                    const result = await generateAvatar({ userId: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email! });
                    if (result.avatarUrl) {
                        avatarUrl = result.avatarUrl;
                    }
                } catch (aiError) {
                    console.error("Failed to generate AI avatar, using placeholder.", aiError);
                }

                const newUser: Omit<User, 'id'> = {
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                    email: firebaseUser.email!,
                    avatar: avatarUrl,
                    organizationIds: [],
                    currentOrganizationId: null,
                    status: { type: 'Online', until: null },
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            }

            await handleLoginSuccess(firebaseUser);
        } catch (error: any) {
            handleError(error, 'inloggen met Microsoft');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentSessionId || !db || !authUser) return;

        const sessionRef = doc(db, 'sessions', currentSessionId);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().isActive === false) {
                logout({
                    title: 'Sessie beëindigd',
                    description: 'U bent op afstand uitgelogd vanuit deze sessie.',
                    variant: 'destructive',
                });
            } else if (!docSnap.exists()) {
                 logout();
            }
        });

        const interval = setInterval(() => {
             if (document.visibilityState === 'visible') {
                updateDoc(sessionRef, { lastAccessed: new Date() }).catch(console.error);
            }
        }, 1000 * 60 * 5); // every 5 minutes

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [currentSessionId, authUser, logout]);

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            setLoading(true);
            await fetchUserAndOrgData(auth.currentUser);
            setLoading(false);
        }
    }, [fetchUserAndOrgData]);
    
    const completeMfa = async () => {
        if (authUser) {
            setMfaRequired(false);
            await createSession(authUser.uid);
            router.push('/dashboard');
        }
    };

    const value = {
        authUser,
        user,
        loading,
        mfaRequired,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        completeMfa,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
