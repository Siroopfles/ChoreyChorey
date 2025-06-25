'use client';

import { 
    useState, 
    useEffect, 
    createContext, 
    useContext, 
    type ReactNode 
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions';

type AuthContextType = {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    loginWithEmail: (email: string, pass: string) => Promise<any>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<any>;
    loginWithGoogle: () => Promise<any>;
    logout: () => void;
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
                } else {
                    // This can happen if the user doc creation is delayed
                    setUser(null);
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

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setUser(userData);
            } else {
                 handleError({ message: 'Gebruikersprofiel niet gevonden na inloggen.' }, 'inloggen');
                 return;
            }
            return userCredential;
        } catch (error) {
            handleError(error, 'inloggen');
        }
    };

    const signupWithEmail = async (email: string, pass: string, name: string) => {
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
                toast({
                    title: 'AI Avatar Mislukt',
                    description: 'Kon geen unieke avatar genereren. Een standaardafbeelding wordt gebruikt.',
                });
            }

            const newUser: User = {
                id: firebaseUser.uid,
                name,
                email,
                points: 0,
                avatar: avatarUrl,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
            return userCredential;
        } catch (error) {
            handleError(error, 'registreren');
        }
    };

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setUser(userData);
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
                    avatar: avatarUrl
                };
                await setDoc(userDocRef, newUser);
                setUser(newUser);
            }
            return result;
        } catch (error) {
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
    
    const value = {
        authUser,
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
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
