import { expect, test, type Page } from '@playwright/test';

const shot = async (page: Page, name: string) => {
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: `docs/screens/${name}.png`, fullPage: true });
};

test('return trip: search to confirmation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Departure')).not.toHaveValue('');
  await shot(page, '1-search');
  await page.getByRole('button', { name: 'Search flights' }).click();

  await expect(page).toHaveURL(/\/flights\?/);
  await page.getByRole('button', { name: 'View fares' }).first().click();
  await shot(page, '2-results');
  await page
    .getByRole('button', { name: /^Select Saver/ })
    .first()
    .click();

  await expect(
    page.getByRole('heading', { name: /Choose your return flight/ })
  ).toBeVisible();
  await page.getByRole('button', { name: 'View fares' }).first().click();
  await page
    .getByRole('button', { name: /^Select Saver/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/book\/passengers/);
  await page.getByRole('button', { name: 'Continue to review' }).click();
  await expect(page.getByText('Required').first()).toBeVisible();
  await page.getByLabel('Title').selectOption('Ms');
  await page.getByLabel('Nationality').selectOption('NP');
  await page.getByLabel('Given names').fill('Asha');
  await page.getByLabel('Family name').fill('Gurung');
  await page.getByLabel('Date of birth').fill('1994-05-12');
  await page.getByLabel('Passport number').fill('PA1234567');
  await page.getByLabel('Passport expiry').fill('2034-01-01');
  await page.getByLabel('Email').fill('asha@example.com');
  await page.getByLabel('Phone').fill('+977 9800000000');
  await shot(page, '3-passengers');
  await page.getByRole('button', { name: 'Continue to review' }).click();

  await expect(page).toHaveURL(/\/book\/review/);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByText('Booking confirmed')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /^[A-Z0-9]{6}$/
  );
  await shot(page, '4-confirmation');
});
