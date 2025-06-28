import type { Phase } from '../types';

export const phase10: Phase = {
  name: "Fase 10: Testen & Betrouwbaarheid",
  description: "Een robuuste basis leggen voor een stabiele v1.0 release door een uitgebreide teststrategie te implementeren.",
  features: [
    { id: 10001, title: "Unit & Integratie Test-suite", description: "Schrijf een uitgebreide set unit tests met Jest voor individuele functies (utils, services) en server actions. Gebruik React Testing Library voor het testen van de rendering en interactie van complexe UI-componenten.", completed: false },
    { id: 10002, title: "End-to-End (E2E) Testen", description: "Zet een E2E-testframework op met Cypress of Playwright. Creëer test-scripts voor de meest kritieke gebruikersflows, zoals het aanmaken van een account, het creëren van een taak, en het doorlopen van een kanban-flow.", completed: false },
    { id: 10003, title: "CI/CD Pipeline Integratie", description: "Integreer de test-suites in de CI/CD pipeline (bv. via GitHub Actions). Zorg ervoor dat de build faalt als er tests mislukken, waardoor wordt voorkomen dat er bugs in productie komen.", completed: false },
    { id: 10004, title: "Visuele Regressietesten", description: "Implementeer een tool zoals Chromatic of Percy, geïntegreerd met Storybook. Bij elke code-wijziging worden automatisch screenshots van UI-componenten gemaakt en vergeleken met de baseline om onbedoelde visuele wijzigingen te detecteren.", completed: false },
    { id: 10005, title: "Performance Budgetting", description: "Stel strikte prestatie-eisen in (bv. max. laadtijd, bundle-grootte). Gebruik tools zoals Lighthouse CI om de prestaties te meten en laat de CI-pipeline falen als de applicatie niet aan de gestelde eisen voldoet.", completed: false },
    { id: 10006, title: "Geautomatiseerde Toegankelijkheidstesten", description: "Integreer `axe-core` in de E2E-tests en CI/CD pipeline. Dit scant de applicatie automatisch op veelvoorkomende toegankelijkheidsproblemen (WCAG), wat de basis vormt voor handmatige audits.", completed: false },
    { id: 10007, title: "Beveiligings- & Afhankelijkheidsscans", description: "Implementeer Snyk of GitHub Dependabot om proactief en automatisch te scannen op bekende kwetsbaarheden in alle project-dependencies. Configureer de CI-pipeline om te falen bij het detecteren van kritieke kwetsbaarheden.", completed: false },
  ]
};
