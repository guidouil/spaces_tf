import { redirect, type Actions } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import {
	cleanTitle,
	createRoom,
	getConsensusPacks,
	hostCookieName,
	normalizeGameType
} from '$lib/server/game';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const locale = getLocale();

	return {
		consensusPacks: getConsensusPacks(locale)
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const form = await request.formData();
		const locale = getLocale();
		const room = await createRoom(
			cleanTitle(form.get('title')),
			normalizeGameType(form.get('gameType')),
			locale,
			{ consensusPackId: String(form.get('consensusPackId') ?? '') }
		);

		cookies.set(hostCookieName(room.slug), room.hostToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, `/host/${room.slug}?token=${room.hostToken}`);
	}
};
