
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
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User, Organization, Team, RoleName, UserStatus, Permission } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions/ai.actions';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/user.actions';
import { useDebug } from './debug-context';
import { useLocalStorage } from '@/hooks/use-local-storage';

const SESSION_STORAGE_KEY = 'chorey_session_id';

type AuthContextType = {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    mfaRequired: boolean;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    completeMfa: () => void;
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
    const [mfaRequired, setMfaRequired] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<RoleName | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
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

    const fetchUserAndOrgData = useCallback(async (firebaseUser: FirebaseUser) => {
        if (isDebugMode) console.log('[DEBUG] AuthContext: Running fetchUserAndOrgData for', firebaseUser.uid);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            if (isDebugMode) console.warn('[DEBUG] AuthContext: No user document found for UID:', firebaseUser.uid);
            return;
        }

        const rawData = userDoc.data();
        const userData: User = {
            id: userDoc.id,
            name: rawData.name,
            email: rawData.email,
            points: rawData.points,
            avatar: rawData.avatar,
            achievements: rawData.achievements,
            organizationIds: rawData.organizationIds,
            currentOrganizationId: rawData.currentOrganizationId,
            skills: rawData.skills,
            endorsements: rawData.endorsements,
            cosmetic: rawData.cosmetic,
            status: rawData.status ? {
                ...rawData.status,
                until: (rawData.status.until as Timestamp | null)?.toDate() ?? null,
            } : { type: 'Offline', until: null },
            twoFactorEnabled: rawData.twoFactorEnabled,
            twoFactorSecret: rawData.twoFactorSecret,
            twoFactorRecoveryCodes: rawData.twoFactorRecoveryCodes,
        };
        setUser(userData);

        if (isDebugMode) console.log('[DEBUG] AuthContext: User data set:', userData);

        if (userData.organizationIds && userData.organizationIds.length > 0) {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Fetching organizations with IDs:', userData.organizationIds);
            
            const orgsQuery = query(collection(db, 'organizations'), where('__name__', 'in', userData.organizationIds));
            
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

            return unsubscribeOrgs; 
        } else {
            if (isDebugMode) console.log('[DEBUG] AuthContext: User has no organizations.');
            setOrganizations([]);
            setCurrentOrganization(null);
            setCurrentUserRole(null);
            setCurrentUserPermissions([]);
            setTeams([]);
            setUsers([]);
            return () => {}; 
        }
    }, [isDebugMode]);
    
    useEffect(() => {
        let unsubscribeFromOrgs: (() => void) | undefined;
        let unsubscribeFromUsers: (() => void) | undefined;
        let unsubscribeFromTeams: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Auth state changed. User:', firebaseUser?.uid || 'null');
            
            unsubscribeFromOrgs?.();
            unsubscribeFromUsers?.();
            unsubscribeFromTeams?.();

            setLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                // Don't fully load data if MFA is required. The verify page will handle it.
                if (!mfaRequired) {
                    unsubscribeFromOrgs = await fetchUserAndOrgData(firebaseUser);
                }
            } else {
                setAuthUser(null);
                setUser(null);
                setMfaRequired(false);
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
    }, [fetchUserAndOrgData, isDebugMode, mfaRequired]);


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
            // Let the onAuthStateChanged handler do the rest
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
                const { avatarDataUri } = await handleGenerateAvatar(name);
                if (avatarDataUri) {
                    avatarUrl = avatarDataUri;
                }
            } catch (aiError) {
                console.error("Failed to generate AI avatar, using placeholder.", aiError);
            }

            const newUser: Omit<User, 'id'> = {
                name,
                email,
                points: 0,
                avatar: avatarUrl,
                achievements: [],
                organizationIds: [],
                currentOrganizationId: null,
                status: { type: 'Online', until: null }
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            await createSession(firebaseUser.uid);
            setUser({ id: firebaseUser.uid, ...newUser });
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
            const firebaseUser = userCredential.user;
            const additionalInfo = getAdditionalUserInfo(userCredential);

            if (additionalInfo?.isNewUser) {
                let avatarUrl = firebaseUser.photoURL || `https://placehold.co/100x100.png`;
                try {
                    const { avatarDataUri } = await handleGenerateAvatar(firebaseUser.displayName || firebaseUser.email!);
                    if (avatarDataUri) {
                        avatarUrl = avatarDataUri;
                    }
                } catch (aiError) {
                    console.error("Failed to generate AI avatar, using placeholder.", aiError);
                }

                const newUser: Omit<User, 'id'> = {
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
                    email: firebaseUser.email!,
                    points: 0,
                    avatar: avatarUrl,
                    achievements: [],
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

    const logout = async () => {
        try {
            if (user?.id) {
              await updateUserStatusAction(user.id, { type: 'Offline', until: null });
            }
            if (currentSessionId) {
                const sessionRef = doc(db, 'sessions', currentSessionId);
                await updateDoc(sessionRef, { isActive: false }).catch(console.error);
            }
            setCurrentSessionId('');
            setMfaRequired(false);
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            handleError(error, 'uitloggen');
        }
    };

    useEffect(() => {
        if (!currentSessionId || !db || !authUser) return;

        const sessionRef = doc(db, 'sessions', currentSessionId);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().isActive === false) {
                logout();
                toast({
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
    }, [currentSessionId, authUser, logout, toast]);


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
            setUser(prevUser => prevUser ? { ...prevUser, status } : null);
        } catch (e) {
            handleError(e, 'bijwerken van status');
        }
    };

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
        logout,
        completeMfa,
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
