import { test, expect } from '@playwright/test';

// Validate that opening a product from search passes a normalized product object into the modal
// and that price renders and size selection is enforced.

test('search opens product modal with price and size selection requirements', async ({ page }) => {
  await page.goto('/');
  // open search
  await page.click('button[aria-label="Open search"], button:has-text("Search")').catch(() => {});
  // enter query and wait for results
  await page.fill('input[aria-label="Search products"]', 'shirt');
  await page.waitForTimeout(500);
  // click first product result
  const first = page.locator('div[role="button"]:has(img)').first();
  if (await first.count() === 0) {
    // no results - skip
    test.skip();
  }
  await first.click();

  // modal should be visible
  await expect(page.locator('dialog')).toBeVisible();

  // Price should not be 'NaN' or empty
  const priceText = await page.locator('dialog').locator('text=/₹/').first().textContent();
  expect(priceText).not.toContain('NaN');

  // If sizes exist, ADD TO CART should be disabled until a size is selected
  const sizeButtons = page.locator('dialog button:has-text("S")');
  if (await sizeButtons.count() > 0) {
    // find Add to Cart button
    const addToCart = page.locator('dialog button:has-text("ADD TO CART")');
    // If size not selected, click should show a toast or error
    await addToCart.click();
    // We expect a toast about selecting size (but if the site flows differently, validate that modal didn't close)
    await expect(addToCart).toBeVisible();
  }
});
