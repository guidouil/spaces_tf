import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
	BINGO_CARD_CELL_COUNT,
	BINGO_SIZE,
	generateBingoCard,
	getCompletedBingoLines,
	isValidBingoLine,
	toggleBingoCell,
	type BingoCardCell
} from '$lib/game/bingo';
import * as m from '$lib/paraglide/messages';
import { db } from '$lib/server/db';
import {
	answers,
	bingoCards,
	bingoClaims,
	bingoTiles,
	players,
	questions,
	rooms
} from '$lib/server/db/schema';

const SCORE_CORRECT = 100;
const HOST_COOKIE_PREFIX = 'spaces_tf_host_';
const PLAYER_COOKIE_PREFIX = 'spaces_tf_player_';

export type GameType = 'quiz' | 'bingo';

export type PublicRoom = {
	id: number;
	slug: string;
	title: string;
	gameType: GameType;
	status: string;
	activeQuestionId: number | null;
};

export type HostedRoom = PublicRoom & {
	createdAt: string;
	updatedAt: string;
};

export type PublicPlayer = {
	id: number;
	nickname: string;
	score: number;
};

export type PublicQuestion = {
	id: number;
	text: string;
	choices: string[];
	status: string;
	startedAt: string | null;
	closedAt: string | null;
	correctChoiceIndex?: number;
};

export type PublicAnswer = {
	choiceIndex: number;
	isCorrect: boolean;
	scoreDelta: number;
	answeredAt: string;
};

export type PublicBingoTile = {
	id: number;
	text: string;
};

export type PublicBingoCard = {
	id: number;
	size: number;
	cells: BingoCardCell[];
};

export type PublicBingoClaim = {
	id: number;
	playerId: number;
	nickname: string;
	line: number[];
	status: string;
	createdAt: string;
	decidedAt: string | null;
};

type BaseGameSnapshot = {
	room: PublicRoom;
	players: PublicPlayer[];
	leaderboard: PublicPlayer[];
	currentPlayer: PublicPlayer | null;
	podium: PublicPlayer[];
};

export type QuizGameSnapshot = BaseGameSnapshot & {
	gameType: 'quiz';
	activeQuestion: PublicQuestion | null;
	currentPlayerAnswer: PublicAnswer | null;
	questions: PublicQuestion[];
};

export type BingoGameSnapshot = BaseGameSnapshot & {
	gameType: 'bingo';
	bingoCard: PublicBingoCard | null;
	bingoTiles: PublicBingoTile[];
	bingoClaims: PublicBingoClaim[];
	pendingBingoClaims: PublicBingoClaim[];
	bingoCompletedLines: number[][];
	bingoCanClaim: boolean;
};

export type GameSnapshot = QuizGameSnapshot | BingoGameSnapshot;

export type QuizCategoryOption = {
	id: string;
	name: string;
};

export type QuizImportOptions = {
	source: 'opentdb' | 'quizzapi';
	category?: string;
	difficulty?: string;
};

const OPEN_TDB_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const QUIZZAPI_DIFFICULTIES = new Set(['facile', 'normal', 'difficile']);
const QUIZ_BATCH_SIZE = 10;
const QUIZ_IMPORT_ROOM_COOLDOWN_MS = 30_000;
const QUIZ_IMPORT_SOURCE_COOLDOWN_MS = 5_000;
const QUIZ_CATEGORIES_CACHE_MS = 15 * 60_000;
const importRoomRateLimits = new Map<string, number>();
const importSourceRateLimits = new Map<QuizImportOptions['source'], number>();
let quizCategoriesCache: {
	expiresAt: number;
	value: Awaited<ReturnType<typeof fetchQuizCategories>>;
} | null = null;
let quizCategoriesRequest: Promise<Awaited<ReturnType<typeof fetchQuizCategories>>> | null = null;

export function hostCookieName(slug: string) {
	return `${HOST_COOKIE_PREFIX}${slug}`;
}

export function playerCookieName(slug: string) {
	return `${PLAYER_COOKIE_PREFIX}${slug}`;
}

export function cleanNickname(value: FormDataEntryValue | null) {
	return String(value ?? '')
		.trim()
		.replace(/\s+/g, ' ');
}

export function validateNickname(value: string) {
	if (value.length < 2) return m.error_nickname_short();
	if (value.length > 24) return m.error_nickname_long();
	if (!/^[\p{L}\p{N} _.-]+$/u.test(value)) return m.error_nickname_simple();
	return null;
}

