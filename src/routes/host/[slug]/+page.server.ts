import { fail, redirect, type Cookies } from '@sveltejs/kit';
import * as m from '$lib/paraglide/messages';
import {
	answerQuestion,
	closeQuestion,
	createQuestion,
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
	requireHost
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
		(snapshot?.questions ?? []).map((question) => question.id)
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
