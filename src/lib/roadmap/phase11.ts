import type { Phase } from '../types';

export const phase11: Phase = {
  name: "Fase 11: Performance & Schaalbaarheid",
  description: "De applicatie optimaliseren om snel en responsief te blijven, zelfs met een grote hoeveelheid data en gebruikers.",
  features: [
    { id: 11001, title: "Database Query Optimalisatie", description: "Analyseer alle Firestore-queries met behulp van de profiler. Voeg waar nodig samengestelde indexen toe. Denormaliseer data strategisch (bv. het opslaan van de naam van een toegewezen persoon op de taak) om complexe joins aan de client-side te verminderen.", completed: false },
    { id: 11002, title: "Code Splitting & Lazy Loading", description: "Implementeer `React.lazy` en dynamische `import()` voor componenten en pagina's die niet direct nodig zijn bij de initiële laadtijd. Dit verkleint de JavaScript-bundle en verbetert de First Contentful Paint.", completed: false },
    { id: 11003, title: "Next.js Caching Strategieën", description: "Maak gebruik van de geavanceerde caching-mogelijkheden van Next.js. Implementeer Incremental Static Regeneration (ISR) voor semi-statische pagina's zoals de publieke roadmap en data revalidation voor het efficiënt updaten van gecachete data.", completed: false },
    { id: 11004, title: "Load Testing", description: "Gebruik een tool zoals k6 of Artillery om een groot aantal gelijktijdige gebruikers te simuleren. Test de belasting op de backend, met name de API-endpoints en Firestore-lees/schrijfacties, om knelpunten te identificeren.", completed: false },
    { id: 11005, title: "Edge Functies", description: "Verplaats bepaalde logica, zoals A/B-testen, authenticatie-checks of het doorsturen van verzoeken, naar de 'edge' (bv. met Vercel Edge Functions of Cloudflare Workers) om de latency voor de eindgebruiker te minimaliseren.", completed: false },
    { id: 11006, title: "Gevirtualiseerde Lijsten & Borden", description: "Implementeer 'windowing' of 'virtualization' met een bibliotheek zoals `react-window` of `tanstack-virtual` voor lange taaklijsten en kanban-kolommen. Dit zorgt ervoor dat alleen de zichtbare items in de DOM worden gerenderd, wat de prestaties bij grote hoeveelheden data drastisch verbetert.", completed: false },
    { id: 11007, title: "Firebase App Check", description: "Bescherm backend resources door App Check te implementeren. Dit verifieert dat verzoeken naar Firestore en Cloud Functions afkomstig zijn van uw authentieke applicatie, en niet van ongeautoriseerde clients of scripts.", completed: false },
  ]
};
