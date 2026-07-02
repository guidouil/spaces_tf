import { describe, expect, it } from 'vitest';
import {
	CONSENSUS_MAJORITY_SCORE,
	CONSENSUS_TIE_SCORE,
	isValidConsensusChoiceIndex,
	resolveConsensusResult
} from './consensus';

describe('consensus rules', () => {
	it('accepts only two choice indexes', () => {
		expect(isValidConsensusChoiceIndex(0)).toBe(true);
		expect(isValidConsensusChoiceIndex(1)).toBe(true);
		expect(isValidConsensusChoiceIndex(2)).toBe(false);
		expect(isValidConsensusChoiceIndex(-1)).toBe(false);
	});

	it('scores the majority side', () => {
		const result = resolveConsensusResult([0, 0, 1]);

		expect(result.status).toBe('majority');
		expect(result.majorityChoiceIndex).toBe(0);
		expect(result.scoreForChoice[0]).toBe(CONSENSUS_MAJORITY_SCORE);
		expect(result.scoreForChoice[1]).toBe(0);
	});

	it('scores everyone on a perfect tie', () => {
		const result = resolveConsensusResult([0, 1]);

		expect(result.status).toBe('tie');
		expect(result.majorityChoiceIndex).toBe(null);
		expect(result.scoreForChoice[0]).toBe(CONSENSUS_TIE_SCORE);
		expect(result.scoreForChoice[1]).toBe(CONSENSUS_TIE_SCORE);
	});

	it('does not score an empty round', () => {
		const result = resolveConsensusResult([]);

		expect(result.status).toBe('none');
		expect(result.majorityChoiceIndex).toBe(null);
		expect(result.scoreForChoice[0]).toBe(0);
		expect(result.scoreForChoice[1]).toBe(0);
	});
});
