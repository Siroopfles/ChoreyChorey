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
  ]
};