export function cleanTitle(value: FormDataEntryValue | null) {
	const title = String(value ?? '')
		.trim()
		.replace(/\s+/g, ' ');

	return title || m.default_room_title();
}

export function validateChoices(values: FormDataEntryValue[]) {
	const choices = values
		.map((value) =>
			String(value ?? '')
				.trim()
				.replace(/\s+/g, ' ')
		)
		.filter(Boolean);

	if (choices.length < 2) return { error: m.error_min_choices(), choices };
	if (choices.length > 4) return { error: m.error_max_choices(), choices };
	if (choices.some((choice) => choice.length > 120)) {
		return { error: m.error_choice_too_long(), choices };
	}

	return { error: null, choices };
}

export function normalizeGameType(value: FormDataEntryValue | string | null | undefined): GameType {
	return value === 'bingo' ? 'bingo' : 'quiz';
}

export async function createRoom(title: string, gameType: GameType = 'quiz') {
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const slug = makeSlug();
		const hostToken = randomToken();

		try {
			const room = await db.transaction(async (tx) => {
				const [createdRoom] = await tx
					.insert(rooms)
					.values({ slug, title: title.slice(0, 80), hostToken, gameType })
					.returning();

				if (gameType === 'bingo') {
					await tx.insert(bingoTiles).values(
						getDefaultBingoTileTexts().map((text) => ({
							roomId: createdRoom.id,
							text
						}))
					);
				}

				return createdRoom;
			});

			return room;
		} catch (error) {
			if (attempt === 4) throw error;
		}
	}

	throw new Error(m.error_room_create());
}

export async function getRoomBySlug(slug: string) {
	const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
	return room ?? null;
}

export async function getHostedRooms(hostTokens: Map<string, string>): Promise<HostedRoom[]> {
	const slugs = Array.from(hostTokens.keys());
	if (slugs.length === 0) return [];

	const hostedRooms = await db
		.select()
		.from(rooms)
		.where(inArray(rooms.slug, slugs))
		.orderBy(desc(rooms.updatedAt));

	return hostedRooms
		.filter((room) => hostTokens.get(room.slug) === room.hostToken)
		.map((room) => ({
			id: room.id,
			slug: room.slug,
			title: room.title,
			gameType: normalizeGameType(room.gameType),
			status: room.status,
			activeQuestionId: room.activeQuestionId,
			createdAt: room.createdAt.toISOString(),
			updatedAt: room.updatedAt.toISOString()
		}));
}

export async function deleteHostedRoom(slug: string, token: string | null | undefined) {
	if (!token) return fail(403, { message: m.error_room_not_found() });

	const deletedRooms = await db
		.delete(rooms)
		.where(and(eq(rooms.slug, slug), eq(rooms.hostToken, token)))
		.returning({ slug: rooms.slug });

	if (deletedRooms.length === 0) return fail(404, { message: m.error_room_not_found() });

	return { success: true, slug };
}

export async function requireHost(slug: string, token: string | null | undefined) {
	const room = await getRoomBySlug(slug);

	if (!room) throw redirect(303, '/?error=room-not-found');
	if (!token || token !== room.hostToken) throw redirect(303, `/r/${slug}`);

	return room;
}

export async function joinRoom(slug: string, nickname: string) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found(), nickname });

	const validationError = validateNickname(nickname);
	if (validationError) return fail(400, { message: validationError, nickname });

	try {
		const [player] = await db.insert(players).values({ roomId: room.id, nickname }).returning();

		return { room, player };
	} catch {
		return fail(409, { message: m.error_duplicate_nickname(), nickname });
	}
}

export async function joinOrCreatePlayer(slug: string, nickname: string) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found(), nickname });

	const validationError = validateNickname(nickname);
	if (validationError) return fail(400, { message: validationError, nickname });

	try {
		const [player] = await db.insert(players).values({ roomId: room.id, nickname }).returning();

		return { room, player };
	} catch {
		return fail(409, { message: m.error_duplicate_nickname(), nickname });
	}
}

export async function getPlayerForRoom(slug: string, playerId: number | null) {
	if (!playerId) return null;

	const room = await getRoomBySlug(slug);
	if (!room) return null;

	const [player] = await db
		.select()
		.from(players)
		.where(and(eq(players.id, playerId), eq(players.roomId, room.id)))
		.limit(1);

	return player ?? null;
}

