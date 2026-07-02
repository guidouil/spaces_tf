import { expect, test } from '@playwright/test';

test('creates a quiz room without regressing the default game type', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('textbox').fill(`Quiz ${Date.now()}`);
	await page.getByRole('button', { name: /Create a Space Game|Créer un Space Game/ }).click();

	await expect(page).toHaveURL(/\/host\/[a-z0-9]{6}(\?|$)/);
	await expect(page.getByText(/Live Quiz|Quiz Live/)).toBeVisible();
	await expect(
		page.getByRole('button', { name: /Add question|Ajouter la question/ })
	).toBeVisible();
});

test('plays and approves a Bingo claim', async ({ page }) => {
	await page.goto('/host/new');
	await page.getByRole('textbox').fill(`Bingo ${Date.now()}`);
	await page.getByLabel(/Spaces Bingo|Bingo des Spaces/).check();
	await page.getByRole('button', { name: /Create room|Créer la room/ }).click();
	await expect(page).toHaveURL(/\/host\/[a-z0-9]{6}(\?|$)/);

	const origin = new URL(page.url()).origin;
	const playerHref = await page.locator('a[href^="/r/"]').first().getAttribute('href');
	const hostUrl = page.url();
	if (!playerHref) throw new Error('Missing player link');
	const playerUrl = new URL(playerHref, origin);
	const slug = playerUrl.pathname.split('/').at(-1);
	if (!slug) throw new Error('Missing room slug');

	await page.goto(playerUrl.toString());
	await page.getByRole('textbox').fill('Bingo Player');
	await page.getByRole('button', { name: /Enter the room|Entrer dans la room/ }).click();
	await expect(page.locator('.bingo-cell')).toHaveCount(16);

	for (const index of [0, 1, 2, 3]) {
		await page.locator('.bingo-cell').nth(index).click();
		await expect(page.locator('.bingo-cell.checked')).toHaveCount(index + 1);
	}

	await page.getByRole('button', { name: /Bingo/ }).click();
	await page.goto(hostUrl);
	await expect(page.getByText(/Bingo claims to check|Bingo à vérifier/)).toBeVisible({
		timeout: 5000
	});
	await page.getByRole('button', { name: /Approve|Valider/ }).click();
	await expect(page.getByText(/Approved|Validé/)).toBeVisible({ timeout: 5000 });
	await page.goto(`${origin}/r/${slug}`);
	await expect(page.getByRole('link', { name: /View podium|Voir le podium/ })).toBeVisible({
		timeout: 5000
	});
});
