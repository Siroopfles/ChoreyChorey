
import type { Phase } from '../types';

export const phase15: Phase = {
  name: "Fase 15: Release Candidate & v1.0 Lancering",
  description: "De laatste stap voor de officiële v1.0 release. Focus op stabiliteit, polish en marktintroductie.",
  features: [
    { id: 15001, title: "Feature Freeze & RC-periode", description: "Een vastgestelde periode (bv. 2-4 weken) waarin geen nieuwe features worden toegevoegd. Alle ontwikkelcapaciteit wordt gericht op het oplossen van resterende bugs, het verbeteren van de prestaties en het verfijnen van de UI/UX.", completed: false },
    { id: 15002, title: "Uitgebreide Browser- en Apparaattesten", description: "Verifieer handmatig en via geautomatiseerde tests de correcte werking en weergave van de volledige applicatie op de laatste versies van Chrome, Firefox, Safari en Edge, op zowel desktop, tablet als mobiele apparaten.", completed: false },
    { id: 15003, title: "Definitieve Documentatie Review", description: "Een volledige review van alle publieke documentatie, inclusief de kennisbank en de API-documentatie, om te zorgen dat deze compleet, accuraat, en up-to-date is voor de v1.0 release.", completed: false },
    { id: 15004, title: "Gebruikersacceptatietest (UAT) Programma", description: "Voer een gestructureerd beta-programma uit met een selecte groep van 'power users'. Geef hen specifieke scenario's om te testen en verzamel gestructureerde feedback om de laatste knelpunten te identificeren.", completed: false },
    { id: 15005, title: "Internationalisatie (i18n) & Lokalisatie (l10n)", description: "Refactor de codebase om tekst-strings te scheiden van de UI-logica (bv. met `react-i18next`). Zorg ervoor dat datums, getallen en valuta zich correct aanpassen aan de locale van de gebruiker. Lever de v1.0 op in het Nederlands en Engels.", completed: false },
    { id: 15006, title: "Product Hunt Lancering", description: "Bereid een strategische lancering voor op Product Hunt. Dit omvat het creëren van marketingmateriaal (screenshots, video), het schrijven van een overtuigende 'first comment', en het mobiliseren van het netwerk om de lancering te ondersteunen.", completed: false },
    { id: 15007, title: "Versie 1.0 Release", description: "De officiële, stabiele release van Chorey v1.0, gemarkeerd met een Git-tag en aangekondigd via alle communicatiekanalen.", completed: false },
    { id: 15008, title: "In-app Feedbackformulier", description: "Implementeer een eenvoudig, niet-storend feedbackformulier binnen de applicatie, waarmee gebruikers direct suggesties kunnen doen of bugs kunnen rapporteren zonder de applicatie te verlaten.", completed: false },
    { id: 15009, title: "Marketing & Landing Pagina Update", description: "Een volledige update van de marketingwebsite om alle v1.0 features te reflecteren, inclusief nieuwe testimonials, screenshots en een duidelijke 'pricing' pagina (zelfs als er een gratis tier is).", completed: false },
    { id: 15010, title: "Juridische Documenten Finaliseren", description: "Laat de Algemene Voorwaarden en het Privacybeleid juridisch toetsen en finaliseren voor de v1.0 release om te voldoen aan alle wettelijke vereisten.", completed: false },
    { id: 15011, title: "Support Kanalen Opzetten", description: "Richt de officiële supportkanalen in, zoals een support-e-mailadres, een ticketing-systeem (indien nodig), en de eerder genoemde kennisbank en community forum, en zorg dat deze bemand zijn voor de lancering.", completed: false },
    { id: 15012, title: "Analytics & Monitoring Setup", description: "Configureer monitoring- en analytics-tools (zoals Google Analytics, Vercel Analytics, Sentry) om het gebruik, de prestaties en de fouten van de v1.0-release nauwgezet te kunnen volgen.", completed: false },
    { id: 15013, title: "Perskit", description: "Stel een perskit samen met het Chorey-logo, screenshots van de app, een productomschrijving en contactinformatie, gemakkelijk toegankelijk op de website voor media en bloggers.", completed: false },
    { id: 15014, title: "E-mail Onboarding Campagne", description: "Ontwikkel een geautomatiseerde e-mailsequentie voor nieuwe gebruikers. Deze campagne moet hen de eerste week begeleiden, belangrijke features uitlichten en hen aanmoedigen om de app volledig te benutten.", completed: false },
    { id: 15015, title: "Celebration!", description: "Neem als team de tijd om de lancering van versie 1.0 te vieren. Het is een enorme mijlpaal die erkenning en waardering verdient.", completed: false }
  ]
};
