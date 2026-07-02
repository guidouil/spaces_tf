import {
	boolean,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	gameType: text('game_type').notNull().default('quiz'),
	status: text('status').notNull().default('waiting'),
	hostToken: text('host_token').notNull(),
	activeQuestionId: integer('active_question_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const players = pgTable(
	'players',
	{
		id: serial('id').primaryKey(),
		roomId: integer('room_id')
			.notNull()
			.references(() => rooms.id, { onDelete: 'cascade' }),
		nickname: text('nickname').notNull(),
		score: integer('score').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('players_room_nickname_idx').on(table.roomId, table.nickname)]
);

export const questions = pgTable('questions', {
	id: serial('id').primaryKey(),
	roomId: integer('room_id')
		.notNull()
		.references(() => rooms.id, { onDelete: 'cascade' }),
	text: text('text').notNull(),
	choices: jsonb('choices').$type<string[]>().notNull(),
	correctChoiceIndex: integer('correct_choice_index').notNull(),
	status: text('status').notNull().default('draft'),
	startedAt: timestamp('started_at', { withTimezone: true }),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const answers = pgTable(
	'answers',
	{
		id: serial('id').primaryKey(),
		questionId: integer('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		playerId: integer('player_id')
			.notNull()
			.references(() => players.id, { onDelete: 'cascade' }),
		choiceIndex: integer('choice_index').notNull(),
		isCorrect: boolean('is_correct').notNull(),
		scoreDelta: integer('score_delta').notNull(),
		answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('answers_question_player_idx').on(table.questionId, table.playerId)]
);

export const bingoTiles = pgTable('bingo_tiles', {
	id: serial('id').primaryKey(),
	roomId: integer('room_id')
		.notNull()
		.references(() => rooms.id, { onDelete: 'cascade' }),
	text: text('text').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const bingoCards = pgTable(
	'bingo_cards',
	{
		id: serial('id').primaryKey(),
		roomId: integer('room_id')
			.notNull()
			.references(() => rooms.id, { onDelete: 'cascade' }),
		playerId: integer('player_id')
			.notNull()
			.references(() => players.id, { onDelete: 'cascade' }),
		cells: jsonb('cells')
			.$type<Array<{ tileId: number; text: string; checked: boolean }>>()
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('bingo_cards_player_idx').on(table.roomId, table.playerId)]
);

export const bingoClaims = pgTable('bingo_claims', {
	id: serial('id').primaryKey(),
	roomId: integer('room_id')
		.notNull()
		.references(() => rooms.id, { onDelete: 'cascade' }),
	playerId: integer('player_id')
		.notNull()
		.references(() => players.id, { onDelete: 'cascade' }),
	line: jsonb('line').$type<number[]>().notNull(),
	status: text('status').notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	decidedAt: timestamp('decided_at', { withTimezone: true })
});

export * from './auth.schema';
