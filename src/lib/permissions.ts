
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Organization, Permission } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';

/**
 * Checks if a user has a specific permission within an organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @param permission The permission to check for.
 * @returns A boolean indicating if the user has the permission.
 */
export async function hasPermission(userId: string, organizationId: string, permission: Permission): Promise<boolean> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
        console.warn(`Permission check failed: Organization ${organizationId} not found.`);
        return false;
    }

    const orgData = orgDoc.data() as Organization;
    const memberData = orgData.members?.[userId];
    if (!memberData) {
        console.warn(`Permission check failed: User ${userId} has no role in organization ${organizationId}.`);
        return false;
    }

    // 1. Check for user-specific overrides first.
    if (memberData.permissionOverrides) {
        if (memberData.permissionOverrides.revoked?.includes(permission)) {
            return false; // Explicitly revoked
        }
        if (memberData.permissionOverrides.granted?.includes(permission)) {
            return true; // Explicitly granted
        }
    }

    // 2. Fallback to role-based permissions.
    const roleId = memberData.role;
    if (!roleId) {
        return false; // No overrides and no role.
    }

    const allRoles = { ...DEFAULT_ROLES, ...(orgData.settings?.customization?.customRoles || {}) };
    const userRole = allRoles[roleId];
    if (!userRole) {
        console.warn(`Permission check failed: Role ${roleId} not found in organization ${organizationId}.`);
        return false;
    }
    
    return userRole.permissions.includes(permission);
}
