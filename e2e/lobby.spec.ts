import { test, expect } from '@playwright/test';

test.describe('Lobby E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText("Nucho's Enigma");
  });

  test('should create a room and show room code', async ({ page }) => {
    // Wait for name input to be visible
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(nameInput).toBeVisible();
    
    // Enter a name
    await nameInput.fill('TestCreator');
    
    // Click create room button
    await page.locator('button:has-text("Create New Game")').click();
    
    // Wait for room to be created and room code to appear
    await expect(page.locator('.room-code')).toBeVisible({ timeout: 10000 });
    
    // Verify room code is displayed (should be 5 characters)
    const roomCode = await page.locator('.room-code').textContent();
    expect(roomCode).toMatch(/^[A-Z0-9]{5}$/);
    
    // Verify creator is in the player list
    await expect(page.locator('text=TestCreator')).toBeVisible();
    await expect(page.locator('text=(You)')).toBeVisible();
  });

  test('should show creator to first player who joins', async ({ browser }) => {
    // Create two browser contexts (two different users)
    const creatorContext = await browser.newContext();
    const joinerContext = await browser.newContext();
    
    const creatorPage = await creatorContext.newPage();
    const joinerPage = await joinerContext.newPage();
    
    // Enable console logging for debugging
    creatorPage.on('console', msg => console.log(`[CREATOR CONSOLE] ${msg.type()}: ${msg.text()}`));
    joinerPage.on('console', msg => console.log(`[JOINER CONSOLE] ${msg.type()}: ${msg.text()}`));
    
    // Log page errors
    creatorPage.on('pageerror', error => console.log(`[CREATOR ERROR] ${error.message}`));
    joinerPage.on('pageerror', error => console.log(`[JOINER ERROR] ${error.message}`));
    
    try {
      // Creator creates a room
      await creatorPage.goto('/');
      await expect(creatorPage.locator('h1')).toContainText("Nucho's Enigma");
      
      const creatorNameInput = creatorPage.locator('input[placeholder="Enter your name"]');
      await creatorNameInput.fill('CreatorPlayer');
      await creatorPage.locator('button:has-text("Create New Game")').click();
      
      // Wait for room code
      await expect(creatorPage.locator('.room-code')).toBeVisible({ timeout: 10000 });
      const roomCode = await creatorPage.locator('.room-code').textContent();
      console.log(`[DEBUG] Room code created: ${roomCode}`);
      expect(roomCode).toBeTruthy();
      
      // Verify creator sees themselves
      await expect(creatorPage.locator('text=CreatorPlayer')).toBeVisible();
      
      // Log creator's player list
      const creatorPlayerList = await creatorPage.locator('.players-list ul').textContent();
      console.log(`[DEBUG] Creator sees players: ${creatorPlayerList}`);
      
      // First player joins the room
      await joinerPage.goto('/');
      await expect(joinerPage.locator('h1')).toContainText("Nucho's Enigma");
      
      const joinerNameInput = joinerPage.locator('input[placeholder="Enter your name"]');
      await joinerNameInput.fill('FirstPlayer');
      
      const roomCodeInput = joinerPage.locator('input[placeholder="Enter room code"]');
      await roomCodeInput.fill(roomCode || '');
      
      await joinerPage.locator('button:has-text("Join Game")').click();
      
      // Wait for joiner to see the lobby
      await expect(joinerPage.locator('.room-code')).toBeVisible({ timeout: 10000 });
      
      // Wait a bit for state to sync
      await joinerPage.waitForTimeout(500);
      
      // Verify joiner sees the creator in the player list
      await expect(joinerPage.locator('text=CreatorPlayer')).toBeVisible({ timeout: 5000 });
      await expect(joinerPage.locator('text=FirstPlayer')).toBeVisible();
      
      // Verify both players are in the list
      const joinerPlayerList = joinerPage.locator('.players-list ul');
      await expect(joinerPlayerList).toBeVisible();
      
      // Check that both names appear
      const playerListText = await joinerPlayerList.textContent();
      console.log(`[DEBUG] Joiner sees players: ${playerListText}`);
      expect(playerListText).toContain('CreatorPlayer');
      expect(playerListText).toContain('FirstPlayer');
      
      // Verify player count is 2
      await expect(joinerPage.locator('text=Players (2/10)')).toBeVisible();
      
      // Take screenshot for debugging
      await joinerPage.screenshot({ path: 'test-results/joiner-view.png', fullPage: true });
      await creatorPage.screenshot({ path: 'test-results/creator-view.png', fullPage: true });
      
    } finally {
      await creatorContext.close();
      await joinerContext.close();
    }
  });

  test('should show all players when multiple players join', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const pages = await Promise.all([
      contexts[0].newPage(),
      contexts[1].newPage(),
      contexts[2].newPage(),
    ]);
    
    try {
      // Player 1 creates room
      await pages[0].goto('/');
      await pages[0].locator('input[placeholder="Enter your name"]').fill('Player1');
      await pages[0].locator('button:has-text("Create New Game")').click();
      await expect(pages[0].locator('.room-code')).toBeVisible({ timeout: 10000 });
      const roomCode = await pages[0].locator('.room-code').textContent();
      
      // Player 2 joins
      await pages[1].goto('/');
      await pages[1].locator('input[placeholder="Enter your name"]').fill('Player2');
      await pages[1].locator('input[placeholder="Enter room code"]').fill(roomCode || '');
      await pages[1].locator('button:has-text("Join Game")').click();
      await expect(pages[1].locator('.room-code')).toBeVisible({ timeout: 10000 });
      
      // Player 3 joins
      await pages[2].goto('/');
      await pages[2].locator('input[placeholder="Enter your name"]').fill('Player3');
      await pages[2].locator('input[placeholder="Enter room code"]').fill(roomCode || '');
      await pages[2].locator('button:has-text("Join Game")').click();
      await expect(pages[2].locator('.room-code')).toBeVisible({ timeout: 10000 });
      
      // Wait a bit for all players to sync
      await pages[0].waitForTimeout(1000);
      await pages[1].waitForTimeout(1000);
      await pages[2].waitForTimeout(1000);
      
      // Verify all players see all 3 players
      for (const page of pages) {
        await expect(page.locator('text=Players (3/10)')).toBeVisible({ timeout: 5000 });
        const playerListText = await page.locator('.players-list ul').textContent();
        expect(playerListText).toContain('Player1');
        expect(playerListText).toContain('Player2');
        expect(playerListText).toContain('Player3');
      }
      
    } finally {
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('should display room code after creating room', async ({ page }) => {
    await page.locator('input[placeholder="Enter your name"]').fill('RoomCreator');
    await page.locator('button:has-text("Create New Game")').click();
    
    // Wait for room info to appear
    await expect(page.locator('.room-info')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Room Code:')).toBeVisible();
    await expect(page.locator('.room-code')).toBeVisible();
    
    // Verify room code format
    const roomCode = await page.locator('.room-code').textContent();
    expect(roomCode).toMatch(/^[A-Z0-9]{5}$/);
    
    // Verify share message
    await expect(page.locator('text=Share this code with other players!')).toBeVisible();
  });

  test('should show player count correctly', async ({ page }) => {
    await page.locator('input[placeholder="Enter your name"]').fill('SoloPlayer');
    await page.locator('button:has-text("Create New Game")').click();
    
    await expect(page.locator('.room-code')).toBeVisible({ timeout: 10000 });
    
    // Should show 1 player
    await expect(page.locator('text=Players (1/10)')).toBeVisible();
    
    // Should show the player in the list
    await expect(page.locator('text=SoloPlayer')).toBeVisible();
  });

  test('should disable start button with less than 5 players', async ({ page }) => {
    await page.locator('input[placeholder="Enter your name"]').fill('HostPlayer');
    await page.locator('button:has-text("Create New Game")').click();
    
    await expect(page.locator('.room-code')).toBeVisible({ timeout: 10000 });
    
    // Start button should be disabled
    const startButton = page.locator('button:has-text("Start Game")');
    await expect(startButton).toBeDisabled();
    
    // Should show warning message
    await expect(page.locator('text=Need at least 5 players to start')).toBeVisible();
  });
});

