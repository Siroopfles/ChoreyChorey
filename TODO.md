# Chorey Applicatie: Verbeterpunten & TODO Lijst

Dit document is het resultaat van een uitgebreide review van de applicatie, getoetst aan de voltooide fases (1-5) van de roadmap. Het dient als een checklist voor toekomstige verbeteringen om de applicatie naar een nog hoger niveau te tillen.

---

## 🚀 Kritiek / Ontbrekende Features

Deze features zijn essentieel voor de volledige functionaliteit zoals beschreven in de roadmap, maar ontbreken momenteel in de UI.

-   **Eigen Velden (Custom Fields) Implementeren in Taakformulier**
    -   **Probleem:** De mogelijkheid om 'Custom Fields' te definiëren bestaat in de instellingen (Fase 5), maar er is geen manier om deze velden daadwerkelijk in te vullen bij het aanmaken of bewerken van een taak.
    -   **Actie:** Breid `task-form-fields.tsx` uit zodat de gedefinieerde custom fields (tekst, getal, datum, select) dynamisch worden gerenderd en de waarden kunnen worden opgeslagen in het `customFieldValues` object van een taak.

-   **Endorsements Systeem voor Vaardigheden**
    -   **Probleem:** De datastructuur voor 'endorsements' bestaat in `types.ts`, maar er is geen UI waarmee gebruikers de vaardigheden van een collega kunnen onderschrijven op diens profielpagina.
    -   **Actie:** Voeg op de gebruikersprofielpagina (`profile/[userId]/page.tsx`) een mechanisme toe (bv. een 'plus'-icoon naast elke skill) waarmee ingelogde gebruikers een skill van een collega kunnen 'endorsen'. Toon ook het aantal ontvangen endorsements per skill.

-   **Adobe XD Embed Component**
    -   **Probleem:** Er is een icoon voor Adobe XD, maar in tegenstelling tot Figma en Google Docs, is er geen `AdobeXdEmbed` component om een preview te tonen.
    -   **Actie:** Ontwikkel een `AdobeXdEmbed.tsx` component, vergelijkbaar met `FigmaEmbed.tsx`, om live previews van Adobe XD-bestanden weer te geven wanneer een geldige link wordt toegevoegd als bijlage.

---

## ✨ Verbeteringen & Gebruikerservaring

Verbeteringen die de applicatie consistenter, gebruiksvriendelijker en professioneler maken.

-   **AI Feedback Systeem Activeren & Consistentie**
    -   **Observatie:** De `submitAiFeedback` actie is geïmplementeerd, maar niet alle AI-suggestiecomponenten hebben de UI (duim omhoog/omlaag knoppen) consistent doorgevoerd.
    -   **Actie:** Loop alle componenten na die AI-suggesties tonen (prioriteit, labels, story points, toewijzer) en zorg ervoor dat ze *allemaal* de feedbackknoppen tonen. Maak hiervoor een herbruikbaar `AIFeedback` component.

-   **Verbeterde Drag & Drop Feedback**
    -   **Observatie:** De visuele feedback bij het slepen van een geblokkeerde taak naar een "verboden" kolom kan duidelijker.
    -   **Actie:** Implementeer de "niet-toegestaan" cursor (`cursor-not-allowed`) en een subtiele, rode gloed (`ring-2 ring-destructive`) over de betreffende kolom in `task-columns.tsx` wanneer een geblokkeerde taak wordt gesleept.

-   **Visuele Lege Staat voor Kanban-kolommen**
    -   **Observatie:** Lege kolommen op het kanbanbord tonen nu een simpele tekst.
    -   **Actie:** Verbeter de "lege staat" in `task-columns.tsx`. Toon een visueel aantrekkelijke "drop zone" met een gestippelde rand en een icoon die gebruikers uitnodigt om taken te verslepen.

-   **Zichtbare 'Toggle' Knop voor Sidebar**
    -   **Observatie:** De sidebar kan alleen met een sneltoets worden ingeklapt op desktop.
    -   **Actie:** Voeg een altijd zichtbare "toggle" knop (bv. met een `ChevronsLeft` icoon) toe in de header of footer van de sidebar in `dashboard/layout.tsx` om deze ook met de muis te kunnen bedienen.

-   **Herstelbare Foutmeldingen (Toasts)**
    -   **Observatie:** De `handleError` functie in `task-context.tsx` toont een 'Probeer opnieuw' knop, maar dit kan generieker worden toegepast.
    -   **Actie:** Overweeg een centrale `useApi` hook te creëren die `try/catch` en de `handleError` logica omvat, inclusief de `retryAction`. Refactor de server actions in `task-context.tsx` om deze hook te gebruiken voor een consistente foutafhandeling in de hele app.

---

## 🧹 Housekeeping & Technische Schulden

Opschonen van de codebase en voorbereiden op toekomstige schaalbaarheid.

-   **Opruimen van Verouderde Bestanden**
    -   **Observatie:** De bestanden `src/app/actions.ts` en `src/app/actions/ai.actions.ts` zijn gemarkeerd als 'deprecated'.
    -   **Actie:** Verwijder deze twee bestanden om de codebase schoon en overzichtelijk te houden.

-   **Documentatie voor Email-to-Task Gateway**
    -   **Observatie:** De `email-to-task-flow.ts` is functioneel, maar het is voor gebruikers onduidelijk hoe ze deze moeten gebruiken.
    -   **Actie:** Voeg een sectie toe aan de "Integraties" pagina in de instellingen die het e-mailformaat (`[taaknaam]-p-[projectId]-u-[userId]@in.chorey.app`) uitlegt en de stappen beschrijft om een inbound mail webhook (bv. via Mailgun of SendGrid) op te zetten.

-   **API Serializer Verfijning**
    -   **Observatie:** De API-serializers in `api-serializers.ts` zijn een goede start.
    -   **Actie:** Voer een security-review uit op alle serializers om te garanderen dat er geen onbedoelde gevoelige data (zoals `twoFactorSecret` of `permissionOverrides`) wordt gelekt via een van de publieke API-endpoints.

-   **Continue Toegankelijkheids-audit**
    -   **Observatie:** Er is een basis A11y-audit uitgevoerd.
    -   **Actie:** Integreer `axe-core` in de E2E (Cypress/Playwright) test-suite. Dit zorgt ervoor dat bij elke testrun automatisch op toegankelijkheidsproblemen wordt gecontroleerd.
