
import type { Step } from 'react-joyride';

export const ownerSteps: Step[] = [
  {
    target: 'body',
    content: 'Welkom bij Chorey! Laten we je in een paar snelle stappen op weg helpen.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="add-task-button"]',
    content: 'Dit is de belangrijkste knop. Klik hier om je eerste taak aan te maken.',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="organization-link"]',
    content: 'Hier beheer je je organisatie. Op de organisatiepagina kun je nieuwe leden uitnodigen en projecten beheren.',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="settings-link"]',
    content: 'Pas hier je persoonlijke en organisatie-instellingen aan. Je bent nu klaar om te beginnen!',
    disableBeacon: true,
  },
];

export const memberSteps: Step[] = [
    {
        target: 'body',
        content: 'Welkom bij Chorey! Deze korte tour toont je de belangrijkste functies.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="my-tasks-filter"]',
        content: 'Klik hier om snel alle taken te zien die aan jou zijn toegewezen.',
        disableBeacon: true,
    },
    {
        target: '.group-task-card', 
        content: 'Klik op een taak om de details te bekijken, subtaken af te vinken en opmerkingen te plaatsen.',
        disableBeacon: true,
    },
     {
        target: '[aria-label^="Gebruikersmenu"]',
        content: 'Beheer hier je profiel, status en log uit.',
        disableBeacon: true,
    },
];
