import type { Phase } from '../types';

export const phase8: Phase = {
    name: "Fase 8: Mobiele Ervaring & PWA",
    description: "Een naadloze en krachtige ervaring creëren voor gebruikers die onderweg zijn.",
    features: [
      { id: 8001, title: "PWA Offline First Architectuur", description: "Verbeter de offline mogelijkheden van de Progressive Web App. Implementeer een service worker strategie die niet alleen data cachet, maar ook volledige taakcreatie en -bewerking offline mogelijk maakt, met een robuust achtergrond-synchronisatiesysteem.", completed: false },
      { id: 8002, title: "Mobiel-specifieke UI/UX", description: "Ontwikkel specifieke mobiele componenten voor een betere gebruikerservaring, zoals een 'bottom navigation bar' voor snelle toegang tot 'Dashboard', 'Mijn Taken', 'Inbox' en een centrale 'Taak Toevoegen' knop.", completed: false },
      { id: 8003, title: "Web Push Notificaties", description: "Implementeer web push notificaties via een service als Firebase Cloud Messaging. Gebruikers kunnen dan notificaties ontvangen voor @mentions en belangrijke updates, zelfs als de app gesloten is.", completed: false },
      { id: 8004, title: "Mobiele Home Screen Widgets", description: "Ontwikkel widgets voor iOS en Android die gebruikers op hun home screen kunnen plaatsen. Bied een 'takenoverzicht'-widget en een snelle 'taak toevoegen'-widget.", completed: false },
      { id: 8005, title: "'Deel naar Chorey' Functionaliteit", description: "Integreer met het native 'share sheet' van mobiele besturingssystemen. Dit stelt gebruikers in staat om een link, afbeelding of tekst vanuit elke andere app direct te delen naar Chorey om een nieuwe taak aan te maken.", completed: false },
      { id: 8006, title: "Haptische Feedback", description: "Voeg subtiele trillingen (haptics) toe op mobiele apparaten bij belangrijke acties zoals het voltooien van een taak, het ontvangen van 'kudos' of het slepen van een taak, wat de interactie bevredigender maakt.", completed: false },
      { id: 8007, title: "Mobiele Spraakcommando's", description: "Integreer de spraakherkenning direct in de mobiele app-interface, bijvoorbeeld via een microfoon-icoon in de zoekbalk, om taken handsfree te kunnen aanmaken of bewerken.", completed: false },
    ]
  };
