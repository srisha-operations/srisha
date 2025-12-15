import { test, expect } from '@playwright/test';

test('admin pages require sign-in', async ({ page }) => {
  // Go to the admin URL as a guest
  await page.goto('/admin');
  // The app should redirect to admin sign-in
  await expect(page).toHaveURL(/\/admin\/signin/);
});
