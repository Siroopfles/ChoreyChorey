
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, KeyRound, Webhook, Zap, HelpCircle, Bookmark } from 'lucide-react';
import { PERMISSIONS } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SlackSettings from '@/components/chorey/settings/slack-settings';
import GitHubSettings from '@/components/chorey/settings/github-settings';
import TeamsSettings from '@/components/chorey/settings/teams-settings';
import DiscordSettings from '@/components/chorey/settings/discord-settings';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import GitLabSettings from '@/components/chorey/settings/gitlab-settings';
import BitbucketSettings from '@/components/chorey/settings/bitbucket-settings';

export default function IntegrationsPage() {
  const { user, loading: authLoading, currentOrganization, currentUserPermissions } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canManageIntegrations = currentUserPermissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS);

  if (!currentOrganization || !canManageIntegrations) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Geen Toegang</h2>
            <p className="text-muted-foreground">U heeft geen permissie om integraties te beheren.</p>
        </div>
    )
  }
  
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/settings">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Terug naar Instellingen</span>
                </Link>
            </Button>
            <h1 className="font-semibold text-lg md:text-2xl">Integraties</h1>
        </div>
        
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap /> Verbinden met Zapier & Make</CardTitle>
              <CardDescription>Automatiseer uw workflows door Chorey te verbinden met duizenden andere apps via Zapier, Make (Integromat), of andere no-code platformen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Hoe werkt het?</AlertTitle>
                <AlertDescription>
                    Deze platformen werken met <strong>Triggers</strong> (iets gebeurt in App A) en <strong>Actions</strong> (doe iets in App B). U kunt Chorey voor beide gebruiken.
                </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><Webhook /> Triggers: Chorey start een workflow</h4>
                    <p className="text-sm text-muted-foreground">Gebruik een webhook om een workflow in Zapier/Make te starten wanneer iets in Chorey gebeurt (bv. "Taak Voltooid").</p>
                    <ol className="list-decimal list-inside text-sm space-y-1 pl-2">
                        <li>In Zapier/Make, kies "Webhooks" als de trigger en selecteer "Catch Hook".</li>
                        <li>Kopieer de unieke webhook URL die u krijgt.</li>
                        <li>Ga naar <Button variant="link" asChild className="p-0 h-auto"><Link href="/dashboard/settings/organization">Webhook Instellingen</Link></Button> in Chorey.</li>
                        <li>Maak een nieuwe webhook aan, plak de URL, en selecteer de gebeurtenissen (bv. "Taak Aangemaakt").</li>
                    </ol>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><KeyRound /> Actions: Een andere app doet iets in Chorey</h4>
                    <p className="text-sm text-muted-foreground">Gebruik de API om acties uit te voeren in Chorey (bv. "Maak een taak aan vanuit een nieuwe e-mail").</p>
                     <ol className="list-decimal list-inside text-sm space-y-1 pl-2">
                        <li>In Zapier/Make, kies "Webhooks" als de actie en selecteer "Custom Request" of "POST".</li>
                        <li>Gebruik de Chorey API-documentatie om de juiste URL en data op te geven.</li>
                        <li>Ga naar <Button variant="link" asChild className="p-0 h-auto"><Link href="/dashboard/settings/organization">API Sleutel Instellingen</Link></Button> in Chorey.</li>
                        <li>Genereer een API-sleutel en voeg deze toe in Zapier/Make als een "Authorization" header in de vorm: `Bearer UW_API_SLEUTEL`.</li>
                    </ol>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Separator />
        
        <h2 className="text-xl font-semibold">Directe Integraties</h2>
        
        <SlackSettings organization={currentOrganization} />
        <GitHubSettings organization={currentOrganization} />
        <GitLabSettings organization={currentOrganization} />
        <BitbucketSettings organization={currentOrganization} />
        <TeamsSettings organization={currentOrganization} />
        <DiscordSettings organization={currentOrganization} />

        <Separator />

        <h2 className="text-xl font-semibold">Browser Integratie</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bookmark /> Bookmarklet</CardTitle>
                <CardDescription>Maak taken aan vanaf elke webpagina met één klik in uw browser, zonder een extensie te installeren.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard/settings/bookmarklet">Bekijk Instructies</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  )
}
