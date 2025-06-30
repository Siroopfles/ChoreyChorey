
describe('Accessibility Tests', () => {
  it('should have no detectable a11y violations on the landing page', () => {
    // Start from the index page
    cy.visit('/');

    // Inject the axe-core runtime
    cy.injectAxe();

    // Check the entire page for accessibility violations
    // You can configure this to check for specific WCAG levels,
    // or to exclude certain rules if necessary.
    cy.checkA11y();
  });

  it('should have no detectable a11y violations on the login page', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y();
  });
});
