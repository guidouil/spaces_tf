import { redirect } from '@sveltejs/kit';
import { deleteHostedRoom, getHostedRooms, hostCookieName } from '$lib/server/game';
import type { Actions, PageServerLoad } from './$types';

const HOST_COOKIE_PREFIX = 'spaces_tf_host_';

export const load: PageServerLoad = async ({ cookies }) => {
	const hostTokens = new Map<string, string>();

	for (const cookie of cookies.getAll()) {
		if (!cookie.name.startsWith(HOST_COOKIE_PREFIX)) continue;
		hostTokens.set(cookie.name.slice(HOST_COOKIE_PREFIX.length), cookie.value);
	}

	return {
		rooms: await getHostedRooms(hostTokens)
	};
};

export const actions: Actions = {
	delete: async ({ request, cookies }) => {
		const form = await request.formData();
		const slug = String(form.get('slug') ?? '');
		const token = cookies.get(hostCookieName(slug));
		const result = await deleteHostedRoom(slug, token);

		if ('success' in result) {
			cookies.delete(hostCookieName(slug), { path: '/' });
			cookies.delete(hostCookieName(slug), { path: `/host/${slug}` });
			throw redirect(303, '/host');
		}

		return result;
	}
};
