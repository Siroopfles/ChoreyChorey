import type { Phase } from '../types';

export const phase4: Phase = {
  name: "Fase 4: Verfijning & Optimalisatie (Voltooid)",
  description: "Deze fase focust op het verfijnen van de gebruikerservaring, het bieden van meer aanpassingsmogelijkheden en het optimaliseren van de dagelijkse workflow.",
  features: [
    { id: 4001, title: "Proactieve AI Assistent", description: "De AI wordt proactiever. Wanneer een gebruiker een taak invoert die complex of vaag lijkt, zal de AI automatisch aanbieden om te helpen, bijvoorbeeld door subtaken te suggereren of een inschatting van de Story Points te maken.", completed: true },
    { id: 4002, title: "AI Feedback Loop", description: "Na elke AI-suggestie (zoals voorgestelde Story Points of prioriteit), kan de gebruiker met een simpele duim omhoog of omlaag aangeven of de suggestie nuttig was. Deze feedback wordt verzameld om de AI-modellen continu te verbeteren.", completed: true },
    { id: 4003, title: "Visuele Taakafhankelijkheden", description: "Het kanbanbord en de lijstweergave tonen nu duidelijke visuele indicatoren (zoals een link-icoon) voor taken die andere taken blokkeren of erdoor geblokkeerd worden, wat de planning verduidelijkt.", completed: true },
    { id: 4004, title: "Subtaak Promotie", description: "Converteer een subtaak met één klik naar een volwaardige, losstaande taak. De nieuwe taak behoudt de context door automatisch een link naar de oorspronkelijke 'oudertaak' op te nemen.", completed: true },
    { id: 4005, title: "Custom Views (Groeperen)", description: "Meer flexibiliteit in het organiseren van het kanbanbord. Gebruikers kunnen nu taken groeperen op basis van status (standaard), maar ook op toegewezen persoon, prioriteit of project.", completed: true },
    { id: 4006, title: "Aanpasbare Dashboards", description: "Gebruikers kunnen nu hun persoonlijke dashboard samenstellen. Via een 'drag-and-drop' interface kunnen ze widgets (zoals 'Taken per Status', 'Scorebord') toevoegen, verplaatsen en van grootte veranderen. De layout wordt per gebruiker opgeslagen.", completed: true },
    { id: 4007, title: "Geavanceerde Terugkerende Taken", description: "De functionaliteit voor herhalende taken is uitgebreid. Naast dagelijks en wekelijks, kunnen taken nu ook maandelijks herhaald worden, bijvoorbeeld 'elke laatste vrijdag van de maand' of 'elke 15e van de maand'.", completed: true },
    { id: 4008, title: "Toegankelijkheidsverbeteringen (WCAG)", description: "Een grondige review en aanpassing van de applicatie om te voldoen aan de WCAG 2.1 AA-standaarden. Dit omvat correcte ARIA-attributen, toetsenbordnavigatie, en voldoende kleurcontrast.", completed: true },
    { id: 4009, title: "Persoonlijke Werk-uren", description: "Gebruikers kunnen hun standaard werkuren instellen in hun profiel. Deze informatie wordt gebruikt door de AI voor realistischere werkdruk-analyses en kan in de toekomst worden gebruikt om notificaties buiten werktijd te beperken.", completed: true },
    { id: 4010, title: "Verrijkte Taakkaarten", description: "Toon meer informatie direct op de taakkaarten, zoals voortgang van subtaken, avatars van toegewezenen, en iconen voor het aantal bijlagen en comments. Dit vermindert de noodzaak om taken constant te openen voor basisinformatie.", completed: true },
  ]
};
