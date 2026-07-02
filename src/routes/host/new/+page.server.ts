import { redirect, type Actions } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { cleanTitle, createRoom, hostCookieName, normalizeGameType } from '$lib/server/game';

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const form = await request.formData();
		const room = await createRoom(
			cleanTitle(form.get('title')),
			normalizeGameType(form.get('gameType')),
			getLocale()
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
