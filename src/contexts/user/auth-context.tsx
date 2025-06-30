

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
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, Timestamp, addDoc, arrayUnion } from 'firebase/firestore';
import { auth, db, googleProvider, microsoftProvider } from '@/lib/core/firebase';
import type { User, Organization, RoleName, UserStatus, Permission, WidgetInstance } from '@/lib/types';
import { WIDGET_TYPES, DEFAULT_ROLES, widgetConfigSchemas } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus as updateUserStatusAction } from '@/app/actions/user/member.actions';
import { sendDailyDigest } from '@/app/actions/core/digest.actions';
import { useDebug } from '../system/debug-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Layouts } from 'react-grid-layout';
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
    organizations: Organization[];
    currentOrganization: Organization | null;
    switchOrganization: (orgId: string) => Promise<void>;
    updateUserDashboard: (updates: Partial<{ dashboardConfig: WidgetInstance[]; dashboardLayout: Layouts }>) => Promise<void>;
    updateUserPresence: (presenceUpdate: Partial<UserStatus>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultDashboardConfig: WidgetInstance[] = [
  { id: crypto.randomUUID(), type: 'welcome', config: {} },
  { id: crypto.randomUUID(), type: 'myTasks', config: { limit: 5 } },
  { id: crypto.randomUUID(), type: 'activityFeed', config: {} },
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
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
            if (message) {
                toast(message);
            }
            router.push('/login');
        } catch (error) {
            handleError(error, 'uitloggen');
        }
    }, [user?.id, currentSessionId, setCurrentSessionId, toast, router]);

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
            dashboardConfig: rawData.dashboardConfig || defaultDashboardConfig,
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

            }, (error) => handleError(error, 'laden van organisaties'));

            return unsubscribeOrgs; 
        } else {
            if (isDebugMode) console.log('[DEBUG] AuthContext: User has no organizations.');
            setOrganizations([]);
            setCurrentOrganization(null);
            return () => {}; 
        }
    }, [isDebugMode]);
    
    useEffect(() => {
        let unsubscribeFromOrgs: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isDebugMode) console.log('[DEBUG] AuthContext: Auth state changed. User:', firebaseUser?.uid || 'null');
            
            unsubscribeFromOrgs?.();

            setLoading(true);
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                if (!mfaRequired) {
                    unsubscribeFromOrgs = await fetchUserAndOrgData(firebaseUser);
                }
            } else {
                setAuthUser(null);
                setUser(null);
                setMfaRequired(false);
                setOrganizations([]);
                setCurrentOrganization(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFromOrgs?.();
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

    useEffect(() => {
        if (!user || !currentOrganization || !currentSessionId) return;

        const policy = currentOrganization.settings?.sessionPolicy;
        const ipWhitelist = currentOrganization.settings?.ipWhitelist;

        const checkPolicies = async () => {
            if (ipWhitelist && ipWhitelist.length > 0) {
                try {
                    const response = await fetch('/api/ip');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.ip && !ipWhitelist.includes(data.ip)) {
                            logout({ title: 'Toegang Geweigerd', description: 'Uw IP-adres heeft geen toegang tot deze organisatie.', variant: 'destructive' });
                            return; 
                        }
                    }
                } catch (e) {
                    console.error("Error fetching IP for whitelist check:", e);
                }
            }
            
            if (!policy || (!policy.absoluteTimeoutSeconds && !policy.idleTimeoutSeconds)) {
                return;
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

                if (policy.absoluteTimeoutSeconds) {
                    const createdAt = (sessionData.createdAt as Timestamp).toMillis();
                    if (now > createdAt + policy.absoluteTimeoutSeconds * 1000) {
                        logout({ title: 'Sessie Verlopen', description: 'Uw sessie is verlopen vanwege het organisatiebeleid.', variant: 'destructive' });
                        return;
                    }
                }
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

        checkPolicies();
        const interval = setInterval(checkPolicies, 30000);

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
    
    const completeMfa = async () => {
        if (authUser) {
            setMfaRequired(false);
            await createSession(authUser.uid);
            router.push('/dashboard');
        }
    };

    const updateUserDashboard = async (updates: Partial<{ dashboardConfig: WidgetInstance[]; dashboardLayout: Layouts }>) => {
        if (!user) return;
        const userRef = doc(db, "users", user.id);
        try {
            await updateDoc(userRef, updates);
        } catch (e) {
             handleError(e, 'bijwerken dashboard');
        }
    };

    const updateUserPresence = useCallback(async (presenceUpdate: Partial<UserStatus>) => {
        if (!user) return;
        const currentStatus = user.status || { type: 'Offline', until: null };
        const newStatus: UserStatus = {
            type: currentStatus.type,
            until: currentStatus.until,
            ...presenceUpdate,
        };
        await updateUserStatusAction(user.id, newStatus);
    }, [user]);

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
        switchOrganization,
        updateUserDashboard,
        updateUserPresence,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    // This is a bit of a hack to add back the derived state that was removed,
    // without re-introducing it into the core provider state and causing re-renders.
    const { user, currentOrganization } = context;
    const currentUserRole = (currentOrganization?.members || {})[user?.id || '']?.role || null;
    const allRoles = { ...DEFAULT_ROLES, ...(currentOrganization?.settings?.customization?.customRoles || {}) };
    const memberData = user && currentOrganization?.members?.[user.id];
    
    const basePermissions = currentUserRole ? allRoles[currentUserRole]?.permissions || [] : [];
    const grantedOverrides = memberData?.permissionOverrides?.granted || [];
    const revokedOverrides = memberData?.permissionOverrides?.revoked || [];

    const currentUserPermissions = [
        ...new Set([...basePermissions, ...grantedOverrides])
    ].filter(p => !revokedOverrides.includes(p));
    
    return { ...context, currentUserRole, currentUserPermissions };
}
