
import type { Phase } from '../types';

export const phase12: Phase = {
  name: "Fase 12: Documentatie & Developer SDK",
  description: "Gebruikers en ontwikkelaars in staat stellen om het maximale uit Chorey te halen.",
  features: [
    { id: 12001, title: "Openbare Kennisbank", description: "Creëer een helpcentrum (bv. op een subdomein `help.chorey.app`) met gedetailleerde handleidingen, tutorials en FAQ's voor alle gebruikers, van beginners tot beheerders.", completed: false },
    { id: 12002, title: "Developer Documentatie", description: "Bouw een interactieve documentatiesite (bv. met Docusaurus of Mintlify op `docs.chorey.app`) voor de v1 API. Documenteer elk endpoint met parameters, responses en codevoorbeelden in verschillende talen.", completed: false },
    { id: 12003, title: "Publicatie TypeScript/JS SDK", description: "Ontwikkel en publiceer een officieel NPM-pakket (`@chorey/sdk`) dat de interactie met de Chorey API vereenvoudigt. De SDK moet volledig getypeerd zijn voor een optimale developer experience.", completed: false },
    { id: 12004, title: "Storybook voor Componenten", description: "Documenteer alle herbruikbare UI-componenten (knoppen, kaarten, dialogen) in Storybook. Dit versnelt de ontwikkeling, bevordert consistentie en maakt visuele regressietests mogelijk.", completed: false },
    { id: 12005, title: "Openbare Postman Collectie", description: "Publiceer een uitgebreide Postman-collectie die de volledige v1 API documenteert. Dit stelt ontwikkelaars in staat om de API snel te verkennen en te testen zonder zelf requests te hoeven opbouwen.", completed: false },
    { id: 12006, title: "Developer Blog", description: "Start een technische blog om de community te betrekken. Schrijf artikelen over de architecturale keuzes, de implementatie van complexe features, en de lessen die tijdens de ontwikkeling zijn geleerd.", completed: false },
    { id: 12007, title: "In-App Gidsen & Video Tutorials", description: "Creëer korte video-tutorials voor kernfunctionaliteiten en maak deze toegankelijk via een 'Help'-menu binnen de applicatie. Dit verlaagt de drempel voor nieuwe gebruikers om complexe features te adopteren.", completed: false },
    { id: 12008, title: "Open-Source Initiatieven", description: "Identificeer niet-kritieke, generieke onderdelen van de applicatie (zoals een specifieke React hook of utility-bibliotheek) en publiceer deze als open-source projecten om bij te dragen aan de developer community en het merk Chorey te versterken.", completed: false },
    { id: 12009, title: "API Statuspagina", description: "Implementeer een openbare statuspagina (bv. met `status.chorey.app`) die de real-time status en uptime van de API en andere kritieke diensten toont. Dit bouwt vertrouwen en biedt transparantie bij eventuele storingen.", completed: false },
    { id: 12010, title: "Case Studies & Gebruikersverhalen", description: "Documenteer hoe verschillende typen teams (van families tot software-ontwikkelaars) Chorey gebruiken om hun doelen te bereiken. Publiceer deze 'case studies' op de website en in de kennisbank als inspiratie.", completed: false },
    { id: 12011, title: "Interactieve API Explorer", description: "Integreer een tool zoals Swagger UI of Redoc in de API-documentatie. Dit stelt ontwikkelaars in staat om API-calls direct vanuit de browser uit te voeren, wat het leerproces enorm versnelt.", completed: false },
    { id: 12012, title: "Community Forum", description: "Creëer een community forum of Discord-server waar gebruikers vragen kunnen stellen, best practices kunnen delen, en direct kunnen interacteren met het Chorey-ontwikkelteam.", completed: false },
    { id: 12013, title: "Developer Nieuwsbrief", description: "Start een maandelijkse nieuwsbrief specifiek gericht op ontwikkelaars, met updates over de API, nieuwe SDK-versies, en technische artikelen van de blog.", completed: false },
    { id: 12014, title: "Changelog Documentatie", description: "Houd een gedetailleerde, openbare changelog bij van alle updates en nieuwe features in de applicatie. Categoriseer wijzigingen in 'Nieuw', 'Verbeterd' en 'Opgelost' voor duidelijkheid.", completed: false },
    { id: 12015, title: "In-Code Documentatie (JSDoc)", description: "Zorg voor een uitstekende in-code documentatie met JSDoc voor alle belangrijke functies, componenten en types. Dit verbetert de onderhoudbaarheid en maakt het voor nieuwe ontwikkelaars gemakkelijker om de codebase te begrijpen.", completed: false }
  ]
};
