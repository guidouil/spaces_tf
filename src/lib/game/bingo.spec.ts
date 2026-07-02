import { describe, expect, it } from 'vitest';
import {
	BINGO_CARD_CELL_COUNT,
	generateBingoCard,
	getCompletedBingoLines,
	isValidBingoLine,
	resolveBingoClaimStatus,
	type BingoCardCell
} from './bingo';

const tiles = Array.from({ length: 20 }, (_, index) => ({
	id: index + 1,
	text: `Tile ${index + 1}`
}));

describe('bingo rules', () => {
	it('generates a 4x4 card without duplicate tiles', () => {
		const card = generateBingoCard(tiles);
		const tileIds = card.map((cell) => cell.tileId);

		expect(card).toHaveLength(BINGO_CARD_CELL_COUNT);
		expect(new Set(tileIds).size).toBe(BINGO_CARD_CELL_COUNT);
		expect(card.every((cell) => cell.checked === false)).toBe(true);
	});

	it('detects completed rows, columns, and diagonals', () => {
		const rowCard = makeCard([0, 1, 2, 3]);
		const columnCard = makeCard([1, 5, 9, 13]);
		const diagonalCard = makeCard([0, 5, 10, 15]);

		expect(getCompletedBingoLines(rowCard)).toContainEqual([0, 1, 2, 3]);
		expect(getCompletedBingoLines(columnCard)).toContainEqual([1, 5, 9, 13]);
		expect(getCompletedBingoLines(diagonalCard)).toContainEqual([0, 5, 10, 15]);
	});

	it('rejects a Bingo claim when the submitted line is not complete', () => {
		const card = makeCard([0, 1, 2]);

		expect(isValidBingoLine(card, [0, 1, 2, 3])).toBe(false);
	});

	it('resolves only pending Bingo claims', () => {
		expect(resolveBingoClaimStatus('pending', 'approved')).toBe('approved');
		expect(resolveBingoClaimStatus('pending', 'rejected')).toBe('rejected');
		expect(() => resolveBingoClaimStatus('approved', 'rejected')).toThrow();
	});
});

function makeCard(checkedIndexes: number[]): BingoCardCell[] {
	const checked = new Set(checkedIndexes);

	return Array.from({ length: BINGO_CARD_CELL_COUNT }, (_, index) => ({
		tileId: index + 1,
		text: `Tile ${index + 1}`,
		checked: checked.has(index)
	}));
}
