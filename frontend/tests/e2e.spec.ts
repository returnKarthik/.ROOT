import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('GRIETGO Social Platform E2E Tests with JWT Auth', () => {
  const timestamp = Date.now();
  const testUserEmail = `e2e_jwt_${timestamp}@grietgo-test.com`;
  const testUserPassword = 'password123';
  const testUserName = `Tester_${timestamp}`;

  const testUserEmail2 = `e2e_jwt2_${timestamp}@grietgo-test.com`;
  const testUserName2 = `Follower_${timestamp}`;

  // Create a dummy image file for upload tests
  const dummyImagePath = path.join(__dirname, `dummy_${timestamp}.png`);

  test.beforeAll(() => {
    // Write a tiny mock PNG file
    const pixelPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(dummyImagePath, Buffer.from(pixelPngBase64, 'base64'));
  });

  test.afterAll(() => {
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
    }
  });

  test('Signup, Post Creation, Likes, Comments, Search, and Personalized Feed', async ({ page }) => {
    // 1. Sign Up first user
    await page.goto('/signup');
    await page.fill('input[placeholder="Full Name"]', testUserName);
    await page.fill('input[placeholder="Email"]', testUserEmail);
    await page.fill('input[placeholder^="Password"]', testUserPassword);
    
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to home feed
    await expect(page).toHaveURL('/');
    
    // Verify Sidebar/BottomNav shows current user link
    await page.click('a[href^="/profile/"]');
    await expect(page).toHaveURL(/\/profile\/.+/);
    await expect(page.locator('main h1')).toContainText(testUserName);

    // 2. Create a Post
    await page.click('a[href="/create"]');
    await expect(page).toHaveURL('/create');

    // Handle file upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Select a photo');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(dummyImagePath);

    // Fill caption and submit
    await page.fill('textarea[placeholder="Write a caption..."]', `E2E Photo Caption ${timestamp}`);
    await page.click('button:has-text("Share")');

    // Verify redirected to Home and post is in the feed
    await expect(page).toHaveURL('/');
    await expect(page.locator(`text=E2E Photo Caption ${timestamp}`)).toBeVisible();

    // 3. Like Post
    const postCard = page.locator('article', { hasText: `E2E Photo Caption ${timestamp}` });
    const likeButton = postCard.locator('button').first();
    await likeButton.click();

    // Verify like count increments to 1
    await expect(postCard.locator('text=1 likes')).toBeVisible();

    // 4. Comment on Post
    const commentButton = postCard.locator('text=View all comments');
    await commentButton.click();

    // Modal should be visible
    const commentModal = page.locator('div.fixed').filter({ has: page.locator('input[placeholder="Add a comment..."]') }).first();
    await expect(commentModal).toBeVisible();

    // Write comment
    await commentModal.locator('input[placeholder="Add a comment..."]').fill(`E2E Comment Text ${timestamp}`);
    await commentModal.locator('button:has-text("Post")').click();

    // Verify comment is added
    await expect(commentModal.locator(`text=E2E Comment Text ${timestamp}`)).toBeVisible();

    // Close comment modal by pressing Escape
    await page.keyboard.press('Escape');
    await expect(commentModal).not.toBeVisible();

    // 5. Sign Out first user
    await page.click('a[href^="/profile/"]');
    await expect(page).toHaveURL(/\/profile\/.+/);
    await page.click('button[title="Logout"]');
    await expect(page).toHaveURL('/login');

    // 6. Sign Up second user
    await page.goto('/signup');
    await page.fill('input[placeholder="Full Name"]', testUserName2);
    await page.fill('input[placeholder="Email"]', testUserEmail2);
    await page.fill('input[placeholder^="Password"]', testUserPassword);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('/');

    // 7. Search for first user, follow them, and verify personalized feed
    await page.click('a[href="/explore"]');
    await page.fill('input[placeholder="Search users..."]', testUserName);
    
    // Wait for search result and click on it
    const searchResult = page.locator(`h3:has-text("${testUserName}")`).first();
    await expect(searchResult).toBeVisible();
    await searchResult.click();

    // Should be on first user's profile. Verify Follow button exists.
    const followButton = page.locator('button:has-text("Follow")');
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Verify button text changes to Following
    await expect(page.locator('button:has-text("Following")')).toBeVisible();

    // Go to Home feed
    await page.click('a[href="/"]');
    
    // Personalized feed should show the followed user's post!
    await expect(page.locator(`text=E2E Photo Caption ${timestamp}`)).toBeVisible();
  });
});
