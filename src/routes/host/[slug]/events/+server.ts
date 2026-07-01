import { error } from '@sveltejs/kit';
import { getSnapshot, hostCookieName, playerCookieName, requireHost } from '$lib/server/game';
import { snapshotStream, sseHeaders } from '$lib/server/sse';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const token = url.searchParams.get('token') ?? cookies.get(hostCookieName(params.slug));
	await requireHost(params.slug, token);
	const playerId = Number(cookies.get(playerCookieName(params.slug)));

	return new Response(
		snapshotStream(async () => {
			const snapshot = await getSnapshot(params.slug, {
				includeAnswers: true,
				playerId: Number.isInteger(playerId) ? playerId : null
			});
			if (!snapshot) throw error(404, 'Room introuvable');
			return snapshot;
		}),
		{ headers: sseHeaders }
	);
};
