

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization, Permission, Project } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';

/**
 * Checks if a user has a specific permission.
 * It checks in the following order:
 * 1. User-specific permission overrides.
 * 2. Project-specific role.
 * 3. Organization-level role.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @param permission The permission to check for.
 * @param context Optional context, e.g., a projectId to check for project-specific roles.
 * @returns A boolean indicating if the user has the permission.
 */
export async function hasPermission(userId: string, organizationId: string, permission: Permission, context?: { projectId?: string }): Promise<boolean> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
        console.warn(`Permission check failed: Organization ${organizationId} not found.`);
        return false;
    }

    const orgData = orgDoc.data() as Organization;
    const allRoles = { ...DEFAULT_ROLES, ...(orgData.settings?.customization?.customRoles || {}) };
    
    // --- 1. Check for user-specific overrides first ---
    const memberData = orgData.members?.[userId];
    if (memberData?.permissionOverrides) {
        if (memberData.permissionOverrides.revoked?.includes(permission)) {
            return false; // Explicitly revoked, highest priority
        }
        if (memberData.permissionOverrides.granted?.includes(permission)) {
            return true; // Explicitly granted
        }
    }
    
    // --- 2. Check for project-specific role ---
    if (context?.projectId) {
        const projectRef = doc(db, 'projects', context.projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
            const projectData = projectDoc.data() as Project;
            const projectRole = projectData.projectRoles?.[userId];
            if (projectRole && allRoles[projectRole]) {
                return allRoles[projectRole].permissions.includes(permission);
            }
        }
    }

    // --- 3. Fallback to organization-level role ---
    const orgRole = memberData?.role;
    if (!orgRole) {
        return false; // No overrides and no role.
    }
    
    const userRoleConfig = allRoles[orgRole];
    if (!userRoleConfig) {
        console.warn(`Permission check failed: Role ${orgRole} not found in organization ${organizationId}.`);
        return false;
    }
    
    return userRoleConfig.permissions.includes(permission);
}
