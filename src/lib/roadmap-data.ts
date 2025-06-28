

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
    ]
  },
  {
    name: "Fase 3: Ecosysteem & Integraties (Voltooid)",
    description: "Chorey verbinden met de tools die u al gebruikt. Deze fase richt zich op het openen van het platform en het bouwen van naadloze verbindingen met andere diensten.",
    features: [
      { id: 3001, title: "Public API v1 & Webhooks", description: "Uitbreiding van de API met meer endpoints (projecten, teams, gebruikers) en webhook management. Dit vormt de basis voor Zapier/Make integraties.", completed: true },
      { id: 3002, title: "Slack Integratie", description: "Verbind met Slack voor notificaties en gebruik het `/api/v1/command` endpoint om slash-commando's (`/chorey taak...`) te bouwen.", completed: true },
      { id: 3003, title: "GitHub Integratie & Webhooks", description: "Koppel taken aan issues/PRs en synchroniseer statusupdates automatisch via webhooks.", completed: true },
      { id: 3004, title: "Microsoft Teams Integratie", description: "Verbind met Teams voor notificaties en gebruik het `/api/v1/command` endpoint om bots en andere interacties te bouwen.", completed: true },
      { id: 3006, title: "Rijke Previews voor Cloud-bestanden", description: "Toon interactieve previews voor Google Workspace (Docs, Sheets, Slides) en Figma bestanden direct in de taakdetails.", completed: true },
      { id: 3007, title: "Email-to-Task Gateway", description: "Maak taken aan door een e-mail te sturen naar een uniek project- of gebruikersadres.", completed: true },
      { id: 3008, title: "GitLab & Bitbucket Integraties", description: "Koppel taken aan GitLab/Bitbucket issues en merge requests.", completed: true },
      { id: 3009, title: "Figma & Adobe XD Integratie", description: "Voeg design-bestanden toe aan taken. Figma-bestanden worden getoond met een interactieve live-preview.", completed: true },
      { id: 3010, title: "Outlook Calendar Integratie", description: "Synchroniseer deadlines met je Outlook agenda.", completed: true },
      { id: 3011, title: "Discord Integratie", description: "Verbind met Discord voor notificaties en gebruik het `/api/v1/command` endpoint om slash-commando's en bots te bouwen.", completed: true },
      { id: 3012, title: "Toggl/Clockify Integratie", description: "Start en stop de timer in Chorey en synchroniseer de tijdregistratie met uw favoriete tool.", completed: true },
      { id: 3013, title: "Browser Extensie (Bookmarklet)", description: "Maak een taak aan van de huidige webpagina met één klik.", completed: true },
      { id: 3014, title: "Jira Twee-weg Synchronisatie", description: "Koppel taken aan Jira issues. Reacties die in Jira worden geplaatst, verschijnen nu automatisch in de gekoppelde Chorey-taak.", completed: true },
    ]
  },
   {
    name: "Fase 4: Verfijning & Optimalisatie (Voltooid)",
    description: "Deze fase focust op het verfijnen van de gebruikerservaring, het bieden van meer aanpassingsmogelijkheden en het optimaliseren van de dagelijkse workflow.",
    features: [
        { id: 4001, title: "Proactieve AI Assistent", description: "De AI biedt nu automatisch hulp aan wanneer een gebruiker een complexe taak invoert.", completed: true },
        { id: 4002, title: "AI Feedback Loop", description: "Gebruikers kunnen met een duim omhoog/omlaag feedback geven op AI-suggesties, wat helpt om de modellen te verbeteren.", completed: true },
        { id: 4003, title: "Visuele Taakafhankelijkheden", description: "Het kanbanbord toont nu duidelijke indicatoren voor taken die andere taken blokkeren of erdoor geblokkeerd worden.", completed: true },
        { id: 4004, title: "Subtaak Promotie", description: "Zet een subtaak met één klik om in een volwaardige, losstaande taak met een link naar de oorspronkelijke taak.", completed: true },
        { id: 4005, title: "Custom Views (Groeperen)", description: "Het kanbanbord kan nu gegroepeerd worden op status, toegewezen persoon, prioriteit of project.", completed: true },
        { id: 4006, title: "Aanpasbare Dashboards", description: "Stel je eigen dashboard samen met een bibliotheek van widgets.", completed: true },
        { id: 4007, title: "Geavanceerde Terugkerende Taken", description: "Stel complexe herhalingen in, zoals 'elke laatste vrijdag van de maand'.", completed: true },
        { id: 4008, title: "Toegankelijkheidsverbeteringen (WCAG)", description: "Zorg ervoor dat de applicatie volledig voldoet aan WCAG 2.1 AA-normen.", completed: true },
        { id: 4009, title: "Persoonlijke Werk-uren", description: "Stel je werkuren in om workload-berekeningen en notificaties te verfijnen.", completed: true },
    ]
  },
  {
    name: "Fase 5: Geavanceerde Enterprise & Innovatie (Voltooid)",
    description: "De horizon van Chorey. Hier verkennen we baanbrekende ideeën, enterprise-grade functies en manieren om de grenzen van productiviteit en samenwerking te verleggen.",
    features: [
      { id: 5001, title: "Budgettering & Kostentracering", description: "Wijs budgetten toe aan projecten en houd de kosten per taak bij.", completed: true },
      { id: 5002, title: "Resource Management", description: "Geavanceerde capaciteitsplanning en workload-inzichten over langere periodes.", completed: true },
      { id: 5003, title: "Custom Fields", description: "Voeg eigen velden (tekst, getal, datum, dropdown) toe aan taken voor maximale flexibiliteit.", completed: true },
      { id: 5006, title: "Gast- / Klanttoegang", description: "Geef externe gebruikers beperkte, read-only toegang tot specifieke projecten of taken.", completed: true },
      { id: 5007, title: "IP Whitelisting", description: "Beperk toegang tot de organisatie tot specifieke IP-adressen voor extra beveiliging.", completed: true },
      { id: 5008, title: "Geavanceerde Ingebouwde Automatisering", description: "Een ingebouwde 'Zapier'-light voor het automatiseren van workflows binnen Chorey, compleet met triggers en acties.", completed: true },
      { id: 5009, title: "AI Predictive Analysis", description: "Waarschuwt proactief voor projectvertragingen en budgetoverschrijdingen op basis van historische data.", completed: true },
      { id: 5010, title: "AI Burnout Voorspelling", description: "Signaleert risico op overbelasting op basis van werkpatronen en taken.", completed: true },
      { id: 5011, title: "AI Automatische Status Updates", description: "Stelt statuswijzigingen voor op basis van gekoppelde commits, comments en activiteit.", completed: true },
      { id: 5012, title: "Conversational UI", description: "Een chat-first interface als primair interactiemodel, naast de visuele interface.", completed: true },
      { id: 5013, title: "AI Project Coördinator", description: "Een AI-agent die basis follow-ups doet, vergaderingen plant en rapportages opstelt.", completed: true },
      { id: 5014, title: "Geëxporteerde PDF Rapporten", description: "Genereer professioneel opgemaakte PDF-rapporten van dashboards en projecten.", completed: true },
    ]
  },
  {
    name: "Fase 6: 'Quality of Life' & Onboarding",
    description: "Focus op de initiële gebruikerservaring en het verfijnen van bestaande workflows om dagelijks gebruik nog aangenamer en efficiënter te maken.",
    features: [
      { id: 6001, title: "Interactieve Onboarding Tour", description: "Een stapsgewijze gids voor nieuwe gebruikers en organisaties om de belangrijkste functies te ontdekken.", completed: false },
      { id: 6002, title: "Contextuele Help & Documentatie", description: "Integreer help-icoontjes en tooltips door de hele app die linken naar een kennisbank.", completed: false },
      { id: 6003, title: "Notificatie Bundeling", description: "Combineer meerdere gerelateerde notificaties (bv. meerdere comments op één taak) in één overzichtelijke melding.", completed: false },
      { id: 6004, title: "Taak Relaties", description: "Markeer taken als 'gerelateerd aan', 'duplicaat van' of 'gevolg van' een andere taak voor meer context.", completed: false },
      { id: 6005, title: "Geavanceerd Zoeken met Filters", description: "Maak complexe zoekopdrachten met booleaanse logica (AND/OR/NOT) en sla deze op als 'Smart Views'.", completed: false },
      { id: 6006, title: "Gebruikers-specifieke Thema's", description: "Sta gebruikers toe om persoonlijke thema's te kiezen die alleen voor hen zichtbaar zijn, los van de organisatie-branding.", completed: false },
    ]
  },
  {
    name: "Fase 7: 'Real-time' Samenwerking",
    description: "De app transformeren van een reactieve naar een proactieve, live samenwerkingsomgeving.",
    features: [
      { id: 7001, title: "Real-time Aanwezigheid", description: "Zie wie er op dit moment online is, een specifieke taak bekijkt, of aan het typen is in een commentaarveld.", completed: false },
      { id: 7002, title: "Live Cursors (Optioneel)", description: "Een optionele functie voor het live zien van de muisbewegingen van andere gebruikers op een projectbord.", completed: false },
      { id: 7003, title: "Gedeelde Concepten", description: "Werk samen aan een taakbeschrijving of notitie voordat deze wordt opgeslagen.", completed: false },
      { id: 7004, title: "Verbeterde Notificatie-engine", description: "Directe push-notificaties naar de browser of desktop-app voor @mentions en belangrijke updates.", completed: false },
      { id: 7005, title: "Real-time Bord Updates", description: "Geen 'pull-to-refresh' meer; het kanbanbord en andere views updaten direct en vloeiend wanneer een teamlid een wijziging maakt.", completed: false },
    ]
  },
  {
    name: "Fase 8: Mobiele Ervaring & PWA",
    description: "Een naadloze en krachtige ervaring creëren voor gebruikers die onderweg zijn.",
    features: [
      { id: 8001, title: "Progressive Web App (PWA) Optimalisatie", description: "Verbeter de offline mogelijkheden, voeg native-like 'add to home screen' functionaliteit toe en zorg voor een snelle, app-achtige ervaring.", completed: false },
      { id: 8002, title: "Mobiel-specifieke UI/UX", description: "Ontwikkel specifieke componenten en layouts die geoptimaliseerd zijn voor kleinere schermen, zoals een 'bottom navigation bar'.", completed: false },
      { id: 8003, title: "Push Notificaties", description: "Implementeer web push notificaties voor belangrijke updates, zelfs als de app niet geopend is.", completed: false },
      { id: 8004, title: "Mobiele Widgets", description: "Ontwikkel home screen widgets (voor iOS/Android) die een overzicht van taken of een 'add task' knop tonen.", completed: false },
    ]
  },
  {
    name: "Fase 9: Geavanceerde Analyse & Inzichten",
    description: "Gebruikers en managers voorzien van diepere, actiegerichte inzichten in hun productiviteit en projectvoortgang.",
    features: [
      { id: 9001, title: "Deelbare Dashboards", description: "Maak een dashboard met specifieke rapporten en deel deze via een (beveiligde) link met belanghebbenden.", completed: false },
      { id: 9002, title: "Geplande Rapporten", description: "Configureer rapporten die automatisch op een vast tijdstip (bv. elke maandag) per e-mail als PDF worden verstuurd.", completed: false },
      { id: 9003, title: "Cycle & Lead Time Analyse", description: "Genereer grafieken die de doorlooptijd van taken tonen, van creatie tot voltooiing, per project of team.", completed: false },
      { id: 9004, title: "Individuele Productiviteitsinzichten", description: "Een persoonlijk dashboard met statistieken over voltooide taken, focus-tijd en meest productieve dagen/uren.", completed: false },
      { id: 9005, title: "AI-gestuurde Inzichten", description: "De AI analyseert data en presenteert opmerkelijke trends, zoals 'Taken met label X duren gemiddeld 30% langer'.", completed: false },
    ]
  },
  {
    name: "Fase 10: Testen & Betrouwbaarheid",
    description: "Een robuuste basis leggen voor een stabiele v1.0 release door een uitgebreide teststrategie te implementeren.",
    features: [
      { id: 10001, title: "Unit & Integratie Test-suite", description: "Implementeer Jest en React Testing Library voor het testen van componenten en server actions.", completed: false },
      { id: 10002, title: "End-to-End (E2E) Testen", description: "Zet een framework op (bv. Cypress of Playwright) voor het automatisch testen van complete gebruikersflows.", completed: false },
      { id: 10003, title: "CI/CD Pipeline Integratie", description: "Zorg ervoor dat alle tests automatisch worden uitgevoerd bij elke code-wijziging via GitHub Actions.", completed: false },
      { id: 10004, title: "Visuele Regressietesten", description: "Implementeer een tool (bv. Chromatic) om onbedoelde visuele wijzigingen in UI-componenten te detecteren.", completed: false },
      { id: 10005, title: "Performance Budgetting", description: "Stel prestatie-eisen in (bv. max. laadtijd, bundle-grootte) en laat de CI-pipeline falen als deze worden overschreden.", completed: false },
    ]
  },
  {
    name: "Fase 11: Performance & Schaalbaarheid",
    description: "De applicatie optimaliseren om snel en responsief te blijven, zelfs met een grote hoeveelheid data en gebruikers.",
    features: [
      { id: 11001, title: "Database Query Optimalisatie", description: "Analyseer en optimaliseer alle Firestore-queries, voeg waar nodig samengestelde indexen toe en denormaliseer data voor snellere leesacties.", completed: false },
      { id: 11002, title: "Code Splitting & Lazy Loading", description: "Splits de code op per pagina/component en laad alleen wat strikt noodzakelijk is om de initiële laadtijd te minimaliseren.", completed: false },
      { id: 11003, title: "Next.js Caching Strategieën", description: "Implementeer geavanceerde caching (ISR, data revalidation) voor statische en dynamische content.", completed: false },
      { id: 11004, title: "Load Testing", description: "Simuleer een groot aantal gelijktijdige gebruikers om knelpunten in de backend en database te identificeren.", completed: false },
      { id: 11005, title: "Edge Functies", description: "Verplaats bepaalde logica (zoals authenticatie-checks) naar de 'edge' voor lagere latency.", completed: false },
    ]
  },
  {
    name: "Fase 12: Documentatie & Developer SDK",
    description: "Gebruikers en ontwikkelaars in staat stellen om het maximale uit Chorey te halen.",
    features: [
      { id: 12001, title: "Openbare Kennisbank", description: "Creëer een helpcentrum (help.chorey.app) met handleidingen, tutorials en FAQ's voor eindgebruikers.", completed: false },
      { id: 12002, title: "Developer Documentatie", description: "Een interactieve documentatiesite (docs.chorey.app) voor de v1 API met codevoorbeelden en een 'Try it out'-functie.", completed: false },
      { id: 12003, title: "Publicatie TypeScript/JS SDK", description: "Publiceer een NPM-pakket dat het eenvoudig maakt om vanuit een JavaScript-omgeving met de Chorey API te interageren.", completed: false },
      { id: 12004, title: "Storybook voor Componenten", description: "Documenteer alle UI-componenten in Storybook, wat de ontwikkeling en het onderhoud van de UI versnelt.", completed: false },
    ]
  },
  {
    name: "Fase 13: Geavanceerde Enterprise Beveiliging",
    description: "Functies implementeren die voldoen aan de strenge beveiligingseisen van grote organisaties.",
    features: [
      { id: 13001, title: "Single Sign-On (SSO)", description: "Implementeer ondersteuning voor SAML 2.0- en OpenID Connect-protocollen voor integratie met identity providers zoals Okta en Azure AD.", completed: false },
      { id: 13002, title: "Geavanceerde Audit Logs", description: "Maak het mogelijk om audit logs te filteren, exporteren en te streamen naar externe SIEM-systemen (Security Information and Event Management).", completed: false },
      { id: 13003, title: "Data Loss Prevention (DLP)", description: "Ontwikkel regels om te voorkomen dat gevoelige informatie (bv. creditcardnummers) per ongeluk in taken wordt opgeslagen.", completed: false },
      { id: 13004, title: "E-discovery & Legal Hold", description: "Bied beheerders de mogelijkheid om data van specifieke gebruikers of projecten te bevriezen en te exporteren voor juridische doeleinden.", completed: false },
       { id: 5005, title: "Data Residency Opties", description: "Kies de geografische locatie voor dataopslag (EU/US). Dit vereist het opzetten van meerdere Firebase projecten in verschillende regio's.", completed: false },
    ]
  },
  {
    name: "Fase 14: AI Agent Autonomie",
    description: "De AI evolueren van een reactieve assistent naar een proactieve, autonome teamgenoot.",
    features: [
      { id: 14001, title: "Autonome Taakuitvoering", description: "De AI kan, na goedkeuring, zelfstandig taken uitvoeren die via de API kunnen worden aangestuurd, zoals het uitvoeren van een script of het versturen van een e-mail.", completed: false },
      { id: 14002, title: "Continue Modelverbetering", description: "Implementeer een systeem waarbij de AI-modellen periodiek worden gefinetuned op basis van geanonimiseerde feedback en succesvolle interacties.", completed: false },
      { id: 14003, title: "Doelgerichte AI Agenten", description: "Gebruikers kunnen een doel instellen (bv. 'Lanceer de marketingcampagne voor Q4'), waarna de AI zelfstandig een compleet projectplan met taken, afhankelijkheden en deadlines opstelt.", completed: false },
      { id: 14004, title: "Multi-Agent Samenwerking", description: "Laat gespecialiseerde AI-agenten (bv. een 'planning-agent' en een 'risico-agent') samenwerken aan complexe projecten.", completed: false },
    ]
  },
  {
    name: "Fase 15: Release Candidate & v1.0 Lancering",
    description: "De laatste stap voor de officiële v1.0 release. Focus op stabiliteit, polish en marktintroductie.",
    features: [
      { id: 15001, title: "Feature Freeze & RC-periode", description: "Een periode waarin geen nieuwe features worden toegevoegd en alle focus ligt op het oplossen van de laatste bugs.", completed: false },
      { id: 15002, title: "Uitgebreide Browser- en Apparaattesten", description: "Verifieer de werking en weergave op alle belangrijke browsers (Chrome, Firefox, Safari, Edge) en apparaten (desktop, tablet, mobiel).", completed: false },
      { id: 15003, title: "Definitieve Documentatie Review", description: "Zorg ervoor dat alle publieke documentatie (kennisbank, API-docs) compleet, accuraat en up-to-date is.", completed: false },
      { id: 15004, title: "Lancering Marketingmateriaal", description: "Voorbereiden van de website, blogposts en social media aankondigingen voor de v1.0 release.", completed: false },
      { id: 15005, title: "Versie 1.0 Release", description: "De officiële, stabiele release van Chorey v1.0.", completed: false },
    ]
  }
];
