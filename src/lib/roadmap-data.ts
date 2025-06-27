
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
      { id: 1001, title: "Taakcreatie & Eigenschappen", description: "Prioriteit, labels, toewijzing en deadlines.", completed: true },
      { id: 1002, title: "Taakstatussen & Workflow", description: "Configureerbare statussen met kleurcodering (Te Doen, In Uitvoering, etc.).", completed: true },
      { id: 1003, title: "Subtaken (Sub-tasks)", description: "Hiërarchische, afvinkbare subtaken binnen een hoofdtaak.", completed: true },
      { id: 1004, title: "Taakafhankelijkheden ('Blocked by')", description: "Voorkom dat een taak start voordat een andere is voltooid.", completed: true },
      { id: 1005, title: "Taaktemplates", description: "Sla taken op als templates voor hergebruik.", completed: true },
      { id: 1006, title: "Bestands- & Linkbijlagen", description: "Voeg URL's toe aan taken.", completed: true },
      { id: 1007, title: "Persoonlijke Taken & Zichtbaarheid", description: "Markeer taken als privé, alleen zichtbaar voor de maker en toegewezene.", completed: true },
      { id: 1008, title: "Historie & Logging", description: "Volledige, zichtbare geschiedenis van alle wijzigingen per taak.", completed: true },
      { id: 1009, title: "Taak Klonen", description: "Dupliceer een bestaande taak met één klik.", completed: true },
      { id: 1010, title: "Bulk Taakoperaties", description: "Bewerk status, prioriteit en toegewezene voor meerdere taken tegelijk.", completed: true },
      { id: 1011, title: "Handmatige Taakvolgorde", description: "Sleep taken in de gewenste volgorde binnen een statuskolom.", completed: true },
      { id: 1012, title: "Rich Text Editor", description: "Opmaakmogelijkheden (vet, cursief, lijsten) in beschrijvingen en comments.", completed: true },
      { id: 1013, title: "Recycle Bin / Prullenbak", description: "Herstel geannuleerde taken vanuit de 'Geannuleerd' kolom.", completed: true },
      { id: 1064, title: "Geavanceerd Webdashboard", description: "Het centrale beheerplatform.", completed: true },
      { id: 1066, title: "Keyboard Shortcuts (Webdashboard)", description: "Sneltoetsen voor efficiëntie.", completed: true },
      { id: 1072, title: "Command Palette (Cmd/Ctrl+K)", description: "Een centrale interface om alles te besturen.", completed: true },
      { id: 1074, title: "Aanpasbare Views (Filteren)", description: "Filter taken op basis van diverse criteria.", completed: true },
      { id: 1075, title: "Dark Mode & Theming", description: "Donkere modus en andere kleurenthema's voor de interface.", completed: true },
      { id: 1079, title: "Data Export (CSV)", description: "Exporteer taken naar CSV.", completed: true },
      { id: 1080, title: "Data Import (CSV)", description: "Importeer taken vanuit een CSV-bestand.", completed: true },
      { id: 1093, title: "Geavanceerd Rechtenbeheer (RBAC)", description: "Definieer rollen (Eigenaar, Beheerder, Lid) met specifieke permissies.", completed: true },
      { id: 94, title: "Two-Factor Authentication (2FA)", description: "Verbeterde accountbeveiliging.", completed: true },
    ]
  },
  {
    name: "Fase 2: Intelligentie & Samenwerking (Actief)",
    description: "In deze fase maken we Chorey slimmer en socialer. De focus ligt op AI-ondersteuning, gamification en functies die teamwerk en productiviteit bevorderen.",
    features: [
      { id: 1040, title: "AI Smart Assignment", description: "Stelt de beste persoon voor een taak voor op basis van data.", completed: true },
      { id: 1041, title: "AI-Assisted Task Breakdown", description: "Genereert subtaken voor een complexe hoofdtaak.", completed: true },
      { id: 1042, title: "AI-Powered Task Summarization", description: "Vat lange discussies in taak-comments samen.", completed: true },
      { id: 1043, title: "NLP voor Taakcreatie & Herinneringen", description: "Creëer taken en reminders met gewone zinnen (bv. /remindme).", completed: true },
      { id: 1044, title: "Smart Search (Natural Language Query)", description: "Doorzoek de database met complexe vragen via de commandobalk.", completed: true },
      { id: 1047, title: "AI-Powered Risico-Identificatie", description: "Analyseert taakteksten op potentiële risicowoorden.", completed: true },
      { id: 1049, title: "AI Voice-to-Task & Voice Control", description: "Dicteer taken en commando's via spraak.", completed: true },
      { id: 1052, title: "AI-Suggested Taakprioritering", description: "Geeft een voorzet voor de prioriteit op basis van inhoud en context.", completed: true },
      { id: 1051, title: "AI-Powered Image Generation", description: "Genereer een omslagfoto voor een taak op basis van de titel.", completed: true },
      { id: 1050, title: "AI Multi-Speaker Text-to-Speech", description: "Zet een discussie om in een gesprek met meerdere stemmen.", completed: true },
      { id: 50, title: "Automatische Detectie van Dubbele Taken", description: "Signaleert mogelijke duplicaten bij aanmaak.", completed: true },
      { id: 1054, title: "Beloningssysteem", description: "Experience Points (EXP) en Punten.", completed: true },
      { id: 1055, title: "Achievements & Badges", description: "Ontgrendelbare prestaties voor mijlpalen.", completed: true },
      { id: 1056, title: "Leaderboards", description: "Scoreborden per team/organisatie.", completed: true },
      { id: 1057, title: "Karma- & Bedanksysteem", description: "Stimuleer positieve interactie door collega's te bedanken.", completed: true },
      { id: 30, title: "'Kudos' Tipping", description: "Geef een deel van je punten aan een collega als bedankje.", completed: true },
      { id: 1022, title: "Task Review & Approval Workflow", description: "Formele goedkeuringsstap ('In Review') voor voltooide taken.", completed: true },
      { id: 1023, title: "Effort Estimation (Story Points)", description: "Schat complexiteit in met Story Points.", completed: true },
      { id: 1024, title: "Gantt Chart View", description: "Visuele tijdlijn-weergave van projecten.", completed: true },
      { id: 1025, title: "Actieve Tijdregistratie", description: "Start/stop een timer per taak voor precieze tijdsmeting.", completed: true },
      { id: 26, title: "Workload Capacity Planning", description: "Visualiseer de werkdruk per teamlid.", completed: true },
      { id: 1088, title: "Flexibel Notificatiesysteem", description: "Notificaties voor @mentions en toewijzingen.", completed: true },
      { id: 1090, title: "Notificatie \"Snooze\" Functionaliteit", description: "Stel een notificatie uit.", completed: true },
      { id: 91, title: "Verbeterde @mentions en Taakdiscussies", description: "Rijkere discussies met threads.", completed: true },
      { id: 92, title: "Notificatie Digest", description: "Ontvang een samenvatting (dagelijks/wekelijks) van alle updates.", completed: true },
      { id: 109, title: "Automatische Documentatie Generator", description: "Analyseert taken met een 'code'-tag en maakt een wiki-pagina.", completed: false },
    ]
  },
  {
    name: "Fase 3: Ecosysteem & Integraties (Gepland)",
    description: "Chorey verbinden met de tools die u al gebruikt. Deze fase richt zich op het openen van het platform en het bouwen van naadloze verbindingen met andere diensten.",
    features: [
      { id: 82, title: "Exposed REST API voor Ontwikkelaars", description: "Laat derden bouwen op Chorey.", completed: true },
      { id: 87, title: "Webhooks", description: "Stuur real-time updates naar externe systemen bij gebeurtenissen in Chorey.", completed: true },
      { id: 80, title: "Google Calendar Integratie", description: "Synchroniseer deadlines met je agenda.", completed: false },
      { id: 81, title: "GitHub Integratie", description: "Koppel taken aan issues en pull requests.", completed: false },
      { id: 83, title: "Microsoft Teams Integratie", description: "Volledige functionaliteit binnen MS Teams.", completed: false },
      { id: 84, title: "Zapier / Make (Integromat) Integratie", description: "Verbind Chorey met duizenden andere apps.", completed: false },
      { id: 85, title: "Cloud Storage Integraties", description: "Koppel bestanden direct vanuit Google Drive, OneDrive, Dropbox.", completed: false },
      { id: 86, title: "Email-to-Task Gateway", description: "Maak taken aan door een e-mail te sturen naar een uniek projectadres.", completed: false },
      { id: 50, title: "Native Automation Builder", description: "Ingebouwde 'Zapier'-light.", completed: false },
      { id: 51, title: "GitLab & Bitbucket Integraties", description: "Koppel taken aan GitLab/Bitbucket.", completed: false },
      { id: 52, title: "Figma / Adobe XD / Sketch Integratie", description: "Koppel design-bestanden aan taken.", completed: false },
      { id: 53, title: "CRM Integraties", description: "HubSpot, Salesforce.", completed: false },
      { id: 54, title: "Boekhoudsoftware Integraties", description: "QuickBooks, Xero.", completed: false },
    ]
  },
  {
    name: "Fase 4: Geavanceerde Enterprise & Innovatie (Toekomst)",
    description: "De horizon van Chorey. Hier verkennen we baanbrekende ideeën, enterprise-grade functies en manieren om de grenzen van productiviteit en samenwerking te verleggen.",
    features: [
      { id: 13, title: "Headcount Planning", description: "Plan toekomstige personeelsbehoefte op projectniveau.", completed: true },
      { id: 14, title: "Resource Vervanging", description: "Snel alle taken van persoon A overzetten naar persoon B.", completed: true },
      { id: 15, title: "RACI Matrix Generator", description: "Genereer een Responsible, Accountable, Consulted, Informed matrix.", completed: true },
      { id: 16, title: "Automatische Resource Leveling", description: "Verschuif taken automatisch om overbelasting te voorkomen.", completed: true },
      { id: 20, title: "AI Team Composition Suggester", description: "Stelt het ideale team voor een nieuw project voor.", completed: false },
      { id: 21, title: "AI Communicatie 'Health' Score", description: "Analyseert reactietijden, sentiment etc.", completed: false },
      { id: 26, title: "AI Burnout Voorspelling", description: "Signaleert risico op basis van werkpatronen.", completed: false },
      { id: 45, title: "AI Predictive Analysis & Risk Detection", description: "Waarschuwt proactief voor projectvertragingen.", completed: false },
      { id: 96, title: "Single Sign-On (SSO)", description: "Integratie met SAML, Google, Microsoft.", completed: false },
      { id: 97, title: "Data Residency Opties", description: "Kies de geografische locatie voor dataopslag.", completed: false },
      { id: 98, title: "Gast- / Klanttoegang", description: "Geef externe gebruikers beperkte toegang.", completed: false },
      { id: 99, title: "IP Whitelisting", description: "Beperk toegang tot specifieke IP-adressen.", completed: false },
      { id: 131, title: "VR/AR Project Visualisatie", description: "'The Project Room' om data in 3D te zien.", completed: false },
      { id: 132, title: "Conversational UI", description: "Een chat-first interface als primair interactiemodel.", completed: false },
      { id: 136, title: "Autonome AI Project Coördinator", description: "Een AI die basis follow-ups en rapportages doet.", completed: false },
    ]
  }
];
