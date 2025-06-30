
describe('Comprehensive Application Flow', () => {
  let testTaskId: string;
  const taskTitle = `Cypress E2E Task - ${Date.now()}`;
  const taskDesc = 'This is a task created by a comprehensive automated test.';
  const subtaskText = 'Complete the first step of the E2E test';

  before(() => {
    // This runs once before all tests in this block
    cy.login();
  });

  beforeEach(() => {
    // This runs before each test. `cy.session` is handled by the custom login command,
    // so we can just visit the page.
    cy.visit('/dashboard');
  });

  it('should allow full task lifecycle: create, edit, add subtask, move, complete, and delete', () => {
    // --- 1. Create Task ---
    cy.get('[data-tour-id="add-task-button"]').click();
    cy.get('input[name="title"]').type(taskTitle);
    cy.get('.tiptap').first().type(taskDesc);
    cy.get('[data-cy="priority-select"]').click();
    cy.contains('Hoog').click();
    
    // Using {force: true} because the button might be covered by another element after click
    cy.get('button[type="submit"]').contains('Taak Aanmaken').click({ force: true }); 
    
    // Verify task is created and find its ID
    cy.contains(taskTitle)
      .should('be.visible')
      .parents('[data-cy^="task-card-"]')
      .then(($card) => {
        const cardIdAttr = $card.attr('data-cy');
        testTaskId = cardIdAttr?.split('-').pop()!;
        cy.wrap(testTaskId).should('not.be.undefined');
      });

    // --- 2. Edit Task & Add Subtask ---
    cy.get(`[data-cy="task-card-${testTaskId}"]`).click();
    cy.get('.tiptap').eq(0).type(' - Additional description.'); // Use eq(0) to target the first editor (description)
    
    cy.contains('Subtaak toevoegen').click();
    cy.get('input[placeholder="Beschrijf subtaak..."]').last().type(subtaskText);

    cy.get('[data-cy="save-task-button"]').click({ force: true });
    
    // --- 3. Interact with Subtask on Card ---
    cy.get(`[data-cy="task-card-${testTaskId}"]`).as('taskCard');
    cy.get('@taskCard').contains('Subtaken').click();
    cy.get('@taskCard').contains(subtaskText).should('be.visible');
    cy.get('@taskCard').find(`input[id^="subtask-"]`).last().check({ force: true }).should('be.checked');
    cy.get('@taskCard').find(`input[id^="subtask-"]`).last().uncheck({ force: true }).should('not.be.checked');

    // --- 4. Drag and Drop through columns ---
    // Te Doen -> In Uitvoering
    cy.get('@taskCard').trigger('mousedown', { which: 1 });
    cy.get('[data-cy="task-column-In Uitvoering"]').trigger('mousemove', 'center').trigger('mouseup', { force: true });
    cy.get('[data-cy="task-column-In Uitvoering"]').should('contain', taskTitle);

    // In Uitvoering -> Voltooid
    cy.get(`[data-cy="task-card-${testTaskId}"]`).trigger('mousedown', { which: 1 });
    cy.get('[data-cy="task-column-Voltooid"]').trigger('mousemove', 'center').trigger('mouseup', { force: true });
    cy.get('[data-cy="task-column-Voltooid"]').should('contain', taskTitle);

    // --- 5. Gamification and Deletion in Completed Column ---
    cy.get('[data-cy="task-column-Voltooid"]').find(`[data-cy="task-card-${testTaskId}"]`).as('completedTaskCard');

    // This part of the test assumes the test user is NOT the assignee of the task.
    // For a more robust test, you would need to control task assignments.
    cy.get('@completedTaskCard').then($card => {
        if ($card.find('[data-cy="thank-button"]').length > 0) {
            cy.wrap($card).find('[data-cy="thank-button"]').click();
            cy.wrap($card).find('[data-cy="thank-button"]').should('contain.text', 'Bedankt!');
        }
    });

    cy.get('@completedTaskCard').then($card => {
         if ($card.find('[data-cy^="rate-star-"]').length > 0) {
            cy.wrap($card).find('[data-cy="rate-star-4"]').click();
         }
    });
    
    // Delete the task
    cy.get('@completedTaskCard').find('button[aria-label^="Meer acties"]').click();
    cy.contains('Verplaats naar Prullenbak').click();
    cy.get(`[data-cy="task-card-${testTaskId}"]`).should('not.exist');
  });

  it('should navigate to key pages and verify content', () => {
    // Navigate to Organization page
    cy.get('[data-tour-id="organization-link"]').click();
    cy.contains('Organisatie Overzicht').should('be.visible');
    cy.contains('Ledenbeheer').should('be.visible');

    // Navigate to Leaderboard
    cy.get('a[href="/dashboard/leaderboard"]').click();
    cy.contains('Prestaties & Scorebord').should('be.visible');
    cy.contains('Individueel').should('be.visible');

    // Navigate to Settings
    cy.get('[data-tour-id="settings-link"]').click();
    cy.contains('Instellingen').should('be.visible');
    cy.contains('Profiel & Account').should('be.visible');
  });

  it('should filter tasks by user', () => {
    // This is a simple assertion. A more robust test would check if only the current user's tasks are visible.
    cy.get('[data-tour-id="my-tasks-filter"]').click();
    
    cy.get('button[variant="outline"]').contains('Toegewezen').find('~ badge').should('exist');
    
    // Clear filters
    cy.contains('Wissen').click();
    cy.get('button[variant="outline"]').contains('Toegewezen').find('~ badge').should('not.exist');
  });
});
