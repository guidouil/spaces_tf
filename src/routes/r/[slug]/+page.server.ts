import { fail } from '@sveltejs/kit';
import * as m from '$lib/paraglide/messages';
import {
	answerQuestion,
	claimBingo,
	cleanNickname,
	getPlayerForRoom,
	getSnapshot,
	getRoomBySlug,
	joinRoom,
	playerCookieName,
	toggleBingoTile
} from '$lib/server/game';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const room = await getRoomBySlug(params.slug);
	const playerId = Number(cookies.get(playerCookieName(params.slug)));
	const player = Number.isInteger(playerId) ? await getPlayerForRoom(params.slug, playerId) : null;
	const snapshot = await getSnapshot(params.slug, { playerId: player?.id ?? null });

	return {
		roomExists: Boolean(room),
		player,
		snapshot
	};
};

export const actions: Actions = {
	join: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const result = await joinRoom(params.slug, cleanNickname(form.get('nickname')));

		if ('player' in result) {
			cookies.set(playerCookieName(params.slug), String(result.player.id), {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: false,
				maxAge: 60 * 60 * 24 * 14
			});
		}

		return result;
	},
	answer: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const choiceIndex = Number(form.get('choiceIndex'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!Number.isInteger(choiceIndex)) return fail(400, { message: m.error_invalid_answer() });

		return answerQuestion(params.slug, playerId, choiceIndex);
	},
	toggleBingoTile: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const tileId = Number(form.get('tileId'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!Number.isInteger(tileId)) return fail(400, { message: m.error_bingo_tile_not_found() });

		return toggleBingoTile(params.slug, playerId, tileId);
	},
	claimBingo: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const line = parseBingoLine(form.get('line'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!line) return fail(400, { message: m.error_bingo_line_invalid() });

		return claimBingo(params.slug, playerId, line);
	}
};

function parseBingoLine(value: FormDataEntryValue | null) {
	if (typeof value !== 'string') return null;

	try {
		const line = JSON.parse(value) as unknown;
		if (
			Array.isArray(line) &&
			line.length === 4 &&
			line.every((index) => Number.isInteger(index) && index >= 0 && index < 16)
		) {
			return line;
		}
	} catch {
		return null;
	}

	return null;
}