export async function createQuestion(slug: string, input: FormData) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });

	const text = String(input.get('text') ?? '')
		.trim()
		.replace(/\s+/g, ' ');
	const { error, choices } = validateChoices(input.getAll('choice'));
	const correctChoiceIndex = Number(input.get('correctChoiceIndex'));

	if (text.length < 6) return fail(400, { message: m.error_question_short() });
	if (text.length > 220) return fail(400, { message: m.error_question_long() });
	if (error) return fail(400, { message: error });
	if (
		!Number.isInteger(correctChoiceIndex) ||
		correctChoiceIndex < 0 ||
		correctChoiceIndex >= choices.length
	) {
		return fail(400, { message: m.error_choose_correct() });
	}

	await db.insert(questions).values({
		roomId: room.id,
		text,
		choices,
		correctChoiceIndex
	});

	return { success: true };
}

export async function importQuestionsFromApi(slug: string, options: QuizImportOptions) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });

	const rateLimit = consumeQuizImportRateLimit(room.id, options.source);
	if (rateLimit) {
		return fail(429, {
			message: m.error_api_rate_limited({ seconds: Math.ceil(rateLimit.waitMs / 1000) })
		});
	}

	let importedQuestions: Array<{ text: string; choices: string[]; correctChoiceIndex: number }>;

	try {
		importedQuestions =
			options.source === 'quizzapi'
				? await fetchFrenchQuizQuestions(options)
				: await fetchOpenTdbQuestions(options);
	} catch {
		return fail(502, { message: m.error_api_unavailable() });
	}

	if (importedQuestions.length === 0) return fail(502, { message: m.error_api_no_questions() });

	await db.transaction(async (tx) => {
		await tx.insert(questions).values(
			importedQuestions.map((question) => ({
				roomId: room.id,
				...question
			}))
		);
		await tx.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));
	});

	return { success: true, importedCount: importedQuestions.length };
}

export async function deleteQuestion(slug: string, questionId: number) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });

	const [deletedQuestion] = await db
		.delete(questions)
		.where(and(eq(questions.id, questionId), eq(questions.roomId, room.id)))
		.returning({ id: questions.id });

	if (!deletedQuestion) return fail(404, { message: m.error_question_not_found() });

	if (room.activeQuestionId === questionId) {
		await db
			.update(rooms)
			.set({ status: 'waiting', activeQuestionId: null, updatedAt: new Date() })
			.where(eq(rooms.id, room.id));
	} else {
		await db.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));
	}

	return { success: true };
}

