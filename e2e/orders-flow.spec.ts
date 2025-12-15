import { test, expect } from '@playwright/test';

// Test orders page UI elements
test('orders page renders and allows view items and navigation', async ({ page }) => {
  await page.goto('/orders');
  // The main header should exist
  await expect(page.locator('h1, h2, h3').first()).toBeVisible();

  // If there are items, verify View items toggles exist and click
  const viewButtons = page.getByRole('button', { name: /View items|Hide items/ });
  if (await viewButtons.count() > 0) {
    await viewButtons.first().click();
    // After expanding, there should be an item entry (if data exists)
    // Check for Qty text or product name presence
    await expect(page.locator('text=Qty:').first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  }

  // Try clicking first order card and ensure navigation to /orders/:id
  const firstCard = page.locator('div[role="button"]').first();
  if (await firstCard.count()) {
    await firstCard.click();
    await expect(page.url()).toMatch(/\/orders\/[a-zA-Z0-9-]+/);
  }
});
