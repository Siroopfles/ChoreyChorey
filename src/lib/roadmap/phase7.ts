import type { Phase } from '../types';

export const phase7: Phase = {
    name: "Fase 7: 'Real-time' Samenwerking",
    description: "De app transformeren van een reactieve naar een proactieve, live samenwerkingsomgeving.",
    features: [
      { id: 7001, title: "Live Aanwezigheidsindicatoren", description: "Implementeer een systeem dat real-time laat zien wie er online is. Toon een subtiele indicator naast gebruikersavatars in de hele applicatie. Bonus: toon op welke taak- of projectpagina een gebruiker zich momenteel bevindt.", completed: false },
      { id: 7002, title: "Real-time Bord & Lijst Updates", description: "Vervang het huidige data-fetching model (onSnapshot) door een meer geoptimaliseerde real-time oplossing (indien nodig, of verfijn onSnapshot). Wijzigingen die een teamlid maakt (bv. een taak verslepen) moeten onmiddellijk en vloeiend zichtbaar zijn voor anderen, zonder een volledige refresh.", completed: false },
      { id: 7003, title: "'Aan het typen...' Indicatoren", description: "Implementeer een indicator in het commentaarveld van een taak. Wanneer een gebruiker begint met typen, zien andere gebruikers die de taak open hebben staan een '... typt' melding, vergelijkbaar met moderne chat-apps.", completed: false },
      { id: 7004, title: "Commentaar naar Taak Converteren", description: "Voeg een 'Maak Taak' knop toe aan elk commentaar. Een klik hierop creëert een nieuwe, gekoppelde subtaak binnen dezelfde hoofdtaak, waarbij de inhoud van het commentaar automatisch de titel van de nieuwe subtaak wordt.", completed: false },
      { id: 7005, title: "In-app Audio Huddles", description: "Integreer een WebRTC-bibliotheek om snelle, spontane voice-chats te kunnen starten binnen de context van een taak of project. Dit voorkomt de noodzaak om over te schakelen naar een externe tool voor korte afstemming.", completed: false },
      { id: 7006, title: "Collaboratief Tekstbewerken", description: "Implementeer een bibliotheek zoals 'Tiptap' met live samenwerkingsfunctionaliteit voor het bewerken van taakbeschrijvingen. Meerdere gebruikers kunnen dan tegelijkertijd, in Google Docs-stijl, een beschrijving bewerken.", completed: false },
      { id: 7007, title: "Threaded Comments", description: "Maak het mogelijk om direct op specifieke comments te reageren, waardoor overzichtelijke discussies (threads) ontstaan. Dit verbetert de helderheid van communicatie bij complexe taken.", completed: false },
    ]
  };
