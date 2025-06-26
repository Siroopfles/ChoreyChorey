
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
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User, Organization, Team, RoleName } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions/ai.actions';

type AuthContextType = {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    organizations: Organization[];
    currentOrganization: Organization | null;
    currentUserRole: RoleName | null;
    switchOrganization: (orgId: string) => Promise<void>;
    teams: Team[];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<RoleName | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        toast({
            title: `Fout bij ${context}`,
            description: error.message,
            variant: 'destructive',
        });
    }

    const fetchUserAndOrgData = useCallback(async (firebaseUser: FirebaseUser) => {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.warn("No user document found for existing auth user. This may happen briefly during signup.");
            return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);

        if (userData.organizationIds && userData.organizationIds.length > 0) {
            const orgsQuery = query(collection(db, 'organizations'), where('__name__', 'in', userData.organizationIds));
            const orgsSnapshot = await getDocs(orgsQuery);
            const userOrgs = orgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
            setOrganizations(userOrgs);

            let currentOrg = null;
            if (userData.currentOrganizationId && userOrgs.some(o => o.id === userData.currentOrganizationId)) {
                currentOrg = userOrgs.find(o => o.id === userData.currentOrganizationId) || null;
            } else if (userOrgs.length > 0) {
                currentOrg = userOrgs[0];
                await updateDoc(userDocRef, { currentOrganizationId: currentOrg.id });
            }
            
            setCurrentOrganization(currentOrg);
            
            if (currentOrg) {
                 // Self-healing: Ensure the organization owner has the 'Owner' role.
                 // This handles legacy data where the `members` map might be missing or incomplete.
                 let orgNeedsUpdate = false;
                 let members = currentOrg.members || {};
                 if (!currentOrg.members || !members[currentOrg.ownerId]) {
                    members[currentOrg.ownerId] = { role: 'Owner' };
                    orgNeedsUpdate = true;
                 }
                 
                 if (orgNeedsUpdate) {
                    try {
                        const orgRef = doc(db, 'organizations', currentOrg.id);
                        await updateDoc(orgRef, { members });
                        currentOrg.members = members; // Update local copy
                        setOrganizations(prevOrgs => prevOrgs.map(o => o.id === currentOrg!.id ? currentOrg! : o));
                    } catch (e) {
                        handleError(e, 'corrigeren van organisatierol');
                    }
                 }

                 const role = (currentOrg.members || {})[firebaseUser.uid]?.role || null;
                 setCurrentUserRole(role);

                 const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', currentOrg.id));
                 const teamsSnapshot = await getDocs(teamsQuery);
                 const orgTeams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
                 setTeams(orgTeams);
            } else {
                 setTeams([]);
                 setCurrentUserRole(null);
            }

        } else {
            setOrganizations([]);
            setCurrentOrganization(null);
            setCurrentUserRole(null);
            setTeams([]);
        }
    }, []);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                await fetchUserAndOrgData(firebaseUser);
            } else {
                setAuthUser(null);
                setUser(null);
                setOrganizations([]);
                setCurrentOrganization(null);
                setCurrentUserRole(null);
                setTeams([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserAndOrgData]);

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
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
                const { avatarDataUri } = await handleGenerateAvatar(name);
                if (avatarDataUri) {
                    avatarUrl = avatarDataUri;
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
                organizationIds: [],
                currentOrganizationId: null,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
            setOrganizations([]);
            setCurrentOrganization(null);

        } catch (error) {
            handleError(error, 'registreren');
            throw error;
        }
    };

    const loginWithGoogle = async (): Promise<void> => {
        setLoading(true);
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            const additionalInfo = getAdditionalUserInfo(userCredential);

            if (additionalInfo?.isNewUser) {
                const firebaseUser = userCredential.user;
                let avatarUrl = firebaseUser.photoURL || `https://placehold.co/100x100.png`;
                try {
                    const { avatarDataUri } = await handleGenerateAvatar(firebaseUser.displayName || firebaseUser.email!);
                    if (avatarDataUri) {
                        avatarUrl = avatarDataUri;
                    }
                } catch (aiError) {
                    console.error("Failed to generate AI avatar, using placeholder.", aiError);
                }

                const newUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                    email: firebaseUser.email!,
                    points: 0,
                    avatar: avatarUrl,
                    achievements: [],
                    organizationIds: [],
                    currentOrganizationId: null,
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                setUser(newUser);
                setOrganizations([]);
                setCurrentOrganization(null);
            }
        } catch (error: any) {
            handleError(error, 'inloggen met Google');
            throw error;
        } finally {
            setLoading(false);
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
            setLoading(true);
            await fetchUserAndOrgData(auth.currentUser);
            setLoading(false);
        }
    }, [fetchUserAndOrgData]);

    const switchOrganization = async (orgId: string) => {
        if (!user || orgId === currentOrganization?.id) return;
        try {
            setLoading(true);
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { currentOrganizationId: orgId });
            await refreshUser();
            toast({ title: "Organisatie gewisseld" });
        } catch(e) {
            handleError(e, 'wisselen van organisatie');
        } finally {
            setLoading(false);
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
        refreshUser,
        organizations,
        currentOrganization,
        currentUserRole,
        switchOrganization,
        teams,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
