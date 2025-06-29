# Chorey Applicatie: Code Review & Verbeteringschecklist

Dit document bevat een gedetailleerde analyse van de codebase en een checklist met concrete verbeterpunten. Het doel is om de kwaliteit, onderhoudbaarheid, prestaties en schaalbaarheid van de applicatie op lange termijn te waarborgen.

---

## 1. Architectuur & Structuur

### 1.1. Context Splitting (State Management)
- **Observatie:** De `AuthProvider` en `TaskProvider` zijn uitgegroeid tot zeer grote, monolithische contexts die een breed scala aan ongerelateerde state en functies beheren (bv. `AuthProvider` beheert authenticatie, organisaties, projecten, teams en gebruikers).
- **Probleem:** Dit leidt tot "prop drilling" en onnodige re-renders. Een component dat alleen de `currentUserRole` nodig heeft, zal opnieuw renderen als de lijst met `projects` verandert. Dit schendt het 'separation of concerns'-principe.
- **Actie:** Overweeg om de contexts op te splitsen in meer gespecialiseerde providers.
    - `OrganizationProvider`: Beheert `currentOrganization`, `projects`, `teams`, en `users`.
    - `NotificationsProvider`: Isoleert de logica voor notificaties en geluiden.
    - `FiltersProvider`: Centraliseert de state en logica voor `searchTerm`, `filters`, en `selectedTaskIds`.

### 1.2. Consistentie in Server Acties
- **Observatie:** De structuur van de server-acties in `src/app/actions` is sterk verbeterd, maar kan verder worden gestandaardiseerd.
- **Probleem:** Sommige acties retourneren een `{ success, error }` object, terwijl andere direct data retourneren of een error gooien. Dit maakt de error-handling aan de client-zijde inconsistent.
- **Actie:** Implementeer een gestandaardiseerd response-formaat voor alle server-acties, bijvoorbeeld: `Promise<{ data: T | null; error: string | null; }`. Dit maakt de aanroepende code voorspelbaarder en robuuster.

### 1.3. Hardgecodeerde Configuratie in UI
- **Observatie:** Configuratie zoals `STATUS_COLORS` en `PRIORITY_CONFIG` staat hardgecodeerd in UI-componenten.
- **Probleem:** Als een organisatie de naam van een status aanpast (bv. van "In Review" naar "QA"), werkt de kleurcode niet meer. De UI is te strak gekoppeld aan specifieke string-waarden.
- **Actie:** Maak de workflow-visualisaties datagedreven. De configuratie voor statussen (inclusief kleur) moet uit de organisatie-instellingen komen, zodat de UI zich dynamisch aanpast aan de workflow van de gebruiker.

---

## 2. Prestaties & Optimalisatie

### 2.1. Paginering van Data
- **Observatie:** De applicatie laadt momenteel *alle* taken en projecten voor een organisatie in één keer.
- **Probleem:** Dit is niet schaalbaar. Een organisatie met duizenden taken zal een extreem lange laadtijd en een trage UI ervaren.
- **Actie:** Implementeer paginering voor alle belangrijke data-collecties.
    - Gebruik Firestore's `limit()` en `startAfter()` voor "infinite scrolling" op het kanbanbord en in de lijstweergaves.
    - Pas de AI-tools en rapportages aan zodat ze kunnen werken met gepagineerde of gestreamde data.

### 2.2. Optimalisatie van Afbeeldingen
- **Observatie:** De AI-gegenereerde avatars en taakafbeeldingen zijn grote, ongecomprimeerde Base64 data-URI's die direct in Firestore worden opgeslagen.
- **Probleem:** Dit leidt tot zeer grote documentgroottes, wat de kosten verhoogt en het ophalen van data vertraagt. Het laden van deze afbeeldingen in de UI is inefficiënt.
- **Actie:** Implementeer een image processing pipeline.
    - In plaats van Base64, sla de afbeeldingen op in Firebase Storage.
    - Gebruik een Cloud Function (getriggerd bij het uploaden) om de afbeeldingen automatisch te resizen en te converteren naar een modern, gecomprimeerd formaat zoals WebP.
    - Sla alleen de uiteindelijke Storage URL op in Firestore.

### 2.3. Optimistic UI Updates
- **Observatie:** De meeste UI-updates (bv. een subtaak afvinken, een taak verslepen) wachten op de bevestiging van de server-actie voordat de UI wordt bijgewerkt.
- **Probleem:** Dit introduceert een waarneembare vertraging, waardoor de applicatie minder responsief aanvoelt.
- **Actie:** Implementeer optimistische updates voor veelvoorkomende, laag-risico acties.
    - Werk de UI *direct* bij.
    - Voer de server-actie op de achtergrond uit.
    - Als de actie faalt, rol de UI-wijziging terug en toon een foutmelding. Dit verbetert de waargenomen prestaties aanzienlijk.

