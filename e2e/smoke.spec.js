import { expect, test } from '@playwright/test';

test('public landing page renders the product shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toContainText(/BQL|algorithmique|algorithmes/i);
  await expect(page.locator('a[href="/login"], a:has-text("Connexion"), a:has-text("Se connecter")').first()).toHaveCount(1);
});

test('student can load courses and open a lesson', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-chrome', 'Covered by the desktop course flow and the dedicated mobile navigation smoke test.');

  await page.goto('/cours');

  await expect(page.getByText('Niveau 1 - Foundations')).toBeVisible();
  await page.getByText('Niveau 1 - Foundations').click();

  await expect(page.getByRole('heading', { name: 'Introduction E2E' })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Bonjour E2E/i);
});

test('student can open editor, run code, and validate a challenge', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-chrome', 'Editor validation is covered on desktop; mobile has a separate navigation smoke test.');

  await page.goto('/cours');

  await page.getByText('Niveau 1 - Foundations').click();
  await page.getByRole('button', { name: /Défi E2E : Affichage simple/i }).click();
  await page.getByRole('button', { name: /Résoudre l'exercice/i }).click();

  await expect(page).toHaveURL(/\/editor/);
  const editor = page.locator('textarea.code-textarea');
  await expect(editor).toBeVisible();
  await editor.fill('ALGORITHME_DefiE2E;\nDEBUT\n  ECRIRE("BQL est genial");\nFIN');

  await page.getByRole('button', { name: /Exécuter/i }).click();
  await expect(page.locator('body')).toContainText('BQL est genial');

  await page.getByRole('button', { name: /Valider/i }).click();
  await expect(page.locator('body')).toContainText(/Solution valide|1\/1|test validé/i);
});

test('admin can open the courses management tab', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-chrome', 'Admin management is covered on desktop; mobile has a separate navigation smoke test.');

  await page.goto('/admin/courses');

  await expect(page.locator('body')).toContainText(/Niveau 1 - Foundations|contenu|courses/i);
  await expect(page.locator('body')).toContainText(/leçons|challenges|secrets/i);
});

test('mobile navigation keeps public routes usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('body')).toContainText(/BQL|algorithmique|algorithmes/i);
  await page.goto('/privacy');
  await expect(page.locator('body')).toContainText(/confidentialit|donn/i);
});
