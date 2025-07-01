
'use server';

import { db } from '@/lib/core/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import type { Invite } from '@/lib/types';
import { hasPermission } from '@/lib/core/permissions';
import { PERMISSIONS } from '@/lib/types';


export async function createOrganizationInvite(organizationId: string, inviterId: string, organizationName: string): Promise<{ data: { success: boolean; inviteId: string; } | null; error: string | null; }> {
    if (!await hasPermission(inviterId, organizationId, PERMISSIONS.MANAGE_MEMBERS)) {
        return { data: null, error: "Je hebt geen permissie om leden uit te nodigen." };
    }
    try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            organizationName,
            inviterId,
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { data: { success: true, inviteId: newInviteRef.id }, error: null };
    } catch (error: any) {
        console.error("Error creating invite:", error);
        return { data: null, error: error.message };
    }
}

export async function createProjectGuestInvite(organizationId: string, projectId: string, inviterId: string, organizationName: string): Promise<{ data: { success: boolean; inviteId: string; } | null; error: string | null; }> {
    if (!await hasPermission(inviterId, organizationId, PERMISSIONS.MANAGE_MEMBERS)) {
        return { data: null, error: "Je hebt geen permissie om gasten uit te nodigen." };
    }
     try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            organizationName,
            inviterId,
            projectId, // Add projectId to the invite
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { data: { success: true, inviteId: newInviteRef.id }, error: null };
    } catch (error: any) {
        console.error("Error creating guest invite:", error);
        return { data: null, error: error.message };
    }
}