---

## 3. Gebruikerservaring (UX) & UI

### 3.1. Granulaire Laad- en Lege Staten
- **Observatie:** De applicatie toont vaak één grote lader voor een hele pagina.
- **Probleem:** Dit geeft de gebruiker weinig feedback over wat er precies wordt geladen.
- **Actie:** Implementeer meer "component-level" loading states. Gebruik skeletons voor individuele kaarten en widgets. Zorg er ook voor dat elke lijst en grafiek een duidelijke en informatieve "lege staat" heeft (bv. "Geen taken met de huidige filters").

### 3.2. Verbeterde Foutafhandeling
- **Observatie:** Foutmeldingen zijn functioneel, maar kunnen gebruiksvriendelijker.
- **Probleem:** Een generieke "Er is een fout opgetreden" melding geeft de gebruiker weinig context.
- **Actie:** Implementeer een meer gedetailleerd foutmeldingssysteem. Geef waar mogelijk de oorzaak van de fout aan en bied een concrete vervolgstap of een "probeer opnieuw"-knop.

### 3.3. Consistentie in Dialogen
- **Observatie:** Er zijn verschillende stijlen voor het openen en sluiten van dialogen (modals).
- **Probleem:** Sommige dialogen gebruiken een `DialogClose`-knop, andere een `Button` met een `onClick` handler. Dit is inconsistent.
- **Actie:** Standaardiseer het gebruik van de `<DialogClose asChild>` component voor alle 'Annuleren' of 'Sluiten' knoppen voor een consistente en voorspelbare werking.

---

## 4. Code Kwaliteit & Best Practices

### 4.1. Centralisatie van Constanten
- **Observatie:** "Magic strings" zoals statusnamen, rollen (`'Owner'`), en gebruikers-ID's (`'system'`) worden op meerdere plaatsen in de code herhaald.
- **Probleem:** Dit is foutgevoelig. Een typefout of een wijziging in een constante vereist aanpassingen op veel verschillende plekken.
- **Actie:** Creëer een centraal `constants.ts` bestand in de `lib` directory. Definieer hier alle gedeelde constanten en importeer ze waar nodig.

### 4.2. Striktere TypeScript Typing
- **Observatie:** Op sommige plekken wordt nog gebruik gemaakt van `any`, met name in de configuratie van widgets en de payload van webhooks.
- **Probleem:** Dit ondermijnt de voordelen van TypeScript, zoals type-veiligheid en auto-aanvulling.
- **Actie:** Creëer robuuste, specifieke Zod-schemas voor elke widget-configuratie. Gebruik `z.discriminatedUnion` om de `WidgetInstance` type-veilig te maken, zodat de configuratie automatisch wordt gevalideerd op basis van het widget-type.

### 4.3. Omgevingsvariabelen Valideren
- **Observatie:** De applicatie leest direct uit `process.env` op veel verschillende plekken.
- **Probleem:** Als een omgevingsvariabele ontbreekt, kan dit leiden tot onverwachte fouten diep in de applicatie.
- **Actie:** Implementeer een validatieschema (bv. met Zod) voor alle omgevingsvariabelen bij het opstarten van de applicatie. Dit zorgt ervoor dat de applicatie niet start als de configuratie onvolledig is, wat problemen vroegtijdig aan het licht brengt.

---

## 5. AI & Genkit Implementatie

### 5.1. Prompt Management
- **Observatie:** Alle Genkit prompts zijn momenteel hardgecodeerde template-strings binnen de `definePrompt` aanroep.
- **Probleem:** Dit maakt het aanpassen van prompts, het experimenteren met verschillende versies, of het implementeren van meertaligheid omslachtig.
- **Actie:** Overweeg om de prompts te externaliseren naar aparte `.txt` of `.md` bestanden en deze in te laden in de flow. Dit maakt het prompt-engineering proces los van de applicatielogica.

### 5.2. Gestandaardiseerde AI Tools
- **Observatie:** Het `task-tools.ts` bestand groeit en bevat tools voor zowel taken als gebruikers.
- **Probleem:** Naarmate er meer tools worden toegevoegd, wordt dit bestand onoverzichtelijk.
- **Actie:** Splits de AI-tools op per domein, vergelijkbaar met de server-acties (bv. `task-tools.ts`, `user-tools.ts`, `project-tools.ts`). Dit verbetert de organisatie.
