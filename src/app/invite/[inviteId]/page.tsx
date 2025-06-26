
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getInviteDetails } from '@/app/actions/organization.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { Invite } from '@/lib/types';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { runTransaction, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';


export default function InvitePage() {
    const { inviteId } = useParams();
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();

    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    useEffect(() => {
        if (typeof inviteId !== 'string') return;
        
        async function fetchInvite() {
            setLoading(true);
            const result = await getInviteDetails(inviteId);
            if (result.error) {
                setError(result.error);
            } else if (result.invite) {
                setInvite(result.invite);
            }
            setLoading(false);
        }
        fetchInvite();
    }, [inviteId]);

    const handleAcceptInvite = async () => {
        if (!user || typeof inviteId !== 'string' || !invite) {
            router.push(`/login?redirect=/invite/${inviteId}`);
            return;
        }
        setIsAccepting(true);
        try {
            await runTransaction(db, async (transaction) => {
                const inviteRef = doc(db, 'invites', inviteId);
                const userRef = doc(db, 'users', user.id);

                const inviteDoc = await transaction.get(inviteRef);
                if (!inviteDoc.exists() || inviteDoc.data().status !== 'pending') {
                    throw new Error("Uitnodiging is ongeldig of al gebruikt.");
                }

                const organizationId = inviteDoc.data().organizationId;
                const organizationRef = doc(db, 'organizations', organizationId);
                const memberPath = `members.${user.id}`;

                transaction.update(userRef, {
                    organizationIds: arrayUnion(organizationId),
                    currentOrganizationId: organizationId,
                });
                
                transaction.update(organizationRef, {
                    [memberPath]: { role: 'Member' }
                });

                transaction.update(inviteRef, {
                    status: 'accepted'
                });
            });
            await refreshUser();
            setIsAccepted(true);

        } catch (error: any) {
            setError(error.message);
            setIsAccepting(false);
        }
    };
    
    if (loading || authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                             <XCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="mt-4">Uitnodiging Ongeldig</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                         <Button asChild className="w-full">
                            <Link href="/dashboard">Ga naar je Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    if (isAccepted) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <CardTitle className="mt-4">Uitnodiging Geaccepteerd!</CardTitle>
                        <CardDescription>Je bent nu lid van **{invite?.organizationName}**. Je wordt doorgestuurd.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                           Ga naar Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Je bent uitgenodigd!</CardTitle>
                    <CardDescription>
                       Je bent uitgenodigd om lid te worden van de organisatie **{invite?.organizationName}**.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">
                        {user ? `Je accepteert deze uitnodiging als ${user.email}.` : 'Log in of maak een account aan om de uitnodiging te accepteren.'}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAcceptInvite} disabled={isAccepting} className="w-full">
                        {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {user ? 'Accepteer Uitnodiging' : 'Login om te Accepteren'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
