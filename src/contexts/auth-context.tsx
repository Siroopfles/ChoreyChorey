

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
import { auth, db, googleProvider, microsoftProvider } from '@/lib/firebase';
import type { User, Organization, Team, RoleName, UserStatus, Permission, Project, Session } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateAvatar } from '@/app/actions/ai.actions';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/organization.actions';
import { sendDailyDigest } from '@/app/actions/digest.actions';
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
    loginWithMicrosoft: () => Promise<void>;
    logout: (message?: { title: string, description: string }) => void;
    completeMfa: () => void;
    refreshUser: () => Promise<void>;
    organizations: Organization[];
    currentOrganization: Organization | null;
    currentUserRole: RoleName | null;
    currentUserPermissions: Permission[];
    switchOrganization: (orgId: string) => Promise<void>;
    users: User[];
    projects: Project[];
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
    const [projects, setProjects] = useState<Project[]>([]);
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

    const logout = useCallback(async (message?: { title: string, description: string }) => {
        try {
            if (user?.id && currentOrganization?.id) {
              await updateUserStatusAction(currentOrganization.id, user.id, { type: 'Offline', until: null });
            }
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
    }, [user?.id, currentOrganization?.id, currentSessionId, setCurrentSessionId, toast, router]);

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
            workingHours: rawData.workingHours,
            mutedTaskIds: rawData.mutedTaskIds || [],
            twoFactorEnabled: rawData.twoFactorEnabled,
            twoFactorSecret: rawData.twoFactorSecret,
            twoFactorRecoveryCodes: rawData.twoFactorRecoveryCodes,
            notificationSettings: rawData.notificationSettings,
            lastDigestSentAt: (rawData.lastDigestSentAt as Timestamp | null)?.toDate() ?? undefined,
            googleRefreshToken: rawData.googleRefreshToken,
            microsoftRefreshToken: rawData.microsoftRefreshToken,
            togglApiToken: rawData.togglApiToken,
            clockifyApiToken: rawData.clockifyApiToken,
            dashboardLayout: rawData.dashboardLayout,
            streakData: rawData.streakData ? {
                ...rawData.streakData,
                lastCompletionDate: (rawData.streakData.lastCompletionDate as Timestamp).toDate(),
            } : undefined,
        };
        setUser(userData);

        if (isDebugMode) console.log('[DEBUG] AuthContext: User data set:', userData);

        const shouldSendDigest = userData.notificationSettings?.dailyDigestEnabled;
        const now = new Date();
        const lastSent = userData.lastDigestSentAt;
        const oneDay = 24 * 60 * 60 * 1000;

        if (shouldSendDigest && userData.currentOrganizationId && (!lastSent || (now.getTime() - lastSent.getTime()) > oneDay)) {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Triggering daily digest for user', firebaseUser.uid);
            // Don't await this, let it run in the background
            sendDailyDigest(firebaseUser.uid, userData.currentOrganizationId);
        }

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
            setProjects([]);
            setTeams([]);
            setUsers([]);
            return () => {}; 
        }
    }, [isDebugMode]);
    
    useEffect(() => {
        let unsubscribeFromOrgs: (() => void) | undefined;
        let unsubscribeFromUsers: (() => void) | undefined;
        let unsubscribeFromProjects: (() => void) | undefined;
        let unsubscribeFromTeams: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Auth state changed. User:', firebaseUser?.uid || 'null');
            
            unsubscribeFromOrgs?.();
            unsubscribeFromUsers?.();
            unsubscribeFromProjects?.();
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
                setProjects([]);
                setTeams([]);
                setUsers([]);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFromOrgs?.();
            unsubscribeFromUsers?.();
            unsubscribeFromProjects?.();
            unsubscribeFromTeams?.();
        };
    }, [fetchUserAndOrgData, isDebugMode, mfaRequired]);


    useEffect(() => {
        if (currentOrganization) {
            const usersQuery = query(collection(db, 'users'), where("organizationIds", "array-contains", currentOrganization.id));
            const projectsQuery = query(collection(db, 'projects'), where('organizationId', '==', currentOrganization.id));
            const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', currentOrganization.id));

            const unsubscribeUsers = onSnapshot(usersQuery, snapshot => setUsers(snapshot.docs.map(d => ({...d.data(), id: d.id} as User))));
            const unsubscribeProjects = onSnapshot(projectsQuery, snapshot => setProjects(snapshot.docs.map(d => ({...d.data(), id: d.id} as Project))));
            const unsubscribeTeams = onSnapshot(teamsQuery, snapshot => setTeams(snapshot.docs.map(d => ({...d.data(), id: d.id} as Team))));
            
            return () => {
                unsubscribeUsers();
                unsubscribeProjects();
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

    const loginWithMicrosoft = async (): Promise<void> => {
        setLoading(true);
        try {
            const userCredential = await signInWithPopup(auth, microsoftProvider);
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

    // Effect for handling session policies (timeout)
    useEffect(() => {
        if (!user || !currentOrganization || !currentSessionId) return;

        const policy = currentOrganization.settings?.sessionPolicy;
        const ipWhitelist = currentOrganization.settings?.ipWhitelist;

        const checkPolicies = async () => {
            // IP Whitelist Check
            if (ipWhitelist && ipWhitelist.length > 0) {
                try {
                    const response = await fetch('/api/ip');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.ip && !ipWhitelist.includes(data.ip)) {
                            logout({ title: 'Toegang Geweigerd', description: 'Uw IP-adres heeft geen toegang tot deze organisatie.', variant: 'destructive' });
                            return; // Stop further checks if IP is denied
                        }
                    }
                } catch (e) {
                    console.error("Error fetching IP for whitelist check:", e);
                }
            }
            
            // Session Timeout Check
            if (!policy || (!policy.absoluteTimeoutSeconds && !policy.idleTimeoutSeconds)) {
                return; // No policy to enforce
            }
            try {
                const sessionRef = doc(db, 'sessions', currentSessionId);
                const sessionDoc = await getDoc(sessionRef);
                if (!sessionDoc.exists()) {
                    logout({ title: 'Sessie verlopen', description: 'Uw sessie is niet langer geldig.', variant: 'destructive' });
                    return;
                }
                const sessionData = sessionDoc.data() as Session;
                const now = Date.now();

                // Check absolute timeout
                if (policy.absoluteTimeoutSeconds) {
                    const createdAt = (sessionData.createdAt as Timestamp).toMillis();
                    if (now > createdAt + policy.absoluteTimeoutSeconds * 1000) {
                        logout({ title: 'Sessie Verlopen', description: 'Uw sessie is verlopen vanwege het organisatiebeleid.', variant: 'destructive' });
                        return;
                    }
                }
                // Check idle timeout
                if (policy.idleTimeoutSeconds) {
                    const lastAccessed = (sessionData.lastAccessed as Timestamp).toMillis();
                    if (now > lastAccessed + policy.idleTimeoutSeconds * 1000) {
                       logout({ title: 'Sessie Verlopen door Inactiviteit', description: 'U bent uitgelogd vanwege inactiviteit.', variant: 'destructive' });
                       return;
                    }
                }

            } catch(e) {
                console.error("Error checking session policy:", e);
            }
        };

        checkPolicies(); // Initial check
        const interval = setInterval(checkPolicies, 30000); // Check every 30 seconds

        return () => clearInterval(interval);

    }, [user, currentOrganization, currentSessionId, logout]);


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
        if (!user || !currentOrganization) return;
        try {
            const result = await updateUserStatusAction(currentOrganization.id, user.id, status);
            if ((result as any).error) throw new Error((result as any).error);
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
        loginWithMicrosoft,
        logout,
        completeMfa,
        refreshUser,
        organizations,
        currentOrganization,
        currentUserRole,
        currentUserPermissions,
        switchOrganization,
        users,
        projects,
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