export async function launchQuestion(slug: string, questionId: number) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });

	const [question] = await db
		.select()
		.from(questions)
		.where(and(eq(questions.id, questionId), eq(questions.roomId, room.id)))
		.limit(1);

	if (!question) return fail(404, { message: m.error_question_not_found() });

	await db.transaction(async (tx) => {
		await tx
			.update(questions)
			.set({ status: 'closed', closedAt: new Date() })
			.where(and(eq(questions.roomId, room.id), eq(questions.status, 'active')));
		await tx
			.update(questions)
			.set({ status: 'active', startedAt: new Date(), closedAt: null })
			.where(eq(questions.id, question.id));
		await tx
			.update(rooms)
			.set({ status: 'live', activeQuestionId: question.id, updatedAt: new Date() })
			.where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function closeQuestion(slug: string) {
	const room = await getRoomBySlug(slug);
	if (!room || !room.activeQuestionId) return { success: true };

	await db.transaction(async (tx) => {
		await tx
			.update(questions)
			.set({ status: 'closed', closedAt: new Date() })
			.where(eq(questions.id, room.activeQuestionId!));
		await tx
			.update(rooms)
			.set({ status: 'waiting', activeQuestionId: null, updatedAt: new Date() })
			.where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function finishGame(slug: string) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });

	await db.transaction(async (tx) => {
		await tx
			.update(questions)
			.set({ status: 'closed', closedAt: new Date() })
			.where(and(eq(questions.roomId, room.id), eq(questions.status, 'active')));
		await tx
			.update(rooms)
			.set({ status: 'finished', activeQuestionId: null, updatedAt: new Date() })
			.where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function answerQuestion(slug: string, playerId: number | null, choiceIndex: number) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });
	if (!playerId) return fail(401, { message: m.error_join_before_playing() });
	if (!room.activeQuestionId) return fail(409, { message: m.error_too_late() });

	const [player] = await db
		.select()
		.from(players)
		.where(and(eq(players.id, playerId), eq(players.roomId, room.id)))
		.limit(1);
	if (!player) return fail(401, { message: m.error_join_before_playing() });

	const [question] = await db
		.select()
		.from(questions)
		.where(and(eq(questions.id, room.activeQuestionId), eq(questions.status, 'active')))
		.limit(1);
	if (!question) return fail(409, { message: m.error_too_late() });
	if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length) {
		return fail(400, { message: m.error_invalid_answer() });
	}

	const isCorrect = choiceIndex === question.correctChoiceIndex;
	const scoreDelta = isCorrect ? SCORE_CORRECT : 0;

	try {
		await db.transaction(async (tx) => {
			await tx.insert(answers).values({
				questionId: question.id,
				playerId: player.id,
				choiceIndex,
				isCorrect,
				scoreDelta
			});

			if (scoreDelta > 0) {
				await tx
					.update(players)
					.set({ score: player.score + scoreDelta })
					.where(eq(players.id, player.id));
			}
		});
	} catch {
		return fail(409, { message: m.error_already_answered() });
	}

	return { success: true, isCorrect };
}

export async function addBingoTile(slug: string, value: FormDataEntryValue | null) {
	const room = await getRoomBySlug(slug);
	if (!room || normalizeGameType(room.gameType) !== 'bingo') {
		return fail(404, { message: m.error_room_not_found() });
	}

	const text = cleanBingoTileText(value);
	if (text.length < 3) return fail(400, { message: m.error_bingo_tile_short() });
	if (text.length > 80) return fail(400, { message: m.error_bingo_tile_long() });

	await db.transaction(async (tx) => {
		await tx.insert(bingoTiles).values({ roomId: room.id, text });
		await tx.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function deleteBingoTile(slug: string, tileId: number) {
	const room = await getRoomBySlug(slug);
	if (!room || normalizeGameType(room.gameType) !== 'bingo') {
		return fail(404, { message: m.error_room_not_found() });
	}

	const roomTiles = await db.select().from(bingoTiles).where(eq(bingoTiles.roomId, room.id));
	if (roomTiles.length <= BINGO_CARD_CELL_COUNT) {
		return fail(400, { message: m.error_bingo_min_tiles() });
	}

	const [deletedTile] = await db
		.delete(bingoTiles)
		.where(and(eq(bingoTiles.id, tileId), eq(bingoTiles.roomId, room.id)))
		.returning({ id: bingoTiles.id });

	if (!deletedTile) return fail(404, { message: m.error_bingo_tile_not_found() });

	await db.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));

	return { success: true };
}

export async function toggleBingoTile(slug: string, playerId: number | null, tileId: number) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });
	if (normalizeGameType(room.gameType) !== 'bingo') {
		return fail(400, { message: m.error_bingo_action_invalid() });
	}
	if (room.status === 'finished') return fail(409, { message: m.error_game_finished() });
	if (!playerId) return fail(401, { message: m.error_join_before_playing() });

	const player = await getPlayerForRoom(slug, playerId);
	if (!player) return fail(401, { message: m.error_join_before_playing() });

	const card = await getOrCreateBingoCard(room.id, player.id);
	if (!card.cells.some((cell) => cell.tileId === tileId)) {
		return fail(400, { message: m.error_bingo_tile_not_found() });
	}

	await db.transaction(async (tx) => {
		await tx
			.update(bingoCards)
			.set({ cells: toggleBingoCell(card.cells, tileId), updatedAt: new Date() })
			.where(eq(bingoCards.id, card.id));
		await tx.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function claimBingo(slug: string, playerId: number | null, line: number[]) {
	const room = await getRoomBySlug(slug);
	if (!room) return fail(404, { message: m.error_room_not_found() });
	if (normalizeGameType(room.gameType) !== 'bingo') {
		return fail(400, { message: m.error_bingo_action_invalid() });
	}
	if (room.status === 'finished') return fail(409, { message: m.error_game_finished() });
	if (!playerId) return fail(401, { message: m.error_join_before_playing() });

	const player = await getPlayerForRoom(slug, playerId);
	if (!player) return fail(401, { message: m.error_join_before_playing() });

	const [pendingClaim] = await db
		.select()
		.from(bingoClaims)
		.where(
			and(
				eq(bingoClaims.roomId, room.id),
				eq(bingoClaims.playerId, player.id),
				eq(bingoClaims.status, 'pending')
			)
		)
		.limit(1);
	if (pendingClaim) return fail(409, { message: m.error_bingo_claim_pending() });

	const card = await getOrCreateBingoCard(room.id, player.id);
	if (!isValidBingoLine(card.cells, line)) {
		return fail(400, { message: m.error_bingo_line_invalid() });
	}

	await db.transaction(async (tx) => {
		await tx.insert(bingoClaims).values({ roomId: room.id, playerId: player.id, line });
		await tx
			.update(rooms)
			.set({ status: 'live', updatedAt: new Date() })
			.where(eq(rooms.id, room.id));
	});

	return { success: true };
}

export async function resolveBingoClaim(
	slug: string,
	claimId: number,
	decision: 'approved' | 'rejected'
) {
	const room = await getRoomBySlug(slug);
	if (!room || normalizeGameType(room.gameType) !== 'bingo') {
		return fail(404, { message: m.error_room_not_found() });
	}

	const [claim] = await db
		.select()
		.from(bingoClaims)
		.where(
			and(
				eq(bingoClaims.id, claimId),
				eq(bingoClaims.roomId, room.id),
				eq(bingoClaims.status, 'pending')
			)
		)
		.limit(1);
	if (!claim) return fail(404, { message: m.error_bingo_claim_not_found() });

	await db.transaction(async (tx) => {
		await tx
			.update(bingoClaims)
			.set({ status: decision, decidedAt: new Date() })
			.where(eq(bingoClaims.id, claim.id));

		if (decision === 'approved') {
			await tx.update(players).set({ score: 0 }).where(eq(players.roomId, room.id));
			await tx.update(players).set({ score: 1 }).where(eq(players.id, claim.playerId));
			await tx
				.update(rooms)
				.set({ status: 'finished', updatedAt: new Date() })
				.where(eq(rooms.id, room.id));
		} else {
			await tx.update(rooms).set({ updatedAt: new Date() }).where(eq(rooms.id, room.id));
		}
	});

	return { success: true };
}

export async function getSnapshot(
	slug: string,
	options: { playerId?: number | null; includeAnswers?: boolean } = {}
) {
	const room = await getRoomBySlug(slug);
	if (!room) return null;

	if (normalizeGameType(room.gameType) === 'bingo') {
		return getBingoSnapshot(room, options);
	}

	return getQuizSnapshot(room, options);
}

async function getQuizSnapshot(
	room: typeof rooms.$inferSelect,
	options: { playerId?: number | null; includeAnswers?: boolean } = {}
) {
	const [roomPlayers, roomQuestions] = await Promise.all([
		db
			.select()
			.from(players)
			.where(eq(players.roomId, room.id))
			.orderBy(desc(players.score), players.createdAt),
		db
			.select()
			.from(questions)
			.where(eq(questions.roomId, room.id))
			.orderBy(desc(questions.createdAt))
	]);

	const activeQuestion = room.activeQuestionId
		? roomQuestions.find((question) => question.id === room.activeQuestionId)
		: null;
	const currentPlayer = options.playerId
		? (roomPlayers.find((player) => player.id === options.playerId) ?? null)
		: null;

	let currentPlayerAnswer: PublicAnswer | null = null;
	if (currentPlayer && activeQuestion) {
		const [answer] = await db
			.select()
			.from(answers)
			.where(and(eq(answers.questionId, activeQuestion.id), eq(answers.playerId, currentPlayer.id)))
			.limit(1);

		currentPlayerAnswer = answer
			? {
					choiceIndex: answer.choiceIndex,
					isCorrect: answer.isCorrect,
					scoreDelta: answer.scoreDelta,
					answeredAt: answer.answeredAt.toISOString()
				}
			: null;
	}

	return {
		gameType: 'quiz' as const,
		room: toPublicRoom(room),
		players: roomPlayers.map(toPublicPlayer),
		leaderboard: roomPlayers.slice(0, 5).map(toPublicPlayer),
		activeQuestion: activeQuestion
			? toPublicQuestion(
					activeQuestion,
					options.includeAnswers || activeQuestion.status !== 'active'
				)
			: null,
		currentPlayer: currentPlayer ? toPublicPlayer(currentPlayer) : null,
		currentPlayerAnswer,
		podium: roomPlayers.slice(0, 3).map(toPublicPlayer),
		questions: roomQuestions.map((question) => toPublicQuestion(question, true))
	};
}

async function getBingoSnapshot(
	room: typeof rooms.$inferSelect,
	options: { playerId?: number | null } = {}
): Promise<BingoGameSnapshot> {
	const roomPlayers = await db
		.select()
		.from(players)
		.where(eq(players.roomId, room.id))
		.orderBy(desc(players.score), players.createdAt);
	const currentPlayer = options.playerId
		? (roomPlayers.find((player) => player.id === options.playerId) ?? null)
		: null;
	const [tiles, claims] = await Promise.all([
		db.select().from(bingoTiles).where(eq(bingoTiles.roomId, room.id)),
		db
			.select()
			.from(bingoClaims)
			.where(eq(bingoClaims.roomId, room.id))
			.orderBy(desc(bingoClaims.createdAt))
	]);

	const card = currentPlayer ? await getOrCreateBingoCard(room.id, currentPlayer.id) : null;
	const completedLines = card ? getCompletedBingoLines(card.cells) : [];
	const publicClaims = claims.map((claim) => {
		const player = roomPlayers.find((roomPlayer) => roomPlayer.id === claim.playerId);
		return toPublicBingoClaim(claim, player?.nickname ?? m.unknown_player());
	});

	return {
		gameType: 'bingo',
		room: toPublicRoom(room),
		players: roomPlayers.map(toPublicPlayer),
		leaderboard: roomPlayers.slice(0, 5).map(toPublicPlayer),
		currentPlayer: currentPlayer ? toPublicPlayer(currentPlayer) : null,
		podium: roomPlayers.slice(0, 3).map(toPublicPlayer),
		bingoCard: card,
		bingoTiles: tiles.map(toPublicBingoTile),
		bingoClaims: publicClaims,
		pendingBingoClaims: publicClaims.filter((claim) => claim.status === 'pending'),
		bingoCompletedLines: completedLines,
		bingoCanClaim: room.status !== 'finished' && completedLines.length > 0
	};
}

export async function getPodium(slug: string) {
	const room = await getRoomBySlug(slug);
	if (!room) return null;

	const podium = await db
		.select()
		.from(players)
		.where(eq(players.roomId, room.id))
		.orderBy(desc(players.score), players.createdAt)
		.limit(10);

	return { room, podium: podium.map(toPublicPlayer) };
}

export async function getAnswersForQuestions(questionIds: number[]) {
	if (questionIds.length === 0) return new Map<number, number>();

	const allAnswers = await db
		.select()
		.from(answers)
		.where(inArray(answers.questionId, questionIds));
	const counts = new Map<number, number>();
	for (const answer of allAnswers) {
		counts.set(answer.questionId, (counts.get(answer.questionId) ?? 0) + 1);
	}

	return counts;
}

export async function getQuizCategories() {
	const now = Date.now();
	if (quizCategoriesCache && quizCategoriesCache.expiresAt > now) return quizCategoriesCache.value;
	if (quizCategoriesRequest) return quizCategoriesRequest;

	quizCategoriesRequest = fetchQuizCategories()
		.then((categories) => {
			quizCategoriesCache = {
				expiresAt: Date.now() + QUIZ_CATEGORIES_CACHE_MS,
				value: categories
			};
			return categories;
		})
		.finally(() => {
			quizCategoriesRequest = null;
		});

	return quizCategoriesRequest;
}

async function fetchQuizCategories() {
	const [openTdbCategories, frenchCategories] = await Promise.all([
		fetchOpenTdbCategories(),
		fetchFrenchQuizCategories()
	]);

	return {
		opentdb: openTdbCategories,
		quizzapi: frenchCategories
	};
}

function consumeQuizImportRateLimit(roomId: number, source: QuizImportOptions['source']) {
	const now = Date.now();
	const roomKey = `${roomId}:${source}`;
	const roomAvailableAt = importRoomRateLimits.get(roomKey) ?? 0;
	const sourceAvailableAt = importSourceRateLimits.get(source) ?? 0;
	const waitMs = Math.max(roomAvailableAt - now, sourceAvailableAt - now);

	if (waitMs > 0) return { waitMs };

	importRoomRateLimits.set(roomKey, now + QUIZ_IMPORT_ROOM_COOLDOWN_MS);
	importSourceRateLimits.set(source, now + QUIZ_IMPORT_SOURCE_COOLDOWN_MS);
	pruneExpiredRateLimits(now);

	return null;
}

function pruneExpiredRateLimits(now: number) {
	for (const [key, availableAt] of importRoomRateLimits) {
		if (availableAt <= now) importRoomRateLimits.delete(key);
	}

	for (const [key, availableAt] of importSourceRateLimits) {
		if (availableAt <= now) importSourceRateLimits.delete(key);
	}
}

function makeSlug() {
	const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
	return Array.from(
		{ length: 6 },
		() => alphabet[Math.floor(Math.random() * alphabet.length)]
	).join('');
}

async function fetchOpenTdbCategories(): Promise<QuizCategoryOption[]> {
	try {
		const response = await fetch('https://opentdb.com/api_category.php');
		if (!response.ok) return [];

		const payload = (await response.json()) as {
			trivia_categories?: Array<{ id: number; name: string }>;
		};

		return (
			payload.trivia_categories?.map((category) => ({
				id: String(category.id),
				name: category.name
			})) ?? []
		);
	} catch {
		return [];
	}
}

async function fetchFrenchQuizCategories(): Promise<QuizCategoryOption[]> {
	try {
		const response = await fetch('https://quizzapi.jomoreschi.fr/api/v2/quiz/categories');
		if (!response.ok) return [];

		const payload = (await response.json()) as Array<{ name: string; slug: string }>;

		return payload.map((category) => ({
			id: category.slug,
			name: category.name
		}));
	} catch {
		return [];
	}
}

async function fetchOpenTdbQuestions(options: QuizImportOptions) {
	const url = new URL('https://opentdb.com/api.php');
	url.searchParams.set('amount', String(QUIZ_BATCH_SIZE));
	url.searchParams.set('type', 'multiple');
	url.searchParams.set('encode', 'url3986');

	if (options.category && /^\d+$/.test(options.category)) {
		url.searchParams.set('category', options.category);
	}
	if (options.difficulty && OPEN_TDB_DIFFICULTIES.has(options.difficulty)) {
		url.searchParams.set('difficulty', options.difficulty);
	}

	const response = await fetch(url);
	if (!response.ok) throw new Error('OpenTDB request failed');

	const payload = (await response.json()) as {
		response_code: number;
		results?: Array<{
			question: string;
			correct_answer: string;
			incorrect_answers: string[];
		}>;
	};

	if (payload.response_code !== 0) return [];

	return normalizeImportedQuestions(
		(payload.results ?? []).map((question) => ({
			text: decodeURIComponent(question.question),
			correctAnswer: decodeURIComponent(question.correct_answer),
			incorrectAnswers: question.incorrect_answers.map((answer) => decodeURIComponent(answer))
		}))
	);
}

async function fetchFrenchQuizQuestions(options: QuizImportOptions) {
	const url = new URL('https://quizzapi.jomoreschi.fr/api/v2/quiz');
	url.searchParams.set('limit', String(QUIZ_BATCH_SIZE));

	if (options.category) url.searchParams.set('category', options.category);
	if (options.difficulty && QUIZZAPI_DIFFICULTIES.has(options.difficulty)) {
		url.searchParams.set('difficulty', options.difficulty);
	}

	const response = await fetch(url);
	if (!response.ok) throw new Error('QuizzAPI request failed');

	const payload = (await response.json()) as {
		quizzes?: Array<{
			question: string;
			answer: string;
			badAnswers: string[];
		}>;
	};

	return normalizeImportedQuestions(
		(payload.quizzes ?? []).map((question) => ({
			text: question.question,
			correctAnswer: question.answer,
			incorrectAnswers: question.badAnswers
		}))
	);
}

function normalizeImportedQuestions(
	importedQuestions: Array<{ text: string; correctAnswer: string; incorrectAnswers: string[] }>
) {
	return importedQuestions
		.map((question) => {
			const choices = shuffleChoices([
				question.correctAnswer,
				...question.incorrectAnswers.filter(Boolean).slice(0, 3)
			]).slice(0, 4);
			const correctChoiceIndex = choices.indexOf(question.correctAnswer);

			return {
				text: cleanImportedText(question.text).slice(0, 220),
				choices: choices.map((choice) => cleanImportedText(choice).slice(0, 120)),
				correctChoiceIndex
			};
		})
		.filter(
			(question) =>
				question.text.length >= 6 &&
				question.choices.length >= 2 &&
				question.correctChoiceIndex >= 0
		);
}

function cleanImportedText(value: string) {
	return value.trim().replace(/\s+/g, ' ');
}

function cleanBingoTileText(value: FormDataEntryValue | null) {
	return String(value ?? '')
		.trim()
		.replace(/\s+/g, ' ');
}

function shuffleChoices(choices: string[]) {
	const shuffled = [...choices];

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const target = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
	}

	return shuffled;
}

function randomToken() {
	return randomBytes(24).toString('base64url');
}

function toPublicRoom(room: typeof rooms.$inferSelect): PublicRoom {
	return {
		id: room.id,
		slug: room.slug,
		title: room.title,
		gameType: normalizeGameType(room.gameType),
		status: room.status,
		activeQuestionId: room.activeQuestionId
	};
}

function toPublicPlayer(player: typeof players.$inferSelect): PublicPlayer {
	return {
		id: player.id,
		nickname: player.nickname,
		score: player.score
	};
}

function toPublicQuestion(
	question: typeof questions.$inferSelect,
	includeAnswer: boolean
): PublicQuestion {
	return {
		id: question.id,
		text: question.text,
		choices: question.choices,
		status: question.status,
		startedAt: question.startedAt?.toISOString() ?? null,
		closedAt: question.closedAt?.toISOString() ?? null,
		...(includeAnswer ? { correctChoiceIndex: question.correctChoiceIndex } : {})
	};
}

function toPublicBingoTile(tile: typeof bingoTiles.$inferSelect): PublicBingoTile {
	return {
		id: tile.id,
		text: tile.text
	};
}

function toPublicBingoClaim(
	claim: typeof bingoClaims.$inferSelect,
	nickname: string
): PublicBingoClaim {
	return {
		id: claim.id,
		playerId: claim.playerId,
		nickname,
		line: claim.line,
		status: claim.status,
		createdAt: claim.createdAt.toISOString(),
		decidedAt: claim.decidedAt?.toISOString() ?? null
	};
}

async function getOrCreateBingoCard(roomId: number, playerId: number): Promise<PublicBingoCard> {
	const existingCard = await getBingoCard(roomId, playerId);
	if (existingCard) return existingCard;

	const tiles = await db.select().from(bingoTiles).where(eq(bingoTiles.roomId, roomId));
	if (tiles.length < BINGO_CARD_CELL_COUNT) {
		throw new Error('Bingo room does not have enough tiles.');
	}

	try {
		const [card] = await db
			.insert(bingoCards)
			.values({
				roomId,
				playerId,
				cells: generateBingoCard(tiles.map(toPublicBingoTile))
			})
			.returning();

		return toPublicBingoCard(card);
	} catch {
		const card = await getBingoCard(roomId, playerId);
		if (card) return card;
		throw new Error('Could not create bingo card.');
	}
}

async function getBingoCard(roomId: number, playerId: number) {
	const [card] = await db
		.select()
		.from(bingoCards)
		.where(and(eq(bingoCards.roomId, roomId), eq(bingoCards.playerId, playerId)))
		.limit(1);

	return card ? toPublicBingoCard(card) : null;
}

function toPublicBingoCard(card: typeof bingoCards.$inferSelect): PublicBingoCard {
	return {
		id: card.id,
		size: BINGO_SIZE,
		cells: card.cells
	};
}

function getDefaultBingoTileTexts() {
	return [
		m.bingo_default_tile_01(),
		m.bingo_default_tile_02(),
		m.bingo_default_tile_03(),
		m.bingo_default_tile_04(),
		m.bingo_default_tile_05(),
		m.bingo_default_tile_06(),
		m.bingo_default_tile_07(),
		m.bingo_default_tile_08(),
		m.bingo_default_tile_09(),
		m.bingo_default_tile_10(),
		m.bingo_default_tile_11(),
		m.bingo_default_tile_12(),
		m.bingo_default_tile_13(),
		m.bingo_default_tile_14(),
		m.bingo_default_tile_15(),
		m.bingo_default_tile_16(),
		m.bingo_default_tile_17(),
		m.bingo_default_tile_18(),
		m.bingo_default_tile_19(),
		m.bingo_default_tile_20()
	];
}
