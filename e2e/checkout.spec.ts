import { test, expect } from '@playwright/test';

// A pragmatic e2e test covering checkout + UPI behavior for desktop and mobile.
// Relies on dev server running via webServer in config; it uses seeded products in the database.

test.describe('Checkout e2e', () => {
  test('adds product to cart and creates order (desktop - UPI copy)', async ({ page }) => {
    await page.goto('/products');

    // Remove any pre-existing local storage state
    await page.evaluate(() => localStorage.removeItem('srisha_cart'));

    // Wait for Add to Cart buttons and click first
    const addBtn = page.locator('text=ADD TO CART').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Open cart
    await page.locator('[aria-label="Open cart"]').click();

    // Click Checkout
    await page.locator('text=Checkout').click();
    await expect(page).toHaveURL(/checkout/);

    // Fill shipping form
    await page.fill('#name', 'Playwright Test');
    await page.fill('#email', 'playwright@example.com');
    await page.fill('#phone', '9876543210');
    await page.fill('#address1', '123 Test St');
    await page.fill('#city', 'TestCity');
    await page.fill('#state', 'TestState');
    await page.fill('#pincode', '400001');

    // Click Place Order & Pay
    await page.locator('text=Place Order & Pay').click();

    // Expect we were redirected to orders page
    await expect(page).toHaveURL(/orders/);
    // Expect the UPI copy toast to show on desktop
    await expect(page.locator('text=UPI link copied')).toBeVisible({ timeout: 5000 });
  });

  test('adds product to cart and creates order (mobile - UPI popup)', async ({ page }) => {
    // In mobile project (project 'webkit-mobile' or a mobile project), we emulate mobile UA
    await page.goto('/products');

    // Clear localStorage and add product
    await page.evaluate(() => localStorage.removeItem('srisha_cart'));

    const addBtn = page.locator('text=ADD TO CART').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Open cart
    await page.locator('[aria-label="Open cart"]').click();

    // Intercept window.open calls by wrapping on page
    await page.evaluate(() => {
      (window as any).__lastOpen = null;
      const origOpen = window.open;
      window.open = function (url: string | null, target: string | null) {
        (window as any).__lastOpen = url;
        if (typeof origOpen === 'function') {
          try { return origOpen.call(window, url, target); } catch (e) { return undefined; }
        }
        return undefined;
      } as any;
    });

    // Click Checkout
    await page.locator('text=Checkout').click();
    await expect(page).toHaveURL(/checkout/);

    // Fill shipping form
    await page.fill('#name', 'Playwright Mobile');
    await page.fill('#email', 'playwright.mobile@example.com');
    await page.fill('#phone', '9876543210');
    await page.fill('#address1', '456 Mobile St');
    await page.fill('#city', 'MobiCity');
    await page.fill('#state', 'MobiState');
    await page.fill('#pincode', '400001');

    // Click Place Order & Pay
    await page.locator('text=Place Order & Pay').click();

    // We should also be redirected to the orders page
    await expect(page).toHaveURL(/orders/);
    // Check window.__lastOpen is UPI
    const lastOpen = await page.evaluate(() => (window as any).__lastOpen);
    expect(lastOpen).toBeTruthy();
    expect(lastOpen.startsWith('upi://pay')).toBeTruthy();
  });
});
