import { error } from '@sveltejs/kit';
import { getSnapshot, playerCookieName } from '$lib/server/game';
import { snapshotStream, sseHeaders } from '$lib/server/sse';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const playerId = Number(cookies.get(playerCookieName(params.slug)));

	return new Response(
		snapshotStream(async () => {
			const snapshot = await getSnapshot(params.slug, {
				playerId: Number.isInteger(playerId) ? playerId : null
			});
			if (!snapshot) throw error(404, 'Room introuvable');
			return snapshot;
		}),
		{ headers: sseHeaders }
	);
};
