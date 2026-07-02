import { error } from '@sveltejs/kit';
import { getSnapshot } from '$lib/server/game';
import { ogImageResponse } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const snapshot = await getSnapshot(params.slug);
	if (!snapshot) throw error(404, 'Room not found');

	const isBingo = snapshot.gameType === 'bingo';
	const playerCount = snapshot.players.length;

	return ogImageResponse({
		title: snapshot.room.title,
		subtitle: isBingo
			? 'Join this Spaces Bingo room and mark the moments as they happen live.'
			: 'Join this live quiz room, pick a nickname, and answer in real time.',
		badge: isBingo ? 'Spaces Bingo' : 'Live Quiz',
		accent: isBingo ? '#ff6f3c' : '#18e0c2',
		meta: `${playerCount} ${playerCount === 1 ? 'player' : 'players'} · ${snapshot.room.status}`
	});
};
