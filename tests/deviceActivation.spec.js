// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Device activation lifecycle', () => {
  test('creates device, activates and deactivates it', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const deviceName = `Playwright Device ${uniqueSuffix}`;
    const ipAddress = `10.${(uniqueSuffix % 200) + 1}.${(uniqueSuffix % 250) + 1}.${(uniqueSuffix % 240) + 1}`;

    await page.goto('/');

    await page.getByLabel('Name').fill(deviceName);
    await page.getByLabel('Device Type').selectOption('access_controller');
    await page.getByLabel('IP Address').fill(ipAddress);
    await page.getByRole('button', { name: /create device/i }).click();

    const devicesSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Devices' }) });
    const deviceRow = devicesSection.locator('tbody tr').filter({ hasText: deviceName });
    await expect(deviceRow).toBeVisible({ timeout: 15000 });

    const statusBadge = deviceRow.locator('.status-badge');
    await expect(statusBadge).toHaveText(/inactive/i);

    await deviceRow.getByRole('button', { name: /activate/i }).click();
    await expect(statusBadge).toHaveText(/active/i, { timeout: 20000 });

    await deviceRow.getByRole('button', { name: /deactivate/i }).click();
    await expect(statusBadge).toHaveText(/inactive/i, { timeout: 20000 });
  });
});
