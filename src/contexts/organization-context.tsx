'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { Organization, Project, Team, User, RoleName, Permission } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { useToast } from "@/hooks/use-toast";
import { toggleProjectPin as toggleProjectPinAction } from '@/app/actions/project.actions';

type OrganizationContextType = {
  loading: boolean;
  currentOrganization: Organization | null;
  projects: Project[];
  teams: Team[];
  users: User[];
  currentUserRole: RoleName | null;
  currentUserPermissions: Permission[];
  toggleProjectPin: (projectId: string, isPinned: boolean) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, organizations, loading: authLoading } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

    const currentOrgFromAuth = organizations.find(o => o.id === user?.currentOrganizationId);

    if (!currentOrgFromAuth || !user) {
      setLoading(false);
      setCurrentOrganization(null);
      setProjects([]);
      setTeams([]);
      setUsers([]);
      setCurrentUserRole(null);
      setCurrentUserPermissions([]);
      return;
    }

    setLoading(true);
    setCurrentOrganization(currentOrgFromAuth);

    if (currentOrgFromAuth) {
        const role = (currentOrgFromAuth.members || {})[user.id]?.role || null;
        setCurrentUserRole(role);
        
        const allRoles = { ...DEFAULT_ROLES, ...(currentOrgFromAuth.settings?.customization?.customRoles || {}) };
        const permissions = role ? allRoles[role]?.permissions || [] : [];
        setCurrentUserPermissions(permissions);
    } else {
        setCurrentUserRole(null);
        setCurrentUserPermissions([]);
    }

    const projectsQuery = query(collection(db, 'projects'), where('organizationId', '==', currentOrgFromAuth.id));
    const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', currentOrgFromAuth.id));
    const usersQuery = query(collection(db, 'users'), where("organizationIds", "array-contains", currentOrgFromAuth.id));

    const unsubProjects = onSnapshot(projectsQuery, snapshot => setProjects(snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp)?.toDate(), deadline: (d.data().deadline as Timestamp)?.toDate() } as Project))), e => handleError(e, 'laden projecten'));
    const unsubTeams = onSnapshot(teamsQuery, snapshot => setTeams(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Team))), e => handleError(e, 'laden teams'));
    const unsubUsers = onSnapshot(usersQuery, snapshot => {
      setUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id, status: { ...d.data().status, until: (d.data().status?.until as Timestamp)?.toDate() }} as User)));
      setLoading(false); // Consider users the last essential data point for loading
    }, e => {
      handleError(e, 'laden gebruikers');
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubTeams();
      unsubUsers();
    };
  }, [user, organizations, authLoading]);

  const toggleProjectPin = async (projectId: string, isPinned: boolean) => {
    if (!user || !currentOrganization) return;
    const result = await toggleProjectPinAction(projectId, currentOrganization.id, user.id, isPinned);
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    }
  };

  const value = {
    loading,
    currentOrganization,
    projects,
    teams,
    users,
    currentUserRole,
    currentUserPermissions,
    toggleProjectPin,
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
