
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
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User, Organization, Team, RoleName, UserStatus, Permission } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions/ai.actions';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/user.actions';
import { useDebug } from './debug-context';

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
    currentUserPermissions: Permission[];
    switchOrganization: (orgId: string) => Promise<void>;
    users: User[];
    teams: Team[];
    updateUserStatus: (status: UserStatus) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<RoleName | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
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

    const fetchUserAndOrgData = useCallback(async (firebaseUser: FirebaseUser) => {
        if (isDebugMode) console.log('[DEBUG] AuthContext: Running fetchUserAndOrgData for', firebaseUser.uid);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            if (isDebugMode) console.warn('[DEBUG] AuthContext: No user document found for UID:', firebaseUser.uid);
            return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);
        if (isDebugMode) console.log('[DEBUG] AuthContext: User data set:', userData);

        if (userData.organizationIds && userData.organizationIds.length > 0) {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Fetching organizations with IDs:', userData.organizationIds);
            
            const orgsQuery = query(collection(db, 'organizations'), where('__name__', 'in', userData.organizationIds));
            
            // Using onSnapshot to listen for real-time updates to organizations
            const unsubscribeOrgs = onSnapshot(orgsQuery, (orgsSnapshot) => {
                const userOrgs = orgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
                setOrganizations(userOrgs);
                if (isDebugMode) console.log('[DEBUG] AuthContext: Organizations updated:', userOrgs);

                let currentOrg = null;
                const currentOrgStillExists = userOrgs.some(o => o.id === userData.currentOrganizationId);

                if (userData.currentOrganizationId && currentOrgStillExists) {
                    currentOrg = userOrgs.find(o => o.id === userData.currentOrganizationId) || null;
                } else if (userOrgs.length > 0) {
                    currentOrg = userOrgs[0];
                    if (isDebugMode) console.log(`[DEBUG] AuthContext: No/invalid current org set, defaulting to first one (${currentOrg.id}) and updating user doc.`);
                    updateDoc(userDocRef, { currentOrganizationId: currentOrg.id });
                }
                
                setCurrentOrganization(currentOrg);
                if (isDebugMode) console.log('[DEBUG] AuthContext: Current organization updated:', currentOrg);

                if (currentOrg) {
                    const role = (currentOrg.members || {})[firebaseUser.uid]?.role || null;
                    setCurrentUserRole(role);
                    if (isDebugMode) console.log('[DEBUG] AuthContext: User role set to:', role);

                    const allRoles = { ...DEFAULT_ROLES, ...(currentOrg.settings?.customization?.customRoles || {}) };
                    const permissions = role ? allRoles[role]?.permissions || [] : [];
                    setCurrentUserPermissions(permissions);
                    if (isDebugMode) console.log('[DEBUG] AuthContext: User permissions set:', permissions);
                } else {
                    if (isDebugMode) console.log('[DEBUG] AuthContext: No current organization, clearing role and permissions.');
                     setCurrentUserRole(null);
                     setCurrentUserPermissions([]);
                }
            }, (error) => handleError(error, 'laden van organisaties'));

            return unsubscribeOrgs; // Return the listener cleanup function
        } else {
            if (isDebugMode) console.log('[DEBUG] AuthContext: User has no organizations.');
            setOrganizations([]);
            setCurrentOrganization(null);
            setCurrentUserRole(null);
            setCurrentUserPermissions([]);
            setTeams([]);
            setUsers([]);
            return () => {}; // Return an empty cleanup function
        }
    }, [isDebugMode]);
    
    useEffect(() => {
        let unsubscribeFromOrgs: (() => void) | undefined;
        let unsubscribeFromUsers: (() => void) | undefined;
        let unsubscribeFromTeams: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Auth state changed. User:', firebaseUser?.uid || 'null');
            
            // Clean up previous listeners
            unsubscribeFromOrgs?.();
            unsubscribeFromUsers?.();
            unsubscribeFromTeams?.();

            setLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                unsubscribeFromOrgs = await fetchUserAndOrgData(firebaseUser);
            } else {
                setAuthUser(null);
                setUser(null);
                setOrganizations([]);
                setCurrentOrganization(null);
                setCurrentUserRole(null);
                setCurrentUserPermissions([]);
                setTeams([]);
                setUsers([]);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFromOrgs?.();
            unsubscribeFromUsers?.();
            unsubscribeFromTeams?.();
        };
    }, [fetchUserAndOrgData, isDebugMode]);


    useEffect(() => {
        if (currentOrganization) {
            const usersQuery = query(collection(db, 'users'), where("organizationIds", "array-contains", currentOrganization.id));
            const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', currentOrganization.id));

            const unsubscribeUsers = onSnapshot(usersQuery, snapshot => setUsers(snapshot.docs.map(d => ({...d.data(), id: d.id} as User))));
            const unsubscribeTeams = onSnapshot(teamsQuery, snapshot => setTeams(snapshot.docs.map(d => ({...d.data(), id: d.id} as Team))));
            
            return () => {
                unsubscribeUsers();
                unsubscribeTeams();
            };
        }
    }, [currentOrganization]);


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
            if (user?.id) {
              await updateUserStatusAction(user.id, { type: 'Offline' });
            }
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            handleError(error, 'uitloggen');
        }
    };

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            setLoading(true);
            // This will trigger a re-fetch via the onAuthStateChanged listener's logic
            // To ensure it's fresh, we directly call it.
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
            // The onSnapshot listener will handle the state update automatically
            toast({ title: "Organisatie gewisseld" });
        } catch(e) {
            handleError(e, 'wisselen van organisatie');
        } finally {
            setLoading(false);
        }
    };
    
    const updateUserStatus = async (status: UserStatus) => {
        if (!user) return;
        try {
            const result = await updateUserStatusAction(user.id, status);
            if (result.error) throw new Error(result.error);
            // Optimistic update for the current user's own state
            setUser(prevUser => prevUser ? { ...prevUser, status } : null);
        } catch (e) {
            handleError(e, 'bijwerken van status');
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
        currentUserPermissions,
        switchOrganization,
        users,
        teams,
        updateUserStatus,
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
