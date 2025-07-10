# Chorey Applicatie: Definitieve Verbeterpuntenlijst

Dit document bevat een uitgebreide lijst van alle geïdentificeerde verbeterpunten om de applicatie naar een productieklaar, schaalbaar en toekomstbestendig niveau te tillen.

---

### **Architectuur & Prestaties**

-   [ ] **Denormaliseer Project- & Gebruikersnamen:** Om complexe client-side joins te vermijden, voeg `projectName` en `assigneeNames` direct toe aan het taakdocument in Firestore. Update deze via een Cloud Function wanneer een project- of gebruikersnaam wijzigt.
-   [ ] **Server-side Filtering & Paginering:** Implementeer server-side filtering en paginering voor de takenlijst om de initiële data-load voor grote organisaties drastisch te verminderen.
-   [ ] **Optimaliseer `onSnapshot` Listeners:** Analyseer het aantal actieve listeners en implementeer strategieën om dit te verminderen, bijvoorbeeld door alleen te luisteren naar wijzigingen binnen de gefilterde view.
-   [ ] **Bundel Grootte Analyse:** Integreer `@next/bundle-analyzer` om de JavaScript-bundelgrootte te inspecteren en onnodige of grote dependencies te identificeren en te verwijderen.
-   [ ] **Atomiciteit met Transacties:** Herschrijf kritieke acties (zoals het toekennen van punten en prestaties) om Firestore Transacties te gebruiken, wat de dataconsistentie onder hoge belasting garandeert.

---

### **Gebruikerservaring (UX) & Interface (UI)**

-   [ ] **Niet-destructieve AI Suggesties:** Pas de UI aan zodat AI-suggesties (voor Story Points, Prioriteit, etc.) naast het invoerveld verschijnen met een 'Toepassen' knop, in plaats van de gebruikersinvoer direct te overschrijven.
-   [ ] **Uniformeer Selectiecomponenten:** Standaardiseer het gebruik van `Popover` met `Command` voor alle multi-select en zoekbare dropdowns (labels, gebruikers) voor een consistente ervaring.
-   [ ] **Lege Toestand (Empty State) Verbeteringen:** Voeg meer contextuele en behulpzame 'empty states' toe aan pagina's zoals het Kanbanbord, met illustraties en een duidelijke call-to-action (bv. 'Maak je eerste taak aan').
-   [ ] **Sleepbare Kolommen:** Maak de kolommen op het Kanbanbord zelf versleepbaar, zodat beheerders de workflow-volgorde direct vanuit de UI kunnen aanpassen.
-   [ ] **Geavanceerde Zoekbalk:** Implementeer een geavanceerde zoekmodus met ondersteuning voor booleaanse operatoren (bv. `status:open AND (label:bug OR priority:urgent)`).
-   [ ] **Confetti bij Taakvoltooiing:** Voeg een optionele (en uitschakelbare) confetti-animatie toe wanneer een gebruiker een taak als 'voltooid' markeert voor positieve bekrachtiging.

---

### **Codekwaliteit & Onderhoudbaarheid**

-   [ ] **Elimineer "Magic Strings":** Vervang hardgecodeerde strings zoals statussen ('Voltooid') en rollen ('Owner') door geïmporteerde constanten uit een centraal `constants.ts` bestand.
-   [ ] **Refactor Selectiecomponenten:** Creëer een generieke, herbruikbare `MultiSelectComboBox` component om de code-duplicatie in de `TaskFormDetails` voor het selecteren van gebruikers en labels te verminderen.
-   [ ] **Verbeterde Error Handling in Forms:** Zorg ervoor dat de `isSubmitting` staat in alle formulieren correct wordt gereset binnen een `finally`-blok na een server-actie, zodat de gebruiker het opnieuw kan proberen na een fout.
-   [ ] **Typografie Consistentie:** Definieer een `prose` style-configuratie in `tailwind.config.ts` om de weergave van de Rich Text Editor-inhoud overal in de applicatie te standaardiseren.

---

### **Testen & Betrouwbaarheid**

-   [ ] **Dynamische Testdata voor E2E-tests:** Pas de Cypress E2E-tests aan zodat ze programmatisch een nieuwe testgebruiker en de benodigde testdata aanmaken via het `seed`-script of API-calls. Dit maakt de tests volledig onafhankelijk en betrouwbaar.
-   [ ] **Toegankelijkheid (A11y) Verbeteringen:** Voeg specifieke `aria-label` attributen toe aan alle icon-only knoppen en interactieve elementen die geen tekst bevatten voor een betere screenreader-ervaring.
-   [ ] **Visuele Regressietesten:** Implementeer een tool zoals Chromatic of Percy, geïntegreerd met Storybook, om onbedoelde visuele wijzigingen in UI-componenten automatisch te detecteren.

---

### **Functionaliteit & Features**

-   [ ] **"Bekeken door..." Indicator:** Toon de avatars van gebruikers die een taak recentelijk hebben bekeken in de taakdetails, wat de transparantie verhoogt.
-   [ ] **Notificatie Snoozen:** Voeg de optie toe om notificaties in de inbox te snoozen voor een bepaalde tijd (bv. 1 uur, tot morgen).
-   [ ] **Organisatie-specifieke Emoji's:** Sta beheerders toe om een set van custom emoji's te uploaden die beschikbaar zijn in de emoji-reacties op commentaar.
-   [ ] **"Hulp Gezocht" Feature:** Voeg een knop toe aan taken waarmee een gebruiker kan aangeven hulp nodig te hebben. Dit markeert de taak met een speciaal icoon en plaatst deze in een aparte 'Hulp Gezocht'-weergave op het dashboard.
