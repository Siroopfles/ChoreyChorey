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
    loginWithGoogle: () => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User);
                }
            } else {
                setAuthUser(null);
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        toast({
            title: `Fout bij ${context}`,
            description: error.message,
            variant: 'destructive',
        });
    }
    
    const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);
            return userData;
        }
        return null;
    }

    const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            await fetchAndSetUser(userCredential.user);
            return true;
        } catch (error) {
            handleError(error, 'inloggen');
            return false;
        }
    };

    const signupWithEmail = async (email: string, pass: string, name: string): Promise<boolean> => {
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
            setUser(newUser);
            return true;
        } catch (error) {
            handleError(error, 'registreren');
            return false;
        }
    };

    const loginWithGoogle = async (): Promise<boolean> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                await fetchAndSetUser(firebaseUser);
            } else {
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
                    name: firebaseUser.displayName || 'Google User',
                    email: firebaseUser.email || '',
                    points: 0,
                    avatar: avatarUrl,
                    achievements: [],
                };
                await setDoc(userDocRef, newUser);
                setUser(newUser);
            }
            return true;
        } catch (error) {
            handleError(error, 'inloggen met Google');
            return false;
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
            await fetchAndSetUser(auth.currentUser);
        }
    }, []);
    
    const value = {
        authUser,
        user,
        loading,
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
