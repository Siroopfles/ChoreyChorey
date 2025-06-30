
import type { Phase } from '../types';

export const phase8: Phase = {
    name: "Fase 8: Mobiele Ervaring & PWA",
    description: "Een naadloze en krachtige ervaring creëren voor gebruikers die onderweg zijn.",
    features: [
      { id: 8001, title: "PWA Offline First Architectuur", description: "Verbeter de offline mogelijkheden van de Progressive Web App. Implementeer een service worker strategie die niet alleen data cachet, maar ook volledige taakcreatie en -bewerking offline mogelijk maakt, met een robuust achtergrond-synchronisatiesysteem.", completed: true },
      { id: 8002, title: "Mobiel-specifieke UI/UX", description: "Ontwikkel specifieke mobiele componenten voor een betere gebruikerservaring, zoals een 'bottom navigation bar' voor snelle toegang tot 'Dashboard', 'Mijn Taken', 'Inbox' en een centrale 'Taak Toevoegen' knop.", completed: true },
      { id: 8003, title: "Web Push Notificaties", description: "Implementeer web push notificaties via een service als Firebase Cloud Messaging. Gebruikers kunnen dan notificaties ontvangen voor @mentions en belangrijke updates, zelfs als de app gesloten is.", completed: true },
      { id: 8004, title: "Mobiele Home Screen Widgets", description: "Ontwikkel widgets voor iOS en Android die gebruikers op hun home screen kunnen plaatsen. Bied een 'takenoverzicht'-widget en een snelle 'taak toevoegen'-widget.", completed: false },
      { id: 8005, title: "'Deel naar Chorey' Functionaliteit", description: "Integreer met het native 'share sheet' van mobiele besturingssystemen. Dit stelt gebruikers in staat om een link, afbeelding of tekst vanuit elke andere app direct te delen naar Chorey om een nieuwe taak aan te maken.", completed: true },
      { id: 8006, title: "Haptische Feedback", description: "Voeg subtiele trillingen (haptics) toe op mobiele apparaten bij belangrijke acties zoals het voltooien van een taak, het ontvangen van 'kudos' of het slepen van een taak, wat de interactie bevredigender maakt.", completed: true },
      { id: 8007, title: "Mobiele Spraakcommando's", description: "Integreer de spraakherkenning direct in de mobiele app-interface, bijvoorbeeld via een microfoon-icoon in de zoekbalk, om taken handsfree te kunnen aanmaken of bewerken.", completed: false },
      { id: 8008, title: "Camera Integratie voor Bijlagen", description: "Maak het mogelijk om direct vanuit de taakdetails een foto te maken met de camera van het apparaat en deze als bijlage toe te voegen. Ideaal voor het documenteren van bugs of fysieke werkzaamheden.", completed: true },
      { id: 8009, title: "Locatiegebaseerde Herinneringen", description: "Gebruik de locatievoorzieningen van het apparaat om een herinnering te sturen voor een taak wanneer de gebruiker een specifieke locatie betreedt of verlaat (bv. 'Vergeet niet de boodschappen te doen' wanneer je de supermarkt verlaat).", completed: false },
      { id: 8010, title: "QR Code Scanner voor Taken", description: "Associeer taken met een QR-code. Gebruikers kunnen dan de code scannen met de mobiele app om direct naar de betreffende taakdetails te navigeren, handig voor het beheren van fysieke objecten of locaties.", completed: false },
      { id: 8011, title: "Swipe Gebaren in Lijsten", description: "Implementeer intuïtieve swipe-gebaren in de mobiele lijstweergave. Swipe naar rechts om een taak snel als 'voltooid' te markeren en naar links om deze te snoozen of later te bekijken.", completed: false },
      { id: 8012, title: "Geoptimaliseerde Mobiele Kalender", description: "Ontwerp een compacte, touch-vriendelijke versie van de kalenderweergave die specifiek is geoptimaliseerd voor kleinere schermen, met een focus op dag- en agendaweergaven.", completed: false },
      { id: 8013, title: "Biometrische App-vergrendeling", description: "Voeg een extra beveiligingslaag toe aan de mobiele app door gebruikers de optie te geven om de app te vergrendelen met Face ID, Touch ID of een vingerafdrukscanner.", completed: false },
      { id: 8014, title: "Aanpasbaar 'Snelle Acties' Menu", description: "Laat gebruikers via een 'lang indrukken' gebaar op een taak een contextmenu openen met hun meest gebruikte acties, zoals 'Toewijzen aan mij', 'Prioriteit verhogen' of 'Verplaatsen naar morgen'.", completed: false },
      { id: 8015, title: "Optimalisatie voor Tablets", description: "Zorg voor een uitstekende ervaring op tablets door een twee- of drie-koloms layout te gebruiken die de extra schermruimte optimaal benut, bijvoorbeeld met een permanente takenlijst aan de zijkant.", completed: false }
    ]
  };
