export const CONSENSUS_CHOICE_COUNT = 2;
export const CONSENSUS_MAJORITY_SCORE = 100;
export const CONSENSUS_TIE_SCORE = 50;
export const CONSENSUS_ROUND_SECONDS = 30;

export type ConsensusChoiceIndex = 0 | 1;

export type ConsensusVoteCount = {
	choiceIndex: ConsensusChoiceIndex;
	count: number;
};

export type ConsensusResult = {
	status: 'majority' | 'tie' | 'none';
	majorityChoiceIndex: ConsensusChoiceIndex | null;
	scoreForChoice: Record<ConsensusChoiceIndex, number>;
	voteCounts: [ConsensusVoteCount, ConsensusVoteCount];
	totalVotes: number;
};

export function isValidConsensusChoiceIndex(value: number): value is ConsensusChoiceIndex {
	return Number.isInteger(value) && value >= 0 && value < CONSENSUS_CHOICE_COUNT;
}

export function isConsensusRoundExpired(startedAt: Date | null, now = new Date()) {
	if (!startedAt) return false;
	return now.getTime() - startedAt.getTime() >= CONSENSUS_ROUND_SECONDS * 1000;
}

export function resolveConsensusResult(choiceIndexes: number[]): ConsensusResult {
	const countA = choiceIndexes.filter((choiceIndex) => choiceIndex === 0).length;
	const countB = choiceIndexes.filter((choiceIndex) => choiceIndex === 1).length;
	const totalVotes = countA + countB;
	const voteCounts: [ConsensusVoteCount, ConsensusVoteCount] = [
		{ choiceIndex: 0, count: countA },
		{ choiceIndex: 1, count: countB }
	];

	if (totalVotes === 0) {
		return {
			status: 'none',
			majorityChoiceIndex: null,
			scoreForChoice: { 0: 0, 1: 0 },
			voteCounts,
			totalVotes
		};
	}

	if (countA === countB) {
		return {
			status: 'tie',
			majorityChoiceIndex: null,
			scoreForChoice: { 0: CONSENSUS_TIE_SCORE, 1: CONSENSUS_TIE_SCORE },
			voteCounts,
			totalVotes
		};
	}

	const majorityChoiceIndex = countA > countB ? 0 : 1;

	return {
		status: 'majority',
		majorityChoiceIndex,
		scoreForChoice: {
			0: majorityChoiceIndex === 0 ? CONSENSUS_MAJORITY_SCORE : 0,
			1: majorityChoiceIndex === 1 ? CONSENSUS_MAJORITY_SCORE : 0
		},
		voteCounts,
		totalVotes
	};
}
