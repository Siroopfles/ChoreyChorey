import type { Phase } from '../types';

export const phase1: Phase = {
  name: "Fase 1: Fundament & MVP (Voltooid)",
  description: "De essentiële bouwstenen van Chorey. Deze fase richtte zich op het creëren van een robuust en betrouwbaar taakbeheersysteem als solide basis voor alle toekomstige innovatie.",
  features: [
    { id: 1001, title: "Taakbeheer", description: "De kernfunctionaliteit: het aanmaken, bewerken en verwijderen van taken. Implementatie van taakeigenschappen zoals titel, omschrijving, status, prioriteit, en einddatum. Inclusief configureerbare statussen en de mogelijkheid om taken op te delen in subtaken.", completed: true },
    { id: 1002, title: "Project & Team Management", description: "Organiseer werk door taken te groeperen in projecten. Maak teams aan en wijs taken toe aan een volledig team in plaats van alleen aan individuen.", completed: true },
    { id: 1003, title: "Rollen & Rechtenbeheer (RBAC)", description: "Een flexibel permissiesysteem. Definieer rollen (Eigenaar, Beheerder, Lid) met specifieke, aanpasbare permissies om de toegang en mogelijkheden binnen de organisatie te beheren.", completed: true },
    { id: 1004, title: "Taaktemplates", description: "Bespaar tijd door veelvoorkomende taken op te slaan als templates. Deze templates kunnen direct worden gebruikt om nieuwe taken aan te maken met vooraf ingevulde gegevens.", completed: true },
    { id: 1005, title: "Bestands- & Linkbijlagen", description: "Voeg relevante context toe aan taken door externe URL's als bijlage te koppelen. Ondersteuning voor het insluiten van previews van populaire diensten zoals Figma.", completed: true },
    { id: 1006, title: "Persoonlijke & Gevoelige Taken", description: "Markeer taken als 'privé' zodat alleen de maker en de toegewezenen ze kunnen zien. Gevoelige taken zijn alleen zichtbaar voor gebruikers met de juiste permissies, wat de vertrouwelijkheid waarborgt.", completed: true },
    { id: 1007, title: "Volledige Taakgeschiedenis", description: "Een onveranderlijk en gedetailleerd logboek van alle wijzigingen die aan een taak zijn gemaakt, van statusupdates tot commentaar, voor volledige traceerbaarheid.", completed: true },
    { id: 1008, title: "Taak Acties", description: "Functionaliteit om taken efficiënt te beheren, inclusief het dupliceren (klonen) van een taak of het opsplitsen van een complexe taak in twee aparte taken op basis van de subtaken.", completed: true },
    { id: 1009, title: "Bulk Taakbewerkingen", description: "Selecteer meerdere taken tegelijk op het kanbanbord en pas in één keer de status, toegewezen persoon, project of labels aan via de bulk-actie balk.", completed: true },
    { id: 1010, title: "Drag & Drop Ordening", description: "Versleep taken intuïtief om de volgorde binnen een statuskolom aan te passen. Deze volgorde wordt opgeslagen en gesynchroniseerd voor alle gebruikers.", completed: true },
    { id: 1011, title: "Rich Text Editor", description: "Gebruik opmaakmogelijkheden zoals vet, cursief, en geordende/ongeordende lijsten in taakbeschrijvingen en reacties voor duidelijkere communicatie.", completed: true },
    { id: 1012, title: "Flexibele Views", description: "Bekijk taken op de manier die het beste bij je workflow past. Wissel eenvoudig tussen een Kanban-bord, een traditionele lijst, en een kalenderweergave.", completed: true },
    { id: 1013, title: "Zoeken & Filteren", description: "Vind snel taken terug met de zoekbalk. Gebruik de filterbalk om taken te filteren op toegewezen persoon, project, labels en prioriteit. Sla complexe filtersets op voor later gebruik.", completed: true },
    { id: 1014, title: "Keyboard Shortcuts & Command Palette", description: "Bedien de applicatie als een pro met sneltoetsen. Gebruik de Command Palette (Cmd/Ctrl+K) om snel een nieuwe taak aan te maken.", completed: true },
    { id: 1015, title: "Authenticatie & Beveiliging", description: "Veilig inloggen via e-mail/wachtwoord, Google en Microsoft. Voeg een extra beveiligingslaag toe met Two-Factor Authentication (2FA) via een authenticator-app.", completed: true },
    { id: 1016, title: "Sessiebeheer", description: "Gebruikers kunnen hun actieve login-sessies op verschillende apparaten bekijken en op afstand beëindigen voor extra veiligheid.", completed: true },
    { id: 1017, title: "Data Import & Export (CSV)", description: "Importeer taken in bulk vanuit een CSV-bestand via een intuïtieve kolom-mapping interface. Exporteer de huidige weergave van taken ook naar een CSV-bestand.", completed: true },
    { id: 1018, title: "Audit Log voor Organisatie", description: "Een centraal, onveranderlijk overzicht van alle belangrijke acties die binnen de organisatie plaatsvinden, toegankelijk voor beheerders.", completed: true },
  ]
};
