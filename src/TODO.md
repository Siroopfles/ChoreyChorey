
- Implementeer een lichtgewicht `AdobeXdEmbed` component, vergelijkbaar met de Figma en Google Doc embeds.
- Integreer `axe-core` in de E2E (Cypress) test-suite om bij elke testrun automatisch op toegankelijkheidsproblemen te controleren.
- Voer een security-review uit op alle API-serializers in `api-serializers.ts` om te garanderen dat er geen gevoelige data wordt gelekt.
- Creëer een `useApi` hook die `try/catch` en `handleError` logica centraliseert, inclusief een 'retry' mechanisme voor consistente foutafhandeling.
- Voeg documentatie toe aan de 'Integraties'-pagina over hoe de `email-to-task` gateway kan worden geconfigureerd met een dienst als Mailgun.
