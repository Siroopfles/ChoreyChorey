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
    signInWithRedirect,
    signOut,
    type User as FirebaseUser,
    getRedirectResult,
    GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions';

type AuthContextType = {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    loginWithEmail: (email: string, pass: string) => Promise<boolean>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<boolean>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);

        if (error.code === 'auth/popup-closed-by-user') {
            toast({
                title: 'Login geannuleerd',
                description: 'Het login-venster is gesloten voordat het proces voltooid was.',
            });
            return;
        }
        if (error.code === 'auth/unauthorized-domain') {
            toast({
                title: 'Domein niet geautoriseerd',
                description: 'Dit domein is niet goedgekeurd. Voeg het toe in de Firebase Console onder Authenticatie > Instellingen > Geautoriseerde domeinen.',
                variant: 'destructive',
                duration: 9000,
            });
            return;
        }

        toast({
            title: `Fout bij ${context}`,
            description: error.message,
            variant: 'destructive',
        });
    }

    useEffect(() => {
      const processRedirectResult = async () => {
        try {
          await getRedirectResult(auth);
        } catch (error: any) {
          handleError(error, 'inloggen met Google');
        } finally {
          setIsProcessingRedirect(false);
        }
      };
      processRedirectResult();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setAuthLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    let avatarUrl = firebaseUser.photoURL || `https://placehold.co/100x100.png`;
                    try {
                        const avatarResult = await handleGenerateAvatar(firebaseUser.displayName || firebaseUser.email!);
                        if (avatarResult.avatarDataUri) {
                            avatarUrl = avatarResult.avatarDataUri;
                        }
                    } catch (aiError) {
                        console.error("Failed to generate AI avatar, using placeholder.", aiError);
                    }
                    const newUser: User = {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                        email: firebaseUser.email || '',
                        points: 0,
                        avatar: avatarUrl,
                        achievements: [],
                    };
                    await setDoc(userDocRef, newUser);
                    setUser(newUser);
                } else {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User);
                }
            } else {
                setAuthUser(null);
                setUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
        setAuthLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (error) {
            handleError(error, 'inloggen');
            setAuthLoading(false);
            return false;
        }
    };

    const signupWithEmail = async (email: string, pass: string, name: string): Promise<boolean> => {
        setAuthLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;
            
            let avatarUrl = `https://placehold.co/100x100.png`;
            try {
                const avatarResult = await handleGenerateAvatar(name);
                if (avatarResult.avatarDataUri) {
                    avatarUrl = avatarResult.avatarDataUri;
                }
            } catch (aiError) {
                console.error("Failed to generate AI avatar, using placeholder.", aiError);
            }

            const newUser: User = {
                id: firebaseUser.uid,
                name,
                email,
                points: 0,
                avatar: avatarUrl,
                achievements: [],
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            return true;
        } catch (error) {
            handleError(error, 'registreren');
            setAuthLoading(false);
            return false;
        }
    };

    const loginWithGoogle = async (): Promise<void> => {
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            handleError(error, 'inloggen met Google');
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            handleError(error, 'uitloggen');
        }
    };

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            setAuthLoading(true);
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUser({ id: userDoc.id, ...userDoc.data() } as User);
            }
            setAuthLoading(false);
        }
    }, []);
    
    const value = {
        authUser,
        user,
        loading: authLoading || isProcessingRedirect,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
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
