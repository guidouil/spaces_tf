import { error } from '@sveltejs/kit';
import { getPodium } from '$lib/server/game';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const result = await getPodium(params.slug);
	if (!result) throw error(404, 'Room introuvable');

	const pageUrl = `${url.origin}/r/${params.slug}/podium`;

	return {
		...result,
		social: {
			title: `Podium - ${result.room.title} - Spaces.tf`,
			description:
				result.podium.length > 0
					? `See the final Spaces.tf podium for "${result.room.title}".`
					: `The final Spaces.tf podium for "${result.room.title}" is ready.`,
			url: pageUrl,
			image: `${pageUrl}/og.png`
		}
	};
};
