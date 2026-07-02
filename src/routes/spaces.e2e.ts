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
	await page.getByRole('button', { name: /Start Bingo|Démarrer le Bingo/ }).click();

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
	await expect(page.getByText(/Pending|En attente/)).toBeVisible();
	await page.goto(hostUrl);
	await expect(page.getByText(/Bingo claims to check|Bingo à vérifier/)).toBeVisible({
		timeout: 5000
	});
	await page.getByRole('button', { name: /Approve|Valider/ }).click();
	await expect(page.getByText(/Approved|Validé/)).toBeVisible({ timeout: 5000 });
	await page.goto(`${origin}/r/${slug}`);
	await expect(page.locator('.bingo-cell')).toHaveCount(16);
	await expect(page.getByRole('button', { name: /Bingo/ })).toHaveCount(0);
});

test('plays a Consensus round and scores the majority', async ({ page }) => {
	await page.goto('/host/new');
	await page.getByRole('textbox').fill(`Consensus ${Date.now()}`);
	await page.getByLabel(/The Consensus|Le Consensus/).check();
	await page.getByRole('button', { name: /Create room|Créer la room/ }).click();
	await expect(page).toHaveURL(/\/host\/[a-z0-9]{6}(\?|$)/);
	await expect(page.getByText(/The Consensus|Le Consensus/)).toBeVisible();

	const origin = new URL(page.url()).origin;
	const playerHref = await page.locator('a[href^="/r/"]').first().getAttribute('href');
	const hostUrl = page.url();
	if (!playerHref) throw new Error('Missing player link');
	const playerUrl = new URL(playerHref, origin);

	const launchResponse = page.waitForResponse((response) =>
		response.url().includes('?/launchConsensusRound')
	);
	await page
		.getByRole('button', { name: /Launch|Lancer/ })
		.first()
		.click();
	expect((await launchResponse).ok()).toBe(true);
	await page.reload();
	await expect(page.getByRole('button', { name: /Reveal|Révélation/ })).toBeEnabled();

	await page.goto(playerUrl.toString());
	await page.getByRole('textbox').fill('Consensus Player');
	await page.getByRole('button', { name: /Enter the room|Entrer dans la room/ }).click();
	await page.locator('button.answer-button').first().click();
	await expect(page.getByText(/Vote locked|Vote verrouillé/)).toBeVisible();

	await page.goto(hostUrl);
	const revealResponse = page.waitForResponse((response) =>
		response.url().includes('?/closeConsensusRound')
	);
	await page.getByRole('button', { name: /Reveal|Révélation/ }).click();
	expect((await revealResponse).ok()).toBe(true);
	await page.reload();
	await expect(page.getByText(/The majority has spoken|La majorité a parlé/)).toBeVisible({
		timeout: 5000
	});

	await page.goto(playerUrl.toString());
	await expect(page.getByText(/You read the room|Tu as senti la salle/)).toBeVisible({
		timeout: 5000
	});
	await expect(page.locator('.score-badge span')).toHaveText('100');

	await page.goto(hostUrl);
	const nextResponse = page.waitForResponse((response) =>
		response.url().includes('?/launchNextConsensusRound')
	);
	await page.getByRole('button', { name: /Next question|Question suivante/ }).click();
	expect((await nextResponse).ok()).toBe(true);

	await page.goto(playerUrl.toString());
	await expect(page.locator('button.answer-button')).toHaveCount(2);
	await expect(page.locator('button.answer-button').first()).toBeEnabled();
});
