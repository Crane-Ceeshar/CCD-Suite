import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.locator('#email').fill('info@craneceeshar.com');
  await page.locator('#password').fill('cKsz3dxL634yYVx');

  // Click Sign In
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Save session state
  await page.context().storageState({ path: authFile });
});
