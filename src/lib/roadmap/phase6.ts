
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
      { id: 6007, title: "Focus Modus", description: "Creëer een nieuwe route `/dashboard/focus/[taskId]`. Deze pagina toont alleen de taaktitel, beschrijving en subtaken in een minimalistische, afleidingsvrije layout, met enkel een 'Terug' knop.", completed: true },
      { id: 6008, title: "Vastgezette Taken & Projecten", description: "Voeg een 'pin'-icoon toe aan taak- en projectkaarten. Vastgezette items worden prominent weergegeven in een speciaal 'Vastgezet' blok bovenaan het dashboard of de zijbalk voor snelle toegang.", completed: false },
      { id: 6009, title: "Toetsenbord Shortcut Cheat Sheet", description: "Implementeer een modaal venster (te openen met '?') dat een overzicht toont van alle beschikbare keyboard shortcuts, zodat power-users de applicatie nog sneller kunnen bedienen.", completed: false },
      { id: 6010, title: "Thema Aanpassingen", description: "Breid de puntenwinkel uit met de mogelijkheid om niet alleen de primaire kleur, maar ook de border-radius, font-keuzes, en accentkleuren aan te passen voor een nog persoonlijkere interface.", completed: false },
      { id: 6011, title: "Taken Archiveren", description: "Voeg een 'Archiveer' actie toe aan taken. Gearchiveerde taken zijn verborgen van de standaard weergaven maar blijven doorzoekbaar en kunnen worden hersteld, wat helpt om het bord schoon te houden zonder dataverlies.", completed: true },
      { id: 6012, title: "Multi-select in Dropdowns", description: "Update de dropdown-componenten voor het toewijzen van gebruikers en labels om multi-select mogelijk te maken met checkboxes, wat het beheren van taken met meerdere toegewezenen of labels versnelt.", completed: false },
      { id: 6013, title: "Recente Activiteit op Dashboard", description: "Voeg een 'Mijn Recente Activiteit' widget toe aan het aanpasbare dashboard, waarin de laatste 5-10 taken die de gebruiker heeft bewerkt, becommentarieerd of voltooid, worden getoond voor snelle navigatie.", completed: false },
      { id: 6014, title: "Taken Prullenbak", description: "Implementeer een 'prullenbak'-systeem. Verwijderde taken gaan eerst naar de prullenbak en worden pas na 30 dagen permanent verwijderd, wat bescherming biedt tegen per ongeluk verwijderen.", completed: false },
      { id: 6015, title: "Checklist Templates", description: "Maak het mogelijk om een set van subtaken op te slaan als een 'checklist template'. Deze templates kunnen vervolgens met één klik worden ingevoegd in elke taak, ideaal voor terugkerende processen zoals 'Bug Report Analyse' of 'Nieuwe Medewerker Onboarding'.", completed: false }
    ]
  };
