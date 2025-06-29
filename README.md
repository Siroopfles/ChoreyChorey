
# Chorey: Het Intelligente Taakbeheer Systeem

**Chorey is een geavanceerd, AI-aangedreven taakbeheerplatform, ontworpen om de manier waarop teams en individuen samenwerken en productief zijn te transformeren.** Het combineert traditionele projectmanagement-tools met een krachtige, proactieve AI-assistent om workflows te stroomlijnen, beslissingen te ondersteunen en werk leuker te maken.

![Chorey Dashboard Screenshot](https://placehold.co/1200x600.png?text=Chorey+Dashboard)
*Een mockup van het Chorey dashboard.*

---

## Inhoudsopgave

- [Belangrijkste Kenmerken](#belangrijkste-kenmerken)
- [Tech Stack](#tech-stack)
- [Projectstructuur](#projectstructuur)
- [Aan de slag](#aan-de-slag)
  - [Vereisten](#vereisten)
  - [Installatie](#installatie)
  - [Omgevingsvariabelen](#omgevingsvariabelen)
- [Scripts](#beschikbare-scripts)
- [Kernconcepten](#kernconcepten)
- [Roadmap](#roadmap)

---

## Belangrijkste Kenmerken

Chorey is opgebouwd rond drie kernpilaren: krachtig taakbeheer, intelligente AI-assistentie en motiverende samenwerking.

### Kernfunctionaliteit

*   **Project & Taakbeheer:** Organiseer werk in projecten, taken en subtaken met een intuïtieve drag-and-drop interface.
*   **Flexibele Weergaven:** Wissel tussen een Kanban-bord, traditionele lijst, kalender en een Gantt-diagram.
*   **Geavanceerd Permissiesysteem (PRBAC):** Definieer rollen met fijnmazige permissies, zowel op organisatie- als op projectniveau.
*   **Aanpasbare Workflows:** Pas statussen, prioriteiten, labels en eigen velden volledig aan aan de behoeften van uw team.
*   **Templates & Automatiseringen:** Standaardiseer processen met taaktemplates en automatiseer repetitieve acties met een "Als dit, dan dat"-systeem.
*   **Integraties:** Naadloze koppelingen met GitHub, GitLab, Bitbucket, Jira, Slack, en meer.

### AI-Aangedreven Intelligentie

*   **Natuurlijke Taalverwerking:** Maak taken aan met simpele commando's zoals "Herinner me morgen om de planten water te geven".
*   **Slimme Suggesties:** Ontvang AI-voorstellen voor subtaken, story points, prioriteiten, labels en de meest geschikte persoon voor een taak.
*   **Voorspellende Analyse:** Krijg inzicht in de waarschijnlijke uitkomst van projecten en het risico op burn-out binnen het team.
*   **Generatieve AI:** Genereer automatisch unieke avatars voor gebruikers en relevante omslagfoto's voor taken.

### Samenwerking & Gamification

*   **Team Management:** Creëer teams, wijs taken toe en krijg inzicht in de werkdruk en het welzijn van het team.
*   **Gamification:** Verdien punten, ontgrendel prestatie-badges en beklim het scorebord. Gebruik verdiende punten in de winkel om de interface aan te passen.
*   **Sociale Functies:** Geef 'Kudos' aan teamgenoten, reageer op taken en werk samen in de 'Team Room'.
*   **Doelen & Uitdagingen:** Stel persoonlijke doelen of team-brede uitdagingen in om de motivatie te verhogen.

---

## Tech Stack

Chorey is gebouwd met een moderne, robuuste en schaalbare tech stack:

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Taal:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Componenten:** [ShadCN UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **AI & Machine Learning:** [Google Genkit](https://firebase.google.com/docs/genkit)
*   **State Management:** React Context API
*   **Formulieren:** [React Hook Form](https://react-hook-form.com/) met [Zod](https://zod.dev/) voor validatie

---

## Projectstructuur

De codebase is georganiseerd om schaalbaarheid en onderhoudbaarheid te maximaliseren:

```
src
├── app/                  # Next.js App Router: alle pagina's en API-routes
│   ├── (auth)/           # Routes die geen authenticatie vereisen (login, signup)
│   ├── dashboard/        # Beveiligde dashboard-pagina's
│   ├── api/              # API-routes voor externe integraties
│   └── actions/          # Server Actions voor data-mutaties
├── ai/                   # Alle Genkit AI-gerelateerde logica
│   ├── flows/            # Definities van AI-flows
│   ├── prompts/          # Handlebars prompt-templates
│   └── tools/            # Functies die de AI kan aanroepen
├── components/           # Herbruikbare React-componenten
│   ├── chorey/           # Applicatie-specifieke componenten
│   └── ui/               # Algemene UI-componenten (ShadCN)
├── contexts/             # React Context providers voor global state
├── hooks/                # Aangepaste React hooks
└── lib/                  # Kernlogica, types, en utilities
```

---

## Aan de slag

Volg deze stappen om het project lokaal op te zetten.

### Vereisten

*   [Node.js](https://nodejs.org/) (versie 18 of hoger)
*   `npm` of `yarn`
*   Een [Firebase-project](https://console.firebase.google.com/) met de volgende services ingeschakeld:
    *   Authentication (met E-mail/Wachtwoord en Google providers)
    *   Firestore Database
    *   Storage

### Installatie

1.  **Kloon de repository:**
    ```bash
    git clone https://github.com/your-username/chorey.git
    cd chorey
    ```

2.  **Installeer de dependencies:**
    ```bash
    npm install
    ```

### Omgevingsvariabelen

1.  Maak een nieuw bestand aan in de root van het project genaamd `.env.local`.
2.  Kopieer de inhoud van `workspace/.env` (of een vergelijkbaar voorbeeld) naar `.env.local`.
3.  Vul de Firebase-configuratiesleutels van je eigen Firebase-project in:

    ```env
    # Firebase (Public)
    NEXT_PUBLIC_FIREBASE_API_KEY=AIz...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...
    ```
4.  (Optioneel) Voeg API-sleutels voor externe integraties (Google, Microsoft, GitHub, etc.) toe om deze functies te activeren.

---

## Beschikbare Scripts

*   **`npm run dev`**: Start de Next.js development server.
*   **`npm run build`**: Maakt een productie-build van de applicatie.
*   **`npm run start`**: Start de productie-server.
*   **`npm run lint`**: Voert de linter uit om codekwaliteit te controleren.
*   **`npm run typecheck`**: Voert de TypeScript-compiler uit om typefouten te controleren.

---

## Kernconcepten

*   **Server Actions:** De meeste data-mutaties (aanmaken, bijwerken, verwijderen) worden afgehandeld door Next.js Server Actions. Dit zorgt voor een veilige en efficiënte communicatie met de database zonder de noodzaak voor traditionele API-endpoints.
*   **Real-time via Context:** De applicatie maakt intensief gebruik van de React Context API in combinatie met `onSnapshot` listeners van Firestore. Dit zorgt ervoor dat alle data (taken, projecten, gebruikers) in de gehele applicatie real-time up-to-date is.
*   **Permissiebeheer:** Het Project-Based Role-Based Access Control (PRBAC) systeem is een kernonderdeel. De `hasPermission` helper-functie (`src/lib/permissions.ts`) is de centrale plek waar alle permissiechecks worden uitgevoerd, rekening houdend met zowel organisatie-rollen als project-specifieke rollen.

---

## Roadmap

Benieuwd naar wat er komen gaat? Bekijk onze [openbare roadmap](/roadmap) om te zien welke features we hebben gebouwd en wat de toekomstplannen zijn.
