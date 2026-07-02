import { fail, redirect, type Cookies } from '@sveltejs/kit';
import * as m from '$lib/paraglide/messages';
import {
	addBingoTile,
	answerQuestion,
	claimBingo,
	closeQuestion,
	createQuestion,
	deleteBingoTile,
	deleteQuestion,
	finishGame,
	getAnswersForQuestions,
	getPlayerForRoom,
	getQuizCategories,
	getSnapshot,
	hostCookieName,
	importQuestionsFromApi,
	joinOrCreatePlayer,
	launchQuestion,
	playerCookieName,
	requireHost,
	resolveBingoClaim,
	toggleBingoTile
} from '$lib/server/game';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, cookies }) => {
	const token = url.searchParams.get('token') ?? cookies.get(hostCookieName(params.slug));
	const room = await requireHost(params.slug, token);
	cookies.set(hostCookieName(room.slug), room.hostToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 30
	});

	const playerId = Number(cookies.get(playerCookieName(params.slug)));
	const hostPlayer = Number.isInteger(playerId)
		? await getPlayerForRoom(params.slug, playerId)
		: null;
	const snapshot = await getSnapshot(params.slug, {
		includeAnswers: true,
		playerId: hostPlayer?.id ?? null
	});
	const questionCounts = await getAnswersForQuestions(
		snapshot?.gameType === 'quiz' ? snapshot.questions.map((question) => question.id) : []
	);

	return {
		token: room.hostToken,
		joinUrl: `/r/${room.slug}`,
		snapshot,
		hostPlayer,
		quizCategories: await getQuizCategories(),
		questionAnswerCounts: Object.fromEntries(questionCounts)
	};
};

export const actions: Actions = {
	createQuestion: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		return createQuestion(params.slug, await request.formData());
	},
	importQuestions: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const source = String(form.get('source'));
		if (source !== 'opentdb' && source !== 'quizzapi') {
			return fail(400, { message: m.error_question_invalid() });
		}

		return importQuestionsFromApi(params.slug, {
			source,
			category: String(form.get('category') ?? ''),
			difficulty: String(form.get('difficulty') ?? '')
		});
	},
	joinAsPlayer: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const result = await joinOrCreatePlayer(params.slug, String(form.get('nickname') ?? '').trim());

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
	answerAsPlayer: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const choiceIndex = Number(form.get('choiceIndex'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!Number.isInteger(choiceIndex)) return fail(400, { message: m.error_invalid_answer() });

		return answerQuestion(params.slug, playerId, choiceIndex);
	},
	toggleBingoTileAsPlayer: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const tileId = Number(form.get('tileId'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!Number.isInteger(tileId)) return fail(400, { message: m.error_bingo_tile_not_found() });

		return toggleBingoTile(params.slug, playerId, tileId);
	},
	claimBingoAsPlayer: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const playerId = Number(cookies.get(playerCookieName(params.slug)));
		const line = parseBingoLine(form.get('line'));

		if (!Number.isInteger(playerId)) return fail(401, { message: m.error_join_before_playing() });
		if (!line) return fail(400, { message: m.error_bingo_line_invalid() });

		return claimBingo(params.slug, playerId, line);
	},
	launchQuestion: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const questionId = Number(form.get('questionId'));
		if (!Number.isInteger(questionId)) return fail(400, { message: m.error_question_invalid() });
		return launchQuestion(params.slug, questionId);
	},
	deleteQuestion: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const questionId = Number(form.get('questionId'));
		if (!Number.isInteger(questionId)) return fail(400, { message: m.error_question_invalid() });
		return deleteQuestion(params.slug, questionId);
	},
	closeQuestion: async ({ params, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		return closeQuestion(params.slug);
	},
	addBingoTile: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		return addBingoTile(params.slug, form.get('text'));
	},
	deleteBingoTile: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const tileId = Number(form.get('tileId'));
		if (!Number.isInteger(tileId)) return fail(400, { message: m.error_bingo_tile_not_found() });
		return deleteBingoTile(params.slug, tileId);
	},
	resolveBingoClaim: async ({ params, request, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const form = await request.formData();
		const claimId = Number(form.get('claimId'));
		const decision = String(form.get('decision'));

		if (!Number.isInteger(claimId)) return fail(400, { message: m.error_bingo_claim_not_found() });
		if (decision !== 'approved' && decision !== 'rejected') {
			return fail(400, { message: m.error_bingo_claim_not_found() });
		}

		return resolveBingoClaim(params.slug, claimId, decision);
	},
	finishGame: async ({ params, url, cookies }) => {
		await authorize(params.slug, url, cookies);
		const result = await finishGame(params.slug);
		if ('success' in result) throw redirect(303, `/r/${params.slug}/podium`);
		return result;
	}
};

async function authorize(slug: string, url: URL, cookies: Cookies) {
	const token = url.searchParams.get('token') ?? cookies.get(hostCookieName(slug));
	await requireHost(slug, token);
}

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
