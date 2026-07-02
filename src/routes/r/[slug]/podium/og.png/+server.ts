import { error } from '@sveltejs/kit';
import { getPodium } from '$lib/server/game';
import { ogImageResponse } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const result = await getPodium(params.slug);
	if (!result) throw error(404, 'Room not found');

	const winner = result.podium[0];

	return ogImageResponse({
		title: result.room.title,
		subtitle: winner
			? `${winner.nickname} topped the podium with ${winner.score} points on Spaces.tf.`
			: 'The final podium is ready on Spaces.tf.',
		badge: 'Podium',
		accent: '#f7f139',
		meta: 'Final results'
	});
};
