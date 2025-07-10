# Chorey Applicatie: Verbeterpunten & TODO Lijst

Dit document dient als een strategische roadmap voor de verdere ontwikkeling van de applicatie. De focus ligt op het verfijnen van de architectuur, het verbeteren van de gebruikerservaring, en het implementeren van geavanceerde features.

### 🚀 Kritieke Features & UX Verbeteringen

Alle kritieke features en UX verbeteringen die initieel gepland waren voor deze ontwikkelingsfase zijn nu succesvol geïmplementeerd. De focus verschuift nu naar de volgende grote ontwikkelingscycli zoals beschreven in de roadmap.

### 🧹 Architectuur & Technische Schulden

-   **Circulaire Afhankelijkheden Oplossen:** Voer een diepgaande analyse uit (bv. met `madge`) om circulaire afhankelijkheden tussen de core `context` providers en de `actions` te identificeren en op te lossen.
-   **WebSocket Implementatie Evalueren:** Onderzoek de haalbaarheid en voordelen van het implementeren van een WebSocket-verbinding (bv. via `socket.io` of `Ably`) voor hoog-frequente real-time updates (zoals live cursors en 'typing' indicatoren) om het aantal Firestore `reads` te verminderen.
-   **Offline Strategie Verfijnen:** Breid de PWA offline strategie uit met `workbox` voor robuustere offline bewerkingen, achtergrondsynchronisatie en een duidelijke offline-indicator in de UI.

### 🧪 Testen & Kwaliteitsborging

-   **Visuele Regressietest-suite Opzetten:** Integreer een tool als `Chromatic` of `Percy` met Storybook om onbedoelde UI-wijzigingen bij component-updates te voorkomen.
-   **API Contract Testen:** Implementeer een API-contract teststrategie (bv. met `Pact`) om de integriteit tussen de frontend en de API-endpoints te waarborgen, vooral na wijzigingen in de serializers.
-   **Database Seeding Strategie:** Ontwikkel scripts voor het 'seeden' van de database met grote hoeveelheden realistische data voor het uitvoeren van betrouwbare performance- en load-tests.

### 📚 Documentatie & Developer Experience

-   **Openbare Kennisbank Opzetten:** Creëer een `help.chorey.app` subdomein met gedetailleerde handleidingen en video-tutorials voor eindgebruikers.
-   **Interactieve API Documentatie:** Publiceer een `docs.chorey.app` site met een interactieve API Explorer (bv. Swagger UI of Redoc) voor de publieke API.
-   **Officiële TypeScript/JS SDK:** Ontwikkel en publiceer een officieel, volledig getypeerd TypeScript/JS SDK als NPM-pakket om de Chorey API te gebruiken.
-   **Openbare Statuspagina:** Implementeer een statuspagina die de uptime en de status van de API en andere kritieke services communiceert.

### ✨ Toekomstige Innovatie & AI

-   **AI 'Goal-to-Project' Agent:** Ontwikkel een AI-agent die een hoog-over bedrijfsdoel kan omzetten in een volledig, gestructureerd projectplan, inclusief taken, subtaken en afhankelijkheden.
-   **MLOps Pijplijn:** Implementeer een MLOps-pijplijn (bv. met Vertex AI) om de AI-modellen periodiek en automatisch te finetunen op basis van geanonimiseerde gebruikersfeedback.
-   **AI 'Best Next Action' Widget:** Onderzoek en ontwikkel een AI-gestuurde 'Best Next Action' widget voor het dashboard die de gebruiker de meest logische volgende taak voorstelt.
-   **AI Kennismanager:** Ontwikkel een AI die de inhoud van de hele organisatie kan doorzoeken (taken, comments, documenten) en natuurlijke taalvragen kan beantwoorden ('Wat hebben we besloten over X?').
-   **Sentiment Analyse:** Voer sentiment-analyse uit op commentaren om proactief potentiële frictie in teams te identificeren en managers te waarschuwen.
