
import type { Phase } from '../types';

export const phase9: Phase = {
  name: "Fase 9: Geavanceerde Analyse & Inzichten",
  description: "Gebruikers en managers voorzien van diepere, actiegerichte inzichten in hun productiviteit en projectvoortgang.",
  features: [
    { id: 9001, title: "Deelbare & In te sluiten Dashboards", description: "Genereer een veilige, read-only link naar een geconfigureerd dashboard. Deze link kan worden gedeeld met stakeholders die geen account hebben, of worden ingesloten (embed) in andere tools zoals Confluence of Notion.", completed: true },
    { id: 9002, title: "Geplande Rapporten via E-mail", description: "Configureer de rapportagebouwer om een specifiek rapport automatisch als PDF te genereren en te mailen op een vast schema (bv. elke maandagochtend) naar een lijst van ontvangers.", completed: true },
    { id: 9003, title: "Cycle & Lead Time Analyse", description: "Genereer grafieken die de doorlooptijd van taken visualiseren: de 'lead time' (van creatie tot voltooiing) en de 'cycle time' (van 'In Uitvoering' tot voltooiing). Dit helpt bij het identificeren van knelpunten in de workflow.", completed: true },
    { id: 9004, title: "Individuele Productiviteitsinzichten", description: "Een persoonlijk dashboard voor elke gebruiker met statistieken over voltooide taken, behaalde punten, focustijd (op basis van de timer), en grafieken die de meest productieve dagen en uren tonen.", completed: true },
    { id: 9005, title: "AI-gestuurde 'Wat-als' Scenario's", description: "Een geavanceerde AI-tool in de project-analyse. Gebruikers kunnen scenario's simuleren zoals: 'Wat als we twee extra ontwikkelaars toevoegen?' of 'Wat is de impact op de deadline als taak X twee weken vertraging oploopt?'.", completed: true },
    { id: 9006, title: "Team Velocity Tracking", description: "Monitor de 'velocity' van een team: de hoeveelheid werk (in story points) die gemiddeld per week of per sprint wordt voltooid. Dit biedt een datagedreven basis voor toekomstige planning en inschattingen.", completed: true },
    { id: 9007, title: "AI Inzichten & Trends", description: "Een AI-agent die periodiek de data van de organisatie analyseert en opmerkelijke trends presenteert in het dashboard. Bijvoorbeeld: 'Taken met het label 'Bug' duren gemiddeld 30% langer dan andere taken' of 'Team A voltooit deze maand 20% meer taken dan vorige maand'.", completed: true },
    { id: 9008, title: "Resource Allocatie Heatmaps", description: "Visualiseer de werkdruk van het hele team in een heatmap. Identificeer direct welke teamleden overbelast zijn en wie er nog capaciteit heeft, waardoor het eenvoudiger wordt om werk te herverdelen.", completed: true },
    { id: 9009, title: "Kostenanalyse Rapporten", description: "Genereer gedetailleerde rapporten over projectkosten. Vergelijk de geschatte kosten met de werkelijke kosten en analyseer de kostenefficiëntie per taak, per teamlid of per projectfase.", completed: true },
    { id: 9010, title: "Project Gezondheidsscore", description: "Ontwikkel een algoritme dat een project een 'gezondheidsscore' (0-100) geeft op basis van factoren zoals budgetnaleving, deadline-voortgang, aantal openstaande bugs en team-sentiment. Dit biedt een snelle, kwantitatieve indicator voor de projectstatus.", completed: true },
    { id: 9011, title: "Cumulatief Stroomdiagram (CFD)", description: "Implementeer een CFD dat de voortgang van taken door de verschillende workflow-statussen over tijd toont. Dit is een krachtig hulpmiddel voor het visualiseren van de flow, het werk-in-uitvoering (WIP) en het identificeren van bottlenecks.", completed: true },
    { id: 9012, title: "Aanpasbare Notificatiedrempels", description: "Laat beheerders drempels instellen die automatisch notificaties triggeren, bijvoorbeeld: 'Stuur een waarschuwing naar de projectmanager als het projectbudget voor 80% is verbruikt'.", completed: true },
    { id: 9013, title: "Analyse van Blocker-impact", description: "Genereer een rapport dat de meest voorkomende blokkerende taken identificeert. Analyseer welke taken het vaakst de voortgang van anderen belemmeren om knelpunten in de workflow op te lossen.", completed: true },
    { id: 9014, title: "Voorspelling van Taakvoltooiing", description: "Een AI-model dat, op basis van historische data, een voorspelling doet over de waarschijnlijke voltooiingsdatum van een nieuwe taak zodra deze wordt aangemaakt, wat helpt bij een realistischere planning.", completed: true },
    { id: 9015, title: "Integratie met Business Intelligence Tools", description: "Bied een uitgebreide, beveiligde v1 REST API waarmee externe BI-tools zoals Tableau, Power BI of Looker Studio verbinding kunnen maken om diepgaande, op maat gemaakte analyses uit te voeren.", completed: true }
    ]
  };
