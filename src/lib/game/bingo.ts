export const BINGO_SIZE = 4;
export const BINGO_CARD_CELL_COUNT = BINGO_SIZE * BINGO_SIZE;

export type BingoCardCell = {
	tileId: number;
	text: string;
	checked: boolean;
};

export type BingoTileInput = {
	id: number;
	text: string;
};

export type BingoClaimStatus = 'pending' | 'approved' | 'rejected';

export function generateBingoCard(tiles: BingoTileInput[], size = BINGO_SIZE): BingoCardCell[] {
	const cellCount = size * size;
	if (tiles.length < cellCount) {
		throw new Error(`Bingo needs at least ${cellCount} tiles.`);
	}

	return shuffle(tiles)
		.slice(0, cellCount)
		.map((tile) => ({
			tileId: tile.id,
			text: tile.text,
			checked: false
		}));
}

export function toggleBingoCell(cells: BingoCardCell[], tileId: number) {
	return cells.map((cell) => (cell.tileId === tileId ? { ...cell, checked: !cell.checked } : cell));
}

export function getCompletedBingoLines(cells: BingoCardCell[], size = BINGO_SIZE) {
	const checkedIndexes = new Set(cells.flatMap((cell, index) => (cell.checked ? [index] : [])));

	return getBingoLines(size).filter((line) => line.every((index) => checkedIndexes.has(index)));
}

export function hasCompletedBingoLine(cells: BingoCardCell[], size = BINGO_SIZE) {
	return getCompletedBingoLines(cells, size).length > 0;
}

export function isValidBingoLine(cells: BingoCardCell[], line: number[], size = BINGO_SIZE) {
	if (cells.length !== size * size) return false;
	const normalizedLine = [...line].sort((a, b) => a - b).join(',');

	return getCompletedBingoLines(cells, size).some(
		(completedLine) => [...completedLine].sort((a, b) => a - b).join(',') === normalizedLine
	);
}

export function resolveBingoClaimStatus(
	currentStatus: BingoClaimStatus,
	decision: Exclude<BingoClaimStatus, 'pending'>
) {
	if (currentStatus !== 'pending') {
		throw new Error('Only pending Bingo claims can be resolved.');
	}

	return decision;
}

export function getBingoLines(size = BINGO_SIZE) {
	const lines: number[][] = [];

	for (let row = 0; row < size; row += 1) {
		lines.push(Array.from({ length: size }, (_, column) => row * size + column));
	}

	for (let column = 0; column < size; column += 1) {
		lines.push(Array.from({ length: size }, (_, row) => row * size + column));
	}

	lines.push(Array.from({ length: size }, (_, index) => index * size + index));
	lines.push(Array.from({ length: size }, (_, index) => index * size + (size - 1 - index)));

	return lines;
}

function shuffle<T>(values: T[]) {
	const shuffled = [...values];

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const target = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
	}

	return shuffled;
}
