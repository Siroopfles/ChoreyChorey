import type { Phase } from '../types';

export const phase13: Phase = {
  name: "Fase 13: Geavanceerde Enterprise Beveiliging",
  description: "Functies implementeren die voldoen aan de strenge beveiligingseisen van grote organisaties.",
  features: [
    { id: 13001, title: "Single Sign-On (SSO)", description: "Implementeer ondersteuning voor SAML 2.0 en OpenID Connect. Dit stelt grote organisaties in staat om te integreren met hun eigen identity providers zoals Okta, Azure AD, of Auth0 voor naadloze en veilige authenticatie.", completed: false },
    { id: 13002, title: "Geavanceerde Audit Logs", description: "Breid de audit logs uit. Maak het voor beheerders mogelijk om logs te filteren op gebruiker, datum of actie, en deze te exporteren. Implementeer streaming naar externe SIEM-systemen (Security Information and Event Management).", completed: false },
    { id: 13003, title: "Data Loss Prevention (DLP)", description: "Ontwikkel een systeem dat op basis van reguliere expressies kan detecteren wanneer gevoelige informatie (zoals creditcardnummers of burgerservicenummers) in taken of comments wordt geplaatst en dit kan blokkeren of maskeren.", completed: false },
    { id: 13004, title: "E-discovery & Legal Hold", description: "Bied beheerders de mogelijkheid om alle data gerelateerd aan een specifieke gebruiker of project te 'bevriezen' (legal hold). Deze data kan vervolgens worden geëxporteerd in een standaardformaat voor juridische doeleinden.", completed: false },
    { id: 13005, title: "Configureerbaar Sessiebeleid", description: "Geef organisatie-eigenaren de mogelijkheid om een strikter sessiebeleid af te dwingen. Stel een maximale sessieduur (absolute timeout) en een time-out bij inactiviteit (idle timeout) in voor alle leden.", completed: false },
    { id: 13006, title: "SCIM User Provisioning", description: "Ondersteun het SCIM-protocol. Dit maakt het voor grote organisaties mogelijk om het aanmaken, bijwerken en verwijderen van gebruikersaccounts te automatiseren vanuit hun centrale identity provider (zoals Azure AD).", completed: false },
    { id: 13007, title: "Data Residency Opties", description: "Bied klanten de keuze om hun data op te slaan in een specifieke geografische regio (EU of US) om te voldoen aan lokale wet- en regelgeving zoals de GDPR. Dit vereist het opzetten en beheren van meerdere, gescheiden Firebase-projecten.", completed: false },
  ]
};
