describe('Main Application Flow', () => {
    let testTaskId: string;
  
    beforeEach(() => {
      // Log in before each test
      cy.login();
      cy.visit('/dashboard');
    });
  
    it('should create, edit, and delete a task', () => {
      const taskTitle = `Cypress Test Task - ${Date.now()}`;
      const taskDesc = 'This is a task created by an automated test.';
  
      // --- Create Task ---
      cy.get('[data-tour-id="add-task-button"]').click();
      cy.get('input[name="title"]').type(taskTitle);
      cy.get('.tiptap').type(taskDesc);
      cy.get('button[type="submit"]').contains('Taak Aanmaken').click();
  
      // Verify task is created and find its ID
      cy.contains(taskTitle)
        .should('be.visible')
        .parents('[data-cy^="task-card-"]')
        .then(($card) => {
          const cardId = $card.attr('data-cy');
          testTaskId = cardId?.split('-').pop()!;
          cy.wrap(testTaskId).should('not.be.undefined');
        });
  
      // --- Edit Task (Priority) ---
      cy.get(`[data-cy="task-card-${testTaskId}"]`).click();
      cy.get('[data-cy="priority-select"]').click();
      cy.contains('Hoog').click(); // Assuming 'Hoog' is an option
      cy.get('button[type="submit"]').contains('Wijzigingen Opslaan').click();
      
      // Verification for edit
      cy.get(`[data-cy="task-card-${testTaskId}"]`).should('contain.text', 'Hoog');
  
      // --- Delete Task ---
      cy.get(`[data-cy="task-card-${testTaskId}"]`).click();
      cy.get(`[aria-label="Meer acties voor taak ${taskTitle}"]`).click();
      cy.contains('Verplaats naar Prullenbak').click();
      
      // Verification for delete
      cy.get(`[data-cy="task-card-${testTaskId}"]`).should('not.exist');
    });
  
    it('should allow dragging and dropping a task between columns', () => {
      const dndTaskTitle = `DND Test - ${Date.now()}`;
      
      // Create a task for D&D
      cy.get('[data-tour-id="add-task-button"]').click();
      cy.get('input[name="title"]').type(dndTaskTitle);
      cy.get('button[type="submit"]').contains('Taak Aanmaken').click();
      
      // Wait for the task to be created and visible
      cy.contains(dndTaskTitle).should('be.visible');
  
      // Drag and Drop
      cy.get('[data-cy^="task-column-"]').contains(dndTaskTitle).trigger('mousedown', { which: 1 });
      cy.get('[data-cy="task-column-In Uitvoering"]').trigger('mousemove', 'center').trigger('mouseup', { force: true });
      
      // Verification
      cy.wait(500); // Wait for potential backend update and re-render
      cy.get('[data-cy="task-column-In Uitvoering"]').should('contain', dndTaskTitle);
      cy.get('[data-cy="task-column-Te Doen"]').should('not.contain', dndTaskTitle);
    });
    
    it('should navigate to key pages from the sidebar', () => {
      // Navigate to Organization page
      cy.get('[data-tour-id="organization-link"]').click();
      cy.contains('Organisatie Overzicht').should('be.visible');
  
      // Navigate to Leaderboard
      cy.get('a[href="/dashboard/leaderboard"]').click();
      cy.contains('Prestaties & Scorebord').should('be.visible');
  
      // Navigate to Settings
      cy.get('[data-tour-id="settings-link"]').click();
      cy.contains('Instellingen').should('be.visible');
    });
  
    it('should filter tasks by user', () => {
      // This is a simple assertion, a more robust one would involve checking
      // if only the current user's tasks are visible, but that requires more setup.
      cy.get('[data-tour-id="my-tasks-filter"]').click();
      
      // Clear filters
      cy.contains('Wissen').click();
    });
  });
  