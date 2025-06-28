

export type Feature = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
};

type Phase = {
  name: string;
  description: string;
  features: Feature[];
};

export const roadmapPhases: Phase[] = [
  {
    name: "Fase 1: Fundament & MVP (Voltooid)",
    description: "De essentiële bouwstenen van Chorey. Deze fase richtte zich op het creëren van een robuust en betrouwbaar taakbeheersysteem als solide basis voor alle toekomstige innovatie.",
    features: [
      { id: 1001, title: "Taakbeheer", description: "Creatie, eigenschappen, configureerbare statussen, en subtaken.", completed: true },
      { id: 1002, title: "Project & Team Management", description: "Organiseer werk in projecten en wijs taken toe aan teams.", completed: true },
      { id: 1003, title: "Rollen & Rechtenbeheer (RBAC)", description: "Definieer rollen (Eigenaar, Beheerder, Lid) met specifieke permissies.", completed: true },
      { id: 1004, title: "Taaktemplates", description: "Sla taken op als templates voor hergebruik.", completed: true },
      { id: 1005, title: "Bestands- & Linkbijlagen", description: "Voeg URL's toe aan taken.", completed: true },
      { id: 1006, title: "Persoonlijke & Gevoelige Taken", description: "Markeer taken als privé of gevoelig voor beperkte zichtbaarheid.", completed: true },
      { id: 1007, title: "Volledige Taakgeschiedenis", description: "Een gedetailleerd logboek van alle wijzigingen per taak.", completed: true },
      { id: 1008, title: "Taak Acties", description: "Dupliceer, splits of annuleer taken.", completed: true },
      { id: 1009, title: "Bulk Taakbewerkingen", description: "Bewerk meerdere taken tegelijk vanuit de bulk-actie balk.", completed: true },
      { id: 1010, title: "Drag & Drop Ordening", description: "Versleep taken om de volgorde binnen een statuskolom aan te passen.", completed: true },
      { id: 1011, title: "Rich Text Editor", description: "Opmaakmogelijkheden (vet, cursief, lijsten) in beschrijvingen en comments.", completed: true },
      { id: 1012, title: "Flexibele Views", description: "Wissel tussen Bord, Lijst en Kalender weergaves.", completed: true },
      { id: 1013, title: "Zoeken & Filteren", description: "Filter taken op basis van diverse criteria en sla filters op voor later gebruik.", completed: true },
      { id: 1014, title: "Keyboard Shortcuts & Command Palette", description: "Bedien de app efficiënt met sneltoetsen en het command-K palet.", completed: true },
      { id: 1015, title: "Authenticatie & Beveiliging", description: "Veilig inloggen met e-mail/wachtwoord, Google en Two-Factor Authentication (2FA).", completed: true },
      { id: 1016, title: "Sessiebeheer", description: "Beheer actieve login-sessies op verschillende apparaten.", completed: true },
      { id: 1017, title: "Data Import & Export (CSV)", description: "Importeer en exporteer taken eenvoudig via CSV-bestanden.", completed: true },
      { id: 1018, title: "Audit Log voor Organisatie", description: "Een centraal overzicht van alle acties binnen de organisatie.", completed: true },
    ]
  },
  {
    name: "Fase 2: Intelligentie & Samenwerking (Voltooid)",
    description: "In deze fase is Chorey slimmer en socialer gemaakt. De focus lag op AI-ondersteuning, gamification en functies die teamwerk en productiviteit bevorderen.",
    features: [
      { id: 2001, title: "AI-gestuurde Suggesties", description: "Ontvang suggesties voor toewijzingen, subtaken, story points, prioriteiten en labels.", completed: true },
      { id: 2002, title: "AI Risico & Duplicaat Detectie", description: "Laat de AI proactief risico's en dubbele taken identificeren.", completed: true },
      { id: 2003, title: "AI NLP Command Bar", description: "Gebruik natuurlijke taal om taken te creëren, zoeken en bewerken.", completed: true },
      { id: 2004, title: "AI Generatieve Functies", description: "Genereer omslagfoto's voor taken en unieke avatars voor gebruikers.", completed: true },
      { id: 2005, title: "AI Audio & Spraak", description: "Zet tekst om naar spraak (TTS), converteer notulen naar taken en gebruik spraakherkenning.", completed: true },
      { id: 2006, title: "AI Werkdruk Balancering", description: "Laat de AI de werkdruk van een gebruiker analyseren en herplannen.", completed: true },
      { id: 2007, title: "AI Headcount Planning", description: "Ontvang een voorstel voor de benodigde teamgrootte op basis van een projectomschrijving.", completed: true },
      { id: 2008, title: "Gamification", description: "Verdien punten, ontgrendel prestaties en beklim de scoreborden.", completed: true },
      { id: 2009, title: "Sociale Interacties", description: "Geef 'Kudos' (punten), bedank collega's, en onderschrijf elkaars vaardigheden.", completed: true },
      { id: 2010, title: "Ideeënbus met Upvotes", description: "Een centrale plek voor nieuwe ideeën, gestemd door de community.", completed: true },
      { id: 2011, title: "Mentorschap Programma", description: "Vind ervaren gebruikers om van te leren of help nieuwkomers.", completed: true },
      { id: 2012, title: "Team Room Visualisatie", description: "Een visuele, real-time weergave van de teamactiviteit.", completed: true },
      { id: 2013, title: "Doelen & Uitdagingen", description: "Stel persoonlijke doelen in en neem deel aan teamuitdagingen.", completed: true },
      { id: 2014, title: "Puntenwinkel", description: "Wissel verdiende punten in voor cosmetische items zoals thema's.", completed: true },
      { id: 2015, title: "Geavanceerde Views", description: "Gantt-diagram, custom rapportagebouwer en workload-overzicht.", completed: true },
      { id: 2016, title: "Geavanceerde Afhankelijkheden", description: "Stel een wachttijd (lag) in tussen afhankelijke taken.", completed: true },
      { id: 2017, title: "Notificatiecentrum", description: "Inbox met 'snooze' functionaliteit en configureerbare prioriteitsdrempels.", completed: true },
      { id: 2018, title: "RACI Matrix", description: "Genereer een Responsible, Accountable, Consulted, Informed matrix.", completed: true },
      { id: 2019, title: "Webhooks", description: "Stuur real-time updates naar externe systemen.", completed: true },
      { id: 2020, title: "Exposed REST API v1", description: "Basis API voor het beheren van taken met gescoopte permissies.", completed: true },
      { id: 2021, title: "Google Calendar Integratie", description: "Synchroniseer deadlines met je agenda via OAuth2.", completed: true },
    ]
  },
  {
    name: "Fase 3: Ecosysteem & Integraties (Gepland)",
    description: "Chorey verbinden met de tools die u al gebruikt. Deze fase richt zich op het openen van het platform en het bouwen van naadloze verbindingen met andere diensten.",
    features: [
      { id: 3001, title: "Public API v2", description: "Uitbreiding van de API met meer endpoints (projecten, teams, gebruikers) en webhook management.", completed: true },
      { id: 3002, title: "Slack Integratie", description: "Ontvang notificaties in Slack en maak taken aan via webhooks, als basis voor slash-commando's en bots.", completed: true },
      { id: 3003, title: "GitHub Integratie", description: "Koppel taken aan issues en pull requests. Synchroniseer statusupdates.", completed: true },
      { id: 3004, title: "Microsoft Teams Integratie", description: "Ontvang notificaties en maak taken aan via webhooks, wat de basis legt voor volledige functionaliteit binnen MS Teams.", completed: true },
      { id: 3005, title: "Zapier / Make (Integromat) Integratie", description: "Verbind Chorey met duizenden andere apps via de API en het webhook-systeem.", completed: true },
      { id: 3006, title: "Cloud Storage Integraties", description: "Koppel bestanden direct vanuit Google Drive, OneDrive en Dropbox.", completed: false },
      { id: 3007, title: "Email-to-Task Gateway", description: "Maak taken aan door een e-mail te sturen naar een uniek project- of gebruikersadres.", completed: true },
      { id: 3008, title: "GitLab & Bitbucket Integraties", description: "Koppel taken aan GitLab/Bitbucket issues en merge requests.", completed: false },
      { id: 3009, title: "Figma & Adobe XD Integratie", description: "Voeg design-bestanden toe aan taken. Figma-bestanden worden getoond met een interactieve live-preview en Adobe XD-links worden visueel herkend met een eigen icoon.", completed: true },
      { id: 3010, title: "Outlook Calendar Integratie", description: "Synchroniseer deadlines met je Outlook agenda.", completed: true },
      { id: 3011, title: "Discord Integratie", description: "Ontvang notificaties en maak taken aan via webhooks, als basis voor slash-commando's en bots.", completed: true },
      { id: 3012, title: "Toggl/Clockify Integratie", description: "Start en stop de timer in Chorey en synchroniseer de tijdregistratie met uw favoriete tool.", completed: true },
      { id: 3013, title: "Browser Extensie (Bookmarklet)", description: "Maak een taak aan van de huidige webpagina met één klik.", completed: true },
      { id: 3014, title: "Jira Integratie", description: "Koppel taken aan Jira issues door te zoeken op trefwoord of een URL te plakken. (Linear-integratie is momenteel on hold vanwege technische problemen).", completed: true },
    ]
  },
    {
    name: "Fase 4: Geavanceerde Enterprise & Innovatie (Toekomst)",
    description: "De horizon van Chorey. Hier verkennen we baanbrekende ideeën, enterprise-grade functies en manieren om de grenzen van productiviteit en samenwerking te verleggen.",
    features: [
      { id: 4001, title: "Geavanceerde Rapporten & Dashboards", description: "Bouw en deel custom dashboards met widgets voor specifieke projecten of teams.", completed: false },
      { id: 4002, title: "Budgettering & Kostentracering", description: "Wijs budgetten toe aan projecten en houd de kosten per taak bij.", completed: false },
      { id: 4003, title: "Resource Management", description: "Geavanceerde capaciteitsplanning en workload-inzichten over langere periodes.", completed: false },
      { id: 4004, title: "Custom Fields", description: "Voeg eigen velden (tekst, getal, datum, dropdown) toe aan taken voor maximale flexibiliteit.", completed: false },
      { id: 4005, title: "Single Sign-On (SSO)", description: "Integratie met SAML, Google Workspace, Azure AD voor enterprise-grade authenticatie.", completed: false },
      { id: 4006, title: "Data Residency Opties", description: "Kies de geografische locatie voor dataopslag (EU/US).", completed: false },
      { id: 4007, title: "Gast- / Klanttoegang", description: "Geef externe gebruikers beperkte, read-only toegang tot specifieke projecten of taken.", completed: false },
      { id: 4008, title: "IP Whitelisting", description: "Beperk toegang tot de organisatie tot specifieke IP-adressen voor extra beveiliging.", completed: false },
      { id: 4009, title: "Geavanceerde Automatisering", description: "Een ingebouwde 'Zapier'-light voor het automatiseren van workflows binnen Chorey.", completed: false },
      { id: 4010, title: "AI Predictive Analysis", description: "Waarschuwt proactief voor projectvertragingen en budgetoverschrijdingen op basis van historische data.", completed: false },
      { id: 4011, title: "AI Burnout Voorspelling", description: "Signaleert risico op overbelasting op basis van werkpatronen en taken.", completed: false },
      { id: 4012, title: "AI Automatische Status Updates", description: "Stelt statuswijzigingen voor op basis van gekoppelde commits, comments en activiteit.", completed: false },
      { id: 4013, title: "Conversational UI", description: "Een chat-first interface als primair interactiemodel, naast de visuele interface.", completed: false },
      { id: 4014, title: "AI Project Coördinator", description: "Een AI-agent die basis follow-ups doet, vergaderingen plant en rapportages opstelt.", completed: false },
      { id: 4015, title: "Geëxporteerde PDF Rapporten", description: "Genereer professioneel opgemaakte PDF-rapporten van dashboards en projecten.", completed: false },
    ]
  },
  {
    name: "Fase 5: Personalisatie & Optimalisatie (Toekomst)",
    description: "Deze fase focust op het verfijnen van de gebruikerservaring, het bieden van meer aanpassingsmogelijkheden en het optimaliseren van de dagelijkse workflow.",
    features: [
        { id: 5001, title: "Aanpasbare Dashboards", description: "Stel je eigen dashboard samen met een bibliotheek van widgets.", completed: false },
        { id: 5002, title: "Taakafhankelijkheden Visualisatie", description: "Een interactieve graafweergave om de relaties tussen taken te zien.", completed: false },
        { id: 5003, title: "Bulk Bewerken in Lijstweergave", description: "Selecteer meerdere taken in de lijstweergave en bewerk ze tegelijkertijd.", completed: false },
        { id: 5004, title: "Verbeterde Mobiele Ervaring (PWA)", description: "Betere offline-ondersteuning, push-notificaties en native-achtige prestaties.", completed: false },
        { id: 5005, title: "Geavanceerde Terugkerende Taken", description: "Stel complexe herhalingen in, zoals 'elke laatste vrijdag van de maand'.", completed: false },
        { id: 5006, title: "Taakspecifieke Thema's/Iconen", description: "Geef individuele taken een uniek icoon of kleur voor snelle herkenning.", completed: false },
        { id: 5007, title: "Aanpasbare Notificaties", description: "Stel per project of team in welke notificaties je wilt ontvangen.", completed: false },
        { id: 5008, title: "Focus Modus v2", description: "Integreer een Pomodoro-timer en opties om afleidingen te blokkeren.", completed: false },
        { id: 5009, title: "Toegankelijkheidsverbeteringen (WCAG)", description: "Zorg ervoor dat de applicatie volledig voldoet aan WCAG 2.1 AA-normen.", completed: false },
        { id: 5010, title: "Snelkoppelingen voor Subtaken", description: "Maak snel subtaken aan met Markdown-achtige syntax (bv. `[ ] Subtaak`).", completed: false },
        { id: 5011, title: "Privé Notities op Taken", description: "Voeg notities toe aan een taak die alleen voor jou zichtbaar zijn.", completed: false },
        { id: 5012, title: "Command Bar Geschiedenis", description: "Bekijk en hergebruik recente commando's die je hebt uitgevoerd.", completed: false },
        { id: 5013, title: "Taakbord Zoom-niveaus", description: "Zoom in of uit op het kanbanbord om meer of minder details te zien.", completed: false },
        { id: 5014, title: "Persoonlijke Werk-uren", description: "Stel je werkuren in om workload-berekeningen en notificaties te verfijnen.", completed: false },
        { id: 5015, title: "Dark/Light Mode per Werkruimte", description: "Stel een specifiek thema in voor een organisatie, los van je persoonlijke voorkeur.", completed: false },
    ]
  }
];
