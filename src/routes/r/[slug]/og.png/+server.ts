import { error } from '@sveltejs/kit';
import { getSnapshot } from '$lib/server/game';
import { ogImageResponse } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const snapshot = await getSnapshot(params.slug);
	if (!snapshot) throw error(404, 'Room not found');

	const playerCount = snapshot.players.length;
	const details =
		snapshot.gameType === 'bingo'
			? {
					subtitle: 'Join this Spaces Bingo room and mark the moments as they happen live.',
					badge: 'Spaces Bingo',
					accent: '#ff6f3c'
				}
			: snapshot.gameType === 'consensus'
				? {
						subtitle: 'Join this Consensus room, guess the majority, and read the room live.',
						badge: 'The Consensus',
						accent: '#f7f139'
					}
				: {
						subtitle: 'Join this live quiz room, pick a nickname, and answer in real time.',
						badge: 'Live Quiz',
						accent: '#18e0c2'
					};

	return ogImageResponse({
		title: snapshot.room.title,
		subtitle: details.subtitle,
		badge: details.badge,
		accent: details.accent,
		meta: `${playerCount} ${playerCount === 1 ? 'player' : 'players'} · ${snapshot.room.status}`
	});
};
