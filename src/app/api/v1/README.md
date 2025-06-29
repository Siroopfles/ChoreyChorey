# Chorey API v1

Welkom bij de v1 API voor Chorey. Deze API stelt ontwikkelaars in staat om programmatisch te interacteren met de data van hun organisatie.

## Basisprincipes

### Authenticatie

Alle API-verzoeken moeten worden geauthenticeerd met een API-sleutel. U kunt een sleutel genereren in de 'Developer Instellingen' van uw organisatie. De sleutel moet worden meegestuurd in de `Authorization`-header van elk verzoek.

Het formaat is: `Authorization: Bearer chorey_sk_...`

**Voorbeeld:**
```bash
curl "https://<your-app-url>/api/v1/tasks" \
  -H "Authorization: Bearer <uw_api_sleutel>"
```

### Versioning

De API-versie wordt aangegeven in het URL-pad. De huidige en stabiele versie is `v1`. Toekomstige versies met breaking changes zullen worden uitgebracht onder een nieuw versiepad (bv. `/api/v2`).

### Permissies

Elke API-sleutel heeft een set van permissies die bepalen tot welke endpoints en acties de sleutel toegang heeft. Bijvoorbeeld, een sleutel met alleen `read:tasks` permissie kan taken ophalen, maar niet aanmaken of verwijderen. Deze permissies worden ingesteld bij het aanmaken van de sleutel.

### Data Formaat

De API communiceert via JSON. Alle `POST` en `PUT` verzoeken moeten een `Content-Type: application/json` header bevatten en een geldige JSON-body.

## Endpoints

De API biedt endpoints voor de belangrijkste resources, zoals:

-   `/tasks`
-   `/projects`
-   `/users`
-   `/teams`

Raadpleeg de volledige, toekomstige API-documentatie voor details over elk endpoint, inclusief de beschikbare parameters en response-objecten.
