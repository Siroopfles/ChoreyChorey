import type { Phase } from '../types';

export const phase3: Phase = {
  name: "Fase 3: Ecosysteem & Integraties (Voltooid)",
  description: "Chorey verbinden met de tools die u al gebruikt. Deze fase richt zich op het openen van het platform en het bouwen van naadloze verbindingen met andere diensten.",
  features: [
    { id: 3001, title: "Public API v1 & Webhooks", description: "De basis voor alle integraties. Een robuuste, goed gedocumenteerde API voor taken, projecten, teams en gebruikers. Inclusief een webhook-systeem dat externe platformen kan notificeren over gebeurtenissen in Chorey.", completed: true },
    { id: 3002, title: "Slack Integratie", description: "Ontvang real-time notificaties in een Slack-kanaal. Biedt de mogelijkheid om via slash-commando's (zoals `/chorey taak...`) direct taken aan te maken vanuit Slack, door gebruik te maken van de API.", completed: true },
    { id: 3003, title: "GitHub Integratie & Webhooks", description: "Link taken aan GitHub issues en Pull Requests. Een webhook-integratie zorgt ervoor dat de status van een taak automatisch wordt bijgewerkt wanneer bijvoorbeeld een gekoppelde PR wordt gemerged.", completed: true },
    { id: 3004, title: "Microsoft Teams Integratie", description: "Verstuur notificaties naar een Microsoft Teams-kanaal. De API maakt het mogelijk voor ontwikkelaars om bots en andere interacties te bouwen die taken in Chorey kunnen beheren.", completed: true },
    { id: 3006, title: "Rijke Previews voor Cloud-bestanden", description: "Voeg een link toe van een Figma- of Google Workspace-bestand (Docs, Sheets, Slides) en zie direct een interactieve, ingebedde preview binnen de taakdetails.", completed: true },
    { id: 3007, title: "Email-to-Task Gateway", description: "Creëer taken door simpelweg een e-mail te sturen naar een uniek, gegenereerd e-mailadres. De onderwerpregel wordt de taaktitel en de body wordt de beschrijving.", completed: true },
    { id: 3008, title: "GitLab & Bitbucket Integraties", description: "Naast GitHub, ook ondersteuning voor het koppelen van taken aan issues en merge/pull requests in GitLab en Bitbucket, inclusief het zoeken naar items vanuit de taak-dialoog.", completed: true },
    { id: 3009, title: "Figma & Adobe XD Integratie", description: "Voeg design-bestanden van Figma en Adobe XD als bijlage toe aan taken. Voor Figma-bestanden wordt een interactieve live-preview getoond.", completed: true },
    { id: 3010, title: "Outlook Calendar Integratie", description: "Synchroniseer taken met een einddatum automatisch naar de primaire Outlook-agenda van de gebruiker, naast de bestaande Google Calendar integratie.", completed: true },
    { id: 3011, title: "Discord Integratie", description: "Ontvang notificaties in een Discord-kanaal via een webhook. De API kan gebruikt worden om aangepaste Discord-bots te bouwen die met Chorey interacteren.", completed: true },
    { id: 3012, title: "Toggl/Clockify Integratie", description: "Start de timer in Chorey. Wanneer de timer wordt gestopt, wordt de geregistreerde tijd automatisch gesynchroniseerd met een gekoppeld project in Toggl Track of Clockify.", completed: true },
    { id: 3013, title: "Browser Extensie (Bookmarklet)", description: "Een lichtgewicht 'extensie' in de vorm van een bookmarklet. Klik erop vanaf elke webpagina om direct een taak aan te maken met de titel en URL van de pagina al ingevuld.", completed: true },
    { id: 3014, title: "Jira Twee-weg Synchronisatie", description: "Koppel taken aan Jira issues. Dankzij een webhook-integratie verschijnen reacties die in Jira worden geplaatst nu ook automatisch als commentaar in de gekoppelde Chorey-taak.", completed: true },
  ]
};
