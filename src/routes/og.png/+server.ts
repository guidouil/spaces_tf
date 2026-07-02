import { ogImageResponse } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	ogImageResponse({
		title: 'Live mini-games for your Space',
		subtitle:
			'Host a live quiz, Spaces Bingo, or Consensus game, share one link, and let listeners play in real time.',
		badge: 'Live games',
		meta: 'Quiz · Bingo · Consensus'
	});
