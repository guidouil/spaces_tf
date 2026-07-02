import { ogImageResponse } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	ogImageResponse({
		title: 'Live mini-games for your Space',
		subtitle: 'Host a live quiz or Spaces Bingo, share one link, and let listeners play in real time.',
		badge: 'Live games',
		meta: 'Quiz · Bingo · Second screen'
	});
