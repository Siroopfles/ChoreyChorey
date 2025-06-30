
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import 'cypress-axe';

// The 'checkA11y' command is added by the cypress-axe library.
// We are just re-exporting it here to make it available to our tests
// and to satisfy TypeScript.
// We could also add our own custom commands here.

// -- This is a parent command --
Cypress.Commands.add('login', () => { 
    cy.session(
        'currentUser',
        () => {
            cy.visit('/login');
            cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
            cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'), { log: false });
            cy.get('button[type="submit"]').click();

            // Wait for the dashboard redirect and for a specific element to be visible
            cy.url().should('include', '/dashboard');
            cy.get('[data-tour-id="add-task-button"]').should('be.visible');
        },
        {
            cacheAcrossSpecs: true,
        }
    )
})

// Add the type definition for the custom command
declare global {
  namespace Cypress {
    interface Chainable {
      checkA11y(
        context?: any,
        options?: any,
        violationCallback?: any,
        skipFailures?: boolean
      ): Chainable<Element>;
      login(): void;
    }
  }
}
