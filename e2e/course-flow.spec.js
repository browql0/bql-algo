import { expect, test } from '@playwright/test';

test('course list loads and opens a course', async ({ page }) => {
  await page.goto('/cours');

  await expect(page.getByText('Niveau 1 - Foundations')).toBeVisible();
  await page.getByText('Niveau 1 - Foundations').click();

  await expect(page.getByRole('heading', { name: 'Introduction E2E' })).toBeVisible();
});

test('lesson navigation works with next and sidebar', async ({ page }) => {
  await page.goto('/cours');
  await page.getByText('Niveau 1 - Foundations').click();

  await expect(page.getByRole('heading', { name: 'Introduction E2E' })).toBeVisible();
  await page.getByRole('button', { name: /Suivant/i }).click();

  await expect(page.getByRole('heading', { name: /Défi E2E : Affichage simple/i })).toBeVisible();
  await page.getByRole('button', { name: /Introduction E2E/i }).click();
  await expect(page.getByRole('heading', { name: 'Introduction E2E' })).toBeVisible();
});

test('challenge validation trigger works', async ({ page }) => {
  await page.goto('/cours');
  await page.getByText('Niveau 1 - Foundations').click();
  await page.getByRole('button', { name: /Défi E2E : Affichage simple/i }).click();
  await page.getByRole('button', { name: /Résoudre l'exercice/i }).click();

  await expect(page).toHaveURL(/\/editor/);
  const editor = page.locator('textarea.code-textarea');
  await expect(editor).toBeVisible();
  await editor.fill('ALGORITHME_DefiE2E;\nDEBUT\n  ECRIRE("BQL est genial");\nFIN');

  await page.getByRole('button', { name: /Valider/i }).click();
  await expect(page.locator('body')).toContainText(/Solution valide|1\/1|test validé/i);
});
