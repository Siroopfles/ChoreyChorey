# Chorey Applicatie: Verbeterpunten & TODO Lijst

Dit document dient als een strategische roadmap voor de verdere ontwikkeling van de applicatie. De focus ligt op het verfijnen van de architectuur, het verbeteren van de gebruikerservaring, en het implementeren van geavanceerde features.

---

### 🚀 Kritieke Features & UX Verbeteringen

- Implementeer een 'Endorsements' systeem op de gebruikersprofielpagina's.
- Voeg een `AdobeXdEmbed` component toe voor het insluiten van Adobe XD bestanden.
- Ontwikkel een herbruikbaar `AIFeedback` component om consistentie te waarborgen.
- Verbeter de 'lege staat' van de kanban-kolommen met een visuele 'drop zone'.
- Voeg een zichtbare 'toggle' knop toe aan de sidebar voor muisbediening.

### 🧹 Architectuur & Technische Schulden

- Refactor de `lib/types/types.ts` file naar kleinere, domein-specifieke typebestanden om de leesbaarheid en onderhoudbaarheid te verbeteren.
- Analyseer `src/app/actions/project/task.actions.ts` op mogelijke schendingen van het Single Responsibility Principle en splits de functionaliteit indien nodig op.
- Periodiek scannen op en het oplossen van circulaire afhankelijkheden tussen de core `context` providers en de `actions`.
- Evalueer de haalbaarheid van het implementeren van een WebSocket-verbinding voor hoog-frequente real-time updates (zoals live cursors) om het aantal Firestore `reads` te verminderen.
- Verfijn de offline PWA strategie voor robuustere offline bewerkingen en synchronisatie.

### 🧪 Testen & Kwaliteitsborging

- Integreer `axe-core` in de E2E (Cypress/Playwright) test-suite voor geautomatiseerde toegankelijkheidstesten.
- Zet een visuele regressietest-suite op met een tool als Chromatic of Percy om onbedoelde UI-wijzigingen te voorkomen.
- Definieer en implementeer een API-contract teststrategie (bv. met Pact) om de integriteit tussen frontend en backend te waarborgen.
- Ontwikkel een strategie en scripts voor het 'seeden' van de database met realistische data voor performance- en load-testing.

### 📚 Documentatie & Developer Experience

- Zet een openbare kennisbank op met gedetailleerde handleidingen voor eindgebruikers.
- Ontwikkel een interactieve documentatiesite voor de publieke API, inclusief een API Explorer (bv. Swagger UI).
- Publiceer een officiële, volledig getypeerde TypeScript/JS SDK als NPM-pakket voor de Chorey API.
- Zet een openbare statuspagina op om de uptime en status van de API en andere services te communiceren.

### ✨ Toekomstige Innovatie & AI

- Ontwikkel een AI-agent die een hoog-over doel kan omzetten in een volledig, gestructureerd projectplan.
- Implementeer een MLOps-pijplijn om de AI-modellen periodiek te finetunen op basis van geanonimiseerde gebruikersfeedback.
- Onderzoek en ontwikkel een AI-gestuurde 'Best Next Action' widget voor het dashboard.
- Ontwikkel een AI Kennismanager die de inhoud van de hele organisatie kan doorzoeken en vragen kan beantwoorden.
- Voer sentiment-analyse uit op commentaren om proactief potentiële frictie in teams te identificeren.
