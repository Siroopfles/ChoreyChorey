# Chorey Applicatie: Checklist voor Kwaliteitsborging v1.0-RC

Na een succesvolle refactoring-fase, richt deze checklist zich op de laatste cruciale verbeteringen om de applicatie "productie-klaar" te maken. Dit is de 'polish'-fase die zorgt voor een uitzonderlijke gebruikerservaring en een waterdichte codebase voordat we beginnen aan de uitbreidingen van de roadmap (Fase 6 en verder).

---

## Fase 5.5: Verfijning & Kwaliteitsborging

**Focus:** De scherpe randjes van de bestaande features afhalen. De focus ligt op consistentie, robuustheid en het perfectioneren van de gebruikerservaring.

-   **Actie: AI Feedback Systeem Activeren:** Implementeer de UI (duim omhoog/omlaag knoppen) voor de `submitAiFeedback` actie bij *elke* AI-suggestie. Dit is cruciaal voor het trainen en verbeteren van de modellen in de toekomst.
-   **Actie: Verbeterde Drag & Drop Feedback:** Geef duidelijke visuele feedback wanneer een taak *niet* naar een kolom gesleept kan worden (bv. een geblokkeerde taak naar "In Uitvoering"). Toon een "niet-toegestaan" cursor en een subtiele, rode gloed over de betreffende kolom.
-   **Actie: Consistentie in AI-suggesties:** Zorg ervoor dat *alle* AI-suggestiecomponenten (prioriteit, labels, story points, toewijzer) een consistente layout en gebruikerservaring hebben, inclusief de feedbackknoppen.
-   **Actie: Verfijning Sidebar Interactie:** Voeg een altijd zichtbare "toggle" knop toe aan de sidebar op desktop, zodat deze ook met de muis kan worden ingeklapt, niet alleen met de `Cmd/Ctrl+B` sneltoets.
-   **Actie: Opruimen van Verouderde Bestanden:** Verwijder de "deprecated" bestanden `src/app/actions.ts` en `src/app/actions/ai.actions.ts` om de codebase schoon en overzichtelijk te houden.
-   **Actie: Optimalisatie `tailwind.config.ts`:** Breid het `fontFamily` object in de Tailwind-config uit zodat de custom fonts (`--font-body`, `--font-headline`) die in de puntenwinkel gekocht kunnen worden, ook daadwerkelijk worden toegepast op de juiste elementen.
-   **Actie: Lege Kanban-kolommen:** Verbeter de "lege staat" van de kolommen op het kanbanbord. In plaats van simpele tekst, toon een visueel aantrekkelijke "drop zone" met een icoon die gebruikers uitnodigt om taken te verslepen.
-   **Actie: API Documentatie & Serializers:** Schrijf een `README.md` voor de `src/app/api/v1` map waarin de basisprincipes van de API (authenticatie, versioning) worden uitgelegd. Verfijn de API-serializers om te garanderen dat er geen onbedoelde data wordt gelekt (bv. `twoFactorSecret`).
-   **Actie: Herstelbare Foutmeldingen (Toasts):** Voeg een "Probeer opnieuw" knop toe aan `toast`-meldingen voor netwerkgerelateerde fouten (bv. Firestore offline), zodat de gebruiker de mislukte actie direct opnieuw kan proberen zonder de UI te hoeven verversen.
-   **Actie: Animatie Snelheid Toepassen**: Implementeer de `var(--animation-speed-modifier)` in de `tailwind.config.ts` voor alle `animate-*` en `transition-*` properties om de door de gebruiker ingestelde animatiesnelheid te respecteren.
-   **Actie: Verbeterde Gebruikersprofiel Pagina:** De profielpagina is informatief, maar kan visueel aantrekkelijker worden gemaakt. Overweeg een layout met twee kolommen, waarbij statistieken en prestaties meer prominent worden weergegeven.
-   **Actie: Consistentie in 'Loading' en 'Empty' States:** Loop alle data-afhankelijke componenten na en zorg ervoor dat ze *allemaal* een consistente skeleton loader en een informatieve lege staat hebben.
-   **Actie: Optimaliseren van Firestore Listeners:** Analyseer het aantal actieve `onSnapshot` listeners. Overweeg om listeners te detachen wanneer componenten unmounten en waar mogelijk data te delen via context in plaats van dat elk component zijn eigen listener opent.
-   **Actie: Code Review op Zelfgehoste Fonts:** De `tailwind.config.ts` refereert naar custom fonts zoals `Source_Sans_3` en `Roboto_Mono` via CSS variabelen. Zorg ervoor dat deze fonts ook daadwerkelijk in het project zijn opgenomen (bv. via `@font-face` in `globals.css`) en correct worden geladen.
-   **Actie: Volledige Toegankelijkheids-audit (A11y):** Voer een volledige audit uit met een tool als `axe-core` en handmatige toetsenbordnavigatie om te garanderen dat de applicatie volledig toegankelijk is, met name de complexe drag-and-drop en dialoog-interacties.

---
*Na het afronden van deze checklist is de applicatie klaar voor de volgende functionele uitbreidingen zoals beschreven in de roadmap (Fase 6 e.v.).*
