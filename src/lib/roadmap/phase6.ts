import type { Phase } from '../types';

export const phase6: Phase = {
    name: "Fase 6: 'Quality of Life' & Onboarding",
    description: "Focus op de initiële gebruikerservaring en het verfijnen van bestaande workflows om dagelijks gebruik nog aangenamer en efficiënter te maken.",
    features: [
      { id: 6001, title: "Interactieve Onboarding Tour", description: "Implementeer een multi-step geleide tour (bijv. met 'Shepherd.js') voor nieuwe gebruikers. De tour moet UI-elementen uitlichten en gebruikers aanzetten tot actie. Maak rol-specifieke tours: een 'Eigenaar' krijgt de stap 'Nodig Leden Uit', een 'Lid' niet.", completed: false },
      { id: 6002, title: "Contextuele Help & Kennisbank", description: "Voeg '?' iconen toe naast complexe UI-onderdelen (zoals RACI-velden of herhalende taken). Een klik opent een Popover met een korte uitleg en een link naar een gedetailleerd artikel in een toekomstige kennisbank.", completed: false },
      { id: 6003, title: "Notificatie Bundeling", description: "Verminder notificatie-ruis. Als er binnen korte tijd meerdere updates voor dezelfde taak zijn (bv. 5 nieuwe comments), bundel deze dan in één enkele, overzichtelijke notificatie in de inbox.", completed: false },
      { id: 6004, title: "Taak Relaties", description: "Breid de 'geblokkeerd door' functionaliteit uit. Voeg een UI toe in de taakdetails om taken expliciet te markeren als 'gerelateerd aan', 'duplicaat van' of 'gevolg van' een andere taak, inclusief een link.", completed: false },
      { id: 6005, title: "Geavanceerd Zoeken (Smart Views)", description: "Implementeer een geavanceerde zoekmodus die booleaanse logica ondersteunt (bv. `status:open AND (label:bug OR priority:urgent)`). Sta gebruikers toe deze complexe zoekopdrachten op te slaan als 'Smart Views' die verschijnen in de zijbalk.", completed: false },
      { id: 6006, title: "Aanpasbare Notificatiegeluiden", description: "Geef gebruikers in hun profielinstellingen de keuze uit een selectie van geluiden voor verschillende notificatietypes. Dit voegt een persoonlijk en herkenbaar element toe aan de gebruikerservaring.", completed: false },
      { id: 6007, title: "Focus Modus", description: "Creëer een nieuwe route `/dashboard/focus/[taskId]`. Deze pagina toont alleen de taaktitel, beschrijving en subtaken in een minimalistische, afleidingsvrije layout, met enkel een 'Terug' knop.", completed: false },
      { id: 6008, title: "Vastgezette Taken & Projecten", description: "Voeg een 'pin'-icoon toe aan taak- en projectkaarten. Vastgezette items worden prominent weergegeven in een speciaal 'Vastgezet' blok bovenaan het dashboard of de zijbalk voor snelle toegang.", completed: false },
    ]
  };
