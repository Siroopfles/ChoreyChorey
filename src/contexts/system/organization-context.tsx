

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { 
    type Organization, 
    type Team, 
    type Project, 
    type User, 
    type Webhook, 
    type RoleName, 
    type Permission,
    DEFAULT_ROLES
} from '@/lib/types';
import { db } from '@/lib/core/firebase';
import { useAuth } from '@/contexts/user/auth-context';
import { useToast } from "@/hooks/use-toast";
import { toggleProjectPin as toggleProjectPinAction } from '@/app/actions/project/project.actions';

type OrganizationContextType = {
  loading: boolean;
  organizations: Organization[];
  currentOrganization: Organization | null;
  projects: Project[];
  teams: Team[];
  users: User[];
  webhooks: Webhook[];
  currentUserRole: RoleName | null;
  currentUserPermissions: Permission[];
  toggleProjectPin: (projectId: string, isPinned: boolean) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<RoleName | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };
  
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !user.organizationIds || user.organizationIds.length === 0) {
      setLoading(false);
      setOrganizations([]);
      setCurrentOrganization(null);
      setProjects([]);
      setTeams([]);
      setUsers([]);
      setWebhooks([]);
      setCurrentUserRole(null);
      setCurrentUserPermissions([]);
      return;
    }

    setLoading(true);

    const orgsQuery = query(collection(db, 'organizations'), where('__name__', 'in', user.organizationIds));
    const unsubscribeOrgs = onSnapshot(orgsQuery, (orgsSnapshot) => {
        const userOrgs = orgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
        setOrganizations(userOrgs);

        const currentOrg = userOrgs.find(o => o.id === user.currentOrganizationId) || userOrgs[0];
        if (currentOrg) {
            setCurrentOrganization(currentOrg);
        } else {
            setCurrentOrganization(null);
        }
    }, (e) => {
        handleError(e, 'laden van organisaties');
        setLoading(false);
    });

    return () => unsubscribeOrgs();
  }, [user, authLoading, toast]);


  useEffect(() => {
    if (!currentOrganization || !user) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const memberData = (currentOrganization.members || {})[user.id];
    const role = memberData?.role || null;
    setCurrentUserRole(role);
    
    const allRoles = { ...DEFAULT_ROLES, ...(currentOrganization.settings?.customization?.customRoles || {}) };
    
    const basePermissions = role ? allRoles[role]?.permissions || [] : [];
    const grantedOverrides = memberData?.permissionOverrides?.granted || [];
    const revokedOverrides = memberData?.permissionOverrides?.revoked || [];

    const finalPermissions = [
        ...new Set([...basePermissions, ...grantedOverrides])
    ].filter(p => !revokedOverrides.includes(p));
    setCurrentUserPermissions(finalPermissions);
    
    const projectsQuery = query(collection(db, 'projects'), where('organizationId', '==', currentOrganization.id));
    const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', currentOrganization.id));
    const usersQuery = query(collection(db, 'users'), where("organizationIds", "array-contains", currentOrganization.id));
    const webhooksQuery = query(collection(db, 'webhooks'), where('organizationId', '==', currentOrganization.id));

    const unsubProjects = onSnapshot(projectsQuery, snapshot => setProjects(snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp)?.toDate(), deadline: (d.data().deadline as Timestamp)?.toDate() } as Project))), e => handleError(e, 'laden projecten'));
    const unsubTeams = onSnapshot(teamsQuery, snapshot => setTeams(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Team))), e => handleError(e, 'laden teams'));
    const unsubWebhooks = onSnapshot(webhooksQuery, snapshot => setWebhooks(snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp)?.toDate() } as Webhook))), e => handleError(e, 'laden webhooks'));
    const unsubUsers = onSnapshot(usersQuery, snapshot => {
      setUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id, status: { ...d.data().status, until: (d.data().status?.until as Timestamp)?.toDate() }, cosmetic: d.data().cosmetic || {}, ...currentOrganization.members[d.id] } as User)));
      setLoading(false);
    }, e => {
      handleError(e, 'laden gebruikers');
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubTeams();
      unsubUsers();
      unsubWebhooks();
    };
  }, [currentOrganization, user, toast]);

  const switchOrganization = async (orgId: string) => {
    if (!user || orgId === user.currentOrganizationId) return;
    try {
        setLoading(true);
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { currentOrganizationId: orgId });
        await refreshUser();
    } catch(e) {
        handleError(e, 'wisselen van organisatie');
    } finally {
        setLoading(false);
    }
  };

  const toggleProjectPin = async (projectId: string, isPinned: boolean) => {
    if (!user || !currentOrganization) return;
    const result = await toggleProjectPinAction(projectId, currentOrganization.id, user.id, isPinned);
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    }
  };

  const value = {
    loading,
    organizations,
    currentOrganization,
    projects,
    teams,
    users,
    webhooks,
    currentUserRole,
    currentUserPermissions,
    toggleProjectPin,
    switchOrganization
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
