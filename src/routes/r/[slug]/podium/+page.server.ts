import { error } from '@sveltejs/kit';
import { getPodium } from '$lib/server/game';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const result = await getPodium(params.slug);
	if (!result) throw error(404, 'Room introuvable');

	return result;
};
